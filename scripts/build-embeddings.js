#!/usr/bin/env node
/**
 * scripts/build-embeddings.js — v4.4 Rich Embedding Input Layer.
 *
 * Rakentaa embedding-cachen incremental:isti fingerprint-hashilla.
 * Yhdenmukainen nykyisten `.cache/api-fallback/*.json`-cachetiedostojen
 * kanssa (savedAt-ISO + data-payload). Ollama pysyy paikallisena
 * kehitys/build-time-työkaluna.
 *
 * KÄYTTÖ:
 *   npm run build:no-og                # tarvitaan ensin (_site/data/*.json)
 *   node scripts/build-embeddings.js               # oletusmalli bge-m3
 *   node scripts/build-embeddings.js --model=bge-m3
 *   node scripts/build-embeddings.js --model=embeddinggemma
 *   node scripts/build-embeddings.js --dry-run     # ei kutsu Ollamaa, näyttää mitä laskettaisi
 *
 * ENNAKKOVAATIMUKSET:
 *   - Ollama käynnissä http://localhost:11434
 *   - ollama pull bge-m3
 *   - _site/data/content.json + _site/data/theses.json ajan tasalla
 *
 * INCREMENTAL: cache-fingerprint sha1(inputText + version + strategy).
 *   Jos input muuttumaton → käytä olemassa oleva embedding.
 *   Malli-vaihto → uusi cache-tiedosto (embeddings-<model>-v1.json).
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const {
  buildEmbeddingInput,
  fingerprint,
  INPUT_STRATEGY_VERSION
} = require("../src/_utils/buildEmbeddingInput");

const ROOT = path.resolve(__dirname, "..");

// -----------------------------------------------------------------------------
// CLI options
// -----------------------------------------------------------------------------

const argModel = (process.argv.find((a) => a.startsWith("--model=")) || "").split("=")[1];
const MODEL = argModel || "bge-m3";
const DRY_RUN = process.argv.includes("--dry-run");
const CACHE_FILE = path.join(ROOT, ".cache", "api-fallback", `embeddings-${MODEL}-v1.json`);

// -----------------------------------------------------------------------------
// Load candidate pool
// -----------------------------------------------------------------------------

const CONTENT_JSON = path.join(ROOT, "_site", "data", "content.json");
const THESES_JSON = path.join(ROOT, "_site", "data", "theses.json");
if (!fs.existsSync(CONTENT_JSON) || !fs.existsSync(THESES_JSON)) {
  console.error(`[build-embeddings] Puuttuu ${CONTENT_JSON} tai ${THESES_JSON}. Aja ensin: npm run build:no-og`);
  process.exit(1);
}
const content = JSON.parse(fs.readFileSync(CONTENT_JSON, "utf8"));
const theses = JSON.parse(fs.readFileSync(THESES_JSON, "utf8"));
const pool = [...content.items, ...theses.items];

// -----------------------------------------------------------------------------
// Rich source discovery
// -----------------------------------------------------------------------------

/**
 * SlideShare transcript: slideshare-content.json + frontmatter-URL:n
 * numerotunniste (esim. /slideshow/xxx/135625316).
 */
function loadSlideshareTranscriptMap() {
  const map = new Map();
  const ssPath = path.join(ROOT, "slideshare-content.json");
  const presDir = path.join(ROOT, "src", "presentations");
  if (!fs.existsSync(ssPath) || !fs.existsSync(presDir)) return map;

  const ss = JSON.parse(fs.readFileSync(ssPath, "utf8"));
  const ssById = new Map();
  ss.forEach((c) => {
    const m = c.url && c.url.match(/\/(\d+)(?:\/|$)/);
    if (m) ssById.set(m[1], c);
  });

  fs.readdirSync(presDir).filter((f) => f.endsWith(".md")).forEach((fn) => {
    const raw = fs.readFileSync(path.join(presDir, fn), "utf8");
    const urlMatch = raw.match(/^url:\s*['"]?([^'"\n]+)/m);
    if (!urlMatch) return;
    const idMatch = urlMatch[1].match(/\/(\d+)(?:\/|$)/);
    if (!idMatch || !ssById.has(idMatch[1])) return;
    const slug = fn.replace(/\.md$/, "");
    map.set(`/presentations/${slug}/`, ssById.get(idMatch[1]));
  });
  return map;
}

/**
 * Markdown-body: yhdistä content.url → markdown-lähdehakemistoihin.
 *
 * Käytetyt permalink-kaavat:
 *   - src/blog:         /YYYY/MM/DD/slug/ (11tydata permalink)
 *   - src/publications: /YYYY/MM/DD/slug/ (11tydata permalink)
 *   - src/politics:     eksplisiittinen permalink frontmatterissa
 *   - src/media:        /mediassa/slug/  (11tydata permalink)
 */
function loadMarkdownBodyMap() {
  const map = new Map();
  const bodyDirs = [
    { dir: "src/blog", urlBuilder: makeDateBasedUrlBuilder() },
    { dir: "src/publications", urlBuilder: makeDateBasedUrlBuilder() },
    { dir: "src/politics", urlBuilder: makePoliticsUrlBuilder() },
    { dir: "src/media", urlBuilder: makeMediaUrlBuilder() }
  ];
  bodyDirs.forEach(({ dir, urlBuilder }) => {
    const full = path.join(ROOT, dir);
    if (!fs.existsSync(full)) return;
    fs.readdirSync(full).filter((f) => f.endsWith(".md")).forEach((fn) => {
      const raw = fs.readFileSync(path.join(full, fn), "utf8");
      const parts = raw.split(/^---\s*$/m);
      if (parts.length < 3) return;
      const frontmatter = parts[1];
      const body = parts.slice(2).join("---").trim();
      if (body.length < 200) return;

      // Eksplisiittinen permalink (esim. politics)
      const permalinkMatch = frontmatter.match(/^permalink:\s*['"]?([^'"\n]+)/m);
      const dateMatch = frontmatter.match(/^date:\s*(\d{4})-(\d{2})-(\d{2})/m);
      const slug = fn.replace(/\.md$/, "");

      let url = null;
      if (permalinkMatch) url = permalinkMatch[1];
      else url = urlBuilder({ slug, dateMatch });

      if (url) map.set(url, body);
    });
  });
  return map;
}

function makeDateBasedUrlBuilder() {
  return ({ slug, dateMatch }) => {
    if (!dateMatch) return `/${slug}/`;
    return `/${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}/${slug}/`;
  };
}
function makeMediaUrlBuilder() {
  return ({ slug, dateMatch }) => {
    if (!dateMatch) return `/mediassa/${slug}/`;
    return `/mediassa/${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}/${slug}/`;
  };
}
function makePoliticsUrlBuilder() {
  return ({ slug }) => `/politiikka/${slug}/`;
}

// -----------------------------------------------------------------------------
// Ollama embedding
// -----------------------------------------------------------------------------

function ollamaEmbed(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, prompt: text });
    const req = http.request({
      hostname: "localhost", port: 11434, path: "/api/embeddings", method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      timeout: 60000
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.embedding) resolve(parsed.embedding);
          else reject(new Error("No embedding: " + data.substring(0, 200)));
        } catch (e) { reject(e); }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("Timeout")); });
    req.write(body);
    req.end();
  });
}

// -----------------------------------------------------------------------------
// Load existing cache (yhdenmukainen _apiCache.js:n kanssa)
// -----------------------------------------------------------------------------

function loadCache() {
  if (!fs.existsSync(CACHE_FILE)) return null;
  try {
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.data) return null;
    return parsed.data;
  } catch (e) {
    console.warn(`[build-embeddings] Cache-lukuvirhe: ${e.message}. Aloitetaan tyhjältä.`);
    return null;
  }
}

function saveCache(data) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  const payload = { savedAt: new Date().toISOString(), data };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(payload, null, 2), "utf8");
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

(async () => {
  console.log(`[build-embeddings] malli=${MODEL} strategy-version=${INPUT_STRATEGY_VERSION}${DRY_RUN ? " (DRY-RUN)" : ""}`);
  console.log(`  cache-tiedosto: ${path.relative(ROOT, CACHE_FILE)}`);

  const richSources = {
    transcriptByUrl: loadSlideshareTranscriptMap(),
    markdownBodyByUrl: loadMarkdownBodyMap()
  };
  console.log(`  rich sources: ${richSources.transcriptByUrl.size} transcript, ${richSources.markdownBodyByUrl.size} markdown-body`);
  console.log(`  candidate pool: ${pool.length} itemiä (${content.items.length} content + ${theses.items.length} theses)`);

  const existing = loadCache() || { model: MODEL, strategyVersion: INPUT_STRATEGY_VERSION, embeddings: {} };

  // Malli-vaihto → aloitetaan tyhjältä (uusi cache-tiedosto joka tapauksessa)
  if (existing.model && existing.model !== MODEL) {
    console.log(`  ⚠ malli vaihtui (${existing.model} → ${MODEL}), aloitetaan tyhjältä`);
    existing.embeddings = {};
    existing.model = MODEL;
  }

  const cacheEmbeddings = { ...existing.embeddings };
  const stats = { hits: 0, computed: 0, skipped: 0, failed: 0, sourceCounts: {} };
  const t0 = Date.now();

  for (let i = 0; i < pool.length; i++) {
    const item = pool[i];
    if (!item.url) { stats.skipped++; continue; }

    const input = buildEmbeddingInput(item, richSources);
    if (!input.text || input.text.length < 20) {
      stats.skipped++;
      continue;
    }

    // Track source-jakauma
    const sourceKey = input.sources.slice(-1)[0] || "none";
    stats.sourceCounts[sourceKey] = (stats.sourceCounts[sourceKey] || 0) + 1;

    const fp = fingerprint(input);
    const cached = cacheEmbeddings[item.url];

    if (cached && cached.inputHash === fp && cached.model === MODEL) {
      stats.hits++;
      continue;
    }

    if (DRY_RUN) {
      stats.computed++;
      continue;
    }

    try {
      const vector = await ollamaEmbed(input.text);
      cacheEmbeddings[item.url] = {
        url: item.url,
        contentType: input.contentType,
        model: MODEL,
        strategyVersion: input.version,
        inputHash: fp,
        inputSources: input.sources,
        inputChars: input.chars,
        inputTruncated: input.truncated,
        vector
      };
      stats.computed++;
    } catch (e) {
      console.warn(`  ✗ ${item.url}: ${e.message}`);
      stats.failed++;
    }

    if ((i + 1) % 50 === 0) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
      console.log(`  ${i + 1}/${pool.length} (${elapsed}s, hits=${stats.hits}, computed=${stats.computed}, failed=${stats.failed})`);
    }
  }

  // Poista cachesta itemit joita ei enää ole poolissa (obsolete cleanup)
  const poolUrls = new Set(pool.map((i) => i.url));
  let removed = 0;
  Object.keys(cacheEmbeddings).forEach((url) => {
    if (!poolUrls.has(url)) { delete cacheEmbeddings[url]; removed++; }
  });
  if (removed) console.log(`  cleanup: poistettu ${removed} vanhentunutta embedding:iä cachesta`);

  console.log("\n[build-embeddings] valmis:");
  console.log(`  cache hits:  ${stats.hits}`);
  console.log(`  computed:    ${stats.computed}`);
  console.log(`  skipped:     ${stats.skipped}`);
  console.log(`  failed:      ${stats.failed}`);
  console.log(`  yhteensä:    ${Object.keys(cacheEmbeddings).length} embedding:iä`);
  console.log(`  aika:        ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`  input source -jakauma (viimeinen source per item):`);
  Object.entries(stats.sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`    ${s.padEnd(22)} ${c}`));

  if (!DRY_RUN) {
    saveCache({
      model: MODEL,
      strategyVersion: INPUT_STRATEGY_VERSION,
      generatedAt: new Date().toISOString(),
      totalItems: Object.keys(cacheEmbeddings).length,
      inputStats: stats.sourceCounts,
      embeddings: cacheEmbeddings
    });
    const bytes = fs.statSync(CACHE_FILE).size;
    console.log(`\n  tallennettu: ${path.relative(ROOT, CACHE_FILE)} (${(bytes / 1024 / 1024).toFixed(1)} MB)`);
  } else {
    console.log("\n  DRY-RUN: cache ei tallennettu.");
  }
})();

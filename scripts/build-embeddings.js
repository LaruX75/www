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

// Cache-formaatti (Float32 binary + JSON metadata, käyttäjän hyväksyntä 2026-08-10):
//   <base>.meta.json → header + per-item metadata + offset
//   <base>.f32       → Float32 binary, itemien vektorit peräkkäin, dimensions = 1024
const CACHE_BASE = path.join(ROOT, ".cache", "api-fallback", `embeddings-${MODEL}-v1`);
const CACHE_META = `${CACHE_BASE}.meta.json`;
const CACHE_F32 = `${CACHE_BASE}.f32`;
// Legacy: aiempi yhdistetty JSON-cache (v1 alkuperäinen, ~19 MB).
// Poistetaan jos olemassa, jotta uusi Float32-cache korvaa sen.
const LEGACY_JSON = `${CACHE_BASE}.json`;

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
/**
 * Canva rich data: yhdistä content.url (/presentations/{slug}/) →
 * { richSummary, themes, lang } canva-presentations-rich.json:sta.
 *
 * Mapping-lähde: data/canva/content-slug-to-designid.json (11/15 Canva-
 * linkitettyä sivustopresentation-recordia mätsätty Claude-avusteisesti,
 * scripts/canva/05-map-content-slugs.mjs). Loput 4 saavat fallback:in.
 */
function loadCanvaRichMap() {
  const map = new Map();
  const slugMapPath = path.join(ROOT, "data", "canva", "content-slug-to-designid.json");
  const richPath = path.join(ROOT, "src", "_data", "canva-presentations-rich.json");
  if (!fs.existsSync(slugMapPath) || !fs.existsSync(richPath)) return map;

  const slugMap = JSON.parse(fs.readFileSync(slugMapPath, "utf8"));
  const rich = JSON.parse(fs.readFileSync(richPath, "utf8"));
  const richByDesignId = new Map(rich.items.map((r) => [r.designId, r]));

  for (const [contentUrl, entry] of Object.entries(slugMap)) {
    if (!entry || !entry.designId) continue;
    const r = richByDesignId.get(entry.designId);
    if (!r || r.confidence === "low") continue;
    map.set(contentUrl, {
      richSummary: r.richSummary || "",
      themes: Array.isArray(r.themes) ? r.themes : [],
      lang: r.lang || null
    });
  }
  return map;
}

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
      const dateMatch = frontmatter.match(/^date:\s*['"]?(\d{4})-(\d{2})-(\d{2})/m);
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
// Cache: Float32 binary + JSON metadata
// -----------------------------------------------------------------------------
//
// Rakenne:
//   .meta.json:
//     {
//       model, dimensions, strategyVersion, truncationVersion, maxChars,
//       savedAt, totalItems, inputStats,
//       items: [{ url, contentType, inputHash, inputSources, inputChars, inputTruncated, offset }]
//     }
//   .f32:
//     Float32 binary, items.length × dimensions × 4 tavua peräkkäin.
//     items[i].offset = i (redundantti, mutta helppo lukea).

/**
 * writeF32Cache — kirjoita metadata + binary.
 * items on Map<url, { contentType, inputHash, inputSources, inputChars, inputTruncated, vector }>.
 */
function writeF32Cache({ model, dimensions, strategyVersion, truncationVersion, maxChars, inputStats, items }) {
  fs.mkdirSync(path.dirname(CACHE_META), { recursive: true });

  const urls = Array.from(items.keys()).sort(); // deterministinen järjestys
  const buf = Buffer.alloc(urls.length * dimensions * 4);
  const metaItems = urls.map((url, i) => {
    const item = items.get(url);
    for (let j = 0; j < dimensions; j++) {
      buf.writeFloatLE(item.vector[j], (i * dimensions + j) * 4);
    }
    return {
      url,
      contentType: item.contentType,
      inputHash: item.inputHash,
      inputSources: item.inputSources,
      inputChars: item.inputChars,
      inputTruncated: item.inputTruncated,
      offset: i
    };
  });

  const meta = {
    model,
    dimensions,
    strategyVersion,
    truncationVersion,
    maxChars,
    savedAt: new Date().toISOString(),
    totalItems: urls.length,
    inputStats,
    items: metaItems
  };

  fs.writeFileSync(CACHE_META, JSON.stringify(meta, null, 2), "utf8");
  fs.writeFileSync(CACHE_F32, buf);
}

/**
 * readF32Cache — lue metadata + binary. Palauttaa null jos cache ei löydy.
 * Header-tarkistus (model, dimensions, strategyVersion, maxChars) tehdään
 * kutsujassa (main).
 */
function readF32Cache() {
  if (!fs.existsSync(CACHE_META) || !fs.existsSync(CACHE_F32)) return null;
  try {
    const meta = JSON.parse(fs.readFileSync(CACHE_META, "utf8"));
    const buf = fs.readFileSync(CACHE_F32);
    const dimensions = meta.dimensions;
    // Rakennetaan Map<url, { ..., vector: Float32Array }>
    const items = new Map();
    (meta.items || []).forEach((it) => {
      const start = it.offset * dimensions * 4;
      const vec = new Float32Array(dimensions);
      for (let j = 0; j < dimensions; j++) {
        vec[j] = buf.readFloatLE(start + j * 4);
      }
      items.set(it.url, {
        contentType: it.contentType,
        inputHash: it.inputHash,
        inputSources: it.inputSources,
        inputChars: it.inputChars,
        inputTruncated: it.inputTruncated,
        vector: vec
      });
    });
    return { meta, items };
  } catch (e) {
    console.warn(`[build-embeddings] Cache-lukuvirhe: ${e.message}. Aloitetaan tyhjältä.`);
    return null;
  }
}

/**
 * Poista legacy 19 MB JSON-cache jos on olemassa.
 * Yksi kertaluonteinen migraatio.
 */
function removeLegacyCache() {
  if (fs.existsSync(LEGACY_JSON)) {
    fs.unlinkSync(LEGACY_JSON);
    console.log(`  ⚠ poistettu legacy: ${path.relative(ROOT, LEGACY_JSON)}`);
  }
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

// Truncation-strategian versio. Nostetaan jos truncation-logiikka muuttuu
// tavalla joka vaikuttaa jo laskettuihin embeddingeihin.
const TRUNCATION_VERSION = "head-v1";
const MAX_CHARS = 6000;
const DIMENSIONS = 1024; // BGE-M3

(async () => {
  console.log(`[build-embeddings] malli=${MODEL} strategy-version=${INPUT_STRATEGY_VERSION}${DRY_RUN ? " (DRY-RUN)" : ""}`);
  console.log(`  cache: ${path.relative(ROOT, CACHE_META)} + ${path.relative(ROOT, CACHE_F32)}`);

  removeLegacyCache();

  const richSources = {
    transcriptByUrl: loadSlideshareTranscriptMap(),
    markdownBodyByUrl: loadMarkdownBodyMap(),
    canvaRichByUrl: loadCanvaRichMap()
  };
  console.log(`  rich sources: ${richSources.transcriptByUrl.size} transcript, ${richSources.markdownBodyByUrl.size} markdown-body, ${richSources.canvaRichByUrl.size} canva-rich`);
  console.log(`  candidate pool: ${pool.length} itemiä (${content.items.length} content + ${theses.items.length} theses)`);

  // Lue nykyinen cache. Header-tarkistus invalidoi koko cachen jos malli,
  // strategyVersion, truncationVersion tai maxChars eivät täsmää.
  let existingItems = new Map();
  const existing = readF32Cache();
  if (existing) {
    const h = existing.meta;
    const invalidReason =
      h.model !== MODEL ? `model (${h.model} → ${MODEL})`
      : h.strategyVersion !== INPUT_STRATEGY_VERSION ? `strategyVersion (${h.strategyVersion} → ${INPUT_STRATEGY_VERSION})`
      : h.truncationVersion !== TRUNCATION_VERSION ? `truncationVersion (${h.truncationVersion} → ${TRUNCATION_VERSION})`
      : h.maxChars !== MAX_CHARS ? `maxChars (${h.maxChars} → ${MAX_CHARS})`
      : h.dimensions !== DIMENSIONS ? `dimensions (${h.dimensions} → ${DIMENSIONS})`
      : null;
    if (invalidReason) {
      console.log(`  ⚠ header-invalidation: ${invalidReason}, aloitetaan tyhjältä`);
    } else {
      existingItems = existing.items;
      console.log(`  loaded: ${existingItems.size} embedding:iä cache:sta`);
    }
  }

  const items = new Map(); // url → { contentType, inputHash, inputSources, inputChars, inputTruncated, vector }
  const stats = { hits: 0, computed: 0, skipped: 0, failed: 0, sourceCounts: {} };
  const t0 = Date.now();

  for (let i = 0; i < pool.length; i++) {
    const item = pool[i];
    if (!item.url) { stats.skipped++; continue; }

    const input = buildEmbeddingInput(item, richSources, { maxChars: MAX_CHARS });
    if (!input.text || input.text.length < 20) {
      stats.skipped++;
      continue;
    }

    // Track source-jakauma (viimeinen source per item = rikkain saatavilla oleva)
    const sourceKey = input.sources.slice(-1)[0] || "none";
    stats.sourceCounts[sourceKey] = (stats.sourceCounts[sourceKey] || 0) + 1;

    const fp = fingerprint(input);
    const cached = existingItems.get(item.url);

    if (cached && cached.inputHash === fp) {
      // Cache hit — käytetään olemassa oleva vektori.
      items.set(item.url, {
        contentType: input.contentType,
        inputHash: fp,
        inputSources: input.sources,
        inputChars: input.chars,
        inputTruncated: input.truncated,
        vector: cached.vector
      });
      stats.hits++;
      continue;
    }

    if (DRY_RUN) {
      stats.computed++;
      continue;
    }

    try {
      const vector = await ollamaEmbed(input.text);
      items.set(item.url, {
        contentType: input.contentType,
        inputHash: fp,
        inputSources: input.sources,
        inputChars: input.chars,
        inputTruncated: input.truncated,
        vector
      });
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

  console.log("\n[build-embeddings] valmis:");
  console.log(`  cache hits:  ${stats.hits}`);
  console.log(`  computed:    ${stats.computed}`);
  console.log(`  skipped:     ${stats.skipped}`);
  console.log(`  failed:      ${stats.failed}`);
  console.log(`  yhteensä:    ${items.size} embedding:iä`);
  console.log(`  aika:        ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`  input source -jakauma (viimeinen source per item):`);
  Object.entries(stats.sourceCounts).sort((a, b) => b[1] - a[1]).forEach(([s, c]) => console.log(`    ${s.padEnd(22)} ${c}`));

  if (!DRY_RUN) {
    writeF32Cache({
      model: MODEL,
      dimensions: DIMENSIONS,
      strategyVersion: INPUT_STRATEGY_VERSION,
      truncationVersion: TRUNCATION_VERSION,
      maxChars: MAX_CHARS,
      inputStats: stats.sourceCounts,
      items
    });
    const metaBytes = fs.statSync(CACHE_META).size;
    const f32Bytes = fs.statSync(CACHE_F32).size;
    console.log(`\n  tallennettu:`);
    console.log(`    ${path.relative(ROOT, CACHE_META)}  (${(metaBytes / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`    ${path.relative(ROOT, CACHE_F32)}   (${(f32Bytes / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`    yhteensä ${((metaBytes + f32Bytes) / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log("\n  DRY-RUN: cache ei tallennettu.");
  }
})();

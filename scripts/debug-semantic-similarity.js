#!/usr/bin/env node
/**
 * v4.4 Semantic Experiment — pilot-scripti.
 *
 * Tutkimuskysymys:
 *   Löytääkö embedding-pohjainen semantic similarity relevantteja
 *   sisältösuhteita, joita nykyinen metadata-scoring ei löydä?
 *
 * Ei tuotanto-ominaisuus. Ei muutoksia app-koodiin. Vain analyysi.
 *
 * Aineisto:
 *   - Candidate pool: kaikki 634 itemiä (/data/content.json + /data/theses.json)
 *   - Anchor otos: 15 itemiä eri sisältötyypeistä (ml. 5 thesis)
 *
 * Embedding-input:
 *   title + "\n" + description (ei metadataa, jotta testataan tekstin sisältöä)
 *
 * Mallit:
 *   Ollama: bge-m3 (1024-dim) ja embeddinggemma (768-dim)
 *
 * Metriikat per anchor:
 *   - Metadata top-5 (kopio relatedContent-logiikasta)
 *   - Semantic top-5 (cosine similarity)
 *   - Overlap@5: leikkaus (URL-tasolla)
 *   - Relevant novel@5: käyttäjän käsintarkastuksen jälkeen
 *   - Same-type % vs. cross-type %
 *
 * Aja:
 *   node scripts/debug-semantic-similarity.js [--model=bge-m3|embeddinggemma]
 *
 * Ennakkovaatimukset:
 *   - Ollama käynnissä http://localhost:11434
 *   - ollama pull bge-m3
 *   - ollama pull embeddinggemma
 *   - npm run build:no-og (jotta _site/data/*.json on ajan tasalla)
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

// -----------------------------------------------------------------------------
// Config
// -----------------------------------------------------------------------------

const OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "bge-m3";
const TOP_N = 5;

const modelArg = process.argv.find((a) => a.startsWith("--model="));
const MODEL = modelArg ? modelArg.split("=")[1] : DEFAULT_MODEL;

// -----------------------------------------------------------------------------
// Data-lataus: kaikki 634 itemiä candidate-pooliin
// -----------------------------------------------------------------------------

function loadCandidatePool() {
  const contentPath = path.join(__dirname, "..", "_site", "data", "content.json");
  const thesesPath = path.join(__dirname, "..", "_site", "data", "theses.json");
  if (!fs.existsSync(contentPath) || !fs.existsSync(thesesPath)) {
    console.error("Build required first: npm run build:no-og");
    process.exit(1);
  }
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));
  const theses = JSON.parse(fs.readFileSync(thesesPath, "utf8"));
  return [...content.items, ...theses.items];
}

// -----------------------------------------------------------------------------
// Otos: 15 anchor-itemiä eri sisältötyypeistä
// -----------------------------------------------------------------------------

function selectAnchors(pool) {
  // Määritä anchor-tyypit ja määrät
  const anchorConfig = [
    { contentType: "blogPost", count: 2 },
    { contentType: "opinion", count: 2 },
    { contentType: "presentation", count: 2 },
    { contentType: "mediaItem", count: 2 },
    { contentType: "speech", count: 2 }
    // thesis-anchorit lisätään erikseen
  ];
  const anchors = [];
  anchorConfig.forEach(({ contentType, count }) => {
    const items = pool.filter((i) => i.contentType === contentType)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    // Ota uusinta + eri teemoista (yksinkertainen: uusimmat)
    items.slice(0, count).forEach((i) => anchors.push(i));
  });
  // Thesis-anchorit: 5 kpl, sekoitus (ml. joku jossa on description)
  const theses = pool.filter((i) => i.contentType === "thesis");
  const thesesWithDesc = theses.filter((i) => i.description && i.description.length > 100);
  const thesesNoDesc = theses.filter((i) => !i.description || i.description.length < 100);
  // 3 kpl thesikseia joissa on description + 2 kpl ilman
  thesesWithDesc.slice(0, 3).forEach((i) => anchors.push(i));
  thesesNoDesc.slice(0, 2).forEach((i) => anchors.push(i));
  return anchors;
}

// -----------------------------------------------------------------------------
// Ollama-embedding-kutsu (HTTP)
// -----------------------------------------------------------------------------

function ollamaEmbed(model, text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model, prompt: text });
    const req = http.request({
      hostname: "localhost",
      port: 11434,
      path: "/api/embeddings",
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      timeout: 60000
    }, (res) => {
      let data = "";
      res.on("data", (c) => data += c);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.embedding) resolve(parsed.embedding);
          else reject(new Error("No embedding in response: " + data.substring(0, 200)));
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
// Embedding-input
//   - Muut sisältötyypit: title + description (roadmap §4, "puhdas" testi)
//   - Thesis: title + description + subjects + keywords (v4.4 PR-B)
//     Perustelu: 42/169 opinnäytettä on ilman abstract:ia (tekijä
//     täysin rajoittanut + PDF vain login-taakse), joten subjects+keywords
//     on ainoa saatavilla oleva pidempi signaali. Muille 128 abstract:ille
//     rikkaampi input voi silti auttaa cross-content-mätsäystä.
// -----------------------------------------------------------------------------

function embeddingInput(item) {
  const title = String(item.title || "").trim();
  const desc = String(item.description || "").trim();

  if (item.contentType === "thesis") {
    const parts = [title];
    if (desc) parts.push(desc);
    const subjects = (item.subjects || []).map((s) => String(s).trim()).filter(Boolean);
    const keywords = (item.keywords || []).map((k) => String(k).trim()).filter(Boolean);
    if (subjects.length) parts.push("Oppiaine: " + subjects.join(", "));
    if (keywords.length) parts.push("Avainsanat: " + keywords.join(", "));
    return parts.join("\n");
  }

  return desc ? `${title}\n${desc}` : title;
}

// -----------------------------------------------------------------------------
// Metadata baseline: kopio relatedContent-logiikasta (PR-4)
// -----------------------------------------------------------------------------

function normalizeTerm(v) {
  return String(v || "").trim().toLowerCase();
}
function normalizeTerms(values) {
  const arr = Array.isArray(values) ? values : (values ? [values] : []);
  return new Set(arr.filter(Boolean).map(normalizeTerm).filter(Boolean));
}
function intersectionCount(values, wanted) {
  const arr = Array.isArray(values) ? values : (values ? [values] : []);
  return arr.reduce((c, v) => (wanted.has(normalizeTerm(v)) ? c + 1 : c), 0);
}
function metadataScore(candidate, anchor) {
  const wantedCategories = normalizeTerms(anchor.categories);
  const wantedKeywords = normalizeTerms(anchor.keywords);
  const wantedContexts = normalizeTerms(anchor.contexts);
  const wantedType = String(anchor.contentType || "");
  const categoryScore = intersectionCount(candidate.categories, wantedCategories) * 5;
  const keywordScore = intersectionCount(candidate.keywords, wantedKeywords) * 3;
  const contextScore = intersectionCount(candidate.contexts, wantedContexts) * 4;
  const typeScore = wantedType && candidate.contentType === wantedType ? 2 : 0;
  // Tags omitted (data.tags puuttuu content.json:ista suurimmalta osalta itemeistä)
  return categoryScore + keywordScore + contextScore + typeScore;
}
function metadataTopN(anchor, pool, n = 5) {
  return pool
    .filter((c) => c.url !== anchor.url)
    .map((c) => ({ item: c, score: metadataScore(c, anchor) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || String(b.item.date).localeCompare(String(a.item.date)))
    .slice(0, n);
}

// -----------------------------------------------------------------------------
// Semantic top-N (cosine similarity)
// -----------------------------------------------------------------------------

function cosineSim(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function semanticTopN(anchorEmbedding, anchorUrl, poolEmbeddings, n = 5) {
  return poolEmbeddings
    .filter(({ url }) => url !== anchorUrl)
    .map(({ item, embedding }) => ({ item, similarity: cosineSim(anchorEmbedding, embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, n);
}

// -----------------------------------------------------------------------------
// Metriikat: Overlap@5, same-type %
// -----------------------------------------------------------------------------

function overlapAt5(metadataResults, semanticResults) {
  const mUrls = new Set(metadataResults.map((r) => r.item.url));
  const sUrls = semanticResults.map((r) => r.item.url);
  const overlap = sUrls.filter((u) => mUrls.has(u));
  return { count: overlap.length, urls: overlap };
}

function sameTypeFraction(anchor, results) {
  if (!results.length) return 0;
  const same = results.filter((r) => r.item.contentType === anchor.contentType).length;
  return same / results.length;
}

// -----------------------------------------------------------------------------
// Pääohjelma
// -----------------------------------------------------------------------------

async function main() {
  console.log(`v4.4 Semantic Experiment — pilot (model: ${MODEL})\n`);

  // 1. Lataa candidate pool
  const pool = loadCandidatePool();
  console.log(`Candidate pool: ${pool.length} itemiä`);

  // 2. Valitse anchor-otos (15 kpl)
  const anchors = selectAnchors(pool);
  console.log(`Anchor otos: ${anchors.length} kpl`);
  anchors.forEach((a, i) => {
    console.log(`  [${i}] ${a.contentType.padEnd(20)} ${(a.title || "").substring(0, 60)}`);
  });

  // 3. Tarkista Ollama-yhteys + malli
  console.log(`\n--- Testataan Ollama-yhteyttä ---`);
  try {
    await ollamaEmbed(MODEL, "test");
    console.log(`✓ Ollama vastasi, malli ${MODEL} toimii`);
  } catch (e) {
    console.error(`✗ Ollama-virhe: ${e.message}`);
    console.error(`  Onko Ollama käynnissä? (curl http://localhost:11434/api/tags)`);
    console.error(`  Onko malli ladattu? (ollama pull ${MODEL})`);
    process.exit(1);
  }

  // 4. Laske embeddingit KAIKILLE poolissa oleville itemeille
  console.log(`\n--- Lasketaan ${pool.length} embeddingiä (${MODEL})... ---`);
  const t0 = Date.now();
  const poolEmbeddings = [];
  for (let i = 0; i < pool.length; i++) {
    const item = pool[i];
    const input = embeddingInput(item);
    try {
      const embedding = await ollamaEmbed(MODEL, input);
      poolEmbeddings.push({ url: item.url, item, embedding });
    } catch (e) {
      console.warn(`  [!] Embedding failed for ${item.url}: ${e.message}`);
    }
    if ((i + 1) % 25 === 0 || i === pool.length - 1) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  [${i + 1}/${pool.length}] ${elapsed}s elapsed`);
    }
  }
  console.log(`✓ ${poolEmbeddings.length} embeddingiä valmiit (${((Date.now() - t0) / 1000).toFixed(1)}s)`);

  // 5. Anchoreille: metadata top-5 vs. semantic top-5
  console.log(`\n${"=".repeat(80)}\nVERTAILU: METADATA vs. SEMANTIC (top-${TOP_N}, malli ${MODEL})\n${"=".repeat(80)}`);

  const results = [];
  for (const anchor of anchors) {
    const anchorEmbedding = poolEmbeddings.find((p) => p.url === anchor.url)?.embedding;
    if (!anchorEmbedding) {
      console.warn(`Skipping anchor without embedding: ${anchor.url}`);
      continue;
    }
    const metadataResults = metadataTopN(anchor, pool, TOP_N);
    const semanticResults = semanticTopN(anchorEmbedding, anchor.url, poolEmbeddings, TOP_N);
    const overlap = overlapAt5(metadataResults, semanticResults);
    const mSameType = sameTypeFraction(anchor, metadataResults);
    const sSameType = sameTypeFraction(anchor, semanticResults);

    console.log(`\n--- ANCHOR: [${anchor.contentType}] ${anchor.title.substring(0, 65)}`);
    if (anchor.description) console.log(`    desc: ${anchor.description.substring(0, 80)}...`);

    console.log(`\n  METADATA top-${TOP_N} (same-type ${Math.round(mSameType * 100)}%):`);
    if (metadataResults.length === 0) {
      console.log(`    (ei tuloksia)`);
    } else {
      metadataResults.forEach((r) => {
        const same = r.item.contentType === anchor.contentType ? "[same]" : "[cross]";
        console.log(`    [${String(r.score).padStart(2)}] ${same.padEnd(7)} ${r.item.contentType.padEnd(18)} ${(r.item.title || "").substring(0, 55)}`);
      });
    }

    console.log(`\n  SEMANTIC top-${TOP_N} (same-type ${Math.round(sSameType * 100)}%):`);
    semanticResults.forEach((r) => {
      const same = r.item.contentType === anchor.contentType ? "[same]" : "[cross]";
      const novel = overlap.urls.includes(r.item.url) ? "" : "*";  // * = ei metadata-top-5:ssä
      console.log(`    [${r.similarity.toFixed(3)}] ${same.padEnd(7)} ${r.item.contentType.padEnd(18)} ${novel}${(r.item.title || "").substring(0, 55)}`);
    });

    console.log(`\n  Overlap@5: ${overlap.count}/${TOP_N}   (novel semantic: ${TOP_N - overlap.count})`);

    results.push({ anchor, metadataResults, semanticResults, overlap, mSameType, sSameType });
  }

  // 6. Yhteenveto
  console.log(`\n${"=".repeat(80)}\nYHTEENVETO (${MODEL})\n${"=".repeat(80)}`);

  const totalOverlap = results.reduce((s, r) => s + r.overlap.count, 0);
  const totalPossible = results.length * TOP_N;
  const avgOverlap = totalOverlap / results.length;

  const mSameTypeAll = results.reduce((s, r) => s + r.metadataResults.filter((x) => x.item.contentType === r.anchor.contentType).length, 0);
  const mTotalAll = results.reduce((s, r) => s + r.metadataResults.length, 0);
  const sSameTypeAll = results.reduce((s, r) => s + r.semanticResults.filter((x) => x.item.contentType === r.anchor.contentType).length, 0);
  const sTotalAll = results.reduce((s, r) => s + r.semanticResults.length, 0);

  console.log(`Anchoreita: ${results.length}`);
  console.log(`\nOverlap@5:`);
  console.log(`  keskiarvo:      ${avgOverlap.toFixed(2)} / ${TOP_N}`);
  console.log(`  yhteensä:       ${totalOverlap} / ${totalPossible} (${Math.round(totalOverlap / totalPossible * 100)}%)`);
  console.log(`\nSame-type %:`);
  console.log(`  metadata:  ${mTotalAll ? Math.round(mSameTypeAll / mTotalAll * 100) : 0}%  (${mSameTypeAll}/${mTotalAll})`);
  console.log(`  semantic:  ${sTotalAll ? Math.round(sSameTypeAll / sTotalAll * 100) : 0}%  (${sSameTypeAll}/${sTotalAll})`);

  console.log(`\nRelevant novel@5 vaatii käsintarkastuksen (novel-tulokset merkitty * yllä).`);
  console.log(`Käyttäjä arvioi jokaisen novel-tuloksen: relevantti / osittain / epäolennainen.`);

  console.log(`\nGo/no-go raportti kirjoitetaan käsintarkastuksen jälkeen muistiin:`);
  console.log(`  memory/project_semantic_pilot_findings.md`);
  console.log(`\nStrong GO / Promising / No clear benefit / No-go — laadullinen arvio.`);
}

main().catch((e) => { console.error(e); process.exit(1); });

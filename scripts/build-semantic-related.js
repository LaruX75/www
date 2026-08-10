#!/usr/bin/env node
/**
 * v4.4 Vaihe A: rakenna build-time semantic top-K per URL.
 *
 * ROOLI: lue PR #77:n embedding-cache, laske cosine-similarity kaikkien parien
 * välillä, kirjoita per-URL top-K → src/_data/semanticRelated.json.
 *
 * EI aja Ollamaa. EI muuta relatedContent-filtteriä. EI muuta UI:ta.
 *
 * Output:
 *   src/_data/semanticRelated.json  (global-data Nunjucks-käyttöön)
 *
 * Rakenne:
 *   {
 *     "/anchor-url/": [
 *       { "url": "/other-url/", "sim": 0.82 },
 *       ...
 *     ]
 *   }
 *
 * HUOM: EI title/description/vector — vain url+sim. Roadmap §21.
 *
 * KÄYTTÖ:
 *   node scripts/build-semantic-related.js
 *   node scripts/build-semantic-related.js --top 10
 *   node scripts/build-semantic-related.js --min-sim 0.5
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const CACHE_META = path.join(ROOT, ".cache", "api-fallback", "embeddings-bge-m3-v1.meta.json");
const CACHE_F32 = path.join(ROOT, ".cache", "api-fallback", "embeddings-bge-m3-v1.f32");
const OUT_FILE = path.join(ROOT, "src", "_data", "semanticRelated.json");

const argTop = Number(process.argv[process.argv.indexOf("--top") + 1]);
const argMinSim = Number(process.argv[process.argv.indexOf("--min-sim") + 1]);
const TOP_K = Number.isFinite(argTop) && argTop > 0 ? argTop : 10;
const MIN_SIM = Number.isFinite(argMinSim) && argMinSim > 0 ? argMinSim : 0.4;

function main() {
  if (!fs.existsSync(CACHE_META) || !fs.existsSync(CACHE_F32)) {
    console.error("Embedding-cache puuttuu. Aja ensin: node scripts/build-embeddings.js");
    process.exit(1);
  }

  const t0 = Date.now();
  const meta = JSON.parse(fs.readFileSync(CACHE_META, "utf8"));
  const buf = fs.readFileSync(CACHE_F32);
  const dims = meta.dimensions;

  // Lataa vektorit
  const items = meta.items.map((it) => {
    const vec = new Float32Array(dims);
    for (let j = 0; j < dims; j++) vec[j] = buf.readFloatLE((it.offset * dims + j) * 4);
    return { url: it.url, vec };
  });
  console.log(`[semantic-related] ${items.length} vektoria ladattu (${dims}D)`);

  // Esilaske normit
  const norms = items.map((it) => {
    let s = 0;
    for (let j = 0; j < dims; j++) s += it.vec[j] * it.vec[j];
    return Math.sqrt(s);
  });

  // Per URL: top-K
  const output = {};
  let totalSlots = 0;
  for (let i = 0; i < items.length; i++) {
    const a = items[i];
    const nA = norms[i];
    const results = [];
    for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const b = items[j];
      let dot = 0;
      for (let k = 0; k < dims; k++) dot += a.vec[k] * b.vec[k];
      const sim = dot / (nA * norms[j]);
      if (sim < MIN_SIM) continue;
      results.push({ url: b.url, sim: Number(sim.toFixed(4)) });
    }
    results.sort((x, y) => y.sim - x.sim);
    output[a.url] = results.slice(0, TOP_K);
    totalSlots += output[a.url].length;

    if ((i + 1) % 100 === 0) {
      console.log(`  ${i + 1}/${items.length} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  const json = JSON.stringify(output);
  fs.writeFileSync(OUT_FILE, json);

  const sizeKB = (json.length / 1024).toFixed(1);
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n[semantic-related] Valmis (${elapsed}s)`);
  console.log(`  Tulos: ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  Anchoreita: ${Object.keys(output).length}`);
  console.log(`  Slot:eja yhteensä: ${totalSlots}`);
  console.log(`  Koko: ${sizeKB} KB (top=${TOP_K}, min-sim=${MIN_SIM})`);
}

main();

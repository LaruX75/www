#!/usr/bin/env node
/**
 * v4.4 Semantic Recommendation Evaluation — sokko A/B/C.
 *
 * TÄRKEIN SÄÄNTÖ: EI tuotanto-ominaisuutta. Vain analyysi.
 *
 * KYSYMYKSET:
 *   1. Tuottaako semantic similarity käyttäjän kannalta relevantimpia
 *      sisältösuhteita kuin nykyinen metadata-pohjainen relatedContent?
 *   2. Parantaako rich embedding input semantic similarityä verrattuna
 *      pelkkään title+description -inputiin?
 *
 * KOLME MENETELMÄÄ:
 *   A = metadata relatedContent (kopio nykyisestä)
 *   B = semantic baseline (title + description embedding, laskettu tässä)
 *   C = semantic rich (PR #77:n valmiit embeddingit .cache/api-fallback/)
 *
 * TUOTTAA:
 *   scripts/evaluation-results/evaluation-YYYY-MM-DD.json
 *     - anchor-otos (30 kpl, ANCHOR_SEED-siemenellä toistettavissa)
 *     - top-5 per anchor per menetelmä
 *     - sokko-labelit X/Y/Z + mapping (loppuun)
 *     - metriikat: mean relevance, Relevant@5, StrongRelevant@5, list quality,
 *       Overlap, Relevant novel@5, same-type %
 *
 * MERKINTÄ: Tämä on batch-generointi. Käsintarkastelu tehdään erikseen
 *   avaamalla output-JSON ja täyttämällä relevance-arviot (0-3) + list quality (1-5).
 *   Ei automaattista LLM-arviointia (loisi vinouman semantic-menetelmiä kohtaan).
 *
 * KÄYTTÖ:
 *   node scripts/debug-semantic-evaluation.js                 # tuota anchor-set + top-5
 *   node scripts/debug-semantic-evaluation.js --analyze <fn>  # laske metriikat käsinarvioidusta JSON:sta
 */

const fs = require("fs");
const path = require("path");
const http = require("http");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "scripts", "evaluation-results");
const CACHE_META = path.join(ROOT, ".cache", "api-fallback", "embeddings-bge-m3-v1.meta.json");
const CACHE_F32 = path.join(ROOT, ".cache", "api-fallback", "embeddings-bge-m3-v1.f32");
const MODEL = "bge-m3";
const TOP_N = 5;
const ANCHOR_SEED = 20260810; // deterministinen otos (toistettavissa)

// -----------------------------------------------------------------------------
// Analyze-mode: laske metriikat käsinarvioidusta JSON:sta
// -----------------------------------------------------------------------------

const analyzeArg = process.argv.find((a) => a.startsWith("--analyze"));
if (analyzeArg) {
  const file = process.argv[process.argv.indexOf("--analyze") + 1];
  runAnalyze(file);
  return;
}

// -----------------------------------------------------------------------------
// Data-lataus
// -----------------------------------------------------------------------------

const CONTENT_JSON = path.join(ROOT, "_site", "data", "content.json");
const THESES_JSON = path.join(ROOT, "_site", "data", "theses.json");
const content = JSON.parse(fs.readFileSync(CONTENT_JSON, "utf8"));
const theses = JSON.parse(fs.readFileSync(THESES_JSON, "utf8"));
const pool = [...content.items, ...theses.items];

// Rich embeddings cache
if (!fs.existsSync(CACHE_META) || !fs.existsSync(CACHE_F32)) {
  console.error("Cache puuttuu. Aja: node scripts/build-embeddings.js");
  process.exit(1);
}
const cacheMeta = JSON.parse(fs.readFileSync(CACHE_META, "utf8"));
const cacheBuf = fs.readFileSync(CACHE_F32);
const DIMS = cacheMeta.dimensions;
const richEmbByUrl = new Map();
cacheMeta.items.forEach((it) => {
  const vec = new Float32Array(DIMS);
  for (let j = 0; j < DIMS; j++) vec[j] = cacheBuf.readFloatLE((it.offset * DIMS + j) * 4);
  richEmbByUrl.set(it.url, {
    vector: vec,
    contentType: it.contentType,
    inputSources: it.inputSources
  });
});

// -----------------------------------------------------------------------------
// 30 anchoria (§25, ANCHOR_SEED toistettavissa)
// -----------------------------------------------------------------------------

function findAnchor(pred) {
  return pool.find(pred);
}

const ANCHOR_URLS = [
  // blogPost (4)
  findAnchor((i) => i.contentType === "blogPost" && /valkea savu/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "blogPost" && /tiedolla johtamis/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "blogPost" && /normaalikoulun tilaratkaisu/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "blogPost" && /digione/i.test(i.title))?.url,
  // opinion (3)
  findAnchor((i) => i.contentType === "opinion" && /kampuspohdintaa/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "opinion" && /toistuvia rakenteita/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "opinion" && /polkuluvat/i.test(i.title))?.url,
  // presentation (4): 2 SlideShare rikas + 2 Canva niukka
  findAnchor((i) => i.contentType === "presentation" && /digital enabled learning/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "presentation" && /scaffolding collaborative/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "presentation" && /arjen tekoäly/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "presentation" && /generation ai yleisesitys/i.test(i.title))?.url,
  // thesis (4): 2 with-abstract + 2 without
  findAnchor((i) => i.contentType === "thesis" && /matematiikka-ahdistuksesta/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "thesis" && /tekoälytaidot näkyvät/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "thesis" && /emotionaalisen älykkyyden/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "thesis" && /STEAM-opetuksen vaikutus/i.test(i.title))?.url,
  // speech (3)
  findAnchor((i) => i.contentType === "speech" && /Haukiputaan jokirannan/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "speech" && /Oulu2026/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "speech" && /Uuden Oulun kuulemistilaisuudessa/i.test(i.title))?.url,
  // mediaItem (3)
  findAnchor((i) => i.contentType === "mediaItem" && /Ep 115.*Jari Laru/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "mediaItem" && /Korvaako tekoäly opettajan/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "mediaItem" && /Luova luokka.*mediakasvatus/i.test(i.title))?.url,
  // article (2)
  findAnchor((i) => i.contentType === "article" && /Lakimuutokset näkyvät koulun arjessa/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "article" && /Sivistyslautakunnan uusi alku/i.test(i.title))?.url,
  // scientificPublication (2)
  findAnchor((i) => i.contentType === "scientificPublication" && /LECTIO PRECURSORIA/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "scientificPublication" && /Paper 4.*Web 2/i.test(i.title))?.url,
  // initiative (2)
  findAnchor((i) => i.contentType === "initiative" && /etäopetuksen pilottihanke/i.test(i.title))?.url,
  findAnchor((i) => i.contentType === "initiative" && /Sähköpyörien turvallinen pysäköinti/i.test(i.title))?.url,
  // column (1)
  findAnchor((i) => i.contentType === "column" && /Keskustakampuksen lammikossa/i.test(i.title))?.url,
  // statement (1)
  findAnchor((i) => i.contentType === "statement" && /Suomen digitaaliseen kompassiin/i.test(i.title))?.url,
  // video EN (1) — cross-language testi
  findAnchor((i) => i.contentType === "video" && i.lang === "en" && /Higher Education Institutions/i.test(i.title))?.url
].filter(Boolean);

const anchors = ANCHOR_URLS.map((url) => pool.find((i) => i.url === url)).filter(Boolean);
console.log(`Anchor-otos: ${anchors.length} / 30 kpl`);

// -----------------------------------------------------------------------------
// Metadata A: kopio relatedContent-logiikasta (eleventy.filters.js:1013-1024)
// -----------------------------------------------------------------------------

function normalizeTerm(v) { return String(v || "").trim().toLowerCase(); }
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
  const cat = intersectionCount(candidate.categories, wantedCategories) * 5;
  const kw = intersectionCount(candidate.keywords, wantedKeywords) * 3;
  const ctx = intersectionCount(candidate.contexts, wantedContexts) * 4;
  const type = wantedType && candidate.contentType === wantedType ? 2 : 0;
  return cat + kw + ctx + type;
}

function methodA_top5(anchor) {
  return pool
    .filter((c) => c.url !== anchor.url)
    .map((c) => ({ item: c, score: metadataScore(c, anchor) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || String(b.item.date || "").localeCompare(String(a.item.date || "")))
    .slice(0, TOP_N)
    .map((r) => ({ url: r.item.url, title: r.item.title, contentType: r.item.contentType, description: (r.item.description || "").substring(0, 200), score: r.score }));
}

// -----------------------------------------------------------------------------
// Semantic B: title + description embedding (lasketaan tässä Ollamalla)
// -----------------------------------------------------------------------------

function ollamaEmbed(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, prompt: text });
    const req = http.request({
      hostname: "localhost", port: 11434, path: "/api/embeddings", method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }, timeout: 60000
    }, (res) => {
      let d = "";
      res.on("data", (c) => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d).embedding); } catch (e) { reject(e); } });
    });
    req.on("error", reject); req.write(body); req.end();
  });
}

function cosine(a, b) {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; ma += a[i] * a[i]; mb += b[i] * b[i]; }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

function baselineInput(item) {
  return [item.title, item.description].filter(Boolean).join("\n");
}

// -----------------------------------------------------------------------------
// Sokko-labelit: randomisoi X/Y/Z per anchor (deterministinen ANCHOR_SEED:istä)
// -----------------------------------------------------------------------------

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffledLabels(rng) {
  const arr = ["A", "B", "C"];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return { X: arr[0], Y: arr[1], Z: arr[2] };
}

// -----------------------------------------------------------------------------
// Pääohjelma: generoi evaluation-JSON
// -----------------------------------------------------------------------------

async function main() {
  console.log(`\n[semantic-evaluation] model=${MODEL} top-N=${TOP_N}`);
  console.log(`  candidate pool: ${pool.length}`);
  console.log(`  rich embeddings: ${richEmbByUrl.size}`);

  // Laske B-embeddings anchoreille + koko pool:ille (title+desc)
  console.log(`\nLasketaan B-embeddingit ${pool.length}:lle itemille (title+description)...`);
  const embeddingsB = new Map();
  const t0 = Date.now();
  for (let i = 0; i < pool.length; i++) {
    const item = pool[i];
    if (!item.url) continue;
    const text = baselineInput(item);
    if (text.length < 5) continue;
    try {
      const vec = await ollamaEmbed(text);
      embeddingsB.set(item.url, { vector: new Float32Array(vec) });
    } catch (e) { console.warn(`  ✗ ${item.url}: ${e.message}`); }
    if ((i + 1) % 100 === 0) console.log(`  ${i + 1}/${pool.length} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  console.log(`  ✓ ${embeddingsB.size} B-embeddings valmiit (${((Date.now() - t0) / 1000).toFixed(1)}s)`);

  // Per anchor: A/B/C top-5
  console.log("\nLasketaan A/B/C top-5 per anchor...");
  const rng = mulberry32(ANCHOR_SEED);
  const evaluations = [];
  const mappings = [];

  for (const anchor of anchors) {
    const A = methodA_top5(anchor);

    const embBanchor = embeddingsB.get(anchor.url);
    const B = embBanchor ? pool
      .filter((c) => c.url !== anchor.url && embeddingsB.has(c.url))
      .map((c) => ({ item: c, sim: cosine(embBanchor.vector, embeddingsB.get(c.url).vector) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, TOP_N)
      .map((r) => ({ url: r.item.url, title: r.item.title, contentType: r.item.contentType, description: (r.item.description || "").substring(0, 200), sim: Number(r.sim.toFixed(4)) })) : [];

    const embCanchor = richEmbByUrl.get(anchor.url);
    const C = embCanchor ? pool
      .filter((c) => c.url !== anchor.url && richEmbByUrl.has(c.url))
      .map((c) => ({ item: c, sim: cosine(embCanchor.vector, richEmbByUrl.get(c.url).vector) }))
      .sort((a, b) => b.sim - a.sim)
      .slice(0, TOP_N)
      .map((r) => ({ url: r.item.url, title: r.item.title, contentType: r.item.contentType, description: (r.item.description || "").substring(0, 200), sim: Number(r.sim.toFixed(4)) })) : [];

    // Sokko-mapping
    const mapping = shuffledLabels(rng);

    const anchorRichSource = (embCanchor?.inputSources || []).slice(-1)[0] || "none";
    const richness =
      anchorRichSource === "markdownBody" || anchorRichSource === "slideshareTranscript" ||
      anchorRichSource === "thesisAbstract" || anchorRichSource === "publicationAbstract" ? "rich"
      : anchorRichSource === "description" ? "medium"
      : anchorRichSource === "title" ? "niukka" : "none";

    evaluations.push({
      anchor: {
        url: anchor.url,
        title: anchor.title,
        contentType: anchor.contentType,
        description: (anchor.description || "").substring(0, 300),
        year: anchor.year,
        lang: anchor.lang,
        richSource: anchorRichSource,
        richness
      },
      // Sokko-labelit: X/Y/Z-avaimet, jotta lista-nimi EI paljasta menetelmää.
      sets: {
        X: mapping.X === "A" ? A : mapping.X === "B" ? B : C,
        Y: mapping.Y === "A" ? A : mapping.Y === "B" ? B : C,
        Z: mapping.Z === "A" ? A : mapping.Z === "B" ? B : C
      },
      // Käsinarvioinnin tila (täytetään manuaalisesti):
      arvioinnit: {
        X: { relevance: [null, null, null, null, null], listQuality: null, notes: "" },
        Y: { relevance: [null, null, null, null, null], listQuality: null, notes: "" },
        Z: { relevance: [null, null, null, null, null], listQuality: null, notes: "" }
      }
      // HUOM: mapping (X→A/B/C) tallennetaan erilliseen .mapping.json-tiedostoon
    });
    mappings.push({ url: anchor.url, mapping });
  }

  // Kaksi tiedostoa:
  //   .json         — sokko-versio (X/Y/Z), tähän arvioidaan
  //   .mapping.json — X→A/B/C sinetöity kunnes arviointi valmis
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10);
  const outFile = path.join(OUTPUT_DIR, `evaluation-${dateStr}.json`);
  const mappingFile = path.join(OUTPUT_DIR, `evaluation-${dateStr}.mapping.json`);

  fs.writeFileSync(outFile, JSON.stringify({
    metadata: {
      model: MODEL,
      dimensions: DIMS,
      strategyVersion: cacheMeta.strategyVersion,
      maxChars: cacheMeta.maxChars,
      candidatePoolSize: pool.length,
      anchorSeed: ANCHOR_SEED,
      generatedAt: new Date().toISOString(),
      note: "Sokko-labelit X/Y/Z on satunnaistettu per anchor. Mapping tallennettu erilliseen .mapping.json-tiedostoon. Älä avaa mappingia ennen arviointia."
    },
    evaluations
  }, null, 2));

  fs.writeFileSync(mappingFile, JSON.stringify({
    metadata: {
      generatedAt: new Date().toISOString(),
      anchorSeed: ANCHOR_SEED,
      note: "SINETÖITY: X→A/B/C mapping per anchor. Älä avaa ennen arviointia. A=metadata, B=title+desc embedding, C=rich embedding."
    },
    mappings
  }, null, 2));

  console.log(`\nTallennettu sokko-tiedosto: ${path.relative(ROOT, outFile)}`);
  console.log(`Tallennettu mapping-tiedosto: ${path.relative(ROOT, mappingFile)}`);
  console.log(`  ${evaluations.length} anchoria × 3 menetelmää × ${TOP_N} tulosta = ${evaluations.length * 3 * TOP_N} slot:ia`);
  console.log(`\nKäsinarvioinnin ohjeet:`);
  console.log(`  1. Avaa ${path.relative(ROOT, outFile)} editorissa`);
  console.log(`  2. Jokaiselle sets.X, sets.Y, sets.Z: arvioi 0-3 kullekin 5 tulokselle → arvioinnit.X.relevance`);
  console.log(`  3. Kokonaisarvio: 1-5 → arvioinnit.X.listQuality`);
  console.log(`  4. ÄLÄ avaa mapping-tiedostoa ennen arvioinnin valmistumista`);
  console.log(`  5. Kun valmis: node scripts/debug-semantic-evaluation.js --analyze ${path.relative(ROOT, outFile)}`);
}

// -----------------------------------------------------------------------------
// Analyze-mode: laske metriikat käsinarvioidusta JSON:sta
// -----------------------------------------------------------------------------

function runAnalyze(file) {
  if (!file || !fs.existsSync(file)) {
    console.error("Anna evaluation-JSON: --analyze scripts/evaluation-results/evaluation-XXX.json");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(file, "utf8"));

  // Lue erillinen mapping-tiedosto: evaluation-YYYY-MM-DD.mapping.json
  const mappingFile = file.replace(/\.json$/, ".mapping.json");
  if (!fs.existsSync(mappingFile)) {
    console.error(`Mapping-tiedosto puuttuu: ${mappingFile}`);
    console.error("Generoi uudelleen ajamalla scripti ilman --analyze:a.");
    process.exit(1);
  }
  const mappingData = JSON.parse(fs.readFileSync(mappingFile, "utf8"));
  const mappingByUrl = new Map(mappingData.mappings.map((m) => [m.url, m.mapping]));

  const anchorMetrics = { A: [], B: [], C: [] };
  const listQualities = { A: [], B: [], C: [] };
  const overlaps = { AB: [], AC: [], BC: [] };
  const sameTypeCounts = { A: 0, B: 0, C: 0, total: 0 };
  const strongOnly = { A: 0, B: 0, C: 0 };
  const relevantOnly = { A: 0, B: 0, C: 0 };
  const winners = { A: 0, B: 0, C: 0, tie: 0 };
  const relevantNovelC = [];

  data.evaluations.forEach((ev) => {
    const mapping = mappingByUrl.get(ev.anchor.url);
    if (!mapping) { console.warn(`Ei mappingia: ${ev.anchor.url}`); return; }
    const inv = {};
    Object.entries(mapping).forEach(([label, method]) => { inv[method] = label; });

    ["A", "B", "C"].forEach((method) => {
      const label = inv[method];
      const set = ev.sets[label] || [];
      const arv = ev.arvioinnit[label];
      if (!arv || arv.listQuality == null) return; // ei vielä arvioitu

      const rels = arv.relevance || [];
      const validRels = rels.filter((r) => typeof r === "number");
      if (validRels.length !== 5) return;

      anchorMetrics[method].push(...validRels);
      listQualities[method].push(arv.listQuality);
      strongOnly[method] += validRels.filter((r) => r === 3).length;
      relevantOnly[method] += validRels.filter((r) => r >= 2).length;

      set.forEach((r) => {
        if (r.contentType === ev.anchor.contentType) sameTypeCounts[method]++;
        sameTypeCounts.total++;
      });
    });

    // Overlap A vs B, A vs C, B vs C
    const urlsFor = (method) => (ev.sets[inv[method]] || []).map((r) => r.url);
    const setA = new Set(urlsFor("A"));
    const setB = new Set(urlsFor("B"));
    const setC = new Set(urlsFor("C"));
    overlaps.AB.push([...setA].filter((u) => setB.has(u)).length);
    overlaps.AC.push([...setA].filter((u) => setC.has(u)).length);
    overlaps.BC.push([...setB].filter((u) => setC.has(u)).length);

    // Relevant novel@5 (C:ssa)
    const arvC = ev.arvioinnit[inv["C"]];
    if (arvC && arvC.listQuality != null) {
      const setCurls = urlsFor("C");
      const setCurlsWithRel = setCurls.map((url, i) => ({ url, rel: arvC.relevance[i] }));
      const novel = setCurlsWithRel.filter((r) => !setA.has(r.url));
      const relevantNovel = novel.filter((r) => r.rel >= 2).length;
      relevantNovelC.push({ anchor: ev.anchor.title.substring(0, 60), novel: novel.length, relevantNovel });
    }

    // Winner per anchor
    const scores = {};
    ["A", "B", "C"].forEach((m) => {
      const arv = ev.arvioinnit[inv[m]];
      if (arv && arv.listQuality != null) scores[m] = arv.listQuality;
    });
    if (Object.keys(scores).length === 3) {
      const max = Math.max(...Object.values(scores));
      const winnersHere = Object.entries(scores).filter(([_, v]) => v === max).map(([k]) => k);
      if (winnersHere.length === 1) winners[winnersHere[0]]++;
      else winners.tie++;
    }
  });

  const mean = (arr) => arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(2) : "n/a";
  const total5 = data.evaluations.length * 5;

  console.log("\n=== v4.4 Semantic Recommendation Evaluation - Tulokset ===");
  console.log("Model:", data.metadata.model, "| Anchorit:", data.evaluations.length);
  console.log("");
  console.log("Menetelmä     Mean rel   Rel@5   Strong@5   ListQ    Same-type");
  ["A", "B", "C"].forEach((m) => {
    const rel = mean(anchorMetrics[m]);
    const relPct = anchorMetrics[m].length ? Math.round(relevantOnly[m] / anchorMetrics[m].length * 100) : 0;
    const strongPct = anchorMetrics[m].length ? Math.round(strongOnly[m] / anchorMetrics[m].length * 100) : 0;
    const lq = mean(listQualities[m]);
    const sameTypePct = sameTypeCounts.total ? Math.round(sameTypeCounts[m] / (sameTypeCounts.total / 3) * 100) : 0;
    console.log(`${m.padEnd(3)}          ${rel.padStart(5)}     ${String(relPct).padStart(3)}%      ${String(strongPct).padStart(3)}%     ${lq.padStart(4)}     ${String(sameTypePct).padStart(3)}%`);
  });

  console.log("");
  console.log("Overlap@5:");
  console.log(`  A vs B:  ${mean(overlaps.AB)}/5`);
  console.log(`  A vs C:  ${mean(overlaps.AC)}/5`);
  console.log(`  B vs C:  ${mean(overlaps.BC)}/5`);

  console.log("");
  console.log("C Relevant novel@5 (relevantit tulokset joita metadata ei löydä):");
  const totalNovel = relevantNovelC.reduce((s, r) => s + r.relevantNovel, 0);
  const totalMax = relevantNovelC.length * 5;
  console.log(`  yhteensä ${totalNovel} / ${totalMax} slot:ista (${totalMax ? Math.round(totalNovel / totalMax * 100) : 0}%)`);

  console.log("");
  console.log("Winners per anchor (list quality):");
  console.log(`  A wins:  ${winners.A}`);
  console.log(`  B wins:  ${winners.B}`);
  console.log(`  C wins:  ${winners.C}`);
  console.log(`  ties:    ${winners.tie}`);
}

if (!analyzeArg) main().catch((e) => { console.error(e); process.exit(1); });

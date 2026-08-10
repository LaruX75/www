#!/usr/bin/env node
/**
 * v4.4 Offline hybrid-vertailu — mikä production-kaava valitaan?
 *
 * Lukee:
 *   - src/_data/semanticRelated.json  (Vaihe A output, per URL top-K)
 *   - _site/data/content.json + theses.json (candidate pool, 634 itemiä)
 *   - scripts/evaluation-results/evaluation-2026-08-09.json (29 anchoria)
 *   - scripts/evaluation-results/evaluation-2026-08-09.claude.json (Clauden rel-arviot)
 *
 * Tuottaa top-4 per anchor per kaava:
 *   BASELINE = pelkkä nykyinen metadataScore (kopio eleventy.filters.js:1013-1018)
 *   H0       = metadataScore + (sim >= 0.6 ? sim * 5 : 0)
 *   H1       = metadataScore + (sim >= 0.6 ? sim * 8 : 0)
 *   H2       = 0.5 * metadataNorm + 0.5 * semanticNorm  (normalisoitu 50/50)
 *   H3       = 0.6 * metadataNorm + 0.4 * semanticNorm  (metadataa suosiva)
 *
 * Metriikat per kaava (vs. BASELINE):
 *   - listan muutos-% (kuinka moni top-4 muuttuu jotenkin)
 *   - keskim. overlap@4 vs baseline
 *   - semantic-novel-count top-4:ssä
 *   - relevantti-novel-count (jos Clauden arviot löytyvät C:stä)
 *   - metadata-strong-drop (kuinka moni baselinen "vahva" tulos putoaa pois)
 *
 * Konkreettiset esimerkit:
 *   - Scaffolding 2011 (reunatapaus, metadata epäonnistui)
 *   - Anchor 1 (Valkea savu, vahva kampus-klusteri)
 *   - Anchor 22 (sivistyslautakunta, vahva klusteri)
 *   - Anchor 12 (thesis-tekoäly, vahva klusteri)
 *
 * EI muuta relatedContent-filtteriä. EI muuta UI:ta. Vain analyysi.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

const content = JSON.parse(fs.readFileSync(path.join(ROOT, "_site", "data", "content.json"), "utf8"));
const theses = JSON.parse(fs.readFileSync(path.join(ROOT, "_site", "data", "theses.json"), "utf8"));
const semRelated = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "_data", "semanticRelated.json"), "utf8"));
const evalData = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "evaluation-results", "evaluation-2026-08-09.json"), "utf8"));
const claudeData = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "evaluation-results", "evaluation-2026-08-09.claude.json"), "utf8"));
const mappingData = JSON.parse(fs.readFileSync(path.join(ROOT, "scripts", "evaluation-results", "evaluation-2026-08-09.mapping.json"), "utf8"));

const pool = [...content.items, ...theses.items];
const byUrl = new Map(pool.map((it) => [it.url, it]));

// -----------------------------------------------------------------------------
// Kopio: normalizeTerm + intersectionCount (eleventy.filters.js:26-77)
// -----------------------------------------------------------------------------

function toArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function normalizeTerm(v) {
  return String(v == null ? "" : v)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeTerms(values) {
  return new Set(toArray(values).map(normalizeTerm).filter(Boolean));
}

function intersectionCount(values, wanted) {
  return toArray(values).reduce((count, v) => (
    wanted.has(normalizeTerm(v)) ? count + 1 : count
  ), 0);
}

// -----------------------------------------------------------------------------
// Metadata-score (kopio eleventy.filters.js:1011-1018)
// -----------------------------------------------------------------------------

function metadataScoreFor(anchor, item) {
  const wantedCat = normalizeTerms(anchor.categories);
  const wantedKw = normalizeTerms(anchor.keywords);
  const wantedCtx = normalizeTerms(anchor.contexts);
  const wantedType = String(anchor.contentType || "");

  const catScore = intersectionCount(item.categories, wantedCat) * 5;
  const kwScore = intersectionCount(item.keywords, wantedKw) * 3;
  const tagScore = intersectionCount(item.tags, normalizeTerms([])) * 2; // tags puuttuu content.jsonista
  const ctxScore = intersectionCount(item.contexts, wantedCtx) * 4;
  const typeScore = wantedType && item.contentType === wantedType ? 2 : 0;
  return catScore + kwScore + tagScore + ctxScore + typeScore;
}

// -----------------------------------------------------------------------------
// Kaavat
// -----------------------------------------------------------------------------

function rankBaseline(anchor, candidates) {
  return candidates
    .map((it) => ({ item: it, score: metadataScoreFor(anchor, it), sim: 0 }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

function rankH0(anchor, candidates, simByUrl) {
  return candidates
    .map((it) => {
      const meta = metadataScoreFor(anchor, it);
      const sim = simByUrl.get(it.url) || 0;
      const boost = sim >= 0.6 ? sim * 5 : 0;
      return { item: it, score: meta + boost, sim, meta, boost };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

function rankH1(anchor, candidates, simByUrl) {
  return candidates
    .map((it) => {
      const meta = metadataScoreFor(anchor, it);
      const sim = simByUrl.get(it.url) || 0;
      const boost = sim >= 0.6 ? sim * 8 : 0;
      return { item: it, score: meta + boost, sim, meta, boost };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}

function normalized(vals) {
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  if (max === min) return vals.map(() => 0);
  return vals.map((v) => (v - min) / (max - min));
}

function rankNormalized(anchor, candidates, simByUrl, weightMeta) {
  // Laske meta+sim jokaiselle candidatille, normalisoi molemmat, painota
  const rows = candidates.map((it) => ({
    item: it,
    meta: metadataScoreFor(anchor, it),
    sim: simByUrl.get(it.url) || 0
  }));
  // Vain candidatit joilla on _jotain_ signaalia (meta > 0 tai sim > 0.3 esim.)
  const pruned = rows.filter((r) => r.meta > 0 || r.sim >= 0.5);
  if (pruned.length === 0) return [];
  const metaNorm = normalized(pruned.map((r) => r.meta));
  const simNorm = normalized(pruned.map((r) => r.sim));
  return pruned
    .map((r, i) => ({
      item: r.item,
      meta: r.meta,
      sim: r.sim,
      score: weightMeta * metaNorm[i] + (1 - weightMeta) * simNorm[i]
    }))
    .sort((a, b) => b.score - a.score);
}

// -----------------------------------------------------------------------------
// Analyysi
// -----------------------------------------------------------------------------

const TOP_N = 4;
const FORMULAS = ["BASELINE", "H0", "H1", "H2", "H3"];

function overlap(a, b) {
  const setB = new Set(b);
  return a.filter((u) => setB.has(u)).length;
}

function anchorsWith(url) {
  return evalData.evaluations.find((e) => e.anchor.url === url);
}

function mappingFor(url) {
  return mappingData.mappings.find((m) => m.url === url)?.mapping || null;
}

function claudeCRelForUrl(anchorUrl, candidateUrl) {
  // Palauta Clauden relevance (0-3) tälle candidateUrl:lle jos se oli C-listassa
  const map = mappingFor(anchorUrl);
  if (!map) return null;
  const cLabel = Object.entries(map).find(([label, method]) => method === "C")?.[0];
  if (!cLabel) return null;
  const ev = anchorsWith(anchorUrl);
  const evClaude = claudeData.evaluations.find((e) => e.anchor.url === anchorUrl);
  if (!ev || !evClaude) return null;
  const idx = ev.sets[cLabel].findIndex((r) => r.url === candidateUrl);
  if (idx === -1) return null;
  return evClaude.arvioinnit[cLabel].relevance[idx];
}

console.log("\n=== v4.4 Offline hybrid-vertailu ===\n");
console.log(`Anchoreita: ${evalData.evaluations.length}, candidate-pool: ${pool.length}\n`);

const perFormulaMetrics = {};
FORMULAS.forEach((f) => {
  perFormulaMetrics[f] = {
    changed: 0,       // top-4 muuttuu vs baseline
    overlapSum: 0,    // overlap@4 vs baseline
    novelInTop4: 0,   // tuloksia jotka baseline ei tuottanut
    relevantNovel: 0, // uusia + relevantti (Claude >= 2)
    strongMetaDrops: 0, // baselinen vahvat metadata-hit:t (score >= 8) putoavat
    n: 0
  };
});

const examples = {};

evalData.evaluations.forEach((ev) => {
  const anchorUrl = ev.anchor.url;
  const anchor = byUrl.get(anchorUrl);
  if (!anchor) return;

  const semList = semRelated[anchorUrl] || [];
  const simByUrl = new Map(semList.map((s) => [s.url, s.sim]));

  const candidates = pool.filter((it) => it.url !== anchorUrl);

  const rankings = {
    BASELINE: rankBaseline(anchor, candidates).slice(0, TOP_N),
    H0: rankH0(anchor, candidates, simByUrl).slice(0, TOP_N),
    H1: rankH1(anchor, candidates, simByUrl).slice(0, TOP_N),
    H2: rankNormalized(anchor, candidates, simByUrl, 0.5).slice(0, TOP_N),
    H3: rankNormalized(anchor, candidates, simByUrl, 0.6).slice(0, TOP_N)
  };

  const baselineUrls = rankings.BASELINE.map((r) => r.item.url);
  const baselineStrong = new Set(
    rankings.BASELINE.filter((r) => r.score >= 8).map((r) => r.item.url)
  );

  FORMULAS.forEach((f) => {
    const urls = rankings[f].map((r) => r.item.url);
    const m = perFormulaMetrics[f];
    m.n++;
    const ovl = overlap(baselineUrls, urls);
    m.overlapSum += ovl;
    if (ovl < baselineUrls.length) m.changed++;
    const novel = urls.filter((u) => !baselineUrls.includes(u));
    m.novelInTop4 += novel.length;
    novel.forEach((u) => {
      const rel = claudeCRelForUrl(anchorUrl, u);
      if (rel !== null && rel >= 2) m.relevantNovel++;
    });
    baselineStrong.forEach((u) => { if (!urls.includes(u)) m.strongMetaDrops++; });
  });

  // Tallenna esimerkit
  const isExample = /scaffolding/i.test(ev.anchor.title) ||
    /valkea savu/i.test(ev.anchor.title) ||
    /sivistyslautakunnan uusi alku/i.test(ev.anchor.title) ||
    /opettajaopiskelijoiden tekoälytaidot/i.test(ev.anchor.title);
  if (isExample) {
    examples[ev.anchor.title.substring(0, 60)] = {
      anchor: ev.anchor,
      rankings: Object.fromEntries(FORMULAS.map((f) => [f, rankings[f].map((r) => ({
        url: r.item.url,
        title: r.item.title,
        contentType: r.item.contentType,
        meta: r.meta ?? r.score,
        sim: r.sim,
        score: Number(r.score.toFixed(3))
      }))]))
    };
  }
});

// -----------------------------------------------------------------------------
// Tulosta yhteenveto
// -----------------------------------------------------------------------------

console.log("Kaava      | Muuttuu | Ovl@4 | Novel/anchor | RelNovel | StrongDrop");
console.log("-----------|---------|-------|--------------|----------|------------");
FORMULAS.forEach((f) => {
  const m = perFormulaMetrics[f];
  const chgPct = m.n ? Math.round(m.changed / m.n * 100) : 0;
  const ovlAvg = m.n ? (m.overlapSum / m.n).toFixed(2) : "?";
  const novelAvg = m.n ? (m.novelInTop4 / m.n).toFixed(2) : "?";
  console.log(
    `${f.padEnd(10)} | ${String(chgPct).padStart(6)}% | ${ovlAvg.padStart(5)} | ${novelAvg.padStart(12)} | ${String(m.relevantNovel).padStart(8)} | ${String(m.strongMetaDrops).padStart(10)}`
  );
});

console.log("\nSelitteet:");
console.log("  Muuttuu       — kuinka moni top-4 muuttuu vs baseline (nykyinen metadata)");
console.log("  Ovl@4         — keskim. yhteisiä tuloksia baselineen (max 4)");
console.log("  Novel/anchor  — uusia (baseline ei tuottanut) tuloksia top-4:ssä");
console.log("  RelNovel      — uusista tuloksista relevantiksi arvioidut (Claude C-lista, rel >= 2)");
console.log("  StrongDrop    — baselinen vahva (score >= 8) tulos putoaa pois");

// -----------------------------------------------------------------------------
// Esimerkit
// -----------------------------------------------------------------------------

Object.entries(examples).forEach(([title, ex]) => {
  console.log("\n\n" + "=".repeat(70));
  console.log(`ANCHOR: ${title}`);
  console.log(`  contentType=${ex.anchor.contentType} year=${ex.anchor.year || "?"} rich=${ex.anchor.richness}`);
  console.log("=".repeat(70));
  FORMULAS.forEach((f) => {
    console.log(`\n  --- ${f} top-4 ---`);
    if (ex.rankings[f].length === 0) {
      console.log("    (tyhjä)");
      return;
    }
    ex.rankings[f].forEach((r, i) => {
      const simStr = r.sim ? ` sim=${r.sim.toFixed(3)}` : "";
      const scoreStr = ` [score=${r.score}]`;
      console.log(`    ${i+1}. [${r.contentType}]${scoreStr}${simStr} ${r.title.substring(0, 55)}`);
    });
  });
});

// Tallenna JSON-esimerkit tarkempaa katselua varten
const outFile = path.join(ROOT, "scripts", "evaluation-results", "hybrid-comparison-2026-08-09.json");
fs.writeFileSync(outFile, JSON.stringify({
  metrics: perFormulaMetrics,
  examples
}, null, 2));
console.log(`\n\nEsimerkit tallennettu: ${path.relative(ROOT, outFile)}`);

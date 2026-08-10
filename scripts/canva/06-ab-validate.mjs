#!/usr/bin/env node
/**
 * Vaihe 5.6 — A/B-validointi: Canva-rich embedding vs. fallback.
 *
 * Per anchor:
 *   A = title + description + keywords          (vanha, ilman rich)
 *   B = title + richSummary + themes + keywords (uusi, canva-rich)
 *
 * Laske Ollamalla molemmat vektorit → top-5 semantic neighbors koko cache-
 * poolissa (634 itemiä). Vertaa: overlap@5, novel@5, cross-content, sisällöllinen
 * relevanssi.
 *
 * KÄYTTÖ:
 *   node scripts/canva/06-ab-validate.mjs
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { loadEnv, ROOT_DIR } from "./_lib/env.mjs";

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_META = path.join(ROOT_DIR, ".cache", "api-fallback", "embeddings-bge-m3-v1.meta.json");
const CACHE_F32 = path.join(ROOT_DIR, ".cache", "api-fallback", "embeddings-bge-m3-v1.f32");
const SLUG_MAP = path.join(ROOT_DIR, "data", "canva", "content-slug-to-designid.json");
const RICH = path.join(ROOT_DIR, "src", "_data", "canva-presentations-rich.json");
const CONTENT = path.join(ROOT_DIR, "_site", "data", "content.json");

const MODEL = "bge-m3";
const TOP_N = 5;

// -----------------------------------------------------------------------------
// Data
// -----------------------------------------------------------------------------

const contentPool = JSON.parse(fs.readFileSync(CONTENT, "utf8")).items;
const theses = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "_site", "data", "theses.json"), "utf8")).items;
const titleByUrl = new Map();
[...contentPool, ...theses].forEach((it) => { if (it.url) titleByUrl.set(it.url, it.title || ""); });
const slugMap = JSON.parse(fs.readFileSync(SLUG_MAP, "utf8"));
const rich = JSON.parse(fs.readFileSync(RICH, "utf8"));
const richByDesignId = new Map(rich.items.map((r) => [r.designId, r]));

// Cache lataus (Float32 binary)
const meta = JSON.parse(fs.readFileSync(CACHE_META, "utf8"));
const buf = fs.readFileSync(CACHE_F32);
const dims = meta.dimensions;
const cacheByUrl = new Map();
meta.items.forEach((it) => {
  const vec = new Float32Array(dims);
  for (let j = 0; j < dims; j++) vec[j] = buf.readFloatLE((it.offset * dims + j) * 4);
  cacheByUrl.set(it.url, { vec, contentType: it.contentType, title: titleByUrl.get(it.url) || it.url });
});
console.log(`[cache] ${cacheByUrl.size} embedding-vektoria`);

// -----------------------------------------------------------------------------
// Ollama
// -----------------------------------------------------------------------------

function ollamaEmbed(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ model: MODEL, input: text });
    const req = http.request({
      hostname: "127.0.0.1", port: 11434, path: "/api/embed", method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) }
    }, (res) => {
      let data = ""; res.on("data", (c) => data += c);
      res.on("end", () => {
        try { const j = JSON.parse(data); resolve(new Float32Array(j.embeddings?.[0] || j.embedding || [])); }
        catch (e) { reject(e); }
      });
    });
    req.on("error", reject); req.write(body); req.end();
  });
}

function cosine(a, b) {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; ma += a[i] * a[i]; mb += b[i] * b[i]; }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb));
}

// -----------------------------------------------------------------------------
// Input-rakennus
// -----------------------------------------------------------------------------

function buildInputA(item) {
  const parts = [item.title || "", item.description || ""].filter(Boolean);
  if (Array.isArray(item.keywords) && item.keywords.length) parts.push(`Avainsanat: ${item.keywords.join(", ")}`);
  return parts.join("\n\n");
}

function buildInputB(item, richData) {
  const parts = [item.title || ""];
  if (richData.richSummary) parts.push(richData.richSummary.trim());
  if (Array.isArray(richData.themes) && richData.themes.length) parts.push(`Teemat: ${richData.themes.join(", ")}`);
  if (Array.isArray(item.keywords) && item.keywords.length) parts.push(`Avainsanat: ${item.keywords.join(", ")}`);
  return parts.join("\n\n");
}

// -----------------------------------------------------------------------------
// Anchors — valitse edustavat Canva-esitykset
// -----------------------------------------------------------------------------

const anchors = [];
const themesSeen = new Set();
for (const [contentUrl, entry] of Object.entries(slugMap)) {
  if (!entry || !entry.designId) continue;
  const r = richByDesignId.get(entry.designId);
  if (!r || r.confidence === "low") continue;
  const item = contentPool.find((c) => c.url === contentUrl);
  if (!item) continue;
  // Diversitetti-heuristiikka: valitse esityksiä eri themes-yhdistelmillä
  const themeKey = (r.themes || []).slice(0, 2).sort().join(",");
  const already = themesSeen.has(themeKey);
  anchors.push({ item, richData: r, priority: already ? 2 : 1 });
  themesSeen.add(themeKey);
}
// Priorisoi uniikkeja themes-yhdistelmiä
anchors.sort((a, b) => a.priority - b.priority);
const ANCHORS = anchors.slice(0, 8);
console.log(`[anchors] ${ANCHORS.length} valittu (${anchors.length} saatavilla)\n`);

// -----------------------------------------------------------------------------
// Laske top-5 semantic neighbors
// -----------------------------------------------------------------------------

function topN(anchorVec, anchorUrl) {
  const scored = [];
  for (const [url, entry] of cacheByUrl) {
    if (url === anchorUrl) continue;
    const sim = cosine(anchorVec, entry.vec);
    scored.push({ url, sim, contentType: entry.contentType, title: entry.title });
  }
  scored.sort((a, b) => b.sim - a.sim);
  return scored.slice(0, TOP_N);
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

const results = [];
let totalOverlap = 0, totalNovel = 0;
const crossContent = { A: {}, B: {} };
let aWins = 0, bWins = 0, ties = 0;

console.log("Lasketaan A/B-embeddings + top-5 neighbors 8 anchor:lle...\n");

for (const { item, richData } of ANCHORS) {
  const inputA = buildInputA(item);
  const inputB = buildInputB(item, richData);
  const vecA = await ollamaEmbed(inputA);
  const vecB = await ollamaEmbed(inputB);

  const topA = topN(vecA, item.url);
  const topB = topN(vecB, item.url);

  const urlsA = new Set(topA.map((r) => r.url));
  const urlsB = new Set(topB.map((r) => r.url));
  const overlap = [...urlsA].filter((u) => urlsB.has(u)).length;
  const novel = [...urlsB].filter((u) => !urlsA.has(u)).length;
  totalOverlap += overlap;
  totalNovel += novel;

  // Cross-content
  topA.forEach((r) => { crossContent.A[r.contentType] = (crossContent.A[r.contentType] || 0) + 1; });
  topB.forEach((r) => { crossContent.B[r.contentType] = (crossContent.B[r.contentType] || 0) + 1; });

  results.push({ item, richData, inputA, inputB, topA, topB, overlap, novel });

  console.log(`\n=== ANCHOR: ${item.title} ===`);
  console.log(`  A input: ${inputA.length} mk | B input: ${inputB.length} mk`);
  console.log(`  overlap@5: ${overlap}, novel@5 (B ei A:ssa): ${novel}`);
  console.log(`  --- A (fallback) top-5 ---`);
  topA.forEach((r, i) => {
    const marker = urlsB.has(r.url) ? "=" : "·";
    console.log(`  ${marker} ${(i + 1)}. [${r.contentType}] ${r.sim.toFixed(3)}  ${r.title.substring(0, 60)}`);
  });
  console.log(`  --- B (canva-rich) top-5 ---`);
  topB.forEach((r, i) => {
    const marker = urlsA.has(r.url) ? "=" : "★";
    console.log(`  ${marker} ${(i + 1)}. [${r.contentType}] ${r.sim.toFixed(3)}  ${r.title.substring(0, 60)}`);
  });
}

// -----------------------------------------------------------------------------
// Yhteenveto
// -----------------------------------------------------------------------------

console.log("\n\n========================================");
console.log("YHTEENVETO");
console.log("========================================");
console.log(`Anchoreita: ${ANCHORS.length}`);
console.log(`Mean overlap@5: ${(totalOverlap / ANCHORS.length).toFixed(2)}`);
console.log(`Mean novel@5:   ${(totalNovel / ANCHORS.length).toFixed(2)}`);
console.log("\nCross-content -jakauma top-5:ssä:");
console.log("             A (vanha)  B (rich)");
const types = [...new Set([...Object.keys(crossContent.A), ...Object.keys(crossContent.B)])].sort();
types.forEach((t) => {
  console.log(`  ${t.padEnd(22)} ${String(crossContent.A[t] || 0).padStart(4)}      ${String(crossContent.B[t] || 0).padStart(4)}`);
});

// Kirjoita täys raportti
const OUT_FILE = path.join(ROOT_DIR, "data", "canva", "ab-validation-report.json");
fs.writeFileSync(OUT_FILE, JSON.stringify({
  generatedAt: new Date().toISOString(),
  anchors: ANCHORS.length,
  meanOverlap: totalOverlap / ANCHORS.length,
  meanNovel: totalNovel / ANCHORS.length,
  crossContent,
  results: results.map((r) => ({
    title: r.item.title, url: r.item.url,
    inputAChars: r.inputA.length, inputBChars: r.inputB.length,
    overlap: r.overlap, novel: r.novel,
    topA: r.topA, topB: r.topB
  }))
}, null, 2) + "\n");
console.log(`\n[write] ${path.relative(ROOT_DIR, OUT_FILE)}`);

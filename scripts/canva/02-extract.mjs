#!/usr/bin/env node
/**
 * Canva Content Pipeline — Vaihe 2: PDF-export + tekstinpoiminta.
 *
 * Per confirmed-mapping-tietue:
 *   1. Cache-check data/canva/cache/{designId}.json
 *   2. POST /v1/exports (format=pdf)
 *   3. Poll GET /v1/exports/{id} kunnes success/failed
 *   4. Lataa PDF → data/canva/tmp/{designId}.pdf (transient)
 *   5. pdftotext (poppler-utils) sivukohtaisesti
 *   6. Kirjoita cache-tekstitiedosto
 *   7. Poista temp-PDF (paitsi --keep-pdf)
 *
 * PDF on TRANSIENT — ei julkaista sivustolla, ei committoida, poistetaan
 * onnistuneen tekstinpoiminnan jälkeen.
 *
 * KÄYTTÖ:
 *   node scripts/canva/02-extract.mjs                    # kaikki confirmed
 *   node scripts/canva/02-extract.mjs --design DAGxxxxxx # yksi
 *   node scripts/canva/02-extract.mjs --force            # ohita cache
 *   node scripts/canva/02-extract.mjs --dry-run          # ei API-kutsuja
 *   node scripts/canva/02-extract.mjs --keep-pdf         # säilytä temp-PDF
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { loadEnv, ROOT_DIR } from "./_lib/env.mjs";
import { apiFetch, apiGet } from "./_lib/canva-api.mjs";
import { getAccessToken } from "./_lib/canva-auth.mjs";

loadEnv();

const DATA_DIR = path.join(ROOT_DIR, "data", "canva");
const CACHE_DIR = path.join(DATA_DIR, "cache");
const TMP_DIR = path.join(DATA_DIR, "tmp");
const MAP_FILE = path.join(DATA_DIR, "id-map.json");

const argv = process.argv.slice(2);
const designArg = argv.find((a) => a.startsWith("--design="));
const DESIGN_ID = designArg ? designArg.slice("--design=".length) : (argv.includes("--design") ? argv[argv.indexOf("--design") + 1] : null);
const isDryRun = argv.includes("--dry-run");
const forceRefresh = argv.includes("--force");
const keepPdf = argv.includes("--keep-pdf");

const EXPORT_POLL_INITIAL_MS = 2000;
const EXPORT_POLL_MAX_MS = 30_000;
const EXPORT_TIMEOUT_MS = 5 * 60_000;

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function createExport(designId) {
  const token = await getAccessToken();
  const res = await fetch("https://api.canva.com/rest/v1/exports", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      design_id: designId,
      format: { type: "pdf" }
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Canva POST /exports → HTTP ${res.status}: ${text.substring(0, 200)}`);
  }
  return res.json();
}

async function pollExport(exportId) {
  const started = Date.now();
  let delay = EXPORT_POLL_INITIAL_MS;
  while (true) {
    if (Date.now() - started > EXPORT_TIMEOUT_MS) {
      throw new Error(`Export aikakatkaisu ${EXPORT_TIMEOUT_MS / 1000}s`);
    }
    const data = await apiGet(`/exports/${encodeURIComponent(exportId)}`);
    const status = data.job?.status || data.status;
    if (status === "success") return data.job || data;
    if (status === "failed") {
      throw new Error(`Export failed: ${JSON.stringify(data.job?.error || data.error || {})}`);
    }
    await sleep(delay);
    delay = Math.min(Math.round(delay * 1.5), EXPORT_POLL_MAX_MS);
  }
}

async function downloadTo(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
  return buf.length;
}

/**
 * pdftotext sivukohtaisesti. Käytetään -layout (parempi visuaalinen järjestys)
 * ja -f/-l per sivu. Vaihtoehtoisesti voisi käyttää form-feed erotinta koko
 * dokumentin ulostulossa, mutta -f/-l on turvallisempi (varmistaa että
 * sivumäärä on oikea).
 */
function pdftotextPage(pdfPath, pageNumber) {
  return new Promise((resolve, reject) => {
    const proc = spawn("pdftotext", ["-layout", "-f", String(pageNumber), "-l", String(pageNumber), pdfPath, "-"]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => { stdout += d.toString("utf8"); });
    proc.stderr.on("data", (d) => { stderr += d.toString("utf8"); });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(`pdftotext code=${code} ${stderr}`));
      else resolve(stdout.trim());
    });
  });
}

function pdfPageCount(pdfPath) {
  return new Promise((resolve, reject) => {
    const proc = spawn("pdfinfo", [pdfPath]);
    let stdout = "";
    proc.stdout.on("data", (d) => { stdout += d.toString("utf8"); });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(`pdfinfo code=${code}`));
      const m = stdout.match(/^Pages:\s+(\d+)/m);
      resolve(m ? Number(m[1]) : 0);
    });
  });
}

function readCache(designId) {
  const file = path.join(CACHE_DIR, `${designId}.json`);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function writeCache(designId, data) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${designId}.json`);
  const tmp = file + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  fs.renameSync(tmp, file);
}

async function extractOne(item, { keepPdf: kp = false } = {}) {
  const designId = item.user.designId;
  const site = item.site;
  const started = Date.now();

  // Cache check — sourceUpdatedAt vs. Canva updated_at (candidateista)
  const cand = item.candidates.find((c) => c.designId === designId);
  const canvaUpdatedAt = cand?.updatedAt || 0;
  const cache = readCache(designId);
  if (!forceRefresh && cache && cache.sourceUpdatedAt === canvaUpdatedAt && cache.slides?.length > 0) {
    console.log(`  [cache] ${designId} ${site.title.substring(0, 50)}... (${cache.pageCount} diaa, ei muuttunut)`);
    return { designId, status: "cached", slides: cache.slides.length };
  }

  if (isDryRun) {
    console.log(`  [dry-run] ${designId} ${site.title.substring(0, 50)}...`);
    return { designId, status: "dry-run" };
  }

  // Export job
  const jobRes = await createExport(designId);
  const exportId = jobRes.job?.id || jobRes.id;
  const job = await pollExport(exportId);
  const urls = job.urls || (job.exports || []).map((e) => e.url).filter(Boolean);
  const downloadUrl = urls[0];
  if (!downloadUrl) throw new Error("Ei download-URLia export-vastauksesta");

  // Download
  fs.mkdirSync(TMP_DIR, { recursive: true });
  const pdfPath = path.join(TMP_DIR, `${designId}.pdf`);
  const bytes = await downloadTo(downloadUrl, pdfPath);

  // Extract text per page
  const pageCount = await pdfPageCount(pdfPath);
  const slides = [];
  const emptyPages = [];
  for (let p = 1; p <= pageCount; p++) {
    const text = await pdftotextPage(pdfPath, p);
    slides.push({ page: p, text, ocrUsed: false });
    if (!text || text.trim().length === 0) emptyPages.push(p);
  }

  // Cache
  const cacheData = {
    designId,
    sourceUpdatedAt: canvaUpdatedAt,
    extractedAt: new Date().toISOString(),
    pageCount,
    slides,
    emptyPages,
    extractError: null,
    _diagnostic: {
      pdfBytes: bytes,
      elapsedMs: Date.now() - started
    }
  };
  writeCache(designId, cacheData);

  // Poista PDF (transient)
  if (!kp) fs.unlinkSync(pdfPath);

  return { designId, status: "ok", slides: slides.length, emptyPages, bytes, elapsedMs: Date.now() - started };
}

function pickPilot(items) {
  const candidates = items
    .filter((it) => it.user?.status === "confirmed" && it.user?.designId)
    .map((it) => {
      const c = it.candidates.find((c) => c.designId === it.user.designId);
      return { it, pageCount: c?.pageCount || 0 };
    })
    .filter(({ pageCount }) => pageCount >= 15 && pageCount <= 20);
  return candidates[0]?.it || null;
}

async function main() {
  if (!fs.existsSync(MAP_FILE)) {
    console.error("id-map.json puuttuu. Aja ensin: node scripts/canva/01-map-ids.mjs ja review-server.");
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
  const items = data.items;

  let targets;
  if (DESIGN_ID) {
    const found = items.find((it) => it.user?.designId === DESIGN_ID);
    if (!found) {
      console.error(`--design ${DESIGN_ID} ei löydy confirmed-riveistä`);
      process.exit(1);
    }
    targets = [found];
  } else {
    // Kaikki confirmed
    targets = items.filter((it) => it.user?.status === "confirmed" && it.user?.designId);
  }

  if (targets.length === 0) {
    console.log("Ei confirmed-tietueita.");
    return;
  }

  console.log(`\n=== Canva Content Pipeline — Vaihe 2: PDF-export + tekstinpoiminta ===`);
  console.log(`Kohteita: ${targets.length}${DESIGN_ID ? " (--design)" : " (kaikki confirmed)"}\n`);

  const results = { ok: 0, cached: 0, failed: 0, dry: 0 };
  for (const item of targets) {
    try {
      const r = await extractOne(item, { keepPdf });
      results[r.status === "ok" ? "ok" : r.status === "cached" ? "cached" : "dry"]++;
      if (r.status === "ok") {
        console.log(`  ✓ ${r.designId} ${item.site.title.substring(0, 50)}... (${r.slides} diaa, ${r.emptyPages?.length || 0} tyhjää, ${(r.bytes / 1024).toFixed(1)} KB, ${(r.elapsedMs / 1000).toFixed(1)}s)`);
      }
    } catch (e) {
      results.failed++;
      console.log(`  ✗ ${item.user.designId} ${item.site.title.substring(0, 50)}... VIRHE: ${e.message}`);
    }
  }

  console.log(`\nYhteenveto: ${results.ok} onnistui, ${results.cached} cached, ${results.dry} dry-run, ${results.failed} epäonnistui\n`);
}

main().catch((err) => {
  console.error("VIRHE:", err.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * verify-presentation-custom-records.js
 *
 * Varmistaa etta jokainen external-first canonical esitys (landingType
 * === "externalSource") loytyy rakennetusta Pagefind-indeksista.
 *
 * Pagefind indeksoi local-first-esitykset HTML-dokumenteista ja
 * external-first-esitykset addCustomRecord-kutsuilla joita
 * scripts/run-pagefind.js tekee postbuild-vaiheessa. Tama skripti
 * kutsuu valmista Pagefind-indeksia Node API:n kautta ja assertoi
 * etta jokainen external-first-esityksen canonical PresentationId
 * esiintyy vahintaan yhdessa hakutuloksessa. Puuttuvat kaataa.
 *
 * Kaytto: node scripts/verify-presentation-custom-records.js
 * Vaatii: _site/pagefind/ (aja ensin `npm run build:no-og`)
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const SITE_ROOT = path.join(process.cwd(), "_site");
const PAGEFIND_DIR = path.join(SITE_ROOT, "pagefind");
const PAGEFIND_FRAGMENT_DIR = path.join(PAGEFIND_DIR, "fragment");
const PRESENTATIONS_PAGE_JSON = path.join(SITE_ROOT, "data", "presentations-page.json");

function log(...args) {
  console.error("[verify-pagefind-presentations]", ...args);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function canonicalPresentationId(item) {
  if (item.id) return String(item.id);
  return [
    item.sourceKey || "",
    item.sourceUrl || item.externalUrl || item.url || item.localPageUrl || item.pageUrl || "",
    item.title || ""
  ].join("|");
}

// Skannaa Pagefind:in fragment-tiedostot suoraan ja keraa PresentationId
// -> {url, count, langs}. Pagefind API:n filter-mode + noWorker jattaa
// tuloksia palauttamatta (havaittu 199/215), joten skannaamme raakadataa
// jotta katetaan 100% custom-record + local-first-fragmenteista.
function collectPresentationIdsFromFragments() {
  if (!fs.existsSync(PAGEFIND_FRAGMENT_DIR)) {
    throw new Error(
      `Pagefind fragment -hakemisto puuttuu: ${PAGEFIND_FRAGMENT_DIR}\n` +
      `Aja ensin: npm run build:no-og`
    );
  }

  const files = fs.readdirSync(PAGEFIND_FRAGMENT_DIR).filter((name) => name.endsWith(".pf_fragment"));
  const ids = new Map();

  for (const file of files) {
    const filePath = path.join(PAGEFIND_FRAGMENT_DIR, file);
    const buffer = fs.readFileSync(filePath);
    const decompressed = zlib.gunzipSync(buffer).toString("utf8");
    // Pagefind:in fragment-formaatti alkaa "pagefind_dcd" -prefix:illa
    // ja jatkaa JSON-payload:illa. Etsimme ensimmaisen "{" ja parsaame
    // sen loppuun.
    const jsonStart = decompressed.indexOf("{");
    if (jsonStart < 0) continue;
    let payload;
    try {
      payload = JSON.parse(decompressed.slice(jsonStart));
    } catch (error) {
      continue;
    }
    const filters = payload?.filters || {};
    const findExplore = Array.isArray(filters.FindExplore) ? filters.FindExplore : [];
    if (!findExplore.includes("presentations")) continue;

    const pid = String(payload?.meta?.PresentationId || "").trim();
    if (!pid) continue;
    const language = /^en_/.test(file) ? "en" : "fi";

    if (!ids.has(pid)) {
      ids.set(pid, {
        url: payload.url || "",
        count: 0,
        langs: new Set(),
        landingType: payload?.meta?.PresentationLandingType || ""
      });
    }
    const entry = ids.get(pid);
    entry.count += 1;
    entry.langs.add(language);
  }

  return ids;
}

async function main() {
  if (!fs.existsSync(PRESENTATIONS_PAGE_JSON)) {
    throw new Error(`Puuttuu: ${PRESENTATIONS_PAGE_JSON}. Aja: npm run build:no-og`);
  }

  const pageJson = readJson(PRESENTATIONS_PAGE_JSON);
  const items = Array.isArray(pageJson.items) ? pageJson.items : [];
  const externalFirst = items.filter((item) => item.landingType === "externalSource");
  log(`Kanoniset esitykset: ${items.length}, external-first: ${externalFirst.length}`);

  const merged = collectPresentationIdsFromFragments();

  log(`Pagefind-fragmentteja joilla FindExplore:presentations + PresentationId: ${merged.size}`);

  const missing = [];
  const duplicates = [];
  for (const item of externalFirst) {
    const expectedId = canonicalPresentationId(item);
    const found = merged.get(expectedId);
    if (!found) {
      missing.push({
        canonicalPresentationId: expectedId,
        title: item.title || "",
        landingUrl: item.landingUrl || item.url || "",
        sourceKey: item.sourceKey || "",
        sourceType: item.sourceType || ""
      });
      continue;
    }
    if (found.count > 1) {
      duplicates.push({
        canonicalPresentationId: expectedId,
        title: item.title || "",
        count: found.count,
        langs: [...found.langs]
      });
    }
  }

  const summary = {
    externalFirstTotal: externalFirst.length,
    pagefindPresentationIdTotal: merged.size,
    missingCount: missing.length,
    duplicateCount: duplicates.length,
    missing,
    duplicates
  };

  console.log(JSON.stringify(summary, null, 2));

  if (missing.length > 0) {
    log(`ERROR: ${missing.length} external-first-esitys puuttuu Pagefind-indeksista`);
    process.exit(1);
  }
  if (duplicates.length > 0) {
    log(`INFO: ${duplicates.length} esitys esiintyy useasti (yleensa FI+EN custom-recordit, ei virhe)`);
  }
  log(`OK: kaikki ${externalFirst.length} external-first-esitysta osuvat Pagefind-indeksiin`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

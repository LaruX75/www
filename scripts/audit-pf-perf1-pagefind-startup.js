#!/usr/bin/env node
/**
 * PF-PERF1 — Pagefind Startup Performance Audit (static)
 *
 * Read-only inspection of the built `_site/` to answer the PF-PERF1
 * decision: is Pagefind / Find & Explore startup demonstrably too slow
 * after PF2 → PF3 → PF-STARTER-CHIPS → PF4?
 *
 * The script does NOT change production code or add runtime
 * instrumentation. It measures:
 *
 * - Pagefind index page counts vs the known post-PF4 baseline
 * - JS asset inventory on each discovery surface
 * - shared bundle sizes
 * - reverse gates: starter-chips runtime must not auto-search;
 *   discovery renderers must not carry `data-pagefind-body`
 * - Pagefind loading pattern: does find-explore.js dynamically
 *   import the Pagefind runtime only on demand?
 *
 * Writes: docs/data/pf-perf1-pagefind-startup-audit-2026-08-16.json
 * Exits non-zero only on hard reverse-gate failures. Otherwise
 * green — the report contains the raw measurements for the audit
 * report to reason about.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const BUILT_ROOT = path.join(REPO_ROOT, "_site");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pf-perf1-pagefind-startup-audit-2026-08-16.json"
);

const DISCOVERY_PAGES = [
  { name: "Homepage", path: "index.html" },
  { name: "Tutkimus", path: "tutkimus/index.html" },
  { name: "Kirjoitukset", path: "kirjoitukset/index.html" },
  { name: "Opinnäytteet", path: "opinnaytteet/index.html" },
  { name: "Julkaisut", path: "julkaisut/index.html" },
  { name: "Esitykset", path: "esitykset/index.html" },
  { name: "Mediassa", path: "mediassa/index.html" },
  { name: "Haku", path: "haku/index.html" }
];

// Post-PF4 baseline expectations for the Pagefind index. Alert if the
// numbers drift sharply — a large drop usually means data-pagefind-body
// was reintroduced somewhere.
const EXPECTED_PAGEFIND = {
  fi: 1163,
  en: 346
};

const SHARED_JS_ASSETS = [
  "js/find-explore.js",
  "js/starter-chips.js",
  "js/presentations-page.js",
  "js/site-search-page.js",
  "js/content-engine.js",
  "js/content-presets.js",
  "js/pe-list-render.js",
  "pagefind/pagefind.js",
  "pagefind/pagefind-ui.js"
];

function readOrEmpty(rel) {
  const full = path.join(BUILT_ROOT, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

function bytesOrNull(rel) {
  const full = path.join(BUILT_ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return fs.statSync(full).size;
}

function extractScriptSrcs(html) {
  const rx = /<script[^>]*\bsrc="([^"]+)"[^>]*>/g;
  const out = [];
  let m;
  while ((m = rx.exec(html)) !== null) out.push(m[1]);
  return out;
}

function count(pattern, source) {
  const rx = new RegExp(pattern, "g");
  return (source.match(rx) || []).length;
}

function main() {
  const entryPath = path.join(BUILT_ROOT, "pagefind/pagefind-entry.json");
  const entry = fs.existsSync(entryPath) ? JSON.parse(fs.readFileSync(entryPath, "utf8")) : null;
  const fiPageCount = entry?.languages?.fi?.page_count ?? null;
  const enPageCount = entry?.languages?.en?.page_count ?? null;

  const findExploreSource = readOrEmpty("js/find-explore.js");
  const starterChipsSource = readOrEmpty("js/starter-chips.js");
  const presentationsPageSource = readOrEmpty("js/presentations-page.js");

  // Lazy Pagefind loading: find-explore.js must load Pagefind via
  // dynamic `await import(...)` (not top-level import) so an empty page
  // does not pay the wasm cost.
  const usesDynamicPagefindImport = /await\s+import\s*\(\s*`\/pagefind\/pagefind\.js/.test(findExploreSource);
  const definesCreateSearch = /function\s+createSearch\s*\(/.test(findExploreSource);
  const runsInitialSearchGuarded = /if\s*\(\s*!effectiveQuery\s*&&/.test(findExploreSource);

  // Starter chips must not auto-search (audit already exists in
  // scripts/audit-pf-starter-chips.js; repeat the reverse gate here so
  // this report is self-contained).
  const chipAutoSearchTokens = ["fetch(", "pagefind.search", "ContentEngine.query", "runSearch("];
  const chipAutoSearchLeaks = chipAutoSearchTokens.filter((t) => starterChipsSource.includes(t));

  // Discovery pages must not carry data-pagefind-body (M2 site-wide
  // gate guard remains critical for performance because reintroducing
  // it collapses the Pagefind index).
  const discoveryPagesWithBody = [];
  const perPage = [];
  for (const p of DISCOVERY_PAGES) {
    const html = readOrEmpty(p.path);
    const scripts = extractScriptSrcs(html);
    const hasPagefindBody = /data-pagefind-body/.test(html);
    const findExploreMounts = count("data-find-explore\\b", html);
    const starterChipGroups = count("data-starter-chips\\b", html);
    perPage.push({
      name: p.name,
      path: `/${p.path.replace(/index\.html$/, "")}`,
      scriptCount: scripts.length,
      scripts,
      findExploreMounts,
      starterChipGroups,
      hasPagefindBody
    });
    if (hasPagefindBody) discoveryPagesWithBody.push(p.path);
  }

  const assetSizes = Object.fromEntries(
    SHARED_JS_ASSETS.map((asset) => [asset, bytesOrNull(asset)])
  );

  const pagefindWasmSizes = {
    fi: bytesOrNull("pagefind/wasm.fi.pagefind"),
    en: bytesOrNull("pagefind/wasm.en.pagefind")
  };

  const gates = {
    pagefindEntryPresent: entry !== null,
    pagefindFiCountAtBaseline: fiPageCount === EXPECTED_PAGEFIND.fi,
    pagefindEnCountAtBaseline: enPageCount === EXPECTED_PAGEFIND.en,
    findExploreLazyLoadsPagefind: usesDynamicPagefindImport,
    findExploreCreateSearchDefined: definesCreateSearch,
    findExploreEarlyReturnsWhenIdle: runsInitialSearchGuarded,
    starterChipsRuntimeDoesNotAutoSearch: chipAutoSearchLeaks.length === 0,
    noDiscoveryPageCarriesPagefindBody: discoveryPagesWithBody.length === 0
  };

  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PF-PERF1 static Pagefind startup audit",
    baseline: EXPECTED_PAGEFIND,
    pagefindEntry: {
      fi: fiPageCount,
      en: enPageCount,
      version: entry?.version || null
    },
    pagefindWasmSizes,
    sharedAssetSizes: assetSizes,
    discoveryPages: perPage,
    starterChipsAutoSearchLeaks: chipAutoSearchLeaks,
    discoveryPagesWithPagefindBody: discoveryPagesWithBody,
    presentationsPagePresent: presentationsPageSource.length > 0,
    gates,
    gateFailures
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log(
    "pagefind page_count fi/en:",
    fiPageCount,
    "/",
    enPageCount,
    "(baseline",
    EXPECTED_PAGEFIND.fi,
    "/",
    EXPECTED_PAGEFIND.en,
    ")"
  );
  console.log(
    "shared JS: find-explore",
    assetSizes["js/find-explore.js"],
    "starter-chips",
    assetSizes["js/starter-chips.js"],
    "pagefind-ui",
    assetSizes["pagefind/pagefind-ui.js"]
  );
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main();

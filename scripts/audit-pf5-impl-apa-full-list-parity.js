#!/usr/bin/env node
/**
 * PF5-IMPL-APA — Full Pagefind Publications List Parity Audit
 *
 * After the publications archive migration:
 *   - The canonical publication set (56 items via publicationsPage) is
 *     the source of truth.
 *   - Pagefind projects each canonical publication as a detail page
 *     tagged with `FindExplore=publications` etc.
 *   - The FI (`/julkaisut/`) and EN (`/en/publications/`) hubs
 *     hold a `<script id="publicationFindExploreRecords">` array that
 *     the shared Find & Explore renderer joins to Pagefind results.
 *
 * This audit proves 1:1 identity between:
 *   canonical publication IDs
 *   Pagefind publication detail landing URLs
 *   Find & Explore record landing URLs on both hubs
 *
 * Reports missing / extra / duplicate / wrong landing URL — all four
 * must be 0 for closure.
 *
 * Read-only. Exits non-zero on any gate failure.
 *
 * Writes: docs/data/pf5-impl-apa-full-list-parity-2026-08-17.json
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pf5-impl-apa-full-list-parity-2026-08-17.json"
);
const PAGEFIND_DIR = path.join(REPO_ROOT, "_site", "pagefind");

function stripPagefindPrefix(text) {
  // Pagefind ≥1.5 prefixes fragment payloads with a magic tag; the
  // JSON body starts at the first `{`.
  const braceIdx = text.indexOf("{");
  return braceIdx > 0 ? text.slice(braceIdx) : text;
}

function readOrEmpty(rel) {
  const full = path.isAbsolute(rel) ? rel : path.join(REPO_ROOT, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

function readJson(rel, fallback) {
  const text = readOrEmpty(rel);
  if (!text) return fallback;
  try { return JSON.parse(text); } catch { return fallback; }
}

function extractRecordsFromHub(html) {
  const match = html.match(/<script[^>]+id="publicationFindExploreRecords"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return [];
  try { return JSON.parse(match[1]); } catch { return []; }
}

function normalizeUrl(url) {
  return String(url || "").replace(/\/+$/, "/");
}

function loadPagefindPublicationUrls() {
  if (!fs.existsSync(PAGEFIND_DIR)) return { ok: false, urls: [] };
  const filterFile = path.join(PAGEFIND_DIR, "filter", "publications.pf_filter");
  if (fs.existsSync(filterFile)) {
    try {
      const raw = fs.readFileSync(filterFile);
      const decoded = zlib.gunzipSync(raw).toString("utf8");
      return { ok: true, urls: extractUrlsFromRawFilter(decoded) };
    } catch (e) { /* fall through */ }
  }
  // Alternative: walk the Pagefind fragment index — each fragment records
  // a full URL. Slower but robust across Pagefind versions.
  const fragmentDir = path.join(PAGEFIND_DIR, "fragment");
  const urls = new Set();
  if (fs.existsSync(fragmentDir)) {
    walkFragments(fragmentDir, urls);
    return { ok: true, urls: [...urls] };
  }
  return { ok: false, urls: [] };
}

function walkFragments(dir, urls) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walkFragments(full, urls); continue; }
    if (!entry.name.endsWith(".pf_fragment")) continue;
    try {
      const raw = fs.readFileSync(full);
      const decoded = stripPagefindPrefix(zlib.gunzipSync(raw).toString("utf8"));
      // Pagefind fragments are JSON blobs (prefixed with a magic
      // `pagefind_dcd` tag); the top-level `url` is the canonical
      // landing URL.
      try {
        const parsed = JSON.parse(decoded);
        if (parsed && parsed.url) urls.add(parsed.url);
      } catch (e) { /* skip corrupt */ }
    } catch (e) { /* skip unreadable */ }
  }
}

function extractUrlsFromRawFilter(text) {
  // Best-effort text scrape — real Pagefind filter files are binary in
  // some versions. The .pf_filter format changes; we fall back to
  // fragment walking above when this is not reliable.
  const urls = new Set();
  const rx = /"(\/[^"]+)"/g;
  let m;
  while ((m = rx.exec(text)) !== null) urls.add(m[1]);
  return [...urls];
}

function loadPublicationsFromFragments() {
  const fragmentDir = path.join(PAGEFIND_DIR, "fragment");
  if (!fs.existsSync(fragmentDir)) return [];
  const publications = [];
  walkFragmentsAsPublications(fragmentDir, publications);
  return publications;
}

function walkFragmentsAsPublications(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walkFragmentsAsPublications(full, out); continue; }
    if (!entry.name.endsWith(".pf_fragment")) continue;
    try {
      const raw = fs.readFileSync(full);
      const decoded = stripPagefindPrefix(zlib.gunzipSync(raw).toString("utf8"));
      const parsed = JSON.parse(decoded);
      const filters = parsed?.filters || {};
      const findExplore = Array.isArray(filters.FindExplore) ? filters.FindExplore : [];
      if (findExplore.includes("publications")) {
        out.push({
          url: parsed.url,
          publicationsGroup: (filters["Publications group"] || [])[0] || "",
          publicationsYear: (filters["Publications year"] || [])[0] || ""
        });
      }
    } catch (e) { /* skip */ }
  }
}

function compareSets(canonical, subject) {
  const canonicalSet = new Set(canonical.map(normalizeUrl));
  const subjectSet = new Set(subject.map(normalizeUrl));
  const missing = [...canonicalSet].filter((u) => !subjectSet.has(u));
  const extra = [...subjectSet].filter((u) => !canonicalSet.has(u));
  const seen = new Set();
  const duplicates = [];
  for (const u of subject.map(normalizeUrl)) {
    if (seen.has(u)) duplicates.push(u);
    else seen.add(u);
  }
  return { missing, extra, duplicates };
}

function main() {
  // Canonical publication set (source of truth).
  const publicationsPage = readJson("_site/data/publications-page.json", { items: [] });
  const canonicalItems = publicationsPage.items || [];
  const canonicalUrls = canonicalItems.map((item) => item.pageUrl).filter(Boolean);

  // Find & Explore hub records.
  const fiHub = readOrEmpty("_site/julkaisut/index.html");
  const enHub = readOrEmpty("_site/en/publications/index.html");
  const fiRecords = extractRecordsFromHub(fiHub);
  const enRecords = extractRecordsFromHub(enHub);
  const fiUrls = fiRecords.map((r) => r.pageUrl).filter(Boolean);
  const enUrls = enRecords.map((r) => r.pageUrl).filter(Boolean);

  // Pagefind — walk fragments, filter FindExplore=publications.
  const pagefindPubs = loadPublicationsFromFragments();
  const pagefindUrls = pagefindPubs.map((p) => p.url).filter(Boolean);

  const fiParity = compareSets(canonicalUrls, fiUrls);
  const enParity = compareSets(canonicalUrls, enUrls);
  const pagefindParity = compareSets(canonicalUrls, pagefindUrls);

  const canonicalWithoutCsl = canonicalItems.filter((item) => !item.csl).map((item) => item.id);
  const fiRecordsWithoutCsl = fiRecords.filter((r) => !r.csl).map((r) => r.id);
  const enRecordsWithoutCsl = enRecords.filter((r) => !r.csl).map((r) => r.id);

  const groupCountsPagefind = pagefindPubs.reduce((acc, p) => {
    const g = p.publicationsGroup || "(none)";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const groupCountsCanonical = canonicalItems.reduce((acc, item) => {
    const g = item.publicationGroup || "(none)";
    acc[g] = (acc[g] || 0) + 1;
    return acc;
  }, {});

  const gates = {
    canonicalNonEmpty: canonicalUrls.length > 0,
    fiRecordsMatchCanonical: fiParity.missing.length === 0 && fiParity.extra.length === 0 && fiParity.duplicates.length === 0,
    enRecordsMatchCanonical: enParity.missing.length === 0 && enParity.extra.length === 0 && enParity.duplicates.length === 0,
    pagefindMatchesCanonical: pagefindParity.missing.length === 0 && pagefindParity.extra.length === 0 && pagefindParity.duplicates.length === 0,
    fiRecordsAllHaveCsl: fiRecordsWithoutCsl.length === 0,
    enRecordsAllHaveCsl: enRecordsWithoutCsl.length === 0,
    canonicalAllHaveCsl: canonicalWithoutCsl.length === 0,
    groupCountsAgree: (() => {
      const keys = new Set([...Object.keys(groupCountsCanonical), ...Object.keys(groupCountsPagefind)]);
      for (const k of keys) {
        if ((groupCountsCanonical[k] || 0) !== (groupCountsPagefind[k] || 0)) return false;
      }
      return true;
    })()
  };

  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PF5-IMPL-APA — canonical ↔ Pagefind ↔ hub records parity",
    counts: {
      canonical: canonicalUrls.length,
      fiHubRecords: fiRecords.length,
      enHubRecords: enRecords.length,
      pagefindPublicationFragments: pagefindPubs.length
    },
    parity: {
      fi: fiParity,
      en: enParity,
      pagefind: pagefindParity
    },
    csl: {
      canonicalMissing: canonicalWithoutCsl,
      fiRecordsMissing: fiRecordsWithoutCsl,
      enRecordsMissing: enRecordsWithoutCsl
    },
    groupCounts: {
      canonical: groupCountsCanonical,
      pagefind: groupCountsPagefind
    },
    gates,
    gateFailures
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log(`counts: canonical=${report.counts.canonical} fiHub=${report.counts.fiHubRecords} enHub=${report.counts.enHubRecords} pagefindFragments=${report.counts.pagefindPublicationFragments}`);
  console.log(`fi parity: missing=${fiParity.missing.length} extra=${fiParity.extra.length} dup=${fiParity.duplicates.length}`);
  console.log(`en parity: missing=${enParity.missing.length} extra=${enParity.extra.length} dup=${enParity.duplicates.length}`);
  console.log(`pagefind parity: missing=${pagefindParity.missing.length} extra=${pagefindParity.extra.length} dup=${pagefindParity.duplicates.length}`);
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main();

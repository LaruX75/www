#!/usr/bin/env node
/**
 * Publications archive parity audit for the current grouped SSR archive.
 *
 * Historical note:
 *   The filename is retained because earlier publication-list work used
 *   this audit slot during the PF5-IMPL-APA era. The current archive
 *   convergence branch no longer embeds `publicationFindExploreRecords`
 *   on the FI/EN publication hubs.
 *
 * This audit now proves parity between:
 *   canonical publications-page items
 *   FI grouped SSR publication archive rows
 *   EN grouped SSR publication archive rows
 *   Pagefind publication fragments
 *
 * It also verifies that:
 *   - the old embedded records blob is absent on both hubs
 *   - FI archive rows keep one citation action per row
 *   - EN archive rows keep citation actions out of the archive surface
 *
 * Writes: docs/data/pf5-impl-apa-full-list-parity-2026-08-17.json
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const { PUBLICATION_GROUP_ORDER } = require("../src/_data/publicationsPage");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pf5-impl-apa-full-list-parity-2026-08-17.json"
);
const PAGEFIND_DIR = path.join(REPO_ROOT, "_site", "pagefind");
const UNCLASSIFIED_KEY = "__unclassified__";

function readText(relPath) {
  return fs.readFileSync(path.join(REPO_ROOT, relPath), "utf8");
}

function readJson(relPath) {
  return JSON.parse(readText(relPath));
}

function stripPagefindPrefix(text) {
  const braceIdx = text.indexOf("{");
  return braceIdx > 0 ? text.slice(braceIdx) : text;
}

function normalizeUrl(url) {
  return String(url || "").replace(/\/+$/, "/");
}

function canonicalGroupKey(item = {}) {
  const key = String(item.publicationGroup || item.group || "").trim().toUpperCase();
  return PUBLICATION_GROUP_ORDER.includes(key) ? key : UNCLASSIFIED_KEY;
}

function parseArchiveRows(html) {
  const groups = {};
  const rows = [];
  let citationButtonCount = 0;
  const sectionRx = /<section class="publication-archive-group" data-publication-group="([^"]+)"[\s\S]*?<tbody>([\s\S]*?)<\/tbody>[\s\S]*?<\/section>/g;

  for (const match of html.matchAll(sectionRx)) {
    const group = match[1];
    const tbody = match[2];
    const titleUrls = [...tbody.matchAll(/class="publication-archive-title-link[^"]*" href="([^"]+)"/g)]
      .map((entry) => entry[1]);
    const buttonMatches = [...tbody.matchAll(/class="[^"]*export-citation-btn[^"]*"/g)];
    citationButtonCount += buttonMatches.length;
    groups[group] = {
      count: titleUrls.length,
      urls: titleUrls.map(normalizeUrl)
    };
    rows.push(...titleUrls.map((url) => ({ group, url: normalizeUrl(url) })));
  }

  return {
    groups,
    rows,
    citationButtonCount,
    rowCount: rows.length
  };
}

function loadPagefindPublications() {
  const fragmentDir = path.join(PAGEFIND_DIR, "fragment");
  if (!fs.existsSync(fragmentDir)) return [];
  const publications = [];

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.name.endsWith(".pf_fragment")) continue;
      try {
        const raw = fs.readFileSync(full);
        const decoded = stripPagefindPrefix(zlib.gunzipSync(raw).toString("utf8"));
        const parsed = JSON.parse(decoded);
        const filters = parsed?.filters || {};
        const findExplore = Array.isArray(filters.FindExplore) ? filters.FindExplore : [];
        if (!findExplore.includes("publications")) continue;
        const group = String((filters["Publications group"] || [])[0] || "").trim().toUpperCase();
        publications.push({
          url: normalizeUrl(parsed.url),
          group: PUBLICATION_GROUP_ORDER.includes(group) ? group : UNCLASSIFIED_KEY
        });
      } catch {
        // Skip unreadable fragments and let parity gates fail if needed.
      }
    }
  }

  walk(fragmentDir);
  return publications;
}

function compareSets(canonical, subject) {
  const canonicalSet = new Set(canonical.map(normalizeUrl));
  const subjectSet = new Set(subject.map(normalizeUrl));
  const missing = [...canonicalSet].filter((url) => !subjectSet.has(url));
  const extra = [...subjectSet].filter((url) => !canonicalSet.has(url));
  const seen = new Set();
  const duplicates = [];
  for (const url of subject.map(normalizeUrl)) {
    if (seen.has(url)) duplicates.push(url);
    seen.add(url);
  }
  return { missing, extra, duplicates };
}

function tallyGroups(rows) {
  return rows.reduce((acc, row) => {
    const group = row.group || UNCLASSIFIED_KEY;
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});
}

function groupCountsAgree(expected, actual) {
  const keys = new Set([...Object.keys(expected), ...Object.keys(actual)]);
  for (const key of keys) {
    if ((expected[key] || 0) !== (actual[key] || 0)) return false;
  }
  return true;
}

function main() {
  const publicationsPage = readJson("_site/data/publications-page.json");
  const canonicalItems = Array.isArray(publicationsPage.items) ? publicationsPage.items : [];
  const canonicalRows = canonicalItems
    .filter((item) => item.pageUrl)
    .map((item) => ({
      url: normalizeUrl(item.pageUrl),
      group: canonicalGroupKey(item)
    }));
  const canonicalUrls = canonicalRows.map((row) => row.url);
  const canonicalGroupCounts = tallyGroups(canonicalRows);

  const fiHtml = readText("_site/julkaisut/index.html");
  const enHtml = readText("_site/en/publications/index.html");
  const fiArchive = parseArchiveRows(fiHtml);
  const enArchive = parseArchiveRows(enHtml);
  const pagefindRows = loadPagefindPublications();

  const fiUrls = fiArchive.rows.map((row) => row.url);
  const enUrls = enArchive.rows.map((row) => row.url);
  const pagefindUrls = pagefindRows.map((row) => row.url);

  const fiParity = compareSets(canonicalUrls, fiUrls);
  const enParity = compareSets(canonicalUrls, enUrls);
  const pagefindParity = compareSets(canonicalUrls, pagefindUrls);

  const fiGroupCounts = tallyGroups(fiArchive.rows);
  const enGroupCounts = tallyGroups(enArchive.rows);
  const pagefindGroupCounts = tallyGroups(pagefindRows);

  const gates = {
    canonicalNonEmpty: canonicalUrls.length > 0,
    fiArchiveMatchesCanonical:
      fiParity.missing.length === 0 &&
      fiParity.extra.length === 0 &&
      fiParity.duplicates.length === 0,
    enArchiveMatchesCanonical:
      enParity.missing.length === 0 &&
      enParity.extra.length === 0 &&
      enParity.duplicates.length === 0,
    pagefindMatchesCanonical:
      pagefindParity.missing.length === 0 &&
      pagefindParity.extra.length === 0 &&
      pagefindParity.duplicates.length === 0,
    fiGroupCountsAgree: groupCountsAgree(canonicalGroupCounts, fiGroupCounts),
    enGroupCountsAgree: groupCountsAgree(canonicalGroupCounts, enGroupCounts),
    pagefindGroupCountsAgree: groupCountsAgree(canonicalGroupCounts, pagefindGroupCounts),
    noEmbeddedHubRecords:
      !fiHtml.includes("publicationFindExploreRecords") &&
      !enHtml.includes("publicationFindExploreRecords"),
    fiCitationButtonsMatchRows:
      fiArchive.citationButtonCount === fiArchive.rowCount,
    enArchiveOmitsCitationButtons:
      enArchive.citationButtonCount === 0
  };

  const gateFailures = Object.entries(gates)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "Publications archive convergence parity",
    counts: {
      canonical: canonicalUrls.length,
      fiArchiveRows: fiArchive.rowCount,
      enArchiveRows: enArchive.rowCount,
      pagefindPublicationFragments: pagefindRows.length
    },
    parity: {
      fi: fiParity,
      en: enParity,
      pagefind: pagefindParity
    },
    groupCounts: {
      canonical: canonicalGroupCounts,
      fiArchive: fiGroupCounts,
      enArchive: enGroupCounts,
      pagefind: pagefindGroupCounts
    },
    archiveSurface: {
      fiCitationButtons: fiArchive.citationButtonCount,
      enCitationButtons: enArchive.citationButtonCount,
      embeddedHubRecordsPresent:
        fiHtml.includes("publicationFindExploreRecords") ||
        enHtml.includes("publicationFindExploreRecords")
    },
    gates,
    gateFailures
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log(
    `counts: canonical=${report.counts.canonical} fiArchive=${report.counts.fiArchiveRows} enArchive=${report.counts.enArchiveRows} pagefindFragments=${report.counts.pagefindPublicationFragments}`
  );
  console.log(
    `fi parity: missing=${fiParity.missing.length} extra=${fiParity.extra.length} dup=${fiParity.duplicates.length}`
  );
  console.log(
    `en parity: missing=${enParity.missing.length} extra=${enParity.extra.length} dup=${enParity.duplicates.length}`
  );
  console.log(
    `pagefind parity: missing=${pagefindParity.missing.length} extra=${pagefindParity.extra.length} dup=${pagefindParity.duplicates.length}`
  );
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));

  if (gateFailures.length > 0) process.exit(1);
}

main();

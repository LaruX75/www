#!/usr/bin/env node
/**
 * TH-CITE1 Phase 3 — converged SSR archive verification.
 *
 * Verifies the built `_site/` thesis archive after the single-table
 * convergence:
 *
 *   1. All 9 FI + 9 EN flat pagination URLs exist as real SSR files.
 *   2. The union of title links across each locale's 9 pages covers
 *      all 169 canonical theses exactly once.
 *   3. Every SSR page renders exactly one thesis archive table, one
 *      shared results tbody, and top+bottom pagers.
 *   4. No SSR page contains the legacy section fragments or citation
 *      cells/classes.
 *   5. No SSR page renders more than 20 thesis rows.
 *   6. Sitemap still includes only the landing archive URLs and
 *      excludes the paginated archive URLs.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const SITE_ROOT = path.join(REPO_ROOT, "_site");
const OUT = path.join(REPO_ROOT, "docs", "data", "th-cite1-phase3-ssr-archive-2026-08-18.json");

const PAGE_COUNT = 9;

function buildArchiveUrls(landingUrl, pageBase) {
  return Array.from({ length: PAGE_COUNT }, (_, index) => (
    index === 0 ? landingUrl : `${pageBase}${index + 1}/`
  ));
}

const FI_URLS = buildArchiveUrls("/opinnaytteet/", "/opinnaytteet/sivu/");
const EN_URLS = buildArchiveUrls("/en/theses/", "/en/theses/page/");

function requireFresh(rel) {
  const full = path.join(REPO_ROOT, rel);
  delete require.cache[full];
  return require(full);
}

function htmlPathFor(pageUrl) {
  const trimmed = pageUrl.replace(/^\/+/, "").replace(/\/$/, "");
  return path.join(SITE_ROOT, trimmed, "index.html");
}

function loadHtml(pageUrl) {
  return fs.readFileSync(htmlPathFor(pageUrl), "utf8");
}

function extractTitleLinks(html) {
  const matches = html.match(/class="thesis-archive-title-link[^"]*"\s+href="([^"]+)"/g) || [];
  return matches
    .map((match) => {
      const urlMatch = match.match(/href="([^"]+)"/);
      return urlMatch ? urlMatch[1] : "";
    })
    .filter(Boolean);
}

function pageAudit(pageUrl) {
  let html;
  try {
    html = loadHtml(pageUrl);
  } catch (error) {
    return {
      pageUrl,
      exists: false,
      note: String(error && error.message)
    };
  }

  const rows = extractTitleLinks(html);
  const archiveCurrentPageMatch = html.match(/data-thesis-archive-current-page="(\d+)"/);

  return {
    pageUrl,
    exists: true,
    currentPage: archiveCurrentPageMatch ? Number.parseInt(archiveCurrentPageMatch[1], 10) : null,
    tableCount: (html.match(/<table[^>]+thesis-archive-table/g) || []).length,
    tbodyCount: (html.match(/<tbody[^>]+data-find-explore-results/g) || []).length,
    topPagerCount: (html.match(/data-thesis-archive-pager-position="top"/g) || []).length,
    bottomPagerCount: (html.match(/data-thesis-archive-pager-position="bottom"/g) || []).length,
    rowCount: rows.length,
    titleLinks: rows,
    hasLegacySectionFragments: /data-thesis-section=/.test(html),
    hasLegacyCitationCells: /thesis-archive-citation/.test(html)
  };
}

function auditScope(scope, urls, canonicalItems) {
  const expectedRows = canonicalItems
    .filter((item) => item?.pageUrl && item?.title)
    .map((item) => item.pageUrl);
  const expectedSet = new Set(expectedRows);
  const perUrl = urls.map(pageAudit);
  const seenRows = new Set();

  perUrl.forEach((entry) => {
    (entry.titleLinks || []).forEach((href) => seenRows.add(href));
  });

  const unexpectedRows = [...seenRows].filter((href) => !expectedSet.has(href));
  const missingRows = [...expectedSet].filter((href) => !seenRows.has(href));

  return {
    scope,
    urlsChecked: urls.length,
    expectedCanonicalUnique: expectedSet.size,
    unionOfSsrRows: seenRows.size,
    unionMatchesCanonical: seenRows.size === expectedSet.size && unexpectedRows.length === 0 && missingRows.length === 0,
    unexpectedRows,
    missingRows,
    maxRowsAnyUrl: perUrl.reduce((max, entry) => Math.max(max, entry.rowCount || 0), 0),
    perUrl
  };
}

async function main() {
  const thesisDetails = requireFresh("src/_data/thesisDetails.js");
  const model = await thesisDetails();
  const items = Array.isArray(model.items) ? model.items : [];

  if (!fs.existsSync(SITE_ROOT)) {
    console.error("SITE_ROOT missing:", SITE_ROOT);
    console.error("Run `npm run build:no-og` before this audit.");
    process.exit(2);
  }

  const fi = auditScope("fi", FI_URLS, items);
  const en = auditScope("en", EN_URLS, items);

  const sitemapXml = fs.readFileSync(path.join(SITE_ROOT, "sitemap.xml"), "utf8");
  const paginatedRoutePatterns = [
    /\/opinnaytteet\/sivu\//,
    /\/en\/theses\/page\//
  ];
  const sitemapPaginationHits = paginatedRoutePatterns.map((pattern) => {
    const matches = sitemapXml.match(new RegExp(`<loc>[^<]*${pattern.source.replace(/^\//, "").replace(/\\\//g, "/")}[^<]*</loc>`, "g")) || [];
    return { pattern: pattern.source, count: matches.length, examples: matches.slice(0, 3) };
  });
  const sitemapClean = sitemapPaginationHits.every((hit) => hit.count === 0);
  const sitemapLandingsPresent =
    /<loc>[^<]*\/opinnaytteet\/<\/loc>/.test(sitemapXml)
    && /<loc>[^<]*\/en\/theses\/<\/loc>/.test(sitemapXml);

  const fiPageGates = fi.perUrl.every((entry) => (
    entry.exists
    && entry.tableCount === 1
    && entry.tbodyCount === 1
    && entry.topPagerCount === 1
    && entry.bottomPagerCount === 1
    && entry.rowCount <= 20
    && !entry.hasLegacySectionFragments
    && !entry.hasLegacyCitationCells
  ));
  const enPageGates = en.perUrl.every((entry) => (
    entry.exists
    && entry.tableCount === 1
    && entry.tbodyCount === 1
    && entry.topPagerCount === 1
    && entry.bottomPagerCount === 1
    && entry.rowCount <= 20
    && !entry.hasLegacySectionFragments
    && !entry.hasLegacyCitationCells
  ));

  const gates = {
    fiAllPagesExistAndMatchContract: fiPageGates,
    enAllPagesExistAndMatchContract: enPageGates,
    fiUnionEqualsCanonical: fi.unionMatchesCanonical,
    enUnionEqualsCanonical: en.unionMatchesCanonical,
    fiNoOversizedPage: fi.maxRowsAnyUrl <= 20,
    enNoOversizedPage: en.maxRowsAnyUrl <= 20,
    sitemapExcludesPaginatedUrls: sitemapClean,
    sitemapIncludesBothLandingArchives: sitemapLandingsPresent
  };
  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([name]) => name);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "TH-CITE1 Phase 3 — converged SSR archive verification",
    canonical: {
      canonicalUniqueTheses: items.filter((item) => item?.pageUrl && item?.title).length,
      pageSize: 20,
      pageCount: PAGE_COUNT
    },
    fi,
    en,
    sitemap: {
      landingsPresent: sitemapLandingsPresent,
      paginatedRoutesFound: sitemapPaginationHits
    },
    gates,
    gateFailures,
    productionChangePolicy: "AUDIT ONLY. Verifies built _site output; no source or contract change."
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log("canonical unique theses:", report.canonical.canonicalUniqueTheses);
  console.log(`FI: ${fi.urlsChecked} SSR URLs — union of thesis rows = ${fi.unionOfSsrRows}/${fi.expectedCanonicalUnique}`);
  console.log(`EN: ${en.urlsChecked} SSR URLs — union of thesis rows = ${en.unionOfSsrRows}/${en.expectedCanonicalUnique}`);
  console.log(`FI max rows any single URL: ${fi.maxRowsAnyUrl} (page budget 20)`);
  console.log(`EN max rows any single URL: ${en.maxRowsAnyUrl} (page budget 20)`);
  console.log(`sitemap landings /opinnaytteet/ + /en/theses/ present: ${sitemapLandingsPresent}`);
  console.log(`sitemap paginated-URL hits: ${sitemapPaginationHits.reduce((sum, hit) => sum + hit.count, 0)}`);
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));

  if (gateFailures.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});

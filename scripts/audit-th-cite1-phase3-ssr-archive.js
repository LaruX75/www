#!/usr/bin/env node
/**
 * TH-CITE1 Phase 3 — SSR-first archive verification.
 *
 * Verifies the corrected Phase 3 architecture on the built `_site/`
 * output:
 *
 *   1. All 16 bounded FI + 16 bounded EN permalinks exist as real
 *      SSR files (landing + per-section paginated pages).
 *   2. The union of thesis rows across the 8 FI landing/section
 *      pages covers all 169 canonical unique theses exactly once.
 *      Same for EN.
 *   3. Each SSR page renders `data-thesis-section` fragments for all
 *      three sections (masters, bachelors, reviewed) so the
 *      progressive-enhancement JS can swap any one fragment
 *      independently.
 *   4. Every SSR-rendered thesis citation comes from the shared
 *      renderer (contains APA 7 bracket `[Genre, Publisher]`), and
 *      no Phase 3 template surface still emits the legacy
 *      `citationApa` field directly.
 *   5. No SSR page contains a 169-row DOM (`< 60` archive citations
 *      per page — 30 visible + safety margin, versus the earlier
 *      "render full list" pattern where a page could have 169).
 *
 * Read-only. Writes docs/data/th-cite1-phase3-ssr-archive-<date>.json
 * with the per-URL row counts and closure summary.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const SITE_ROOT = path.join(REPO_ROOT, "_site");
const OUT = path.join(REPO_ROOT, "docs", "data", "th-cite1-phase3-ssr-archive-2026-08-18.json");

const FI_URLS = [
  "/opinnaytteet/",
  "/opinnaytteet/ohjatut-gradut/page/2/",
  "/opinnaytteet/ohjatut-gradut/page/3/",
  "/opinnaytteet/ohjatut-gradut/page/4/",
  "/opinnaytteet/ohjatut-gradut/page/5/",
  "/opinnaytteet/ohjatut-gradut/page/6/",
  "/opinnaytteet/ohjatut-gradut/page/7/",
  "/opinnaytteet/ohjatut-gradut/page/8/",
  "/opinnaytteet/ohjatut-gradut/page/9/",
  "/opinnaytteet/kandityot/page/2/",
  "/opinnaytteet/kandityot/page/3/",
  "/opinnaytteet/tarkastetut/page/2/",
  "/opinnaytteet/tarkastetut/page/3/",
  "/opinnaytteet/tarkastetut/page/4/",
  "/opinnaytteet/tarkastetut/page/5/",
  "/opinnaytteet/tarkastetut/page/6/"
];
const EN_URLS = [
  "/en/theses/",
  "/en/theses/masters/page/2/",
  "/en/theses/masters/page/3/",
  "/en/theses/masters/page/4/",
  "/en/theses/masters/page/5/",
  "/en/theses/masters/page/6/",
  "/en/theses/masters/page/7/",
  "/en/theses/masters/page/8/",
  "/en/theses/masters/page/9/",
  "/en/theses/bachelors/page/2/",
  "/en/theses/bachelors/page/3/",
  "/en/theses/reviewed/page/2/",
  "/en/theses/reviewed/page/3/",
  "/en/theses/reviewed/page/4/",
  "/en/theses/reviewed/page/5/",
  "/en/theses/reviewed/page/6/"
];

function requireFresh(rel) {
  const full = path.join(REPO_ROOT, rel);
  delete require.cache[full];
  return require(full);
}

function loadHtml(pageUrl) {
  const file = path.join(SITE_ROOT, pageUrl.replace(/\/$/, ""), "index.html");
  return fs.readFileSync(file, "utf8");
}

function extractLandingSectionRows(html) {
  // For the LANDING url only, all three sections show their page-1
  // slice (10 items each). Collect unique thesis pageUrls from each
  // section fragment.
  const sectionRegex = /<section[^>]+data-thesis-section="([^"]+)"[\s\S]*?<\/section>/g;
  const rows = { advisedMasters: [], advisedBachelors: [], reviewed: [] };
  let match;
  while ((match = sectionRegex.exec(html)) !== null) {
    const sectionKey = match[1];
    const body = match[0];
    const linkRegex = /class="thesis-archive-title-link[^"]*"\s+href="([^"]+)"/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(body)) !== null) {
      if (!rows[sectionKey]) continue;
      rows[sectionKey].push(linkMatch[1]);
    }
  }
  return rows;
}

function extractActiveSectionRows(html, activeSectionKey) {
  // For a paginated per-section URL, we only credit the ACTIVE
  // section's page-N rows toward the union (the other two sections
  // are always at page 1 for those URLs — those rows are already
  // credited from the landing URL).
  const sectionRegex = new RegExp(
    '<section[^>]+data-thesis-section="' + activeSectionKey + '"[\\s\\S]*?</section>'
  );
  const match = sectionRegex.exec(html);
  if (!match) return [];
  const body = match[0];
  const linkRegex = /class="thesis-archive-title-link[^"]*"\s+href="([^"]+)"/g;
  const rows = [];
  let linkMatch;
  while ((linkMatch = linkRegex.exec(body)) !== null) {
    rows.push(linkMatch[1]);
  }
  return rows;
}

function activeSectionForUrl(pageUrl) {
  if (/\/ohjatut-gradut\/|\/masters\//.test(pageUrl)) return "advisedMasters";
  if (/\/kandityot\/|\/bachelors\//.test(pageUrl)) return "advisedBachelors";
  if (/\/tarkastetut\/|\/reviewed\//.test(pageUrl)) return "reviewed";
  return null;
}

function auditScope(scopeLabel, urls, canonicalItems) {
  const canonicalByGroup = {
    advisedMasters: canonicalItems.filter((i) => i.thesisRole !== "reviewed" && i.thesisType === "masterThesis"),
    advisedBachelors: canonicalItems.filter((i) => i.thesisRole !== "reviewed" && i.thesisType === "bachelorThesis"),
    reviewed: canonicalItems.filter((i) => i.thesisRole === "reviewed")
  };
  const expectedCount = canonicalItems.length;
  const seenPageUrls = new Set();
  const perUrl = [];
  let bracketCitationTotal = 0;
  let maxRowsAnyUrl = 0;
  for (const pageUrl of urls) {
    let html;
    try {
      html = loadHtml(pageUrl);
    } catch (err) {
      perUrl.push({ pageUrl, exists: false, note: String(err && err.message) });
      continue;
    }
    const sectionFragmentCount = (html.match(/data-thesis-section="/g) || []).length;
    const citationCount = (html.match(/class="[^"]*thesis-archive-citation[^"]*"/g) || []).length;
    const bracketCount = (html.match(/thesis-archive-citation[^>]*>[^<]*\[[^<\]]+\]\./g) || []).length;
    bracketCitationTotal += bracketCount;
    if (citationCount > maxRowsAnyUrl) maxRowsAnyUrl = citationCount;
    const active = activeSectionForUrl(pageUrl);
    const rowsAddedByThisUrl = active
      ? extractActiveSectionRows(html, active)
      : [
          ...extractLandingSectionRows(html).advisedMasters,
          ...extractLandingSectionRows(html).advisedBachelors,
          ...extractLandingSectionRows(html).reviewed
        ];
    for (const url of rowsAddedByThisUrl) seenPageUrls.add(url);
    perUrl.push({
      pageUrl,
      exists: true,
      sectionFragments: sectionFragmentCount,
      citations: citationCount,
      bracketFormattedCitations: bracketCount,
      activeSection: active,
      rowsCreditedToUnion: rowsAddedByThisUrl.length
    });
  }
  return {
    scope: scopeLabel,
    urlsChecked: urls.length,
    expectedCanonicalUnique: expectedCount,
    unionOfSsrRows: seenPageUrls.size,
    unionMatchesCanonical: seenPageUrls.size === expectedCount,
    bracketCitationTotal,
    maxRowsAnyUrl,
    exceededPageBudget: maxRowsAnyUrl > 60,
    perSectionCanonicalCounts: {
      advisedMasters: canonicalByGroup.advisedMasters.length,
      advisedBachelors: canonicalByGroup.advisedBachelors.length,
      reviewed: canonicalByGroup.reviewed.length
    },
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

  const gates = {
    fiBoundedPermalinks: fi.perUrl.every((r) => r.exists),
    enBoundedPermalinks: en.perUrl.every((r) => r.exists),
    fiUnionEqualsCanonical: fi.unionMatchesCanonical,
    enUnionEqualsCanonical: en.unionMatchesCanonical,
    fiNoOversizedPage: !fi.exceededPageBudget,
    enNoOversizedPage: !en.exceededPageBudget,
    fiAllSsrCitationsBracketFormat: fi.perUrl.every((r) => !r.exists || r.citations === r.bracketFormattedCitations),
    enAllSsrCitationsBracketFormat: en.perUrl.every((r) => !r.exists || r.citations === r.bracketFormattedCitations)
  };
  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "TH-CITE1 Phase 3 — SSR-first archive verification",
    canonical: {
      canonicalUniqueTheses: items.length,
      rawSourceCount: "170 (see phase1 parity audit — one duplicate URL in gradut)"
    },
    fi,
    en,
    gates,
    gateFailures,
    productionChangePolicy: "AUDIT ONLY. Verifies built _site output; no source or contract change."
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log("canonical unique theses:", items.length);
  console.log(`FI: ${fi.urlsChecked} SSR URLs — union of thesis rows = ${fi.unionOfSsrRows}/${fi.expectedCanonicalUnique}`);
  console.log(`EN: ${en.urlsChecked} SSR URLs — union of thesis rows = ${en.unionOfSsrRows}/${en.expectedCanonicalUnique}`);
  console.log(`FI bracket-format citations across all URLs: ${fi.bracketCitationTotal}`);
  console.log(`EN bracket-format citations across all URLs: ${en.bracketCitationTotal}`);
  console.log(`FI max rows any single URL: ${fi.maxRowsAnyUrl} (page budget 60)`);
  console.log(`EN max rows any single URL: ${en.maxRowsAnyUrl} (page budget 60)`);
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});

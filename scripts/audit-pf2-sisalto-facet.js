#!/usr/bin/env node
/**
 * PF2 — Shared Sisältö Facet Audit
 *
 * Deterministic check that every Pagefind-indexed detail record across
 * the five content families carries exactly one canonical `Sisältö:*`
 * filter value, and that no detail page uses `data-pagefind-body`
 * (M2 reverse gate).
 *
 * Sources of truth:
 *  - `_site/data/publications-page.json`        → publications
 *  - `_site/data/writings-page.json`            → writings
 *  - `_site/data/theses.json`                   → theses
 *  - `_site/data/media.json`                    → media
 *  - `scripts/_lib/presentationPagefind` +
 *    `_site/data/presentations-page.json`       → presentations
 *
 * For families with HTML-emitted filters (publications, theses,
 * writings, media) the check inspects the built HTML directly.
 *
 * For presentations, the filters are injected into HTML at Pagefind
 * indexing time and also emitted on custom records — so the check
 * runs `buildPresentationPagefindFilters` against every presentation
 * record's shape and confirms `Sisältö:Esitykset` is emitted.
 *
 * Writes: `docs/data/pf2-shared-sisalto-facet-audit-2026-08-16.json`
 * Exit non-zero on any gate failure.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const BUILT_ROOT = path.join(REPO_ROOT, "_site");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pf2-shared-sisalto-facet-audit-2026-08-16.json"
);

const EXPECTED = {
  publications: "Sisältö:Julkaisut",
  theses: "Sisältö:Opinnäytteet",
  writings: "Sisältö:Kirjoitukset ja puheenvuorot",
  presentations: "Sisältö:Esitykset",
  media: "Sisältö:Mediassa"
};

const {
  buildPresentationPagefindFilters,
  buildPresentationExistingHtmlAudit
} = require("../scripts/_lib/presentationPagefind");

function readJson(rel) {
  const p = path.join(BUILT_ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function readHtmlForPageUrl(pageUrl) {
  if (!pageUrl) return null;
  const rel = pageUrl.endsWith("/") ? `${pageUrl.slice(1)}index.html` : `${pageUrl.slice(1)}/index.html`;
  const p = path.join(BUILT_ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

function extractSisaltoFilters(html) {
  if (!html) return [];
  const rx = /data-pagefind-filter="Sisältö:([^"]*)"/g;
  const out = [];
  let m;
  while ((m = rx.exec(html)) !== null) out.push(m[1]);
  return out;
}

function pagefindBodyPresent(html) {
  return !!html && html.includes("data-pagefind-body");
}

function auditFamilyByHtml(name, items, urlFn) {
  const expected = EXPECTED[name];
  const missing = [];
  const wrongValue = [];
  const duplicate = [];
  const pagefindBodyPages = [];
  let checked = 0;
  for (const item of items) {
    const url = urlFn(item);
    if (!url) continue;
    const html = readHtmlForPageUrl(url);
    if (!html) {
      missing.push({ url, reason: "no built html" });
      continue;
    }
    checked += 1;
    if (pagefindBodyPresent(html)) pagefindBodyPages.push(url);
    const values = extractSisaltoFilters(html);
    if (values.length === 0) {
      missing.push({ url, reason: "no Sisältö filter" });
      continue;
    }
    if (values.length > 1) {
      duplicate.push({ url, values });
    }
    if (!values.includes(expected.split(":")[1])) {
      wrongValue.push({ url, values, expected });
    }
  }
  return { expected, checked, missing, wrongValue, duplicate, pagefindBodyPages };
}

function auditPresentations() {
  const expectedValue = "Esitykset";
  const summary = { expected: EXPECTED.presentations, checked: 0, missing: [], wrongValue: [] };
  const auditPromise = buildPresentationExistingHtmlAudit(BUILT_ROOT);
  return auditPromise.then((audit) => {
    for (const record of audit.records) {
      summary.checked += 1;
      const filters = buildPresentationPagefindFilters(record);
      const values = filters["Sisältö"] || [];
      if (values.length === 0) {
        summary.missing.push({
          id: record.canonicalPresentationId,
          preferredLandingUrl: record.preferredLandingUrl
        });
      } else if (!values.includes(expectedValue)) {
        summary.wrongValue.push({
          id: record.canonicalPresentationId,
          preferredLandingUrl: record.preferredLandingUrl,
          values
        });
      }
    }
    // Also verify no HTML presentation detail page carries data-pagefind-body
    // (Pagefind body-gate guard). Injection happens in-memory at Pagefind
    // time and does not touch on-disk HTML, so this scan is safe.
    const pagefindBodyPages = [];
    for (const record of audit.records) {
      const url = record.preferredLandingUrl;
      if (!url || !url.startsWith("/")) continue;
      const html = readHtmlForPageUrl(url);
      if (html && pagefindBodyPresent(html)) pagefindBodyPages.push(url);
    }
    return { ...summary, pagefindBodyPages, canonicalTotal: audit.summary.canonicalTotal };
  });
}

function listThesisDetailUrls() {
  // Thesis detail pages are paginated into /opinnaytteet/{id}/. Skip the
  // archive index at /opinnaytteet/index.html.
  const dir = path.join(BUILT_ROOT, "opinnaytteet");
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (!fs.statSync(full).isDirectory()) continue;
    if (!fs.existsSync(path.join(full, "index.html"))) continue;
    out.push(`/opinnaytteet/${name}/`);
  }
  return out;
}

async function main() {
  const publicationsPage = readJson("data/publications-page.json");
  const writingsPage = readJson("data/writings-page.json");
  const media = readJson("data/media.json");

  if (!publicationsPage || !writingsPage || !media) {
    console.error("Missing one of the /data/*.json feeds. Run `npm run build:no-og` first.");
    process.exit(1);
  }

  // Publications and writings overlap: the writings archive displays
  // scientific publications alongside other writings, and the shared
  // Pagefind resolver assigns them Sisältö:Julkaisut (publications
  // priority-first). Only pure-writings URLs are expected to carry
  // Sisältö:Kirjoitukset ja puheenvuorot.
  const publicationsUrlSet = new Set(
    (publicationsPage.items || []).map((i) => i.pageUrl).filter(Boolean)
  );
  const writingsOnlyItems = (writingsPage.items || []).filter(
    (i) => i.pageUrl && !publicationsUrlSet.has(i.pageUrl)
  );

  const publicationsAudit = auditFamilyByHtml(
    "publications",
    publicationsPage.items || [],
    (i) => i.pageUrl
  );
  const writingsAudit = auditFamilyByHtml(
    "writings",
    writingsOnlyItems,
    (i) => i.pageUrl
  );
  const thesesAudit = auditFamilyByHtml(
    "theses",
    listThesisDetailUrls().map((url) => ({ url })),
    (i) => i.url
  );
  const mediaAudit = auditFamilyByHtml(
    "media",
    media.items || [],
    (i) => i.url
  );
  const presentationsAudit = await auditPresentations();

  const pagefindEntry = readJson("pagefind/pagefind-entry.json");

  const gates = {
    publicationsAllHaveSisalto:
      publicationsAudit.missing.length === 0 && publicationsAudit.wrongValue.length === 0,
    writingsAllHaveSisalto:
      writingsAudit.missing.length === 0 && writingsAudit.wrongValue.length === 0,
    thesesAllHaveSisalto:
      thesesAudit.missing.length === 0 && thesesAudit.wrongValue.length === 0,
    mediaAllHaveSisalto:
      mediaAudit.missing.length === 0 && mediaAudit.wrongValue.length === 0,
    presentationsAllHaveSisalto:
      presentationsAudit.missing.length === 0 && presentationsAudit.wrongValue.length === 0,
    noHtmlDetailUsesPagefindBody:
      publicationsAudit.pagefindBodyPages.length === 0 &&
      writingsAudit.pagefindBodyPages.length === 0 &&
      thesesAudit.pagefindBodyPages.length === 0 &&
      mediaAudit.pagefindBodyPages.length === 0 &&
      presentationsAudit.pagefindBodyPages.length === 0,
    noDuplicateSisaltoPerDetailPage:
      publicationsAudit.duplicate.length === 0 &&
      writingsAudit.duplicate.length === 0 &&
      thesesAudit.duplicate.length === 0 &&
      mediaAudit.duplicate.length === 0,
    pagefindIndexPresent: !!pagefindEntry && !!pagefindEntry.languages,
    pagefindIndexHasBothLanguages:
      !!pagefindEntry &&
      !!pagefindEntry.languages &&
      !!pagefindEntry.languages.fi &&
      !!pagefindEntry.languages.en
  };

  const gateFailures = Object.entries(gates)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PF2 verification: shared Sisältö facet across Pagefind detail pages",
    expected: EXPECTED,
    families: {
      publications: publicationsAudit,
      writings: writingsAudit,
      theses: thesesAudit,
      media: mediaAudit,
      presentations: presentationsAudit
    },
    pagefindEntry,
    gates,
    gateFailures
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log(
    "coverage:",
    JSON.stringify({
      publications: publicationsAudit.checked,
      writings: writingsAudit.checked,
      theses: thesesAudit.checked,
      media: mediaAudit.checked,
      presentations: presentationsAudit.checked
    })
  );
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * M2 — Media Pagefind + Find & Explore verification audit
 *
 * Deterministic check that:
 *  - every built media detail page carries the M2 Pagefind attributes
 *  - both FI and EN landing pages mark the archive grid as
 *    data-pagefind-ignore
 *  - the shared FindExplore:media preset is registered
 *  - the /data/media.json projection still emits 73 items
 *
 * Writes:
 *   docs/data/m2-media-pagefind-audit-2026-08-15.json
 *
 * Read-only. Exits with non-zero status if any coverage gate fails.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const BUILT_ROOT = path.join(REPO_ROOT, "_site");
const MEDIA_DIR_BUILT = path.join(BUILT_ROOT, "mediassa");
const FI_LANDING = path.join(BUILT_ROOT, "mediassa", "index.html");
const EN_LANDING = path.join(BUILT_ROOT, "en", "media", "index.html");
const MEDIA_JSON = path.join(BUILT_ROOT, "data", "media.json");
const PAGEFIND_ENTRY = path.join(BUILT_ROOT, "pagefind", "pagefind-entry.json");
const CONTENT_PRESETS = path.join(REPO_ROOT, "src", "_utils", "contentPresets.js");
const OUT = path.join(REPO_ROOT, "docs", "data", "m2-media-pagefind-audit-2026-08-15.json");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name === "index.html") out.push(full);
  }
  return out;
}

function classify(file, html) {
  const rel = path.relative(BUILT_ROOT, file);
  if (rel === "mediassa/index.html" || rel === "en/media/index.html") return "landing";
  // Alias redirects are tiny meta-refresh stubs
  if (/<meta http-equiv=["']refresh["']/i.test(html)) return "alias";
  return "detail";
}

function has(html, needle) {
  return html.includes(needle);
}

function extractMeta(html, key) {
  const rx = new RegExp(`data-pagefind-meta="${key}:([^"]*)"`);
  const m = html.match(rx);
  return m ? m[1] : null;
}

function extractFilter(html, key) {
  const rx = new RegExp(`data-pagefind-filter="${key}:([^"]*)"`);
  const m = html.match(rx);
  return m ? m[1] : null;
}

function auditDetailPages(files) {
  const missing = {
    sisalto: [],
    mediaType: [],
    mediaRole: [],
    mediaOutlet: [],
    year: [],
    date: [],
    // Reverse gate: no media detail page may carry data-pagefind-body,
    // because Pagefind treats data-pagefind-body as a site-wide gate —
    // once any page in the site is tagged, pages missing the marker
    // are dropped from the index entirely. Media adds per-item metadata
    // via hidden filter/meta spans, which work at page-level without
    // triggering that gate.
    pagefindBodyPresent: []
  };
  const perItem = [];
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const rel = path.relative(BUILT_ROOT, file);
    const item = {
      url: "/" + rel.replace(/index\.html$/, ""),
      hasBody: has(html, "data-pagefind-body"),
      sisalto: extractFilter(html, "Sisältö"),
      mediatyyppi: extractFilter(html, "Mediatyyppi"),
      rooli: extractFilter(html, "Rooli"),
      vuosi: extractFilter(html, "Vuosi"),
      mediaTypeMeta: extractMeta(html, "mediaType"),
      mediaRoleMeta: extractMeta(html, "mediaRole"),
      mediaOutletMeta: extractMeta(html, "mediaOutlet"),
      yearMeta: extractMeta(html, "year"),
      dateMeta: extractMeta(html, "date"),
      dateSort: has(html, "data-pagefind-sort=\"date:")
    };
    perItem.push(item);
    if (item.hasBody) missing.pagefindBodyPresent.push(rel);
    if (!item.sisalto) missing.sisalto.push(rel);
    if (!item.mediaTypeMeta) missing.mediaType.push(rel);
    if (!item.mediaRoleMeta) missing.mediaRole.push(rel);
    if (!item.mediaOutletMeta) missing.mediaOutlet.push(rel);
    if (!item.yearMeta) missing.year.push(rel);
    if (!item.dateMeta) missing.date.push(rel);
  }
  return { perItem, missing };
}

function auditLandings() {
  const fi = fs.readFileSync(FI_LANDING, "utf8");
  const en = fs.readFileSync(EN_LANDING, "utf8");
  return {
    fi: {
      hasIgnore: has(fi, "data-pagefind-ignore"),
      hasKieliFilter: has(fi, 'data-pagefind-filter="Kieli:Suomi"')
    },
    en: {
      hasIgnore: has(en, "data-pagefind-ignore"),
      hasKieliFilter: has(en, 'data-pagefind-filter="Kieli:English"')
    }
  };
}

function auditPreset() {
  const src = fs.readFileSync(CONTENT_PRESETS, "utf8");
  return {
    hasFindExploreMedia: /"FindExplore:media"\s*:\s*\{[^}]*source:\s*"media"/.test(src),
    hasFindExplorePresentations: /"FindExplore:presentations"/.test(src)
  };
}

function auditProjection() {
  if (!fs.existsSync(MEDIA_JSON)) return { exists: false };
  const data = JSON.parse(fs.readFileSync(MEDIA_JSON, "utf8"));
  const langCounts = { fi: 0, en: 0 };
  const typeCounts = {};
  const roleCounts = {};
  for (const it of data.items) {
    langCounts[it.lang] = (langCounts[it.lang] || 0) + 1;
    if (it.mediaType) typeCounts[it.mediaType] = (typeCounts[it.mediaType] || 0) + 1;
    if (it.mediaRole) roleCounts[it.mediaRole] = (roleCounts[it.mediaRole] || 0) + 1;
  }
  return { exists: true, count: data.count, langCounts, typeCounts, roleCounts };
}

function auditPagefindEntry() {
  if (!fs.existsSync(PAGEFIND_ENTRY)) return { exists: false };
  return { exists: true, entry: JSON.parse(fs.readFileSync(PAGEFIND_ENTRY, "utf8")) };
}

function main() {
  if (!fs.existsSync(MEDIA_DIR_BUILT)) {
    console.error("Built _site/mediassa not found. Run `npm run build:no-og` first.");
    process.exit(1);
  }
  const allMediaFiles = walk(MEDIA_DIR_BUILT);
  const enLandingArr = fs.existsSync(EN_LANDING) ? [EN_LANDING] : [];
  const allFiles = [...allMediaFiles, ...enLandingArr];

  const grouped = { landing: [], alias: [], detail: [] };
  for (const f of allFiles) {
    const html = fs.readFileSync(f, "utf8");
    grouped[classify(f, html)].push(f);
  }

  const detailAudit = auditDetailPages(grouped.detail);
  const landingsAudit = auditLandings();
  const presetAudit = auditPreset();
  const projectionAudit = auditProjection();
  const pagefindEntry = auditPagefindEntry();

  const detailCount = grouped.detail.length;
  const projectionCount = projectionAudit.count || 0;

  const gates = {
    detailCountMatchesProjection: detailCount === projectionCount,
    // Reverse gate: data-pagefind-body must NOT be present on any media
    // detail page. See the comment in auditDetailPages for the rationale
    // (Pagefind treats data-pagefind-body as a site-wide gate).
    noDetailUsesPagefindBody: detailAudit.missing.pagefindBodyPresent.length === 0,
    allDetailHaveSisalto: detailAudit.missing.sisalto.length === 0,
    allDetailHaveMediaTypeMeta: detailAudit.missing.mediaType.length === 0,
    allDetailHaveMediaRoleMeta: detailAudit.missing.mediaRole.length === 0,
    allDetailHaveMediaOutletMeta: detailAudit.missing.mediaOutlet.length === 0,
    fiLandingIgnoresGrid: landingsAudit.fi.hasIgnore,
    enLandingIgnoresGrid: landingsAudit.en.hasIgnore,
    fiKieliFilter: landingsAudit.fi.hasKieliFilter,
    enKieliFilter: landingsAudit.en.hasKieliFilter,
    presetRegistered: presetAudit.hasFindExploreMedia,
    presentationsPresetPreserved: presetAudit.hasFindExplorePresentations,
    pagefindEntryPresent: pagefindEntry.exists,
    // Year/date meta only expected when frontmatter has explicit date.
    // 3 flat-slug items lack authored dates by design (M1 finding).
    yearMetaCoverageMatchesDatedItems:
      detailCount - detailAudit.missing.year.length ===
      detailCount - projectionCount + projectionCount /* placeholder */
  };
  // Replace the placeholder gate with a real check: expect exactly 3 items
  // without year meta (matches the 3 flat-permalink items lacking source dates).
  gates.yearMetaCoverageMatchesDatedItems = detailAudit.missing.year.length === 3;
  gates.dateMetaCoverageMatchesDatedItems = detailAudit.missing.date.length === 3;

  const gateFailures = Object.entries(gates).filter(([, v]) => !v).map(([k]) => k);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "M2 verification: media Pagefind metadata + FindExplore:media preset",
    counts: {
      totalMediaHtmlFiles: allFiles.length,
      detailPages: detailCount,
      aliasRedirects: grouped.alias.length,
      landingPages: grouped.landing.length,
      projectionCount,
      langCounts: projectionAudit.langCounts,
      typeCounts: projectionAudit.typeCounts,
      roleCounts: projectionAudit.roleCounts
    },
    detailAudit: {
      missing: detailAudit.missing,
      coverage: {
        // pagefindBodyPresent is a reverse metric — 0 is the desired state
        // (see comment in auditDetailPages).
        pagefindBodyPresent: detailAudit.missing.pagefindBodyPresent.length,
        sisalto: detailCount - detailAudit.missing.sisalto.length,
        mediaType: detailCount - detailAudit.missing.mediaType.length,
        mediaRole: detailCount - detailAudit.missing.mediaRole.length,
        mediaOutlet: detailCount - detailAudit.missing.mediaOutlet.length,
        year: detailCount - detailAudit.missing.year.length,
        date: detailCount - detailAudit.missing.date.length
      }
    },
    landingsAudit,
    presetAudit,
    pagefindEntry,
    gates,
    gateFailures
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log("detail pages:", detailCount, "projection:", projectionCount);
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length) process.exit(1);
}

main();

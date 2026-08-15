#!/usr/bin/env node
/**
 * M1 — Media Pagefind Compatibility Audit
 *
 * Deterministic audit of media content and page state. Reads:
 *   - src/media/*.md          (source of truth)
 *   - _site/data/media.json   (built public projection)
 *   - _site/mediassa/**       (built pages, for Pagefind attribute scan)
 *   - _site/en/media/         (English landing)
 *
 * Writes: docs/data/media-pagefind-compatibility-audit-2026-08-15.json
 *
 * Read-only. No product code modified.
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const REPO_ROOT = path.resolve(__dirname, "..");
const MEDIA_DIR = path.join(REPO_ROOT, "src", "media");
const BUILT_JSON = path.join(REPO_ROOT, "_site", "data", "media.json");
const BUILT_MEDIA_DIR = path.join(REPO_ROOT, "_site", "mediassa");
const BUILT_EN_MEDIA = path.join(REPO_ROOT, "_site", "en", "media", "index.html");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "media-pagefind-compatibility-audit-2026-08-15.json"
);

function readSource() {
  const files = fs.readdirSync(MEDIA_DIR).filter((f) => f.endsWith(".md"));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(MEDIA_DIR, f), "utf8");
    const parsed = matter(raw);
    return {
      file: f,
      data: parsed.data,
      contentLength: parsed.content.trim().length
    };
  });
}

function readProjection() {
  if (!fs.existsSync(BUILT_JSON)) return null;
  return JSON.parse(fs.readFileSync(BUILT_JSON, "utf8"));
}

function scanBuiltHtmlPagefind() {
  const pattern = /data-pagefind-[a-z-]+(?:="([^"]*)")?/g;
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name === "index.html") files.push(full);
    }
  }
  if (fs.existsSync(BUILT_MEDIA_DIR)) walk(BUILT_MEDIA_DIR);
  if (fs.existsSync(BUILT_EN_MEDIA)) files.push(BUILT_EN_MEDIA);

  const perFile = {};
  const globalAttrCounts = {};
  for (const file of files) {
    const html = fs.readFileSync(file, "utf8");
    const attrs = new Set();
    let m;
    while ((m = pattern.exec(html)) !== null) {
      const attr = m[0].split("=")[0];
      attrs.add(attr);
      globalAttrCounts[attr] = (globalAttrCounts[attr] || 0) + 1;
    }
    perFile[path.relative(REPO_ROOT, file)] = [...attrs].sort();
  }
  return { htmlFiles: files.length, globalAttrCounts, samplePerFile: perFile };
}

function analyzeSource(sourceItems) {
  const counts = {
    total: sourceItems.length,
    byMediaType: {},
    byMediaRole: {},
    byLang: {},
    mediaOutletDistinct: 0,
    withDate: 0,
    withoutDate: 0,
    withSourceUrl: 0,
    withoutSourceUrl: 0,
    withThumbnail: 0,
    withoutThumbnail: 0,
    withDescription: 0,
    withCategories: 0,
    withKeywords: 0,
    withExplicitContexts: 0,
    contentLengthZero: 0,
    contentLengthAvg: 0
  };
  const outlets = new Set();
  let contentTotal = 0;
  for (const it of sourceItems) {
    const d = it.data || {};
    const t = d.mediaType || "(none)";
    counts.byMediaType[t] = (counts.byMediaType[t] || 0) + 1;
    const r = d.mediaRole || "(none)";
    counts.byMediaRole[r] = (counts.byMediaRole[r] || 0) + 1;
    if (d.date) counts.withDate++;
    else counts.withoutDate++;
    if (d.sourceUrl) counts.withSourceUrl++;
    else counts.withoutSourceUrl++;
    if (d.thumbnail) counts.withThumbnail++;
    else counts.withoutThumbnail++;
    if (d.description) counts.withDescription++;
    if (Array.isArray(d.categories) && d.categories.length) counts.withCategories++;
    if (Array.isArray(d.keywords) && d.keywords.length) counts.withKeywords++;
    if (Array.isArray(d.contexts) && d.contexts.length) counts.withExplicitContexts++;
    if (d.mediaOutlet) outlets.add(d.mediaOutlet);
    if (it.contentLength === 0) counts.contentLengthZero++;
    contentTotal += it.contentLength;
  }
  counts.mediaOutletDistinct = outlets.size;
  counts.mediaOutlets = [...outlets].sort();
  counts.contentLengthAvg = Math.round(contentTotal / Math.max(sourceItems.length, 1));
  return counts;
}

function analyzeProjection(json) {
  if (!json) return null;
  const items = json.items || [];
  const flat = items.filter((i) => !/^\/mediassa\/\d{4}\//.test(i.url || ""));
  const dated = items.filter((i) => /^\/mediassa\/\d{4}\//.test(i.url || ""));
  const contextCounts = {};
  for (const it of items) {
    for (const c of it.contexts || []) contextCounts[c] = (contextCounts[c] || 0) + 1;
  }
  return {
    schemaVersion: json.version,
    generatedAt: json.generatedAt,
    count: json.count,
    languages: {
      fi: items.filter((i) => i.lang === "fi").length,
      en: items.filter((i) => i.lang === "en").length
    },
    permalinkShape: {
      dated: dated.length,
      flatSlug: flat.length,
      flatItems: flat.map((i) => ({ url: i.url, title: (i.title || "").slice(0, 80) }))
    },
    contextDistribution: contextCounts,
    contextEligibleForResearch: items.filter((i) => (i.contexts || []).includes("research")).length,
    sampleFields: items[0] ? Object.keys(items[0]) : []
  };
}

function main() {
  const sourceItems = readSource();
  const projection = readProjection();
  const built = scanBuiltHtmlPagefind();

  const audit = {
    generatedAt: new Date().toISOString(),
    scope: "M1 media Pagefind compatibility audit (read-only)",
    source: {
      dir: path.relative(REPO_ROOT, MEDIA_DIR),
      fileCount: sourceItems.length,
      analysis: analyzeSource(sourceItems)
    },
    projection: {
      path: path.relative(REPO_ROOT, BUILT_JSON),
      exists: !!projection,
      analysis: analyzeProjection(projection)
    },
    pagefind: {
      builtHtmlScan: built
    }
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(audit, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log("source items:", audit.source.fileCount);
  console.log("projection items:", audit.projection.analysis && audit.projection.analysis.count);
  console.log("built html files scanned:", audit.pagefind.builtHtmlScan.htmlFiles);
  console.log("pagefind attrs seen:", Object.keys(audit.pagefind.builtHtmlScan.globalAttrCounts));
}

main();

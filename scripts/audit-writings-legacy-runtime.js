const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function checkForbidden(source, needles = []) {
  return needles.filter((needle) => source.includes(needle));
}

function extractMatches(source, regex) {
  const matches = [];
  for (const match of source.matchAll(regex)) {
    matches.push(match.slice(1).filter(Boolean));
  }
  return matches;
}

function main() {
  const fiTemplate = readText("src/kirjoitukset.njk");
  const enTemplate = readText("src/en/writings.njk");
  const fiData = readText("src/kirjoitukset.11tydata.js");
  const enData = readText("src/en/writings.11tydata.js");
  const contentPresets = readText("src/_utils/contentPresets.js");
  const writingsPage = readJson("_site/data/writings-page.json");

  const fiForbidden = checkForbidden(fiTemplate, [
    "parseJson(",
    "pub-data",
    "mielipiteet-data",
    "lausunnot-data",
    "kolumnit-data",
    "aloitteet-data",
    "puheet-data",
    "blog-data",
    "/data/publications.json",
    "/data/initiatives.json",
    "/data/content.json",
    "/data/researchfi.json",
    "source: 'content'",
    "source: 'publications'",
    "source: 'researchfi'",
    "source: 'initiatives'"
  ]);

  const enForbidden = checkForbidden(enTemplate, [
    "_enToRecord",
    "_enLoadJsonItems",
    "rawItems.map",
    "/data/publications.json",
    "/data/initiatives.json",
    "/data/content.json",
    "/data/researchfi.json",
    "source: 'content'",
    "source: 'publications'",
    "source: 'researchfi'",
    "source: 'initiatives'"
  ]);

  const fiQueries = extractMatches(
    fiTemplate,
    /ContentEngine\.query\(\{\s*source:\s*'([^']+)'\s*,\s*filters:\s*\{\s*contentType:\s*'([^']+)'/g
  ).map(([source, contentType]) => ({ source, contentType }));

  const enQueries = extractMatches(
    enTemplate,
    /_enQueryWritings\('([^']+)'/g
  ).map(([contentType]) => ({ source: "writings", contentType }));

  const materialsSectionPresent = enTemplate.includes('<section id="materials"');
  const materialsSummaryCopyPresent = enTemplate.includes("summary-only")
    || enTemplate.includes("This total combines Canva presentations, SlideShare presentations, and AOE/Finna learning materials.");
  const materialsQueryPresent = enTemplate.includes("contentType: 'materials'")
    || enTemplate.includes('contentType: "materials"')
    || enTemplate.includes("_enQueryWritings('materials'")
    || enTemplate.includes('_enQueryWritings("materials"');

  const materialsItemsInProjection = toArray(writingsPage.items).filter((item) =>
    toArray(item.sectionKeys).includes("materials") || item.contentType === "materials"
  );

  const ok = fiTemplate.includes("{% set pageModel = finnishWritingsPage %}")
    && enTemplate.includes("{% set pageModel = englishWritingsPage %}")
    && fiData.includes("buildFinnishWritingsViewModel")
    && enData.includes("buildEnglishWritingsViewModel")
    && contentPresets.includes('writings: "/data/writings-page.json"')
    && fiForbidden.length === 0
    && enForbidden.length === 0
    && fiQueries.every((query) => query.source === "writings")
    && enQueries.every((query) => query.source === "writings")
    && materialsSectionPresent
    && materialsSummaryCopyPresent
    && !materialsQueryPresent
    && writingsPage.count === 290
    && materialsItemsInProjection.length === 0;

  const report = {
    generatedAt: new Date().toISOString(),
    ok,
    canonicalRuntime: {
      endpoint: "/data/writings-page.json",
      count: writingsPage.count,
      fiUsesCompatibilityViewModel: fiTemplate.includes("{% set pageModel = finnishWritingsPage %}"),
      enUsesCanonicalViewModel: enTemplate.includes("{% set pageModel = englishWritingsPage %}")
    },
    legacyRuntimeAudit: {
      fiForbiddenMatches: fiForbidden,
      enForbiddenMatches: enForbidden,
      fiQueries,
      enQueries
    },
    materialsException: {
      summaryOnly: materialsSectionPresent && materialsSummaryCopyPresent && !materialsQueryPresent,
      sectionPresent: materialsSectionPresent,
      queryPresent: materialsQueryPresent,
      projectedItems: materialsItemsInProjection.length,
      note: "materials is a page-level summary/navigation element, not an itemized writings content section."
    }
  };

  console.log(JSON.stringify(report, null, 2));

  if (!ok) {
    process.exitCode = 1;
  }
}

main();

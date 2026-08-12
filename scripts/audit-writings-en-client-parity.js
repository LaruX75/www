const fs = require("fs");
const path = require("path");
const { buildEnglishWritingsViewModel } = require("../src/_data/writingsPage");

const ROOT = process.cwd();
const TYPES = ["statement", "opinion", "column", "initiative", "speech", "blogPost", "scientificPublication"];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function visibleUrl(item = {}) {
  return item.pageUrl || item.url || item.sourceUrl || null;
}

function countByType(items = []) {
  return items.reduce((acc, item) => {
    const type = item.contentType || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
}

function extractSectionLinks(html, sectionId) {
  const match = html.match(new RegExp(`<section id="${sectionId}"[\\s\\S]*?</section>`));
  if (!match) return [];
  return [...match[0].matchAll(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((entry) => entry[1])
    .filter((href) => !href.startsWith("#"));
}

function compareOpening(expectedItems, actualLinks) {
  const expected = expectedItems.map(visibleUrl);
  return {
    expectedCount: expected.length,
    actualCount: actualLinks.length,
    expected,
    actual: actualLinks,
    sameRows: JSON.stringify(expected) === JSON.stringify(actualLinks.slice(0, expected.length))
  };
}

function main() {
  const writingsPage = readJson("_site/data/writings-page.json");
  const html = readText("_site/en/writings/index.html");
  const source = readText("src/en/writings.njk");
  const viewModel = buildEnglishWritingsViewModel({ items: toArray(writingsPage.items) });
  const byType = countByType(toArray(writingsPage.items));

  const openingParity = {
    statements: compareOpening(viewModel.statementItems.slice(0, 5), extractSectionLinks(html, "statements")),
    opinions: compareOpening(viewModel.openingOpinionItems, extractSectionLinks(html, "opinions")),
    columns: compareOpening(viewModel.openingColumnItems, extractSectionLinks(html, "columns")),
    initiatives: compareOpening(viewModel.openingInitiativeItems, extractSectionLinks(html, "initiatives")),
    speeches: compareOpening(viewModel.openingSpeechItems, extractSectionLinks(html, "speeches")),
    publicSpeeches: compareOpening(viewModel.publicSpeechItems.slice(0, 5), extractSectionLinks(html, "public-speeches")),
    blog: compareOpening(viewModel.openingBlogItems, extractSectionLinks(html, "blog")),
    publications: compareOpening(viewModel.publicationItems.slice(0, 5), extractSectionLinks(html, "publications"))
  };

  const runtime = {
    hasFindExplore: html.includes("data-find-explore"),
    hasLegacyTables: /<table\b/i.test(html),
    hasWritingsJsonRuntimeRef: /\/data\/writings-page\.json/.test(html) || /\/data\/writings-page\.json/.test(source),
    hasOldContentEngine: /ContentEngine\.query|PE\.loadJsonEndpoint|_enLoadJsonItems|_enToRecord|tbody id=/.test(source),
    pageScriptsOnlyFindExplore: source.includes("- /js/find-explore.js")
      && !source.includes("- /js/pe-list-render.js")
      && !source.includes("- /js/content-engine.js")
  };

  const ok = writingsPage.count === 290
    && TYPES.every((type) => byType[type] > 0)
    && Object.values(openingParity).every((entry) => entry.sameRows)
    && runtime.hasFindExplore
    && !runtime.hasLegacyTables
    && !runtime.hasWritingsJsonRuntimeRef
    && !runtime.hasOldContentEngine
    && runtime.pageScriptsOnlyFindExplore;

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    ok,
    counts: {
      canonicalTotal: writingsPage.count,
      byType,
      englishVisibleTotal: viewModel.items.length
    },
    openingParity,
    runtime
  }, null, 2));

  if (!ok) process.exitCode = 1;
}

main();

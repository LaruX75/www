const fs = require("fs");
const path = require("path");
const {
  buildFinnishWritingsCompatibilityItems,
  buildFinnishWritingsViewModel
} = require("../src/_data/writingsPage");

const ROOT = process.cwd();
const TYPES = ["opinion", "column", "blogPost"];

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
  const html = readText("_site/kirjoitukset/index.html");
  const source = readText("src/kirjoitukset.njk");
  const compatibilityItems = buildFinnishWritingsCompatibilityItems(toArray(writingsPage.items));
  const viewModel = buildFinnishWritingsViewModel({ items: toArray(writingsPage.items) });

  const counts = {
    canonicalTotal: writingsPage.count,
    compatibilityTotal: compatibilityItems.length,
    compatibilityByType: countByType(compatibilityItems)
  };

  const openingParity = {
    opinion: compareOpening(viewModel.openingOpinionItems, extractSectionLinks(html, "mielipiteet")),
    column: compareOpening(viewModel.openingColumnItems, extractSectionLinks(html, "kolumnit")),
    blogPost: compareOpening(viewModel.openingBlogItems, extractSectionLinks(html, "blogi"))
  };

  const runtime = {
    hasFindExplore: html.includes("data-find-explore"),
    hasLegacyTables: /<table\b/i.test(html),
    hasWritingsJsonRuntimeRef: /\/data\/writings-page\.json/.test(html) || /\/data\/writings-page\.json/.test(source),
    hasOldContentEngine: /ContentEngine\.query|PE\.loadJsonEndpoint|data-no-header-filters|tbody id="(?:mielipiteet|kolumnit|blog)-tbody"/.test(source),
    pageScriptsOnlyFindExplore: source.includes("- /js/find-explore.js")
      && !source.includes("- /js/pe-list-render.js")
      && !source.includes("- /js/content-engine.js")
  };

  const ok = counts.canonicalTotal === 290
    && counts.compatibilityTotal === 126
    && TYPES.every((type) => counts.compatibilityByType[type] > 0)
    && Object.values(openingParity).every((entry) => entry.sameRows)
    && runtime.hasFindExplore
    && !runtime.hasLegacyTables
    && !runtime.hasWritingsJsonRuntimeRef
    && !runtime.hasOldContentEngine
    && runtime.pageScriptsOnlyFindExplore;

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    ok,
    counts,
    openingParity,
    runtime
  }, null, 2));

  if (!ok) process.exitCode = 1;
}

main();

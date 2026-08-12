const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function count(source, regex) {
  return [...source.matchAll(regex)].length;
}

function main() {
  const writings = readJson("_site/data/writings-page.json");
  const fiHtml = readText("_site/kirjoitukset/index.html");
  const enHtml = readText("_site/en/writings/index.html");

  const fiChecks = {
    fileExists: true,
    compatibilityCopy: fiHtml.includes("70 blogikirjoitusta, 47 mielipidekirjoitusta ja 9 kolumnia"),
    findExploreMount: fiHtml.includes("data-find-explore-scope=\"fi\""),
    noLegacyTables: count(fiHtml, /<table\b/g) === 0,
    noWritingsJsonRef: !fiHtml.includes("/data/writings-page.json"),
    noTableFiltersScript: !fiHtml.includes("/js/table-filters.js"),
    hasCuratedLinks: count(fiHtml, /class="find-explore-result-title"/g) === 0
      && count(fiHtml, /stretched-link text-decoration-none/g) >= 15
  };

  const enChecks = {
    fileExists: true,
    materialsSection: enHtml.includes('<section id="materials"'),
    materialsSummaryCopy: enHtml.includes("This companion route links to Canva presentations"),
    findExploreMount: enHtml.includes("data-find-explore-scope=\"en\""),
    noLegacyTables: count(enHtml, /<table\b/g) === 0,
    noWritingsJsonRef: !enHtml.includes("/data/writings-page.json"),
    noTableFiltersScript: !enHtml.includes("/js/table-filters.js"),
    badges: [47, 9, 10, 92, 6, 13, 70, 56].every((value) => enHtml.includes(`>${value}<`) || enHtml.includes(`>${value}</span>`)),
    hasCuratedLinks: count(enHtml, /stretched-link text-decoration-none/g) >= 35
  };

  const ok = writings.count === 290
    && Object.values(fiChecks).every(Boolean)
    && Object.values(enChecks).every(Boolean);

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    ok,
    canonicalTotal: writings.count,
    fiChecks,
    enChecks
  }, null, 2));

  if (!ok) process.exitCode = 1;
}

main();

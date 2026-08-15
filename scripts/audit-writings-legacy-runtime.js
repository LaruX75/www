const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function forbiddenMatches(source, needles) {
  return needles.filter((needle) => source.includes(needle));
}

function main() {
  const fiTemplate = readText("src/kirjoitukset.njk");
  const enTemplate = readText("src/en/writings.njk");
  const findExplore = readText("src/js/find-explore.js");
  const writingsPage = readJson("_site/data/writings-page.json");

  const forbidden = [
    "parseJson(",
    "pub-data",
    "mielipiteet-data",
    "lausunnot-data",
    "kolumnit-data",
    "aloitteet-data",
    "puheet-data",
    "blog-data",
    "ContentEngine.query",
    "PE.loadJsonEndpoint",
    "/data/publications.json",
    "/data/initiatives.json",
    "/data/content.json",
    "/data/researchfi.json",
    "/data/writings-page.json",
    "tbody id="
  ];

  const fiForbidden = forbiddenMatches(fiTemplate, forbidden);
  const enForbidden = forbiddenMatches(enTemplate, forbidden);

  const runtime = {
    findExploreUsesPagefind: /import\(`\/pagefind\/pagefind\.js(?:\?[^`]*)?`\)/.test(findExplore)
      || /import\("\/pagefind\/pagefind\.js(?:\?[^"]*)?"\)/.test(findExplore),
    findExploreDoesNotFetchWritingsJson: !/fetch\(["']\/data\/writings-page\.json/.test(findExplore),
    fiSuppressesTableFilters: fiTemplate.includes("suppressTableFilters: true"),
    enSuppressesTableFilters: enTemplate.includes("suppressTableFilters: true"),
    publicProjectionRetained: writingsPage.count === 290
  };

  const ok = fiForbidden.length === 0
    && enForbidden.length === 0
    && Object.values(runtime).every(Boolean);

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    ok,
    canonicalRuntime: {
      endpoint: "/data/writings-page.json",
      count: writingsPage.count,
      retainedAsPublicContract: true
    },
    legacyRuntimeAudit: {
      fiForbiddenMatches: fiForbidden,
      enForbiddenMatches: enForbidden
    },
    runtime
  }, null, 2));

  if (!ok) process.exitCode = 1;
}

main();

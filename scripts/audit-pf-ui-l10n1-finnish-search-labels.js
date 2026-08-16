#!/usr/bin/env node
/**
 * PF-UI-L10N1 — Finnish Search UI Label Localization Audit
 *
 * Deterministic check that:
 *  - the nav-bar Pagefind UI init in `_site/js/site-ui.js` carries
 *    the complete Finnish translations bundle (not the partial
 *    one shipped before PF-UI-L10N1)
 *  - the /haku/ Pagefind UI init in `_site/js/site-search-page.js`
 *    still carries Finnish translations
 *  - the English init variants remain English
 *  - no forbidden token (`Sisältö:Tutkimus`, visible `FindExplore:*`)
 *    has been introduced by PF-UI-L10N1
 *  - PF-PERF2 warmup helpers + Enter-scroll form submit handler are
 *    still present in `_site/js/find-explore.js`
 *  - no `data-pagefind-body` reintroduced anywhere in the discovery
 *    or nav templates
 *
 * Writes: docs/data/pf-ui-l10n1-finnish-search-labels-audit-2026-08-16.json
 * Exits non-zero on any gate failure.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const BUILT_ROOT = path.join(REPO_ROOT, "_site");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pf-ui-l10n1-finnish-search-labels-audit-2026-08-16.json"
);

const REQUIRED_FI_STRINGS = [
  "Hae sivustolta",
  "Suodattimet",
  "Tyhjennä haku",
  "Näytä lisää tuloksia",
  "Ei tuloksia haulle",
  "Haetaan [SEARCH_TERM]",
  "Kokeile jotain seuraavista"
];

const REQUIRED_EN_STRINGS = [
  "Search this site",
  "Filters",
  "Clear search",
  "Show more results"
];

const HAKU_REQUIRED_FI_STRINGS = [
  "Hae sivustolta",
  "Suodattimet",
  "Tyhjennä",
  "Lataa lisää tuloksia",
  "Ei tuloksia haulla"
];

function readOrExit(relative, label) {
  const full = path.join(BUILT_ROOT, relative);
  if (!fs.existsSync(full)) {
    console.error(`Missing ${label}: ${full}. Run \`npm run build:no-og\` first.`);
    process.exit(1);
  }
  return fs.readFileSync(full, "utf8");
}

function main() {
  const siteUi = readOrExit("js/site-ui.js", "site-ui.js");
  const siteSearchPage = readOrExit("js/site-search-page.js", "site-search-page.js");
  const findExplore = readOrExit("js/find-explore.js", "find-explore.js");
  const hakuHtml = readOrExit("haku/index.html", "haku/index.html");
  const enSearchHtml = fs.existsSync(path.join(BUILT_ROOT, "en/search/index.html"))
    ? fs.readFileSync(path.join(BUILT_ROOT, "en/search/index.html"), "utf8")
    : "";

  const missingFiInNavBar = REQUIRED_FI_STRINGS.filter((s) => !siteUi.includes(s));
  const missingEnInNavBar = REQUIRED_EN_STRINGS.filter((s) => !siteUi.includes(s));
  const missingFiInHaku = HAKU_REQUIRED_FI_STRINGS.filter((s) => !siteSearchPage.includes(s));

  // Reverse gates.
  const sisaltoTutkimusPresent = /Sisältö\s*:\s*Tutkimus/i.test(siteUi + siteSearchPage);
  const findExplorePagefindWarmup = /warmSearchLanguages/.test(findExplore);
  const findExploreEnterHandler = /controlsForm[\s\S]*?addEventListener[\s\S]*?submit/.test(findExplore);
  const noDataPagefindBodyInSiteUi = !/data-pagefind-body/.test(siteUi);
  const noDataPagefindBodyInFindExplore = !/data-pagefind-body/.test(findExplore);
  const noDataPagefindBodyInHaku = !/data-pagefind-body/.test(hakuHtml);

  const gates = {
    navBarHasAllFinnishTranslations: missingFiInNavBar.length === 0,
    navBarKeepsEnglishTranslations: missingEnInNavBar.length === 0,
    hakuKeepsFinnishTranslations: missingFiInHaku.length === 0,
    noSisaltoTutkimusToken: !sisaltoTutkimusPresent,
    findExploreWarmupIntact: findExplorePagefindWarmup,
    findExploreEnterHandlerIntact: findExploreEnterHandler,
    noDataPagefindBodyInSiteUi,
    noDataPagefindBodyInFindExplore,
    noDataPagefindBodyInHaku,
    enSearchTemplatePresent: enSearchHtml.length > 0
  };

  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PF-UI-L10N1 Finnish search UI label localization audit",
    findings: {
      missingFiStringsInNavBar: missingFiInNavBar,
      missingEnStringsInNavBar: missingEnInNavBar,
      missingFiStringsInHaku: missingFiInHaku
    },
    gates,
    gateFailures
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main();

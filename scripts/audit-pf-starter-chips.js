#!/usr/bin/env node
/**
 * PF-STARTER-CHIPS — Static Audit
 *
 * Deterministic sanity check that starter chips are:
 *  - present only on the three intended FI pages
 *  - not pre-pressed on load
 *  - only using existing filter/target hooks (no new Pagefind facets)
 *  - free of any `data-pagefind-body` regression
 *  - free of any `Sisältö:Tutkimus`, Media-in-Research, or
 *    mediaOutlet-as-global-facet leakage
 *
 * Writes: `docs/data/pf-starter-chips-audit-2026-08-16.json`
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
  "pf-starter-chips-audit-2026-08-16.json"
);

const INTENDED_PAGES = [
  { url: "/tutkimus/", path: "tutkimus/index.html" },
  { url: "/esitykset/", path: "esitykset/index.html" },
  { url: "/mediassa/", path: "mediassa/index.html" }
];

const FORBIDDEN_PAGES = [
  { url: "/en/research/", path: "en/research/index.html" },
  { url: "/en/presentations/", path: "en/presentations/index.html" },
  { url: "/en/media/", path: "en/media/index.html" }
];

function readOrEmpty(rel) {
  const full = path.join(BUILT_ROOT, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

function extractChipMarkup(html) {
  const rx = /<button[^>]*data-starter-chip[^>]*>[\s\S]*?<\/button>/g;
  return html.match(rx) || [];
}

function extractAttr(chipMarkup, attr) {
  const rx = new RegExp(`${attr}="([^"]*)"`);
  const m = chipMarkup.match(rx);
  return m ? m[1] : null;
}

function chipDescriptor(chipMarkup) {
  return {
    target: extractAttr(chipMarkup, "data-starter-chip-target"),
    value: extractAttr(chipMarkup, "data-starter-chip-value"),
    click: extractAttr(chipMarkup, "data-starter-chip-click"),
    event: extractAttr(chipMarkup, "data-starter-chip-event"),
    ariaPressed: extractAttr(chipMarkup, "aria-pressed")
  };
}

function main() {
  const perPage = {};
  const missingIntended = [];
  const rogueForbidden = [];
  const chipsWithoutMechanism = [];
  const chipsPrePressed = [];
  const chipsWithNewPagefindFacet = [];
  const chipsUsingMediaOutlet = [];
  const chipsUsingSisaltoTutkimus = [];
  const chipsUsingDataPagefindBody = [];

  for (const page of INTENDED_PAGES) {
    const html = readOrEmpty(page.path);
    const chips = extractChipMarkup(html);
    if (chips.length === 0) missingIntended.push(page.url);
    const descriptors = chips.map(chipDescriptor);
    perPage[page.url] = { chipCount: chips.length, descriptors };

    for (const [i, d] of descriptors.entries()) {
      const marker = `${page.url} chip #${i}`;
      if (!d.target && !d.click) chipsWithoutMechanism.push(marker);
      if (d.ariaPressed === "true") chipsPrePressed.push(marker);
      // Chips must NOT introduce a new Pagefind filter, meta, or body tag.
      const rawChip = chips[i];
      if (/data-pagefind-body/.test(rawChip)) chipsUsingDataPagefindBody.push(marker);
      if (/data-pagefind-filter=/.test(rawChip)) chipsWithNewPagefindFacet.push(marker);
      if (/data-pagefind-meta=/.test(rawChip)) chipsWithNewPagefindFacet.push(marker);
      if (/mediaOutlet/i.test(rawChip)) chipsUsingMediaOutlet.push(marker);
      if (/Sisältö\s*:\s*Tutkimus/i.test(rawChip)) chipsUsingSisaltoTutkimus.push(marker);
    }
  }

  for (const page of FORBIDDEN_PAGES) {
    const html = readOrEmpty(page.path);
    const chips = extractChipMarkup(html);
    if (chips.length > 0) rogueForbidden.push({ url: page.url, chipCount: chips.length });
  }

  // Runtime script must exist as passthrough copy.
  const runtimeExists = fs.existsSync(path.join(BUILT_ROOT, "js", "starter-chips.js"));
  const cssExists = fs.existsSync(path.join(BUILT_ROOT, "css", "starter-chips.css"));

  // Runtime must never trigger a search on page load (verified by
  // browser smoke). Here we assert the runtime source does NOT contain
  // any of the runtime function names that would kick off a fetch.
  const runtimeSource = runtimeExists
    ? fs.readFileSync(path.join(BUILT_ROOT, "js", "starter-chips.js"), "utf8")
    : "";
  const runtimeAutoSearchTokens = [
    "fetch(",
    "pagefind.search",
    "ContentEngine.query",
    "runSearch("
  ];
  const runtimeAutoSearchLeaks = runtimeAutoSearchTokens.filter((token) => runtimeSource.includes(token));

  const gates = {
    allIntendedPagesHaveChips: missingIntended.length === 0,
    noRogueForbiddenPage: rogueForbidden.length === 0,
    everyChipHasAMechanism: chipsWithoutMechanism.length === 0,
    noChipPrePressed: chipsPrePressed.length === 0,
    noChipEmitsNewPagefindFacet: chipsWithNewPagefindFacet.length === 0,
    noChipEmitsMediaOutletFacet: chipsUsingMediaOutlet.length === 0,
    noChipEmitsSisaltoTutkimus: chipsUsingSisaltoTutkimus.length === 0,
    noChipEmitsDataPagefindBody: chipsUsingDataPagefindBody.length === 0,
    starterChipsRuntimeShipped: runtimeExists,
    starterChipsCssShipped: cssExists,
    runtimeDoesNotAutoSearch: runtimeAutoSearchLeaks.length === 0
  };

  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([name]) => name);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PF-STARTER-CHIPS: user-triggered discovery shortcuts audit",
    perPage,
    forbiddenPagesChecked: FORBIDDEN_PAGES.map((p) => p.url),
    rogueForbidden,
    findings: {
      missingIntended,
      chipsWithoutMechanism,
      chipsPrePressed,
      chipsWithNewPagefindFacet,
      chipsUsingMediaOutlet,
      chipsUsingSisaltoTutkimus,
      chipsUsingDataPagefindBody,
      runtimeAutoSearchLeaks
    },
    gates,
    gateFailures
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log(
    "chips per page:",
    JSON.stringify(Object.fromEntries(Object.entries(perPage).map(([url, d]) => [url, d.chipCount])))
  );
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main();

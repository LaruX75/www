#!/usr/bin/env node
/**
 * PF3 — Result-Card Consistency Static Audit
 *
 * Deterministic sanity check that the shared Find & Explore renderer
 * carries the PF3 vocabulary and helpers but does NOT introduce any
 * mistakes that would leak technical filter names into user-facing
 * card headers or reintroduce a Pagefind body-scope gate.
 *
 * Because the shared renderer runs in the browser, this audit inspects
 * the passthrough-copied `_site/js/find-explore.js` after a build and
 * verifies:
 *
 *  - all five PF2 Sisältö values are declared in SISALTO_LABELS
 *  - no Sisältö:Tutkimus token is present
 *  - no visible content-family label uses a FindExplore token
 *  - renderFamilyHeader helper is defined
 *  - PF3-added CSS class hooks exist in the passthrough-copied CSS
 *
 * Writes: `docs/data/pf3-result-card-consistency-audit-2026-08-16.json`
 * Exits non-zero on any gate failure.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const BUILT_ROOT = path.join(REPO_ROOT, "_site");
const RENDERER = path.join(BUILT_ROOT, "js", "find-explore.js");
const RENDERER_CSS = path.join(BUILT_ROOT, "css", "find-explore.css");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pf3-result-card-consistency-audit-2026-08-16.json"
);

const EXPECTED_LABELS = [
  "Julkaisut",
  "Opinnäytteet",
  "Kirjoitukset ja puheenvuorot",
  "Esitykset",
  "Mediassa"
];

function readFileOrExit(filePath, label) {
  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${label}: ${filePath}. Run \`npm run build:no-og\` first.`);
    process.exit(1);
  }
  return fs.readFileSync(filePath, "utf8");
}

function main() {
  const rendererSource = readFileOrExit(RENDERER, "find-explore.js");
  const rendererCss = readFileOrExit(RENDERER_CSS, "find-explore.css");

  const labelsPresent = EXPECTED_LABELS.every((label) => rendererSource.includes(label));
  const helperDefined = /function\s+renderFamilyHeader\s*\(/.test(rendererSource);
  const familyMapDeclared = /const\s+SISALTO_LABELS\s*=/.test(rendererSource);
  const familyDatasetAttr = rendererSource.includes("data-find-explore-family=");
  const cssBadgeClass = rendererCss.includes(".find-explore-result-family-badge");
  const cssHeaderClass = rendererCss.includes(".find-explore-result-family");

  // Reverse gates: none of these tokens may appear as user-visible labels.
  const forbiddenVisibleTokens = [
    "Sisältö:Tutkimus",
    "\"FindExplore:publications\"",
    "\"FindExplore:theses\"",
    "\"FindExplore:writings\"",
    "\"FindExplore:presentations\"",
    "\"FindExplore:media\""
  ];
  const forbiddenTokensFound = forbiddenVisibleTokens
    .filter((token) => rendererSource.includes(token))
    .filter((token) => {
      if (token === "Sisältö:Tutkimus") return true;
      // FindExplore tokens are legitimate as Pagefind filter identifiers in
      // filtersFor / filtersForKind. They are forbidden only if they appear
      // inside the renderFamilyHeader / SISALTO_LABELS scope.
      const familyBlockStart = rendererSource.indexOf("const SISALTO_LABELS");
      const familyBlockEnd = rendererSource.indexOf("function renderFamilyHeader");
      const familyBlockClose = rendererSource.indexOf("}", familyBlockEnd) + 1;
      if (familyBlockStart < 0 || familyBlockEnd < 0 || familyBlockClose < 0) return false;
      const familyBlock = rendererSource.slice(familyBlockStart, familyBlockClose);
      return familyBlock.includes(token);
    });

  // Presentations bespoke archive card must NOT gain the family header hook.
  // Verify presentations-page.js was untouched by PF3.
  const presentationsRendererPath = path.join(BUILT_ROOT, "js", "presentations-page.js");
  const presentationsRenderer = fs.existsSync(presentationsRendererPath)
    ? fs.readFileSync(presentationsRendererPath, "utf8")
    : "";
  const presentationsUnchanged = !presentationsRenderer.includes("find-explore-result-family");

  // Media archive runtime lives inline in the FI landing template.
  const mediaLandingPath = path.join(BUILT_ROOT, "mediassa", "index.html");
  const mediaLanding = fs.existsSync(mediaLandingPath)
    ? fs.readFileSync(mediaLandingPath, "utf8")
    : "";
  const mediaArchiveUnchanged = !mediaLanding.includes("find-explore-result-family");

  const gates = {
    allSisaltoLabelsPresent: labelsPresent,
    renderFamilyHeaderDefined: helperDefined,
    familyLabelMapDeclared: familyMapDeclared,
    familyDatasetAttrEmitted: familyDatasetAttr,
    cssBadgeClassPresent: cssBadgeClass,
    cssHeaderClassPresent: cssHeaderClass,
    noForbiddenVisibleTokens: forbiddenTokensFound.length === 0,
    presentationsArchiveUntouched: presentationsUnchanged,
    mediaArchiveUntouched: mediaArchiveUnchanged
  };

  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([name]) => name);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PF3 verification: shared Find & Explore renderer exposes content-family label",
    expectedLabels: EXPECTED_LABELS,
    findings: {
      rendererPath: path.relative(REPO_ROOT, RENDERER),
      rendererCssPath: path.relative(REPO_ROOT, RENDERER_CSS),
      forbiddenTokensFound
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

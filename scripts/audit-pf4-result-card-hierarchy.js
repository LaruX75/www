#!/usr/bin/env node
/**
 * PF4 — Result-Card Hierarchy Trim Audit
 *
 * Static audit of the passthrough-copied `_site/js/find-explore.js`
 * and `_site/css/find-explore.css` verifying that:
 *
 * - the renderer emits the four-line hierarchy hooks
 *   (family / primary-meta / [quality] / excerpt) plus actions on
 *   publication cards
 * - the pre-PF4 colored publication badge helper was replaced with
 *   the new subdued quality-line helper
 * - no forbidden technical token leaks into a visible label
 * - no `data-pagefind-body` was reintroduced
 * - starter-chip and bespoke archive card runtimes were NOT touched
 *   in the PF4 commit
 * - `_site/css/find-explore.css` carries the new PF4 rules
 *
 * Writes: docs/data/pf4-result-card-hierarchy-audit-2026-08-16.json
 * Exits non-zero on any gate failure.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const BUILT_ROOT = path.join(REPO_ROOT, "_site");
const RENDERER = path.join(BUILT_ROOT, "js", "find-explore.js");
const RENDERER_CSS = path.join(BUILT_ROOT, "css", "find-explore.css");
const STARTER_CHIPS_JS = path.join(BUILT_ROOT, "js", "starter-chips.js");
const STARTER_CHIPS_CSS = path.join(BUILT_ROOT, "css", "starter-chips.css");
const PRESENTATION_ARCHIVE_HTML = path.join(BUILT_ROOT, "esitykset", "index.html");
const MEDIA_ARCHIVE_HTML = path.join(BUILT_ROOT, "mediassa", "index.html");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pf4-result-card-hierarchy-audit-2026-08-16.json"
);

const EXPECTED_CARD_LINES = [
  "family",
  "primary-meta",
  "quality",
  "excerpt",
  "actions"
];

function readOrExit(file, label) {
  if (!fs.existsSync(file)) {
    console.error(`Missing ${label}: ${file}. Run \`npm run build:no-og\` first.`);
    process.exit(1);
  }
  return fs.readFileSync(file, "utf8");
}

function main() {
  const rendererSource = readOrExit(RENDERER, "find-explore.js");
  const rendererCss = readOrExit(RENDERER_CSS, "find-explore.css");
  const starterChipsJs = fs.existsSync(STARTER_CHIPS_JS)
    ? fs.readFileSync(STARTER_CHIPS_JS, "utf8")
    : "";
  const starterChipsCss = fs.existsSync(STARTER_CHIPS_CSS)
    ? fs.readFileSync(STARTER_CHIPS_CSS, "utf8")
    : "";
  const presentationArchiveHtml = fs.existsSync(PRESENTATION_ARCHIVE_HTML)
    ? fs.readFileSync(PRESENTATION_ARCHIVE_HTML, "utf8")
    : "";
  const mediaArchiveHtml = fs.existsSync(MEDIA_ARCHIVE_HTML)
    ? fs.readFileSync(MEDIA_ARCHIVE_HTML, "utf8")
    : "";

  const cardLinesPresent = EXPECTED_CARD_LINES.every((line) =>
    rendererSource.includes(`data-find-explore-card-line="${line}"`)
  );

  // PF4 helpers: renderPrimaryMetaLine + publicationQualityLine +
  // renderFamilyHeader's new year suffix.
  const primaryMetaHelper = /function\s+renderPrimaryMetaLine\s*\(/.test(rendererSource);
  const qualityLineHelper = /function\s+publicationQualityLine\s*\(/.test(rendererSource);
  const yearSuffixInFamily = /find-explore-result-year/.test(rendererSource);

  // Pre-PF4 colored badge block must be gone.
  const legacyBadgeGoneJs = !/function\s+publicationBadges\s*\(/.test(rendererSource);
  const legacyBadgeGoneRender = !/publicationBadges\s*\(record\)/.test(rendererSource);

  // Publication actions must remain.
  const openActionPresent = /class="btn btn-sm btn-primary rounded-pill"/.test(rendererSource);
  const sourceActionHelper = /function\s+sourceLink\s*\(/.test(rendererSource);
  const citationActionHelper = /function\s+citationButton\s*\(/.test(rendererSource);

  // Family badge preserved (from PF3).
  const familyBadgePresent = /find-explore-result-family-badge/.test(rendererSource);

  // Reverse gates.
  const forbiddenTokens = [
    "Sisältö:Tutkimus",
    "\"FindExplore:publications\"",
    "\"FindExplore:theses\"",
    "\"FindExplore:writings\"",
    "\"FindExplore:presentations\"",
    "\"FindExplore:media\""
  ];
  const forbiddenTokensInFamilyBlock = forbiddenTokens.filter((token) => {
    // Only fail if the forbidden token appears inside the SISALTO_LABELS
    // or renderFamilyHeader/renderPrimaryMetaLine helpers. FindExplore
    // tokens legitimately appear as filter identifiers elsewhere.
    if (token === "Sisältö:Tutkimus") return rendererSource.includes(token);
    const familyBlockStart = rendererSource.indexOf("const SISALTO_LABELS");
    const familyBlockEnd = rendererSource.indexOf("function renderPrimaryMetaLine");
    if (familyBlockStart < 0 || familyBlockEnd < 0) return false;
    const familyBlock = rendererSource.slice(familyBlockStart, familyBlockEnd);
    return familyBlock.includes(token);
  });

  const bodyGateIntroduced = /data-pagefind-body/.test(rendererSource);

  // CSS presence.
  const cssPrimaryMeta = rendererCss.includes(".find-explore-result-primary-meta");
  const cssPublicationQuality = rendererCss.includes(".find-explore-result-publication-quality");
  const cssYearSuffix = rendererCss.includes(".find-explore-result-year");

  // Starter-chip runtime + CSS must not have been touched (PF4 must not
  // change chip behavior).
  const chipRuntimeIntact = starterChipsJs.length > 0
    && !starterChipsJs.includes("find-explore-result-primary-meta")
    && !starterChipsJs.includes("find-explore-result-publication-quality");
  const chipCssIntact = starterChipsCss.length > 0
    && !starterChipsCss.includes("find-explore-result-primary-meta")
    && !starterChipsCss.includes("find-explore-result-publication-quality");

  // Bespoke archive card runtimes untouched — the /esitykset/ archive
  // still renders presentation-archive-card and the /mediassa/ archive
  // still renders media-archive-card. Neither should have gained a
  // find-explore-result-* class.
  const presentationArchiveIntact = presentationArchiveHtml.includes("presentation-archive-card")
    && !presentationArchiveHtml.includes("find-explore-result-primary-meta");
  const mediaArchiveIntact = mediaArchiveHtml.includes("media-archive-card")
    && !mediaArchiveHtml.includes("find-explore-result-primary-meta");

  const gates = {
    allCardLineHooksPresent: cardLinesPresent,
    renderPrimaryMetaLineDefined: primaryMetaHelper,
    publicationQualityLineDefined: qualityLineHelper,
    yearSuffixInFamilyHeader: yearSuffixInFamily,
    legacyPublicationBadgesHelperRemoved: legacyBadgeGoneJs,
    legacyPublicationBadgesCallRemoved: legacyBadgeGoneRender,
    publicationOpenActionPreserved: openActionPresent,
    publicationSourceActionPreserved: sourceActionHelper,
    publicationCitationActionPreserved: citationActionHelper,
    familyBadgePreserved: familyBadgePresent,
    noForbiddenTokenInFamilyBlock: forbiddenTokensInFamilyBlock.length === 0,
    noDataPagefindBodyInRenderer: !bodyGateIntroduced,
    cssPrimaryMetaRulePresent: cssPrimaryMeta,
    cssPublicationQualityRulePresent: cssPublicationQuality,
    cssYearSuffixRulePresent: cssYearSuffix,
    starterChipRuntimeUntouched: chipRuntimeIntact,
    starterChipCssUntouched: chipCssIntact,
    presentationArchiveCardUntouched: presentationArchiveIntact,
    mediaArchiveCardUntouched: mediaArchiveIntact
  };

  const gateFailures = Object.entries(gates)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PF4 verification: Find & Explore result-card hierarchy trim",
    expectedCardLines: EXPECTED_CARD_LINES,
    findings: {
      rendererPath: path.relative(REPO_ROOT, RENDERER),
      rendererCssPath: path.relative(REPO_ROOT, RENDERER_CSS),
      forbiddenTokensInFamilyBlock
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

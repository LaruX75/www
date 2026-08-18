#!/usr/bin/env node
/**
 * TH-CITE1 Phase 4C — browser citation deletion audit.
 *
 * Hard, static gates proving that the browser side of the thesis
 * pipeline no longer composes bibliographic truth. All thesis
 * citation/export text must come from
 *   src/js/publication-citation.js
 * (isomorphic UMD shared renderer) via
 *   window.publicationCitation.buildCitation({csl, style, lang})
 * called from src/js/thesis-hub-actions.js.
 *
 * Read-only. Writes docs/data/th-cite1-phase4c-browser-citation-deletion-<date>.json
 * and exits non-zero on any gate failure.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const SITE_ROOT = path.join(REPO_ROOT, "_site");
const OUT = path.join(REPO_ROOT, "docs", "data", "th-cite1-phase4c-browser-citation-deletion-2026-08-18.json");

function readIfExists(rel) {
  const full = path.join(REPO_ROOT, rel);
  return fs.existsSync(full) ? fs.readFileSync(full, "utf8") : null;
}

function existsPath(rel) {
  return fs.existsSync(path.join(REPO_ROOT, rel));
}

function main() {
  const thesisHubJs = readIfExists("src/js/thesis-hub-actions.js");
  const detailBody = readIfExists("src/_includes/thesis-detail-body.njk");
  const detailPageJs = readIfExists("src/opinnaytteet/thesis-details.njk");
  const archiveFi = readIfExists("src/opinnaytteet.njk");
  const archiveEn = readIfExists("src/en/theses.njk");
  const citationModalNjk = readIfExists("src/_includes/thesis-citation-modal.njk");

  const gates = {};
  const evidence = {};

  // 1. src/js/thesis-hub-actions.js must NOT contain any browser
  //    thesis citation composer.
  const composerNames = [
    "buildThesisApa",
    "buildThesisMla",
    "buildThesisChicago",
    "buildThesisBibTeX",
    "buildThesisRis",
    "getCitationByFormat"
  ];
  for (const name of composerNames) {
    const pattern = new RegExp("\\b" + name + "\\b");
    const key = "thesisHubHasNo_" + name;
    gates[key] = !!thesisHubJs && !pattern.test(thesisHubJs);
    evidence[key] = { file: "src/js/thesis-hub-actions.js", pattern: pattern.source, found: !!thesisHubJs && pattern.test(thesisHubJs) };
  }

  // 2. The browser thesis-level translation helper must be gone from
  //    thesis-hub-actions.js. It may still live in src/_data/theses.js
  //    (server-side Phase 6 target).
  gates.thesisHubHasNo_getThesisLevelLabel = !!thesisHubJs && !/\bgetThesisLevelLabel\b/.test(thesisHubJs);
  evidence.thesisHubHasNo_getThesisLevelLabel = {
    file: "src/js/thesis-hub-actions.js",
    found: !!thesisHubJs && /\bgetThesisLevelLabel\b/.test(thesisHubJs)
  };

  // 3. Abstract-modal DOM lookups must be gone from
  //    thesis-hub-actions.js.
  const abstractDomIds = [
    "thesisAbstractModal",
    "thesisAbstractModalText",
    "thesisAbstractModalTitle",
    "thesisAbstractModalOpen",
    "thesisAbstractExportBtn",
    "thesisModalApaText",
    "data-thesis-abstract-trigger",
    "openAbstractModal"
  ];
  for (const name of abstractDomIds) {
    const pattern = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const key = "thesisHubHasNoAbstractModal_" + name.replace(/[^A-Za-z0-9]+/g, "_");
    gates[key] = !!thesisHubJs && !pattern.test(thesisHubJs);
    evidence[key] = { file: "src/js/thesis-hub-actions.js", pattern: pattern.source, found: !!thesisHubJs && pattern.test(thesisHubJs) };
  }

  // 4. The now-orphaned templates must be gone.
  gates.orphanTemplateHubModalsGone = !existsPath("src/_includes/thesis-hub-modals.njk");
  gates.orphanTemplateTableGone = !existsPath("src/_includes/thesis-table.njk");
  evidence.orphanTemplateHubModalsGone = { file: "src/_includes/thesis-hub-modals.njk", exists: !gates.orphanTemplateHubModalsGone };
  evidence.orphanTemplateTableGone = { file: "src/_includes/thesis-table.njk", exists: !gates.orphanTemplateTableGone };

  // 5. Phase 4B modal include must still exist.
  gates.detailCitationModalIncludePresent = existsPath("src/_includes/thesis-citation-modal.njk");
  gates.detailCitationModalIncludeUsed =
    !!detailBody && /include\s+"thesis-citation-modal\.njk"/.test(detailBody);
  evidence.detailCitationModalIncludePresent = { file: "src/_includes/thesis-citation-modal.njk" };
  evidence.detailCitationModalIncludeUsed = { file: "src/_includes/thesis-detail-body.njk" };

  // 6. Detail-page trigger carries CSL + lang and no longer carries
  //    the raw-field payload that Phase 4C deleted.
  gates.detailTriggerCarriesCsl =
    !!detailBody && /data-thesis-csl=/.test(detailBody) && /data-thesis-citation-trigger/.test(detailBody);
  gates.detailTriggerCarriesLang =
    !!detailBody && /data-thesis-lang=/.test(detailBody);
  gates.detailTriggerNoRawTitle = !!detailBody && !/data-thesis-title=/.test(detailBody);
  gates.detailTriggerNoRawAuthors = !!detailBody && !/data-thesis-authors=/.test(detailBody);
  gates.detailTriggerNoRawYear = !!detailBody && !/data-thesis-year=/.test(detailBody);
  gates.detailTriggerNoRawType = !!detailBody && !/data-thesis-type=/.test(detailBody);
  gates.detailTriggerNoRawUrl = !!detailBody && !/data-thesis-url=/.test(detailBody);

  // 7. publication-citation.js must be loaded before thesis-hub-actions.js
  //    on the thesis detail template so the shared renderer is
  //    available when the modal fires.
  if (detailPageJs) {
    const pcIdx = detailPageJs.indexOf("/js/publication-citation.js");
    const thIdx = detailPageJs.indexOf("/js/thesis-hub-actions.js");
    gates.detailLoadsPublicationCitationBeforeThesisHub =
      pcIdx >= 0 && thIdx >= 0 && pcIdx < thIdx;
    evidence.detailLoadsPublicationCitationBeforeThesisHub = { file: "src/opinnaytteet/thesis-details.njk", pcIdx, thIdx };
  } else {
    gates.detailLoadsPublicationCitationBeforeThesisHub = false;
    evidence.detailLoadsPublicationCitationBeforeThesisHub = { file: "src/opinnaytteet/thesis-details.njk", missing: true };
  }

  // 8. Archive templates must NOT load thesis-hub-actions.js or
  //    include the old modal file. Comment lines mentioning the
  //    files as historical notes are allowed; actual includes/
  //    pageScripts entries are not.
  const forbiddenArchive = [
    /- \/js\/thesis-hub-actions\.js/,
    /include\s+"thesis-hub-modals\.njk"/
  ];
  gates.archiveFiHasNoThesisHubScript = !!archiveFi && !forbiddenArchive[0].test(archiveFi);
  gates.archiveFiHasNoLegacyModalInclude = !!archiveFi && !forbiddenArchive[1].test(archiveFi);
  gates.archiveEnHasNoThesisHubScript = !!archiveEn && !forbiddenArchive[0].test(archiveEn);
  gates.archiveEnHasNoLegacyModalInclude = !!archiveEn && !forbiddenArchive[1].test(archiveEn);

  // 9. Built-output sanity: thesis detail page has trigger + loads
  //    publication-citation.js + thesis-hub-actions.js; archive does
  //    NOT ship thesis-hub-actions.js or thesisAbstractModal.
  const builtDetailHtml = readIfExists("_site/opinnaytteet/18096/index.html");
  const builtArchiveFi = readIfExists("_site/opinnaytteet/index.html");
  const builtArchiveEn = readIfExists("_site/en/theses/index.html");

  const builtDetailChecks = builtDetailHtml ? {
    hasCitationTrigger: /data-thesis-citation-trigger/.test(builtDetailHtml),
    hasCitationModal: /id="thesisCitationModal"/.test(builtDetailHtml),
    hasNoAbstractModal: !/id="thesisAbstractModal"/.test(builtDetailHtml),
    loadsSharedRenderer: builtDetailHtml.includes("/js/publication-citation.js"),
    loadsThesisHubActions: builtDetailHtml.includes("/js/thesis-hub-actions.js")
  } : null;
  const builtArchiveFiChecks = builtArchiveFi ? {
    hasNoCitationTrigger: !/data-thesis-citation-trigger/.test(builtArchiveFi),
    hasNoCitationModal: !/id="thesisCitationModal"/.test(builtArchiveFi),
    hasNoAbstractModal: !/id="thesisAbstractModal"/.test(builtArchiveFi),
    doesNotLoadThesisHubActions: !builtArchiveFi.includes("/js/thesis-hub-actions.js")
  } : null;
  const builtArchiveEnChecks = builtArchiveEn ? {
    hasNoCitationTrigger: !/data-thesis-citation-trigger/.test(builtArchiveEn),
    hasNoCitationModal: !/id="thesisCitationModal"/.test(builtArchiveEn),
    hasNoAbstractModal: !/id="thesisAbstractModal"/.test(builtArchiveEn),
    doesNotLoadThesisHubActions: !builtArchiveEn.includes("/js/thesis-hub-actions.js")
  } : null;

  gates.builtDetailIsWiredThroughSharedRenderer = builtDetailChecks
    && builtDetailChecks.hasCitationTrigger
    && builtDetailChecks.hasCitationModal
    && builtDetailChecks.hasNoAbstractModal
    && builtDetailChecks.loadsSharedRenderer
    && builtDetailChecks.loadsThesisHubActions;
  gates.builtArchiveFiShipsNoModalDom = builtArchiveFiChecks
    && builtArchiveFiChecks.hasNoCitationTrigger
    && builtArchiveFiChecks.hasNoCitationModal
    && builtArchiveFiChecks.hasNoAbstractModal
    && builtArchiveFiChecks.doesNotLoadThesisHubActions;
  gates.builtArchiveEnShipsNoModalDom = builtArchiveEnChecks
    && builtArchiveEnChecks.hasNoCitationTrigger
    && builtArchiveEnChecks.hasNoCitationModal
    && builtArchiveEnChecks.hasNoAbstractModal
    && builtArchiveEnChecks.doesNotLoadThesisHubActions;

  // 10. Phase 6 server-side path retained (informational; NOT
  //     deleted in Phase 4C). Missing = failure.
  const serverThesesData = readIfExists("src/_data/theses.js");
  gates.serverBuildApaCitationRetained = !!serverThesesData && /\bfunction\s+buildApaCitation\b/.test(serverThesesData);
  gates.serverWithCitationRetained = !!serverThesesData && /\bfunction\s+withCitation\b/.test(serverThesesData);
  gates.serverGetThesisLevelLabelRetained = !!serverThesesData && /\bfunction\s+getThesisLevelLabel\b/.test(serverThesesData);

  const gateFailures = Object.entries(gates).filter(function (e) { return !e[1]; }).map(function (e) { return e[0]; });

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "TH-CITE1 Phase 4C — browser thesis citation composition deletion",
    gates: gates,
    gateFailures: gateFailures,
    evidence: evidence,
    builtDetailChecks: builtDetailChecks,
    builtArchiveFiChecks: builtArchiveFiChecks,
    builtArchiveEnChecks: builtArchiveEnChecks,
    productionChangePolicy: "AUDIT ONLY. Verifies deletion evidence in source + built _site output."
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log("gates checked: " + Object.keys(gates).length);
  console.log("gate failures: " + (gateFailures.length === 0 ? "(none)" : gateFailures.join(", ")));
  if (gateFailures.length > 0) process.exit(1);
}

main();

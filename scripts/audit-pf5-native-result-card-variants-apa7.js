#!/usr/bin/env node
/**
 * PF5 — Native Result-Card Variants + APA7 Readiness Audit (static)
 *
 * Deterministic inspection of the current repo state to answer:
 *  - is an APA citation formatter available?
 *  - are the fields required for APA (publications) + thesis APA
 *    citations already on the shared Find & Explore renderer's
 *    entry object?
 *  - are the presentation and media horizontal-variant data hooks
 *    present?
 *  - are all invariants that PF5 must preserve still green?
 *
 * Read-only. Exits non-zero on any hard invariant gate failure.
 *
 * Writes: docs/data/pf5-native-result-card-variants-apa7-audit-2026-08-16.json
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pf5-native-result-card-variants-apa7-audit-2026-08-16.json"
);

function readOrEmpty(rel) {
  const full = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

function main() {
  const julkaisutSource = readOrEmpty("src/julkaisut.njk");
  const findExploreSource = readOrEmpty("src/js/find-explore.js");
  const publicationsFindExploreSource = readOrEmpty("src/_utils/publicationsFindExplore.js");
  const thesesFindExploreSource = readOrEmpty("src/_utils/thesesFindExplore.js");
  const thesisDetailsSource = readOrEmpty("src/_data/thesisDetails.js");
  const thesisHubActionsSource = readOrEmpty("src/js/thesis-hub-actions.js");
  const presentationPagefindSource = readOrEmpty("scripts/_lib/presentationPagefind.js");

  const findings = {
    apaFormatterInJulkaisut: /function\s+buildApaCitation\s*\(/.test(julkaisutSource),
    mlaFormatterInJulkaisut: /function\s+buildMlaCitation\s*\(/.test(julkaisutSource),
    chicagoFormatterInJulkaisut: /function\s+buildChicagoCitation\s*\(/.test(julkaisutSource),
    bibtexFormatterInJulkaisut: /function\s+buildBibtexEntry\s*\(/.test(julkaisutSource),
    thesisCitationApaExposedOnData: /citationApa\s*:\s*pickString\(thesis\.citationApa\)/.test(thesisDetailsSource),
    thesisHubActionsHasApaComposer: /\$\{authors\}\s*\(\$\{year\}\)/.test(thesisHubActionsSource),

    publicationFieldsOnRecord: {
      authors: /authors\s*:\s*record\.authors/.test(findExploreSource) || /authors\s*:\s*item\.authors/.test(publicationsFindExploreSource),
      year: /year\s*:\s*record\.year/.test(findExploreSource) || /year\s*:\s*item\.year/.test(publicationsFindExploreSource),
      journal: /journal\s*:\s*item\.journal/.test(publicationsFindExploreSource),
      publisher: /publisher\s*:\s*item\.publisher/.test(publicationsFindExploreSource),
      doi: /doi\s*:\s*item\.doi/.test(publicationsFindExploreSource),
      volume: /volume\s*:\s*item\.volume/.test(publicationsFindExploreSource),
      issue: /issue\s*:\s*item\.issue/.test(publicationsFindExploreSource),
      pages: /pages\s*:\s*item\.pages/.test(publicationsFindExploreSource),
      isbn: /isbn\s*:\s*item\.isbn/.test(publicationsFindExploreSource),
      sourceUrl: /sourceUrl\s*:\s*item\.url\s*\|\|\s*item\.doiUrl/.test(publicationsFindExploreSource)
    },

    thesisFieldsOnPagefindMeta: {
      thesesType: /thesesType\s*:/.test(thesesFindExploreSource),
      thesesYear: /thesesYear\s*:/.test(thesesFindExploreSource),
      thesesAuthorLine: /thesesAuthorLine\s*:/.test(thesesFindExploreSource),
      thesesLang: /thesesLang\s*:/.test(thesesFindExploreSource),
      thesesRole: /thesesRole\s*:/.test(thesesFindExploreSource),
      thesesDescription: /thesesDescription\s*:/.test(thesesFindExploreSource)
    },

    presentationFieldsOnPagefindMeta: {
      PresentationType: /PresentationType\s*:/.test(presentationPagefindSource),
      PresentationYear: /PresentationYear\s*:/.test(presentationPagefindSource),
      PresentationEvent: /PresentationEvent\s*:/.test(presentationPagefindSource),
      PresentationLandingType: /PresentationLandingType\s*:/.test(presentationPagefindSource),
      PresentationSourceType: /PresentationSourceType\s*:/.test(presentationPagefindSource),
      presentationThumbnail: /presentationThumbnail|PresentationThumbnail/.test(presentationPagefindSource)
    },

    findExploreKinds: {
      publicationsKind: /publications\s*:\s*\{/.test(findExploreSource),
      thesesKind: /theses\s*:\s*\{/.test(findExploreSource),
      writingsKind: /writings\s*:\s*\{/.test(findExploreSource),
      presentationsKind: /presentations\s*:\s*\{[\s\S]*researchTopicPresetMap/.test(findExploreSource),
      researchContextKind: /researchContext\s*:\s*\{/.test(findExploreSource),
      mediaKind: /\bmedia\s*:\s*\{[^}]*resultMeta/.test(findExploreSource)
    },

    invariants: {
      noSisaltoTutkimusInFindExplore: !/Sisältö\s*:\s*Tutkimus/.test(findExploreSource),
      pagefindBodyGuardStillActive: !/data-pagefind-body/.test(findExploreSource),
      pf3FamilyBadgePresent: /find-explore-result-family-badge/.test(findExploreSource),
      pf4HierarchyHooksPresent: /data-find-explore-card-line=/.test(findExploreSource),
      pfPerf2WarmupPresent: /warmSearchLanguages/.test(findExploreSource),
      pfPerf2EnterHandlerPresent: /controlsForm[\s\S]{0,200}addEventListener[\s\S]{0,60}submit/.test(findExploreSource)
    }
  };

  // Hard gates — these must all be true to prove PF5 can proceed
  // without new Pagefind metadata (option A / C).
  const gates = {
    apaFormatterExists: findings.apaFormatterInJulkaisut,
    thesisApaFieldsAvailable:
      findings.thesisFieldsOnPagefindMeta.thesesAuthorLine
      && findings.thesisFieldsOnPagefindMeta.thesesType
      && findings.thesisFieldsOnPagefindMeta.thesesYear,
    publicationFieldsComplete:
      findings.publicationFieldsOnRecord.authors
      && findings.publicationFieldsOnRecord.year
      && findings.publicationFieldsOnRecord.journal
      && findings.publicationFieldsOnRecord.doi,
    presentationFieldsForHorizontalVariant:
      findings.presentationFieldsOnPagefindMeta.PresentationType
      && findings.presentationFieldsOnPagefindMeta.PresentationEvent
      && findings.presentationFieldsOnPagefindMeta.PresentationYear,
    findExploreHasAllExpectedKinds:
      findings.findExploreKinds.publicationsKind
      && findings.findExploreKinds.thesesKind
      && findings.findExploreKinds.writingsKind
      && findings.findExploreKinds.presentationsKind,
    // Invariants: all must hold. PF5-AUDIT must not have broken them.
    noSisaltoTutkimusInRenderer: findings.invariants.noSisaltoTutkimusInFindExplore,
    noPagefindBodyGuardBypass: findings.invariants.pagefindBodyGuardStillActive,
    pf3FamilyBadgeIntact: findings.invariants.pf3FamilyBadgePresent,
    pf4HierarchyIntact: findings.invariants.pf4HierarchyHooksPresent,
    pfPerf2WarmupIntact: findings.invariants.pfPerf2WarmupPresent,
    pfPerf2EnterHandlerIntact: findings.invariants.pfPerf2EnterHandlerPresent
  };

  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PF5 native result-card variants + APA7 readiness (static audit)",
    findings,
    gates,
    gateFailures,
    readinessSummary: {
      publicationsApa: findings.apaFormatterInJulkaisut
        && findings.publicationFieldsOnRecord.authors
        && findings.publicationFieldsOnRecord.doi
        ? "READY"
        : "PARTIAL",
      thesesApa: findings.thesisFieldsOnPagefindMeta.thesesAuthorLine
        && findings.thesisFieldsOnPagefindMeta.thesesType
        ? "READY"
        : "PARTIAL",
      presentationsHorizontal: findings.findExploreKinds.presentationsKind
        && findings.presentationFieldsOnPagefindMeta.PresentationType
        ? "READY"
        : "PARTIAL",
      mediaHorizontal: findings.findExploreKinds.mediaKind
        ? "READY"
        : "PARTIAL — media is not a shared Find & Explore kind"
    }
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log("readiness:", JSON.stringify(report.readinessSummary));
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main();

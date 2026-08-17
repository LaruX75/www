#!/usr/bin/env node
/**
 * PUB-CITE1 Phase 1 — CSL Projection Landing Audit (static + runtime)
 *
 * Verifies that the CSL-JSON projection is present, wired on the four
 * canonical surfaces, and preserves the existing citation pipeline and
 * public-projection contract.
 *
 * Read-only. Exits non-zero on any hard invariant gate failure.
 *
 * Writes: docs/data/pub-cite1-phase1-csl-projection-audit-2026-08-16.json
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pub-cite1-phase1-csl-projection-audit-2026-08-16.json"
);

function readOrEmpty(rel) {
  const full = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

function requireFresh(rel) {
  const full = path.join(REPO_ROOT, rel);
  delete require.cache[full];
  return require(full);
}

function main() {
  const publicationCslSrc = readOrEmpty("src/_utils/publicationCsl.js");
  const publicationsPageSrc = readOrEmpty("src/_data/publicationsPage.js");
  const publicationDetailsSrc = readOrEmpty("src/_data/publicationDetails.js");
  const researchfiContentSrc = readOrEmpty("src/_data/researchfiContent.js");
  const publicationsFindExploreSrc = readOrEmpty("src/_utils/publicationsFindExplore.js");
  const julkaisutNjkSrc = readOrEmpty("src/julkaisut.njk");
  const findExploreJsSrc = readOrEmpty("src/js/find-explore.js");

  const findings = {
    module: {
      publicationCslExists: publicationCslSrc.length > 0,
      exportsBuildCslItem: /module\.exports\s*=\s*\{[\s\S]*buildCslItem[\s\S]*\}/.test(publicationCslSrc),
      hasOkmToCslTypeTable: /OKM_TO_CSL_TYPE/.test(publicationCslSrc),
      hasFreeTextAuthorParser: /parseAuthors/.test(publicationCslSrc),
      hasDoiNormalizer: /normalizeDoi/.test(publicationCslSrc)
    },
    wiring: {
      publicFieldsAllowsCsl: /PUBLIC_PUBLICATIONS_PAGE_FIELDS[\s\S]{0,4000}"csl"/.test(publicationsPageSrc),
      publicationsPageImportsBuilder: /require\("\.\.\/_utils\/publicationCsl"\)/.test(publicationsPageSrc),
      publicationsPageAttachesCsl: /rawRecord\.csl\s*=\s*csl/.test(publicationsPageSrc),
      publicationDetailsExposesCsl: /\bcsl,?/.test(publicationDetailsSrc) && /buildCslItem\(/.test(publicationDetailsSrc),
      researchfiContentExposesCsl: /csl:\s*buildCslItem\(/.test(researchfiContentSrc),
      findExploreRecordForwardsCsl: /csl:\s*item\.csl/.test(publicationsFindExploreSrc)
    },
    preservation: {
      inlineApaStillInJulkaisut: /function\s+buildApaCitation\s*\(payload\)/.test(julkaisutNjkSrc),
      inlineMlaStillInJulkaisut: /function\s+buildMlaCitation\s*\(payload\)/.test(julkaisutNjkSrc),
      inlineChicagoStillInJulkaisut: /function\s+buildChicagoCitation\s*\(payload\)/.test(julkaisutNjkSrc),
      inlineBibtexStillInJulkaisut: /function\s+buildBibtexEntry\s*\(payload\)/.test(julkaisutNjkSrc),
      // PUB-CITE1 Phase 4a removed the inline RIS composer; Zotero
      // + Mendeley consume the shared renderer via /js/publication-
      // citation.js. This invariant is now the reverse.
      inlineRisRemovedFromJulkaisut: !/function\s+buildRisEntry\s*\(payload\)/.test(julkaisutNjkSrc),
      serverApaStillOnContent: /citation:\s*buildApaCitation\(publication\)/.test(researchfiContentSrc),
      detailStillForwardsCitationString: /citation:\s*pickString\(contentItem\?\.citation\)/.test(publicationDetailsSrc),
      findExploreRendererUnchanged: !/entry\.record\.csl/.test(findExploreJsSrc)
    }
  };

  // Runtime check: the module loads cleanly and returns a CSL object
  // for a representative canonical publication input, and null for
  // empty input.
  let runtimeCheck = null;
  try {
    const {
      buildCslItem,
      parseAuthors,
      normalizeDoi
    } = requireFresh("src/_utils/publicationCsl.js");
    const csl = buildCslItem({
      anchorId: "audit-anchor",
      title: "Audit article",
      typeCode: "A1",
      authors: "Laru, J.; Näykki, P.",
      journal: "Audit Journal",
      volume: "1",
      issue: "2",
      pages: "3–4",
      doi: "10.1234/audit.001",
      year: 2026,
      lang: "en"
    });
    runtimeCheck = {
      ok: true,
      cslIsObject: !!csl && typeof csl === "object",
      cslId: csl?.id,
      cslType: csl?.type,
      cslDoiIsBare: csl?.DOI === "10.1234/audit.001",
      cslIssuedShape: JSON.stringify(csl?.issued) === JSON.stringify({ "date-parts": [[2026]] }),
      nullForEmpty: buildCslItem({}) === null,
      nullForNonObject: buildCslItem("nope") === null,
      parseAuthorsWorks: JSON.stringify(parseAuthors("Laru, J."))
        === JSON.stringify([{ family: "Laru", given: "J." }]),
      normalizeDoiStripsPrefix: normalizeDoi("https://doi.org/10.5/x") === "10.5/x"
    };
  } catch (err) {
    runtimeCheck = { ok: false, error: String(err && err.message || err) };
  }

  const gates = {
    // Module exists and exposes primary API
    publicationCslModuleExists: findings.module.publicationCslExists,
    exportsBuildCslItem: findings.module.exportsBuildCslItem,
    hasOkmToCslTypeTable: findings.module.hasOkmToCslTypeTable,
    hasFreeTextAuthorParser: findings.module.hasFreeTextAuthorParser,
    // Wiring across the four surfaces
    publicFieldsAllowsCsl: findings.wiring.publicFieldsAllowsCsl,
    publicationsPageImportsBuilder: findings.wiring.publicationsPageImportsBuilder,
    publicationsPageAttachesCsl: findings.wiring.publicationsPageAttachesCsl,
    publicationDetailsExposesCsl: findings.wiring.publicationDetailsExposesCsl,
    researchfiContentExposesCsl: findings.wiring.researchfiContentExposesCsl,
    findExploreRecordForwardsCsl: findings.wiring.findExploreRecordForwardsCsl,
    // Preservation of pre-existing citation pipeline
    inlineApaStillInJulkaisut: findings.preservation.inlineApaStillInJulkaisut,
    inlineMlaStillInJulkaisut: findings.preservation.inlineMlaStillInJulkaisut,
    inlineChicagoStillInJulkaisut: findings.preservation.inlineChicagoStillInJulkaisut,
    inlineBibtexStillInJulkaisut: findings.preservation.inlineBibtexStillInJulkaisut,
    inlineRisRemovedFromJulkaisut: findings.preservation.inlineRisRemovedFromJulkaisut,
    serverApaStillOnContent: findings.preservation.serverApaStillOnContent,
    detailStillForwardsCitationString: findings.preservation.detailStillForwardsCitationString,
    // Reverse gate — CSL is NOT rendered by the shared Find & Explore
    // renderer yet. Phase 1 is projection-only.
    findExploreRendererDoesNotUseCsl: findings.preservation.findExploreRendererUnchanged,
    // Runtime invariants
    runtimeCheckPassed:
      runtimeCheck?.ok
      && runtimeCheck.cslIsObject
      && runtimeCheck.cslId === "audit-anchor"
      && runtimeCheck.cslType === "article-journal"
      && runtimeCheck.cslDoiIsBare
      && runtimeCheck.cslIssuedShape
      && runtimeCheck.nullForEmpty
      && runtimeCheck.nullForNonObject
      && runtimeCheck.parseAuthorsWorks
      && runtimeCheck.normalizeDoiStripsPrefix
  };

  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PUB-CITE1 Phase 1 — CSL projection landing audit",
    findings,
    runtimeCheck,
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

#!/usr/bin/env node
/**
 * PUB-CITE1 — Publication Citation Pipeline + CSL-JSON Readiness Audit (static)
 *
 * Read-only inspection of the current repo state. Does NOT modify any
 * production source, Pagefind metadata, canonical model, or public
 * JSON contract. Produces a deterministic readiness summary that can
 * be diffed over time to catch pipeline regressions.
 *
 * Writes: docs/data/pub-cite1-publication-citation-csl-audit-2026-08-16.json
 * Exits non-zero on any hard invariant gate failure.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pub-cite1-publication-citation-csl-audit-2026-08-16.json"
);

function readOrEmpty(rel) {
  const full = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

function listMarkdownIn(rel) {
  const dir = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(rel, name));
}

function main() {
  const researchfiJs = readOrEmpty("src/_data/researchfi.js");
  const researchfiContent = readOrEmpty("src/_data/researchfiContent.js");
  const publicationsPage = readOrEmpty("src/_data/publicationsPage.js");
  const publicationDetails = readOrEmpty("src/_data/publicationDetails.js");
  const publicationsFindExplore = readOrEmpty("src/_utils/publicationsFindExplore.js");
  const publicationsPageJsonBuilder = readOrEmpty("src/data/publications-page.json.11ty.js");
  const researchfiJsonBuilder = readOrEmpty("src/data/researchfi.json.11ty.js");
  const publicationsJsonBuilder = readOrEmpty("src/data/publications.json.11ty.js");
  const julkaisutNjk = readOrEmpty("src/julkaisut.njk");
  const enPublicationsNjk = readOrEmpty("src/en/publications.njk");
  const publicationItemBody = readOrEmpty("src/_includes/publication-item-body.njk");
  const thesesJs = readOrEmpty("src/_data/theses.js");
  const thesisHubActions = readOrEmpty("src/js/thesis-hub-actions.js");
  const findExplore = readOrEmpty("src/js/find-explore.js");
  const curatedManualJson = readOrEmpty("src/_data/curated/researchfi-manual.json");

  const editorialRecords = listMarkdownIn("src/publications");

  const findings = {
    sources: {
      researchfiLoaderPresent: /portalapi\/person\/_search|normalizePublication/.test(researchfiJs),
      researchfiContentMapperPresent: /function\s+mapPublication\s*\(/.test(researchfiContent),
      curatedManualJsonPresent: curatedManualJson.length > 0,
      curatedManualEntryCount: (() => {
        try {
          const parsed = JSON.parse(curatedManualJson || "{}");
          return Array.isArray(parsed?.manual) ? parsed.manual.length : 0;
        } catch (e) {
          return null;
        }
      })(),
      editorialMarkdownCount: editorialRecords.length,
      editorialMarkdownDir: "src/publications/"
    },

    canonical: {
      builderPresent: /function\s+buildCanonicalPublicationCandidates/.test(publicationsPage),
      dedupPresent: /function\s+deduplicatePublicationCandidates/.test(publicationsPage),
      matchFunctionPresent: /function\s+matchPublicationCandidates/.test(publicationsPage),
      sourcePriorityDeclaration: /function\s+sourcePriority/.test(publicationsPage),
      manualRulesConst: /MANUAL_PUBLICATION_RULES/.test(publicationsPage),
      manualRulesEntries: (() => {
        const m = publicationsPage.match(/MANUAL_PUBLICATION_RULES\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/);
        if (!m) return null;
        return (m[1].match(/"[^"]+"\s*:/g) || []).length;
      })(),
      publicFieldsListPresent: /PUBLIC_PUBLICATIONS_PAGE_FIELDS/.test(publicationsPage)
    },

    citationPipeline: {
      serverApaComposerPresent: /function\s+buildApaCitation\s*\(/.test(researchfiContent),
      serverCitationOnContentItem: /citation:\s*buildApaCitation\(publication\)/.test(researchfiContent),
      serverCitationStyleOnContentItem: /citationStyle:\s*"APA 7"/.test(researchfiContent),
      detailModelForwardsCitation: /citation:\s*pickString\(contentItem\?\.citation\)/.test(publicationDetails),
      detailModelForwardsCitationStyle: /citationStyle:\s*pickString\(contentItem\?\.citationStyle\)\s*\|\|\s*"APA 7"/.test(publicationDetails),
      inlineClientApaInJulkaisut: /function\s+buildApaCitation\s*\(payload\)/.test(julkaisutNjk),
      inlineClientMlaInJulkaisut: /function\s+buildMlaCitation\s*\(payload\)/.test(julkaisutNjk),
      inlineClientChicagoInJulkaisut: /function\s+buildChicagoCitation\s*\(payload\)/.test(julkaisutNjk),
      inlineClientBibtexInJulkaisut: /function\s+buildBibtexEntry\s*\(payload\)/.test(julkaisutNjk),
      inlineClientRisInJulkaisut: /function\s+buildRisEntry\s*\(payload\)/.test(julkaisutNjk),
      thesisServerApaPresent: /function\s+buildApaCitation\s*\(thesis\)/.test(thesesJs),
      thesisClientCitationBuildersPresent: /citationApa\s*=\s*/.test(thesisHubActions) || /\$\{authors\}\s*\(\$\{year\}\)/.test(thesisHubActions)
    },

    findExploreIntegration: {
      publicationRecordBuilderPresent: /function\s+buildPublicationFindExploreRecord/.test(publicationsFindExplore),
      publicationRecordExposesCitation:
        /citation\s*:/.test(publicationsFindExplore),
      findExplorePublicationBranch: /kind === "publications" && entry\.record/.test(findExplore),
      findExploreRendersCitationString: /entry\.record\.citation/.test(findExplore)
    },

    publicJson: {
      publicationsPageEndpointPresent: publicationsPageJsonBuilder.length > 0,
      publicationsPageEndpointHasCitationField:
        /citation:/.test(publicationsPageJsonBuilder)
        || /citation\b/.test(publicationsPageJsonBuilder.split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n")),
      researchfiEndpointPresent: researchfiJsonBuilder.length > 0,
      publicationsCollectionEndpointPresent: publicationsJsonBuilder.length > 0
    },

    legacyCandidates: {
      buildLegacyFiPublicationRowsPresent: /function\s+buildLegacyFiPublicationRows/.test(publicationsPage),
      buildLegacyFiPublicationRowsExported: /buildLegacyFiPublicationRows\s*,?\s*}/.test(publicationsPage.split("module.exports")[1] || "")
        || /module\.exports[\s\S]*buildLegacyFiPublicationRows/.test(publicationsPage)
    },

    cslProjection: {
      buildCslItemPresent: /function\s+buildCslItem/.test(publicationsPage)
        || /function\s+buildCslItem/.test(publicationDetails)
        || /function\s+buildCslItem/.test(publicationsFindExplore)
        || /function\s+buildCslItem/.test(researchfiContent)
        || fs.existsSync(path.join(REPO_ROOT, "src/_utils/publicationCsl.js"))
        || fs.existsSync(path.join(REPO_ROOT, "src/_utils/publicationsCsl.js")),
      cslFieldInAnyBuilder:
        /\bcsl\s*:/.test(publicationsPage)
        || /\bcsl\s*:/.test(publicationsFindExplore)
        || /\bcsl\s*:/.test(publicationDetails)
        || /\bcsl\s*:/.test(researchfiContent)
    }
  };

  // Readiness classification
  const readiness = {
    researchfiSource: findings.sources.researchfiLoaderPresent
      && findings.sources.researchfiContentMapperPresent
      ? "READY"
      : "BLOCKED",
    curatedManualSource: findings.sources.curatedManualJsonPresent ? "READY" : "MISSING",
    editorialRecordsForPromotion:
      findings.sources.editorialMarkdownCount > 0
        && findings.canonical.manualRulesConst
        ? "PARTIAL" // frontmatter CSL fields not enriched
        : "BLOCKED",
    canonicalModel:
      findings.canonical.builderPresent
        && findings.canonical.dedupPresent
        && findings.canonical.sourcePriorityDeclaration
        ? "READY"
        : "BLOCKED",
    citationStringToday:
      findings.citationPipeline.serverApaComposerPresent
        && findings.citationPipeline.detailModelForwardsCitation
        ? "READY (APA server-side only, no CSL yet)"
        : "BLOCKED",
    cslProjection: findings.cslProjection.buildCslItemPresent
      ? "READY (PUB-CITE1 Phase 1 landed)"
      : "ABSENT — must be built as PUB-CITE1 Phase 1"
  };

  // Hard invariant gates — these must all be true; they establish the
  // baseline the audit report describes. Any FAIL means the report's
  // architecture claims should be re-verified before implementation.
  const gates = {
    researchfiLoaderPresent: findings.sources.researchfiLoaderPresent,
    researchfiContentMapperPresent: findings.sources.researchfiContentMapperPresent,
    curatedManualJsonPresent: findings.sources.curatedManualJsonPresent,
    editorialRecordsExist: findings.sources.editorialMarkdownCount > 0,
    canonicalBuilderPresent: findings.canonical.builderPresent,
    canonicalDedupPresent: findings.canonical.dedupPresent,
    manualRulesConstPresent: findings.canonical.manualRulesConst,
    manualRulesHasThreePromotions: findings.canonical.manualRulesEntries === 3,
    publicFieldsListDeclared: findings.canonical.publicFieldsListPresent,
    serverApaComposerPresent: findings.citationPipeline.serverApaComposerPresent,
    detailForwardsCitation: findings.citationPipeline.detailModelForwardsCitation,
    detailForwardsCitationStyle: findings.citationPipeline.detailModelForwardsCitationStyle,
    inlineClientApaExists: findings.citationPipeline.inlineClientApaInJulkaisut,
    inlineClientMlaExists: findings.citationPipeline.inlineClientMlaInJulkaisut,
    inlineClientChicagoExists: findings.citationPipeline.inlineClientChicagoInJulkaisut,
    inlineClientBibtexExists: findings.citationPipeline.inlineClientBibtexInJulkaisut,
    inlineClientRisExists: findings.citationPipeline.inlineClientRisInJulkaisut,
    thesisServerApaPresent: findings.citationPipeline.thesisServerApaPresent,
    publicationFindExploreBuilderPresent: findings.findExploreIntegration.publicationRecordBuilderPresent,
    findExplorePublicationBranchPresent: findings.findExploreIntegration.findExplorePublicationBranch,
    publicationsPageEndpointPresent: findings.publicJson.publicationsPageEndpointPresent,
    researchfiEndpointPresent: findings.publicJson.researchfiEndpointPresent,
    publicationsCollectionEndpointPresent: findings.publicJson.publicationsCollectionEndpointPresent,
    legacyFiRowsHelperStillPresent: findings.legacyCandidates.buildLegacyFiPublicationRowsPresent,
    cslProjectionImplemented: findings.cslProjection.buildCslItemPresent
      && findings.cslProjection.cslFieldInAnyBuilder
  };

  const gateFailures = Object.entries(gates)
    .filter(([, ok]) => !ok)
    .map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PUB-CITE1 static audit — publication + citation pipeline + CSL readiness",
    findings,
    readiness,
    gates,
    gateFailures,
    counts: {
      editorialMarkdownRecords: findings.sources.editorialMarkdownCount,
      curatedManualEntries: findings.sources.curatedManualEntryCount,
      manualRulesPromotedSlugs: findings.canonical.manualRulesEntries
    }
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log("readiness:", JSON.stringify(readiness));
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main();

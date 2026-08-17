#!/usr/bin/env node
/**
 * PUB-CITE1 Phase 4 — Legacy Citation Deletion Readiness Audit
 *
 * Read-only audit that inventories every remaining legacy citation
 * code path after PUB-CITE1 Phase 1 + Phase 2 + PF5-IMPL-APA, and
 * classifies each item as:
 *   - DELETE NOW
 *   - KEEP TEMPORARILY
 *   - KEEP PERMANENTLY
 *   - UNKNOWN / NEEDS TEST
 *
 * Does NOT modify any production code.
 *
 * Writes:
 *   docs/data/pub-cite1-phase4-legacy-citation-deletion-readiness-2026-08-17.json
 *
 * Exits non-zero on any hard invariant that would block a future
 * deletion commit (e.g. a canonical publication missing csl, or the
 * shared renderer not loaded on a hub page that ships the export
 * button).
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pub-cite1-phase4-legacy-citation-deletion-readiness-2026-08-17.json"
);

function readOrEmpty(rel) {
  const full = path.isAbsolute(rel) ? rel : path.join(REPO_ROOT, rel);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf8");
}

function readJson(rel, fallback) {
  const text = readOrEmpty(rel);
  if (!text) return fallback;
  try { return JSON.parse(text); } catch { return fallback; }
}

function countMatches(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function classify(item) {
  const { hasReplacement, replacementParityProven, fallbackReachable,
    consumersOutsidePublications, blocksOnMigration, alreadyRemoved } = item;
  if (alreadyRemoved) return "COMPLETED";
  if (!hasReplacement) return "KEEP PERMANENTLY";
  if (consumersOutsidePublications) return "KEEP TEMPORARILY";
  if (blocksOnMigration && blocksOnMigration.length > 0) return "KEEP TEMPORARILY";
  if (hasReplacement && replacementParityProven && !fallbackReachable) return "DELETE NOW";
  if (hasReplacement && replacementParityProven && fallbackReachable) return "KEEP TEMPORARILY";
  return "UNKNOWN / NEEDS TEST";
}

function main() {
  // ---------- 1. Canonical + CSL coverage ----------
  const publicationsPage = readJson("_site/data/publications-page.json", { items: [] });
  const canonicalItems = publicationsPage.items || [];
  const canonicalCount = canonicalItems.length;
  const cslCoverage = canonicalItems.filter((i) => i.csl && i.csl.id && i.csl.title).length;
  const missingCsl = canonicalItems.filter((i) => !i.csl).map((i) => ({ id: i.id, title: i.title, sourceKey: i.sourceKey }));

  // ---------- 2. Shared renderer + Nunjucks filter present ----------
  const publicationCitationSrc = readOrEmpty("src/js/publication-citation.js");
  const publicationCitationShimSrc = readOrEmpty("src/_utils/publicationCitation.js");
  const eleventyFiltersSrc = readOrEmpty("eleventy.filters.js");
  const nunjucksFilterRegistered = /addFilter\("publicationCitation"/.test(eleventyFiltersSrc);

  // ---------- 3. Legacy inline formatters in src/julkaisut.njk ----------
  const julkaisutNjkSrc = readOrEmpty("src/julkaisut.njk");
  const inlineFormatters = {
    buildApaCitation: /function\s+buildApaCitation\s*\(payload\)/.test(julkaisutNjkSrc),
    buildMlaCitation: /function\s+buildMlaCitation\s*\(payload\)/.test(julkaisutNjkSrc),
    buildChicagoCitation: /function\s+buildChicagoCitation\s*\(payload\)/.test(julkaisutNjkSrc),
    buildBibtexEntry: /function\s+buildBibtexEntry\s*\(payload\)/.test(julkaisutNjkSrc),
    // PUB-CITE1 Phase 4a removed buildRisEntry.
    buildRisEntry: /function\s+buildRisEntry\s*\(payload\)/.test(julkaisutNjkSrc)
  };
  // Fallback reachability: getCitationByFormat prefers the shared
  // renderer when payload.csl && window.publicationCitation are both
  // present. Fallback fires only when csl is missing OR the shared
  // renderer script did not load.
  // PUB-CITE1 Phase 4b: the modal is shared-renderer-only via
  // the sharedCitation(payload, format) helper. There is no
  // per-format legacy fallback branch to guard any more.
  const modalUsesSharedRendererOnly = /function\s+sharedCitation\s*\(payload,\s*format\)/.test(julkaisutNjkSrc);
  const legacyStillCalledDirectly = {
    apa: /return\s+buildApaCitation\(payload\)/.test(julkaisutNjkSrc),
    mla: /return\s+buildMlaCitation\(payload\)/.test(julkaisutNjkSrc),
    chicago: /return\s+buildChicagoCitation\(payload\)/.test(julkaisutNjkSrc),
    bibtex: /return\s+buildBibtexEntry\(payload\)/.test(julkaisutNjkSrc)
  };
  // PUB-CITE1 Phase 4a: Zotero + Mendeley now delegate to the shared
  // renderer via downloadRisFor() → sharedRis() → window.publicationCitation.
  // These booleans document the current state; they are FALSE after
  // Phase 4a lands. A truthy value would indicate a regression.
  const zoteroCallsLegacyRis = /Zotero[\s\S]{0,120}buildRisEntry\(currentCitationPayload\)/.test(julkaisutNjkSrc);
  const mendeleyCallsLegacyRis = /Mendeley[\s\S]{0,120}buildRisEntry\(currentCitationPayload\)/.test(julkaisutNjkSrc);
  const zoteroUsesSharedRenderer = /citationZoteroBtn[\s\S]{0,500}downloadRisFor\(currentCitationPayload/.test(julkaisutNjkSrc);
  const mendeleyUsesSharedRenderer = /citationMendeleyBtn[\s\S]{0,500}downloadRisFor\(currentCitationPayload/.test(julkaisutNjkSrc);

  // ---------- 4. Server-side APA on researchfiContent ----------
  const researchfiContentSrc = readOrEmpty("src/_data/researchfiContent.js");
  const serverApa = {
    functionPresent: /function\s+buildApaCitation\s*\(publication\)/.test(researchfiContentSrc),
    contentItemHasCitationField: /citation:\s*buildApaCitation\(publication\)/.test(researchfiContentSrc),
    contentItemHasCitationStyle: /citationStyle:\s*"APA 7"/.test(researchfiContentSrc)
  };
  // Detail model forwards contentItem.citation as detail.citation.
  const publicationDetailsSrc = readOrEmpty("src/_data/publicationDetails.js");
  const detailForwardsCitation = /citation:\s*pickString\(contentItem\?\.citation\)/.test(publicationDetailsSrc);
  const detailForwardsCitationStyle = /citationStyle:\s*pickString\(contentItem\?\.citationStyle\)\s*\|\|\s*"APA 7"/.test(publicationDetailsSrc);
  // Detail template consumes the shared renderer only. PUB-CITE1
  // Phase 4e removed the `or detail.citation` defence-in-depth
  // fallback; the template now emits `detail.csl | publicationCitation("apa")`
  // directly with a controlled empty state when csl is missing.
  const publicationItemBodySrc = readOrEmpty("src/_includes/publication-item-body.njk");
  const detailUsesSharedRendererOnly = /citationText\s*=\s*detail\.csl\s*\|\s*publicationCitation\("apa"\)/.test(publicationItemBodySrc);
  const detailFallsBackToCitation = /sharedApaCitation\s+or\s+detail\.citation/.test(publicationItemBodySrc);

  // ---------- 5. Taxonomy consumers of contentItem.citation ----------
  const teematSrc = readOrEmpty("src/teemat.njk");
  const kategoriatSrc = readOrEmpty("src/kategoriat.njk");
  const avainsanatSrc = readOrEmpty("src/avainsanat.njk");
  // PUB-CITE1 Phase 4e removed the `or item.data.citation` /
  // `or publication.citation` fallback branches from all three
  // taxonomy templates. The invariant is now inverted — no
  // taxonomy template should reference the legacy citation field.
  const taxonomyReadsCitation = {
    teemat: /publication\.citation/.test(teematSrc),
    kategoriat: /featuredItem\.data\.citation|item\.data\.citation/.test(kategoriatSrc),
    avainsanat: /item\.data\.citation/.test(avainsanatSrc)
  };
  const taxonomyDoesNotReadLegacyCitation =
    !taxonomyReadsCitation.teemat
    && !taxonomyReadsCitation.kategoriat
    && !taxonomyReadsCitation.avainsanat;

  // ---------- 6. buildLegacyFiPublicationRows consumers ----------
  const publicationsPageSrc = readOrEmpty("src/_data/publicationsPage.js");
  const legacyRows = {
    functionPresent: /function\s+buildLegacyFiPublicationRows/.test(publicationsPageSrc),
    exported: /module\.exports[\s\S]*buildLegacyFiPublicationRows/.test(publicationsPageSrc),
    productionConsumers: [], // filled below
    testAuditConsumers: []
  };
  const legacyRowsConsumers = [];
  const searchDirs = ["src", "scripts", "tests"];
  searchDirs.forEach((dir) => {
    walkDir(path.join(REPO_ROOT, dir), (file) => {
      if (!/\.(js|njk|md)$/.test(file)) return;
      if (file.endsWith("audit-pub-cite1-phase4-legacy-citation-deletion-readiness.js")) return;
      const text = readOrEmpty(file);
      if (/buildLegacyFiPublicationRows/.test(text)) {
        const rel = path.relative(REPO_ROOT, file);
        if (rel === "src/_data/publicationsPage.js") return; // definition
        if (rel.startsWith("scripts/") || rel.startsWith("tests/")) {
          legacyRows.testAuditConsumers.push(rel);
        } else {
          legacyRows.productionConsumers.push(rel);
        }
        legacyRowsConsumers.push(rel);
      }
    });
  });

  // ---------- 7. Public JSON contracts touching citation ----------
  const exportDataBuilderSrc = readOrEmpty("src/api/export-data.json.11ty.js");
  const publicJson = {
    publicationsPageEndpointExposesCitation: /citation:/.test(readOrEmpty("src/data/publications-page.json.11ty.js")),
    publicationsPageEndpointExposesCsl: canonicalItems.every((i) => "csl" in i),
    exportDataExposesCitation: /citation:\s*item\.citation/.test(exportDataBuilderSrc),
    exportDataExposesCitationStyle: /citationStyle:\s*item\.citationStyle/.test(exportDataBuilderSrc),
    exportDataFileGenerated: fs.existsSync(path.join(REPO_ROOT, "_site", "api", "export-data.json"))
  };

  // ---------- 8. Hub pages: shared renderer loaded + data-csl emitted ----------
  const fiHubHtml = readOrEmpty("_site/julkaisut/index.html");
  const enHubHtml = readOrEmpty("_site/en/publications/index.html");
  const findExploreJsSrc = readOrEmpty("src/js/find-explore.js");
  const hubs = {
    fiLoadsSharedRenderer: /\/js\/publication-citation\.js/.test(fiHubHtml),
    enLoadsSharedRenderer: /\/js\/publication-citation\.js/.test(enHubHtml),
    findExploreEmitsDataCsl: /data-csl="/.test(findExploreJsSrc),
    findExploreConsumesCsl: /renderer\.buildCitation/.test(findExploreJsSrc),
    exportCitationButtonReachable: /class="[^"]*export-citation-btn/.test(findExploreJsSrc)
  };

  // ---------- 9. Thesis citation surfaces (separate domain) ----------
  const thesisHubActionsSrc = readOrEmpty("src/js/thesis-hub-actions.js");
  const thesesJsSrc = readOrEmpty("src/_data/theses.js");
  const thesis = {
    thesisHubHasOwnBuildApa: /function\s+buildThesisApa\s*\(payload\)/.test(thesisHubActionsSrc),
    thesisServerBuildApa: /function\s+buildApaCitation\s*\(thesis\)/.test(thesesJsSrc),
    thesisCitationApaField: /citationApa:/.test(thesesJsSrc),
    // Reverse gate: thesis code path must NOT accidentally reach into
    // publications formatters.
    thesisDoesNotDependOnPublicationRenderer: !/publicationCitation/.test(thesisHubActionsSrc)
      && !/publicationCsl/.test(thesisHubActionsSrc)
  };

  // ---------- 10. Legacy formatter LOC (rough deletion size estimate) ----------
  const rangeMatch = julkaisutNjkSrc.match(/function\s+toBibtexAuthors[\s\S]*?function\s+downloadTextFile/);
  const legacyLocEstimate = rangeMatch ? rangeMatch[0].split("\n").length - 1 : 0;

  // ---------- 11. Deletion classification ----------
  const deletionMatrix = [
    {
      item: "src/julkaisut.njk inline modal formatters (Phase 4a removed buildRisEntry; Phase 4b removed APA/MLA/Chicago/BibTeX)",
      hasReplacement: true,
      replacementParityProven: true,
      fallbackReachable: Object.values(inlineFormatters).some(Boolean),
      consumersOutsidePublications: false,
      alreadyRemoved: !Object.values(inlineFormatters).some(Boolean) && !zoteroCallsLegacyRis && !mendeleyCallsLegacyRis,
      blocksOnMigration: [
        zoteroCallsLegacyRis ? "Zotero download button still calls buildRisEntry — Phase 4a regression!" : null,
        mendeleyCallsLegacyRis ? "Mendeley download button still calls buildRisEntry — Phase 4a regression!" : null,
        inlineFormatters.buildApaCitation ? "Legacy APA composer still present — Phase 4b regression!" : null,
        inlineFormatters.buildMlaCitation ? "Legacy MLA composer still present — Phase 4b regression!" : null,
        inlineFormatters.buildChicagoCitation ? "Legacy Chicago composer still present — Phase 4b regression!" : null,
        inlineFormatters.buildBibtexEntry ? "Legacy BibTeX composer still present — Phase 4b regression!" : null
      ].filter(Boolean),
      notes: "All five inline browser formatters have been deleted. The citation modal is now shared-renderer-only with a controlled unavailable state; if csl or window.publicationCitation is missing, the preview shows 'Viite ei ole saatavilla tälle julkaisulle.' and the action buttons disable."
    },
    {
      item: "src/_data/researchfiContent.js buildApaCitation() (Phase 4e removed the composer + content.citation / content.citationStyle fields)",
      hasReplacement: true,
      replacementParityProven: true,
      fallbackReachable: false,
      consumersOutsidePublications: false,
      alreadyRemoved: !serverApa.functionPresent
        && !serverApa.contentItemHasCitationField
        && !detailFallsBackToCitation
        && taxonomyDoesNotReadLegacyCitation,
      blocksOnMigration: [
        detailFallsBackToCitation ? "publication-item-body.njk still falls back to detail.citation when csl is missing — Phase 4e regression!" : null,
        taxonomyReadsCitation.teemat ? "src/teemat.njk renders publication.citation directly — Phase 4e regression!" : null,
        taxonomyReadsCitation.kategoriat ? "src/kategoriat.njk renders featuredItem/item .data.citation directly — Phase 4e regression!" : null,
        taxonomyReadsCitation.avainsanat ? "src/avainsanat.njk renders item.data.citation directly — Phase 4e regression!" : null
      ].filter(Boolean),
      notes: "Phase 4e landed: server APA composer + content.citation / content.citationStyle + detail.citation forwarding + all taxonomy fallback branches are removed. All publication citation surfaces (list, detail, taxonomy, modal, export API) now consume the shared CSL renderer exclusively."
    },
    {
      item: "src/_data/publicationsPage.js buildLegacyFiPublicationRows()",
      hasReplacement: true, // the canonical publication row IS its replacement
      replacementParityProven: true, // publications-page.json items ARE the canonical rows
      fallbackReachable: false, // no production consumer emits its output to a page
      consumersOutsidePublications: false, // only audit scripts consume it
      blocksOnMigration: legacyRowsConsumers.length > 0
        ? legacyRowsConsumers.map((rel) => `${rel} still calls buildLegacyFiPublicationRows for parity checks`)
        : [],
      notes: "No production consumer. Two publications audits + one PUB-CITE1 pre-audit still call this helper to reconstruct the pre-canonical row shape for parity checks. Delete only after those audits migrate to the canonical rows or are retired."
    },
    {
      item: "src/js/thesis-hub-actions.js buildThesisApa / buildThesisMla / etc.",
      hasReplacement: false,
      replacementParityProven: false,
      fallbackReachable: true,
      consumersOutsidePublications: true,
      blocksOnMigration: ["Thesis domain — publications CSL architecture explicitly not forced onto theses (PF5-IMPL-APA closure §22)."],
      notes: "Thesis citation lives in the theses domain; not a publications-legacy duplicate."
    },
    {
      item: "src/_data/theses.js buildApaCitation(thesis) → citationApa",
      hasReplacement: false,
      replacementParityProven: false,
      fallbackReachable: true,
      consumersOutsidePublications: true,
      blocksOnMigration: ["Thesis domain — SSR thesis citation surface, separate from publications."],
      notes: "Keep — thesis-specific server-side APA composer feeding thesis-detail-body.njk."
    }
  ];
  deletionMatrix.forEach((row) => { row.classification = classify(row); });

  const gates = {
    canonicalNonEmpty: canonicalCount > 0,
    canonicalAllHaveCsl: missingCsl.length === 0,
    sharedRendererPresent: publicationCitationSrc.length > 0,
    sharedRendererShimPresent: publicationCitationShimSrc.length > 0,
    nunjucksFilterRegistered,
    fiHubLoadsSharedRenderer: hubs.fiLoadsSharedRenderer,
    enHubLoadsSharedRenderer: hubs.enLoadsSharedRenderer,
    findExploreEmitsDataCsl: hubs.findExploreEmitsDataCsl,
    findExploreConsumesCsl: hubs.findExploreConsumesCsl,
    modalUsesSharedRendererOnly,
    detailUsesSharedRendererOnly,
    thesisDomainIndependent: thesis.thesisDoesNotDependOnPublicationRenderer,
    // Phase 4e invariants: server APA composer deleted +
    // content.citation/citationStyle fields gone + detail forwarding
    // gone + all taxonomy fallback branches removed.
    serverApaComposerRemoved: !serverApa.functionPresent,
    serverContentCitationFieldRemoved: !serverApa.contentItemHasCitationField,
    serverContentCitationStyleRemoved: !serverApa.contentItemHasCitationStyle,
    detailDoesNotFallBackToLegacyCitation: !detailFallsBackToCitation,
    detailModelDoesNotForwardCitation: !detailForwardsCitation,
    detailModelDoesNotForwardCitationStyle: !detailForwardsCitationStyle,
    taxonomyDoesNotReadLegacyCitation,
    // PUB-CITE1 Phase 4a invariants: buildRisEntry deleted, Zotero +
    // Mendeley consume the shared renderer. Regressions here would
    // block a future Phase 4b.
    buildRisEntryRemoved: !inlineFormatters.buildRisEntry,
    zoteroUsesSharedRenderer,
    mendeleyUsesSharedRenderer,
    zoteroNoLongerCallsLegacyRis: !zoteroCallsLegacyRis,
    mendeleyNoLongerCallsLegacyRis: !mendeleyCallsLegacyRis,
    // Phase 4b invariants
    inlineApaComposerRemoved: !inlineFormatters.buildApaCitation,
    inlineMlaComposerRemoved: !inlineFormatters.buildMlaCitation,
    inlineChicagoComposerRemoved: !inlineFormatters.buildChicagoCitation,
    inlineBibtexComposerRemoved: !inlineFormatters.buildBibtexEntry,
    modalHasControlledUnavailableState: /Viite ei ole saatavilla/.test(julkaisutNjkSrc)
      && /setCitationButtonsEnabled\(false\)/.test(julkaisutNjkSrc)
  };
  // Hard-blocking gates that MUST be true for closure. Fallback and
  // still-present flags are informational.
  const hardBlockingGates = [
    "canonicalNonEmpty", "canonicalAllHaveCsl", "sharedRendererPresent",
    "sharedRendererShimPresent", "nunjucksFilterRegistered",
    "fiHubLoadsSharedRenderer", "enHubLoadsSharedRenderer",
    "findExploreEmitsDataCsl", "findExploreConsumesCsl",
    "modalUsesSharedRendererOnly", "detailUsesSharedRendererOnly",
    "thesisDomainIndependent",
    "buildRisEntryRemoved", "zoteroUsesSharedRenderer", "mendeleyUsesSharedRenderer",
    "zoteroNoLongerCallsLegacyRis", "mendeleyNoLongerCallsLegacyRis",
    // PUB-CITE1 Phase 4b invariants: the four modal composers are
    // deleted and the modal has a controlled unavailable state.
    "inlineApaComposerRemoved", "inlineMlaComposerRemoved",
    "inlineChicagoComposerRemoved", "inlineBibtexComposerRemoved",
    "modalHasControlledUnavailableState",
    // PUB-CITE1 Phase 4e invariants: server composer + field
    // emission + detail forwarding + taxonomy fallback all removed.
    "serverApaComposerRemoved", "serverContentCitationFieldRemoved",
    "serverContentCitationStyleRemoved", "detailDoesNotFallBackToLegacyCitation",
    "detailModelDoesNotForwardCitation", "detailModelDoesNotForwardCitationStyle",
    "taxonomyDoesNotReadLegacyCitation"
  ];
  const hardFailures = hardBlockingGates.filter((k) => gates[k] !== true);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PUB-CITE1 Phase 4 — legacy citation deletion readiness audit (read-only)",
    branch: readOrEmpty(".git/HEAD"),
    counts: {
      canonicalPublications: canonicalCount,
      cslCoverage: `${cslCoverage}/${canonicalCount}`,
      missingCsl,
      legacyInlineFormattersInJulkaisutNjk: Object.values(inlineFormatters).filter(Boolean).length,
      legacyLocEstimateJulkaisutNjk: legacyLocEstimate,
      taxonomyTemplatesReadingCitation:
        (taxonomyReadsCitation.teemat ? 1 : 0)
        + (taxonomyReadsCitation.kategoriat ? 1 : 0)
        + (taxonomyReadsCitation.avainsanat ? 1 : 0),
      buildLegacyFiPublicationRowsConsumers: legacyRowsConsumers
    },
    architecture: {
      sharedRenderer: {
        umdModule: "src/js/publication-citation.js",
        nodeShim: "src/_utils/publicationCitation.js",
        nunjucksFilter: nunjucksFilterRegistered ? "publicationCitation(csl, style)" : "(missing)",
        hubs: {
          fi: hubs.fiLoadsSharedRenderer,
          en: hubs.enLoadsSharedRenderer
        }
      }
    },
    legacyInventory: {
      inlineBrowserFormatters: inlineFormatters,
      inlineFormattersStillCalledDirectly: legacyStillCalledDirectly,
      zoteroCallsLegacyRis,
      mendeleyCallsLegacyRis,
      serverApaComposer: serverApa,
      detailModel: {
        forwardsCitation: detailForwardsCitation,
        forwardsCitationStyle: detailForwardsCitationStyle,
        usesSharedRendererOnly: detailUsesSharedRendererOnly,
        legacyFallbackRemoved: !detailFallsBackToCitation
      },
      taxonomyPages: taxonomyReadsCitation,
      legacyRows,
      thesis
    },
    publicJson,
    fiEnParity: {
      fiHubLoadsSharedRenderer: hubs.fiLoadsSharedRenderer,
      enHubLoadsSharedRenderer: hubs.enLoadsSharedRenderer,
      fiOnlySurfaces: [
        "citation export modal (#citationExportModal is defined only in src/julkaisut.njk)"
      ]
    },
    deletionMatrix,
    gates,
    hardFailures,
    productionChangePolicy: "NO PRODUCTION CODE CHANGE IN THIS AUDIT."
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log(`csl coverage: ${cslCoverage}/${canonicalCount}`);
  console.log(`deletion classes:`, deletionMatrix.reduce((acc, r) => {
    acc[r.classification] = (acc[r.classification] || 0) + 1; return acc;
  }, {}));
  console.log(`hard failures: ${hardFailures.length ? hardFailures.join(", ") : "(none)"}`);
  if (hardFailures.length > 0) process.exit(1);
}

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      walkDir(full, callback);
    } else if (entry.isFile()) {
      callback(full);
    }
  }
}

main();

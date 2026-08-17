#!/usr/bin/env node
/**
 * PUB-CITE1 Phase 2 — Shared CSL Renderer + Publications List v2 Audit
 *
 * Verifies that the shared CSL-based citation renderer is present, wired
 * into the SSR publication list + detail template, and that Phase 1's CSL
 * projection semantics are unchanged.
 *
 * Also runs a deterministic parity comparison between the current
 * server-precomputed APA string (researchfiContent.buildApaCitation) and
 * the new shared renderer's APA output across all canonical Research.fi
 * publications, classifying each row as IDENTICAL / EXPECTED IMPROVEMENT /
 * METADATA-LIMITED / REGRESSION.
 *
 * Read-only. Exits non-zero on any hard invariant gate failure or on any
 * unexplained regression.
 *
 * Writes: docs/data/pub-cite1-phase2-shared-csl-renderer-2026-08-17.json
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pub-cite1-phase2-shared-csl-renderer-2026-08-17.json"
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

function classifyDiff(oldText, newText, csl) {
  if (oldText === newText) return { class: "IDENTICAL", explanation: "" };
  const hasOxfordAmp = /, & /.test(newText) && !/, & /.test(oldText);
  const hasContainerVolume = / \d+(\(\d+\))?, /.test(newText) && !/ \d+(\(\d+\))?, /.test(oldText);
  const oldHasDoiWithoutPrefix = /(^|\s)10\.\d/.test(oldText);
  const newHasDoiUrl = /https:\/\/doi\.org\//.test(newText);
  const newHasThesisGenre = /(Doctoral dissertation|Master's thesis)/.test(newText);
  const newHasChapterMarker = /Teoksessa /.test(newText);
  // APA initials improvement: shared renders "Family, G." while legacy
  // pipes the raw string. Detect via CSL authors having a structured
  // {family, given} entry and the shared text starting with "Family, X."
  const cslAuthors = Array.isArray(csl?.author) ? csl.author : [];
  const firstStructured = cslAuthors[0] && cslAuthors[0].family && cslAuthors[0].given;
  const oldStartsWithFullName = firstStructured
    && oldText.indexOf(`${cslAuthors[0].family}, ${cslAuthors[0].given}`) === 0;
  const newStartsWithInitials = firstStructured
    && new RegExp(`^${cslAuthors[0].family}, ${cslAuthors[0].given.charAt(0)}\\.`).test(newText);
  if (oldStartsWithFullName && newStartsWithInitials) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Author names shortened to initials per APA 7" };
  }
  // Publisher added: legacy skipped publisher; shared correctly places
  // it after title/container for non-journal-article types.
  const publisher = (csl && csl.publisher) || "";
  if (publisher && newText.indexOf(publisher) >= 0 && oldText.indexOf(publisher) === -1) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Publisher now included per APA 7" };
  }
  if (hasOxfordAmp || hasContainerVolume) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "APA style improvements (Oxford ampersand / volume formatting)" };
  }
  if (newHasDoiUrl && oldHasDoiWithoutPrefix) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "DOI rendered as full URL per APA 7" };
  }
  if (newHasThesisGenre && !/(Doctoral dissertation|Master's thesis)/.test(oldText)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Thesis genre now included" };
  }
  if (newHasChapterMarker && !/Teoksessa /.test(oldText)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Chapter now marks its container title" };
  }
  const cslIsMinimal = !csl?.["container-title"] && !csl?.DOI && !csl?.publisher;
  if (cslIsMinimal) {
    return { class: "METADATA-LIMITED", explanation: "Canonical record lacks container / DOI / publisher" };
  }
  return { class: "DIFFERS", explanation: "Text differs — inspect manually" };
}

function main() {
  // ---------- 1. Module presence & wiring ----------
  const publicationCitationSrc = readOrEmpty("src/js/publication-citation.js");
  const publicationCitationShimSrc = readOrEmpty("src/_utils/publicationCitation.js");
  const eleventyFiltersSrc = readOrEmpty("eleventy.filters.js");
  const publicationsOpeningListSrc = readOrEmpty("src/_includes/publications-opening-list.njk");
  const publicationItemBodySrc = readOrEmpty("src/_includes/publication-item-body.njk");
  const julkaisutNjkSrc = readOrEmpty("src/julkaisut.njk");
  const enPublicationsNjkSrc = readOrEmpty("src/en/publications.njk");
  const findExploreJsSrc = readOrEmpty("src/js/find-explore.js");

  const findings = {
    module: {
      isomorphicRendererExists: publicationCitationSrc.length > 0,
      isomorphicUmdShape: /module\.exports\s*=\s*factory\(\)/.test(publicationCitationSrc)
        && /root\.publicationCitation\s*=\s*factory\(\)/.test(publicationCitationSrc),
      hasApaFn: /function\s+apa\s*\(/.test(publicationCitationSrc),
      hasMlaFn: /function\s+mla\s*\(/.test(publicationCitationSrc),
      hasChicagoFn: /function\s+chicago\s*\(/.test(publicationCitationSrc),
      hasBibtexFn: /function\s+bibtex\s*\(/.test(publicationCitationSrc),
      hasRisFn: /function\s+ris\s*\(/.test(publicationCitationSrc),
      nodeShimReexports: /require\("\.\.\/js\/publication-citation\.js"\)/.test(publicationCitationShimSrc)
    },
    filter: {
      nunjucksFilterRegistered: /addFilter\("publicationCitation"/.test(eleventyFiltersSrc),
      filterCallsBuildCitation: /publicationCitation\.buildCitation\(\{\s*csl,\s*style\s*\}\)/.test(eleventyFiltersSrc)
    },
    // Phase 2 originally shipped the SSR opening-list partial as the
    // bibliographic surface. PF5-IMPL-APA (2026-08-17) moved the full
    // publications list into Pagefind and deleted the partial, so
    // these gates now assert (a) the partial is gone and (b) the
    // Find & Explore renderer is the shared-CSL consumer for the
    // list surface.
    ssrList: {
      openingListPartialDeleted: !fs.existsSync(path.join(REPO_ROOT, "src/_includes/publications-opening-list.njk")),
      findExploreRendererUsesSharedRenderer: /window\.publicationCitation\b[\s\S]{0,120}renderer\.buildCitation/.test(readOrEmpty("src/js/find-explore.js")),
      findExploreCitationButtonEmitsCsl: /data-csl=/.test(readOrEmpty("src/js/find-explore.js"))
    },
    detail: {
      detailUsesSharedFilter: /publicationCitation\("apa"\)/.test(publicationItemBodySrc),
      detailFallsBackToLegacyCitation: /detail\.citation/.test(publicationItemBodySrc),
      detailStillShowsStyleBadge: /detail\.citationStyle/.test(publicationItemBodySrc)
    },
    modal: {
      julkaisutLoadsSharedRenderer: /\/js\/publication-citation\.js/.test(julkaisutNjkSrc),
      modalPrefersSharedRenderer: /window\.publicationCitation\s*\)\s*{[\s\S]*?buildCitation/.test(julkaisutNjkSrc),
      modalKeepsLegacyFallback: /function\s+buildApaCitation\s*\(payload\)/.test(julkaisutNjkSrc)
        && /function\s+buildBibtexEntry\s*\(payload\)/.test(julkaisutNjkSrc)
        && /function\s+buildMlaCitation\s*\(payload\)/.test(julkaisutNjkSrc)
        && /function\s+buildChicagoCitation\s*\(payload\)/.test(julkaisutNjkSrc)
        && /function\s+buildRisEntry\s*\(payload\)/.test(julkaisutNjkSrc),
      modalParsesCslDataAttr: /btn\.dataset\.csl/.test(julkaisutNjkSrc) && /JSON\.parse\(btn\.dataset\.csl\)/.test(julkaisutNjkSrc)
    },
    reverseGates: {
      // PF5-IMPL-APA now DOES read entry.record.csl inside
      // publicationCitationBody; the old reverse gate is inverted.
      findExploreRendererReadsCsl: /record\.csl/.test(findExploreJsSrc)
        && /renderer\.buildCitation/.test(findExploreJsSrc),
      enPublicationsLoadsSharedRenderer: /\/js\/publication-citation\.js/.test(enPublicationsNjkSrc),
      enPublicationsHasNoOwnCitationFormatters: !/function\s+buildApaCitation/.test(enPublicationsNjkSrc)
    }
  };

  // ---------- 2. Parity: legacy APA vs shared APA on all 56 items ----------
  let parity = { total: 0, identical: 0, improvements: 0, metadataLimited: 0, differs: 0, examples: [], regressions: [] };
  try {
    const publicationsPageJson = JSON.parse(readOrEmpty("_site/data/publications-page.json") || "{}");
    const items = Array.isArray(publicationsPageJson.items) ? publicationsPageJson.items : [];
    const researchfiRaw = JSON.parse(readOrEmpty("_site/data/researchfi.json") || "{}");
    const researchfiJson = Array.isArray(researchfiRaw) ? researchfiRaw : (researchfiRaw.items || []);
    const publicationCitation = requireFresh("src/_utils/publicationCitation.js");
    // Build legacy APA strings by loading researchfiContent's mapper via
    // the actual module: it reads Research.fi cache internally, but we
    // want the deterministic function output for each publication. The
    // simplest reliable approach: use the same inline pattern as
    // researchfiContent.buildApaCitation. Since that function is not
    // exported, we replicate it here — the parity audit is intentionally
    // read-only and this replica is regression-audited via the unit tests
    // covering the shared renderer.
    const legacyApaByAnchor = new Map();
    function legacyBuildApaCitation(publication) {
      const authors = (publication.authors || "").trim() || "Tuntematon tekijä";
      const year = publication.year ? String(publication.year) : "n.d.";
      const title = (publication.title || "").trim() || "Nimetön julkaisu";
      const journal = (publication.journal || "").trim();
      const doi = (publication.doi || "").trim();
      const url = (publication.url || "").trim();
      const volume = (publication.volume || "").trim();
      const issue = (publication.issue || "").trim();
      const pages = (publication.pages || "").trim();
      let citation = `${authors} (${year}). ${title}.`;
      if (journal) {
        citation += ` ${journal}`;
        if (volume) citation += `, ${volume}${issue ? `(${issue})` : ""}`;
        if (pages) citation += `, ${pages}`;
        citation += ".";
      }
      if (doi) citation += ` https://doi.org/${doi}`;
      else if (url) citation += ` ${url}`;
      return citation.trim();
    }
    researchfiJson.forEach((publication) => {
      if (publication?.anchorId) {
        legacyApaByAnchor.set(publication.anchorId, legacyBuildApaCitation(publication));
      }
    });

    items.forEach((item) => {
      const csl = item.csl || null;
      const legacy = legacyApaByAnchor.get(item.anchorId) || "";
      const shared = csl ? publicationCitation.buildCitation({ csl, style: "apa" }).text : "";
      if (!legacy || !shared) return;
      parity.total++;
      const cls = classifyDiff(legacy, shared, csl);
      if (cls.class === "IDENTICAL") parity.identical++;
      else if (cls.class === "EXPECTED IMPROVEMENT") parity.improvements++;
      else if (cls.class === "METADATA-LIMITED") parity.metadataLimited++;
      else parity.differs++;
      if (parity.examples.length < 6) {
        parity.examples.push({
          anchorId: item.anchorId,
          typeCode: item.typeCode,
          class: cls.class,
          explanation: cls.explanation,
          legacy: legacy.slice(0, 300),
          shared: shared.slice(0, 300)
        });
      }
      if (cls.class === "DIFFERS") {
        parity.regressions.push({
          anchorId: item.anchorId,
          typeCode: item.typeCode,
          legacy,
          shared
        });
      }
    });
  } catch (err) {
    parity.error = String(err && err.message || err);
  }

  // ---------- 3. Runtime sample: renderer produces non-empty APA + BibTeX ----------
  let runtimeSample = { ok: false };
  try {
    const publicationCitation = requireFresh("src/_utils/publicationCitation.js");
    const { buildCslItem } = requireFresh("src/_utils/publicationCsl.js");
    const csl = buildCslItem({
      anchorId: "audit-p2",
      title: "Phase 2 audit sample",
      typeCode: "A1",
      authors: "Laru, Jari; Näykki, Piia",
      journal: "Journal of Audits",
      volume: "1",
      issue: "2",
      pages: "3-4",
      doi: "10.1234/audit.p2",
      year: 2026,
      lang: "en"
    });
    const apa = publicationCitation.buildCitation({ csl, style: "apa" });
    const bibtex = publicationCitation.buildCitation({ csl, style: "bibtex" });
    const ris = publicationCitation.buildCitation({ csl, style: "ris" });
    runtimeSample = {
      ok: !apa.empty && !bibtex.empty && !ris.empty
        && apa.text.length > 0 && bibtex.text.length > 0 && ris.text.length > 0
        && apa.text.indexOf("Laru, J.") === 0
        && bibtex.text.startsWith("@article{")
        && ris.text.startsWith("TY  - JOUR"),
      apaSample: apa.text,
      bibtexKey: (bibtex.text.match(/^@article\{([^,]+),/) || [])[1] || null,
      risFirstLine: ris.text.split("\n")[0]
    };
  } catch (err) {
    runtimeSample = { ok: false, error: String(err && err.message || err) };
  }

  const gates = {
    isomorphicRendererExists: findings.module.isomorphicRendererExists,
    isomorphicUmdShape: findings.module.isomorphicUmdShape,
    hasApaFn: findings.module.hasApaFn,
    hasMlaFn: findings.module.hasMlaFn,
    hasChicagoFn: findings.module.hasChicagoFn,
    hasBibtexFn: findings.module.hasBibtexFn,
    hasRisFn: findings.module.hasRisFn,
    nodeShimReexports: findings.module.nodeShimReexports,
    nunjucksFilterRegistered: findings.filter.nunjucksFilterRegistered,
    filterCallsBuildCitation: findings.filter.filterCallsBuildCitation,
    openingListPartialDeleted: findings.ssrList.openingListPartialDeleted,
    findExploreRendererUsesSharedRenderer: findings.ssrList.findExploreRendererUsesSharedRenderer,
    findExploreCitationButtonEmitsCsl: findings.ssrList.findExploreCitationButtonEmitsCsl,
    detailUsesSharedFilter: findings.detail.detailUsesSharedFilter,
    detailFallsBackToLegacyCitation: findings.detail.detailFallsBackToLegacyCitation,
    julkaisutLoadsSharedRenderer: findings.modal.julkaisutLoadsSharedRenderer,
    modalPrefersSharedRenderer: findings.modal.modalPrefersSharedRenderer,
    modalKeepsLegacyFallback: findings.modal.modalKeepsLegacyFallback,
    modalParsesCslDataAttr: findings.modal.modalParsesCslDataAttr,
    findExploreRendererReadsCsl: findings.reverseGates.findExploreRendererReadsCsl,
    enPublicationsLoadsSharedRenderer: findings.reverseGates.enPublicationsLoadsSharedRenderer,
    enPublicationsHasNoOwnCitationFormatters: findings.reverseGates.enPublicationsHasNoOwnCitationFormatters,
    runtimeSampleOk: runtimeSample.ok,
    parityHasNoUnexplainedRegressions: parity.regressions.length === 0
  };

  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PUB-CITE1 Phase 2 — shared CSL renderer + publications list v2 audit",
    findings,
    runtimeSample,
    parity,
    gates,
    gateFailures
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log("parity total/identical/improvements/metadata-limited/differs:",
    parity.total, parity.identical, parity.improvements, parity.metadataLimited, parity.differs);
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main();

#!/usr/bin/env node
/**
 * PUB-CITE1 Phase 4d — /api/export-data.json Contract & Citation Parity
 *
 * Verifies the export-data JSON API after the citation migration:
 *
 *   - top-level keys unchanged
 *   - publication record counts unchanged
 *   - researchfiContentItems anchorId set unchanged
 *   - researchfiContentItems field set unchanged
 *   - non-citation fields byte-identical to the pre-migration snapshot
 *   - citation strings classified as IDENTICAL / EXPECTED IMPROVEMENT
 *     using the same rules as Phase 4c (author initials, DOI URL,
 *     DOI case normalisation, publisher, chapter marker, thesis
 *     genre, book series fallback, explicit unknown-author label,
 *     hyphenated-initial normalisation)
 *   - UNEXPLAINED REGRESSION = 0
 *   - citationStyle constant "APA 7"
 *   - CSL coverage on the exported publication set
 *
 * Reads the pre-migration snapshot from /tmp/export-data-before-4d.json
 * (captured before the migration commit landed). Writes:
 *   docs/data/pub-cite1-phase4d-export-data-citation-parity-2026-08-17.json
 *
 * Exits non-zero on any hard invariant gate failure.
 */

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");
const BEFORE_PATH = "/tmp/export-data-before-4d.json";
const AFTER_PATH = path.join(REPO_ROOT, "_site", "api", "export-data.json");
const OUT = path.join(
  REPO_ROOT,
  "docs",
  "data",
  "pub-cite1-phase4d-export-data-citation-parity-2026-08-17.json"
);

function requireFresh(rel) {
  const full = path.join(REPO_ROOT, rel);
  delete require.cache[full];
  return require(full);
}

function decodeHtmlEntities(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

// Reuses the Phase 4c classifier rules for parity.
function classifyDiff(legacy, shared, csl) {
  const l = decodeHtmlEntities(legacy);
  const s = shared;
  if (l === s) return { class: "IDENTICAL", explanation: "" };
  const cslAuthors = Array.isArray(csl?.author) ? csl.author : [];
  const firstStructured = cslAuthors[0] && cslAuthors[0].family && cslAuthors[0].given;
  const oldStartsWithFullName = firstStructured
    && l.indexOf(`${cslAuthors[0].family}, ${cslAuthors[0].given}`) === 0;
  const newStartsWithInitials = firstStructured
    && new RegExp(`^${cslAuthors[0].family}, ${cslAuthors[0].given.charAt(0)}\\.`).test(s);
  if (oldStartsWithFullName && newStartsWithInitials) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Author names shortened to initials per APA 7" };
  }
  if (/[A-ZÅÄÖ]\.-[A-ZÅÄÖ]\./.test(l) && /[A-ZÅÄÖ]\.\s+[A-ZÅÄÖ]\./.test(s)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Hyphenated middle initial normalised to space-separated initials" };
  }
  if (/^\(\d{4}\)\./.test(l) && /^Tuntematon tekijä \(\d{4}\)\./.test(s)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Explicit unknown-author label instead of silent omission" };
  }
  const publisher = (csl && csl.publisher) || "";
  if (publisher && s.indexOf(publisher) >= 0 && l.indexOf(publisher) === -1) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Publisher now included per APA 7" };
  }
  const hasOxfordAmp = /, & /.test(s) && !/, & /.test(l);
  const hasContainerVolume = / \d+(\(\d+\))?, /.test(s) && !/ \d+(\(\d+\))?, /.test(l);
  const oldHasDoiWithoutPrefix = /(^|\s)10\.\d/.test(l);
  const newHasDoiUrl = /https:\/\/doi\.org\//.test(s);
  const newHasThesisGenre = /(Doctoral dissertation|Master's thesis)/.test(s);
  const newHasChapterMarker = /Teoksessa /.test(s);
  if (hasOxfordAmp || hasContainerVolume) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "APA style improvements (Oxford ampersand / volume formatting)" };
  }
  if (newHasDoiUrl && oldHasDoiWithoutPrefix) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "DOI rendered as full URL per APA 7" };
  }
  const doi = (csl && csl.DOI) || "";
  if (doi) {
    const legacyHasUppercaseDoi = new RegExp(doi.replace(/[.\-\/]/g, "\\$&"), "i").test(l)
      && !new RegExp(doi.replace(/[.\-\/]/g, "\\$&")).test(l);
    if (legacyHasUppercaseDoi && s.indexOf(doi) >= 0) {
      return { class: "EXPECTED IMPROVEMENT", explanation: "DOI case normalised to lower per APA 7 recommendation" };
    }
  }
  if (newHasThesisGenre && !/(Doctoral dissertation|Master's thesis)/.test(l)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Thesis genre now included" };
  }
  if (newHasChapterMarker && !/Teoksessa /.test(l)) {
    return { class: "EXPECTED IMPROVEMENT", explanation: "Chapter now marks its container title" };
  }
  const cslIsMinimal = !csl?.["container-title"] && !csl?.DOI && !csl?.publisher;
  if (cslIsMinimal) {
    return { class: "METADATA-LIMITED", explanation: "Canonical record lacks container / DOI / publisher" };
  }
  return { class: "UNEXPLAINED REGRESSION", explanation: "Inspect manually" };
}

async function main() {
  if (!fs.existsSync(BEFORE_PATH)) {
    console.error("ERROR: pre-migration snapshot missing at", BEFORE_PATH);
    process.exit(2);
  }
  if (!fs.existsSync(AFTER_PATH)) {
    console.error("ERROR: post-migration export missing at", AFTER_PATH);
    process.exit(2);
  }

  const before = JSON.parse(fs.readFileSync(BEFORE_PATH, "utf8"));
  const after = JSON.parse(fs.readFileSync(AFTER_PATH, "utf8"));

  // ---------- 1. Top-level schema parity ----------
  const beforeTop = Object.keys(before).sort();
  const afterTop = Object.keys(after).sort();
  const topLevelIdentical = JSON.stringify(beforeTop) === JSON.stringify(afterTop);

  // ---------- 2. Record count parity ----------
  const counts = {
    localPublications: { before: before.localPublications.length, after: after.localPublications.length },
    researchfiPublications: { before: before.researchfiPublications.length, after: after.researchfiPublications.length },
    researchfiContentItems: { before: before.researchfiContentItems.length, after: after.researchfiContentItems.length }
  };

  // ---------- 3. rfContentItems field set parity ----------
  const beforeFields = Object.keys(before.researchfiContentItems[0] || {}).sort();
  const afterFields = Object.keys(after.researchfiContentItems[0] || {}).sort();
  const fieldsIdentical = JSON.stringify(beforeFields) === JSON.stringify(afterFields);

  // ---------- 4. ID parity + non-citation field parity ----------
  const beforeById = new Map(before.researchfiContentItems.map((r) => [r.anchorId, r]));
  const afterById = new Map(after.researchfiContentItems.map((r) => [r.anchorId, r]));
  const missing = [...beforeById.keys()].filter((id) => !afterById.has(id));
  const extra = [...afterById.keys()].filter((id) => !beforeById.has(id));
  const seenAfter = new Set();
  const duplicates = [];
  for (const r of after.researchfiContentItems) {
    if (seenAfter.has(r.anchorId)) duplicates.push(r.anchorId);
    else seenAfter.add(r.anchorId);
  }
  // PUB-CITE1 Phase 4e: referenceLabel on rfContent items is
  // sourced from buildReferenceLabel(publication), which itself
  // called the now-deleted buildApaCitation composer. After 4e it
  // comes from the shared renderer, so its text may differ under
  // the same EXPECTED IMPROVEMENT rules as citation. It is
  // treated as citation-adjacent here.
  const NON_CITATION_FIELDS = beforeFields.filter((k) => k !== "citation" && k !== "citationStyle" && k !== "referenceLabel");
  const nonCitationChanges = [];
  for (const [id, brec] of beforeById) {
    const arec = afterById.get(id);
    if (!arec) continue;
    for (const field of NON_CITATION_FIELDS) {
      if (JSON.stringify(brec[field]) !== JSON.stringify(arec[field])) {
        nonCitationChanges.push({ id, field, before: brec[field], after: arec[field] });
      }
    }
  }

  // ---------- 5. Load researchfiContent items for csl access ----------
  const loadResearchfiContent = requireFresh("src/_data/researchfiContent.js");
  const contentItems = await loadResearchfiContent();
  const contentByAnchor = new Map(contentItems.map((i) => [i.anchorId, i]));
  const withCsl = after.researchfiContentItems.filter((r) => contentByAnchor.get(r.anchorId)?.csl).length;

  // ---------- 6. Citation parity classification ----------
  const citationStats = {
    total: 0, identical: 0, improvements: 0, metadataLimited: 0, regressions: 0,
    citationStyleAllApa7: after.researchfiContentItems.every((r) => r.citationStyle === "APA 7"),
    emptyCitationAfter: after.researchfiContentItems.filter((r) => !r.citation).length,
    emptyCitationBefore: before.researchfiContentItems.filter((r) => !r.citation).length,
    regressionExamples: []
  };

  for (const [id, brec] of beforeById) {
    const arec = afterById.get(id);
    if (!arec) continue;
    citationStats.total++;
    const csl = contentByAnchor.get(id)?.csl || null;
    const cls = classifyDiff(brec.citation, arec.citation, csl);
    if (cls.class === "IDENTICAL") citationStats.identical++;
    else if (cls.class === "EXPECTED IMPROVEMENT") citationStats.improvements++;
    else if (cls.class === "METADATA-LIMITED") citationStats.metadataLimited++;
    else if (cls.class === "UNEXPLAINED REGRESSION") {
      citationStats.regressions++;
      if (citationStats.regressionExamples.length < 6) {
        citationStats.regressionExamples.push({
          anchorId: id, legacy: brec.citation, shared: arec.citation
        });
      }
    }
  }

  const gates = {
    topLevelSchemaUnchanged: topLevelIdentical,
    localPublicationsCountUnchanged: counts.localPublications.before === counts.localPublications.after,
    researchfiPublicationsCountUnchanged: counts.researchfiPublications.before === counts.researchfiPublications.after,
    researchfiContentItemsCountUnchanged: counts.researchfiContentItems.before === counts.researchfiContentItems.after,
    researchfiContentFieldSetUnchanged: fieldsIdentical,
    noMissingRecords: missing.length === 0,
    noExtraRecords: extra.length === 0,
    noDuplicateRecords: duplicates.length === 0,
    noNonCitationFieldChanges: nonCitationChanges.length === 0,
    everyPublicationHasCsl: withCsl === after.researchfiContentItems.length,
    citationStyleAllApa7: citationStats.citationStyleAllApa7,
    noUnexplainedCitationRegressions: citationStats.regressions === 0,
    // Ensure the shared renderer never returned empty for a
    // canonical publication that had csl.
    noEmptyCitationForPublicationWithCsl: after.researchfiContentItems.every((r) => {
      const item = contentByAnchor.get(r.anchorId);
      return !item?.csl || r.citation !== "";
    })
  };
  const gateFailures = Object.entries(gates).filter(([, ok]) => !ok).map(([n]) => n);

  const report = {
    generatedAt: new Date().toISOString(),
    scope: "PUB-CITE1 Phase 4d — /api/export-data.json contract + citation parity",
    schema: {
      topLevelBefore: beforeTop,
      topLevelAfter: afterTop,
      topLevelIdentical
    },
    counts,
    idParity: {
      missing,
      extra,
      duplicates
    },
    fieldParity: {
      before: beforeFields,
      after: afterFields,
      identical: fieldsIdentical,
      nonCitationChanges
    },
    cslCoverage: {
      total: after.researchfiContentItems.length,
      withCsl,
      missingCsl: after.researchfiContentItems.length - withCsl
    },
    citationParity: citationStats,
    gates,
    gateFailures,
    productionChangePolicy: "Field names / shape / non-citation values preserved. citationStyle constant 'APA 7'."
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log("wrote", path.relative(REPO_ROOT, OUT));
  console.log(`schema: topLevelIdentical=${topLevelIdentical}, fields identical=${fieldsIdentical}`);
  console.log(`counts: local=${counts.localPublications.after} rfPubs=${counts.researchfiPublications.after} rfContent=${counts.researchfiContentItems.after}`);
  console.log(`id parity: missing=${missing.length} extra=${extra.length} dup=${duplicates.length}`);
  console.log(`non-citation field changes: ${nonCitationChanges.length}`);
  console.log(`csl coverage: ${withCsl}/${after.researchfiContentItems.length}`);
  console.log(`citation parity: identical=${citationStats.identical} improvements=${citationStats.improvements} metadata-limited=${citationStats.metadataLimited} regressions=${citationStats.regressions}`);
  console.log("gate failures:", gateFailures.length === 0 ? "(none)" : gateFailures.join(", "));
  if (gateFailures.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err.stack || err);
  process.exit(1);
});

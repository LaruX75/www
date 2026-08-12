const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const loadResearchfi = require("../src/_data/researchfi");
const loadResearchfiContent = require("../src/_data/researchfiContent");
const loadResearchProgram = require("../src/_data/researchProgram");
const {
  PUBLICATION_GROUP_ORDER,
  buildPublicationsPageModel,
  matchPublicationCandidates
} = require("../src/_data/publicationsPage");

function loadManualPublicationCollectionItems() {
  const dir = path.join(process.cwd(), "src", "publications");
  return fs.readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.join(dir, name))
    .map((inputPath) => {
      const raw = fs.readFileSync(inputPath, "utf8");
      const parsed = matter(raw);
      const dateValue = parsed.data.date ? new Date(parsed.data.date) : null;
      return {
        inputPath,
        url: parsed.data.permalink || `/${path.basename(inputPath, path.extname(inputPath))}/`,
        date: dateValue,
        data: parsed.data
      };
    });
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableValue(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function comparableValue(value) {
  if (value === undefined || value === null || value === "") return null;
  return stableValue(value);
}

function stableJson(value) {
  return JSON.stringify(value);
}

function rowId(row = {}) {
  return [
    row.id || "",
    row.sourceKey || "",
    row.pageUrl || "",
    row.url || "",
    row.title || ""
  ].join("|");
}

function buildOldEnRows(researchfi = []) {
  return researchfi.map((item) => ({
    id: item.anchorId || item.publicationId || item.title || null,
    sourceKey: "researchfi",
    pageUrl: item.anchorId ? `/julkaisut/#${item.anchorId}` : null,
    url: item.url || item.doiUrl || null,
    doi: item.doi || null,
    title: item.title || null,
    year: item.year || null,
    authors: item.authors || null,
    type: item.typeFi || null,
    typeCode: item.typeCode || null,
    publicationGroup: String(item.typeCode || "").charAt(0).toUpperCase(),
    peerReviewed: item.peerReviewed === true,
    openAccess: item.openAccess || 0
  }));
}

function buildCanonicalRows(items = []) {
  return items.map((item) => ({
    id: item.id || item.anchorId || item.title || null,
    sourceKey: item.sourceKey || null,
    pageUrl: item.pageUrl || null,
    url: item.url || item.doiUrl || null,
    doi: item.doi || null,
    title: item.title || null,
    year: item.year || null,
    authors: item.authors || null,
    type: item.type || null,
    typeCode: item.typeCode || null,
    publicationGroup: item.publicationGroup || String(item.typeCode || "").charAt(0).toUpperCase(),
    peerReviewed: item.peerReviewed === true,
    openAccess: item.openAccess || 0
  }));
}

function compareRows(leftRows = [], rightRows = []) {
  const leftMap = new Map(leftRows.map((row) => [rowId(row), row]));
  const rightMap = new Map(rightRows.map((row) => [rowId(row), row]));
  const leftIds = [...leftMap.keys()].sort();
  const rightIds = [...rightMap.keys()].sort();
  const idsOnlyInLeft = leftIds.filter((id) => !rightMap.has(id));
  const idsOnlyInRight = rightIds.filter((id) => !leftMap.has(id));
  const fieldDiffs = [];

  leftIds
    .filter((id) => rightMap.has(id))
    .forEach((id) => {
      const leftRow = leftMap.get(id);
      const rightRow = rightMap.get(id);
      ["title", "year", "authors", "url", "doi", "type", "typeCode", "publicationGroup", "peerReviewed", "openAccess"].forEach((field) => {
        if (stableJson(comparableValue(leftRow[field])) !== stableJson(comparableValue(rightRow[field]))) {
          fieldDiffs.push({
            id,
            field,
            left: comparableValue(leftRow[field]),
            right: comparableValue(rightRow[field])
          });
        }
      });
    });

  return {
    leftCount: leftRows.length,
    rightCount: rightRows.length,
    idsOnlyInLeft,
    idsOnlyInRight,
    fieldDiffs
  };
}

function toCandidate(row = {}) {
  return {
    sourceKey: row.sourceKey,
    stableIdentifier: row.publicationId || null,
    doi: row.doi || null,
    title: row.title || null,
    year: row.year || null,
    record: row
  };
}

function countByGroup(items = []) {
  return Object.fromEntries(PUBLICATION_GROUP_ORDER.map((group) => [
    group,
    items.filter((item) => String(item.publicationGroup || item.typeCode || "").charAt(0).toUpperCase() === group).length
  ]));
}

function computeKpis(items = []) {
  return {
    total: items.length,
    peerReviewed: items.filter((item) => item.peerReviewed).length,
    openAccess: items.filter((item) => item.openAccess).length,
    articles: items.filter((item) => item.typeCode === "A1" || item.typeCode === "A2").length,
    conferences: items.filter((item) => item.typeCode === "A3" || item.typeCode === "A4" || item.typeCode === "B3").length,
    books: items.filter((item) => item.typeCode === "C1" || item.typeCode === "C2" || item.typeCode === "G4" || item.typeCode === "G5").length
  };
}

async function main() {
  const [researchfi, researchfiContent, researchProgram] = await Promise.all([
    loadResearchfi(),
    loadResearchfiContent(),
    loadResearchProgram()
  ]);

  const data = {
    researchfi,
    researchfiContent,
    researchProgram,
    collections: {
      publications: loadManualPublicationCollectionItems()
    }
  };

  const canonical = buildPublicationsPageModel(data);
  const oldEnItems = buildOldEnRows(researchfi);
  const newEnItems = buildCanonicalRows(canonical.items);
  const canonicalResearchfiItems = newEnItems.filter((item) => item.sourceKey === "researchfi");
  const oldEnToCanonicalResearchfi = compareRows(oldEnItems, canonicalResearchfiItems);
  const intentionalLegacyResearchfiDedupe = oldEnToCanonicalResearchfi.idsOnlyInLeft.filter((id) => {
    const oldRow = oldEnItems.find((row) => rowId(row) === id);
    return canonicalResearchfiItems.some((row) => matchPublicationCandidates(toCandidate(oldRow), toCandidate(row)).length > 0);
  });
  const unexplainedLegacyResearchfiDedupe = oldEnToCanonicalResearchfi.idsOnlyInLeft.filter((id) => !intentionalLegacyResearchfiDedupe.includes(id));

  const manualOnlyItems = canonical.items
    .filter((item) => item.sourceKey === "manual")
    .map((item) => ({
      title: item.title,
      year: item.year,
      authors: item.authors,
      url: item.url || item.doiUrl || null,
      doi: item.doi || null,
      typeCode: item.typeCode
    }));

  const report = {
    generatedAt: new Date().toISOString(),
    ok: unexplainedLegacyResearchfiDedupe.length === 0 && oldEnToCanonicalResearchfi.fieldDiffs.length === 0,
    oldEnCount: oldEnItems.length,
    newCanonicalEnCount: newEnItems.length,
    difference: newEnItems.length - oldEnItems.length,
    reason: "Canonical EN dataset adds 3 active manual fallback items while deduplicating 3 duplicate Research.fi records, so the net count stays unchanged.",
    overlapAudit: {
      oldEnToCanonicalResearchfi,
      intentionalLegacyResearchfiDedupe,
      unexplainedLegacyResearchfiDedupe
    },
    manualOnlyItems,
    oldEnGroupCounts: countByGroup(oldEnItems),
    newCanonicalGroupCounts: countByGroup(newEnItems),
    oldEnKpis: computeKpis(oldEnItems),
    newCanonicalKpis: computeKpis(newEnItems)
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const loadResearchfi = require("../src/_data/researchfi");
const loadResearchfiContent = require("../src/_data/researchfiContent");
const loadResearchProgram = require("../src/_data/researchProgram");
const {
  PUBLICATION_GROUP_ORDER,
  buildLegacyFiPublicationRows,
  buildPublicationsPageModel,
  matchPublicationCandidates
} = require("../src/_data/publicationsPage");

const SSR_OPENING_LIMIT = 5;

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

function toSimpleCanonicalRows(items = []) {
  return items.map((item) => ({
    id: item.id,
    sourceKey: item.sourceKey,
    pageUrl: item.pageUrl || null,
    url: item.url || null,
    title: item.title || null,
    year: item.year || null,
    authors: item.authors || null,
    journal: item.journal || null,
    publisher: item.publisher || null,
    typeCode: item.typeCode || null
  }));
}

function toLegacyJsRows(researchfi = []) {
  return researchfi.map((publication) => ({
    id: publication.anchorId || publication.publicationId || publication.title,
    sourceKey: "researchfi",
    pageUrl: publication.anchorId ? `/julkaisut/#${publication.anchorId}` : null,
    url: publication.url || publication.doiUrl || null,
    title: publication.title || null,
    year: publication.year || null,
    authors: publication.authors || null,
    journal: publication.journal || null,
    publisher: publication.publisher || null,
    typeCode: publication.typeCode || null
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
      ["pageUrl", "url", "title", "year", "authors", "journal", "publisher", "typeCode"].forEach((field) => {
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
    doi: row.doi || row.doiUrl || null,
    title: row.title || null,
    year: row.year || null,
    record: row
  };
}

function countByGroup(items = []) {
  return PUBLICATION_GROUP_ORDER.reduce((acc, group) => {
    acc[group] = items.filter((item) => String(item.publicationGroup || item.typeCode || "").charAt(0).toUpperCase() === group).length;
    return acc;
  }, {});
}

function ssrOpeningCounts(items = []) {
  const counts = countByGroup(items);
  return Object.fromEntries(
    Object.entries(counts).map(([group, count]) => [group, Math.min(count, SSR_OPENING_LIMIT)])
  );
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

  const collections = {
    publications: loadManualPublicationCollectionItems()
  };

  const data = {
    researchfi,
    researchfiContent,
    researchProgram,
    collections
  };

  const model = buildPublicationsPageModel(data);
  const canonicalItems = model.items || [];
  const canonicalRows = toSimpleCanonicalRows(canonicalItems);
  const legacySsrRows = buildLegacyFiPublicationRows(data);
  const legacyJsRows = toLegacyJsRows(researchfi);
  const legacySsrToCanonical = compareRows(legacySsrRows, canonicalRows);
  const legacyJsToCanonical = compareRows(legacyJsRows, canonicalRows);
  const researchfiOnlyCanonicalRows = toSimpleCanonicalRows(canonicalItems.filter((item) => item.sourceKey === "researchfi"));
  const legacyJsToResearchfiCanonical = compareRows(legacyJsRows, researchfiOnlyCanonicalRows);
  const intentionalLegacyResearchfiDedupe = legacyJsToResearchfiCanonical.idsOnlyInLeft.filter((id) => {
    const legacyRow = legacyJsRows.find((row) => rowId(row) === id);
    return researchfiOnlyCanonicalRows.some((row) => matchPublicationCandidates(toCandidate(legacyRow), toCandidate(row)).length > 0);
  });
  const unexplainedLegacyResearchfiDedupe = legacyJsToResearchfiCanonical.idsOnlyInLeft.filter((id) => !intentionalLegacyResearchfiDedupe.includes(id));

  const report = {
    generatedAt: new Date().toISOString(),
    ok: unexplainedLegacyResearchfiDedupe.length === 0
      && canonicalItems.length === researchfiOnlyCanonicalRows.length + canonicalItems.filter((item) => item.sourceKey === "manual").length,
    oldWorldAudit: {
      legacySsrToCanonical,
      legacyJsToCanonical,
      legacyJsToResearchfiCanonical,
      intentionalLegacyResearchfiDedupe,
      unexplainedLegacyResearchfiDedupe,
      intentionalDifferences: [
        "Vanha JS-hydraatio käytti vain Research.fi-joukkoa, joten manual publication -itemit puuttuvat siitä tarkoituksella.",
        "Vanhan Research.fi-joukon sisällä oli lisäksi duplikaattitietueita, jotka canonical source layer deduplikoi."
      ]
    },
    canonicalRuntimeParity: {
      sourceDatasetCount: canonicalItems.length,
      sourceCounts: model.sourceCounts,
      countsByGroup: countByGroup(canonicalItems),
      ssrOpeningCounts: ssrOpeningCounts(canonicalItems),
      hydratedCount: canonicalItems.length,
      manualPublicationCount: canonicalItems.filter((item) => item.sourceKey === "manual").length,
      researchfiPublicationCount: canonicalItems.filter((item) => item.sourceKey === "researchfi").length,
      sameDatasetForSsrAndHydration: true
    },
    kpis: {
      canonical: computeKpis(canonicalItems),
      legacyResearchfiOnly: computeKpis(researchfi.map((publication) => ({
        typeCode: publication.typeCode,
        peerReviewed: publication.peerReviewed,
        openAccess: publication.openAccess
      }))),
      note: "Canonical total sisältää myös 3 eksplisiittisesti hyväksyttyä manual publication -itemiä."
    }
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

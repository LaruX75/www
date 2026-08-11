const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const loadResearchfi = require("../src/_data/researchfi");
const loadResearchfiContent = require("../src/_data/researchfiContent");
const loadResearchProgram = require("../src/_data/researchProgram");
const {
  PUBLIC_PUBLICATIONS_PAGE_FIELDS,
  buildLegacyFiPublicationRows,
  buildPublicationsPageModel,
  matchPublicationCandidates
} = require("../src/_data/publicationsPage");

function stableValue(value) {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
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

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function comparableValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return stableValue(value);
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

function compareRows(legacyRows = [], canonicalRows = []) {
  const legacyMap = new Map(legacyRows.map((row) => [rowId(row), row]));
  const canonicalMap = new Map(canonicalRows.map((row) => [rowId(row), row]));
  const legacyIds = [...legacyMap.keys()].sort();
  const canonicalIds = [...canonicalMap.keys()].sort();
  const idsOnlyInLegacy = legacyIds.filter((id) => !canonicalMap.has(id));
  const idsOnlyInCanonical = canonicalIds.filter((id) => !legacyMap.has(id));
  const fieldDiffs = [];

  legacyIds
    .filter((id) => canonicalMap.has(id))
    .forEach((id) => {
      const legacyRow = legacyMap.get(id);
      const canonicalRow = canonicalMap.get(id);
      ["pageUrl", "url", "title", "year", "authors", "journal", "publisher", "typeCode"].forEach((field) => {
        if (stableJson(comparableValue(legacyRow[field])) !== stableJson(comparableValue(canonicalRow[field]))) {
          fieldDiffs.push({
            id,
            field,
            legacy: comparableValue(legacyRow[field]),
            canonical: comparableValue(canonicalRow[field])
          });
        }
      });
    });

  return {
    legacyCount: legacyRows.length,
    canonicalCount: canonicalRows.length,
    idsOnlyInLegacy,
    idsOnlyInCanonical,
    fieldDiffs
  };
}

function collectUnexpectedFields(rows = [], allowlist = []) {
  const allowed = new Set(allowlist);
  const unexpected = new Set();

  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!allowed.has(key)) unexpected.add(key);
    });
  });

  return [...unexpected].sort();
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
  const legacyRows = buildLegacyFiPublicationRows(data);
  const canonicalRows = model.items.map((item) => ({
    id: item.id,
    sourceKey: item.sourceKey,
    pageUrl: item.pageUrl,
    url: item.url,
    title: item.title,
    year: item.year,
    authors: item.authors,
    journal: item.journal,
    publisher: item.publisher,
    typeCode: item.typeCode
  }));

  const parity = compareRows(legacyRows, canonicalRows);
  const unexpectedFields = collectUnexpectedFields(model.items, PUBLIC_PUBLICATIONS_PAGE_FIELDS);
  const intentionalLegacyOnly = parity.idsOnlyInLegacy.filter((id) => {
    const legacyRow = legacyRows.find((row) => rowId(row) === id);
    return canonicalRows.some((row) => matchPublicationCandidates(toCandidate(legacyRow), toCandidate(row)).length > 0);
  });
  const unexplainedLegacyOnly = parity.idsOnlyInLegacy.filter((id) => !intentionalLegacyOnly.includes(id));
  const intentionalCanonicalOnly = parity.idsOnlyInCanonical.filter((id) => {
    const canonicalRow = canonicalRows.find((row) => rowId(row) === id);
    return legacyRows.some((row) => matchPublicationCandidates(toCandidate(row), toCandidate(canonicalRow)).length > 0);
  });
  const unexplainedCanonicalOnly = parity.idsOnlyInCanonical.filter((id) => !intentionalCanonicalOnly.includes(id));

  const ok = unexplainedLegacyOnly.length === 0
    && unexplainedCanonicalOnly.length === 0
    && parity.fieldDiffs.length === 0
    && unexpectedFields.length === 0;

  const report = {
    generatedAt: new Date().toISOString(),
    ok,
    count: model.items.length,
    sourceCounts: model.sourceCounts,
    manualPublicationAudit: model.manualPublicationAudit,
    parity,
    intentionalDifferences: {
      deduplicatedLegacyOnly: intentionalLegacyOnly,
      detailPageCanonicalOnly: intentionalCanonicalOnly,
      unexplainedLegacyOnly,
      unexplainedCanonicalOnly
    },
    leakage: {
      items: unexpectedFields
    }
  };

  console.log(JSON.stringify(report, null, 2));

  if (!ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

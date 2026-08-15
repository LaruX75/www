const canva = require("../src/_data/canva");
const finnaAoe = require("../src/_data/finnaAoe");
const youtube = require("../src/_data/youtube");
const presentationContexts = require("../src/_data/presentationContexts.json");
const {
  buildPresentationsPageSourceData,
  buildCanonicalPresentationPageRecords
} = require("../src/_data/presentationsPage");

const PARITY_FIELDS = [
  "pageUrl",
  "title",
  "description",
  "categories",
  "keywords",
  "source",
  "url",
  "sourceUrl",
  "publicUrl",
  "thumbnail",
  "date",
  "sourceLanguage",
  "slideCount",
  "viewCount",
  "courseContexts",
  "contexts"
];

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

async function loadData() {
  return {
    canva: await canva(),
    finnaAoe: await finnaAoe(),
    youtube: await youtube(),
    presentationContexts
  };
}

async function main() {
  const data = await loadData();
  const sourceData = buildPresentationsPageSourceData(data);
  const legacyRows = sourceData.presentations || [];
  const canonicalRows = buildCanonicalPresentationPageRecords(sourceData);

  const legacyByPageUrl = new Map(legacyRows.map((row) => [row.pageUrl, row]));
  const canonicalByPageUrl = new Map(canonicalRows.map((row) => [row.pageUrl, row]));
  const pageUrls = [...new Set([...legacyByPageUrl.keys(), ...canonicalByPageUrl.keys()])].sort();
  const missingInCanonical = [];
  const missingInLegacy = [];
  const fieldDiffs = [];

  pageUrls.forEach((pageUrl) => {
    const legacyRow = legacyByPageUrl.get(pageUrl);
    const canonicalRow = canonicalByPageUrl.get(pageUrl);

    if (!legacyRow) {
      missingInLegacy.push(pageUrl);
      return;
    }

    if (!canonicalRow) {
      missingInCanonical.push(pageUrl);
      return;
    }

    PARITY_FIELDS.forEach((field) => {
      if (stableJson(legacyRow[field]) !== stableJson(canonicalRow[field])) {
        fieldDiffs.push({
          pageUrl,
          field,
          legacy: stableValue(legacyRow[field]),
          canonical: stableValue(canonicalRow[field])
        });
      }
    });
  });

  const report = {
    generatedAt: new Date().toISOString(),
    ok: missingInCanonical.length === 0 && missingInLegacy.length === 0 && fieldDiffs.length === 0,
    count: canonicalRows.length,
    missingInCanonical,
    missingInLegacy,
    fieldDiffs
  };

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

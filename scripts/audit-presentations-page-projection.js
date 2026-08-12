const canva = require("../src/_data/canva");
const finnaAoe = require("../src/_data/finnaAoe");
const youtube = require("../src/_data/youtube");
const presentationContexts = require("../src/_data/presentationContexts.json");
const {
  PRESENTATION_SOURCE_ORDER,
  PUBLIC_PRESENTATION_FIELDS,
  PUBLIC_PRESENTATION_LEGACY_FIELDS,
  buildPresentationsPageSourceData,
  buildLegacyPresentationSourceBuckets,
  buildPublicPresentationLegacyBuckets,
  buildPresentationsPageModel
} = require("../src/_data/presentationsPage");

const PARITY_FIELDS = {
  aoe: ["title", "url", "image", "year", "summary"],
  canva: [
    "id",
    "title",
    "url",
    "pageUrl",
    "thumbnail",
    "description",
    "date",
    "categories",
    "lang",
    "sourceLanguage",
    "slideCount",
    "jarjestaja",
    "kategoria",
    "paakortti",
    "paareitti",
    "asiantuntijaprofiili",
    "sivuyhteys",
    "courseContexts"
  ],
  customMaterials: ["title", "url", "pageUrl", "externalUrl", "thumbnail", "description", "badgeText", "date"],
  curatedVideos: ["title", "url", "pageUrl", "externalUrl", "thumbnail", "description", "badgeText", "date"],
  videoSeries: ["title", "url", "pageUrl", "externalUrl", "thumbnail", "description", "badgeText", "date", "itemCount"],
  youtubeVideos: ["title", "url", "thumbnail", "description", "publishedAt"],
  youtube: ["title", "url", "thumbnail", "description", "publishedAt", "itemCount"],
  slideshare: [
    "title",
    "url",
    "pageUrl",
    "thumbnail",
    "description",
    "categories",
    "keywords",
    "date",
    "courseContexts",
    "sourceLanguage",
    "slideCount"
  ]
};

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

function rowId(sourceKey, row = {}) {
  return [
    sourceKey,
    row.url || "",
    row.pageUrl || "",
    row.externalUrl || "",
    row.title || ""
  ].join("|");
}

function compareBucket(sourceKey, legacyRows = [], publicRows = []) {
  const legacyMap = new Map(legacyRows.map((row) => [rowId(sourceKey, row), row]));
  const publicMap = new Map(publicRows.map((row) => [rowId(sourceKey, row), row]));
  const legacyIds = [...legacyMap.keys()].sort();
  const publicIds = [...publicMap.keys()].sort();
  const idsOnlyInLegacy = legacyIds.filter((id) => !publicMap.has(id));
  const idsOnlyInPublic = publicIds.filter((id) => !legacyMap.has(id));
  const fieldDiffs = [];

  legacyIds
    .filter((id) => publicMap.has(id))
    .forEach((id) => {
      const legacyRow = legacyMap.get(id);
      const publicRow = publicMap.get(id);
      (PARITY_FIELDS[sourceKey] || []).forEach((field) => {
        if (stableJson(legacyRow[field]) !== stableJson(publicRow[field])) {
          fieldDiffs.push({
            id,
            field,
            legacy: stableValue(legacyRow[field]),
            public: stableValue(publicRow[field])
          });
        }
      });
    });

  return {
    legacyCount: legacyRows.length,
    publicCount: publicRows.length,
    idsOnlyInLegacy,
    idsOnlyInPublic,
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

function collectUnexpectedCanonicalItemFields(items = []) {
  const allowed = new Set(PUBLIC_PRESENTATION_FIELDS);
  const unexpected = new Set();

  items.forEach((item) => {
    Object.keys(item || {}).forEach((key) => {
      if (!allowed.has(key)) unexpected.add(key);
    });
  });

  return [...unexpected].sort();
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
  const model = buildPresentationsPageModel(data);
  const legacyBuckets = buildLegacyPresentationSourceBuckets(sourceData);
  const publicBuckets = buildPublicPresentationLegacyBuckets(model.items || []);
  const bucketParity = {};
  const sourceCounts = {};
  let hasParityErrors = false;

  PRESENTATION_SOURCE_ORDER.forEach((sourceKey) => {
    sourceCounts[sourceKey] = model.items.filter((item) => item.sourceKey === sourceKey).length;
    bucketParity[sourceKey] = compareBucket(
      sourceKey,
      legacyBuckets[sourceKey] || [],
      publicBuckets[sourceKey] || []
    );

    if (
      bucketParity[sourceKey].legacyCount !== bucketParity[sourceKey].publicCount ||
      bucketParity[sourceKey].idsOnlyInLegacy.length ||
      bucketParity[sourceKey].idsOnlyInPublic.length ||
      bucketParity[sourceKey].fieldDiffs.length
    ) {
      hasParityErrors = true;
    }
  });

  const compatibilityProjectionLeakage = {};
  let hasLeakageErrors = false;

  PRESENTATION_SOURCE_ORDER.forEach((sourceKey) => {
    compatibilityProjectionLeakage[sourceKey] = collectUnexpectedFields(
      publicBuckets[sourceKey] || [],
      PUBLIC_PRESENTATION_LEGACY_FIELDS[sourceKey] || []
    );
    if (compatibilityProjectionLeakage[sourceKey].length) {
      hasLeakageErrors = true;
    }
  });

  const canonicalItemUnexpectedFields = collectUnexpectedCanonicalItemFields(model.items);
  if (canonicalItemUnexpectedFields.length) {
    hasLeakageErrors = true;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    ok: !hasParityErrors && !hasLeakageErrors,
    count: model.items.length,
    sourceCounts,
    bucketParity,
    leakage: {
      compatibilityProjection: compatibilityProjectionLeakage,
      items: canonicalItemUnexpectedFields
    }
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

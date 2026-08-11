const fs = require("fs");
const path = require("path");

const {
  PUBLIC_WRITINGS_PAGE_FIELDS
} = require("../src/_data/writingsPage");

const ROOT = process.cwd();

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function authorsText(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean).join("; ") || null;
  }
  return pickString(value);
}

function hasSection(item, sectionKey) {
  return Array.isArray(item?.sectionKeys) && item.sectionKeys.includes(sectionKey);
}

function stableCounts(items = [], field) {
  return toArray(items).reduce((acc, item) => {
    const values = Array.isArray(item?.[field]) ? item[field] : [item?.[field]];
    values
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .forEach((value) => {
        acc[value] = (acc[value] || 0) + 1;
      });
    return acc;
  }, {});
}

function rowKey(row = {}) {
  if (row.contentType === "scientificPublication") {
    return [
      row.contentType || "",
      row.title || "",
      row.year || "",
      row.source || ""
    ].join("|");
  }
  return [
    row.contentType || "",
    row.title || "",
    row.date || row.year || "",
    row.pageUrl || row.url || ""
  ].join("|");
}

function normalizeSharedFeedItem(item = {}) {
  return {
    id: pickString(item.id) || pickString(item.url),
    contentType: pickString(item.contentType),
    source: pickString(item.source) || "local",
    title: pickString(item.title),
    description: pickString(item.description),
    date: pickString(item.date),
    year: item.year || null,
    lang: pickString(item.lang),
    url: pickString(item.sourceUrl) || pickString(item.url),
    pageUrl: pickString(item.url),
    authorsText: authorsText(item.authors),
    publication: pickString(item.publication),
    event: pickString(item.event),
    meeting: pickString(item.meeting),
    meetingDate: pickString(item.meetingDate),
    initiativeType: pickString(item.initiativeType),
    keywords: toArray(item.keywords),
    categories: toArray(item.categories)
  };
}

function normalizeResearchfiFeedItem(item = {}) {
  return {
    id: pickString(item.anchorId) || pickString(item.publicationId) || `${item.title || ""}|${item.year || ""}`,
    contentType: "scientificPublication",
    source: "researchfi",
    title: pickString(item.title),
    description: pickString(item.description),
    date: item.year ? `${item.year}-01-01` : null,
    year: item.year || null,
    lang: pickString(item.lang) || "fi",
    url: pickString(item.url) || pickString(item.doiUrl),
    pageUrl: null,
    authorsText: authorsText(item.authors),
    publication: pickString(item.journal),
    typeCode: pickString(item.typeCode),
    keywords: toArray(item.keywords),
    categories: toArray(item.categories)
  };
}

function normalizeCanonicalItem(item = {}) {
  return {
    id: pickString(item.id),
    contentType: pickString(item.contentType),
    source: pickString(item.source),
    title: pickString(item.title),
    description: pickString(item.description),
    date: pickString(item.date),
    year: item.year || null,
    lang: pickString(item.lang),
    url: pickString(item.url),
    pageUrl: pickString(item.pageUrl),
    authorsText: authorsText(item.authorsText || item.authors),
    publication: pickString(item.publication) || pickString(item.journal),
    event: pickString(item.event),
    meeting: pickString(item.meeting),
    meetingDate: pickString(item.meetingDate),
    initiativeType: pickString(item.initiativeType),
    keywords: toArray(item.keywords),
    categories: toArray(item.categories)
  };
}

function compareRows(currentRows = [], canonicalRows = []) {
  const currentMap = new Map(currentRows.map((row) => [rowKey(row), row]));
  const canonicalMap = new Map(canonicalRows.map((row) => [rowKey(row), row]));
  const currentKeys = [...currentMap.keys()].sort();
  const canonicalKeys = [...canonicalMap.keys()].sort();

  return {
    currentCount: currentRows.length,
    canonicalCount: canonicalRows.length,
    missingFromCanonical: currentKeys.filter((key) => !canonicalMap.has(key)),
    extraInCanonical: canonicalKeys.filter((key) => !currentMap.has(key)),
    currentByType: stableCounts(currentRows, "contentType"),
    canonicalByType: stableCounts(canonicalRows, "contentType")
  };
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function classifyEnScientificPublicationDifferences(enCurrentRows = [], enCanonicalRows = [], parity = {}) {
  const canonicalByNormalizedTitleYear = new Map();
  enCanonicalRows
    .filter((row) => row.contentType === "scientificPublication")
    .forEach((row) => {
      canonicalByNormalizedTitleYear.set(
        `${normalizeTitle(row.title)}|${row.year || ""}`,
        row
      );
    });

  const intentionalMissing = parity.missingFromCanonical.filter((key) => {
    const row = enCurrentRows.find((entry) => rowKey(entry) === key);
    if (!row || row.contentType !== "scientificPublication") return false;
    const normalizedKey = `${normalizeTitle(row.title)}|${row.year || ""}`;
    return canonicalByNormalizedTitleYear.has(normalizedKey);
  });

  const intentionalExtra = parity.extraInCanonical.filter((key) => {
    const row = enCanonicalRows.find((entry) => rowKey(entry) === key);
    return row?.contentType === "scientificPublication" && row?.source === "manual";
  });

  return {
    intentionalMissing,
    intentionalExtra,
    unexplainedMissing: parity.missingFromCanonical.filter((key) => !intentionalMissing.includes(key)),
    unexplainedExtra: parity.extraInCanonical.filter((key) => !intentionalExtra.includes(key))
  };
}

function collectUnexpectedFields(items = [], allowlist = []) {
  const allowed = new Set(allowlist);
  const unexpected = new Set();
  toArray(items).forEach((item) => {
    Object.keys(item || {}).forEach((key) => {
      if (!allowed.has(key)) unexpected.add(key);
    });
  });
  return [...unexpected].sort();
}

function collectDuplicateValues(items = [], field) {
  const seen = new Set();
  const duplicates = new Set();
  toArray(items).forEach((item) => {
    const value = pickString(item?.[field]);
    if (!value) return;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates].sort();
}

function extractMatches(source, regex) {
  const matches = [];
  for (const match of source.matchAll(regex)) {
    matches.push(match.slice(1).filter(Boolean));
  }
  return matches;
}

function auditFiRuntimeSource() {
  const source = readText("src/kirjoitukset.njk");
  const contentEngineQueries = extractMatches(
    source,
    /ContentEngine\.query\(\{\s*source:\s*'([^']+)'\s*,\s*filters:\s*\{\s*contentType:\s*'([^']+)'/g
  ).map(([endpoint, contentType]) => ({ endpoint, contentType }));
  const publicJsonEndpoints = [...new Set(contentEngineQueries.map((entry) => entry.endpoint))];
  const usesCompatibilityViewModel = source.includes("{% set pageModel = finnishWritingsPage %}");
  const legacyRefsRemaining = [
    "parseJson(",
    "pub-data",
    "mielipiteet-data",
    "lausunnot-data",
    "kolumnit-data",
    "aloitteet-data",
    "puheet-data",
    "blog-data"
  ].filter((needle) => source.includes(needle));

  return {
    ssrSource: usesCompatibilityViewModel ? "finnishWritingsPage" : "legacy-template-state",
    compatibilitySubsetRule: {
      contentTypes: ["blogPost", "opinion", "column"],
      note: "FI subset on compatibility projection, ei canonical writings datasetin pysyvä sisältömääritelmä."
    },
    contentEngineQueries,
    publicJsonEndpoints,
    legacyRuntimeReferencesRemaining: legacyRefsRemaining,
    legacyNotes: [
      usesCompatibilityViewModel
        ? "SSR käyttää canonical writingsPage-datasta johdettua finnishWritingsPage-view-modelia."
        : "SSR ei vielä käytä finnishWritingsPage-view-modelia.",
      contentEngineQueries.every((entry) => entry.endpoint === "writings")
        ? "JS-on käyttää yhtä canonical writings sourcea kaikissa näkyvissä osioissa."
        : "JS-on käyttää vielä useampaa runtime-sourcea.",
      legacyRefsRemaining.length === 0
        ? "Aiemmat parseJson/pub-data legacy-runtimehaarat on poistettu FI-sivulta."
        : "FI-templateen jäi vielä legacy-runtimeviittauksia, jotka vaativat jatkoauditin."
    ]
  };
}

function auditEnRuntimeSource() {
  const source = readText("src/en/writings.njk");
  const directQueries = extractMatches(
    source,
    /ContentEngine\.query\(\{\s*source:\s*'([^']+)'\s*,\s*filters:\s*\{\s*contentType:\s*'([^']+)'/g
  ).map(([endpoint, contentType]) => ({ endpoint, contentType }));
  const helperQueries = extractMatches(
    source,
    /_enQueryWritings\('([^']+)'/g
  ).map(([contentType]) => ({ endpoint: "writings", contentType }));
  const contentEngineQueries = directQueries.length > 0 ? directQueries : helperQueries;
  const publicJsonEndpoints = [...new Set(contentEngineQueries.map((entry) => entry.endpoint))];
  const usesEnglishViewModel = source.includes("{% set pageModel = englishWritingsPage %}");
  const directLegacyFetches = [
    "/data/publications.json",
    "/data/initiatives.json",
    "/data/content.json",
    "/data/researchfi.json"
  ].filter((needle) => source.includes(needle));

  return {
    ssrSource: usesEnglishViewModel ? "englishWritingsPage" : "legacy-template-state",
    contentEngineQueries,
    publicJsonEndpoints,
    directLegacyFetches,
    runtimeSections: [
      "statements (SSR only)",
      "opinions",
      "columns",
      "initiatives",
      "speeches",
      "public speeches (SSR only subset)",
      "blog",
      "scientific publications"
    ],
    legacyNotes: [
      usesEnglishViewModel
        ? "SSR käyttää canonical writingsPage-datasta johdettua englishWritingsPage-view-modelia."
        : "SSR ei vielä käytä englishWritingsPage-view-modelia.",
      contentEngineQueries.every((entry) => entry.endpoint === "writings")
        ? "JS-on käyttää yhtä canonical writings sourcea kaikissa writings-osioissa."
        : "JS-on käyttää vielä useampaa runtime-sourcea.",
      directLegacyFetches.length === 0
        ? "Suorat publications/content/initiatives/researchfi-fetchit on poistettu EN-sivulta."
        : "EN-sivulla on yhä legacy-feed-fetch-viittauksia."
    ]
  };
}

function main() {
  const writingsPage = readJson("_site/data/writings-page.json");
  const content = readJson("_site/data/content.json");
  const publications = readJson("_site/data/publications.json");
  const initiatives = readJson("_site/data/initiatives.json");
  const researchfi = readJson("_site/data/researchfi.json");

  const canonicalItems = toArray(writingsPage.items);
  const canonicalComparable = canonicalItems.map(normalizeCanonicalItem);

  const fiCurrentRows = [
    ...toArray(content.items).filter((item) => item.contentType === "blogPost").map(normalizeSharedFeedItem),
    ...toArray(publications.items).filter((item) => item.contentType === "opinion").map(normalizeSharedFeedItem),
    ...toArray(publications.items).filter((item) => item.contentType === "column").map(normalizeSharedFeedItem)
  ];
  const fiCanonicalRows = canonicalItems
    .filter((item) => hasSection(item, "blog") || hasSection(item, "opinions") || hasSection(item, "columns"))
    .map(normalizeCanonicalItem);

  const enCurrentRows = [
    ...toArray(publications.items).filter((item) => item.contentType === "statement").map(normalizeSharedFeedItem),
    ...toArray(publications.items).filter((item) => item.contentType === "opinion").map(normalizeSharedFeedItem),
    ...toArray(publications.items).filter((item) => item.contentType === "column").map(normalizeSharedFeedItem),
    ...toArray(publications.items).filter((item) => item.contentType === "speech").map(normalizeSharedFeedItem),
    ...toArray(content.items).filter((item) => item.contentType === "blogPost").map(normalizeSharedFeedItem),
    ...toArray(initiatives.items).map(normalizeSharedFeedItem),
    ...toArray(researchfi.items).map(normalizeResearchfiFeedItem)
  ];
  const enCanonicalRows = canonicalItems
    .filter((item) => [
      "statement",
      "opinion",
      "column",
      "speech",
      "blogPost",
      "initiative",
      "scientificPublication"
    ].includes(item.contentType))
    .map(normalizeCanonicalItem);

  const fiParity = compareRows(fiCurrentRows, fiCanonicalRows);
  const enParity = compareRows(enCurrentRows, enCanonicalRows);
  const enScientificPublicationDiffs = classifyEnScientificPublicationDifferences(
    enCurrentRows,
    enCanonicalRows,
    enParity
  );
  const unexpectedFields = collectUnexpectedFields(canonicalItems, PUBLIC_WRITINGS_PAGE_FIELDS);
  const duplicateIds = collectDuplicateValues(canonicalItems, "id");
  const duplicatePageUrls = collectDuplicateValues(
    canonicalItems.filter((item) => pickString(item.pageUrl)),
    "pageUrl"
  );

  const ok = writingsPage.count === canonicalItems.length
    && duplicateIds.length === 0
    && duplicatePageUrls.length === 0
    && unexpectedFields.length === 0
    && fiParity.missingFromCanonical.length === 0
    && fiParity.extraInCanonical.length === 0
    && enScientificPublicationDiffs.unexplainedMissing.length === 0
    && enScientificPublicationDiffs.unexplainedExtra.length === 0;

  const report = {
    generatedAt: new Date().toISOString(),
    ok,
    projection: {
      countField: writingsPage.count,
      itemsLength: canonicalItems.length,
      contentTypeCounts: stableCounts(canonicalComparable, "contentType"),
      sectionCounts: stableCounts(canonicalItems, "sectionKeys"),
      sourceCounts: stableCounts(canonicalItems, "sourceKey"),
      pageUrlCoverageByType: stableCounts(
        canonicalItems.filter((item) => pickString(item.pageUrl)),
        "contentType"
      ),
      duplicateIds,
      duplicatePageUrls,
      unexpectedFields
    },
    currentRuntimeAudit: {
      fi: auditFiRuntimeSource(),
      en: auditEnRuntimeSource()
    },
    parity: {
      canonicalTotal: canonicalItems.length,
      fiCurrent: fiParity,
      enCurrent: enParity
    },
    intentionalDifferences: {
      enScientificPublicationDiffs
    },
    differencesVsCanonicalTotal: {
      fi: {
        currentCount: fiCurrentRows.length,
        canonicalTotal: canonicalItems.length,
        classification: "legacy-scope-difference"
      },
      en: {
        currentCount: enCurrentRows.length,
        canonicalTotal: canonicalItems.length,
        classification: "near-total-coverage"
      }
    }
  };

  console.log(JSON.stringify(report, null, 2));

  if (!ok) {
    process.exitCode = 1;
  }
}

main();

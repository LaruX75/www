const fs = require("fs");
const path = require("path");

const { buildEnglishWritingsViewModel } = require("../src/_data/writingsPage");

const ROOT = process.cwd();
const OPENING_LIMIT = 5;
const DYNAMIC_TYPES = ["opinion", "column", "initiative", "speech", "blogPost"];

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function visibleUrl(item = {}) {
  return item.sourceUrl || item.url || item.pageUrl || null;
}

function normalizeTitle(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function stripTags(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDateEn(dateValue) {
  if (!dateValue) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${dateValue}T00:00:00.000Z`));
}

function normalizeLegacyItem(item = {}) {
  return {
    id: item.id || visibleUrl(item),
    contentType: item.contentType || null,
    title: normalizeTitle(item.title),
    date: item.date || null,
    year: item.year || null,
    url: visibleUrl(item),
    publication: item.publication || null,
    event: item.event || null,
    meetingDate: item.meetingDate || item.date || null,
    initiativeType: item.initiativeType || null,
    authors: item.authors || null,
    journal: item.journal || null,
    source: item.source || null
  };
}

function normalizeResearchfiItem(item = {}) {
  return {
    id: item.anchorId || item.publicationId || item.title || null,
    contentType: "scientificPublication",
    title: normalizeTitle(item.title),
    date: item.year ? `${item.year}-01-01` : null,
    year: item.year || null,
    url: item.url || item.doiUrl || null,
    authors: item.authors || null,
    journal: item.journal || null,
    source: "researchfi"
  };
}

function normalizeCanonicalItem(item = {}) {
  const publicationUrl = item.contentType === "scientificPublication"
    ? (item.sourceUrl || item.doiUrl || null)
    : visibleUrl(item);
  return {
    id: item.id || visibleUrl(item),
    contentType: item.contentType || null,
    title: normalizeTitle(item.title),
    date: item.date || null,
    year: item.year || null,
    url: publicationUrl,
    publication: item.publication || item.journal || null,
    event: item.event || null,
    meetingDate: item.meetingDate || item.date || null,
    initiativeType: item.initiativeType || null,
    authors: item.authorsText || (Array.isArray(item.authors) ? item.authors.join("; ") : item.authors) || null,
    journal: item.journal || item.publication || null,
    source: item.source || item.sourceKey || null
  };
}

function sortDateDesc(items = [], dateField = "date") {
  return [...items].sort((left, right) => {
    const leftDate = String(left?.[dateField] || left?.date || "");
    const rightDate = String(right?.[dateField] || right?.date || "");
    const dateDiff = rightDate.localeCompare(leftDate);
    if (dateDiff !== 0) return dateDiff;
    return String(left.url || left.title || "").localeCompare(String(right.url || right.title || ""), "en");
  });
}

function genericRowKey(item = {}) {
  return [
    item.contentType || "",
    item.id || "",
    item.url || "",
    item.title || ""
  ].join("|");
}

function publicationRowKey(item = {}) {
  return [
    item.contentType || "",
    item.title || "",
    item.year || "",
    item.url || "",
    item.source || ""
  ].join("|");
}

function compareRows(type, legacyRows = [], canonicalRows = [], rowKey = genericRowKey) {
  const legacyMap = new Map(legacyRows.map((row) => [rowKey(row), row]));
  const canonicalMap = new Map(canonicalRows.map((row) => [rowKey(row), row]));
  const legacyKeys = [...legacyMap.keys()].sort();
  const canonicalKeys = [...canonicalMap.keys()].sort();

  return {
    type,
    legacyCount: legacyRows.length,
    canonicalCount: canonicalRows.length,
    missingFromCanonical: legacyKeys.filter((key) => !canonicalMap.has(key)),
    extraInCanonical: canonicalKeys.filter((key) => !legacyMap.has(key)),
    orderMatches: legacyRows.map(rowKey).join("||") === canonicalRows.map(rowKey).join("||")
  };
}

function normalizeTitleYear(value = {}) {
  return `${String(value.title || "").toLowerCase().replace(/\s+/g, " ").trim()}|${value.year || ""}`;
}

function classifyScientificPublicationDiffs(legacyRows = [], canonicalRows = [], parity = {}) {
  const canonicalByTitleYear = new Map(
    canonicalRows.map((row) => [normalizeTitleYear(row), row])
  );

  const intentionalMissing = parity.missingFromCanonical.filter((key) => {
    const row = legacyRows.find((entry) => publicationRowKey(entry) === key);
    return row && canonicalByTitleYear.has(normalizeTitleYear(row));
  });

  const intentionalExtra = parity.extraInCanonical.filter((key) => {
    const row = canonicalRows.find((entry) => publicationRowKey(entry) === key);
    return row?.source === "manual";
  });

  return {
    intentionalMissing,
    intentionalExtra,
    unexplainedMissing: parity.missingFromCanonical.filter((key) => !intentionalMissing.includes(key)),
    unexplainedExtra: parity.extraInCanonical.filter((key) => !intentionalExtra.includes(key))
  };
}

function extractTbodyRows(html, tbodyId) {
  const match = html.match(new RegExp(`<tbody id="${tbodyId}">([\\s\\S]*?)</tbody>`));
  if (!match) return [];
  return [...match[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((rowMatch) => {
    const rowHtml = rowMatch[1];
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => stripTags(cell[1]));
    const linkMatch = rowHtml.match(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    return {
      date: cells[0] || null,
      url: linkMatch ? linkMatch[1] : null,
      title: linkMatch ? normalizeTitle(stripTags(linkMatch[2])) : null
    };
  });
}

function expectedRows(items = [], limit = null, dateField = "date") {
  const rows = (limit ? items.slice(0, limit) : items).map((item) => ({
    date: formatDateEn(item[dateField] || item.date),
    url: visibleUrl(item),
    title: normalizeTitle(item.title)
  }));
  return rows;
}

function compareExpectedRows(expected = [], actual = []) {
  return {
    expectedCount: expected.length,
    actualCount: actual.length,
    sameRows: JSON.stringify(expected) === JSON.stringify(actual)
  };
}

function countByType(items = []) {
  return items.reduce((acc, item) => {
    const type = item.contentType || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
}

function main() {
  const writings = readJson("_site/data/writings-page.json");
  const publications = readJson("_site/data/publications.json");
  const initiatives = readJson("_site/data/initiatives.json");
  const content = readJson("_site/data/content.json");
  const researchfi = readJson("_site/data/researchfi.json");
  const html = readText("_site/en/writings/index.html");
  const source = readText("src/en/writings.njk");

  const viewModel = buildEnglishWritingsViewModel({ items: toArray(writings.items) });
  const canonicalItems = toArray(writings.items).map(normalizeCanonicalItem);

  const legacyByType = {
    statement: sortDateDesc(toArray(publications.items).filter((item) => item.contentType === "statement").map(normalizeLegacyItem)),
    opinion: sortDateDesc(toArray(publications.items).filter((item) => item.contentType === "opinion").map(normalizeLegacyItem)),
    column: sortDateDesc(toArray(publications.items).filter((item) => item.contentType === "column").map(normalizeLegacyItem)),
    initiative: sortDateDesc(toArray(initiatives.items).map(normalizeLegacyItem), "meetingDate"),
    speech: sortDateDesc(toArray(publications.items).filter((item) => item.contentType === "speech").map(normalizeLegacyItem)),
    blogPost: sortDateDesc(toArray(content.items).filter((item) => item.contentType === "blogPost").map(normalizeLegacyItem)),
    scientificPublication: sortDateDesc(toArray(researchfi.items).map(normalizeResearchfiItem))
  };

  const canonicalByType = {
    statement: sortDateDesc(canonicalItems.filter((item) => item.contentType === "statement")),
    opinion: sortDateDesc(canonicalItems.filter((item) => item.contentType === "opinion")),
    column: sortDateDesc(canonicalItems.filter((item) => item.contentType === "column")),
    initiative: sortDateDesc(canonicalItems.filter((item) => item.contentType === "initiative"), "meetingDate"),
    speech: sortDateDesc(canonicalItems.filter((item) => item.contentType === "speech")),
    blogPost: sortDateDesc(canonicalItems.filter((item) => item.contentType === "blogPost")),
    scientificPublication: sortDateDesc(canonicalItems.filter((item) => item.contentType === "scientificPublication"))
  };

  const exactParityByType = DYNAMIC_TYPES.concat(["statement"]).map((type) =>
    compareRows(type, legacyByType[type], canonicalByType[type], genericRowKey)
  );
  const publicationParity = compareRows(
    "scientificPublication",
    legacyByType.scientificPublication,
    canonicalByType.scientificPublication,
    publicationRowKey
  );
  const scientificPublicationDiffs = classifyScientificPublicationDiffs(
    legacyByType.scientificPublication,
    canonicalByType.scientificPublication,
    publicationParity
  );

  const ssrParity = {
    statements: compareExpectedRows(
      expectedRows(viewModel.statementItems),
      extractTbodyRows(html, "statements-tbody")
    ),
    publicSpeeches: compareExpectedRows(
      expectedRows(viewModel.publicSpeechItems),
      extractTbodyRows(html, "public-speeches-tbody")
    ),
    opinions: compareExpectedRows(
      expectedRows(viewModel.openingOpinionItems, OPENING_LIMIT),
      extractTbodyRows(html, "mielipiteet-tbody")
    ),
    columns: compareExpectedRows(
      expectedRows(viewModel.openingColumnItems, OPENING_LIMIT),
      extractTbodyRows(html, "kolumnit-tbody")
    ),
    initiatives: compareExpectedRows(
      expectedRows(viewModel.openingInitiativeItems, OPENING_LIMIT),
      extractTbodyRows(html, "aloitteet-tbody")
    ),
    speeches: compareExpectedRows(
      expectedRows(viewModel.openingSpeechItems, OPENING_LIMIT),
      extractTbodyRows(html, "puheet-tbody")
    ),
    blog: compareExpectedRows(
      expectedRows(viewModel.openingBlogItems, OPENING_LIMIT),
      extractTbodyRows(html, "blog-tbody")
    )
  };

  const sourceQueries = [...source.matchAll(/_enQueryWritings\('([^']+)'/g)]
    .map((match) => ({ source: "writings", contentType: match[1] }));
  const directLegacyFetches = [
    "/data/publications.json",
    "/data/initiatives.json",
    "/data/content.json",
    "/data/researchfi.json"
  ].filter((needle) => source.includes(needle));

  const clientRuntimeAudit = {
    usesEnglishWritingsPage: source.includes("{% set pageModel = englishWritingsPage %}"),
    usesWritingsSourceOnly: sourceQueries.every((entry) => entry.source === "writings"),
    sourceQueries,
    directLegacyFetches,
    legacyMappersRemoved: !/_enLoadJsonItems|_enPublicationsPromise|_enInitiativesPromise|_enContentPromise|_enResearchfiPromise|rawItems\.map/.test(source)
  };

  const report = {
    generatedAt: new Date().toISOString(),
    ok: exactParityByType.every((entry) =>
      entry.legacyCount === entry.canonicalCount
      && entry.missingFromCanonical.length === 0
      && entry.extraInCanonical.length === 0
      && entry.orderMatches
    )
      && publicationParity.legacyCount === publicationParity.canonicalCount
      && scientificPublicationDiffs.unexplainedMissing.length === 0
      && scientificPublicationDiffs.unexplainedExtra.length === 0
      && Object.values(ssrParity).every((entry) => entry.sameRows)
      && clientRuntimeAudit.usesEnglishWritingsPage
      && clientRuntimeAudit.usesWritingsSourceOnly
      && clientRuntimeAudit.directLegacyFetches.length === 0
      && clientRuntimeAudit.legacyMappersRemoved,
    counts: {
      canonicalTotal: canonicalItems.length,
      englishVisibleTotal: viewModel.items.length,
      canonicalByType: countByType(canonicalItems),
      englishSectionCounts: {
        statementCount: viewModel.statementCount,
        opinionCount: viewModel.opinionCount,
        columnCount: viewModel.columnCount,
        initiativeCount: viewModel.initiativeCount,
        speechCount: viewModel.speechCount,
        publicSpeechCount: viewModel.publicSpeechCount,
        blogCount: viewModel.blogCount,
        publicationCount: viewModel.publicationCount
      }
    },
    exactParityByType,
    publicationParity,
    scientificPublicationDiffs,
    ssrParity,
    clientRuntimeAudit
  };

  console.log(JSON.stringify(report, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}

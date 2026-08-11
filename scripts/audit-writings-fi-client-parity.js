const fs = require("fs");
const path = require("path");

const {
  FI_COMPATIBILITY_CONTENT_TYPES,
  buildFinnishWritingsCompatibilityItems,
  buildFinnishWritingsViewModel
} = require("../src/_data/writingsPage");

const ROOT = process.cwd();
const OPENING_LIMIT = 5;
const TYPE_ORDER = ["opinion", "column", "blogPost"];
const TBODY_BY_TYPE = {
  opinion: "mielipiteet-tbody",
  column: "kolumnit-tbody",
  blogPost: "blog-tbody"
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
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

function normalizeTitle(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function visibleUrl(item = {}) {
  return item.pageUrl || item.url || item.sourceUrl || null;
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeLegacyItem(item = {}) {
  return {
    id: item.id || visibleUrl(item),
    contentType: item.contentType || null,
    title: normalizeTitle(item.title),
    date: item.date || null,
    year: item.year || null,
    lang: item.lang || null,
    url: visibleUrl(item),
    publication: item.publication || null,
    categories: toArray(item.categories),
    keywords: toArray(item.keywords),
    writingRoles: toArray(item.writingRoles),
    opinionRoles: toArray(item.opinionRoles)
  };
}

function normalizeCanonicalItem(item = {}) {
  return {
    id: item.id || visibleUrl(item),
    contentType: item.contentType || null,
    title: normalizeTitle(item.title),
    date: item.date || null,
    year: item.year || null,
    lang: item.lang || null,
    url: visibleUrl(item),
    publication: item.publication || null,
    categories: toArray(item.categories),
    keywords: toArray(item.keywords),
    writingRoles: toArray(item.writingRoles),
    opinionRoles: toArray(item.opinionRoles)
  };
}

function sortByDateDesc(items = []) {
  return [...items].sort((left, right) => {
    const dateDiff = String(right.date || "").localeCompare(String(left.date || ""));
    if (dateDiff !== 0) return dateDiff;
    return String(left.title || "").localeCompare(String(right.title || ""), "fi");
  });
}

function rowKey(item = {}) {
  return [
    item.contentType || "",
    item.id || "",
    item.url || "",
    item.title || ""
  ].join("|");
}

function compareTypeRows(type, legacyRows = [], canonicalRows = []) {
  const legacyMap = new Map(legacyRows.map((row) => [rowKey(row), row]));
  const canonicalMap = new Map(canonicalRows.map((row) => [rowKey(row), row]));
  const legacyKeys = [...legacyMap.keys()].sort();
  const canonicalKeys = [...canonicalMap.keys()].sort();
  const sharedKeys = legacyKeys.filter((key) => canonicalMap.has(key));
  const fieldDiffs = [];

  sharedKeys.forEach((key) => {
    const legacy = legacyMap.get(key);
    const canonical = canonicalMap.get(key);
    ["title", "date", "year", "lang", "url", "publication"].forEach((field) => {
      const left = JSON.stringify(legacy[field] ?? null);
      const right = JSON.stringify(canonical[field] ?? null);
      if (left !== right) {
        fieldDiffs.push({
          type,
          key,
          field,
          legacy: legacy[field] ?? null,
          canonical: canonical[field] ?? null
        });
      }
    });
  });

  return {
    type,
    legacyCount: legacyRows.length,
    canonicalCount: canonicalRows.length,
    missingFromCanonical: legacyKeys.filter((key) => !canonicalMap.has(key)),
    extraInCanonical: canonicalKeys.filter((key) => !legacyMap.has(key)),
    orderMatches: legacyRows.map(rowKey).join("||") === canonicalRows.map(rowKey).join("||"),
    fieldDiffs
  };
}

function extractTbodyRows(html, tbodyId) {
  const blockMatch = html.match(new RegExp(`<tbody id="${tbodyId}">([\\s\\S]*?)</tbody>`));
  if (!blockMatch) return [];

  const rows = [];
  const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
  for (const rowMatch of blockMatch[1].matchAll(rowRegex)) {
    const rowHtml = rowMatch[1];
    const cells = [...rowHtml.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => stripTags(match[1]));
    const linkMatch = rowHtml.match(/<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    rows.push({
      date: cells[0] || null,
      url: linkMatch ? linkMatch[1] : null,
      title: linkMatch ? normalizeTitle(stripTags(linkMatch[2])) : null
    });
  }

  return rows;
}

function formatDateFi(dateValue) {
  if (!dateValue) return null;
  return new Intl.DateTimeFormat("fi-FI", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${dateValue}T00:00:00.000Z`));
}

function expectedOpeningRows(items = []) {
  return items.slice(0, OPENING_LIMIT).map((item) => ({
    date: formatDateFi(item.date),
    url: visibleUrl(item),
    title: normalizeTitle(item.title)
  }));
}

function compareOpeningRows(expected = [], actual = []) {
  return {
    expectedCount: expected.length,
    actualCount: actual.length,
    sameRows: JSON.stringify(expected) === JSON.stringify(actual),
    expected,
    actual
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
  const writingsPage = readJson("_site/data/writings-page.json");
  const contentFeed = readJson("_site/data/content.json");
  const publicationsFeed = readJson("_site/data/publications.json");
  const builtHtml = readText("_site/kirjoitukset/index.html");
  const sourceTemplate = readText("src/kirjoitukset.njk");

  const legacyItems = [
    ...toArray(contentFeed.items)
      .filter((item) => item.contentType === "blogPost")
      .map(normalizeLegacyItem),
    ...toArray(publicationsFeed.items)
      .filter((item) => item.contentType === "opinion" || item.contentType === "column")
      .map(normalizeLegacyItem)
  ];

  const canonicalCompatibilityItems = buildFinnishWritingsCompatibilityItems(toArray(writingsPage.items))
    .map(normalizeCanonicalItem);
  const viewModel = buildFinnishWritingsViewModel({ items: toArray(writingsPage.items) });

  const legacyByType = Object.fromEntries(
    TYPE_ORDER.map((type) => [
      type,
      sortByDateDesc(legacyItems.filter((item) => item.contentType === type))
    ])
  );
  const canonicalByType = Object.fromEntries(
    TYPE_ORDER.map((type) => [
      type,
      sortByDateDesc(canonicalCompatibilityItems.filter((item) => item.contentType === type))
    ])
  );

  const parityByType = TYPE_ORDER.map((type) =>
    compareTypeRows(type, legacyByType[type], canonicalByType[type])
  );

  const openingParity = {
    opinion: compareOpeningRows(
      expectedOpeningRows(viewModel.openingOpinionItems),
      extractTbodyRows(builtHtml, TBODY_BY_TYPE.opinion)
    ),
    column: compareOpeningRows(
      expectedOpeningRows(viewModel.openingColumnItems),
      extractTbodyRows(builtHtml, TBODY_BY_TYPE.column)
    ),
    blogPost: compareOpeningRows(
      expectedOpeningRows(viewModel.openingBlogItems),
      extractTbodyRows(builtHtml, TBODY_BY_TYPE.blogPost)
    )
  };

  const clientRuntimeAudit = {
    usesWritingsSourceOnly: [...sourceTemplate.matchAll(/ContentEngine\.query\(\{\s*source:\s*'([^']+)'/g)]
      .every((match) => match[1] === "writings"),
    sourceQueries: [...sourceTemplate.matchAll(/ContentEngine\.query\(\{\s*source:\s*'([^']+)'\s*,\s*filters:\s*\{\s*contentType:\s*'([^']+)'/g)]
      .map((match) => ({ source: match[1], contentType: match[2] })),
    legacyEmbeddedJsonRemoved: !/parseJson\(|pub-data|mielipiteet-data|lausunnot-data|kolumnit-data|aloitteet-data|puheet-data|blog-data/.test(sourceTemplate)
  };

  const report = {
    generatedAt: new Date().toISOString(),
    ok: parityByType.every((entry) =>
      entry.legacyCount === entry.canonicalCount
      && entry.missingFromCanonical.length === 0
      && entry.extraInCanonical.length === 0
      && entry.orderMatches
      && entry.fieldDiffs.length === 0
    )
      && Object.values(openingParity).every((entry) => entry.sameRows)
      && clientRuntimeAudit.usesWritingsSourceOnly
      && clientRuntimeAudit.legacyEmbeddedJsonRemoved,
    compatibilityRule: {
      contentTypes: [...FI_COMPATIBILITY_CONTENT_TYPES],
      note: "FI subset on compatibility projection, ei canonical writings datasetin pysyvä sisältömääritelmä."
    },
    counts: {
      legacyVisibleTotal: legacyItems.length,
      canonicalCompatibilityTotal: canonicalCompatibilityItems.length,
      legacyByType: countByType(legacyItems),
      canonicalByType: countByType(canonicalCompatibilityItems)
    },
    parityByType,
    openingParity,
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

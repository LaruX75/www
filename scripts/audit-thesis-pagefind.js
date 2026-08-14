const fs = require("fs/promises");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");

const loadThesisDetails = require("../src/_data/thesisDetails");

const SITE_ROOT = path.join(process.cwd(), "_site");
const PAGEFIND_DIR = path.join(SITE_ROOT, "pagefind");
const TITLE_SAMPLE_SIZE = Number.parseInt(process.env.THESIS_PAGEFIND_AUDIT_TITLE_SAMPLE_SIZE || "8", 10);
const AUTHOR_SAMPLE_SIZE = Number.parseInt(process.env.THESIS_PAGEFIND_AUDIT_AUTHOR_SAMPLE_SIZE || "4", 10);
const FILTER_SAMPLE_SIZE = Number.parseInt(process.env.THESIS_PAGEFIND_AUDIT_FILTER_SAMPLE_SIZE || "4", 10);
const RESULT_LIMIT = Number.parseInt(process.env.THESIS_PAGEFIND_AUDIT_RESULT_LIMIT || "10", 10);

function classifyResultUrl(url, expectedDetailUrl) {
  if (url === expectedDetailUrl) return "detail";
  if (url === "/opinnaytteet/") return "fi-archive";
  if (url === "/en/theses/") return "en-archive";
  if (url.startsWith("/kategoriat/")) return "fi-category";
  if (url.startsWith("/avainsanat/")) return "fi-keyword";
  if (url.startsWith("/teemat/")) return "fi-theme";
  if (url.startsWith("/en/categories/")) return "en-category";
  if (url.startsWith("/en/keywords/")) return "en-keyword";
  if (url.startsWith("/en/themes/")) return "en-theme";
  return "other";
}

function isAggregateKind(kind) {
  return kind !== "detail" && kind !== "other";
}

async function createPagefindModule() {
  const originalFetch = global.fetch;

  global.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url;

    if (url && url.startsWith("file://")) {
      const body = await fs.readFile(fileURLToPath(url));
      return new Response(body, { status: 200 });
    }

    if (typeof originalFetch === "function") {
      return originalFetch(input, init);
    }

    throw new Error(`Unsupported fetch URL: ${url}`);
  };

  const moduleUrl = pathToFileURL(path.join(PAGEFIND_DIR, "pagefind.js")).href;
  const basePath = `${pathToFileURL(PAGEFIND_DIR).href}${path.sep === "\\" ? "" : "/"}`.replace(/\/+$/, "/");
  const pagefind = await import(moduleUrl);

  return {
    pagefind,
    basePath,
    async destroy() {
      global.fetch = originalFetch;
    }
  };
}

async function createPagefindInstance(pagefind, basePath, language) {
  const instance = pagefind.createInstance({
    basePath,
    baseUrl: "/",
    language,
    noWorker: true
  });
  await instance.init();
  return instance;
}

function pickTitleSample(items) {
  return items
    .filter((item) => item?.title && item?.pageUrl)
    .slice(0, TITLE_SAMPLE_SIZE)
    .map((item) => ({
      id: item.id,
      title: item.title,
      lang: item.lang,
      expectedDetailUrl: item.pageUrl
    }));
}

function pickAuthorSample(items) {
  return items
    .filter((item) => item?.pageUrl && Array.isArray(item?.authors) && item.authors.length)
    .slice(0, AUTHOR_SAMPLE_SIZE)
    .map((item) => {
      const firstAuthor = item.authors[0];
      const surname = String(firstAuthor || "").split(",")[0].trim() || String(firstAuthor || "").trim();
      return {
        id: item.id,
        lang: item.lang,
        title: item.title,
        authorQuery: surname,
        authorLabel: firstAuthor,
        expectedDetailUrl: item.pageUrl
      };
    });
}

function pickFilterSample(items) {
  return items
    .filter((item) => item?.pageUrl && item?.year && item?.thesisType && Array.isArray(item?.categories) && item.categories.length)
    .slice(0, FILTER_SAMPLE_SIZE)
    .map((item) => ({
      id: item.id,
      lang: item.lang,
      title: item.title,
      year: String(item.year),
      thesisType: item.thesisType,
      topic: item.categories[0],
      expectedDetailUrl: item.pageUrl
    }));
}

function buildPlainTitleQuery(title) {
  return String(title || "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function resolveSearchResults(result, expectedDetailUrl) {
  const topResults = [];
  const seenUrls = new Set();

  for (const entry of result.results.slice(0, RESULT_LIMIT)) {
    const data = await entry.data();
    const url = data?.url || "";
    if (!url || seenUrls.has(url)) continue;
    seenUrls.add(url);
    topResults.push({
      url,
      title: data?.meta?.title || data?.title || "",
      kind: classifyResultUrl(url, expectedDetailUrl)
    });
  }

  const detailRankIndex = topResults.findIndex((entry) => entry.url === expectedDetailUrl);
  const detailRank = detailRankIndex >= 0 ? detailRankIndex + 1 : null;
  const aggregateResults = topResults.filter((entry) => isAggregateKind(entry.kind));
  const aggregateAheadOfDetail =
    detailRankIndex >= 0
      ? topResults.slice(0, detailRankIndex).filter((entry) => isAggregateKind(entry.kind)).length
      : aggregateResults.length;

  return {
    totalResults: result.results.length,
    detailFound: detailRank !== null,
    detailRank,
    detailTop1: detailRank === 1,
    aggregateHitsInTopResults: aggregateResults.length,
    aggregateAheadOfDetail,
    topResults
  };
}

async function searchAcrossLanguages(instances, languages, query, filters = {}) {
  const results = await Promise.all(languages.map(async (language) => {
    const instance = instances[language];
    return instance.search(query, { filters });
  }));

  const merged = [];
  results.forEach((result) => merged.push(...result.results.slice(0, RESULT_LIMIT)));
  merged.sort((left, right) => (right.score || 0) - (left.score || 0));
  return {
    results: merged
  };
}

function auditLanguages(entry) {
  return entry.lang === "en" ? ["fi", "en"] : ["fi"];
}

async function runQueryAudit(instances, languages, query, expectedDetailUrl, filters = {}) {
  const result = await searchAcrossLanguages(instances, languages, query, filters);
  return resolveSearchResults(result, expectedDetailUrl);
}

function buildModeSummary(audits) {
  return {
    sampleSize: audits.length,
    detailFoundCount: audits.filter((entry) => entry.audit.detailFound).length,
    detailTop1Count: audits.filter((entry) => entry.audit.detailTop1).length,
    detailTop3Count: audits.filter((entry) => entry.audit.detailRank && entry.audit.detailRank <= 3).length,
    withAggregateCompetitionCount: audits.filter((entry) => entry.audit.aggregateHitsInTopResults > 0).length,
    withAggregateAheadOfDetailCount: audits.filter((entry) => entry.audit.aggregateAheadOfDetail > 0).length
  };
}

async function main() {
  const model = await loadThesisDetails();
  const titleSample = pickTitleSample(model.items);
  const authorSample = pickAuthorSample(model.items);
  const filterSample = pickFilterSample(model.items);

  if (!titleSample.length) {
    throw new Error("No thesis detail items found for Pagefind audit");
  }

  const { pagefind, basePath, destroy } = await createPagefindModule();
  const fiInstance = await createPagefindInstance(pagefind, basePath, "fi");
  const enInstance = await createPagefindInstance(pagefind, basePath, "en");
  const instances = { fi: fiInstance, en: enInstance };

  try {
    const titleAudits = [];
    const authorAudits = [];
    const filterAudits = [];

    for (const thesis of titleSample) {
      const plainTitleQuery = buildPlainTitleQuery(thesis.title);
      titleAudits.push({
        ...thesis,
        plainTitleQuery,
        audit: await runQueryAudit(instances, auditLanguages(thesis), plainTitleQuery, thesis.expectedDetailUrl)
      });
    }

    for (const thesis of authorSample) {
      authorAudits.push({
        ...thesis,
        audit: await runQueryAudit(instances, auditLanguages(thesis), thesis.authorQuery, thesis.expectedDetailUrl)
      });
    }

    for (const thesis of filterSample) {
      filterAudits.push({
        ...thesis,
        audit: await runQueryAudit(
          instances,
          ["fi", "en"],
          "__find_explore_theses__",
          thesis.expectedDetailUrl,
          {
            FindExplore: "theses",
            "Theses type": thesis.thesisType,
            "Theses year": thesis.year,
            "Theses topic": thesis.topic
          }
        )
      });
    }

    const report = {
      summary: {
        titles: buildModeSummary(titleAudits),
        authors: buildModeSummary(authorAudits),
        filterOnly: buildModeSummary(filterAudits)
      },
      titles: titleAudits,
      authors: authorAudits,
      filterOnly: filterAudits
    };

    console.log(JSON.stringify(report, null, 2));

    const ok = report.summary.titles.detailFoundCount === report.summary.titles.sampleSize
      && report.summary.authors.detailFoundCount === report.summary.authors.sampleSize
      && report.summary.filterOnly.detailFoundCount === report.summary.filterOnly.sampleSize;
    if (!ok) process.exitCode = 1;
  } finally {
    await fiInstance.destroy();
    await enInstance.destroy();
    await destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

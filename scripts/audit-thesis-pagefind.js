const fs = require("fs/promises");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");

const loadThesisDetails = require("../src/_data/thesisDetails");

const SITE_ROOT = path.join(process.cwd(), "_site");
const PAGEFIND_DIR = path.join(SITE_ROOT, "pagefind");
const SAMPLE_SIZE = Number.parseInt(process.env.THESIS_PAGEFIND_AUDIT_SAMPLE_SIZE || "8", 10);
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

async function createPagefindInstance() {
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
  const instance = pagefind.createInstance({
    basePath,
    baseUrl: "/",
    language: "fi",
    noWorker: true
  });

  await instance.init();

  return {
    instance,
    async destroy() {
      await instance.destroy();
      global.fetch = originalFetch;
    }
  };
}

function pickAuditSample(items) {
  return items
    .filter((item) => item?.title && item?.pageUrl)
    .slice(0, SAMPLE_SIZE)
    .map((item) => ({
      id: item.id,
      title: item.title,
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

  for (const entry of result.results.slice(0, RESULT_LIMIT)) {
    const data = await entry.data();
    const url = data?.url || "";
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

async function runQueryAudit(instance, query, expectedDetailUrl) {
  const result = await instance.search(query);
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
  const sample = pickAuditSample(model.items);

  if (!sample.length) {
    throw new Error("No thesis detail items found for Pagefind audit");
  }

  const { instance, destroy } = await createPagefindInstance();

  try {
    const audits = [];

    for (const thesis of sample) {
      const plainTitleQuery = buildPlainTitleQuery(thesis.title);
      audits.push({
        ...thesis,
        plainTitleQuery,
        audit: await runQueryAudit(instance, plainTitleQuery, thesis.expectedDetailUrl)
      });
    }

    console.log(JSON.stringify({
      summary: buildModeSummary(audits),
      audits
    }, null, 2));
  } finally {
    await destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

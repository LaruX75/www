const fs = require("fs/promises");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");

const SITE_ROOT = path.join(process.cwd(), "_site");
const PAGEFIND_DIR = path.join(SITE_ROOT, "pagefind");
const PUBLICATIONS_PAGE_JSON = path.join(SITE_ROOT, "data", "publications-page.json");
const SAMPLE_SIZE = Number.parseInt(process.env.PUBLICATION_PAGEFIND_AUDIT_SAMPLE_SIZE || "8", 10);
const RESULT_LIMIT = Number.parseInt(process.env.PUBLICATION_PAGEFIND_AUDIT_RESULT_LIMIT || "10", 10);

function classifyResultUrl(url, expectedDetailUrl) {
  if (url === expectedDetailUrl) return "detail";
  if (url === "/julkaisut/") return "fi-archive";
  if (url === "/en/publications/") return "en-archive";
  if (url === "/en/scientific-publications/") return "en-legacy";
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

async function loadPublicationItems() {
  const raw = await fs.readFile(PUBLICATIONS_PAGE_JSON, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed.items) ? parsed.items : [];
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
    .filter((item) => item?.sourceKey === "researchfi" && typeof item?.title === "string" && item?.pageUrl)
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

function buildModeSummary(audits, field) {
  return {
    sampleSize: audits.length,
    detailFoundCount: audits.filter((entry) => entry[field].detailFound).length,
    detailTop1Count: audits.filter((entry) => entry[field].detailTop1).length,
    detailTop3Count: audits.filter((entry) => entry[field].detailRank && entry[field].detailRank <= 3).length,
    withAggregateCompetitionCount: audits.filter((entry) => entry[field].aggregateHitsInTopResults > 0).length,
    withAggregateAheadOfDetailCount: audits.filter((entry) => entry[field].aggregateAheadOfDetail > 0).length,
    enLegacyCompetitionCount: audits.filter((entry) => entry[field].topResults.some((result) => result.kind === "en-legacy")).length
  };
}

async function main() {
  const items = await loadPublicationItems();
  const sample = pickAuditSample(items);

  if (!sample.length) {
    throw new Error("No Research.fi publication items found in _site/data/publications-page.json");
  }

  const { instance, destroy } = await createPagefindInstance();

  try {
    const audits = [];

    for (const publication of sample) {
      audits.push({
        ...publication,
        exactTitleQuery: `\"${publication.title}\"`,
        plainTitleQuery: buildPlainTitleQuery(publication.title),
        exactTitleAudit: await runQueryAudit(instance, `\"${publication.title}\"`, publication.expectedDetailUrl),
        plainTitleAudit: await runQueryAudit(instance, buildPlainTitleQuery(publication.title), publication.expectedDetailUrl)
      });
    }

    const summary = {
      exactTitleAudit: buildModeSummary(audits, "exactTitleAudit"),
      plainTitleAudit: buildModeSummary(audits, "plainTitleAudit")
    };

    console.log(JSON.stringify({ summary, audits }, null, 2));
  } finally {
    await destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

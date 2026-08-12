const fs = require("fs/promises");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");

const SITE_ROOT = path.join(process.cwd(), "_site");
const PAGEFIND_DIR = path.join(SITE_ROOT, "pagefind");
const WRITINGS_PAGE_JSON = path.join(SITE_ROOT, "data", "writings-page.json");
const RESULT_LIMIT = Number.parseInt(process.env.WRITINGS_PAGEFIND_AUDIT_RESULT_LIMIT || "10", 10);

const FI_TYPES = ["opinion", "column", "blogPost"];
const EN_TYPES = ["statement", "opinion", "column", "initiative", "speech", "blogPost", "scientificPublication"];

async function loadWritingsItems() {
  const raw = await fs.readFile(WRITINGS_PAGE_JSON, "utf8");
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

function buildPlainTitleQuery(title) {
  return String(title || "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function pickTypeSamples(items, types) {
  return types
    .map((contentType) => items.find((item) => item?.contentType === contentType && item?.title && item?.pageUrl))
    .filter(Boolean)
    .map((item) => ({
      id: item.id,
      contentType: item.contentType,
      title: item.title,
      expectedUrl: item.pageUrl,
      query: buildPlainTitleQuery(item.title),
      year: item.year ? String(item.year) : ""
    }));
}

async function resolveResults(result, expectedUrl) {
  const topResults = [];
  for (const entry of result.results.slice(0, RESULT_LIMIT)) {
    const data = await entry.data();
    topResults.push({
      url: data?.url || "",
      title: data?.meta?.title || data?.title || ""
    });
  }
  const rankIndex = topResults.findIndex((entry) => entry.url === expectedUrl);
  return {
    totalResults: result.results.length,
    found: rankIndex >= 0,
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    returnedUrl: rankIndex >= 0 ? topResults[rankIndex].url : (topResults[0]?.url || null),
    topResults
  };
}

async function auditSample(instance, sample, scope) {
  const filters = {
    Kieli: "Suomi",
    FindExplore: "writings",
    "Writings scope": scope,
    "Writings content type": sample.contentType
  };
  const result = await instance.search(sample.query, { filters });
  return {
    ...sample,
    scope,
    filters,
    ...(await resolveResults(result, sample.expectedUrl))
  };
}

async function auditTopic(instance, query, scope) {
  const result = await instance.search(query, {
    filters: {
      Kieli: "Suomi",
      FindExplore: "writings",
      "Writings scope": scope
    }
  });
  const topResults = [];
  for (const entry of result.results.slice(0, RESULT_LIMIT)) {
    const data = await entry.data();
    topResults.push({
      url: data?.url || "",
      title: data?.meta?.title || data?.title || ""
    });
  }
  return {
    query,
    scope,
    totalResults: result.results.length,
    found: result.results.length > 0,
    topResults
  };
}

function summary(audits) {
  return {
    sampleSize: audits.length,
    foundCount: audits.filter((entry) => entry.found).length,
    top1Count: audits.filter((entry) => entry.rank === 1).length,
    top3Count: audits.filter((entry) => entry.rank && entry.rank <= 3).length
  };
}

async function main() {
  const items = await loadWritingsItems();
  const fiSamples = pickTypeSamples(items.filter((item) => FI_TYPES.includes(item.contentType)), FI_TYPES);
  const enSamples = pickTypeSamples(items, EN_TYPES);
  const { instance, destroy } = await createPagefindInstance();

  try {
    const fi = [];
    for (const sample of fiSamples) fi.push(await auditSample(instance, sample, "fi"));

    const en = [];
    for (const sample of enSamples) en.push(await auditSample(instance, sample, "en"));

    const topics = [
      await auditTopic(instance, "tekoäly", "fi"),
      await auditTopic(instance, "kampus", "fi"),
      await auditTopic(instance, "tekoäly", "en"),
      await auditTopic(instance, "council", "en")
    ];

    const report = {
      summary: {
        fi: summary(fi),
        en: summary(en),
        topics: {
          sampleSize: topics.length,
          foundCount: topics.filter((entry) => entry.found).length
        }
      },
      fi,
      en,
      topics
    };

    console.log(JSON.stringify(report, null, 2));

    if (report.summary.fi.foundCount !== report.summary.fi.sampleSize || report.summary.en.foundCount !== report.summary.en.sampleSize) {
      process.exitCode = 1;
    }
  } finally {
    await destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

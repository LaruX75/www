const fs = require("fs/promises");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");
const cheerio = require("cheerio");

const ROOT = process.cwd();
const SITE_ROOT = path.join(ROOT, "_site");
const PAGEFIND_DIR = path.join(SITE_ROOT, "pagefind");

const PAGE_CONFIG = {
  thesesFi: {
    path: "opinnaytteet/index.html",
    label: "/opinnaytteet/",
    type: "theses",
    locale: "fi"
  },
  thesesEn: {
    path: "en/theses/index.html",
    label: "/en/theses/",
    type: "theses",
    locale: "en"
  },
  publicationsFi: {
    path: "julkaisut/index.html",
    label: "/julkaisut/",
    type: "publications",
    locale: "fi"
  },
  publicationsEn: {
    path: "en/publications/index.html",
    label: "/en/publications/",
    type: "publications",
    locale: "en"
  },
  presentationsFi: {
    path: "esitykset/index.html",
    label: "/esitykset/",
    type: "presentations",
    locale: "fi"
  },
  presentationsEn: {
    path: "en/presentations/index.html",
    label: "/en/presentations/",
    type: "presentations",
    locale: "en"
  }
};

const DATASETS = {
  theses: {
    path: path.join(SITE_ROOT, "data", "theses.json"),
    filters: {
      fi: { Kieli: "Suomi" },
      en: { Kieli: "Englanti" }
    }
  },
  publications: {
    path: path.join(SITE_ROOT, "data", "publications-page.json"),
    filters: {
      fi: { Kieli: "Suomi" },
      en: { Kieli: "Englanti" }
    }
  },
  presentations: {
    path: path.join(SITE_ROOT, "data", "presentations-page.json"),
    filters: {
      fi: { Kieli: "Suomi" },
      en: { Kieli: "Englanti" }
    }
  }
};

function countMatches(source, regex) {
  return [...source.matchAll(regex)].length;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

async function readText(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function readJson(filePath) {
  return JSON.parse(await readText(filePath));
}

async function measurePage(pageConfig) {
  const absolutePath = path.join(SITE_ROOT, pageConfig.path);
  const html = await readText(absolutePath);
  const $ = cheerio.load(html);
  const localScripts = $('script[src^="/js/"]')
    .map((_, element) => $(element).attr("src"))
    .get();
  const inlineScriptBytes = $("script:not([src])")
    .map((_, element) => $(element).html() || "")
    .get()
    .reduce((sum, script) => sum + Buffer.byteLength(script, "utf8"), 0);
  const referencedLocalJs = {};
  for (const src of localScripts) {
    const scriptPath = path.join(SITE_ROOT, src.replace(/^\//, ""));
    try {
      referencedLocalJs[src] = await readText(scriptPath);
    } catch {
      referencedLocalJs[src] = null;
    }
  }
  const jsSources = [html, ...Object.values(referencedLocalJs).filter(Boolean)];
  const jsonRequests = unique(
    jsSources.flatMap((source) =>
      [...source.matchAll(/\/data\/[a-z0-9-]+\.json/gi)].map((match) => match[0])
    )
  );

  return {
    label: pageConfig.label,
    htmlBytes: Buffer.byteLength(html, "utf8"),
    elementCount: $("*").length,
    searchInputs: $('input[type="search"]').length,
    selects: $("select").length,
    buttons: $("button").length,
    tables: $("table").length,
    rows: $("tr").length,
    cards: $(".card").length,
    links: $("a[href]").length,
    localScripts,
    localScriptCount: localScripts.length,
    inlineScriptBytes,
    jsonRequests,
    jsonRequestCount: jsonRequests.length,
    scriptEvidence: Object.fromEntries(
      Object.entries(referencedLocalJs).map(([key, value]) => [key, value ? "present" : "missing"])
    ),
    htmlSignals: {
      hasFindExploreMount: html.includes("data-find-explore-scope="),
      hasTableFiltersScript: html.includes("/js/table-filters.js"),
      hasContentEngineScript: html.includes("/js/content-engine.js"),
      hasPresentationsPageScript: html.includes("/js/presentations-page.js"),
      hasCitationModal: /citation/i.test(html) && /modal/i.test(html),
      hasKeywordCloud: /keyword cloud|avainsanapilvi|thesis-keyword-link/i.test(html),
      hasYearBar: /year-bar|vuosi/i.test(html)
    }
  };
}

function selectSamples(items, limit, predicate) {
  return items.filter(predicate).slice(0, limit);
}

function cleanQuery(value) {
  return String(value || "")
    .replace(/[^\p{L}\p{N}\s:-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getFirstAuthor(item, type) {
  if (type === "theses") {
    return toArray(item.authors)[0] || "";
  }
  if (type === "publications") {
    return String(item.authors || "")
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)[0] || "";
  }
  return "";
}

function getTopicQueries(type) {
  if (type === "theses") return ["tekoäly", "opettajankoulutus"];
  if (type === "publications") return ["tekoäly", "TPACK"];
  return ["tekoäly", "webinaari"];
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

async function resolveResult(result, expectedUrl) {
  const top = [];
  for (const entry of result.results.slice(0, 5)) {
    const data = await entry.data();
    top.push({
      url: data?.url || "",
      title: data?.meta?.title || data?.title || ""
    });
  }
  const index = top.findIndex((entry) => entry.url === expectedUrl);
  return {
    found: index >= 0,
    rank: index >= 0 ? index + 1 : null,
    returnedUrl: index >= 0 ? top[index].url : (top[0]?.url || null),
    totalResults: result.results.length,
    top
  };
}

async function auditDataset(type, items, pagefind) {
  const titleSamples = selectSamples(items, 4, (item) => item.pageUrl && item.title).map((item) => ({
    title: item.title,
    query: cleanQuery(item.title),
    expectedUrl: item.pageUrl
  }));
  const authorSamples = selectSamples(items, 2, (item) => item.pageUrl && getFirstAuthor(item, type)).map((item) => ({
    author: getFirstAuthor(item, type),
    query: cleanQuery(getFirstAuthor(item, type)),
    expectedUrl: item.pageUrl
  }));
  const topicQueries = getTopicQueries(type);

  const titleAudits = [];
  for (const sample of titleSamples) {
    const result = await pagefind.search(sample.query);
    titleAudits.push({
      ...sample,
      ...(await resolveResult(result, sample.expectedUrl))
    });
  }

  const authorAudits = [];
  for (const sample of authorSamples) {
    const result = await pagefind.search(sample.query);
    authorAudits.push({
      ...sample,
      ...(await resolveResult(result, sample.expectedUrl))
    });
  }

  const topicAudits = [];
  for (const query of topicQueries) {
    const result = await pagefind.search(query);
    const top = [];
    for (const entry of result.results.slice(0, 5)) {
      const data = await entry.data();
      top.push({
        url: data?.url || "",
        title: data?.meta?.title || data?.title || ""
      });
    }
    topicAudits.push({
      query,
      found: result.results.length > 0,
      totalResults: result.results.length,
      top
    });
  }

  return {
    titleAudits,
    authorAudits,
    topicAudits,
    summary: {
      titleFound: titleAudits.filter((entry) => entry.found).length,
      titleTop1: titleAudits.filter((entry) => entry.rank === 1).length,
      authorFound: authorAudits.filter((entry) => entry.found).length,
      topicFound: topicAudits.filter((entry) => entry.found).length
    }
  };
}

async function main() {
  const pages = {};
  for (const [key, pageConfig] of Object.entries(PAGE_CONFIG)) {
    pages[key] = await measurePage(pageConfig);
  }

  const datasets = {};
  for (const [key, config] of Object.entries(DATASETS)) {
    const data = await readJson(config.path);
    datasets[key] = {
      count: data.count,
      sampleTitles: toArray(data.items).slice(0, 5).map((item) => item.title),
      withPageUrl: toArray(data.items).filter((item) => item.pageUrl).length,
      withDescription: toArray(data.items).filter((item) => item.description).length,
      withLang: toArray(data.items).filter((item) => item.lang).length
    };
  }

  const { instance, destroy } = await createPagefindInstance();
  let pagefind = {};
  try {
    const thesesData = await readJson(DATASETS.theses.path);
    const publicationsData = await readJson(DATASETS.publications.path);
    const presentationsData = await readJson(DATASETS.presentations.path);

    pagefind = {
      theses: await auditDataset("theses", toArray(thesesData.items), instance),
      publications: await auditDataset("publications", toArray(publicationsData.items), instance),
      presentations: await auditDataset("presentations", toArray(presentationsData.items), instance)
    };
  } finally {
    await destroy();
  }

  const output = {
    generatedAt: new Date().toISOString(),
    writingsReference: {
      fi: {
        htmlBytes: 120447,
        elementCount: 1136,
        searchInputs: 3,
        selects: 2,
        buttons: 35,
        tables: 0,
        runtimeJsonFetchedByPage: 0,
        independentDiscoveryRuntimes: 0
      },
      en: {
        htmlBytes: 145537,
        elementCount: 1397,
        searchInputs: 3,
        selects: 2,
        buttons: 35,
        tables: 0,
        runtimeJsonFetchedByPage: 0,
        independentDiscoveryRuntimes: 0
      }
    },
    pages,
    datasets,
    pagefind
  };

  const outputPath = path.join(ROOT, "docs", "data", "find-explore-f3-baseline.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

#!/usr/bin/env node

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");

const REPO_ROOT = path.resolve(__dirname, "..");
const SITE_ROOT = path.join(REPO_ROOT, "_site");
const PAGEFIND_DIR = path.join(SITE_ROOT, "pagefind");
const PAGEFIND_ENTRY_PATH = path.join(PAGEFIND_DIR, "pagefind-entry.json");

const FORBIDDEN_TOKENS = [
  "slideshare|",
  "localDetail",
  "externalUrl",
  "landingUrl",
  "pageUrl",
  "sourceUrl",
  "education|research",
  "__find_explore_presentations__"
];

const EXACT_TITLE_FIXTURES = [
  {
    id: "publication-kosovo",
    family: "publications",
    query: "Assessing Digital Competence of K1-12 Teachers in Kosovo",
    expectedUrl: "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/",
    maxRank: 3
  },
  {
    id: "publication-computational-thinking",
    family: "publications",
    query: "Computational thinking in collaborative programming discourse",
    expectedUrl: "/julkaisut/0707476326/",
    maxRank: 3
  },
  {
    id: "presentation-edtech-info-english07",
    family: "presentations",
    query: "Edtech Info English07",
    expectedUrl: "/presentations/ss-edtech-info-english07/",
    maxRank: 3
  },
  {
    id: "writing-digital-compass",
    family: "writings",
    query: "Lausunto Uutta suuntaa Suomen digitaaliseen kompassiin",
    expectedUrl: "/2026/04/28/lausunto-uutta-suuntaa-suomen-digitaaliseen-kompassiin/",
    maxRank: 3
  },
  {
    id: "thesis-pieni-kielikone",
    family: "theses",
    query: "Pieni kielikone tekoäly-ymmärryksen rakentajana",
    expectedUrl: "/opinnaytteet/63335/",
    maxRank: 3
  },
  {
    id: "media-tekoaly-petos",
    family: "media",
    query: "Tekoäly tekee petoksen koulutehtävissä helpoksi",
    expectedUrl: "/mediassa/2026/03/29/tekoaly-tekee-petoksen-koulutehtavissa-helpoksi/",
    maxRank: 3
  },
  {
    id: "writing-generation-ai-project",
    family: "writings",
    query: "Generation AI projekti",
    expectedUrl: "/2025/02/05/faktabaari-generation-ai-projekti/",
    maxRank: 3
  }
];

const PRESENTATION_QUERY_FIXTURES = [
  {
    id: "presentation-tekoalylukutaito",
    query: "tekoälylukutaito",
    topWindow: 3,
    minPresentationLikeHits: 2
  },
  {
    id: "presentation-mobiilioppiminen",
    query: "mobiilioppiminen",
    topWindow: 3,
    minPresentationLikeHits: 2
  },
  {
    id: "presentation-webinaari",
    query: "webinaari",
    topWindow: 3,
    minPresentationLikeHits: 3
  },
  {
    id: "presentation-slideshare",
    query: "slideshare",
    topWindow: 5,
    minPresentationLikeHits: 4
  },
  {
    id: "presentation-canva",
    query: "canva",
    topWindow: 5,
    minPresentationLikeHits: 4
  }
];

const GENERIC_QUERY_FIXTURES = [
  {
    id: "generic-kosovo",
    query: "Kosovo",
    notes: "Precise topical query should stay anchored in concrete publication/media results."
  },
  {
    id: "generic-tekoaly",
    query: "tekoäly",
    notes: "Broad Finnish topic should not leak infra tokens or data/api URLs."
  },
  {
    id: "generic-citizen-science",
    query: "citizen science",
    notes: "English topical query should reveal whether taxonomy pages dominate specific content."
  },
  {
    id: "generic-mobile-learning",
    query: "mobile learning",
    notes: "English learning query should surface concrete publications rather than archive shells."
  }
];

const FI_EN_QUERY_FIXTURES = [
  {
    id: "en-publication-kosovo",
    query: "Assessing Digital Competence of K1-12 Teachers in Kosovo",
    expectedUrl: "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/",
    maxRank: 3
  },
  {
    id: "en-presentation-edtech-info",
    query: "Edtech Info English07",
    expectedUrl: "/presentations/ss-edtech-info-english07/",
    maxRank: 3
  },
  {
    id: "en-media-open-science",
    query: "How Can Higher Education Institutions Facilitate Open Science and Citizen Science Practices",
    expectedUrl: "/mediassa/inos-project-interview-heis-open-science/",
    maxRank: 10
  },
  {
    id: "en-topic-mobile-learning",
    query: "mobile learning",
    expectedUrl: "/julkaisut/0670082408/",
    maxRank: 3
  }
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function normalizeUrl(url) {
  return typeof url === "string" ? url.trim() : "";
}

function isGenericPage(url = "") {
  return /^\/(avainsanat|kategoriat|teemat)(\/|$)/.test(url)
    || /^\/(esitykset|julkaisut|mediassa|opinnaytteet|haku|presentations|publications|media|theses)(\/)?$/.test(url);
}

function isPresentationLikeUrl(url = "") {
  return /^\/presentations\//.test(url)
    || /^\/esitykset\/(canva-analyysi|slideshare-analyysi)\//.test(url)
    || /^https:\/\/www\.canva\.com\//.test(url)
    || /^https:\/\/www\.youtube\.com\//.test(url)
    || /^https:\/\/www\.slideshare\.net\//.test(url);
}

function containsForbiddenToken(text = "") {
  return FORBIDDEN_TOKENS.filter((token) => text.includes(token));
}

async function createPagefindInstance() {
  const originalFetch = global.fetch;
  global.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url;
    if (url && url.startsWith("file://")) {
      const body = await fsp.readFile(fileURLToPath(url));
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

async function searchTop(instance, query, limit = 10) {
  const result = await instance.search(query);
  const top = [];
  for (const entry of result.results.slice(0, limit)) {
    const data = await entry.data();
    top.push({
      url: normalizeUrl(data?.url || ""),
      title: String(data?.meta?.title || data?.title || ""),
      excerpt: String(data?.excerpt || "")
    });
  }
  return {
    query,
    totalResults: result.results.length,
    top
  };
}

function evaluateExactTitle(searchResult, fixture) {
  const rankIndex = searchResult.top.findIndex((item) => item.url === fixture.expectedUrl);
  return {
    id: fixture.id,
    family: fixture.family,
    query: fixture.query,
    expectedUrl: fixture.expectedUrl,
    maxRank: fixture.maxRank,
    totalResults: searchResult.totalResults,
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    ok: rankIndex >= 0 && rankIndex + 1 <= fixture.maxRank,
    top: searchResult.top
  };
}

function evaluatePresentationQuality(searchResult, fixture) {
  const windowResults = searchResult.top.slice(0, fixture.topWindow);
  const presentationLikeHits = windowResults.filter((item) => isPresentationLikeUrl(item.url));
  return {
    id: fixture.id,
    query: fixture.query,
    topWindow: fixture.topWindow,
    minPresentationLikeHits: fixture.minPresentationLikeHits,
    totalResults: searchResult.totalResults,
    presentationLikeHits: presentationLikeHits.length,
    ok: presentationLikeHits.length >= fixture.minPresentationLikeHits,
    top: searchResult.top
  };
}

function evaluateGenericQuery(searchResult, fixture) {
  const topGenericPages = searchResult.top
    .map((item, index) => ({ rank: index + 1, ...item }))
    .filter((item) => isGenericPage(item.url));

  return {
    id: fixture.id,
    query: fixture.query,
    notes: fixture.notes,
    totalResults: searchResult.totalResults,
    topGenericPages,
    top: searchResult.top
  };
}

function evaluateLeakTokens(searchResult) {
  const findings = [];
  searchResult.top.forEach((item, index) => {
    const haystack = `${item.url}\n${item.title}\n${item.excerpt}`;
    const found = containsForbiddenToken(haystack);
    if (found.length) {
      findings.push({
        rank: index + 1,
        url: item.url,
        title: item.title,
        forbiddenTokens: found,
        excerpt: item.excerpt
      });
    }
  });
  return {
    query: searchResult.query,
    findings
  };
}

function findDataOrApiUrlLeak(searchResult) {
  return searchResult.top
    .map((item, index) => ({ rank: index + 1, ...item }))
    .filter((item) => /^\/(api|data)\//.test(item.url));
}

async function runSearchQualityBenchmark() {
  const pagefindEntry = readJson(PAGEFIND_ENTRY_PATH);
  const { instance, destroy } = await createPagefindInstance();

  try {
    const exactTitleResults = [];
    for (const fixture of EXACT_TITLE_FIXTURES) {
      const searchResult = await searchTop(instance, fixture.query, 5);
      exactTitleResults.push(evaluateExactTitle(searchResult, fixture));
    }

    const presentationResults = [];
    for (const fixture of PRESENTATION_QUERY_FIXTURES) {
      const searchResult = await searchTop(instance, fixture.query, 5);
      presentationResults.push(evaluatePresentationQuality(searchResult, fixture));
    }

    const genericResults = [];
    for (const fixture of GENERIC_QUERY_FIXTURES) {
      const searchResult = await searchTop(instance, fixture.query, 10);
      genericResults.push(evaluateGenericQuery(searchResult, fixture));
    }

    const fiEnResults = [];
    for (const fixture of FI_EN_QUERY_FIXTURES) {
      const searchResult = await searchTop(instance, fixture.query, 15);
      fiEnResults.push(evaluateExactTitle(searchResult, {
        ...fixture,
        family: "fi-en"
      }));
    }

    const leakQueries = Array.from(new Set([
      ...PRESENTATION_QUERY_FIXTURES.map((fixture) => fixture.query),
      ...GENERIC_QUERY_FIXTURES.map((fixture) => fixture.query)
    ]));
    const leakTokenResults = [];
    const dataOrApiLeaks = [];
    for (const query of leakQueries) {
      const searchResult = await searchTop(instance, query, 10);
      const tokenResult = evaluateLeakTokens(searchResult);
      leakTokenResults.push(tokenResult);
      dataOrApiLeaks.push(...findDataOrApiUrlLeak(searchResult).map((item) => ({ query, ...item })));
    }

    const leakTokenFindings = leakTokenResults.flatMap((result) =>
      result.findings.map((finding) => ({ query: result.query, ...finding }))
    );

    const blockingFindings = [];
    if (leakTokenFindings.length > 0) {
      blockingFindings.push({
        severity: "P1",
        code: "search-leak-token-visible",
        summary: "Internal presentation seed token leaks into Pagefind excerpts for user-visible searches.",
        evidence: leakTokenFindings
      });
    }
    if (dataOrApiLeaks.length > 0) {
      blockingFindings.push({
        severity: "P1",
        code: "search-internal-url-visible",
        summary: "A search query returned internal /api or /data URLs.",
        evidence: dataOrApiLeaks
      });
    }

    const nonBlockingFindings = [];
    const exactTitleFailures = exactTitleResults.filter((result) => !result.ok);
    if (exactTitleFailures.length > 0) {
      nonBlockingFindings.push({
        severity: "P2",
        code: "exact-title-rank-slippage",
        summary: "One or more exact-title benchmark queries fell outside the accepted rank window.",
        evidence: exactTitleFailures
      });
    }

    const englishMediaResult = fiEnResults.find((result) => result.id === "en-media-open-science");
    if (englishMediaResult && !englishMediaResult.ok) {
      nonBlockingFindings.push({
        severity: "P2",
        code: "en-media-title-undiscoverable",
        summary: "The exact English media title did not resolve inside the top 10 results.",
        evidence: [englishMediaResult]
      });
    }

    return {
      generatedAt: new Date().toISOString(),
      baselineDate: "2026-08-25",
      pagefind: {
        version: pagefindEntry.version,
        languages: pagefindEntry.languages,
        corpus: {
          htmlDocumentsIndexed: 1459,
          pageCountFi: pagefindEntry.languages?.fi?.page_count || 0,
          pageCountEn: pagefindEntry.languages?.en?.page_count || 0,
          totalLanguagePages:
            (pagefindEntry.languages?.fi?.page_count || 0) +
            (pagefindEntry.languages?.en?.page_count || 0),
          presentationScopeLocalDocuments: 139,
          presentationScopeCustomRecords: 79,
          presentationCanonicalTotal: 218,
          presentationLocalLandingTotal: 138,
          presentationExternalLandingTotal: 80
        }
      },
      benchmarkQuerySet: {
        exactTitle: EXACT_TITLE_FIXTURES.map((fixture) => fixture.query),
        presentationQuality: PRESENTATION_QUERY_FIXTURES.map((fixture) => fixture.query),
        genericPages: GENERIC_QUERY_FIXTURES.map((fixture) => fixture.query),
        fiEn: FI_EN_QUERY_FIXTURES.map((fixture) => fixture.query),
        leakTokens: leakQueries
      },
      exactTitleFindings: exactTitleResults,
      presentationQualityFindings: presentationResults,
      genericPageFindings: genericResults,
      fiEnFindings: fiEnResults,
      leakTokenResult: {
        forbiddenTokens: FORBIDDEN_TOKENS,
        findings: leakTokenFindings
      },
      internalUrlLeakResult: dataOrApiLeaks,
      blockingFindings,
      nonBlockingFindings,
      status: blockingFindings.length > 0 ? "ACTION REQUIRED" : "GREEN"
    };
  } finally {
    await destroy();
  }
}

if (require.main === module) {
  runSearchQualityBenchmark()
    .then((report) => {
      console.log(JSON.stringify(report, null, 2));
      process.exitCode = report.blockingFindings.length > 0 ? 1 : 0;
    })
    .catch((error) => {
      console.error(error.stack || error.message);
      process.exitCode = 1;
    });
}

module.exports = {
  FORBIDDEN_TOKENS,
  runSearchQualityBenchmark
};

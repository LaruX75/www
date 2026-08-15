const fs = require("fs");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");
const { getPresentationResearchPresets } = require("../src/_data/presentationResearchTopics");

const ROOT = process.cwd();
const BASELINE_ROOT = process.env.F4_BASELINE_SITE || "";
const PAGEFIND_DIR = path.join(ROOT, "_site", "pagefind");
const RESEARCH_SCOPE_TYPES = ["publications", "theses", "writings", "presentations"];
const PRESENTATION_RESEARCH_TOPIC_PRESETS = Object.freeze({
  "tekoäly": "ai-literacy",
  "opettajankoulutus": "teacher-education",
  "koulutusteknologia": "long-term-learning",
  "yhteisöllinen oppiminen": "long-term-learning",
  "ohjelmoinnillinen ajattelu": "teacher-education"
});

function readTextFrom(root, relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readText(relativePath) {
  return readTextFrom(ROOT, relativePath);
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function count(source, regex) {
  return [...source.matchAll(regex)].length;
}

function collectJsonRefs(html) {
  return [...new Set([...html.matchAll(/\/data\/[a-z0-9-]+\.json/gi)].map((match) => match[0]))].sort();
}

function collectLocalScripts(html) {
  return [...new Set(
    [...html.matchAll(/<script[^>]+src="([^"]+)"/gi)]
      .map((match) => match[1])
      .filter((value) => value.startsWith("/js/"))
  )];
}

function inlineScriptBytes(html) {
  return [...html.matchAll(/<script\b(?![^>]+src=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .reduce((sum, match) => sum + Buffer.byteLength(match[1] || "", "utf8"), 0);
}

function localScriptBytes(localScripts, root = ROOT) {
  return localScripts.reduce((sum, src) => {
    const cleanSrc = src.split("?")[0].replace(/^\//, "");
    const filePath = path.join(root, "_site", cleanSrc);
    if (!fs.existsSync(filePath)) return sum;
    return sum + fs.statSync(filePath).size;
  }, 0);
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function hasContext(item, context) {
  return toArray(item?.contexts).includes(context);
}

function countBy(items, getKey) {
  const counts = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!key) return;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return Object.fromEntries([...counts.entries()].sort((left, right) => left[0].localeCompare(right[0], "fi")));
}

function metrics(html, root = ROOT) {
  const localScripts = collectLocalScripts(html);
  return {
    htmlBytes: Buffer.byteLength(html, "utf8"),
    elementCount: count(html, /<([a-z][a-z0-9-]*)(?:\s|>)/gi),
    searchInputs: count(html, /<input\b[^>]*type="search"/gi),
    selects: count(html, /<select\b/gi),
    buttons: count(html, /<button\b/gi),
    localScripts,
    localScriptCount: localScripts.length,
    localScriptBytes: localScriptBytes(localScripts, root),
    inlineScriptBytes: inlineScriptBytes(html),
    jsonRefs: collectJsonRefs(html),
    jsonRefCount: collectJsonRefs(html).length,
    findExploreMounts: count(html, /data-find-explore\b/gi)
  };
}

function withDelta(current, baseline) {
  if (!baseline) return null;
  return { current, baseline, delta: current - baseline };
}

function buildDelta(current, baseline) {
  if (!baseline) return null;
  return {
    htmlBytes: withDelta(current.htmlBytes, baseline.htmlBytes),
    elementCount: withDelta(current.elementCount, baseline.elementCount),
    searchInputs: withDelta(current.searchInputs, baseline.searchInputs),
    selects: withDelta(current.selects, baseline.selects),
    buttons: withDelta(current.buttons, baseline.buttons),
    localScriptCount: withDelta(current.localScriptCount, baseline.localScriptCount),
    localScriptBytes: withDelta(current.localScriptBytes, baseline.localScriptBytes),
    inlineScriptBytes: withDelta(current.inlineScriptBytes, baseline.inlineScriptBytes),
    jsonRefCount: withDelta(current.jsonRefCount, baseline.jsonRefCount),
    findExploreMounts: withDelta(current.findExploreMounts, baseline.findExploreMounts)
  };
}

function getBaselineMetrics(relativePath) {
  if (!BASELINE_ROOT) return null;
  const sitePath = path.join(BASELINE_ROOT, "_site", relativePath);
  if (!fs.existsSync(sitePath)) return null;
  return metrics(readTextFrom(BASELINE_ROOT, path.join("_site", relativePath)), BASELINE_ROOT);
}

function normalizeResultUrl(url = "") {
  const value = String(url || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const ensuredLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return ensuredLeadingSlash === "/" || ensuredLeadingSlash.endsWith("/") ? ensuredLeadingSlash : `${ensuredLeadingSlash}/`;
}

function normalizeSearchQuery(value = "") {
  return String(value || "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function presentationTopicPreset(topic = "") {
  return PRESENTATION_RESEARCH_TOPIC_PRESETS[String(topic || "").trim()] || "";
}

function buildResearchFilters(kind = "", state = {}) {
  const filters = {
    FindExplore: kind,
    "Research context": "research"
  };

  if (state.year) {
    if (kind === "publications") filters["Publications year"] = state.year;
    if (kind === "theses") filters["Theses year"] = state.year;
    if (kind === "writings") filters["Research year"] = state.year;
    if (kind === "presentations") filters.PresentationYear = state.year;
  }

  if (state.topic) {
    if (kind === "publications") filters["Publications topic"] = state.topic;
    if (kind === "theses") filters["Theses topic"] = state.topic;
    if (kind === "writings") filters["Research topic"] = state.topic;
    if (kind === "presentations") {
      const preset = presentationTopicPreset(state.topic);
      if (preset) filters.PresentationResearchPreset = preset;
      else filters.PresentationTopic = state.topic;
    }
  }

  if (state.quality && kind === "publications") {
    filters["Publications quality"] = state.quality;
  }

  return filters;
}

async function createPagefindInstances() {
  const originalFetch = global.fetch;
  const originalDocument = global.document;
  const originalLocation = global.location;

  global.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url;
    if (url && url.startsWith("file://")) {
      const body = await fs.promises.readFile(fileURLToPath(url));
      return new Response(body, { status: 200 });
    }
    if (typeof originalFetch === "function") return originalFetch(input, init);
    throw new Error(`Unsupported fetch URL: ${url}`);
  };

  const basePath = `${pathToFileURL(PAGEFIND_DIR).href}/`.replace(/\/+$/, "/");
  global.location = {
    href: "https://example.com/tutkimus/",
    origin: "https://example.com"
  };

  const restoreGlobals = () => {
    global.fetch = originalFetch;
    if (typeof originalDocument === "undefined") delete global.document;
    else global.document = originalDocument;
    if (typeof originalLocation === "undefined") delete global.location;
    else global.location = originalLocation;
  };

  const setDocumentLanguage = (language) => {
    global.document = {
      currentScript: null,
      querySelector(selector) {
        if (selector !== "html") return null;
        return {
          getAttribute(name) {
            return name === "lang" ? language : null;
          }
        };
      }
    };
  };

  const loadSearchModuleForLanguage = async (language) => {
    setDocumentLanguage(language);
    const cacheBust = `${language}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const moduleUrl = `${pathToFileURL(path.join(PAGEFIND_DIR, "pagefind.js")).href}?audit-lang=${cacheBust}`;
    const pagefind = await import(moduleUrl);
    await pagefind.options({ basePath, baseUrl: "/", noWorker: true });
    await pagefind.init();
    return pagefind;
  };

  const fi = await loadSearchModuleForLanguage("fi");
  const en = await loadSearchModuleForLanguage("en");

  return {
    byLanguage: { fi, en },
    async destroy() {
      await Promise.all([fi.destroy(), en.destroy()]);
      restoreGlobals();
    }
  };
}

async function resolveSearchRows(result, kind) {
  const rows = [];
  for (const entry of result.results) {
    const data = await entry.data();
    rows.push({
      kind,
      score: entry.score || 0,
      url: normalizeResultUrl(data?.url || ""),
      title: String(data?.meta?.title || data?.title || data?.url || ""),
      meta: data?.meta || {}
    });
  }
  return rows;
}

async function searchResearch(instances, query, state = {}) {
  const kinds = state.type ? [state.type] : RESEARCH_SCOPE_TYPES;
  const languages = ["fi", "en"];
  const merged = [];

  for (const kind of kinds) {
    for (const language of languages) {
      const result = await instances.byLanguage[language].search(query, {
        filters: buildResearchFilters(kind, state)
      });
      merged.push(...await resolveSearchRows(result, kind));
    }
  }

  merged.sort((left, right) => (right.score || 0) - (left.score || 0));

  const deduped = [];
  const seen = new Set();
  for (const row of merged) {
    if (!row.url || seen.has(row.url)) continue;
    seen.add(row.url);
    deduped.push(row);
  }

  return deduped;
}

async function searchTitleWithFallback(instances, title = "", state = {}) {
  const rawTitle = String(title || "").trim();
  if (!rawTitle) return [];

  const exact = await searchResearch(instances, rawTitle, state);
  const normalized = normalizeSearchQuery(rawTitle);
  if (!normalized || normalized === rawTitle) return exact;

  const normalizedRows = await searchResearch(instances, normalized, state);
  if (exact.length === 0) return normalizedRows;

  const merged = [...exact];
  const seen = new Set(exact.map((row) => row.url));
  for (const row of normalizedRows) {
    if (!row.url || seen.has(row.url)) continue;
    seen.add(row.url);
    merged.push(row);
  }
  return merged;
}

function sampleRecord(item = {}) {
  return {
    title: item.title || "",
    url: normalizeResultUrl(item.localPageUrl || item.pageUrl || item.url || ""),
    year: item.year || "",
    contexts: toArray(item.contexts),
    topics: toArray(item.topics),
    presets: getPresentationResearchPresets(toArray(item.topics))
  };
}

async function main() {
  const researchHtml = readText("_site/tutkimus/index.html");
  const homeHtml = readText("_site/index.html");
  const publicationsPage = readJson("_site/data/publications-page.json");
  const thesesPage = readJson("_site/data/theses.json");
  const writingsPage = readJson("_site/data/writings-page.json");
  const presentationsPage = readJson("_site/data/presentations-page.json");
  const findExploreJsBytes = fs.statSync(path.join(ROOT, "_site/js/find-explore.js")).size;
  const baselineResearch = getBaselineMetrics("tutkimus/index.html");
  const baselineHome = getBaselineMetrics("index.html");

  const researchMetrics = metrics(researchHtml);
  const homeMetrics = metrics(homeHtml);
  const publicationItems = publicationsPage.items || [];
  const thesisItems = thesesPage.items || [];
  const writingItems = writingsPage.items || [];
  const presentationItems = presentationsPage.items || [];

  const eligiblePublications = publicationItems.filter((item) => hasContext(item, "research"));
  const eligibleTheses = thesisItems.filter((item) => hasContext(item, "research"));
  const eligibleWritings = writingItems.filter((item) => hasContext(item, "research"));
  const eligiblePresentations = presentationItems.filter((item) => hasContext(item, "research"));
  const multiContextResearchWritings = eligibleWritings.filter((item) => toArray(item.contexts).length > 1);
  const writingsEligibleByType = countBy(eligibleWritings, (item) => item.contentType || "");
  const writingsTotalByType = countBy(writingItems, (item) => item.contentType || "");
  const writingsResearchContextCombos = countBy(
    eligibleWritings,
    (item) => toArray(item.contexts).join("|")
  );
  const presentationsSafeResearchTopicMapping = presentationItems.filter(
    (item) => getPresentationResearchPresets(toArray(item.topics)).length > 0
  );
  const safeTopicMappedButNotResearch = presentationsSafeResearchTopicMapping.filter(
    (item) => !hasContext(item, "research")
  );

  const eligiblePresentationMapped = eligiblePresentations.find(
    (item) => getPresentationResearchPresets(toArray(item.topics)).length > 0
  );
  const eligiblePresentationUnmapped = eligiblePresentations.find(
    (item) => getPresentationResearchPresets(toArray(item.topics)).length === 0
  );
  const safeMappedNonResearchPresentation = safeTopicMappedButNotResearch[0] || null;
  const eligibleWritingSample = eligibleWritings.find((item) => item.contentType === "blogPost") || eligibleWritings[0] || null;
  const excludedWritingSample = writingItems.find(
    (item) => item.contentType === "blogPost" && !hasContext(item, "research")
  ) || null;

  const researchChecks = {
    fileExists: true,
    ssrNarrativeRemains: researchHtml.includes("Tutkimuksen tarkasteluteemat")
      && researchHtml.includes("Generation AI kokoaa tutkimuksen tämänhetkisen painopisteen"),
    researchLinesRemain: researchHtml.includes("Kolme keskeistä tutkimuslinjaa"),
    projectsRemain: researchHtml.includes("Tutkimushankkeet 2003"),
    curatedResearchRemains: researchHtml.includes("Tuore tutkimusnäyttö tästä linjasta"),
    externalProfilesRemain: researchHtml.includes("ORCID") && researchHtml.includes("Research.fi"),
    contextualMountExists: researchHtml.includes('data-find-explore-kind="researchContext"'),
    intendedScopesOnly: researchHtml.includes('data-find-explore-kinds="publications,theses,writings,presentations"')
      && !researchHtml.includes('data-find-explore-kinds="media'),
    hasFindExploreRuntime: researchHtml.includes("/js/find-explore.js"),
    noNewMasterJsonDataset: !researchHtml.includes("/data/research-find-explore")
      && !researchHtml.includes("/data/find-explore")
      && !researchHtml.includes("/data/research-context"),
    noUnnecessaryCanonicalJsonHydration: collectJsonRefs(researchHtml).length === 0,
    noEmbeddedPublicationRecords: !researchHtml.includes("researchPublicationFindExploreRecords")
      && !researchHtml.includes("data-find-explore-records-id"),
    contextualFilterUsesExistingResearchContext: researchHtml.includes('data-find-explore-kind="researchContext"')
      && researchHtml.includes('data-find-explore-kinds="publications,theses,writings,presentations"'),
    typeSelectorIncludesPresentations: researchHtml.includes('<option value="presentations">Esitykset</option>'),
    topicPresetsExist: [
      "Tekoäly ja tekoälylukutaito",
      "Opettajankoulutus",
      "Koulutusteknologia",
      "Yhteisöllinen oppiminen"
    ].every((value) => researchHtml.includes(value))
  };

  const homeChecks = {
    fileExists: true,
    orientationRemains: homeHtml.includes("Kouluttaja, puhuja ja vaikuttaja"),
    discoveryRouteExists: homeHtml.includes('href="/tutkimus/#tutkimusnaytto"'),
    noFindExploreMount: !homeHtml.includes("data-find-explore"),
    noFindExploreRuntimeForHomepage: !homeHtml.includes("/js/find-explore.js"),
    noHomepageFilters: !homeHtml.includes("data-find-explore-query")
      && !homeHtml.includes("data-find-explore-type")
  };

  const pagefindAudit = {
    allResearchPresentationDiscoverable: false,
    noSafeMappedNonResearchPresentationLeakage: false,
    genericEligibleUnmappedPresentationAppears: false,
    topicPresetPresentationBehavior: false,
    publicationStillDiscoverable: false,
    thesisStillDiscoverable: false,
    eligibleWritingStillDiscoverable: false,
    excludedWritingRemainsExcluded: false,
    preferredLandingCorrect: false,
    duplicatePresentationResults: false
  };

  const pagefindEvidence = {};
  const pagefind = await createPagefindInstances();
  try {
    const discoverabilityRows = [];
    for (const item of eligiblePresentations) {
      const rows = await searchTitleWithFallback(pagefind, item.title || "", { type: "presentations" });
      const expectedUrl = normalizeResultUrl(item.localPageUrl || item.pageUrl || item.url || "");
      discoverabilityRows.push({
        title: item.title || "",
        expectedUrl,
        rows,
        evidence: rows.slice(0, 5)
      });
    }

    const discoveredPresentationUrls = discoverabilityRows
      .map((audit) => audit.rows.find((row) => row.url === audit.expectedUrl)?.url || "")
      .filter(Boolean);
    const eligiblePresentationUrls = eligiblePresentations
      .map((item) => normalizeResultUrl(item.localPageUrl || item.pageUrl || item.url || ""))
      .filter(Boolean)
      .sort();

    pagefindAudit.allResearchPresentationDiscoverable =
      discoveredPresentationUrls.length === eligiblePresentations.length
      && discoveredPresentationUrls.slice().sort().every((url, index) => url === eligiblePresentationUrls[index]);
    pagefindAudit.duplicatePresentationResults =
      discoverabilityRows.every((audit) => audit.rows.filter((row) => row.url === audit.expectedUrl).length <= 1);

    const publicationSearch = await searchResearch(
      pagefind,
      "Assessing Digital Competence of K1 12 Teachers in Kosovo",
      { type: "publications" }
    );
    pagefindAudit.publicationStillDiscoverable =
      publicationSearch[0]?.url === "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/";

    const thesisSearch = await searchResearch(pagefind, "Riikonen", { type: "theses" });
    pagefindAudit.thesisStillDiscoverable = thesisSearch[0]?.url === "/opinnaytteet/62699/";

    const eligibleWritingQuery = normalizeSearchQuery(eligibleWritingSample?.title || "");
    const eligibleWritingSearch = eligibleWritingQuery
      ? await searchResearch(pagefind, eligibleWritingQuery, { type: "writings" })
      : [];
    pagefindAudit.eligibleWritingStillDiscoverable =
      Boolean(eligibleWritingSample)
      && eligibleWritingSearch.some((row) => row.url === normalizeResultUrl(eligibleWritingSample.url));

    const excludedWritingQuery = normalizeSearchQuery(excludedWritingSample?.title || "");
    const excludedWritingSearch = excludedWritingQuery
      ? await searchResearch(pagefind, excludedWritingQuery, { type: "writings" })
      : [];
    pagefindAudit.excludedWritingRemainsExcluded =
      Boolean(excludedWritingSample)
      && !excludedWritingSearch.some((row) => row.url === normalizeResultUrl(excludedWritingSample.url));

    const preferredLandingQuery = normalizeSearchQuery(eligiblePresentationMapped?.title || "");
    const preferredLandingSearch = preferredLandingQuery
      ? await searchTitleWithFallback(pagefind, eligiblePresentationMapped?.title || "", { type: "presentations" })
      : [];
    pagefindAudit.preferredLandingCorrect =
      Boolean(eligiblePresentationMapped)
      && preferredLandingSearch[0]?.url === normalizeResultUrl(eligiblePresentationMapped.localPageUrl || eligiblePresentationMapped.pageUrl || eligiblePresentationMapped.url || "");

    const genericUnmappedQuery = normalizeSearchQuery(eligiblePresentationUnmapped?.title || "");
    const genericUnmappedSearch = genericUnmappedQuery
      ? await searchTitleWithFallback(pagefind, eligiblePresentationUnmapped?.title || "", {})
      : [];
    pagefindAudit.genericEligibleUnmappedPresentationAppears =
      Boolean(eligiblePresentationUnmapped)
      && genericUnmappedSearch.some((row) => row.url === normalizeResultUrl(eligiblePresentationUnmapped.localPageUrl || eligiblePresentationUnmapped.pageUrl || eligiblePresentationUnmapped.url || ""));

    const safeMappedNonResearchQuery = normalizeSearchQuery(safeMappedNonResearchPresentation?.title || "");
    const safeMappedNonResearchSearch = safeMappedNonResearchQuery
      ? await searchTitleWithFallback(pagefind, safeMappedNonResearchPresentation?.title || "", { type: "presentations" })
      : [];
    pagefindAudit.noSafeMappedNonResearchPresentationLeakage =
      Boolean(safeMappedNonResearchPresentation)
      && !safeMappedNonResearchSearch.some((row) => row.url === normalizeResultUrl(safeMappedNonResearchPresentation.localPageUrl || safeMappedNonResearchPresentation.pageUrl || safeMappedNonResearchPresentation.url || ""));

    const topicPresetSearch = await searchTitleWithFallback(
      pagefind,
      eligiblePresentationMapped?.title || "",
      { type: "presentations", topic: "koulutusteknologia" }
    );
    const topicPresetUrls = topicPresetSearch.map((row) => row.url);
    pagefindAudit.topicPresetPresentationBehavior =
      topicPresetSearch.length > 0
      && Boolean(eligiblePresentationMapped)
      && topicPresetUrls.includes(normalizeResultUrl(eligiblePresentationMapped.localPageUrl || eligiblePresentationMapped.pageUrl || eligiblePresentationMapped.url || ""))
      && Boolean(eligiblePresentationUnmapped)
      && !topicPresetUrls.includes(normalizeResultUrl(eligiblePresentationUnmapped.localPageUrl || eligiblePresentationUnmapped.pageUrl || eligiblePresentationUnmapped.url || ""))
      && Boolean(safeMappedNonResearchPresentation)
      && !topicPresetUrls.includes(normalizeResultUrl(safeMappedNonResearchPresentation.localPageUrl || safeMappedNonResearchPresentation.pageUrl || safeMappedNonResearchPresentation.url || ""));

    pagefindEvidence.allResearchPresentations = {
      count: discoveredPresentationUrls.length,
      missing: discoverabilityRows
        .filter((audit) => !audit.rows.some((row) => row.url === audit.expectedUrl))
        .map((audit) => ({ title: audit.title, expectedUrl: audit.expectedUrl, rows: audit.evidence })),
      firstFiveUrls: discoveredPresentationUrls.slice(0, 5)
    };
    pagefindEvidence.preferredLandingSearch = preferredLandingSearch.slice(0, 5);
    pagefindEvidence.genericUnmappedSearch = genericUnmappedSearch.slice(0, 5);
    pagefindEvidence.safeMappedNonResearchSearch = safeMappedNonResearchSearch.slice(0, 5);
    pagefindEvidence.topicPresetSearch = topicPresetSearch.slice(0, 10);
  } finally {
    await pagefind.destroy();
  }

  const eligibilityChecks = {
    membershipRuleUsesExistingContextOnly: true,
    publicationsEligibleCount: eligiblePublications.length === 53,
    thesesEligibleCount: eligibleTheses.length === 169,
    writingsEligibleCount: eligibleWritings.length === 62,
    presentationsEligibleCount: eligiblePresentations.length === 33,
    totalEligibleCount: eligiblePublications.length + eligibleTheses.length + eligibleWritings.length + eligiblePresentations.length === 317,
    writingsEligibleByType: JSON.stringify(writingsEligibleByType) === JSON.stringify({
      blogPost: 1,
      opinion: 3,
      scientificPublication: 53,
      speech: 5
    }),
    blogsTotals: (writingsTotalByType.blogPost || 0) === 70 && (writingsEligibleByType.blogPost || 0) === 1,
    multiContextResearchWritings: multiContextResearchWritings.length === 61,
    educationSemanticsRemainVisible: eligibleWritings.filter((item) => hasContext(item, "education")).length === 59,
    teachingSemanticsRemainVisible: eligibleWritings.filter((item) => hasContext(item, "teaching")).length === 43,
    societalInteractionOverlapRemainsVisible: eligibleWritings.filter((item) => hasContext(item, "politics")).length === 8,
    businessOverlapRemainsVisible: eligibleWritings.filter((item) => hasContext(item, "business")).length === 1,
    presentationScopeUsesAuthoritativeContextOnly: safeTopicMappedButNotResearch.length === 136,
    presentationPagefindDiscoverability: Object.values(pagefindAudit).every(Boolean)
  };

  const report = {
    generatedAt: new Date().toISOString(),
    ok: Object.values(researchChecks).every(Boolean)
      && Object.values(homeChecks).every(Boolean)
      && Object.values(eligibilityChecks).every(Boolean),
    membershipRule: "Existing Research membership only: include a record when its existing contexts array contains \"research\".",
    allowedScopes: ["publications", "theses", "writings", "presentations"],
    excludedScopes: ["media", "politics", "projects"],
    findExploreJsBytes,
    research: {
      metrics: researchMetrics,
      baselineMetrics: baselineResearch,
      deltaVsBaseline: buildDelta(researchMetrics, baselineResearch),
      checks: researchChecks
    },
    homepage: {
      metrics: homeMetrics,
      baselineMetrics: baselineHome,
      deltaVsBaseline: buildDelta(homeMetrics, baselineHome),
      checks: homeChecks
    },
    eligibility: {
      checks: eligibilityChecks,
      counts: {
        publicationsEligible: eligiblePublications.length,
        thesesEligible: eligibleTheses.length,
        writingsEligible: eligibleWritings.length,
        presentationsEligible: eligiblePresentations.length,
        totalResearchPopulation: eligiblePublications.length + eligibleTheses.length + eligibleWritings.length + eligiblePresentations.length
      },
      writings: {
        totalByContentType: writingsTotalByType,
        eligibleByContentType: writingsEligibleByType,
        blogs: {
          total: writingsTotalByType.blogPost || 0,
          eligible: writingsEligibleByType.blogPost || 0
        },
        multiContextResearchWritings: multiContextResearchWritings.length,
        researchContextCombos: writingsResearchContextCombos,
        eligibleWithEducation: eligibleWritings.filter((item) => hasContext(item, "education")).length,
        eligibleWithTeaching: eligibleWritings.filter((item) => hasContext(item, "teaching")).length,
        eligibleWithPolitics: eligibleWritings.filter((item) => hasContext(item, "politics")).length,
        eligibleWithBusiness: eligibleWritings.filter((item) => hasContext(item, "business")).length
      },
      presentations: {
        canonicalTotal: presentationItems.length,
        researchEligible: eligiblePresentations.length,
        researchEligibleLocalFirst: eligiblePresentations.filter((item) => item.landingType === "localDetail").length,
        researchEligibleExternalFirst: eligiblePresentations.filter((item) => item.landingType === "externalSource").length,
        researchEligibleWithSafeResearchMapping: eligiblePresentations.filter((item) => getPresentationResearchPresets(toArray(item.topics)).length > 0).length,
        researchEligibleWithoutSafeResearchMapping: eligiblePresentations.filter((item) => getPresentationResearchPresets(toArray(item.topics)).length === 0).length,
        safeResearchTopicMappingCount: presentationsSafeResearchTopicMapping.length,
        safeTopicMappedButNotResearchCount: safeTopicMappedButNotResearch.length,
        sampleEligibleMapped: sampleRecord(eligiblePresentationMapped || {}),
        sampleEligibleUnmapped: sampleRecord(eligiblePresentationUnmapped || {}),
        sampleSafeMappedButNotResearch: sampleRecord(safeMappedNonResearchPresentation || {})
      }
    },
    pagefindAudit: {
      checks: pagefindAudit,
      evidence: pagefindEvidence
    }
  };

  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

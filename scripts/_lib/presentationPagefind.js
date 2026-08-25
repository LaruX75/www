const fs = require("fs/promises");
const path = require("path");
const cheerio = require("cheerio");
const { getCanvaDesignId } = require("../../src/_data/canvaUrl");
const {
  getPresentationResearchPresetLabels,
  getPresentationResearchPresets
} = require("../../src/_data/presentationResearchTopics");

const PRESENTATION_FIND_EXPLORE_SEED = "__find_explore_presentations__";
const SITE_ROOT = path.join(process.cwd(), "_site");
const PRESENTATIONS_PAGE_JSON = path.join(SITE_ROOT, "data", "presentations-page.json");
const PRESENTATIONS_JSON = path.join(SITE_ROOT, "data", "presentations.json");

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function hasValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value === 0 || value === false) return true;
  return String(value || "").trim().length > 0;
}

function normalizeLocalUrl(url = "") {
  const value = String(url || "").trim();
  if (!value || /^https?:\/\//i.test(value)) return "";
  const ensuredLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  if (ensuredLeadingSlash === "/") return "/";
  return ensuredLeadingSlash.endsWith("/") ? ensuredLeadingSlash : `${ensuredLeadingSlash}/`;
}

function normalizeAnyUrl(url = "") {
  const value = String(url || "").trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : normalizeLocalUrl(value);
}

function canonicalPresentationId(item = {}) {
  if (item.id) return String(item.id);
  return [
    item.sourceKey || "",
    item.sourceUrl || item.externalUrl || item.url || item.localPageUrl || item.pageUrl || "",
    item.title || ""
  ].join("|");
}

function siteUrlForHtmlPath(siteRoot, filePath) {
  const relative = path.relative(siteRoot, filePath).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) {
    return `/${relative.slice(0, -"index.html".length)}`;
  }
  if (relative.endsWith(".html")) {
    return `/${relative.slice(0, -".html".length)}`;
  }
  return `/${relative}`;
}

async function walkHtmlFiles(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "pagefind") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkHtmlFiles(fullPath, results);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

async function buildHtmlRouteMap(siteRoot = SITE_ROOT) {
  const htmlFiles = await walkHtmlFiles(siteRoot);
  return new Map(
    htmlFiles.map((filePath) => [siteUrlForHtmlPath(siteRoot, filePath), filePath])
  );
}

async function readBuiltPresentationData(siteRoot = SITE_ROOT) {
  const [pageRaw, detailsRaw] = await Promise.all([
    fs.readFile(path.join(siteRoot, "data", "presentations-page.json"), "utf8"),
    fs.readFile(path.join(siteRoot, "data", "presentations.json"), "utf8")
  ]);

  const pageJson = JSON.parse(pageRaw);
  const detailsJson = JSON.parse(detailsRaw);

  return {
    canonicalItems: toArray(pageJson.items),
    builtLocalDetails: toArray(detailsJson.items),
    contexts: toArray(pageJson.contexts),
    canvaPageUrls: toArray(pageJson.canvaPageUrls)
  };
}

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function buildPlainIndexText(value = "") {
  return String(value || "")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectRepresentationUrls(item = {}) {
  const urls = new Set();
  [
    item.url,
    item.sourceUrl,
    item.externalUrl,
    item.pageUrl,
    item.localPageUrl,
    item.landingUrl
  ].forEach((value) => {
    const normalized = normalizeAnyUrl(value);
    if (normalized) urls.add(normalized);
  });

  toArray(item.representations).forEach((representation) => {
    [
      representation.url,
      representation.sourceUrl,
      representation.externalUrl,
      representation.localPageUrl
    ].forEach((value) => {
      const normalized = normalizeAnyUrl(value);
      if (normalized) urls.add(normalized);
    });
  });

  return [...urls];
}

function collectLocalHtmlDocuments(item = {}, htmlRouteMap = new Map()) {
  const candidates = [];
  const pushCandidate = (url, reason, relationship = "") => {
    const normalized = normalizeLocalUrl(url);
    if (!normalized || !htmlRouteMap.has(normalized)) return;
    candidates.push({
      url: normalized,
      filePath: htmlRouteMap.get(normalized),
      reason,
      relationship
    });
  };

  pushCandidate(item.localPageUrl || item.pageUrl, "canonicalLocalPage", "canonicalLocalDetail");

  toArray(item.representations).forEach((representation) => {
    pushCandidate(
      representation.localPageUrl || representation.url,
      "representationLocalPage",
      representation.relationship || ""
    );
  });

  const seen = new Set();
  return candidates.filter((candidate) => {
    if (seen.has(candidate.url)) return false;
    seen.add(candidate.url);
    return true;
  });
}

function indexCandidatePriority(item = {}, candidate = {}) {
  if (candidate.url === normalizeLocalUrl(item.localPageUrl) && item.landingType === "localDetail") {
    return 0;
  }
  if (candidate.relationship === "canonicalLocalDetail") return 1;
  if (candidate.relationship === "alternateRepresentation") return 2;
  if (candidate.reason === "canonicalLocalPage") return 3;
  return 4;
}

function chooseIndexCandidate(item = {}, localHtmlDocuments = []) {
  if (!localHtmlDocuments.length) return null;
  return [...localHtmlDocuments]
    .sort((left, right) => {
      const priorityDiff = indexCandidatePriority(item, left) - indexCandidatePriority(item, right);
      if (priorityDiff !== 0) return priorityDiff;
      return String(left.url || "").localeCompare(String(right.url || ""));
    })[0];
}

function buildIndexCandidateReason(item = {}, candidate = null) {
  if (!candidate) return "customRecordRequired";
  if (candidate.url === normalizeLocalUrl(item.localPageUrl) && item.landingType === "localDetail") {
    return "preferredLocalLanding";
  }
  if (candidate.relationship === "canonicalLocalDetail") return "canonicalLocalRepresentation";
  if (candidate.relationship === "alternateRepresentation") return "alternateRepresentationLocalHtml";
  return "existingLocalHtml";
}

function buildExistingHtmlClassification(item = {}, candidate = null, localHtmlDocuments = []) {
  if (item.landingType === "localDetail" && candidate && candidate.url === normalizeLocalUrl(item.landingUrl)) {
    return "LOCAL_PREFERRED_WITH_LOCAL_HTML";
  }
  if (item.landingType === "externalSource" && candidate) {
    return "EXTERNAL_PREFERRED_WITH_USABLE_LOCAL_HTML";
  }
  if (item.landingType === "externalSource" && !candidate) {
    return "EXTERNAL_PREFERRED_WITH_NO_SUITABLE_LOCAL_HTML";
  }
  if (!candidate && !localHtmlDocuments.length) {
    return "NO_VALID_INDEX_CANDIDATE";
  }
  return "OTHER";
}

function presentationLanguageFor(item = {}) {
  if (item.sourceLanguage) return String(item.sourceLanguage);
  if (item.lang) return String(item.lang);
  return "";
}

function looksEnglishTitle(title = "") {
  const text = String(title || "").trim().toLowerCase();
  if (!text) return false;
  if (/[äöå]/i.test(text)) return false;

  const englishMarkers = [
    " the ",
    " and ",
    " of ",
    " to ",
    " with ",
    " from ",
    " are ",
    " learning",
    " digital",
    " technology",
    " research",
    " intelligence",
    " analytics",
    " robotics",
    " future",
    " social media"
  ];

  const padded = ` ${text} `;
  return englishMarkers.filter((marker) => padded.includes(marker)).length >= 2;
}

function pagefindLanguageFor(item = {}) {
  const lang = String(item.lang || "").trim().toLowerCase();
  if (lang === "en" || lang === "eng") return "en";
  return looksEnglishTitle(item.title || "") ? "en" : "fi";
}

function sharedLocalHtmlResolutionScore(record = {}, detail = {}) {
  const detailSourceUrl = normalizeAnyUrl(detail.sourceUrl || detail.publicUrl || detail.url || "");
  let score = 0;

  if (detailSourceUrl && normalizeAnyUrl(record.sourceUrl) === detailSourceUrl) score += 100;
  if (detailSourceUrl && toArray(record.representationUrls).includes(detailSourceUrl)) score += 50;
  if (
    normalizeLocalUrl(record.localPageUrl || record.pageUrl) &&
    normalizeLocalUrl(record.localPageUrl || record.pageUrl) === normalizeLocalUrl(detail.pageUrl || "")
  ) {
    score += 10;
  }
  if (detail.source && record.sourceType === detail.source) score += 5;
  if ((record.canonicalTitle || "").trim() === String(detail.title || "").trim()) score += 2;
  if (record.landingType === "localDetail") score += 1;

  return score;
}

function resolveSharedIndexCandidateConflicts(records = [], builtLocalDetails = []) {
  const detailByPageUrl = new Map(
    builtLocalDetails
      .filter((detail) => detail.pageUrl)
      .map((detail) => [normalizeLocalUrl(detail.pageUrl), detail])
  );
  const recordsByCandidateUrl = new Map();

  records.forEach((record) => {
    if (!record.indexCandidateDocument) return;
    const key = normalizeLocalUrl(record.indexCandidateDocument);
    if (!key) return;
    if (!recordsByCandidateUrl.has(key)) recordsByCandidateUrl.set(key, []);
    recordsByCandidateUrl.get(key).push(record);
  });

  recordsByCandidateUrl.forEach((group, candidateUrl) => {
    if (group.length < 2) return;
    const detail = detailByPageUrl.get(candidateUrl) || {};
    const winner = [...group].sort((left, right) => {
      const scoreDiff =
        sharedLocalHtmlResolutionScore(right, detail) - sharedLocalHtmlResolutionScore(left, detail);
      if (scoreDiff !== 0) return scoreDiff;
      return String(left.canonicalPresentationId || "").localeCompare(String(right.canonicalPresentationId || ""));
    })[0];

    group.forEach((record) => {
      if (record === winner) return;
      record.sharedLocalHtmlConflictUrl = candidateUrl;
      record.indexCandidateDocument = "";
      record.indexCandidateReason = "customRecordRequiredSharedLocalHtml";
    });
  });

  return records;
}

function buildPresentationExistingHtmlRecord(item = {}, htmlRouteMap = new Map()) {
  const localHtmlDocuments = collectLocalHtmlDocuments(item, htmlRouteMap);
  const indexCandidate = chooseIndexCandidate(item, localHtmlDocuments);
  const designId = item.sourceType === "canva"
    ? String(getCanvaDesignId(item.sourceUrl || item.externalUrl || item.url || "") || item.id || "").trim()
    : "";

  return {
    canonicalPresentationId: canonicalPresentationId(item),
    canonicalTitle: item.title || "",
    preferredLandingUrl: item.landingUrl || item.url || "",
    landingType: item.landingType || "",
    sourceType: item.sourceType || "",
    mediaType: item.mediaType || "",
    presentationYear: String(item.year || "").trim(),
    presentationDescription: String(item.description || "").trim(),
    presentationTopics: uniqueStrings(item.topics || []),
    presentationContexts: uniqueStrings(item.contexts || []),
    presentationEvent: String(item.event || "").trim(),
    presentationType: String(item.presentationType || "").trim(),
    presentationRole: String(item.role || "").trim(),
    presentationLanguage: presentationLanguageFor(item),
    pagefindLanguage: pagefindLanguageFor(item),
    designId,
    pageUrl: normalizeLocalUrl(item.pageUrl || ""),
    localPageUrl: normalizeLocalUrl(item.localPageUrl || ""),
    sourceUrl: item.sourceUrl || "",
    representationCount: toArray(item.representations).length,
    representationUrls: collectRepresentationUrls(item),
    presentationResearchPresets: getPresentationResearchPresets(item.topics || []),
    presentationResearchPresetLabels: getPresentationResearchPresetLabels(item.topics || []),
    localHtmlDocuments,
    indexCandidateDocument: indexCandidate ? indexCandidate.url : "",
    indexCandidateReason: buildIndexCandidateReason(item, indexCandidate),
    existingHtmlClassification: buildExistingHtmlClassification(item, indexCandidate, localHtmlDocuments),
    hasMultipleLocalHtmlRepresentations: localHtmlDocuments.length > 1
  };
}

function localDetailStatus(pageUrl = "", records = []) {
  const normalized = normalizeLocalUrl(pageUrl);
  if (!normalized) return "OTHER_EXPLICITLY_DOCUMENTED_STATUS";
  const matchingRecord = records.find((record) =>
    record.localPageUrl === normalized ||
    record.localHtmlDocuments.some((document) => document.url === normalized)
  );
  if (!matchingRecord) return "OTHER_EXPLICITLY_DOCUMENTED_STATUS";
  if (matchingRecord.localPageUrl === normalized) return "CANONICAL_LOCAL_DETAIL";
  return "ALTERNATE_REPRESENTATION";
}

async function buildPresentationExistingHtmlAudit(siteRoot = SITE_ROOT) {
  const htmlRouteMap = await buildHtmlRouteMap(siteRoot);
  const { canonicalItems, builtLocalDetails, contexts, canvaPageUrls } = await readBuiltPresentationData(siteRoot);
  const records = resolveSharedIndexCandidateConflicts(
    canonicalItems.map((item) => buildPresentationExistingHtmlRecord(item, htmlRouteMap)),
    builtLocalDetails
  );
  const localDetailStatuses = builtLocalDetails.map((detail) => ({
    pageUrl: normalizeLocalUrl(detail.pageUrl || detail.url || detail.id || ""),
    title: detail.title || "",
    status: localDetailStatus(detail.pageUrl || detail.url || detail.id || "", records)
  }));

  const canvaRecords = records.filter((record) => record.sourceType === "canva");
  const canvaPageUrlSet = new Set(canvaPageUrls.map((entry) => normalizeLocalUrl(entry.pageUrl || entry.url || entry)));
  const restoredCanvaMappings = canvaRecords.filter((record) =>
    record.localPageUrl &&
    record.designId &&
    record.designId === record.canonicalPresentationId &&
    canvaPageUrlSet.has(record.localPageUrl)
  );

  const summary = {
    canonicalTotal: records.length,
    builtLocalDetailTotal: builtLocalDetails.length,
    reconciledLocalDetailTotal: localDetailStatuses.filter((row) => row.status !== "OTHER_EXPLICITLY_DOCUMENTED_STATUS").length,
    localLandingTotal: records.filter((record) => record.landingType === "localDetail").length,
    externalLandingTotal: records.filter((record) => record.landingType === "externalSource").length,
    representationTotal: canonicalItems.reduce((sum, item) => sum + toArray(item.representations).length, 0),
    unresolvedLocalDetailTotal: localDetailStatuses.filter((row) => row.status === "OTHER_EXPLICITLY_DOCUMENTED_STATUS").length,
    CanvaTotal: canvaRecords.length,
    CanvaWithDesignId: canvaRecords.filter((record) => record.designId).length,
    CanvaWithPageUrl: canvaRecords.filter((record) => record.localPageUrl).length,
    CanvaWithExistingLocalHtml: canvaRecords.filter((record) => record.localHtmlDocuments.length > 0).length,
    restoredCanvaMappingTotal: restoredCanvaMappings.length,
    restoredCanvaMappingsWithExistingLocalHtml: restoredCanvaMappings.filter((record) => record.localHtmlDocuments.length > 0).length,
    existingHtmlClassification: {
      LOCAL_PREFERRED_WITH_LOCAL_HTML: records.filter((record) => record.existingHtmlClassification === "LOCAL_PREFERRED_WITH_LOCAL_HTML").length,
      EXTERNAL_PREFERRED_WITH_USABLE_LOCAL_HTML: records.filter((record) => record.existingHtmlClassification === "EXTERNAL_PREFERRED_WITH_USABLE_LOCAL_HTML").length,
      EXTERNAL_PREFERRED_WITH_NO_SUITABLE_LOCAL_HTML: records.filter((record) => record.existingHtmlClassification === "EXTERNAL_PREFERRED_WITH_NO_SUITABLE_LOCAL_HTML").length,
      NO_VALID_INDEX_CANDIDATE: records.filter((record) => record.existingHtmlClassification === "NO_VALID_INDEX_CANDIDATE").length
    },
    multipleLocalHtmlRepresentationsTotal: records.filter((record) => record.hasMultipleLocalHtmlRepresentations).length,
    preferredLocalCount: canvaRecords.filter((record) => record.landingType === "localDetail").length,
    preferredExternalCount: canvaRecords.filter((record) => record.landingType === "externalSource").length,
    contextsTotal: contexts.length
  };

  return {
    generatedAt: new Date().toISOString(),
    summary,
    records,
    localDetailStatuses,
    restoredCanvaMappings
  };
}

function buildPresentationPagefindFilters(record = {}) {
  const pageLanguageLabel = record.pagefindLanguage === "en" ? "English" : "Suomi";
  const presentationContexts = toArray(record.presentationContexts).map((value) => String(value)).filter(Boolean);
  const filters = {
    "Sisältö": ["Esitykset"],
    FindExplore: ["presentations"],
    Kieli: [pageLanguageLabel],
    PresentationLandingType: hasValue(record.landingType) ? [String(record.landingType)] : [],
    PresentationMediaType: hasValue(record.mediaType) ? [String(record.mediaType)] : [],
    PresentationSourceType: hasValue(record.sourceType) ? [String(record.sourceType)] : [],
    PresentationYear: hasValue(record.presentationYear) ? [String(record.presentationYear)] : [],
    PresentationTopic: toArray(record.presentationTopics).map((value) => String(value)).filter(Boolean),
    PresentationContext: presentationContexts,
    "Research context": presentationContexts.includes("research") ? ["research"] : [],
    PresentationResearchPreset: toArray(record.presentationResearchPresets).map((value) => String(value)).filter(Boolean),
    PresentationEvent: hasValue(record.presentationEvent) ? [String(record.presentationEvent)] : []
  };

  return Object.fromEntries(
    Object.entries(filters).filter(([, values]) => Array.isArray(values) && values.length > 0)
  );
}

function buildPresentationPagefindMeta(record = {}) {
  return {
    title: record.canonicalTitle || "",
    PresentationId: record.canonicalPresentationId || "",
    PresentationContext: toArray(record.presentationContexts).join("|"),
    ResearchContext: toArray(record.presentationContexts).includes("research") ? "research" : "",
    PresentationYear: record.presentationYear || "",
    PresentationEvent: record.presentationEvent || "",
    PresentationType: record.presentationType || "",
    PresentationRole: record.presentationRole || "",
    PresentationLanguage: record.presentationLanguage || "",
    PresentationResearchPreset: toArray(record.presentationResearchPresets).join("|"),
    PresentationResearchPresetLabel: toArray(record.presentationResearchPresetLabels).join(" | "),
    PresentationMediaType: record.mediaType || "",
    PresentationSourceType: record.sourceType || "",
    PresentationLandingType: record.landingType || "",
    PresentationLandingUrl: record.preferredLandingUrl || "",
    PresentationIndexDocument: record.indexCandidateDocument || "custom-record"
  };
}

function escapeHtml(value = "") {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value = "") {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function buildPresentationPagefindInjection(record = {}) {
  const filterMarkup = Object.entries(buildPresentationPagefindFilters(record))
    .flatMap(([key, values]) =>
      values.map((value) => `<span data-pagefind-filter="${escapeAttribute(`${key}:${value}`)}"></span>`)
    )
    .join("");

  const metaMarkup = Object.entries(buildPresentationPagefindMeta(record))
    .filter(([, value]) => hasValue(value))
    .map(([key, value]) => `<span data-pagefind-meta="${escapeAttribute(`${key}:${value}`)}"></span>`)
    .join("");

  return `<div hidden data-pagefind-ignore="all" data-presentation-pagefind-scope="presentations">${filterMarkup}${metaMarkup}</div>`;
}

function injectPresentationPagefindMetadata(html = "", record = {}) {
  const injection = buildPresentationPagefindInjection(record);
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${injection}</body>`);
  }
  return `${html}${injection}`;
}

function extractTextFromHtml(html = "") {
  const $ = cheerio.load(html);
  const parts = [
    $("title").first().text(),
    $("h1").first().text(),
    $("meta[name='description']").attr("content") || "",
    $("main").text(),
    $("article").text()
  ];
  return parts
    .join("\n")
    .replace(/\s+/g, " ")
    .trim();
}

function buildPresentationCustomRecord(record = {}, content = "") {
  const pieces = [
    PRESENTATION_FIND_EXPLORE_SEED,
    record.canonicalTitle,
    buildPlainIndexText(record.canonicalTitle),
    record.canonicalTitle,
    record.presentationDescription,
    content,
    record.presentationEvent,
    record.presentationType,
    record.presentationRole,
    record.presentationYear,
    ...toArray(record.presentationContexts),
    ...toArray(record.presentationResearchPresetLabels),
    ...toArray(record.presentationResearchPresets),
    ...toArray(record.presentationTopics)
  ].filter(Boolean);

  return {
    url: record.preferredLandingUrl,
    language: record.pagefindLanguage || "fi",
    content: pieces.join("\n"),
    meta: buildPresentationPagefindMeta(record),
    filters: buildPresentationPagefindFilters(record)
  };
}

module.exports = {
  SITE_ROOT,
  PRESENTATIONS_PAGE_JSON,
  PRESENTATIONS_JSON,
  normalizeLocalUrl,
  normalizeAnyUrl,
  canonicalPresentationId,
  buildHtmlRouteMap,
  readBuiltPresentationData,
  buildPresentationExistingHtmlAudit,
  buildPresentationPagefindFilters,
  buildPresentationPagefindMeta,
  buildPresentationPagefindInjection,
  injectPresentationPagefindMetadata,
  extractTextFromHtml,
  buildPresentationCustomRecord
};

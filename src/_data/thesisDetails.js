const loadTheses = require("./theses");
const { deriveThesisMetadata } = require("../_utils/thesisDerivedMetadata");
const {
  extractStableThesisId,
  thesisPageUrl
} = require("../_utils/thesisIdentity");
const { buildThesisCslItem } = require("../_utils/thesisCsl");

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeThesisLang(language) {
  const normalized = pickString(language).toLowerCase();
  if (normalized === "en" || normalized === "eng") return "en";
  return "fi";
}

function thesisLanguageLabel(language, lang = "fi") {
  const normalized = pickString(language).toLowerCase();
  if (normalized === "en" || normalized === "eng") return lang === "en" ? "English" : "Englanti";
  if (normalized === "sv" || normalized === "swe") return lang === "en" ? "Swedish" : "Ruotsi";
  return lang === "en" ? "Finnish" : "Suomi";
}

function thesisTypeLabel(type, lang = "fi") {
  if (type === "masterThesis") {
    return lang === "en" ? "Master's thesis" : "Pro gradu -tutkielma";
  }
  if (type === "bachelorThesis") {
    return lang === "en" ? "Bachelor's thesis" : "Kandidaatintutkielma";
  }
  return lang === "en" ? "Thesis" : "Opinnäyte";
}

function buildDatePublished(year) {
  const normalized = pickString(year);
  if (!/^\d{4}$/.test(normalized)) return null;
  return new Date(`${normalized}-01-01T00:00:00.000Z`);
}

function abstractParagraphs(abstract) {
  return pickString(abstract)
    .split(/\n\s*\n/g)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function abstractSnippet(abstract, maxLength = 280) {
  const paragraphs = abstractParagraphs(abstract);
  const first = pickString(paragraphs[0] || "");
  if (!first) return "";
  if (first.length <= maxLength) return first;
  return `${first.slice(0, maxLength - 1).trimEnd()}…`;
}

function collectCanonicalTheses(thesesData) {
  const seen = new Set();
  const ordered = [];
  const sources = [
    ...toArray(thesesData?.gradut).map((thesis) => ({ ...thesis, thesisRole: "advised" })),
    ...toArray(thesesData?.kandit).map((thesis) => ({ ...thesis, thesisRole: "advised" })),
    ...toArray(thesesData?.reviewerOnly).map((thesis) => ({ ...thesis, thesisRole: "reviewed" }))
  ];

  for (const thesis of sources) {
    const link = pickString(thesis?.link);
    if (!link || seen.has(link)) continue;
    seen.add(link);
    ordered.push(thesis);
  }

  return ordered;
}

function findCanonicalThesisById(items, stableId) {
  const wantedId = pickString(stableId);
  if (!wantedId) return null;

  return toArray(items).find((thesis) => extractStableThesisId(thesis?.link) === wantedId) || null;
}

function buildThesisDetailModel(thesis) {
  if (!thesis) return null;

  const id = extractStableThesisId(thesis.link);
  const title = pickString(thesis.title);
  const sourceUrl = pickString(thesis.link);
  if (!id || !title || !sourceUrl) return null;

  const lang = normalizeThesisLang(thesis.language);
  const { categories, contexts } = deriveThesisMetadata(thesis);

  const detail = {
    id,
    pageUrl: thesisPageUrl(thesis.link),
    sourceUrl,
    sourceLabel: "OuluREPO",
    title,
    authors: toArray(thesis.authors).map((item) => String(item).trim()).filter(Boolean),
    authorLine: toArray(thesis.authors).map((item) => String(item).trim()).filter(Boolean).join("; "),
    year: pickString(thesis.year),
    thesisType: pickString(thesis.type),
    thesisTypeLabel: thesisTypeLabel(thesis.type, lang),
    thesisTypeLabelFi: thesisTypeLabel(thesis.type, "fi"),
    thesisTypeLabelEn: thesisTypeLabel(thesis.type, "en"),
    thesisRole: pickString(thesis.thesisRole),
    abstract: pickString(thesis.abstract),
    abstractParagraphs: abstractParagraphs(thesis.abstract),
    abstractSnippet: abstractSnippet(thesis.abstract),
    keywords: toArray(thesis.keywords).map((item) => String(item).trim()).filter(Boolean),
    researchLine: pickString(thesis.researchLine),
    researchThemes: toArray(thesis.researchThemes).map((item) => String(item).trim()).filter(Boolean),
    researchAudience: toArray(thesis.researchAudience).map((item) => String(item).trim()).filter(Boolean),
    citationApa: pickString(thesis.citationApa),
    citationStyle: pickString(thesis.citationStyle),
    lang,
    sourceLanguage: pickString(thesis.language),
    languageLabel: thesisLanguageLabel(thesis.language, lang),
    categories,
    contexts,
    datePublished: buildDatePublished(thesis.year),
    schemaAuthors: toArray(thesis.authors).map((name) => ({
      "@type": "Person",
      name: String(name).trim()
    })).filter((item) => item.name),
    contentType: "thesis"
  };

  // TH-CITE1 Phase 1: additive canonical CSL projection. The
  // existing citationApa field is preserved byte-identically; a new
  // detail.csl field is added so Phase 3 templates and the Phase 5
  // Pagefind result meta can compose their APA string from the same
  // shared renderer publications already use.
  detail.csl = buildThesisCslItem(detail);
  return detail;
}

function sortThesisDetails(items) {
  return toArray(items).slice().sort((a, b) => {
    const yearA = Number.parseInt(a?.year || "0", 10) || 0;
    const yearB = Number.parseInt(b?.year || "0", 10) || 0;
    if (yearA !== yearB) return yearB - yearA;
    return String(a?.title || "").localeCompare(String(b?.title || ""), "fi");
  });
}

function buildCanonicalThesisDetailsModel(thesesData) {
  const canonicalTheses = collectCanonicalTheses(thesesData);
  const items = sortThesisDetails(
    canonicalTheses
      .map(buildThesisDetailModel)
      .filter(Boolean)
  );

  const byId = Object.fromEntries(items.map((item) => [item.id, item]));

  return {
    count: items.length,
    items,
    byId
  };
}

async function getThesisDetailById(stableId) {
  const model = await module.exports();
  return model.byId[pickString(stableId)] || null;
}

async function loadThesisDetailsData() {
  const thesesData = await loadTheses();
  return buildCanonicalThesisDetailsModel(thesesData);
}

module.exports = loadThesisDetailsData;
module.exports.extractStableThesisId = extractStableThesisId;
module.exports.normalizeThesisLang = normalizeThesisLang;
module.exports.collectCanonicalTheses = collectCanonicalTheses;
module.exports.findCanonicalThesisById = findCanonicalThesisById;
module.exports.buildThesisDetailModel = buildThesisDetailModel;
module.exports.buildCanonicalThesisDetailsModel = buildCanonicalThesisDetailsModel;
module.exports.getThesisDetailById = getThesisDetailById;

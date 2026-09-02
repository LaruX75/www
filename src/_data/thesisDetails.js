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

// Normalize an OuluREPO dc.date.issued string into a { precision, sortKey }
// pair used by the canonical thesis comparator. Precision preserves the
// real source resolution (day / month / year / none) so year-only records
// do not falsely outrank year+month or year+month+day records via a
// fabricated January 1 timestamp. `sortKey` is a lexicographically-
// comparable normalized ISO-shape string padded to the actual precision.
function normalizeIssuedDate(value) {
  const raw = pickString(value);
  if (!raw) return { precision: "none", sortKey: "", raw: "" };

  // Match YYYY-MM-DD (with optional time), then YYYY-MM, then YYYY.
  const dayMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dayMatch) {
    return {
      precision: "day",
      sortKey: `${dayMatch[1]}-${dayMatch[2]}-${dayMatch[3]}`,
      raw
    };
  }
  const monthMatch = raw.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch) {
    return {
      precision: "month",
      sortKey: `${monthMatch[1]}-${monthMatch[2]}`,
      raw
    };
  }
  const yearMatch = raw.match(/^(\d{4})/);
  if (yearMatch) {
    return {
      precision: "year",
      sortKey: yearMatch[1],
      raw
    };
  }
  return { precision: "none", sortKey: "", raw };
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
    issuedDate: pickString(thesis.issuedDate),
    issuedPrecision: normalizeIssuedDate(thesis.issuedDate).precision,
    issuedSortKey: normalizeIssuedDate(thesis.issuedDate).sortKey || pickString(thesis.year),
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

// Canonical thesis chronological comparator.
//
// Ordering (descending recency):
//   1. issuedSortKey — DESC lexicographical compare (works across day /
//      month / year precisions because normalizeIssuedDate emits
//      right-truncated but same-prefix keys; a fabricated Jan-1 timestamp
//      is never introduced).
//   2. year DESC as fallback when a record has no issuedSortKey.
//   3. Title ASC (fi locale) as deterministic tie-break.
//   4. Stable id fallback as final tie-break.
//
// Same-year records that share their year but differ in month/day now
// order by their real source date instead of alphabetical-by-title.
function compareThesisDetailChronology(a, b) {
  const keyA = String(a?.issuedSortKey || a?.year || "");
  const keyB = String(b?.issuedSortKey || b?.year || "");
  if (keyA !== keyB) return keyB.localeCompare(keyA);
  const yearA = Number.parseInt(a?.year || "0", 10) || 0;
  const yearB = Number.parseInt(b?.year || "0", 10) || 0;
  if (yearA !== yearB) return yearB - yearA;
  const titleDiff = String(a?.title || "").localeCompare(String(b?.title || ""), "fi");
  if (titleDiff !== 0) return titleDiff;
  return String(a?.id || "").localeCompare(String(b?.id || ""));
}

function sortThesisDetails(items) {
  return toArray(items).slice().sort(compareThesisDetailChronology);
}

function buildCanonicalThesisDetailsModel(thesesData) {
  const canonicalTheses = collectCanonicalTheses(thesesData);
  const items = sortThesisDetails(
    canonicalTheses
      .map(buildThesisDetailModel)
      .filter(Boolean)
  );

  const byId = Object.fromEntries(items.map((item) => [item.id, item]));

  // THESIS-HUB-02: centralised archive grouping.
  // These three arrays are the single source of truth for both the hub
  // landing (latest 5 per group) and the three SSR paginated archives
  // (/opinnaytteet/gradut/, /kandit/, /tarkastetut/ + EN counterparts).
  // They must use the same canonical comparator so that
  // `archive.slice(0, 5) === hub.latest` remains an invariant.
  const advisedMasters = items.filter(
    (item) => item.thesisType === "masterThesis" && item.thesisRole === "advised"
  );
  const advisedBachelors = items.filter(
    (item) => item.thesisType === "bachelorThesis" && item.thesisRole === "advised"
  );
  const reviewed = items.filter((item) => item.thesisRole === "reviewed");

  return {
    count: items.length,
    items,
    byId,
    advisedMasters,
    advisedBachelors,
    reviewed
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
module.exports.normalizeIssuedDate = normalizeIssuedDate;
module.exports.compareThesisDetailChronology = compareThesisDetailChronology;
module.exports.collectCanonicalTheses = collectCanonicalTheses;
module.exports.findCanonicalThesisById = findCanonicalThesisById;
module.exports.buildThesisDetailModel = buildThesisDetailModel;
module.exports.buildCanonicalThesisDetailsModel = buildCanonicalThesisDetailsModel;
module.exports.getThesisDetailById = getThesisDetailById;

/**
 * toThesesCollectionItems(thesesData)
 *
 * Muuntaa src/_data/theses.js:n async-datan Eleventy-collection-tyylisiksi
 * virtuaalisiksi item-objekteiksi. Käytetään eleventy.collections.js:n
 * "theses"-collectionissa. Yhdenmukainen loadResearchfiContent.toCollectionItems-
 * patternin kanssa (src/_data/researchfiContent.js).
 *
 * Miksi virtuaali-collection: opinnäytteet eivat ole Eleventyn markdown-tiedostoja
 * vaan async-dataa OuluREPO-API:sta. Jotta build-time discovery/topic-scoring
 * (topicItemScore, topicItemsFromCollections) voi käsitellä niitä samassa
 * uniqueContentItems-joukossa kuin blog/publications/politics/media/presentations,
 * ne pitää esittää samanmuotoisina collection-itemeinä.
 *
 * HUOM: PR-0 (v4.3): tämä on infrastruktuurimuutos. Ei muuta topicItemScoren
 * toimintaa — PR-1 lisää "thesis" scoringin sallittujen sisältötyyppien
 * joukkoon.
 */

const { deriveThesisMetadata } = require("./thesisDerivedMetadata");

function thesisSlug(link) {
  const numeric = String(link || "").match(/\/(\d+)\/?$/);
  if (numeric) return `oulurepo-${numeric[1]}`;
  const fallback = String(link || "").replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase();
  return fallback || "unknown";
}

function parseYear(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const match = String(value || "").match(/^\d{4}$/);
  return match ? parseInt(match[0], 10) : null;
}

function toDate(year) {
  if (!year) return new Date(0);
  const iso = `${year}-01-01T00:00:00.000Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v || "").trim()).filter(Boolean);
}

function toCollectionItem(thesis, thesisRole) {
  const link = String(thesis?.link || "").trim();
  const title = String(thesis?.title || "").trim();
  if (!link || !title) return null;

  const year = parseYear(thesis.year);
  const slug = thesisSlug(link);
  const { categories, contexts } = deriveThesisMetadata(thesis);

  return {
    url: link,
    inputPath: `/virtual/theses/${slug}.json`,
    fileSlug: `thesis-${slug}`,
    date: toDate(year),
    data: {
      // Yleiset kentat (yhdenmukainen muiden collection-itemien kanssa)
      title,
      description: String(thesis.abstract || "").trim(),
      year,
      lang: (thesis.language === "en" || thesis.language === "eng") ? "en" : "fi",
      authors: normalizeArray(thesis.authors),
      keywords: normalizeArray(thesis.keywords),
      categories,
      contexts,
      tags: ["theses"],  // topicItemScore tunnistaa collection-jasenyyden
      type: "thesis",
      contentType: "thesis",

      // Thesis-spesifiset kentat
      thesisType: thesis.type || null,
      thesisRole: thesisRole || null,
      subjects: normalizeArray(thesis.subjects),

      // Curated tutkimusohjelma-metadata (src/curated/research-thesis-meta.json)
      researchLine: thesis.researchLine || null,
      researchThemes: normalizeArray(thesis.researchThemes),
      researchAudience: normalizeArray(thesis.researchAudience),
      researchPriority: Number.isFinite(thesis.researchPriority) ? thesis.researchPriority : 0,
      researchSummary: thesis.researchSummary || null,
      researchExcluded: thesis.researchExcluded === true,

      // Muut alkuperaiset kentat
      licenseUri: thesis.licenseUri || null,
      okmType: thesis.okmType || null,
      citationApa: thesis.citationApa || null,
      citationStyle: thesis.citationStyle || null
    }
  };
}

/**
 * toThesesCollectionItems(thesesData)
 *
 * @param {object} thesesData — src/_data/theses.js:n palauttama objekti
 *   { gradut, kandit, reviewerOnly, stats, ... }
 * @returns {Array} — Eleventy-collection-tyyliset item-objektit,
 *   sortattu vuosi desc → otsikko asc. thesisRole:n avulla tunnistaa
 *   ohjattu ("advised") vs. tarkastettu ("reviewed").
 */
function toThesesCollectionItems(thesesData) {
  if (!thesesData || typeof thesesData !== "object") return [];

  const sources = [
    { items: thesesData.gradut || [], role: "advised" },
    { items: thesesData.kandit || [], role: "advised" },
    { items: thesesData.reviewerOnly || [], role: "reviewed" }
  ];

  const seen = new Set();
  const collection = [];
  for (const { items, role } of sources) {
    for (const thesis of items) {
      const item = toCollectionItem(thesis, role);
      if (!item) continue;
      if (seen.has(item.url)) continue;
      seen.add(item.url);
      collection.push(item);
    }
  }

  // Sorttaa uusin ensin, samana vuonna otsikon mukaan
  collection.sort((a, b) => {
    const yearA = a.data.year || 0;
    const yearB = b.data.year || 0;
    if (yearA !== yearB) return yearB - yearA;
    return String(a.data.title).localeCompare(String(b.data.title), "fi");
  });

  return collection;
}

module.exports = toThesesCollectionItems;
module.exports.toCollectionItem = toCollectionItem;
module.exports.thesisSlug = thesisSlug;
module.exports.parseYear = parseYear;

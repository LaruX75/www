/**
 * /data/theses.json — opinnaytteet OuluREPO:sta.
 *
 * HUOM: Toisin kuin muut JSON-endpointit, theses ei kayta
 * `toPublicContentRecord`:ia. Syy: opinnaytteet eivat ole Eleventy-
 * collection-itemeja vaan async dataa src/_data/theses.js:sta. Jokaisella
 * on ulkoinen OuluREPO-lahde. Archive-UI kayttaa T3:sta alkaen local
 * `pageUrl`:ia ensisijaisena detail-linkkina, mutta `url` pidetaan edelleen
 * OuluREPO-osoitteena yhteensopivuuden vuoksi.
 *
 * Serializer on kuitenkin muotoilullisesti yhdenmukainen: sama version/
 * generatedAt/count/items-kuori kuin muissa endpointeissa.
 *
 * Sisallyttaa: theses.gradut (masterThesis) + theses.kandit (bachelorThesis)
 * + theses.reviewerOnly (tarkastukset, PR-C1:sta alkaen).
 *
 * Tutkimuslinja-metatiedot (researchLine, researchThemes, researchAudience,
 * researchPriority) lisatty PR-C1:ssa 2026-08-08 valmistelemaan
 * /opinnaytteet/ + /en/theses/ progressive enhancement -migraatiota
 * (Vaihe C). Ne tulevat src/_data/theses.js:n withCitation:sta joka
 * lookuppaa CURATED_THESIS_META:sta.
 */

const { JSON_SCHEMA_VERSION } = require("./_shared");
const { deriveThesisMetadata } = require("../_utils/thesisDerivedMetadata");

function normalizeArray(value) {
  if (!Array.isArray(value)) return null;
  const filtered = value.filter(Boolean).map((v) => String(v).trim()).filter(Boolean);
  return filtered.length ? filtered : null;
}

function pickString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function omitEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function toThesisRecord(t, lang, source) {
  const link = pickString(t?.link);
  const title = pickString(t?.title);
  if (!link || !title) return null;

  const year = t?.year && /^\d{4}$/.test(String(t.year)) ? parseInt(t.year, 10) : null;
  const { categories, contexts } = deriveThesisMetadata(t);
  const contentTypeLabel = t?.type === "masterThesis"
    ? (lang === "en" ? "Master's thesis" : "Pro gradu")
    : (lang === "en" ? "Bachelor's thesis" : "Kandidaatintutkielma");

  const priority = Number.isFinite(t?.researchPriority) ? t.researchPriority : null;

  return omitEmpty({
    id: link,
    url: link,
    pageUrl: pickString(t?.pageUrl),
    sourceUrl: link,
    title,
    description: pickString(t?.abstract),
    year,
    lang,
    contentType: "thesis",
    contentTypeLabel,
    section: "publications",
    thesisType: pickString(t?.type),
    authors: normalizeArray(t?.authors),
    keywords: normalizeArray(t?.keywords),
    categories: normalizeArray(categories),
    contexts: normalizeArray(contexts),

    // Rooli: "advised" (gradu tai kandi jonka Jari on ohjannut) tai
    // "reviewed" (Jari on tarkastaja mutta ei ohjaaja)
    thesisRole: pickString(source),

    // Tutkimuslinja-metatiedot CURATED_THESIS_META:sta
    // (kts. src/curated/research-thesis-meta.json). Omitempty poistaa
    // nollat/tyhjat, joten kaikki opinnaytteet eivat saa naita kenttia.
    researchLine: pickString(t?.researchLine),
    researchThemes: normalizeArray(t?.researchThemes),
    researchAudience: normalizeArray(t?.researchAudience),
    researchPriority: priority,
    researchSummary: pickString(t?.researchSummary),
    citationApa: pickString(t?.citationApa)
  });
}

module.exports = class {
  data() {
    return {
      permalink: "/data/theses.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    const theses = data.theses || {};
    // PR-C1: sisallyta myös reviewerOnly (tarkastajana toimineet). Merkataan
    // thesisRole:"advised" gradut+kandit, "reviewed" tarkastukset — /opinnaytteet/
    // ja /en/theses/ osaavat suodattaa naiden mukaan.
    const advisedItems = [...(theses.gradut || []), ...(theses.kandit || [])];
    const reviewedItems = [...(theses.reviewerOnly || [])];

    const lang = "fi";
    const seen = new Set();
    const records = [];
    for (const t of advisedItems) {
      const record = toThesisRecord(t, lang, "advised");
      if (!record) continue;
      if (seen.has(record.url)) continue;
      seen.add(record.url);
      records.push(record);
    }
    for (const t of reviewedItems) {
      const record = toThesisRecord(t, lang, "reviewed");
      if (!record) continue;
      if (seen.has(record.url)) continue;
      seen.add(record.url);
      records.push(record);
    }
    records.sort((a, b) => {
      const yearA = a.year || 0;
      const yearB = b.year || 0;
      if (yearA === yearB) return String(a.title).localeCompare(String(b.title));
      return yearB - yearA;
    });

    return JSON.stringify({
      version: JSON_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      count: records.length,
      items: records
    }, null, 2);
  }
};

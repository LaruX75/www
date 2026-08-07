/**
 * /data/theses.json — opinnaytteet OuluREPO:sta.
 *
 * HUOM: Toisin kuin muut JSON-endpointit, theses ei kayta
 * `toPublicContentRecord`:ia. Syy: opinnaytteet eivat ole Eleventy-
 * collection-itemeja vaan async dataa src/_data/theses.js:sta. Jokaisella
 * on ulkoinen `link` (OuluREPO-URL), ei sisaista sivustou URL:ia.
 *
 * Serializer on kuitenkin muotoilullisesti yhdenmukainen: sama version/
 * generatedAt/count/items-kuori kuin muissa endpointeissa.
 *
 * Sisallyttaa: theses.gradut (masterThesis) + theses.kandit (bachelorThesis).
 * Ei sisallyta theses.reviewerOnly:ta (pelkat tarkastukset, ei ohjatut).
 */

const { JSON_SCHEMA_VERSION } = require("./_shared");

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

function toThesisRecord(t, lang) {
  const link = pickString(t?.link);
  const title = pickString(t?.title);
  if (!link || !title) return null;

  const year = t?.year && /^\d{4}$/.test(String(t.year)) ? parseInt(t.year, 10) : null;
  const contentTypeLabel = t?.type === "masterThesis"
    ? (lang === "en" ? "Master's thesis" : "Pro gradu")
    : (lang === "en" ? "Bachelor's thesis" : "Kandidaatintutkielma");

  return omitEmpty({
    id: link,
    url: link,
    title,
    description: pickString(t?.abstract),
    year,
    lang,
    contentType: "thesis",
    contentTypeLabel,
    section: "publications",
    thesisType: pickString(t?.type),
    authors: normalizeArray(t?.authors),
    keywords: normalizeArray(t?.keywords)
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
    const items = [
      ...(theses.gradut || []),
      ...(theses.kandit || [])
    ];

    const lang = "fi";
    const seen = new Set();
    const records = [];
    for (const t of items) {
      const record = toThesisRecord(t, lang);
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

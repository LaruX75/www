/**
 * /data/researchfi.json — Research.fi -tieteelliset julkaisut.
 *
 * Data tulee async src/_data/researchfi.js:sta joka lataa Research.fi API:sta.
 * Toisin kuin muut endpointit, researchfi-julkaisut eivat ole omia sivuja
 * eivatka kuulu Eleventy-collectioneihin — data on itsenainen listaus.
 *
 * Formaatti kuoreltaan sama kuin muut /data/*.json:it (version, generatedAt,
 * count, items).
 */

const { JSON_SCHEMA_VERSION } = require("./_shared");

function pickString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function pickNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function omitEmpty(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out;
}

function toResearchfiRecord(pub, extras) {
  const title = pickString(pub?.title);
  if (!title) return null;

  const anchorId = pickString(pub?.anchorId);
  const doi = pickString(pub?.doi);
  const meta = (anchorId && extras?.publicationMetaByAnchor?.[anchorId]) || {};
  const citationCount = doi
    ? (extras?.doiCitations?.[doi.toLowerCase()] || 0)
    : 0;

  return omitEmpty({
    id: anchorId || pickString(pub?.url) || title,
    anchorId,
    title,
    year: pickNumber(pub?.year),
    authors: pickString(pub?.authors),
    journal: pickString(pub?.journal),
    url: pickString(pub?.url),
    doi,
    doiUrl: pickString(pub?.doiUrl),
    type: pickString(pub?.typeFi),
    typeCode: pickString(pub?.typeCode),
    peerReviewed: pub?.peerReviewed === true,
    openAccess: pickNumber(pub?.openAccess),
    volume: pickString(pub?.volume),
    issue: pickString(pub?.issue),
    pages: pickString(pub?.pages),
    publisher: pickString(pub?.publisher),
    isbn: pickString(pub?.isbn),
    jufoLevel: pickNumber(pub?.jufoLevel),
    citationCount,
    researchLine: pickString(meta.researchLine),
    researchThemes: Array.isArray(meta.researchThemes) ? meta.researchThemes : undefined,
    researchAudience: Array.isArray(meta.researchAudience) ? meta.researchAudience : undefined,
    contentType: "scientificPublication",
    section: "publications"
  });
}

module.exports = class {
  data() {
    return {
      permalink: "/data/researchfi.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    const extras = {
      publicationMetaByAnchor: data.researchProgram?.publicationMetaByAnchor || {},
      doiCitations: data.semanticscholar?.metrics?.doiCitations || {}
    };
    const items = (data.researchfi || [])
      .map((pub) => toResearchfiRecord(pub, extras))
      .filter(Boolean)
      .sort((a, b) => {
        const yearA = a.year || 0;
        const yearB = b.year || 0;
        if (yearA === yearB) return String(a.title).localeCompare(String(b.title));
        return yearB - yearA;
      });

    return JSON.stringify({
      version: JSON_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      count: items.length,
      items
    }, null, 2);
  }
};

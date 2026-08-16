/**
 * publicationCsl — Canonical Publication → CSL-JSON projection.
 *
 * Primary API: buildCslItem(canonicalPublication) → CSL object | null.
 *
 * Contract:
 *   - Deterministic, side-effect free.
 *   - Accepts the current canonical publication shape used across
 *     publicationsPage / publicationDetails / researchfiContent /
 *     publicationsFindExplore.
 *   - Returns a CSL-JSON compatible object with only the fields the
 *     canonical record can support, or null when essential fields
 *     (id + title) are missing.
 *   - Never mutates the input.
 *   - Never invents data. Empty / unknown values are omitted.
 *   - Preserves the source/canonical semantics — CSL is an additive
 *     projection layer, not a rewrite of the underlying record.
 */

"use strict";

const OKM_TO_CSL_TYPE = Object.freeze({
  A1: "article-journal",
  A2: "article-journal",
  A3: "article-journal",
  A4: "paper-conference",
  B1: "article-magazine",
  B2: "chapter",
  B3: "chapter",
  C1: "book",
  C2: "book",
  D1: "article-magazine",
  D2: "article-magazine",
  D3: "article-magazine",
  D4: "article-magazine",
  D5: "article-magazine",
  D6: "article-magazine",
  E1: "article-newspaper",
  E2: "article-newspaper",
  E3: "article-newspaper",
  F1: "chapter",
  F2: "chapter",
  F3: "chapter",
  G1: "thesis",
  G2: "thesis",
  G3: "thesis",
  G4: "thesis",
  G5: "thesis"
});

const OKM_TO_CSL_GENRE = Object.freeze({
  G1: "Monograph thesis",
  G2: "Master's thesis",
  G3: "Licentiate thesis",
  G4: "Doctoral dissertation",
  G5: "Doctoral dissertation (article-based)"
});

function pickString(value) {
  if (value === null || value === undefined) return "";
  const s = String(value).trim();
  return s;
}

function pickInt(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const int = Math.trunc(n);
  return int > 0 ? int : null;
}

function normalizeDoi(value) {
  const raw = pickString(value).toLowerCase();
  if (!raw) return "";
  const stripped = raw
    .replace(/^https?:\/\/(dx\.)?doi\.org\//, "")
    .replace(/^doi:/, "")
    .trim();
  if (!stripped || !stripped.startsWith("10.")) return "";
  return stripped;
}

function normalizePages(value) {
  const raw = pickString(value);
  if (!raw) return "";
  return raw.replace(/–|—/g, "-").replace(/\s+/g, "");
}

function normalizeUrl(value) {
  const raw = pickString(value);
  if (!raw) return "";
  if (!/^https?:\/\//i.test(raw)) return "";
  return raw;
}

function normalizeLang(value) {
  const raw = pickString(value).toLowerCase();
  if (!raw) return "";
  if (raw === "fi" || raw === "en" || raw === "sv") return raw;
  return "";
}

function parseAuthorPart(raw) {
  const s = pickString(raw);
  if (!s) return null;
  const commaIdx = s.indexOf(",");
  if (commaIdx > 0) {
    const family = s.slice(0, commaIdx).trim();
    const given = s.slice(commaIdx + 1).trim();
    if (family && given) return { family, given };
    if (family) return { family };
  }
  return { literal: s };
}

function parseAuthors(value) {
  const raw = pickString(value);
  if (!raw) return [];
  const parts = raw.split(/\s*[;\n]\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return [];
  const parsed = parts.map(parseAuthorPart).filter(Boolean);
  return parsed;
}

function issuedFromYear(year) {
  const y = pickInt(year);
  if (!y) return null;
  return { "date-parts": [[y]] };
}

function omitEmpty(obj) {
  const out = {};
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (value === null || value === undefined) return;
    if (typeof value === "string" && value === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
  });
  return out;
}

/**
 * Build a CSL-JSON item from a canonical publication record.
 *
 * @param {object} canonicalPublication
 * @returns {object|null}
 */
function buildCslItem(canonicalPublication) {
  if (!canonicalPublication || typeof canonicalPublication !== "object") {
    return null;
  }

  const id = pickString(canonicalPublication.anchorId)
    || pickString(canonicalPublication.publicationId)
    || pickString(canonicalPublication.id);
  const title = pickString(canonicalPublication.title);
  if (!id || !title) return null;

  const typeCode = pickString(canonicalPublication.typeCode).toUpperCase();
  const cslType = OKM_TO_CSL_TYPE[typeCode] || "article-journal";
  const genre = OKM_TO_CSL_GENRE[typeCode] || "";

  const authors = parseAuthors(canonicalPublication.authors);
  const containerTitle = pickString(canonicalPublication.journal);
  const publisher = pickString(canonicalPublication.publisher);
  const volume = pickString(canonicalPublication.volume);
  const issue = pickString(canonicalPublication.issue);
  const page = normalizePages(canonicalPublication.pages);
  const doi = normalizeDoi(canonicalPublication.doi);
  const url = normalizeUrl(canonicalPublication.doiUrl || canonicalPublication.url);
  const isbn = pickString(canonicalPublication.isbn);
  const issued = issuedFromYear(canonicalPublication.year);
  const language = normalizeLang(canonicalPublication.lang);

  return omitEmpty({
    id,
    type: cslType,
    genre: genre || undefined,
    title,
    author: authors.length > 0 ? authors : undefined,
    "container-title": containerTitle || undefined,
    publisher: publisher || undefined,
    volume: volume || undefined,
    issue: issue || undefined,
    page: page || undefined,
    DOI: doi || undefined,
    URL: url || undefined,
    ISBN: isbn || undefined,
    issued: issued || undefined,
    language: language || undefined
  });
}

module.exports = {
  OKM_TO_CSL_TYPE,
  OKM_TO_CSL_GENRE,
  buildCslItem,
  // exported for tests
  parseAuthors,
  normalizeDoi,
  normalizePages
};

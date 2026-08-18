/**
 * thesisCsl — canonical thesis → CSL-JSON adapter.
 *
 * TH-CITE1 Phase 1. Thin adapter that projects the canonical OuluREPO
 * thesis object into a CSL item suitable for the existing shared
 * citation renderer (src/js/publication-citation.js), which already
 * supports `type: "thesis"` in every style branch.
 *
 * Publications (src/_utils/publicationCsl.js) and theses (this file)
 * are separate adapters that both feed the same shared renderer. The
 * publications buildCslItem is intentionally not extended — thesis
 * semantics differ from publication semantics.
 *
 * Contract:
 *   - Deterministic, side-effect free.
 *   - Accepts either a canonical thesis record (with `link`,
 *     `authors[]`, `year`, `type`, `language`) OR a built
 *     `thesisDetail` model (with `pageUrl`, `authorLine`, `sourceUrl`,
 *     `thesisType`, `lang`) — the two shapes overlap enough that a
 *     small pick-what-you-have projection works for both.
 *   - Returns a CSL-JSON compatible object or null when identity
 *     fields (`id` + `title`) are missing.
 *   - Never mutates the input.
 *   - Never invents data; empty / unknown fields are omitted.
 *
 * FI/EN policy: `genre` and `publisher` are canonical Finnish (matches
 * the current server-side `theses.js#buildApaCitation` output on the
 * detail page + /data/theses.json). The shared renderer will localize
 * for /en/ surfaces via a future `lang` display map (Phase 2 scope).
 */

"use strict";

const { parseAuthors } = require("./publicationCsl");

const THESIS_GENRE_FI = Object.freeze({
  masterThesis: "Pro gradu -tutkielma",
  bachelorThesis: "Kandidaatintutkielma",
  doctoralThesis: "Väitöskirja",
  licentiateThesis: "Lisensiaatintutkielma"
});
const THESIS_GENRE_DEFAULT_FI = "Opinnäyte";
const THESIS_PUBLISHER = "Oulun yliopisto";

function pickString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function pickYear(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const int = Math.trunc(n);
  return int > 0 ? int : null;
}

function pickAuthorsInput(thesis) {
  // Canonical thesis carries `authors[]`. Built thesisDetail carries
  // `authorLine` as a "; "-joined string. parseAuthors handles both:
  // array via `;` split, or the joined string directly.
  if (Array.isArray(thesis.authors) && thesis.authors.length > 0) {
    return thesis.authors.map((a) => pickString(a)).filter(Boolean).join("; ");
  }
  return pickString(thesis.authorLine);
}

function pickIdentity(thesis) {
  return pickString(thesis.pageUrl)
    || pickString(thesis.id)
    || pickString(thesis.sourceUrl)
    || pickString(thesis.link);
}

function pickUrl(thesis) {
  return pickString(thesis.sourceUrl) || pickString(thesis.link);
}

function pickType(thesis) {
  return pickString(thesis.thesisType) || pickString(thesis.type);
}

function pickLanguage(thesis) {
  const raw = (pickString(thesis.lang) || pickString(thesis.language)).toLowerCase();
  if (!raw) return "";
  if (raw === "fi" || raw === "fin") return "fi";
  if (raw === "en" || raw === "eng") return "en";
  if (raw === "sv" || raw === "swe") return "sv";
  return "";
}

function issuedFromYear(year) {
  const y = pickYear(year);
  if (!y) return null;
  return { "date-parts": [[y]] };
}

function omitEmpty(obj) {
  const out = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Build a CSL-JSON item from a canonical / detail thesis object.
 *
 * @param {object} thesis
 * @returns {object|null}
 */
function buildThesisCslItem(thesis) {
  if (!thesis || typeof thesis !== "object") return null;

  const id = pickIdentity(thesis);
  const title = pickString(thesis.title);
  if (!id || !title) return null;

  const type = pickType(thesis);
  const genre = THESIS_GENRE_FI[type] || THESIS_GENRE_DEFAULT_FI;
  const authors = parseAuthors(pickAuthorsInput(thesis));
  const issued = issuedFromYear(thesis.year);
  const url = pickUrl(thesis);
  const language = pickLanguage(thesis);

  return omitEmpty({
    id,
    type: "thesis",
    title,
    author: authors.length > 0 ? authors : undefined,
    issued: issued || undefined,
    genre,
    publisher: THESIS_PUBLISHER,
    URL: /^https?:\/\//i.test(url) ? url : undefined,
    language: language || undefined
  });
}

module.exports = {
  THESIS_GENRE_FI,
  THESIS_GENRE_DEFAULT_FI,
  THESIS_PUBLISHER,
  buildThesisCslItem
};

"use strict";

/**
 * kynastaHubPage — single-owner projection of the seven canonical
 * Kynästä subgroups into the shape rendered by the SSR hub.
 *
 *   canonical Eleventy collections
 *      ↓
 *   buildKynastaHubModel({ collections, lang })
 *      ↓
 *   {
 *     totalCount,
 *     writings:  { count, groups: { blog, opinion, column }        },
 *     council:   { count, groups: { speeches, initiatives }        },
 *     expert:    { count, groups: { statements, publicSpeeches }   },
 *     lang
 *   }
 *
 * Each `groups.<key>` is `{ count, latestItems }` with `latestItems`
 * as the 5 newest canonical records, sorted by the group's authoritative
 * date field (see DATE_FIELDS below). This projection is the SINGLE
 * OWNER for hub grouping/sorting/latest-N — Nunjucks templates must
 * consume it directly and MUST NOT reimplement any classification,
 * sorting or slicing.
 *
 * Sources (audited 2026-09-02):
 *   blog             → collections.blog
 *   opinion          → collections.pub_mielipide     (type == "mielipide")
 *   column           → collections.pub_kolumni       (type == "kolumni")
 *   councilSpeech    → collections.pub_puhe filtered by isCouncilSpeech()
 *   initiative       → collections.politics
 *   statement        → collections.publications filtered by type=="lausunto"
 *   publicSpeech     → collections.pub_puhe filtered by NOT isCouncilSpeech()
 */

// VALTUUSTOTYO-SSR-01: council-speech classification is now single-owner
// in src/_utils/councilSpeech.js. Re-exported from this module so
// existing importers (tests, other consumers) continue to work.
const {
  isCouncilSpeech: sharedIsCouncilSpeech
} = require("./councilSpeech");

const LATEST_LIMIT = 5;

// Date preference per group. Group 5 (initiatives) uses `meetingDate`
// with `date` fallback to preserve `/valtuustotyo/` archive ordering
// parity. All others use their canonical published date.
const DATE_FIELDS = {
  blog: ["date"],
  opinion: ["date"],
  column: ["date"],
  councilSpeech: ["date"],
  initiative: ["meetingDate", "date"],
  statement: ["date"],
  publicSpeech: ["date"]
};

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

// VALTUUSTOTYO-SSR-01: single-owner classifier lives in
// src/_utils/councilSpeech.js. Kept as a local export so this
// module's public surface (previously exposed `isCouncilSpeech`)
// remains stable. The shared implementation drops the "type != puhe"
// pre-check on Kynästä's council branch because the caller already
// passes `collections.pub_puhe` (guaranteed type=="puhe"); the
// shared helper's stricter guard is safe.
function isCouncilSpeech(item) {
  return sharedIsCouncilSpeech(item);
}

function resolveDate(item, fields) {
  const data = item?.data || {};
  for (const field of fields) {
    // Frontmatter date lives on data; Eleventy-native page date on item.date
    const raw = data[field] != null ? data[field] : item?.[field];
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
    const parsed = raw ? new Date(raw) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
  }
  // Eleventy-native page.date fallback (blog collection primary case)
  if (item?.date instanceof Date) return item.date;
  return null;
}

function compareByDateDesc(fields) {
  return (a, b) => {
    const da = resolveDate(a, fields);
    const db = resolveDate(b, fields);
    const va = da ? da.getTime() : -Infinity;
    const vb = db ? db.getTime() : -Infinity;
    if (va === vb) {
      // Deterministic tie-break: title asc for stable ordering
      return String(a?.data?.title || "").localeCompare(String(b?.data?.title || ""), "fi");
    }
    return vb - va;
  };
}

function normalizeItem(item, groupKey, fields) {
  const data = item?.data || {};
  const date = resolveDate(item, fields);
  return {
    // pageUrl: the frontmatter-declared canonical URL wins (some
    // publications point to external landings via data.url); Eleventy's
    // computed permalink is the fallback for local pages.
    pageUrl: pickString(data.url) || pickString(item?.url),
    title: pickString(data.title),
    date: date ? date.toISOString().slice(0, 10) : "",
    year: date ? String(date.getUTCFullYear()) : "",
    lang: pickString(data.lang) || "fi",
    groupKey,
    // Secondary orientation labels (used sparingly by the subsection
    // include; templates decide what to render)
    publication: pickString(data.publication),
    event: pickString(data.event),
    speechContext: pickString(data.speechContext)
  };
}

function groupFromCollection(collection, groupKey, filter) {
  const fields = DATE_FIELDS[groupKey];
  const filtered = toArray(collection).filter((item) => (filter ? filter(item) : true));
  const sorted = filtered.slice().sort(compareByDateDesc(fields));
  const latestItems = sorted.slice(0, LATEST_LIMIT).map((item) => normalizeItem(item, groupKey, fields));
  return { count: filtered.length, latestItems };
}

// Historically no blog / publication content on this site declares
// `lang: en` — the EN surfaces (e.g. /en/writings/) display the FI
// canonical corpus with English UI/framing around it. The Kynästä hub
// follows the same convention: EN scope renders the canonical writings
// items and lets the template decide the language of the surrounding
// labels + CTAs. If future items ever declare `lang: en`, that lang
// value is passed through in the normalized item shape so consumers
// can render language chips without changing this projection.
function filterByLang(collection /* , _lang */) {
  return toArray(collection);
}

/**
 * Build the Kynästä hub projection.
 *
 * @param {object} args
 * @param {object} args.collections — Eleventy collections object
 * @param {string} [args.lang="fi"] — hub scope ("fi" or "en")
 * @returns {object} hub model
 */
function buildKynastaHubModel({ collections, lang = "fi" } = {}) {
  const c = collections || {};
  const normalizedLang = pickString(lang).toLowerCase() === "en" ? "en" : "fi";

  const writings = {
    blog: groupFromCollection(filterByLang(c.blog, normalizedLang), "blog"),
    opinion: groupFromCollection(filterByLang(c.pub_mielipide, normalizedLang), "opinion"),
    column: groupFromCollection(filterByLang(c.pub_kolumni, normalizedLang), "column")
  };
  const council = {
    speeches: groupFromCollection(c.pub_puhe, "councilSpeech", isCouncilSpeech),
    initiatives: groupFromCollection(c.politics, "initiative")
  };
  const expert = {
    statements: groupFromCollection(c.publications, "statement", (item) => item?.data?.type === "lausunto"),
    publicSpeeches: groupFromCollection(c.pub_puhe, "publicSpeech", (item) => !isCouncilSpeech(item))
  };

  const writingsCount = writings.blog.count + writings.opinion.count + writings.column.count;
  const councilCount = council.speeches.count + council.initiatives.count;
  const expertCount = expert.statements.count + expert.publicSpeeches.count;

  return {
    lang: normalizedLang,
    totalCount: writingsCount + councilCount + expertCount,
    writings: { count: writingsCount, groups: writings },
    council: { count: councilCount, groups: council },
    expert: { count: expertCount, groups: expert }
  };
}

module.exports = {
  LATEST_LIMIT,
  DATE_FIELDS,
  isCouncilSpeech,
  compareByDateDesc,
  normalizeItem,
  buildKynastaHubModel
};

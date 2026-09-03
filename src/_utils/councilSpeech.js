"use strict";

/**
 * councilSpeech — canonical single-owner classification + comparators
 * for Oulu city council speeches and initiatives (VALTUUSTOTYO-SSR-01).
 *
 * Consolidates the previously three-way duplicated `isCouncilSpeech()`
 * from:
 *   - `eleventy.collections.js:158-173` (build-time filter for the
 *     pub_puhe_valtuusto collection)
 *   - `src/_utils/kynastaHubPage.js:65-74` (Kynästä hub projection)
 *   - `src/valtuustotyo.njk:35-46` (inline Nunjucks in template)
 *
 * All three implementations were byte-identical in behaviour. Every
 * downstream consumer must import from this module so future
 * classification changes are single-owner.
 *
 * Rule (verbatim from the audit report):
 *   type == "puhe"
 *   AND (
 *     speechContext == "valtuusto"
 *     OR speechContext == "kyselytunti"
 *     OR (
 *       no explicit speechContext
 *       AND (
 *         event == "Oulun kaupunginvaltuusto"
 *         OR forum contains "Kaupunginvaltuusto"
 *       )
 *     )
 *   )
 */

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === null || value === undefined) return [];
  return [value];
}

/**
 * Council-speech classifier — canonical single-owner rule.
 * Works on Eleventy collection items (item.data...) and on serialized
 * public records where the raw item is passed as-is.
 */
function isCouncilSpeech(item) {
  const data = item?.data || {};
  if (data.type !== "puhe") return false;

  const speechContext = pickString(data.speechContext);
  if (speechContext) {
    return speechContext === "valtuusto" || speechContext === "kyselytunti";
  }

  if (pickString(data.event) === "Oulun kaupunginvaltuusto") return true;
  const forums = toArray(data.forum).map((f) => pickString(f));
  return forums.includes("Kaupunginvaltuusto");
}

/**
 * Canonical council-speech chronology comparator.
 *   date DESC → title fi-locale ASC → canonical URL ASC
 *
 * Matches the tie-break rule the Kynästä hub uses so that
 * `Kynästä.latest5 === Valtuustotyö.first5` invariant holds for the
 * shared corpus. Consumers may reuse this comparator both at
 * build-time (in the projection) and, if needed, at runtime.
 *
 * Accepts Eleventy items (`item.date`, `item.data.title`, `item.url`)
 * OR pre-normalized records (`.date`, `.title`, `.url` at top level).
 */
function compareByCouncilChronology(a, b) {
  const dateA = pickDate(a);
  const dateB = pickDate(b);
  const timeA = dateA ? dateA.getTime() : -Infinity;
  const timeB = dateB ? dateB.getTime() : -Infinity;
  if (timeA !== timeB) return timeB - timeA;
  const titleDiff = pickTitle(a).localeCompare(pickTitle(b), "fi");
  if (titleDiff !== 0) return titleDiff;
  return pickUrl(a).localeCompare(pickUrl(b));
}

/**
 * Canonical initiative chronology comparator.
 *   meetingDate → date fallback → DESC → title fi-locale ASC → URL ASC
 */
function compareByInitiativeChronology(a, b) {
  const dateA = pickDate(a, ["meetingDate", "date"]);
  const dateB = pickDate(b, ["meetingDate", "date"]);
  const timeA = dateA ? dateA.getTime() : -Infinity;
  const timeB = dateB ? dateB.getTime() : -Infinity;
  if (timeA !== timeB) return timeB - timeA;
  const titleDiff = pickTitle(a).localeCompare(pickTitle(b), "fi");
  if (titleDiff !== 0) return titleDiff;
  return pickUrl(a).localeCompare(pickUrl(b));
}

// Internal helpers — accept Eleventy items OR pre-normalized records.
function pickDate(item, fields = ["date"]) {
  const data = item?.data || {};
  for (const field of fields) {
    const raw = data[field] !== undefined ? data[field] : item?.[field];
    if (raw instanceof Date && !Number.isNaN(raw.getTime())) return raw;
    const parsed = raw ? new Date(raw) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
  }
  if (item?.date instanceof Date) return item.date;
  return null;
}

function pickTitle(item) {
  return String(item?.data?.title || item?.title || "").trim();
}

function pickUrl(item) {
  return String(item?.data?.url || item?.url || "").trim();
}

module.exports = {
  isCouncilSpeech,
  compareByCouncilChronology,
  compareByInitiativeChronology
};

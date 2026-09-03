"use strict";

/**
 * valtuustotyoPage — single-owner projection of /valtuustotyo/'s
 * archive corpus into an SSR-ready model (VALTUUSTOTYO-SSR-01).
 *
 *   canonical Eleventy collections
 *      + councilMeetingMeta / oukaCouncilSpeechProtocols / councilSpeechVideos
 *      ↓
 *   buildValtuustotyoPage({ collections, councilMeetingMeta,
 *                           oukaCouncilSpeechProtocols,
 *                           councilSpeechVideos })
 *      ↓
 *   {
 *     speeches:       [ normalized council-speech record, ... ]
 *     initiatives:    [ normalized initiative record, ... ]
 *     speechYears:    ["2026","2025",...]                   // filter dropdown data
 *     speechMeetings: ["10/2026","9/2026",...]              // filter dropdown data
 *     initiativeYears:["2026","2025",...]
 *     counts:         { speeches, initiatives, ...KPI... }
 *     dashboard:      { years: [], perYear: {...}, palette, labels, totals }
 *   }
 *
 * Templates consume this model directly. No inline filtering,
 * classification or sort logic should remain in Nunjucks or JS.
 *
 * Chronology contract (matches Kynästä hub, enforced via shared
 * comparators in src/_utils/councilSpeech.js):
 *   speeches    → date DESC → title fi ASC → URL ASC
 *   initiatives → meetingDate||date DESC → title fi ASC → URL ASC
 */

const {
  compareByCouncilChronology,
  compareByInitiativeChronology
} = require("./councilSpeech");
const { enrichCouncilSpeech, isoDate } = require("./councilEnrichment");

const FI_DATE_FORMATTER = new Intl.DateTimeFormat("fi-FI", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === null || value === undefined) return [];
  return [value];
}

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function formatDate(value) {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return FI_DATE_FORMATTER.format(d);
}

function yearFromDate(value) {
  if (!value) return "";
  const str = String(value);
  const yearMatch = str.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) return yearMatch[0];
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getUTCFullYear());
}

function stripCouncilTitlePrefix(title) {
  const raw = String(title || "");
  // Strip "Puheenvuoro[ni]" / "Valtuustopuheenvuoro" prefix.
  let s = raw.replace(/^(?:Valtuustopuheenvuoro|Puheenvuoro(?:ni)?)\s+/i, "");
  // If § reference present, take everything after it.
  const afterParagraph = s.replace(/^.*?§\s*\d+\s*[.:–\s]+/i, "");
  if (afterParagraph !== s) return afterParagraph.trim();
  // Otherwise strip up to first ": " (Rehtoripäivä: Speech title → Speech title).
  const afterColon = s.replace(/^[^:]+:\s*/, "");
  if (afterColon !== s) return afterColon.trim();
  return s.trim();
}

function secondsToClock(totalSeconds) {
  const total = Number(totalSeconds || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return [hours, minutes, seconds]
    .map((part, index) => (index === 0 ? String(part) : String(part).padStart(2, "0")))
    .join(":");
}

function compareCouncilMeetings(a, b) {
  const [aNumber, aYear] = String(a).split("/").map(Number);
  const [bNumber, bYear] = String(b).split("/").map(Number);
  if (
    Number.isFinite(aNumber) && Number.isFinite(aYear)
    && Number.isFinite(bNumber) && Number.isFinite(bYear)
  ) {
    return (bYear - aYear) || (bNumber - aNumber);
  }
  return String(a).localeCompare(String(b), "fi");
}

function dedupSortedYearsDesc(values) {
  return [...new Set(values.map((v) => yearFromDate(v)).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));
}

function dedupSortedMeetings(values) {
  return [...new Set(values.map((v) => pickString(v)).filter(Boolean))]
    .sort(compareCouncilMeetings);
}

// Council-speech record projection. One record per speech; all
// display formatting precomputed. Search text concatenates every
// field the runtime JS text-search covers so the browser can filter
// with a single includes() check against `data-search-text`.
function buildSpeechRecord(item, enrichmentDeps) {
  const data = item?.data || {};
  const enriched = enrichCouncilSpeech(null, item, enrichmentDeps);
  const url = pickString(data.url || item?.url);
  const isExternal = /^https?:/.test(url);
  const title = pickString(data.title);
  const shortTitle = stripCouncilTitlePrefix(title);
  const dateIso = isoDate(item?.date);
  const description = pickString(data.description);
  const categories = toArray(data.categories).map(pickString).filter(Boolean);
  const keywords = toArray(data.keywords).map(pickString).filter(Boolean);
  const councilVideos = Array.isArray(enriched.councilVideos)
    ? enriched.councilVideos.map((v) => ({
        youtubeId: pickString(v.youtubeId),
        start: Number(v.start || 0),
        startLabel: secondsToClock(v.start)
      }))
    : [];
  const searchTokens = [
    title,
    shortTitle,
    enriched.asiakohta,
    description,
    enriched.event,
    enriched.meetingLabel,
    categories.join(" "),
    keywords.join(" ")
  ].filter(Boolean).join(" ").toLowerCase();

  return {
    url,
    isExternal,
    title,
    shortTitle,
    date: dateIso || "",
    formattedDate: dateIso ? formatDate(dateIso) : "",
    year: yearFromDate(dateIso),
    asiakohta: pickString(enriched.asiakohta),
    event: pickString(enriched.event),
    description,
    categories,
    keywords,
    meetingLabel: pickString(enriched.meetingLabel),
    meetingNumber: pickString(enriched.meetingNumber),
    meetingDate: enriched.meetingDate || "",
    protocolUrl: pickString(enriched.protocolUrl),
    councilVideos,
    searchText: searchTokens
  };
}

function buildInitiativeRecord(item) {
  const data = item?.data || {};
  const url = pickString(data.url || item?.url);
  const isExternal = /^https?:/.test(url);
  const title = pickString(data.title);
  const dateIso = isoDate(item?.date);
  const meetingDateIso = isoDate(data.meetingDate || item?.date);
  const description = pickString(data.description);
  const meeting = pickString(data.meeting);
  const initiativeType = pickString(data.initiativeType);
  const categories = toArray(data.categories).map(pickString).filter(Boolean);
  const keywords = toArray(data.keywords).map(pickString).filter(Boolean);
  const searchTokens = [
    title,
    description,
    meeting,
    initiativeType,
    formatDate(meetingDateIso),
    categories.join(" "),
    keywords.join(" ")
  ].filter(Boolean).join(" ").toLowerCase();

  return {
    url,
    isExternal,
    title,
    date: dateIso || "",
    formattedDate: dateIso ? formatDate(dateIso) : "",
    meetingDate: meetingDateIso || dateIso || "",
    formattedMeetingDate: meetingDateIso ? formatDate(meetingDateIso) : dateIso ? formatDate(dateIso) : "",
    year: yearFromDate(meetingDateIso || dateIso),
    meeting,
    description,
    initiativeType,
    categories,
    keywords,
    searchText: searchTokens
  };
}

function buildDashboard(collections) {
  const c = collections || {};
  const buckets = {
    mielipiteet: toArray(c.pub_mielipide),
    lausunnot: toArray(c.pub_lausunto),
    kolumnit: toArray(c.pub_kolumni),
    aloitteet: toArray(c.politics),
    puheet: toArray(c.pub_puhe),
    blogi: toArray(c.blog)
  };
  const counts = Object.fromEntries(
    Object.entries(buckets).map(([k, v]) => [k, v.length])
  );

  // Yearly aggregation per bucket for the trend chart.
  const yearly = {};
  const addYear = (arr, key) => {
    arr.forEach((item) => {
      const y = Number(yearFromDate(item?.date));
      if (!y || y < 1990 || y > 2100) return;
      if (!yearly[y]) {
        yearly[y] = { mielipiteet: 0, lausunnot: 0, kolumnit: 0, aloitteet: 0, puheet: 0, blogi: 0 };
      }
      yearly[y][key] += 1;
    });
  };
  Object.entries(buckets).forEach(([key, arr]) => addYear(arr, key));
  const years = Object.keys(yearly).map(Number).sort((a, b) => a - b);

  return {
    counts,
    years,
    perYear: yearly,
    labels: ["Valtuustoaloitteet", "Blogi", "Kolumnit", "Lausunnot", "Mielipiteet", "Puheet"],
    palette: ["#fd7e14", "#6610f2", "#20c997", "#495057", "#0d6efd", "#dc3545"],
    totals: [
      counts.aloitteet, counts.blogi, counts.kolumnit,
      counts.lausunnot, counts.mielipiteet, counts.puheet
    ]
  };
}

/**
 * Build the /valtuustotyo/ SSR projection.
 */
function buildValtuustotyoPage({
  collections,
  councilMeetingMeta,
  oukaCouncilSpeechProtocols,
  councilSpeechVideos
} = {}) {
  const c = collections || {};
  const enrichmentDeps = {
    councilMeetingMeta,
    oukaCouncilSpeechProtocols,
    councilSpeechVideos
  };

  const rawSpeeches = toArray(c.pub_puhe_valtuusto);
  const speeches = rawSpeeches
    .map((item) => buildSpeechRecord(item, enrichmentDeps))
    .sort((a, b) => {
      // Sort by chronology contract; comparator accepts normalized records.
      return compareByCouncilChronology(a, b);
    });

  const rawInitiatives = toArray(c.politics);
  const initiatives = rawInitiatives
    .map((item) => buildInitiativeRecord(item))
    .sort((a, b) => compareByInitiativeChronology(a, b));

  const speechYears = dedupSortedYearsDesc(speeches.map((s) => s.date));
  const speechMeetings = dedupSortedMeetings(speeches.map((s) => s.meetingLabel));
  const initiativeYears = dedupSortedYearsDesc(
    initiatives.map((i) => i.meetingDate || i.date)
  );

  const dashboard = buildDashboard(c);

  return {
    speeches,
    initiatives,
    speechYears,
    speechMeetings,
    initiativeYears,
    counts: {
      speeches: speeches.length,
      initiatives: initiatives.length,
      ...dashboard.counts
    },
    dashboard
  };
}

module.exports = {
  buildValtuustotyoPage,
  buildSpeechRecord,
  buildInitiativeRecord,
  buildDashboard,
  stripCouncilTitlePrefix,
  secondsToClock,
  compareCouncilMeetings,
  formatDate,
  yearFromDate
};

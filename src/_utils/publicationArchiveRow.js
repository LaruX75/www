"use strict";

const { publicationGroupLabel } = require("./publicationsFindExplore");

const GENERIC_SOURCE_LABELS = {
  fi: "Lähde",
  en: "Source"
};

const EMPTY_TYPE_LABELS = {
  fi: "Julkaisu",
  en: "Publication"
};

function normalizeLang(value) {
  return String(value || "").toLowerCase() === "en" ? "en" : "fi";
}

function pickString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function pickNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function sameUrl(left, right) {
  return pickString(left) !== "" && pickString(left) === pickString(right);
}

function resolveSourceUrl(record = {}) {
  const pageUrl = pickString(record.pageUrl);
  const doiUrl = pickString(record.doiUrl);
  const externalUrl = pickString(record.url || record.sourceUrl);
  if (doiUrl && !sameUrl(doiUrl, pageUrl)) return doiUrl;
  if (externalUrl && !sameUrl(externalUrl, pageUrl)) return externalUrl;
  return "";
}

function resolveSourceLabel(record = {}, lang = "fi") {
  const locale = normalizeLang(lang);
  if (pickString(record.doiUrl)) return "DOI";
  if (pickString(record.sourceLabel) === "Research.fi") return "Research.fi";
  return GENERIC_SOURCE_LABELS[locale];
}

function resolveTypeDisplay(record = {}, lang = "fi") {
  const locale = normalizeLang(lang);
  const typeCode = pickString(record.typeCode);
  const group = pickString(record.publicationGroup || record.group);
  const typeLabel = pickString(record.type);
  return typeCode || group || typeLabel || EMPTY_TYPE_LABELS[locale];
}

function resolveTypeTitle(record = {}) {
  return pickString(record.type) || pickString(record.typeCode) || pickString(record.publicationGroup || record.group);
}

function buildArchiveRow(record, lang) {
  const locale = normalizeLang(lang);
  if (!record || typeof record !== "object") {
    return emptyRow(locale);
  }
  const group = pickString(record.publicationGroup || record.group);
  return {
    year: pickString(record.year),
    authors: pickString(record.authors),
    title: pickString(record.title),
    pageUrl: pickString(record.pageUrl),
    group,
    groupLabel: group ? publicationGroupLabel(group, locale) : "",
    typeDisplay: resolveTypeDisplay(record, locale),
    typeTitle: resolveTypeTitle(record),
    sourceUrl: resolveSourceUrl(record),
    sourceLabel: resolveSourceLabel(record, locale),
    journal: pickString(record.journal),
    publisher: pickString(record.publisher),
    volume: pickString(record.volume),
    issue: pickString(record.issue),
    pages: pickString(record.pages),
    isbn: pickString(record.isbn),
    doi: pickString(record.doi),
    doiUrl: pickString(record.doiUrl),
    sourceName: pickString(record.sourceLabel),
    citationCount: pickNumber(record.citationCount) || 0,
    jufoLevel: pickNumber(record.jufoLevel),
    peerReviewed: record.peerReviewed === true || String(record.peerReviewed) === "true",
    openAccess: record.openAccess === true || String(record.openAccess) === "true" || Number(record.openAccess) > 0,
    csl: record.csl || null,
    lang: locale
  };
}

function parseCsl(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

function buildArchiveRowFromPagefind(meta, resultUrl, lang) {
  const locale = normalizeLang(lang);
  if (!meta || typeof meta !== "object") {
    return emptyRow(locale, resultUrl);
  }
  return buildArchiveRow({
    year: meta.publicationYear,
    authors: meta.publicationAuthors,
    title: meta.title,
    pageUrl: resultUrl,
    publicationGroup: meta.publicationGroup,
    typeCode: meta.publicationTypeCode || meta.publicationType,
    type: meta.publicationTypeLabel || meta.publicationType,
    url: meta.publicationSourceUrl,
    sourceLabel: meta.publicationSourceLabel,
    journal: meta.publicationJournal,
    publisher: meta.publicationPublisher,
    volume: meta.publicationVolume,
    issue: meta.publicationIssue,
    pages: meta.publicationPages,
    isbn: meta.publicationIsbn,
    doi: meta.publicationDoi,
    doiUrl: meta.publicationDoiUrl,
    citationCount: meta.publicationCitationCount,
    jufoLevel: meta.publicationJufoLevel,
    peerReviewed: meta.publicationPeerReviewed,
    openAccess: meta.publicationOpenAccess,
    csl: parseCsl(meta.publicationCsl)
  }, locale);
}

function emptyRow(lang, pageUrl = "") {
  const locale = normalizeLang(lang);
  return {
    year: "",
    authors: "",
    title: "",
    pageUrl: pickString(pageUrl),
    group: "",
    groupLabel: "",
    typeDisplay: EMPTY_TYPE_LABELS[locale],
    typeTitle: "",
    sourceUrl: "",
    sourceLabel: GENERIC_SOURCE_LABELS[locale],
    journal: "",
    publisher: "",
    volume: "",
    issue: "",
    pages: "",
    isbn: "",
    doi: "",
    doiUrl: "",
    sourceName: "",
    citationCount: 0,
    jufoLevel: null,
    peerReviewed: false,
    openAccess: false,
    csl: null,
    lang: locale
  };
}

module.exports = {
  buildArchiveRow,
  buildArchiveRowFromPagefind,
  normalizeLang,
  resolveSourceLabel,
  resolveSourceUrl
};

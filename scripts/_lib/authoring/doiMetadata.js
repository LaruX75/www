const { fetchWithTimeout } = require("../../../src/_data/_apiCache");
const { normalizeDoi } = require("../../../src/_data/publicationsPage");
const { isValidDoi } = require("../../../src/_utils/canonicalContentValidation");

const CROSSREF_TO_OKM_TYPE = Object.freeze({
  "journal-article": "A1",
  "proceedings-article": "A4",
  "book-chapter": "A3",
  "book-part": "A3",
  "book-section": "A3",
  book: "C1"
});

function normalizeDoiInput(input) {
  const raw = String(input || "").trim();
  const normalized = normalizeDoi(raw);

  if (!normalized || !isValidDoi(normalized)) {
    if (/^https?:\/\//i.test(raw)) {
      throw new Error("URL ei ole tuettu DOI-osoite");
    }
    throw new Error("Virheellinen DOI");
  }

  return {
    inputValue: raw,
    doi: normalized,
    doiUrl: `https://doi.org/${normalized}`,
    sourceType: "doi"
  };
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (Array.isArray(value)) {
      const match = value.map((item) => String(item || "").trim()).find(Boolean);
      if (match) return match;
      continue;
    }

    const normalized = String(value || "").trim();
    if (normalized) return normalized;
  }

  return "";
}

function authorTextFromCrossref(author = {}) {
  const family = String(author.family || "").trim();
  const given = String(author.given || "").trim();
  const literal = String(author.name || "").trim();

  if (family && given) return `${family}, ${given}`;
  if (family) return family;
  if (literal) return literal;
  return "";
}

function normalizeCrossrefDatePart(parts = []) {
  if (!Array.isArray(parts) || !parts.length) return "";
  const [year, month = 1, day = 1] = parts;
  if (!Number.isFinite(Number(year))) return "";
  const yyyy = String(year).padStart(4, "0");
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dateFromCrossrefMessage(message = {}) {
  const candidates = [
    message["published-print"],
    message["published-online"],
    message.issued,
    message.created
  ];

  for (const candidate of candidates) {
    const date = normalizeCrossrefDatePart(candidate?.["date-parts"]?.[0]);
    if (date) return date;
  }

  return "";
}

function parseCrossrefMessage(message = {}, normalized = {}) {
  const title = firstNonEmpty(message.title, message["short-title"]);
  if (!title) {
    throw new Error("DOI-metadatan otsikkoa ei löytynyt");
  }

  const authors = Array.isArray(message.author)
    ? message.author.map(authorTextFromCrossref).filter(Boolean).join("; ")
    : "";
  const date = dateFromCrossrefMessage(message);
  const proposedTypeCode = CROSSREF_TO_OKM_TYPE[String(message.type || "").trim().toLowerCase()] || "";
  const pages = firstNonEmpty(message.page, message["article-number"]);

  return {
    source: "crossref",
    sourceType: normalized.sourceType || "doi",
    sourceLabel: "Crossref",
    title,
    authors,
    date,
    year: date ? Number(date.slice(0, 4)) : null,
    doi: normalized.doi,
    doiUrl: normalized.doiUrl,
    sourceUrl: firstNonEmpty(message.URL, message?.resource?.primary?.URL, normalized.doiUrl),
    journal: firstNonEmpty(message["container-title"], message.publisher),
    volume: firstNonEmpty(message.volume),
    issue: firstNonEmpty(message.issue),
    pages,
    articleNumber: firstNonEmpty(message["article-number"]),
    publisher: firstNonEmpty(message.publisher),
    language: String(message.language || "").trim().toLowerCase() || "",
    crossrefType: String(message.type || "").trim().toLowerCase(),
    proposedTypeCode,
    evidenceUrl: `https://api.crossref.org/works/${encodeURIComponent(normalized.doi)}`
  };
}

async function fetchDoiMetadata(inputValue, { fetchImpl = fetchWithTimeout } = {}) {
  const normalized = normalizeDoiInput(inputValue);
  const evidenceUrl = `https://api.crossref.org/works/${encodeURIComponent(normalized.doi)}`;
  const response = await fetchImpl(evidenceUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; AUTHORING-PIPELINE-02/1.0; +https://www.jarilaru.fi/)"
    }
  }, 15000);

  if (!response.ok) {
    throw new Error(`DOI-metadatan haku epäonnistui (${response.status})`);
  }

  const payload = await response.json();
  const message = payload?.message;
  if (!message) {
    throw new Error("Crossref-vastauksesta puuttui message-osio");
  }

  return parseCrossrefMessage(message, normalized);
}

module.exports = {
  fetchDoiMetadata,
  normalizeDoiInput,
  parseCrossrefMessage
};

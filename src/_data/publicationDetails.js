const {
  buildCanonicalPublicationCandidates,
  canonicalPublicationDetailUrl,
  matchPublicationCandidates
} = require("./publicationsPage");
const { buildCslItem } = require("../_utils/publicationCsl");

let memoizedModel = null;
let memoizedRefs = null;

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickString(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function pickNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeStringArray(value) {
  const items = toArray(value)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return items.length ? items : [];
}

function sortDetails(items = []) {
  return [...toArray(items)].sort((a, b) => {
    const yearDiff = (b.year || 0) - (a.year || 0);
    if (yearDiff !== 0) return yearDiff;

    const dateDiff = String(b.date || "").localeCompare(String(a.date || ""));
    if (dateDiff !== 0) return dateDiff;

    return String(a.title || "").localeCompare(String(b.title || ""), "fi");
  });
}

function buildResearchfiLookups(data = {}) {
  const researchfi = toArray(data.researchfi);
  const researchfiContent = toArray(data.researchfiContent);
  const publicationsByPublicationId = new Map();
  const publicationsByAnchorId = new Map();
  const contentByPublicationId = new Map();
  const contentByAnchorId = new Map();

  researchfi.forEach((publication) => {
    const publicationId = pickString(publication?.publicationId);
    const anchorId = pickString(publication?.anchorId);
    if (publicationId) publicationsByPublicationId.set(publicationId, publication);
    if (anchorId) publicationsByAnchorId.set(anchorId, publication);
  });

  researchfiContent.forEach((item) => {
    const publicationId = pickString(item?.publicationId);
    const anchorId = pickString(item?.anchorId) || pickString(item?.sourceAnchorId);
    if (publicationId) contentByPublicationId.set(publicationId, item);
    if (anchorId) contentByAnchorId.set(anchorId, item);
  });

  return {
    publicationsByPublicationId,
    publicationsByAnchorId,
    contentByPublicationId,
    contentByAnchorId
  };
}

function buildResearchfiDetail(publication, contentItem, data = {}) {
  const publicationId = pickString(publication?.publicationId);
  const anchorId = pickString(publication?.anchorId);
  const canonicalId = publicationId || anchorId;
  if (!canonicalId || !contentItem) return null;

  const doi = pickString(publication?.doi) || pickString(contentItem?.doi);
  const csl = buildCslItem({
    anchorId,
    publicationId,
    title: pickString(publication?.title) || pickString(contentItem?.title),
    typeCode: pickString(publication?.typeCode) || pickString(contentItem?.publicationTypeCode),
    authors: pickString(publication?.authors) || pickString(contentItem?.authors),
    journal: pickString(publication?.journal) || pickString(contentItem?.publicationVenue),
    publisher: pickString(publication?.publisher),
    volume: pickString(publication?.volume),
    issue: pickString(publication?.issue),
    pages: pickString(publication?.pages) || pickString(publication?.articleNumber),
    isbn: pickString(publication?.isbn),
    doi,
    doiUrl: pickString(publication?.doiUrl) || pickString(contentItem?.doiUrl),
    url: pickString(publication?.url),
    year: pickNumber(publication?.year) || pickNumber(contentItem?.year),
    lang: "fi"
  });
  return {
    id: canonicalId,
    sourceId: canonicalId,
    anchorId,
    sourceAnchorId: pickString(publication?.sourceAnchorId) || pickString(contentItem?.sourceAnchorId) || anchorId,
    pageUrl: canonicalPublicationDetailUrl(publicationId, anchorId),
    archiveUrl: anchorId ? `/julkaisut/#${anchorId}` : "/julkaisut/",
    title: pickString(publication?.title) || pickString(contentItem?.title),
    description: pickString(contentItem?.description),
    citation: pickString(contentItem?.citation),
    citationStyle: pickString(contentItem?.citationStyle) || "APA 7",
    csl,
    date: pickString(contentItem?.date) || (publication?.year ? `${publication.year}-01-01` : null),
    year: pickNumber(publication?.year) || pickNumber(contentItem?.year),
    authors: pickString(publication?.authors) || pickString(contentItem?.authors),
    journal: pickString(publication?.journal) || pickString(contentItem?.publicationVenue),
    publisher: pickString(publication?.publisher),
    type: pickString(publication?.typeFi) || pickString(contentItem?.publicationTypeLabel),
    typeCode: pickString(publication?.typeCode) || pickString(contentItem?.publicationTypeCode),
    peerReviewed: publication?.peerReviewed === true || contentItem?.peerReviewed === true,
    openAccess: pickNumber(publication?.openAccess) || pickNumber(contentItem?.openAccess),
    volume: pickString(publication?.volume),
    issue: pickString(publication?.issue),
    pages: pickString(publication?.pages) || pickString(publication?.articleNumber),
    isbn: pickString(publication?.isbn),
    doi,
    doiUrl: pickString(publication?.doiUrl) || pickString(contentItem?.doiUrl),
    externalUrl: pickString(publication?.url) || pickString(contentItem?.referenceUrl) || pickString(publication?.doiUrl),
    jufoLevel: pickNumber(publication?.jufoLevel),
    citationCount: pickNumber(data?.semanticscholar?.metrics?.doiCitations?.[String(doi || "").toLowerCase()] || 0),
    categories: normalizeStringArray(contentItem?.categories),
    keywords: normalizeStringArray(contentItem?.keywords),
    contexts: normalizeStringArray(contentItem?.contexts),
    entities: normalizeStringArray(contentItem?.entities),
    researchLine: pickString(contentItem?.researchLine),
    researchThemes: normalizeStringArray(contentItem?.researchThemes),
    researchAudience: normalizeStringArray(contentItem?.researchAudience),
    source: "researchfi",
    sourceKey: "researchfi",
    sourceLabel: pickString(contentItem?.sourceLabel) || "Research.fi",
    contentType: "scientificPublication",
    organization: pickString(contentItem?.organization) || "Oulun yliopisto"
  };
}

function buildCanonicalPublicationDetailsModel(data = {}) {
  const refs = {
    researchfi: data?.researchfi,
    researchfiContent: data?.researchfiContent,
    publications: data?.collections?.publications,
    semanticscholar: data?.semanticscholar
  };
  if (
    memoizedModel
    && memoizedRefs
    && memoizedRefs.researchfi === refs.researchfi
    && memoizedRefs.researchfiContent === refs.researchfiContent
    && memoizedRefs.publications === refs.publications
    && memoizedRefs.semanticscholar === refs.semanticscholar
  ) {
    return memoizedModel;
  }

  const {
    dedupedCandidates,
    manualCandidates
  } = buildCanonicalPublicationCandidates(data);
  const lookups = buildResearchfiLookups(data);

  const researchfiItems = sortDetails(
    dedupedCandidates
      .filter((candidate) => candidate?.sourceKey === "researchfi")
      .map((candidate) => {
        const publicationId = pickString(candidate?.stableIdentifier);
        const anchorId = pickString(candidate?.record?.anchorId) || pickString(candidate?.record?.id);
        const publication = (publicationId && lookups.publicationsByPublicationId.get(publicationId))
          || (anchorId && lookups.publicationsByAnchorId.get(anchorId))
          || null;
        const contentItem = (publicationId && lookups.contentByPublicationId.get(publicationId))
          || (anchorId && lookups.contentByAnchorId.get(anchorId))
          || null;
        return buildResearchfiDetail(publication, contentItem, data);
      })
      .filter(Boolean)
  );

  const researchfiById = new Map(researchfiItems.map((item) => [item.id, item]));
  const manualRedirects = manualCandidates
    .map((manualCandidate) => {
      const winner = dedupedCandidates.find((candidate) => {
        if (candidate === manualCandidate) return false;
        return matchPublicationCandidates(candidate, manualCandidate).length > 0;
      }) || null;
      if (!winner || winner.sourceKey !== "researchfi") return null;

      const targetId = pickString(winner?.stableIdentifier)
        || pickString(winner?.record?.anchorId)
        || pickString(winner?.record?.id);
      const detail = targetId ? researchfiById.get(targetId) : null;
      const from = pickString(manualCandidate?.record?.pageUrl);
      if (!detail || !from || !detail.pageUrl) return null;

      return {
        from,
        to: detail.pageUrl,
        title: pickString(manualCandidate?.record?.title),
        canonicalId: detail.id,
        canonicalTitle: detail.title,
        matchedBy: matchPublicationCandidates(winner, manualCandidate)
      };
    })
    .filter(Boolean)
    .reduce((items, redirect) => {
      if (!items.some((item) => item.from === redirect.from)) {
        items.push(redirect);
      }
      return items;
    }, []);

  const model = {
    items: researchfiItems,
    researchfiItems,
    manualRedirects,
    manualRedirectsByFromUrl: Object.fromEntries(
      manualRedirects.map((redirect) => [redirect.from, redirect])
    )
  };

  memoizedRefs = refs;
  memoizedModel = model;

  return model;
}

function buildCanonicalPublicationDetails(data = {}) {
  return buildCanonicalPublicationDetailsModel(data).items;
}

function buildCanonicalPublicationDetailLookup(data = {}) {
  const lookup = new Map();
  buildCanonicalPublicationDetailsModel(data).items.forEach((detail) => {
    lookup.set(detail.id, detail);
    if (detail.anchorId) lookup.set(detail.anchorId, detail);
    if (detail.pageUrl) lookup.set(detail.pageUrl, detail);
  });

  return lookup;
}

function getCanonicalPublicationDetail(data = {}, key) {
  if (!key) return null;
  const lookup = buildCanonicalPublicationDetailLookup(data);
  return lookup.get(String(key).trim()) || null;
}

module.exports = {
  buildCanonicalPublicationDetailsModel,
  buildCanonicalPublicationDetails,
  buildCanonicalPublicationDetailLookup,
  canonicalPublicationDetailUrl,
  getCanonicalPublicationDetail
};

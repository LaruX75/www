const path = require("path");

const { isoDate } = require("../_utils/toPublicContentRecord");

const PUBLICATION_GROUP_ORDER = ["A", "B", "C", "D", "E", "G"];

const PUBLIC_PUBLICATIONS_PAGE_FIELDS = Object.freeze([
  "id",
  "anchorId",
  "pageUrl",
  "url",
  "title",
  "description",
  "date",
  "year",
  "authors",
  "journal",
  "publisher",
  "type",
  "typeCode",
  "publicationGroup",
  "publicationKind",
  "peerReviewed",
  "openAccess",
  "volume",
  "issue",
  "pages",
  "isbn",
  "doi",
  "doiUrl",
  "jufoLevel",
  "citationCount",
  "categories",
  "keywords",
  "contexts",
  "lang",
  "sourceKey",
  "sourceLabel",
  "recordOrigin",
  "researchLine",
  "researchThemes",
  "researchAudience"
]);

const PUBLICATION_TYPE_LABELS = Object.freeze({
  A1: "Alkuperäisartikkeli tieteellisessä aikakauslehdessä",
  A2: "Katsausartikkeli tieteellisessä aikakauslehdessä",
  A3: "Kirjan tai muun kokoomateoksen osa",
  A4: "Artikkeli konferenssijulkaisussa",
  B1: "Kirjoitus tieteellisessä aikakauslehdessä",
  B2: "Kirjan tai muun kokoomateoksen osa",
  B3: "Vertaisarvioimaton artikkeli konferenssijulkaisussa",
  C1: "Kustannettu tieteellinen erillisteos",
  C2: "Toimitettu kirja, kokoomateos, konferenssijulkaisu tai lehden erikoisnumero",
  D1: "Artikkeli ammattilehdessä",
  D2: "Artikkeli ammatillisessa kokoomateoksessa",
  D3: "Artikkeli ammatillisessa konferenssijulkaisussa",
  E1: "Yleistajuinen artikkeli, sanomalehtiartikkeli",
  E2: "Yleistajuinen monografia",
  G4: "Väitöskirja (artikkeli)",
  G5: "Väitöskirja (monografia)"
});

const MANUAL_PUBLICATION_RULES = Object.freeze({
  "faktabaari-generation-ai-projekti": {
    includeInPage: true,
    publicationKind: "generalAudiencePublication",
    reason: "Curated public expert article outside Research.fi dataset."
  },
  "faktabaari-tekoalytaitojen-opettaminen-generation-ai-sovellusten-avulla": {
    includeInPage: true,
    publicationKind: "generalAudiencePublication",
    reason: "Curated public expert article outside Research.fi dataset."
  },
  "etaopetuksen-nayton-paikka": {
    includeInPage: true,
    publicationKind: "professionalPublication",
    reason: "Curated professional guide / handbook outside Research.fi dataset."
  }
});

function canonicalPublicationDetailUrl(publicationId, anchorId = null) {
  const id = pickString(publicationId) || pickString(anchorId);
  return id ? `/julkaisut/${id}/` : null;
}

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
  return items.length ? items : null;
}

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDoi(value) {
  const normalized = normalizeWhitespace(value)
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .toLowerCase();

  return normalized || null;
}

function normalizeTitleForMatch(value) {
  const normalized = normalizeWhitespace(value).toLowerCase();
  return normalized || null;
}

function omitEmpty(obj) {
  const out = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (typeof value === "string" && value.trim() === "") return;
    if (Array.isArray(value) && value.length === 0) return;
    out[key] = value;
  });
  return out;
}

function pickFields(record, fields) {
  const out = {};
  fields.forEach((field) => {
    if (record[field] !== undefined) {
      out[field] = record[field];
    }
  });
  return out;
}

function toPublicPublicationPageRecord(record = {}) {
  return pickFields(record, PUBLIC_PUBLICATIONS_PAGE_FIELDS);
}

function publicationGroup(typeCode) {
  const group = String(typeCode || "").trim().charAt(0).toUpperCase();
  return PUBLICATION_GROUP_ORDER.includes(group) ? group : null;
}

function publicationKindFromTypeCode(typeCode, fallback = "otherPublication") {
  const group = publicationGroup(typeCode);
  if (!group) return fallback;
  if (["A", "B", "C", "G"].includes(group)) return "scientificPublication";
  if (group === "D") return "professionalPublication";
  if (group === "E") return "generalAudiencePublication";
  return fallback;
}

function sortCanonicalItems(items = []) {
  return [...toArray(items)].sort((a, b) => {
    const yearDiff = (b.year || 0) - (a.year || 0);
    if (yearDiff !== 0) return yearDiff;

    const dateDiff = String(b.date || "").localeCompare(String(a.date || ""));
    if (dateDiff !== 0) return dateDiff;

    const groupDiff = PUBLICATION_GROUP_ORDER.indexOf(a.publicationGroup) - PUBLICATION_GROUP_ORDER.indexOf(b.publicationGroup);
    if (groupDiff !== 0) return groupDiff;

    return String(a.title || "").localeCompare(String(b.title || ""), "fi");
  });
}

function uniqueById(items = []) {
  const seen = new Set();
  return toArray(items).filter((item) => {
    const id = String(item?.id || "").trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function sourcePriority(sourceKey) {
  if (sourceKey === "researchfi") return 0;
  if (sourceKey === "manual") return 1;
  return 99;
}

function buildPublicationTitleYearKey(title, year) {
  const normalizedTitle = normalizeTitleForMatch(title);
  const normalizedYear = pickNumber(year);
  if (!normalizedTitle || !normalizedYear) return null;
  return `title-year:${normalizedTitle}|${normalizedYear}`;
}

function buildPublicationDedupKeys(candidate = {}) {
  const keys = new Set();
  const doi = normalizeDoi(candidate?.doi || candidate?.record?.doi || candidate?.record?.doiUrl);
  const stableIdentifier = normalizeWhitespace(candidate?.stableIdentifier).toLowerCase();
  const titleYearKey = buildPublicationTitleYearKey(
    candidate?.title || candidate?.record?.title,
    candidate?.year ?? candidate?.record?.year
  );

  if (doi) keys.add(`doi:${doi}`);
  if (stableIdentifier) keys.add(`id:${stableIdentifier}`);
  if (titleYearKey) keys.add(titleYearKey);

  return [...keys];
}

function publicationCandidateIdentity(candidate = {}) {
  return {
    doi: normalizeDoi(candidate?.doi || candidate?.record?.doi || candidate?.record?.doiUrl),
    stableIdentifier: normalizeWhitespace(candidate?.stableIdentifier).toLowerCase() || null,
    titleYear: buildPublicationTitleYearKey(
      candidate?.title || candidate?.record?.title,
      candidate?.year ?? candidate?.record?.year
    )
  };
}

function comparePublicationCandidatePriority(left = {}, right = {}) {
  const leftPriority = sourcePriority(left?.sourceKey || left?.record?.sourceKey);
  const rightPriority = sourcePriority(right?.sourceKey || right?.record?.sourceKey);
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }
  return 0;
}

function chooseWinningPublicationCandidate(candidates = []) {
  return [...toArray(candidates)].sort(comparePublicationCandidatePriority)[0] || null;
}

function matchPublicationCandidates(left = {}, right = {}) {
  const leftIdentity = publicationCandidateIdentity(left);
  const rightIdentity = publicationCandidateIdentity(right);

  if (leftIdentity.doi && rightIdentity.doi) {
    return leftIdentity.doi === rightIdentity.doi ? ["doi"] : [];
  }

  if (leftIdentity.stableIdentifier && rightIdentity.stableIdentifier) {
    return leftIdentity.stableIdentifier === rightIdentity.stableIdentifier ? ["identifier"] : [];
  }

  if (leftIdentity.titleYear && rightIdentity.titleYear && leftIdentity.titleYear === rightIdentity.titleYear) {
    return ["title-year"];
  }

  return [];
}

function deduplicatePublicationCandidates(candidates = []) {
  const kept = [];

  toArray(candidates).forEach((candidate) => {
    const matched = kept
      .map((entry, index) => ({
        index,
        reasons: entry ? matchPublicationCandidates(entry, candidate) : []
      }))
      .filter((entry) => entry.reasons.length > 0);

    if (!matched.length) {
      kept.push(candidate);
      return;
    }

    const cluster = [
      ...matched.map((entry) => kept[entry.index]),
      candidate
    ];
    const winner = chooseWinningPublicationCandidate(cluster);
    const primaryIndex = matched[0].index;

    kept[primaryIndex] = winner;
    matched.slice(1).forEach((entry) => {
      kept[entry.index] = null;
    });
  });

  return kept.filter(Boolean);
}

function manualPublicationSlug(item) {
  const inputPath = item?.inputPath || item?.data?.page?.inputPath || "";
  return path.basename(inputPath, path.extname(inputPath));
}

function manualPublicationJournal(data = {}) {
  const publication = pickString(data.publication);
  const collection = pickString(data.publicationCollection);
  if (collection && publication) return `${collection} – ${publication}`;
  return collection || publication || null;
}

function manualPublicationTypeLabel(typeCode) {
  return PUBLICATION_TYPE_LABELS[typeCode] || typeCode || null;
}

function evaluateManualPublicationItems(items = []) {
  return toArray(items)
    .filter((item) => pickString(item?.data?.publicationType))
    .map((item) => {
      const slug = manualPublicationSlug(item);
      const rule = MANUAL_PUBLICATION_RULES[slug] || null;
      const data = item?.data || {};
      return {
        item,
        slug,
        includeInPage: rule?.includeInPage === true,
        publicationKind: rule?.publicationKind || publicationKindFromTypeCode(data.publicationType),
        reason: rule?.reason || "Not explicitly approved for publications page canonical projection."
      };
    });
}

function createResearchfiPageItems(data = {}) {
  const contentByAnchor = new Map(
    toArray(data.researchfiContent).map((item) => [
      String(item?.anchorId || item?.sourceAnchorId || "").trim(),
      item
    ])
  );

  return toArray(data.researchfi).map((publication) => {
    const anchorId = pickString(publication?.anchorId);
    const contentItem = anchorId ? contentByAnchor.get(anchorId) : null;
    const typeCode = pickString(publication?.typeCode);
    const externalUrl = pickString(publication?.url) || pickString(publication?.doiUrl) || pickString(contentItem?.referenceUrl);
    const pageUrl = canonicalPublicationDetailUrl(publication?.publicationId, anchorId)
      || pickString(contentItem?.url)
      || (anchorId ? `/julkaisut/#${anchorId}` : null);

    return toPublicPublicationPageRecord(omitEmpty({
      id: anchorId || pickString(publication?.publicationId) || pickString(publication?.doi) || pickString(publication?.title),
      anchorId,
      pageUrl,
      url: externalUrl,
      title: pickString(publication?.title),
      description: pickString(contentItem?.description),
      date: publication?.year ? `${publication.year}-01-01` : null,
      year: pickNumber(publication?.year),
      authors: pickString(publication?.authors),
      journal: pickString(publication?.journal) || pickString(contentItem?.publicationVenue),
      publisher: pickString(publication?.publisher),
      type: pickString(publication?.typeFi) || pickString(contentItem?.publicationTypeLabel) || manualPublicationTypeLabel(typeCode),
      typeCode,
      publicationGroup: publicationGroup(typeCode),
      publicationKind: publicationKindFromTypeCode(typeCode),
      peerReviewed: publication?.peerReviewed === true,
      openAccess: pickNumber(publication?.openAccess),
      volume: pickString(publication?.volume),
      issue: pickString(publication?.issue),
      pages: pickString(publication?.pages),
      isbn: pickString(publication?.isbn),
      doi: pickString(publication?.doi),
      doiUrl: pickString(publication?.doiUrl),
      jufoLevel: pickNumber(publication?.jufoLevel),
      citationCount: pickNumber(data.semanticscholar?.metrics?.doiCitations?.[String(publication?.doi || "").toLowerCase()] || 0),
      categories: normalizeStringArray(contentItem?.categories),
      keywords: normalizeStringArray(contentItem?.keywords),
      contexts: normalizeStringArray(contentItem?.contexts),
      lang: "fi",
      sourceKey: "researchfi",
      sourceLabel: "Research.fi",
      recordOrigin: "researchfi",
      researchLine: pickString(contentItem?.researchLine),
      researchThemes: normalizeStringArray(contentItem?.researchThemes),
      researchAudience: normalizeStringArray(contentItem?.researchAudience)
    }));
  }).filter((item) => item.id && item.title);
}

function createResearchfiPageCandidates(data = {}) {
  return createResearchfiPageItems(data).map((record) => {
    const publication = toArray(data.researchfi).find((item) => pickString(item?.anchorId) === record.anchorId) || {};
    return {
      record,
      sourceKey: "researchfi",
      stableIdentifier: pickString(publication?.publicationId),
      doi: pickString(publication?.doi) || pickString(publication?.doiUrl),
      title: record.title,
      year: record.year
    };
  });
}

function createManualPageItems(evaluations = []) {
  return toArray(evaluations)
    .filter((evaluation) => evaluation.includeInPage)
    .map((evaluation) => {
      const item = evaluation.item;
      const data = item?.data || {};
      const typeCode = pickString(data.publicationType);
      const publication = pickString(data.publication);
      const pageUrl = pickString(item?.url);
      const externalUrl = pickString(data.source_url) || pageUrl;
      const date = isoDate(data.date || item?.date);

      return toPublicPublicationPageRecord(omitEmpty({
        id: `manual:${evaluation.slug}`,
        anchorId: `manual-${evaluation.slug}`,
        pageUrl,
        url: externalUrl,
        title: pickString(data.title),
        description: pickString(data.description),
        date,
        year: date ? Number(date.slice(0, 4)) : null,
        authors: pickString(data.author) || "Jari Laru",
        journal: manualPublicationJournal(data),
        publisher: publication,
        type: manualPublicationTypeLabel(typeCode),
        typeCode,
        publicationGroup: publicationGroup(typeCode),
        publicationKind: evaluation.publicationKind,
        peerReviewed: false,
        categories: normalizeStringArray(data.categories),
        keywords: normalizeStringArray(data.keywords),
        contexts: normalizeStringArray(data.contexts),
        lang: data.lang === "en" ? "en" : "fi",
        sourceKey: "manual",
        sourceLabel: publication || "Curated publication",
        recordOrigin: "manual"
      }));
    })
    .filter((record) => record.id && record.title);
}

function createManualPageCandidates(evaluations = []) {
  return toArray(evaluations)
    .filter((evaluation) => evaluation.includeInPage)
    .map((evaluation) => {
      const record = createManualPageItems([evaluation])[0] || null;
      const data = evaluation.item?.data || {};
      if (!record) return null;
      return {
        record,
        sourceKey: "manual",
        stableIdentifier: pickString(data.publicationId),
        doi: pickString(data.doi) || pickString(data.doiUrl),
        title: record.title,
        year: record.year,
        manualSlug: evaluation.slug
      };
    })
    .filter(Boolean);
}

function buildPublicationsPageSourceData(data = {}) {
  const manualEvaluations = evaluateManualPublicationItems(data?.collections?.publications || []);

  return {
    researchfi: toArray(data.researchfi),
    researchfiContent: toArray(data.researchfiContent),
    archiveFilters: data?.researchProgram?.archiveFilters || { lines: [], themes: [], audiences: [] },
    manualEvaluations
  };
}

function buildCanonicalPublicationsPageItems(sourceData = {}, data = {}) {
  const dedupedCandidates = deduplicatePublicationCandidates([
    ...createResearchfiPageCandidates({
      researchfi: sourceData.researchfi,
      researchfiContent: sourceData.researchfiContent,
      semanticscholar: data.semanticscholar || {}
    }),
    ...createManualPageCandidates(sourceData.manualEvaluations)
  ]);

  return sortCanonicalItems(uniqueById(dedupedCandidates.map((candidate) => candidate.record)));
}

function buildCanonicalPublicationCandidates(data = {}) {
  const sourceData = buildPublicationsPageSourceData(data);
  const researchfiCandidates = createResearchfiPageCandidates({
    researchfi: sourceData.researchfi,
    researchfiContent: sourceData.researchfiContent,
    semanticscholar: data.semanticscholar || {}
  });
  const manualCandidates = createManualPageCandidates(sourceData.manualEvaluations);
  const dedupedCandidates = deduplicatePublicationCandidates([
    ...researchfiCandidates,
    ...manualCandidates
  ]);

  return {
    sourceData,
    researchfiCandidates,
    manualCandidates,
    dedupedCandidates
  };
}

function buildLegacyFiPublicationRows(data = {}) {
  const researchRows = toArray(data.researchfi).map((publication) => ({
    id: pickString(publication?.anchorId) || pickString(publication?.publicationId) || pickString(publication?.title),
    sourceKey: "researchfi",
    pageUrl: pickString(publication?.anchorId) ? `/julkaisut/#${publication.anchorId}` : null,
    url: pickString(publication?.url) || pickString(publication?.doiUrl),
    title: pickString(publication?.title),
    year: pickNumber(publication?.year),
    authors: pickString(publication?.authors),
    journal: pickString(publication?.journal),
    publisher: pickString(publication?.publisher),
    typeCode: pickString(publication?.typeCode)
  }));

  const manualRows = evaluateManualPublicationItems(data?.collections?.publications || [])
    .filter((evaluation) => evaluation.includeInPage)
    .map((evaluation) => {
      const item = evaluation.item;
      const record = createManualPageItems([evaluation])[0] || null;
      return record ? {
        id: record.id,
        sourceKey: "manual",
        pageUrl: record.pageUrl || pickString(item?.url),
        url: record.url,
        title: record.title,
        year: record.year,
        authors: record.authors,
        journal: record.journal,
        publisher: record.publisher,
        typeCode: record.typeCode
      } : null;
    })
    .filter(Boolean);

  return sortCanonicalItems([...researchRows, ...manualRows]);
}

function buildPublicationsPageModel(data = {}) {
  const {
    sourceData,
    researchfiCandidates,
    manualCandidates,
    dedupedCandidates
  } = buildCanonicalPublicationCandidates(data);
  const items = sortCanonicalItems(uniqueById(dedupedCandidates.map((candidate) => candidate.record)));

  const manualPublicationAudit = sourceData.manualEvaluations.map((evaluation) => {
    const manualCandidate = manualCandidates.find((candidate) => candidate.manualSlug === evaluation.slug) || null;
    const matchingResearchfi = manualCandidate
      ? researchfiCandidates.find((candidate) => matchPublicationCandidates(candidate, manualCandidate).length > 0) || null
      : null;
    const canonicalWinner = manualCandidate
      ? dedupedCandidates.find((candidate) => matchPublicationCandidates(candidate, manualCandidate).length > 0) || null
      : null;
    const matchedBy = matchingResearchfi && manualCandidate
      ? matchPublicationCandidates(matchingResearchfi, manualCandidate)
      : [];

    return {
      slug: evaluation.slug,
      publicationKind: evaluation.publicationKind,
      reason: evaluation.reason,
      title: pickString(evaluation.item?.data?.title),
      typeCode: pickString(evaluation.item?.data?.publicationType),
      includeInPage: evaluation.includeInPage,
      status: matchingResearchfi ? "deduplicated-to-researchfi" : "manual-only",
      canonicalSource: canonicalWinner?.sourceKey || (evaluation.includeInPage ? "manual" : null),
      matchedBy
    };
  });

  return {
    items,
    archiveFilters: sourceData.archiveFilters,
    sourceCounts: {
      researchfi: items.filter((item) => item.sourceKey === "researchfi").length,
      manual: items.filter((item) => item.sourceKey === "manual").length
    },
    manualPublicationAudit: {
      included: manualPublicationAudit.filter((item) => item.includeInPage),
      excluded: manualPublicationAudit.filter((item) => !item.includeInPage)
    }
  };
}

module.exports = {
  PUBLICATION_GROUP_ORDER,
  PUBLIC_PUBLICATIONS_PAGE_FIELDS,
  MANUAL_PUBLICATION_RULES,
  canonicalPublicationDetailUrl,
  normalizeDoi,
  buildPublicationDedupKeys,
  matchPublicationCandidates,
  deduplicatePublicationCandidates,
  createResearchfiPageCandidates,
  createManualPageCandidates,
  buildPublicationsPageSourceData,
  buildCanonicalPublicationCandidates,
  buildCanonicalPublicationsPageItems,
  buildLegacyFiPublicationRows,
  buildPublicationsPageModel
};

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function snippet(value, maxLength = 260) {
  const normalized = pickString(value).replace(/\s+/g, " ");
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function uniqueValues(values) {
  return [...new Set(toArray(values).map((value) => pickString(value)).filter(Boolean))];
}

function countValues(items, getter) {
  const counts = new Map();
  toArray(items).forEach((item) => {
    toArray(getter(item)).forEach((value) => {
      const key = pickString(value);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return [...counts.entries()];
}

function sortByCountThenLabel(entries, locale = "fi") {
  return [...entries].sort((left, right) => {
    const countDiff = right[1] - left[1];
    if (countDiff !== 0) return countDiff;
    return left[0].localeCompare(right[0], locale);
  });
}

const PUBLICATION_GROUP_LABELS = Object.freeze({
  A: { fi: "A - Vertaisarvioidut tieteelliset artikkelit", en: "A - Peer-reviewed scientific articles" },
  B: { fi: "B - Vertaisarvioimattomat tieteelliset kirjoitukset", en: "B - Non-peer-reviewed scientific writings" },
  C: { fi: "C - Tieteelliset kirjat", en: "C - Scientific books" },
  D: { fi: "D - Ammattiyhteisölle suunnatut julkaisut", en: "D - Professional publications" },
  E: { fi: "E - Suurelle yleisölle suunnatut julkaisut", en: "E - General audience publications" },
  G: { fi: "G - Opinnäytteet", en: "G - Theses" }
});

function publicationGroupLabel(group, lang = "fi") {
  return PUBLICATION_GROUP_LABELS[group]?.[lang] || group || "";
}

function publicationQualityFilters(item = {}) {
  const filters = [];
  if (item.peerReviewed) filters.push("peer-reviewed");
  if (item.openAccess) filters.push("open-access");
  return filters;
}

function includesContext(item = {}, context) {
  return toArray(item.contexts).includes(context);
}

function buildPublicationFindExploreRecord(item = {}) {
  const pageUrl = pickString(item.pageUrl);
  if (!pageUrl || !pickString(item.title)) return null;
  return {
    id: item.id,
    pageUrl,
    title: item.title,
    description: snippet(item.description, 360),
    year: item.year || "",
    authors: item.authors || "",
    journal: item.journal || "",
    publisher: item.publisher || "",
    volume: item.volume || "",
    issue: item.issue || "",
    pages: item.pages || "",
    isbn: item.isbn || "",
    venue: item.journal || item.publisher || "",
    type: item.type || "",
    typeCode: item.typeCode || "",
    group: item.publicationGroup || "",
    groupLabelFi: publicationGroupLabel(item.publicationGroup, "fi"),
    groupLabelEn: publicationGroupLabel(item.publicationGroup, "en"),
    peerReviewed: Boolean(item.peerReviewed),
    openAccess: Boolean(item.openAccess),
    doi: item.doi || "",
    doiUrl: item.doiUrl || "",
    sourceUrl: item.url || item.doiUrl || "",
    jufoLevel: item.jufoLevel ?? "",
    citationCount: item.citationCount ?? 0,
    csl: item.csl || null
  };
}

function buildPublicationsFindExplorePageModel(publicationsPage = {}) {
  const items = toArray(publicationsPage.items);
  const records = items.map(buildPublicationFindExploreRecord).filter(Boolean);
  const years = [...new Set(items.map((item) => item.year).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));
  const groupOptions = sortByCountThenLabel(countValues(items, (item) => [item.publicationGroup]))
    .map(([value, count]) => ({
      value,
      labelFi: publicationGroupLabel(value, "fi"),
      labelEn: publicationGroupLabel(value, "en"),
      count
    }));
  const topicOptions = sortByCountThenLabel(countValues(items, (item) => [
    ...toArray(item.researchThemes),
    ...toArray(item.categories),
    ...toArray(item.keywords)
  ]))
    .slice(0, 40)
    .map(([value, count]) => ({ value, label: value, count }));
  return {
    count: items.length,
    records,
    years,
    groupOptions,
    topicOptions,
    topicHighlights: topicOptions.slice(0, 8),
    sourceCounts: publicationsPage.sourceCounts || {},
    groupCounts: Object.fromEntries(countValues(items, (item) => [item.publicationGroup])),
    qualityCounts: {
      peerReviewed: items.filter((item) => item.peerReviewed).length,
      openAccess: items.filter((item) => item.openAccess).length
    }
  };
}

function buildPublicationFindExploreDocument(item = {}) {
  if (!item?.pageUrl || !item?.title) return null;

  const filters = [
    { name: "Sisältö", value: "Julkaisut" },
    { name: "FindExplore", value: "publications" },
    { name: "Publications scope", value: "fi" },
    { name: "Publications scope", value: "en" }
  ];

  if (item.publicationGroup) {
    filters.push({ name: "Publications group", value: item.publicationGroup });
  }
  if (item.typeCode) {
    filters.push({ name: "Publications type", value: item.typeCode });
  }
  if (item.year) {
    filters.push({ name: "Publications year", value: String(item.year) });
  }
  if (includesContext(item, "research")) {
    filters.push({ name: "Research context", value: "research" });
  }
  publicationQualityFilters(item).forEach((quality) => {
    filters.push({ name: "Publications quality", value: quality });
  });
  uniqueValues([
    ...toArray(item.researchThemes),
    ...toArray(item.categories),
    ...toArray(item.keywords)
  ]).slice(0, 10).forEach((topic) => {
    filters.push({ name: "Publications topic", value: topic });
  });
  pickString(item.researchLine) && filters.push({ name: "Publications research line", value: item.researchLine });

  return {
    filters,
    meta: {
      publicationYear: item.year || "",
      publicationType: item.typeCode || "",
      publicationTypeCode: item.typeCode || "",
      publicationTypeLabel: item.type || "",
      publicationGroup: item.publicationGroup || "",
      publicationAuthors: item.authors || "",
      publicationVenue: item.journal || item.publisher || "",
      publicationDescription: snippet(item.description, 260),
      publicationDate: item.date || "",
      publicationJournal: item.journal || "",
      publicationPublisher: item.publisher || "",
      publicationVolume: item.volume || "",
      publicationIssue: item.issue || "",
      publicationPages: item.pages || "",
      publicationIsbn: item.isbn || "",
      publicationDoi: item.doi || "",
      publicationDoiUrl: item.doiUrl || "",
      publicationSourceUrl: item.url || "",
      publicationSourceLabel: item.sourceLabel || "",
      publicationCitationCount: item.citationCount ?? 0,
      publicationJufoLevel: item.jufoLevel ?? "",
      publicationPeerReviewed: item.peerReviewed ? "true" : "",
      publicationOpenAccess: item.openAccess ? "true" : "",
      publicationCsl: item.csl ? JSON.stringify(item.csl) : ""
    }
  };
}

module.exports = {
  publicationGroupLabel,
  buildPublicationsFindExplorePageModel,
  buildPublicationFindExploreDocument
};

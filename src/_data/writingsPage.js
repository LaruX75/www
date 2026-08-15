const toPublicContentRecord = require("../_utils/toPublicContentRecord");
const { buildPublicationsPageModel } = require("./publicationsPage");

const PUBLIC_WRITINGS_PAGE_FIELDS = Object.freeze([
  "id",
  "contentType",
  "sectionKeys",
  "source",
  "sourceKey",
  "sourceLabel",
  "recordOrigin",
  "title",
  "description",
  "date",
  "year",
  "lang",
  "url",
  "pageUrl",
  "sourceUrl",
  "isExternal",
  "categories",
  "keywords",
  "contexts",
  "authors",
  "authorsText",
  "publication",
  "publicationType",
  "journal",
  "publisher",
  "type",
  "typeCode",
  "publicationGroup",
  "event",
  "forum",
  "speechContext",
  "speechKind",
  "meeting",
  "meetingDate",
  "initiativeType",
  "writingRoles",
  "opinionRoles",
  "taxonomyTypeKey",
  "taxonomyTypeLabel",
  "doi",
  "doiUrl",
  "volume",
  "issue",
  "pages"
]);

const WRITINGS_SECTION_ORDER = Object.freeze([
  "statements",
  "opinions",
  "columns",
  "initiatives",
  "speeches",
  "publicSpeeches",
  "blog",
  "publications"
]);

const FI_COMPATIBILITY_CONTENT_TYPES = Object.freeze([
  "blogPost",
  "opinion",
  "column"
]);

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
  const arr = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const normalized = arr
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  return normalized.length ? normalized : null;
}

function sortSectionKeys(sectionKeys = []) {
  return [...new Set(toArray(sectionKeys))]
    .sort((left, right) => {
      const leftIndex = WRITINGS_SECTION_ORDER.indexOf(left);
      const rightIndex = WRITINGS_SECTION_ORDER.indexOf(right);
      if (leftIndex === -1 && rightIndex === -1) {
        return String(left).localeCompare(String(right));
      }
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
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

function comparableDate(value) {
  return pickString(value) || "";
}

function comparableTieBreaker(item = {}) {
  return pickString(item.pageUrl)
    || pickString(item.url)
    || pickString(item.title)
    || pickString(item.id)
    || "";
}

function parseAuthors(value) {
  if (Array.isArray(value)) {
    return normalizeStringArray(value);
  }
  const raw = pickString(value);
  if (!raw) return null;
  if (raw.includes(";")) {
    return normalizeStringArray(raw.split(";"));
  }
  return [raw];
}

function authorsText(value) {
  const authors = parseAuthors(value);
  return authors ? authors.join("; ") : null;
}

function primaryUrl(record = {}) {
  return pickString(record.sourceUrl) || pickString(record.url) || pickString(record.pageUrl);
}

function localPageUrl(record = {}) {
  return pickString(record.pageUrl) || pickString(record.url);
}

function classifySpeechKind(record = {}, item = {}) {
  const speechContext = pickString(record.speechContext) || pickString(item?.data?.speechContext) || "";
  const forums = normalizeStringArray(record.forum || item?.data?.forum) || [];
  const event = pickString(record.event) || pickString(item?.data?.event) || "";

  if (speechContext === "kyselytunti") return "questionHour";
  if (speechContext === "valtuusto") return "council";
  if (speechContext === "akateeminen-puhe") return "academic";
  if (speechContext === "juhlapuhe") return "ceremonial";
  if (speechContext === "julkinen-tilaisuus") return "public";
  if (event === "Oulun kaupunginvaltuusto" || forums.includes("Kaupunginvaltuusto")) return "council";
  return "public";
}

function sharedRecordSectionKeys(record = {}, item = {}) {
  switch (record.contentType) {
    case "blogPost":
      return ["blog"];
    case "opinion":
      return ["opinions"];
    case "column":
      return ["columns"];
    case "initiative":
      return ["initiatives"];
    case "statement":
      return ["statements"];
    case "speech": {
      const kind = classifySpeechKind(record, item);
      return kind === "public" || kind === "academic" || kind === "ceremonial"
        ? ["speeches", "publicSpeeches"]
        : ["speeches"];
    }
    default:
      return [];
  }
}

function toWritingsPageRecord(record = {}) {
  return pickFields(record, PUBLIC_WRITINGS_PAGE_FIELDS);
}

function buildSharedWritingsRecord(item) {
  const record = toPublicContentRecord(item);
  if (!record) return null;

  const sectionKeys = sortSectionKeys(sharedRecordSectionKeys(record, item));
  if (!sectionKeys.length) return null;

  const speechKind = record.contentType === "speech" ? classifySpeechKind(record, item) : null;

  return toWritingsPageRecord(omitEmpty({
    id: pickString(record.id),
    contentType: pickString(record.contentType),
    sectionKeys,
    source: pickString(record.source) || "local",
    sourceKey: pickString(record.source) || "local",
    sourceLabel: pickString(record.source) || "Local content",
    recordOrigin: "shared-content",
    title: pickString(record.title),
    description: pickString(record.description),
    date: pickString(record.date),
    year: pickNumber(record.year),
    lang: pickString(record.lang) || "fi",
    url: primaryUrl(record),
    pageUrl: localPageUrl(record),
    sourceUrl: pickString(record.sourceUrl),
    isExternal: /^https?:/i.test(primaryUrl(record) || ""),
    categories: normalizeStringArray(record.categories),
    keywords: normalizeStringArray(record.keywords),
    contexts: normalizeStringArray(record.contexts),
    authors: parseAuthors(record.authors),
    authorsText: authorsText(record.authors),
    publication: pickString(record.publication),
    publicationType: pickString(record.publicationType),
    event: pickString(record.event),
    forum: normalizeStringArray(record.forum),
    speechContext: pickString(record.speechContext),
    speechKind,
    meeting: pickString(record.meeting),
    meetingDate: pickString(record.meetingDate),
    initiativeType: pickString(record.initiativeType),
    writingRoles: normalizeStringArray(record.writingRoles),
    opinionRoles: normalizeStringArray(record.opinionRoles),
    taxonomyTypeKey: pickString(record.taxonomyTypeKey),
    taxonomyTypeLabel: pickString(record.taxonomyTypeLabel)
  }));
}

function buildPublicationWritingsRecord(item = {}) {
  return toWritingsPageRecord(omitEmpty({
    id: pickString(item.id),
    contentType: "scientificPublication",
    sectionKeys: ["publications"],
    source: pickString(item.sourceKey) || "researchfi",
    sourceKey: pickString(item.sourceKey) || "researchfi",
    sourceLabel: pickString(item.sourceLabel) || "Research.fi",
    recordOrigin: pickString(item.recordOrigin) || "publications-page",
    title: pickString(item.title),
    description: pickString(item.description),
    date: pickString(item.date),
    year: pickNumber(item.year),
    lang: pickString(item.lang) || "fi",
    url: pickString(item.url) || pickString(item.doiUrl) || pickString(item.pageUrl),
    pageUrl: pickString(item.pageUrl),
    sourceUrl: pickString(item.url) || pickString(item.doiUrl),
    isExternal: /^https?:/i.test(pickString(item.url) || pickString(item.doiUrl) || ""),
    categories: normalizeStringArray(item.categories),
    keywords: normalizeStringArray(item.keywords),
    contexts: normalizeStringArray(item.contexts),
    authors: parseAuthors(item.authors),
    authorsText: authorsText(item.authors),
    publication: pickString(item.journal) || pickString(item.publisher),
    journal: pickString(item.journal),
    publisher: pickString(item.publisher),
    type: pickString(item.type),
    typeCode: pickString(item.typeCode),
    publicationGroup: pickString(item.publicationGroup),
    doi: pickString(item.doi),
    doiUrl: pickString(item.doiUrl),
    volume: pickString(item.volume),
    issue: pickString(item.issue),
    pages: pickString(item.pages)
  }));
}

function uniqueById(items = []) {
  const seen = new Set();
  const duplicates = [];
  const uniqueItems = [];

  toArray(items).forEach((item) => {
    const id = pickString(item?.id);
    if (!id) return;
    if (seen.has(id)) {
      duplicates.push(id);
      return;
    }
    seen.add(id);
    uniqueItems.push(item);
  });

  return {
    items: uniqueItems,
    duplicateIds: duplicates
  };
}

function summarizeCounts(items = [], field) {
  return toArray(items).reduce((acc, item) => {
    const values = Array.isArray(item?.[field]) ? item[field] : [item?.[field]];
    values
      .map((value) => String(value || "").trim())
      .filter(Boolean)
      .forEach((value) => {
        acc[value] = (acc[value] || 0) + 1;
      });
    return acc;
  }, {});
}

function sortCanonicalItems(items = []) {
  return [...toArray(items)].sort((left, right) => {
    const yearDiff = (right.year || 0) - (left.year || 0);
    if (yearDiff !== 0) return yearDiff;

    const dateDiff = comparableDate(right.date).localeCompare(comparableDate(left.date));
    if (dateDiff !== 0) return dateDiff;

    const sectionLeft = sortSectionKeys(left.sectionKeys || [])[0] || "";
    const sectionRight = sortSectionKeys(right.sectionKeys || [])[0] || "";
    if (sectionLeft !== sectionRight) {
      return WRITINGS_SECTION_ORDER.indexOf(sectionLeft) - WRITINGS_SECTION_ORDER.indexOf(sectionRight);
    }

    return comparableTieBreaker(left).localeCompare(comparableTieBreaker(right), "fi");
  });
}

function sortItemsByDateDesc(items = []) {
  return [...toArray(items)].sort((left, right) => {
    const dateDiff = comparableDate(right.date).localeCompare(comparableDate(left.date));
    if (dateDiff !== 0) return dateDiff;
    return comparableTieBreaker(left).localeCompare(comparableTieBreaker(right), "fi");
  });
}

function countRoleMatches(items = [], role, fields = ["opinionRoles", "writingRoles"]) {
  return toArray(items).filter((item) => {
    const values = new Set(
      fields.flatMap((field) => toArray(item?.[field]).map((value) => String(value || "").trim()).filter(Boolean))
    );
    if (role === "hybrid") {
      return values.has("political") && values.has("expert");
    }
    return values.has(role);
  }).length;
}

function hasSectionKey(item = {}, sectionKey) {
  return toArray(item?.sectionKeys).includes(sectionKey);
}

function collectSharedSourceItems(data = {}) {
  const collections = data.collections || {};

  return [
    ...toArray(collections.content),
    ...toArray(collections.blog),
    ...toArray(collections.publications),
    ...toArray(collections.politics),
  ];
}

function buildCanonicalWritingsPageItems(data = {}) {
  const sharedItems = collectSharedSourceItems(data)
    .map(buildSharedWritingsRecord)
    .filter(Boolean);

  const publicationsPage = buildPublicationsPageModel(data);
  const publicationItems = toArray(publicationsPage.items)
    .map(buildPublicationWritingsRecord)
    .filter(Boolean);

  const deduped = uniqueById([
    ...sharedItems,
    ...publicationItems
  ]);

  return {
    items: sortCanonicalItems(deduped.items),
    duplicateIds: deduped.duplicateIds,
    sourceCounts: summarizeCounts(deduped.items, "sourceKey"),
    contentTypeCounts: summarizeCounts(deduped.items, "contentType"),
    sectionCounts: summarizeCounts(deduped.items, "sectionKeys")
  };
}

function buildWritingsPageModel(data = {}) {
  const canonical = buildCanonicalWritingsPageItems(data);
  return {
    items: canonical.items,
    duplicateIds: canonical.duplicateIds,
    sourceCounts: canonical.sourceCounts,
    contentTypeCounts: canonical.contentTypeCounts,
    sectionCounts: canonical.sectionCounts
  };
}

function buildFinnishWritingsCompatibilityItems(items = []) {
  return sortCanonicalItems(
    toArray(items).filter((item) => FI_COMPATIBILITY_CONTENT_TYPES.includes(item?.contentType))
  );
}

function buildFinnishWritingsViewModel(data = {}) {
  const writingsPage = Array.isArray(data?.items) ? { items: data.items } : buildWritingsPageModel(data);
  const compatibilityItems = buildFinnishWritingsCompatibilityItems(writingsPage.items);
  const opinionItems = sortItemsByDateDesc(compatibilityItems.filter((item) => item?.contentType === "opinion"));
  const columnItems = sortItemsByDateDesc(compatibilityItems.filter((item) => item?.contentType === "column"));
  const blogItems = sortItemsByDateDesc(compatibilityItems.filter((item) => item?.contentType === "blogPost"));

  return {
    compatibilityRule: {
      contentTypes: [...FI_COMPATIBILITY_CONTENT_TYPES],
      note: "FI subset on current compatibility projection, ei canonical writings -sisällön pysyvä määritelmä."
    },
    items: compatibilityItems,
    opinionItems,
    columnItems,
    blogItems,
    openingOpinionItems: opinionItems.slice(0, 5),
    openingColumnItems: columnItems.slice(0, 5),
    openingBlogItems: blogItems.slice(0, 5),
    opinionCount: opinionItems.length,
    columnCount: columnItems.length,
    blogCount: blogItems.length,
    politicalOpinionCount: countRoleMatches(opinionItems, "political"),
    expertOpinionCount: countRoleMatches(opinionItems, "expert"),
    hybridOpinionCount: countRoleMatches(opinionItems, "hybrid"),
    contentTypeCounts: summarizeCounts(compatibilityItems, "contentType"),
    sectionCounts: summarizeCounts(compatibilityItems, "sectionKeys")
  };
}

function buildEnglishWritingsViewModel(data = {}) {
  const writingsPage = Array.isArray(data?.items) ? { items: data.items } : buildWritingsPageModel(data);
  const allItems = sortCanonicalItems(writingsPage.items);
  const statementItems = sortItemsByDateDesc(allItems.filter((item) => item?.contentType === "statement"));
  const opinionItems = sortItemsByDateDesc(allItems.filter((item) => item?.contentType === "opinion"));
  const columnItems = sortItemsByDateDesc(allItems.filter((item) => item?.contentType === "column"));
  const initiativeItems = sortItemsByDateDesc(allItems.filter((item) => item?.contentType === "initiative"));
  const speechItems = sortItemsByDateDesc(allItems.filter((item) => item?.contentType === "speech"));
  const publicSpeechItems = sortItemsByDateDesc(allItems.filter((item) => hasSectionKey(item, "publicSpeeches")));
  const blogItems = sortItemsByDateDesc(allItems.filter((item) => item?.contentType === "blogPost"));
  const publicationItems = sortCanonicalItems(allItems.filter((item) => item?.contentType === "scientificPublication"));

  return {
    items: allItems,
    statementItems,
    opinionItems,
    columnItems,
    initiativeItems,
    speechItems,
    publicSpeechItems,
    blogItems,
    publicationItems,
    openingOpinionItems: opinionItems.slice(0, 5),
    openingColumnItems: columnItems.slice(0, 5),
    openingInitiativeItems: initiativeItems.slice(0, 5),
    openingSpeechItems: speechItems.slice(0, 5),
    openingBlogItems: blogItems.slice(0, 5),
    statementCount: statementItems.length,
    opinionCount: opinionItems.length,
    columnCount: columnItems.length,
    initiativeCount: initiativeItems.length,
    speechCount: speechItems.length,
    publicSpeechCount: publicSpeechItems.length,
    blogCount: blogItems.length,
    publicationCount: publicationItems.length,
    politicalOpinionCount: countRoleMatches(opinionItems, "political"),
    expertOpinionCount: countRoleMatches(opinionItems, "expert"),
    hybridOpinionCount: countRoleMatches(opinionItems, "hybrid"),
    contentTypeCounts: summarizeCounts(allItems, "contentType"),
    sectionCounts: summarizeCounts(allItems, "sectionKeys")
  };
}

module.exports = {
  PUBLIC_WRITINGS_PAGE_FIELDS,
  WRITINGS_SECTION_ORDER,
  FI_COMPATIBILITY_CONTENT_TYPES,
  parseAuthors,
  authorsText,
  classifySpeechKind,
  buildSharedWritingsRecord,
  buildPublicationWritingsRecord,
  buildCanonicalWritingsPageItems,
  buildWritingsPageModel,
  buildFinnishWritingsCompatibilityItems,
  buildFinnishWritingsViewModel,
  buildEnglishWritingsViewModel
};

/**
 * Hakemistokohtainen data koko src/-hakemistolle.
 *
 * Sisaltaa eleventyComputed-osan joka paattelee breadcrumb-avaimet
 * sivukohtaisesti. Aiemmin sama logiikka asui src/_includes/base.njk:n
 * alkupaassa (rivit 6-68) 22 ehdon Nunjucks-if/elif-ketjuna.
 *
 * Muuttujat sailyvat tasmalleen samoin kuin ennen:
 *
 * - breadcrumbKey: avain jota syotetaan eleventyNavigationBreadcrumb-
 *   filtterille (kaytetaan breadcrumb.njk:ssa ja _ldschema.njk:ssa).
 * - breadcrumbDetailTitle / breadcrumbDetailUrl: viimeisen breadcrumb-
 *   elementin tarkennus (kyselytunti / valtuustoaloite).
 *
 * Muutos on refaktori, ei kayttaytymismuutos: sama tulos, siirretty
 * datakerrokseen jotta base.njk on pelkka esitystaso.
 *
 * HUOM: Hakemistokohtaiset .11tydata.js-tiedostot (esim. blog/blog.11tydata.js)
 * voivat maaritella omia eleventyComputed-avaimia; Eleventy yhdistaa nama
 * shallow-mergena, joten yhtaan avainta ei mene rikki.
 */

const WRITING_TYPES = new Set([
  "puhe", "mielipide", "kolumni", "lausunto", "blogikirjoitus", "artikkeli"
]);
const {
  buildWritingsPageModel,
  FI_COMPATIBILITY_CONTENT_TYPES
} = require("./_data/writingsPage");
const { buildPublicationsPageModel } = require("./_data/publicationsPage");
const {
  buildPresentationsPageSourceData,
  buildCanonicalPresentationItems
} = require("./_data/presentationsPage");
const { buildThesisFindExploreDocument } = require("./_utils/thesesFindExplore");
const { buildPublicationFindExploreDocument } = require("./_utils/publicationsFindExplore");

const writingsLookupCache = new WeakMap();
const publicationsLookupCache = new WeakMap();
const presentationsLookupCache = new WeakMap();

function normalizeFilterValues(values, limit = 8) {
  const array = Array.isArray(values) ? values : values ? [values] : [];
  return [...new Set(array.map((value) => String(value || "").trim()).filter(Boolean))].slice(0, limit);
}

function yearFromData(data) {
  const raw = data?.page?.date || data?.date || "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return String(parsed.getUTCFullYear());
}

function resolveFallbackWritingsPagefindRecord(data) {
  const inputPath = String(data?.page?.inputPath || "");
  const tagSet = new Set(Array.isArray(data?.tags) ? data.tags : []);
  const isBlog = inputPath.includes("src/blog/") || tagSet.has("blog");
  if (!isBlog) return null;

  return {
    contentType: "blogPost",
    year: yearFromData(data),
    writingRoles: Array.isArray(data?.writingRoles) ? data.writingRoles : [],
    opinionRoles: Array.isArray(data?.opinionRoles) ? data.opinionRoles : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
    contexts: Array.isArray(data?.contexts) ? data.contexts : []
  };
}

function getWritingsLookup(data) {
  if (!data || !data.collections) return null;
  if (writingsLookupCache.has(data.collections)) {
    return writingsLookupCache.get(data.collections);
  }

  const lookup = new Map();
  try {
    const model = buildWritingsPageModel(data);
    (model.items || []).forEach((item) => {
      if (item?.pageUrl) lookup.set(item.pageUrl, item);
    });
  } catch (error) {
    // Some Eleventy phases do not have the full collection graph yet.
  }
  writingsLookupCache.set(data.collections, lookup);
  return lookup;
}

function getPublicationsLookup(data) {
  if (!data || !data.collections) return null;
  if (publicationsLookupCache.has(data.collections)) {
    return publicationsLookupCache.get(data.collections);
  }

  const lookup = new Map();
  try {
    const model = buildPublicationsPageModel(data);
    (model.items || []).forEach((item) => {
      if (item?.pageUrl) lookup.set(item.pageUrl, item);
    });
  } catch (error) {
    // Some Eleventy phases do not have the full publication graph yet.
  }
  publicationsLookupCache.set(data.collections, lookup);
  return lookup;
}

function resolvePagefindWritings(data) {
  const url = data?.page?.url || "";
  const lookup = getWritingsLookup(data);
  const item = lookup?.get(url) || resolveFallbackWritingsPagefindRecord(data);
  if (!item) return null;

  const filters = [
    { name: "Sisältö", value: "Kirjoitukset ja puheenvuorot" },
    { name: "FindExplore", value: "writings" },
    { name: "Writings scope", value: "en" },
    { name: "Writings content type", value: item.contentType },
  ];

  if (FI_COMPATIBILITY_CONTENT_TYPES.includes(item.contentType)) {
    filters.push({ name: "Writings scope", value: "fi" });
  }
  if (item.year) {
    filters.push({ name: "Writings year", value: String(item.year) });
  }
  normalizeFilterValues([...(item.writingRoles || []), ...(item.opinionRoles || [])], 4)
    .forEach((role) => filters.push({ name: "Writings role", value: role }));
  normalizeFilterValues(item.categories, 6)
    .forEach((category) => filters.push({ name: "Writings topic", value: category }));
  normalizeFilterValues(item.contexts, 8)
    .forEach((context) => {
      if (context === "research") {
        filters.push({ name: "Research context", value: "research" });
      }
    });

  return {
    filters,
    meta: {
      writingsContentType: item.contentType,
      writingsYear: item.year || ""
    }
  };
}

function resolvePagefindPublications(data) {
  const url = data?.page?.url || "";
  const lookup = getPublicationsLookup(data);
  const item = lookup?.get(url);
  if (!item) return null;
  return buildPublicationFindExploreDocument(item);
}

function getPresentationsLookup(data) {
  if (!data || !data.collections) return null;
  if (presentationsLookupCache.has(data.collections)) {
    return presentationsLookupCache.get(data.collections);
  }

  const lookup = new Map();
  try {
    const sourceData = buildPresentationsPageSourceData(data);
    // buildCanonicalPresentationItems returns records enriched by
    // withPresentationSemantics: presentationType, event, role,
    // landingUrl, landingType, hasLocalDetail, externalFirst, topics,
    // year, contexts. External-first records without local detail
    // are still in the array but their pageUrl/localPageUrl are
    // empty strings; the guard below filters them out so the lookup
    // only maps records that actually correspond to indexed local
    // detail pages.
    buildCanonicalPresentationItems(sourceData).forEach((item) => {
      if (item?.pageUrl) lookup.set(item.pageUrl, item);
      if (item?.localPageUrl && item.localPageUrl !== item.pageUrl) {
        lookup.set(item.localPageUrl, item);
      }
    });
  } catch (error) {
    // Some Eleventy phases do not have the full presentation graph yet.
  }
  presentationsLookupCache.set(data.collections, lookup);
  return lookup;
}

// Pure projection from an enriched canonical presentation item to the
// Pagefind {filters, meta} shape. Extracted so unit tests can exercise
// the projection without going through the filesystem-backed
// buildPresentationsPageSourceData.
function projectPresentationRecord(item) {
  if (!item) return null;
  const filters = [
    { name: "Sisältö", value: "Esitykset" },
    { name: "FindExplore", value: "presentations" }
  ];

  if (item.year) {
    filters.push({ name: "PresentationYear", value: String(item.year) });
  }
  if (item.presentationType) {
    filters.push({ name: "PresentationType", value: String(item.presentationType) });
  }
  normalizeFilterValues(item.topics, 6)
    .forEach((topic) => filters.push({ name: "PresentationTopic", value: topic }));
  normalizeFilterValues(item.contexts, 8)
    .forEach((context) => {
      if (context === "research") {
        filters.push({ name: "Research context", value: "research" });
      }
    });

  const meta = {};
  if (item.year) meta.PresentationYear = String(item.year);
  if (item.presentationType) meta.PresentationType = String(item.presentationType);
  if (item.event) meta.PresentationEvent = String(item.event);

  return { filters, meta };
}

function resolvePagefindPresentations(data) {
  const url = data?.page?.url || "";
  const lookup = getPresentationsLookup(data);
  const item = lookup?.get(url);
  // Only presentations that have a local detail page match. External-
  // first Canva/YouTube/AOE records without local HTML are not
  // indexed by Pagefind (they have no page to index) and therefore
  // never reach this projector.
  if (!item) return null;
  return projectPresentationRecord(item);
}

function resolvePagefindDocument(data) {
  if (data?.thesisDetail) {
    return buildThesisFindExploreDocument(data.thesisDetail);
  }

  return (
    resolvePagefindPublications(data)
    || resolvePagefindPresentations(data)
    || resolvePagefindWritings(data)
  );
}

// URL -> breadcrumbKey (tarkat vertailut)
const URL_TO_KEY = {
  "/julkaisut/": "publications",
  "/en/publications/": "publications",

  "/esitykset/": "presentations",
  "/en/presentations/": "presentations",

  "/opinnaytteet/": "theses",
  "/en/theses/": "theses",

  "/blogi/": "blog",
  "/en/blog/": "blog",

  "/mediassa/": "media",
  "/en/media/": "media",

  "/tietoa/": "me",
  "/autolomat/": "me",
  "/cv/": "me",
  "/portfolio/": "me",
  "/kouluttaja/": "me",
  "/puhuja/": "me",
  "/larux-tmi/": "me",
  "/yritys/": "me",
  "/en/about/": "me",
  "/en/cv/": "me",
  "/en/portfolio/": "me",
  "/en/company/": "me",
  "/en/road-trips/": "me",

  "/yhteiskunnallinen-vuorovaikutus/": "societal_interaction",
  "/en/societal-engagement/": "societal_interaction",

  "/vaitoskirja/": "dissertation",
  "/en/dissertation/": "dissertation",

  "/opetus/": "work",
  "/tutkimus/": "work",
  "/tyoni-yliopistonlehtorina/": "work",
  "/palkinnot/": "work",
  "/en/work/": "work",
  "/en/writings/": "work",
  "/en/research/": "work",
  "/en/awards/": "work",

  "/politiikka/": "politics",
  "/politiiikka/": "politics",
  "/poliittinen-avoimuus/": "politics",
  "/en/politics/": "politics",
  "/en/affiliations/": "politics",

  "/politiikka/vaalikaudet/": "election_history",
  "/vaalikaudet/": "election_history",
  "/vaalihistoria/": "election_history",
  "/en/election-history/": "election_history",
  "/kuntavaalit-2021/": "election_history",
  "/jari-laru-aluevaltuustoon/": "election_history",
  "/kunnallisvaalit-2012/": "election_history",

  "/kunta-ja-aluevaalit-2025/": "election_2025",
  "/en/municipal-and-wellbeing-elections-2025/": "election_2025",

  "/kynasta/": "writings",

  "/yhteystiedot/": "contact",
  "/en/contact/": "contact"
};

function keyFromInputPath(inputPath, type) {
  if (!inputPath) return "";
  if (inputPath.includes("src/publications/")) {
    return WRITING_TYPES.has(type) ? "writings" : "publications";
  }
  if (inputPath.includes("src/presentations/")) return "presentations";
  if (inputPath.includes("src/media/")) return "media";
  if (inputPath.includes("src/blog/")) return "blog";
  if (inputPath.includes("src/politics/")) return "politics";
  return "";
}

function keyFromUrl(url) {
  if (!url) return "";

  if (URL_TO_KEY[url]) return URL_TO_KEY[url];

  // Prefix-vertailut (startsWith)
  if (url.startsWith("/politiikka/kaupunginvaltuusto/")) return "council_meetings";
  if (url.startsWith("/kaupunginvaltuusto/")) return "council_meetings";
  if (url.startsWith("/valtuusto/")) return "council_meetings";
  if (url.startsWith("/politiikka/sivistyslautakunta/")) return "education_committee";
  if (url.startsWith("/teemat/")) return "topic_profiles";

  return "";
}

function resolveBreadcrumbKey(data) {
  const inputPath = data.page && data.page.inputPath;
  const url = (data.page && data.page.url) || "";
  const type = data.type;

  // 1. Sisaltohakemistoihin perustuvat sivut voittavat (esim. src/publications/*)
  const byPath = keyFromInputPath(inputPath, type);
  if (byPath) return byPath;

  // 2. Muut sivut URL:n perusteella
  return keyFromUrl(url);
}

function resolveBreadcrumbDetail(data) {
  const url = (data.page && data.page.url) || "";
  const lang = data.lang || (url.startsWith("/en/") ? "en" : "fi");
  const contexts = Array.isArray(data.contexts) ? data.contexts : [];
  const keywords = Array.isArray(data.keywords) ? data.keywords : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];

  const isQuestion =
    data.agenda_title === "Valtuuston kyselytunti" ||
    contexts.includes("Valtuuston kyselytunti") ||
    keywords.includes("valtuustokysely");

  const isInitiative =
    Boolean(data.initiative_type) ||
    tags.includes("aloitteet") ||
    keywords.includes("valtuustoaloite");

  if (isQuestion) {
    return {
      title: lang === "en" ? "Council question hour" : "Valtuuston kyselytunti",
      url: lang === "en" ? "/en/writings/#puheet" : "/valtuustotyo/#puheet"
    };
  }
  if (isInitiative) {
    return {
      title: lang === "en" ? "Council initiative" : "Valtuustoaloite",
      url: lang === "en" ? "/en/writings/#aloitteet" : "/valtuustotyo/#aloitteet"
    };
  }
  return { title: "", url: "" };
}

module.exports = {
  eleventyComputed: {
    breadcrumbKey: (data) => resolveBreadcrumbKey(data),
    breadcrumbDetailTitle: (data) => resolveBreadcrumbDetail(data).title,
    breadcrumbDetailUrl: (data) => resolveBreadcrumbDetail(data).url,
    pagefindDocument: (data) => resolvePagefindDocument(data)
  }
};

// Named exports for unit tests only. The Eleventy runtime consumes
// `eleventyComputed` above; nothing at runtime imports these.
module.exports.projectPresentationRecord = projectPresentationRecord;
module.exports.resolvePagefindPresentations = resolvePagefindPresentations;
module.exports.resolvePagefindDocument = resolvePagefindDocument;

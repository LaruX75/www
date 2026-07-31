const loadResearchfi = require("./researchfi");
const { readCache } = require("./_apiCache");
const { normalizeCategoryList, normalizeKeywordList } = require("./metadata-normalization");
const { resolveContexts } = require("./contentContext");
const curatedProgram = require("../curated/research-program.json");

const ENRICHMENT_CACHE_KEYS = [
  "publication-abstract-enrichments-v2",
  "publication-abstract-enrichments-v1"
];

const GENERIC_KEYWORD_BLACKLIST = new Set([
  "art",
  "autonomy",
  "computer science",
  "curriculum",
  "embedding",
  "exploit",
  "manifesto",
  "multimedia",
  "perception",
  "psychology",
  "rubric",
  "software",
  "world wide web"
]);

const RESEARCH_THEME_KEYWORDS = {
  "cscl": "CSCL",
  "digipedagogiikka": "digipedagogiikka",
  "koneoppiminen": "koneoppiminen",
  "mobiilioppiminen": "mobiilioppiminen",
  "ohjelmointi": "ohjelmointi",
  "ohjelmoinnillinen-ajattelu": "laskennallinen ajattelu",
  "opettajankoulutus": "opettajankoulutus",
  "oppimisymparistot": "oppimisympäristöt",
  "selitettava-tekoaly": "selitettävä tekoäly",
  "tekoalylukutaito": "tekoälylukutaito",
  "teknologiakasvatus": "teknologiakasvatus",
  "tietosuoja": "tietosuoja",
  "yhteisollinen-oppiminen": "yhteisöllinen oppiminen"
};

let memoizedContentPromise = null;
const CURATED_PUBLICATION_META = curatedProgram.publicationMeta || {};

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildEnrichmentMap() {
  for (const key of ENRICHMENT_CACHE_KEYS) {
    const cached = readCache(key);
    const data = cached?.data;
    if (data && typeof data === "object") {
      return data;
    }
  }
  return {};
}

function inferCategories(publication, enrichment) {
  const categories = new Set(["Yliopisto ja korkeakoulut"]);
  const haystack = [
    publication.title,
    publication.journal,
    publication.typeFi,
    ...(publication.keywords || []),
    enrichment?.primaryTopic,
    ...(enrichment?.topics || []),
    ...(enrichment?.keywords || [])
  ].join(" ").toLowerCase();

  if (/(tekoaly|tekoäly|genai|generative ai|artificial intelligence|machine learning|xai|ai literacy)/i.test(haystack)) {
    categories.add("Koulutusteknologia");
  }

  if (/(education|teacher|teaching|learning|school|k-12|opettaj|oppimin|opetus|koulu|varhaiskasvatus)/i.test(haystack)) {
    categories.add("Sivistys ja koulutus");
  }

  if (/(mobile|mobiili|cscl|collaborative|oppimisympäristö|oppimisymparisto|digital fabrication|social media|edtech)/i.test(haystack)) {
    categories.add("Koulutusteknologia");
  }

  return normalizeCategoryList(Array.from(categories));
}

function inferKeywords(publication, enrichment) {
  const collected = [];
  const pushKeyword = (value) => {
    const normalized = normalizeText(value);
    if (!normalized) return;
    collected.push(normalized);
  };

  (publication.keywords || []).forEach(pushKeyword);

  if (enrichment?.primaryTopic) {
    pushKeyword(enrichment.primaryTopic);
  }

  (enrichment?.topics || []).slice(0, 3).forEach(pushKeyword);

  inferTitleKeywords(publication, enrichment).forEach(pushKeyword);

  if (collected.length < 5) {
    (enrichment?.keywords || [])
      .filter(isUsefulEnrichmentKeyword)
      .slice(0, 4)
      .forEach(pushKeyword);
  }

  return normalizeKeywordList(collected).slice(0, 8);
}

function inferTitleKeywords(publication, enrichment) {
  const haystack = [
    publication.title,
    publication.journal,
    enrichment?.abstract,
    enrichment?.primaryTopic
  ].join(" ").toLowerCase();

  const inferred = [];
  const maybeAdd = (pattern, keyword) => {
    if (pattern.test(haystack)) inferred.push(keyword);
  };

  maybeAdd(/genai|generative ai|generatiiv/i, "generatiivinen tekoäly");
  maybeAdd(/xai|explainable ai|selitett/i, "selitettävä tekoäly");
  maybeAdd(/ai literacy|tekoaly[lly]?kutaito|tekoäly[lly]?kutaito/i, "tekoälylukutaito");
  maybeAdd(/machine learning|koneoppimi/i, "koneoppiminen");
  maybeAdd(/computational thinking/i, "laskennallinen ajattelu");
  maybeAdd(/learning analytics/i, "oppimisanalytiikka");
  maybeAdd(/social media/i, "sosiaalinen media");
  maybeAdd(/programming|coding/i, "ohjelmointi");
  maybeAdd(/collaborative learning|cscl/i, "yhteisöllinen oppiminen");
  maybeAdd(/mobile learning|mobiilioppimi/i, "mobiilioppiminen");
  maybeAdd(/teacher education|pre-service teacher|teacher training|opettajankoulut/i, "opettajankoulutus");
  maybeAdd(/open science|avoin tiede/i, "avoin tiede");
  maybeAdd(/privacy|data protection/i, "tietosuoja");

  return inferred;
}

function isUsefulEnrichmentKeyword(value) {
  const keyword = normalizeText(value);
  if (!keyword) return false;
  if (GENERIC_KEYWORD_BLACKLIST.has(keyword.toLowerCase())) return false;
  if (/[()]/.test(keyword) && !/(ai|education|learning|media|data|privacy|teacher|program|digital)/i.test(keyword)) {
    return false;
  }
  if (keyword.length < 5) return false;
  if (keyword.split(/\s+/).length === 1 && !/(ai|data|media|coding|digital|learning)/i.test(keyword)) {
    return false;
  }
  return true;
}

function buildDescription(publication, enrichment) {
  const abstract = normalizeText(enrichment?.abstract || "");
  if (abstract) {
    return abstract.length > 360 ? `${abstract.slice(0, 357)}...` : abstract;
  }

  const parts = [
    publication.typeFi,
    publication.journal,
    publication.year ? String(publication.year) : "",
    publication.peerReviewed ? "vertaisarvioitu" : ""
  ].filter(Boolean);

  if (!parts.length) return `Tutkimusjulkaisu: ${publication.title}`;
  return `${parts.join(" · ")}.`;
}

function formatAuthorInitials(value) {
  return normalizeText(value)
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(" ");
}

function formatAuthorApa(author) {
  const normalized = normalizeText(author);
  if (!normalized) return "";

  if (normalized.includes(",")) {
    const [lastName, ...rest] = normalized.split(",");
    const initials = formatAuthorInitials(rest.join(" "));
    return initials ? `${normalizeText(lastName)}, ${initials}` : normalizeText(lastName);
  }

  const parts = normalized.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];

  const lastName = parts.pop();
  const initials = formatAuthorInitials(parts.join(" "));
  return initials ? `${lastName}, ${initials}` : lastName;
}

function formatAuthorsApa(authors) {
  const formatted = normalizeText(authors)
    .split(/\s*;\s*/)
    .map(formatAuthorApa)
    .filter(Boolean);

  if (!formatted.length) return "";
  if (formatted.length === 1) return formatted[0];
  if (formatted.length === 2) return `${formatted[0]}, & ${formatted[1]}`;
  return `${formatted.slice(0, -1).join(", ")}, & ${formatted[formatted.length - 1]}`;
}

function buildApaCitation(publication) {
  const authors = formatAuthorsApa(publication.authors);
  const year = publication.year || "n.d.";
  const title = normalizeText(publication.title);
  const journal = normalizeText(publication.journal);
  const volume = normalizeText(publication.volume);
  const issue = normalizeText(publication.issue);
  const pages = normalizeText(publication.pages || publication.articleNumber);
  const publisher = normalizeText(publication.publisher);
  const link = normalizeText(publication.doiUrl || publication.url);

  let citation = "";
  if (authors) {
    citation += `${authors} (${year}). `;
  } else {
    citation += `(${year}). `;
  }

  citation += `${title}.`;

  if (journal) {
    citation += ` ${journal}`;
    if (volume) {
      citation += `, ${volume}`;
      if (issue) citation += `(${issue})`;
    } else if (issue) {
      citation += ` (${issue})`;
    }
    if (pages) citation += `, ${pages}`;
    citation += ".";
  } else if (publisher) {
    citation += ` ${publisher}.`;
  }

  if (link) {
    citation += ` ${link}`;
  }

  return citation.trim();
}

function buildReferenceLabel(publication) {
  return buildApaCitation(publication);
}

function buildEntities(publication, enrichment) {
  const entities = new Set(["Oulun yliopisto"]);
  const haystack = [
    publication.title,
    publication.journal,
    ...(enrichment?.topics || []),
    ...(enrichment?.keywords || [])
  ].join(" ").toLowerCase();

  if (haystack.includes("generation ai")) entities.add("Generation AI");
  if (haystack.includes("academy of finland")) entities.add("Suomen Akatemia");

  return Array.from(entities);
}

function applyCuratedMeta(item) {
  const meta = CURATED_PUBLICATION_META[item.anchorId] || CURATED_PUBLICATION_META[item.sourceAnchorId];
  if (!meta) return item;

  const researchThemes = toArray(meta.themes);
  const curatedKeywords = researchThemes
    .map((theme) => RESEARCH_THEME_KEYWORDS[theme])
    .filter(Boolean);

  return {
    ...item,
    researchLine: meta.researchLine || null,
    researchThemes,
    researchAudience: toArray(meta.audience),
    featuredOn: toArray(meta.featuredOn),
    researchPriority: Number.isFinite(meta.priority) ? meta.priority : 0,
    researchSummary: normalizeText(meta.summary || ""),
    // Curated themes become shared keywords without altering Research.fi fields.
    keywords: normalizeKeywordList([...curatedKeywords, ...item.keywords]).slice(0, 8)
  };
}

function mapPublication(publication, enrichmentMap) {
  const doiKey = String(publication.doi || "").trim().toLowerCase();
  const enrichment = enrichmentMap[doiKey] || null;
  const keywords = inferKeywords(publication, enrichment);
  const categories = inferCategories(publication, enrichment);

  const item = {
    anchorId: publication.anchorId,
    title: publication.title,
    description: buildDescription(publication, enrichment),
    citation: buildApaCitation(publication),
    citationStyle: "APA 7",
    date: publication.year ? `${publication.year}-01-01` : null,
    year: publication.year || null,
    type: "tieteellinen",
    contentType: "scientificPublication",
    source: "researchfi",
    sourceLabel: "Research.fi",
    taxonomyIdentity: `researchfi:${publication.sourceKey || publication.anchorId}`,
    categories,
    keywords,
    contexts: resolveContexts({
      title: publication.title,
      description: buildDescription(publication, enrichment),
      source: "researchfi",
      sourceLabel: "Research.fi",
      type: "tieteellinen",
      contentType: "scientificPublication",
      categories,
      keywords
    }, "/researchfi/"),
    entities: buildEntities(publication, enrichment),
    organization: "Oulun yliopisto",
    publicationId: publication.publicationId || null,
    sourceAnchorId: publication.sourceAnchorId || publication.anchorId,
    publicationTypeCode: publication.typeCode || "",
    publicationTypeLabel: publication.typeFi || "",
    publicationVenue: publication.journal || "",
    peerReviewed: Boolean(publication.peerReviewed),
    openAccess: Number(publication.openAccess || 0),
    authors: publication.authors || "",
    doi: publication.doi || "",
    doiUrl: publication.doiUrl || "",
    referenceLabel: buildReferenceLabel(publication),
    referenceUrl: publication.url || publication.doiUrl || "",
    url: `/julkaisut/#${publication.anchorId}`
  };

  if (enrichment?.primaryTopic) {
    item.primaryTopic = enrichment.primaryTopic;
  }

  return applyCuratedMeta(item);
}

function toCollectionItems(items = []) {
  return items.map((item, index) => {
    const date = item.date ? new Date(item.date) : new Date(`${item.year || 1900}-01-01`);
    return {
      url: item.url,
      // Virtual collection item for taxonomy/context grouping only.
      inputPath: `/virtual/researchfi/${item.anchorId || index}.json`,
      fileSlug: item.anchorId || `researchfi-${index + 1}`,
      date,
      data: item
    };
  });
}

async function loadResearchfiContent() {
  if (!memoizedContentPromise) {
    memoizedContentPromise = (async () => {
      const publications = await loadResearchfi();
      const enrichmentMap = buildEnrichmentMap();
      return publications.map((publication) => mapPublication(publication, enrichmentMap));
    })().catch((error) => {
      memoizedContentPromise = null;
      throw error;
    });
  }

  return memoizedContentPromise;
}

loadResearchfiContent.toCollectionItems = toCollectionItems;

module.exports = loadResearchfiContent;

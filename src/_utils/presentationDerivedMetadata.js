const slideshareContent = require("../../slideshare-content.json");
const teachingUnits = require("../_data/teachingUnits");
const { buildCanvaMerged, contentUrlToDesignId } = require("../_data/canvaMerged");
const { getCanvaDesignId } = require("../_data/canvaUrl");
const {
  normalizeCategoryList,
  normalizeKeywordList,
  slugifyTerm
} = require("../_data/metadata-normalization");

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeSlideshareUrl(url = "") {
  return String(url || "")
    .trim()
    .replace(/^http:\/\//i, "https://")
    .replace(/^https:\/\/slideshare\.net\//i, "https://www.slideshare.net/")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function hasCanvaUrl(value = "") {
  return /canva\.(com|link)/i.test(String(value || "").trim());
}

function normalizeSignalText(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isGenericSlideshareDescription(text = "") {
  const normalized = String(text || "").trim().toLowerCase();
  return (
    !normalized ||
    normalized === "." ||
    normalized === "-" ||
    normalized === "slideshare-esitys" ||
    normalized === "slideshare presentation"
  );
}

// Narrow HTML-entity decoder for scraped SlideShare transcripts. Source
// snapshots in `slideshare-content.json` contain `&quot;` where the
// original text had a plain double-quote; left encoded they later leak
// into meta descriptions (double-encoded), OG/Twitter tags, and JSON-LD
// (single-encoded, flagged by check:jsonld as html-entity-leak).
// `&amp;` must run LAST so a hypothetical `&amp;quot;` in source data
// does not get double-decoded. Kept in-file to mirror the identical
// helper in src/_data/presentationsPage.js; the two module-local copies
// avoid a shared-utility dependency that neither module otherwise needs.
function decodeHtmlEntities(text = "") {
  return String(text || "")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function transcriptExcerpt(text = "", maxLength = 420) {
  const decoded = decodeHtmlEntities(String(text || ""));
  const normalized = decoded
    .replace(/\s*---\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) return "";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}…` : normalized;
}

function buildSlideshareLookup(items = []) {
  return new Map(
    toArray(items)
      .filter((item) => normalizeSlideshareUrl(item?.url))
      .map((item) => [normalizeSlideshareUrl(item.url), item])
  );
}

const SLIDESHARE_LOOKUP = buildSlideshareLookup(slideshareContent);
const CANVA_BY_DESIGN_ID = new Map(
  buildCanvaMerged()
    .items
    .filter((item) => item?.designId)
    .map((item) => [item.designId, item])
);

function getSlideshareAnalysis(item = {}) {
  if (String(item?.source || "").trim() !== "slideshare") return null;
  const key = normalizeSlideshareUrl(item?.sourceUrl || item?.url || "");
  if (!key) return null;
  return SLIDESHARE_LOOKUP.get(key) || null;
}

function getCanvaAnalysis(item = {}) {
  const candidateUrls = [item?.sourceUrl, item?.publicUrl, item?.url];
  const looksLikeCanva =
    candidateUrls.some((value) => hasCanvaUrl(value)) ||
    Boolean(item?.designId) ||
    Boolean(item?.pageUrl && contentUrlToDesignId(item.pageUrl));

  if (!looksLikeCanva) return null;

  const designIdCandidates = [
    item?.designId,
    item?.pageUrl ? contentUrlToDesignId(item.pageUrl) : "",
    ...candidateUrls.map((value) => getCanvaDesignId(value))
  ].filter(Boolean);

  for (const designId of designIdCandidates) {
    const match = CANVA_BY_DESIGN_ID.get(designId);
    if (match) {
      return match;
    }
  }

  return {};
}

function extractSlideshareTags(match = {}) {
  const seen = new Set();
  const tags = [];

  toArray(match?.tags).forEach((tag) => {
    const data = tag?.indexableTag;
    if (!data) return;

    const rawTitle = String(data.title || data.tagPillText || "").trim();
    const title = rawTitle.includes("|")
      ? rawTitle.split("|").map((part) => part.trim()).filter(Boolean).slice(-1)[0]
      : rawTitle;
    const slug = String(data.tagStrippedTitle || slugifyTerm(title)).trim();

    if (!title || !slug || seen.has(slug)) return;
    seen.add(slug);
    tags.push({ title, slug });
  });

  return tags;
}

function buildSignalText(item = {}, match = {}, tags = []) {
  const courseSignals = toArray(item.courseContexts).flatMap((course) => [
    course?.courseId,
    course?.courseName,
    ...(Array.isArray(course?.matchedTerms) ? course.matchedTerms : [])
  ]);
  const transcriptLead = isGenericSlideshareDescription(item.description)
    ? transcriptExcerpt(match?.transcript || "", 360)
    : "";

  return normalizeSignalText([
    item.title,
    isGenericSlideshareDescription(item.description) ? "" : item.description,
    match?.title,
    match?.description,
    tags.map((tag) => tag.title).join(" "),
    transcriptLead,
    courseSignals.join(" ")
  ].filter(Boolean).join(" "));
}

function hasAnySignal(text, terms = []) {
  return terms.some((term) => text.includes(term));
}

const KEYWORDS_BY_TAG_SLUG = {
  "collaborative-learning": ["yhteisöllinen oppiminen"],
  "digital-divide": ["digikuilu"],
  "digital-learning": ["digitaalinen oppiminen"],
  "educational-technology": ["koulutusteknologia"],
  "mobile-learning-tech": ["mobiilioppiminen"]
};

const CATEGORY_RULES = [
  {
    terms: ["opettajankoulut", "teacher education", "preservice teacher", "student teacher"],
    categories: ["Opettajankoulutus"]
  },
  {
    terms: [
      "educational technology",
      "digital learning",
      "technology enhanced learning",
      "technology-enhanced learning",
      "teknologia-tuettu oppiminen",
      "teknolgiatuettu oppiminen",
      "koulutusteknologia",
      "teknologiatuettu oppiminen",
      "teknologiatuettu opetus",
      "opetuskayt",
      "oppimisymparist",
      "learning environment",
      "learning ecologies",
      "monilukutaito",
      "media literacy",
      "social media",
      "sosiaalinen media",
      "sosiaalisen median",
      "mobile learning",
      "mobiilioppiminen",
      "mobiiliteknolog",
      "cscl",
      "tpack",
      "web 2.0",
      "web2.0",
      "blogs & education",
      "blog education",
      "wordpress",
      "digitaalinen media",
      "digitaalisen oppimisen"
    ],
    categories: ["Koulutusteknologia"]
  },
  {
    terms: ["tekoaly", "artificial intelligence", "generative ai", "machine learning"],
    categories: ["Tekoäly"]
  },
  {
    terms: [
      "steam",
      "digital fabrication",
      "maker education",
      "maker",
      "computational thinking",
      "scratch",
      "fab lab",
      "fablearn"
    ],
    categories: ["STEAM"]
  },
  {
    terms: ["varhaiskasvat", "early years", "young children", "toddlers"],
    categories: ["Varhaiskasvatus"]
  },
  {
    terms: ["perusopet", "peruskoulu", "alakoulu", "ylakoulu", "school classroom", "k-12"],
    categories: ["Peruskoulu"]
  },
  {
    terms: ["demokratia", "lahidemokratia", "osallisuus", "kuntalais", "asukasyhdistys"],
    categories: ["Demokratia ja sivistys"]
  },
  {
    terms: ["conference", "symposium", "konferenssi", "arctic frontiers", "bett", "inted", "edulearn", "fablearn"],
    categories: ["Konferenssi"]
  },
  {
    terms: [
      "research process",
      "qualitative research",
      "mixed methods",
      "laadullinen tutkimus",
      "tutkimusprosessi",
      "defence",
      "thesis",
      "doctoral"
    ],
    categories: ["Tutkimus"]
  },
  {
    terms: ["ohjelmoin", "programming", "roboti", "learning analytics", "digital fabrication", "algoritm"],
    categories: ["Teknologia ja digitaalisuus"]
  },
  {
    terms: ["opettajaksi opiskelev", "student teacher", "teacher student"],
    categories: ["Opettajankoulutus"]
  }
];

const KEYWORD_RULES = [
  {
    terms: ["educational technology", "koulutusteknologia", "teknologiatuettu oppiminen", "digital learning", "technology-enhanced learning"],
    keywords: ["koulutusteknologia"]
  },
  { terms: ["tieto- ja viestintatekniikka", "tvt-opetuskayton", "tvt opetuskayton", " aineenopettajien tvt-kurssi ", " tvt-kurssi "], keywords: ["TVT"] },
  { terms: ["tpack"], keywords: ["TPACK"] },
  { terms: ["cscl", "computer-supported collaborative learning"], keywords: ["CSCL"] },
  { terms: ["mobile learning", "mobiilioppiminen", "mobiiliteknolog"], keywords: ["mobiilioppiminen"] },
  { terms: ["social media", "sosiaalinen media", "sosiaalisen median"], keywords: ["sosiaalinen media"] },
  { terms: ["web 2.0", "web2.0"], keywords: ["Web 2.0"] },
  { terms: ["blog", "blogs"], keywords: ["blogit"] },
  { terms: ["wordpress"], keywords: ["WordPress"] },
  { terms: ["virtuaaliyliopisto"], keywords: ["virtuaaliyliopisto"] },
  { terms: ["digital divide"], keywords: ["digikuilu"] },
  { terms: ["21th century", "21st century", "vuosituhannen taidot"], keywords: ["21st century skills"] },
  { terms: ["monilukutaito", "media literacy"], keywords: ["monilukutaito"] },
  { terms: ["digitaalinen media"], keywords: ["digitaalinen media"] },
  { terms: ["digitaalisen oppimisen", "digital learning"], keywords: ["digitaalinen oppiminen"] },
  { terms: ["learning analytics"], keywords: ["oppimisanalytiikka"] },
  { terms: ["computational thinking"], keywords: ["ohjelmoinnillinen ajattelu"] },
  { terms: ["digital fabrication"], keywords: ["digitaalinen valmistus"] },
  { terms: ["maker education", "maker"], keywords: ["maker-kasvatus"] },
  { terms: ["steam"], keywords: ["STEAM"] },
  { terms: ["tekoaly", "artificial intelligence"], keywords: ["tekoäly"] },
  { terms: ["roboti"], keywords: ["robotiikka"] },
  { terms: ["opettajankoulut", "teacher education"], keywords: ["opettajankoulutus"] },
  { terms: ["opettajaksi opiskelev", "opettajien uusi sukupolvi"], keywords: ["opettajuus"] },
  { terms: ["digitaalisuus koulutuksessa", "digitaalisuus"], keywords: ["digitalisaatio"] },
  { terms: ["pedagogiset mallit", "pedagogical models"], keywords: ["pedagogiset mallit"] },
  { terms: ["powerpoint", "esitysgrafiikka", "presentations"], keywords: ["esitysgrafiikka"] },
  { terms: ["powerpoint"], keywords: ["PowerPoint"] },
  { terms: ["qualitative research", "laadullinen tutkimus", "quali"], keywords: ["laadullinen tutkimus"] },
  { terms: ["mixed methods"], keywords: ["mixed methods"] },
  { terms: ["research process", "tutkimusprosessi"], keywords: ["tutkimusprosessi"] },
  { terms: ["defence", "doctoral", "thesis"], keywords: ["väitöskirja"] },
  { terms: ["affordances"], keywords: ["affordanssit"] },
  { terms: ["multimedia"], keywords: ["multimedia"] },
  { terms: ["digital storytelling"], keywords: ["digitarinankerronta"] },
  { terms: ["verkkokurs", "online courses", "online course"], keywords: ["verkkokurssit"] },
  { terms: ["evaluation", "assessment", "arviointi"], keywords: ["arviointi"] },
  { terms: ["sukujuhla", "sukupuu", "family"], keywords: ["sukujuhla"] },
  { terms: ["historia", "history"], keywords: ["historia"] },
  { terms: ["lahidemokratia"], keywords: ["lähidemokratia"] },
  { terms: ["osallisuus"], keywords: ["osallisuus"] },
  { terms: ["demokratia"], keywords: ["demokratia"] }
];

const CANVA_KEYWORDS_BY_THEME = {
  "tekoalylukutaito": ["tekoälylukutaito"],
  "generatiivinen-tekoaly": ["generatiivinen tekoäly"],
  "digipedagogiikka": ["digipedagogiikka"],
  "taydennyskoulutus": ["opettajien täydennyskoulutus"],
  "tekoalyn-saantely": ["EU AI Act", "tekoälyn sääntely"],
  "koneoppiminen": ["koneoppiminen"],
  "lasten-digitaaliset-oikeudet": ["lasten digitaaliset oikeudet"],
  "datatoimijuus": ["datatoimijuus"],
  "data-yksityisyys": ["tietosuoja"],
  "oppimisanalytiikka": ["oppimisanalytiikka"],
  "selitettava-tekoaly": ["selitettävä tekoäly"],
  "datalukutaito": ["datalukutaito"],
  "hanke-esittely": ["Generation AI"],
  "syvaoppiminen": ["syväoppiminen"],
  "opettajankoulutus": ["opettajankoulutus"],
  "mediakasvatus": ["mediakasvatus"],
  "tekoaly-turvallisuuskasvatus": ["tekoälyn turvallisuuskasvatus"],
  "koulutuspolitiikka": ["koulutuspolitiikka"],
  "shadow-ai": ["Shadow AI"],
  "promptaus": ["promptaus"],
  "kriittinen-medialukutaito": ["kriittinen medialukutaito"],
  "arviointi": ["arviointi"],
  "tpack": ["TPACK"],
  "kognitiiviset-tyokalut": ["kognitiiviset työkalut"],
  "kansainvalinen-yhteistyo": ["kansainvälinen yhteistyö"],
  "konenako": ["konenäkö"],
  "hybridialykkyys": ["hybridiälykkyys"],
  "pedagogiset-agentit": ["pedagogiset agentit"],
  "yliopistopedagogiikka": ["yliopistopedagogiikka"],
  "kieltenopetus": ["kieltenopetus"],
  "tekoalyagentit": ["tekoälyagentit"],
  "robotiikka": ["robotiikka"],
  "ohjaus-ja-opinto-ohjaus": ["opinto-ohjaus"]
};

const CANVA_KEYWORDS_BY_CATEGORY = {
  "VESO": ["VESO"],
  "Opettajankoulutus": ["opettajankoulutus"],
  "Tekoäly": ["tekoäly"],
  "Tekoälylukutaito": ["tekoälylukutaito"],
  "Tekoälytaidot": ["tekoälytaidot"],
  "Ohjelmointi": ["ohjelmointi"],
  "Koneäkö": ["konenäkö"],
  "Robotiikka": ["robotiikka"],
  "Monilukutaito": ["monilukutaito"],
  "Peruskoulu": ["perusopetus"],
  "Digitalisaatio": ["digitalisaatio"],
  "Väestötieto": ["väestöennuste"],
  "Koulutuspolitiikka": ["koulutuspolitiikka"],
  "Generation AI": ["Generation AI"],
  "Tekoälysovellukset": ["tekoälysovellukset"],
  "STEAM": ["STEAM"],
  "Konferenssi": ["konferenssi"],
  "Yliopisto ja korkeakoulut": ["korkeakoulutus"]
};

const CANVA_KEYWORD_RULES = [
  { terms: ["tekoalylukutaito", "ai literacy"], keywords: ["tekoälylukutaito"] },
  { terms: ["generatiivinen tekoaly", "generative ai"], keywords: ["generatiivinen tekoäly"] },
  { terms: ["digipedagogiikka", "pedagoginen", "pedagogi"], keywords: ["digipedagogiikka"] },
  { terms: ["taydennyskoulutus", "veso", "tyoyhteisokoulutus", "professional development"], keywords: ["opettajien täydennyskoulutus"] },
  { terms: ["eu ai act", "tekoalyn saantely"], keywords: ["EU AI Act"] },
  { terms: ["selitettava tekoaly", "explainable ai", "xai"], keywords: ["selitettävä tekoäly"] },
  { terms: ["koneoppiminen", "machine learning"], keywords: ["koneoppiminen"] },
  { terms: ["syvaoppiminen", "deep learning"], keywords: ["syväoppiminen"] },
  { terms: ["konenako", "computer vision"], keywords: ["konenäkö"] },
  { terms: ["robotiikka", "roboti"], keywords: ["robotiikka"] },
  { terms: ["ohjelmointi", "vibe coding", "coding"], keywords: ["ohjelmointi"] },
  { terms: ["monilukutaito"], keywords: ["monilukutaito"] },
  { terms: ["mediakasvatus"], keywords: ["mediakasvatus"] },
  { terms: ["kriittinen medialukutaito", "critical media literacy"], keywords: ["kriittinen medialukutaito"] },
  { terms: ["oppimisanalytiikka", "learning analytics"], keywords: ["oppimisanalytiikka"] },
  { terms: ["datalukutaito", "data literacy"], keywords: ["datalukutaito"] },
  { terms: ["data privacy", "tietosuoja"], keywords: ["tietosuoja"] },
  { terms: ["tpack", "itpack"], keywords: ["TPACK"] },
  { terms: ["koulutuspolitiikka"], keywords: ["koulutuspolitiikka"] },
  { terms: ["generation ai"], keywords: ["Generation AI"] },
  { terms: ["tekoalysovellukset", "tekoalysovellus"], keywords: ["tekoälysovellukset"] },
  { terms: ["steam"], keywords: ["STEAM"] },
  { terms: ["higher education", "yliopistopedagogiikka", "korkeakoul"], keywords: ["yliopistopedagogiikka"] },
  { terms: ["syntyvyys", "kouluikaluokat", "vaest"], keywords: ["väestöennuste"] }
];

function deriveSlideshareDescription(item = {}, match = null) {
  const localDescription = String(item?.description || "").trim();
  if (!isGenericSlideshareDescription(localDescription)) return localDescription;

  const remoteDescription = String(match?.description || "").trim();
  if (!isGenericSlideshareDescription(remoteDescription) && remoteDescription !== String(match?.title || "").trim()) {
    return remoteDescription;
  }

  const transcriptLead = transcriptExcerpt(match?.transcript || "");
  if (transcriptLead) return transcriptLead;

  return localDescription;
}

function deriveSlideshareCategories(item = {}, match = null, signalText = "", tags = []) {
  const categories = new Set(toArray(item.categories));
  const teachingUnit = teachingUnits.fromCourseContexts(item.courseContexts);

  if (teachingUnit === "opettajankoulutus") {
    categories.add("Opettajankoulutus");
  }

  tags.forEach((tag) => {
    if (tag.slug === "educational-technology" || tag.slug === "digital-learning" || tag.slug === "mobile-learning-tech") {
      categories.add("Koulutusteknologia");
    }
  });

  CATEGORY_RULES.forEach((rule) => {
    if (hasAnySignal(signalText, rule.terms)) {
      rule.categories.forEach((category) => categories.add(category));
    }
  });

  return normalizeCategoryList(Array.from(categories));
}

function deriveSlideshareKeywords(item = {}, signalText = "", tags = []) {
  const keywords = new Set(toArray(item.keywords));

  tags.forEach((tag) => {
    toArray(KEYWORDS_BY_TAG_SLUG[tag.slug]).forEach((keyword) => keywords.add(keyword));
  });

  KEYWORD_RULES.forEach((rule) => {
    if (hasAnySignal(signalText, rule.terms)) {
      rule.keywords.forEach((keyword) => keywords.add(keyword));
    }
  });

  return normalizeKeywordList(Array.from(keywords)).slice(0, 10);
}

function buildCanvaSignalText(item = {}, analysis = {}) {
  return normalizeSignalText([
    item.title,
    item.description,
    toArray(item.categories).join(" "),
    toArray(item.keywords).join(" "),
    analysis.title,
    toArray(analysis.keywords).join(" "),
    analysis.rich?.richSummary,
    toArray(analysis.rich?.themes).join(" ")
  ].filter(Boolean).join(" "));
}

function deriveCanvaKeywords(item = {}, analysis = {}, signalText = "") {
  const keywords = new Set([
    ...toArray(item.keywords),
    ...toArray(analysis.keywords)
  ]);

  toArray(item.categories).forEach((category) => {
    toArray(CANVA_KEYWORDS_BY_CATEGORY[category]).forEach((keyword) => keywords.add(keyword));
  });

  toArray(analysis.rich?.themes).forEach((theme) => {
    toArray(CANVA_KEYWORDS_BY_THEME[theme]).forEach((keyword) => keywords.add(keyword));
  });

  CANVA_KEYWORD_RULES.forEach((rule) => {
    if (hasAnySignal(signalText, rule.terms)) {
      rule.keywords.forEach((keyword) => keywords.add(keyword));
    }
  });

  return normalizeKeywordList(Array.from(keywords)).slice(0, 12);
}

function derivePresentationMetadata(item = {}) {
  const isSlideshare = String(item?.source || "").trim() === "slideshare";
  if (!isSlideshare) {
    const canvaAnalysis = getCanvaAnalysis(item);
    if (canvaAnalysis) {
      const signalText = buildCanvaSignalText(item, canvaAnalysis);
      return {
        description: String(item?.description || "").trim(),
        categories: normalizeCategoryList(toArray(item?.categories)),
        keywords: deriveCanvaKeywords(item, canvaAnalysis, signalText),
        sourceLanguage: String(canvaAnalysis.rich?.lang || "").trim() || undefined,
        slideCount: Number.isFinite(canvaAnalysis.rich?.slideCount)
          ? canvaAnalysis.rich.slideCount
          : undefined
      };
    }

    return {
      description: String(item?.description || "").trim(),
      categories: normalizeCategoryList(toArray(item?.categories)),
      keywords: normalizeKeywordList(toArray(item?.keywords))
    };
  }

  const match = getSlideshareAnalysis(item);
  const tags = extractSlideshareTags(match || {});
  const signalText = buildSignalText(item, match || {}, tags);

  return {
    description: deriveSlideshareDescription(item, match),
    categories: deriveSlideshareCategories(item, match, signalText, tags),
    keywords: deriveSlideshareKeywords(item, signalText, tags),
    sourceLanguage: String(match?.language || "").trim() || undefined,
    slideCount: Number.isFinite(match?.totalSlides) ? match.totalSlides : undefined,
    viewCount: Number.isFinite(match?.views) ? match.views : undefined
  };
}

module.exports = {
  derivePresentationMetadata,
  getCanvaAnalysis,
  getSlideshareAnalysis,
  normalizeSlideshareUrl,
  isGenericSlideshareDescription,
  transcriptExcerpt
};

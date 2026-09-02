const fs = require("fs");
const path = require("path");
const { createCanvaPresentationLookup, readLocalPresentationSources } = require("./presentationSources");
const { getCanvaDesignId } = require("./canvaUrl");
const { CONTEXT_ORDER, resolveContexts } = require("./contentContext");
const slideshareContent = require("../../slideshare-content.json");

const ROOT = path.join(__dirname, "..", "..");
const ACCEPTED_PRESENTATION_CURATION_DECISIONS_PATH = path.join(
  ROOT,
  "docs",
  "data",
  "presentations-local-detail-curation-f3c-p2-accepted-decisions.json"
);

const PRESENTATION_SOURCE_ORDER = [
  "aoe",
  "canva",
  "customMaterials",
  "curatedVideos",
  "videoSeries",
  "youtubeVideos",
  "youtube",
  "slideshare"
];

const PRESENTATION_SOURCE_LABELS = {
  aoe: "AOE / Finna",
  canva: "Canva",
  customMaterials: "Oulun kaupunki",
  curatedVideos: "YouTube / oma puheenvuoro",
  videoSeries: "YouTube / oma sarja",
  youtubeVideos: "YouTube",
  youtube: "YouTube",
  slideshare: "SlideShare"
};

const SOURCE_SECTION_KEYS = Object.freeze(["aoe", "canva", "slideshare", "youtubeVideos", "youtube"]);

const SOURCE_SECTION_META = Object.freeze({
  aoe: {
    icon: "bi-book",
    label: { fi: "AOE / oppimateriaali", en: "AOE / learning material" },
    cta: { fi: "Avaa Finnassa", en: "Open in Finna" },
    detailCta: { fi: "Avaa sivu", en: "Open page" }
  },
  canva: {
    icon: "bi-file-earmark-slides",
    label: { fi: "Canva", en: "Canva" },
    cta: { fi: "Avaa Canva", en: "Open Canva" },
    detailCta: { fi: "Avaa sivu", en: "Open page" }
  },
  slideshare: {
    icon: "bi-collection-play",
    label: { fi: "SlideShare", en: "SlideShare" },
    cta: { fi: "Avaa SlideSharessa", en: "Open on SlideShare" },
    detailCta: { fi: "Avaa sivu", en: "Open page" }
  },
  youtubeVideos: {
    icon: "bi-youtube",
    label: { fi: "YouTube-video", en: "YouTube video" },
    cta: { fi: "Katso", en: "Watch" },
    detailCta: { fi: "Avaa sivu", en: "Open page" }
  },
  youtube: {
    icon: "bi-youtube",
    label: { fi: "YouTube-soittolista", en: "YouTube playlist" },
    cta: { fi: "Avaa YouTubessa", en: "Open on YouTube" },
    detailCta: { fi: "Avaa sivu", en: "Open page" }
  }
});

const PUBLIC_PRESENTATION_FIELDS = Object.freeze([
  "id",
  "sourceKey",
  "sourceType",
  "sourceLabel",
  "title",
  "url",
  "pageUrl",
  "localPageUrl",
  "hasLocalDetail",
  "externalFirst",
  "landingType",
  "landingUrl",
  "externalUrl",
  "sourceUrl",
  "mediaType",
  "thumbnail",
  "description",
  "date",
  "year",
  "lang",
  "sourceLanguage",
  "topics",
  "presentationType",
  "role",
  "event",
  "eventType",
  "location",
  "slideCount",
  "itemCount",
  "badgeText",
  "meta",
  "categories",
  "keywords",
  "jarjestaja",
  "kategoria",
  "paakortti",
  "paareitti",
  "asiantuntijaprofiili",
  "sivuyhteys",
  "courseContexts",
  "contexts",
  "representations",
  "curationStatus"
]);

const PUBLIC_PRESENTATION_LEGACY_FIELDS = Object.freeze({
  aoe: ["title", "url", "image", "year", "summary"],
  canva: [
    "id",
    "title",
    "description",
    "url",
    "pageUrl",
    "thumbnail",
    "date",
    "categories",
    "lang",
    "jarjestaja",
    "kategoria",
    "paakortti",
    "paareitti",
    "asiantuntijaprofiili",
    "sivuyhteys",
    "courseContexts",
    "sourceLanguage",
    "slideCount"
  ],
  customMaterials: ["title", "url", "pageUrl", "externalUrl", "thumbnail", "description", "badgeText", "date"],
  curatedVideos: ["title", "url", "pageUrl", "externalUrl", "thumbnail", "description", "badgeText", "date"],
  videoSeries: ["title", "url", "pageUrl", "externalUrl", "thumbnail", "description", "badgeText", "date", "itemCount"],
  youtubeVideos: ["title", "url", "thumbnail", "description", "publishedAt"],
  youtube: ["title", "url", "thumbnail", "description", "publishedAt", "itemCount"],
  slideshare: [
    "title",
    "url",
    "pageUrl",
    "thumbnail",
    "description",
    "categories",
    "keywords",
    "date",
    "courseContexts",
    "sourceLanguage",
    "slideCount"
  ]
});

const CURATED_VIDEO_ITEMS = [
  {
    title: "ITK-avauksen tallenne: Työkalu? Taikakalu?",
    url: "https://www.youtube.com/watch?v=0cJ0Ed3Scs4&t=5s",
    externalUrl: "https://www.youtube.com/watch?v=0cJ0Ed3Scs4&t=5s",
    thumbnail: "https://i.ytimg.com/vi/0cJ0Ed3Scs4/hqdefault.jpg",
    date: "2026-04-26",
    badgeText: "ITK-avauksen videotallenne",
    listText: "Avauspuheenvuoro koulutusteknologia-alan päätapahtumassa",
    description: "Avauspuheenvuoro maamme merkittävimmässä koulutusteknologia-alan tapahtumassa. Puhe käsittelee tekoälyn roolia työssä, koulussa ja kotona kognitiivisena työkaluna.",
    sourceLabel: "YouTube / keynote",
    external: true
  },
  {
    title: "Oululaisia lapsia ja nuoria koskevien tilastotietojen tarkastelua",
    url: "https://www.youtube.com/watch?v=7EXB54VvlsU&t=2s",
    externalUrl: "https://www.youtube.com/watch?v=7EXB54VvlsU&t=2s",
    thumbnail: "https://i.ytimg.com/vi/7EXB54VvlsU/hqdefault.jpg",
    date: "2026-01-19",
    badgeText: "Asiantuntijavideo",
    listText: "Palveluverkkokeskustelun 2026 tausta-aineisto",
    description: "Asiantuntijavideo Oulun palveluverkkokeskusteluun: lasten ja nuorten tilastotietoja päätösten pohjaksi ja vaikutusten arvioimiseksi.",
    sourceLabel: "YouTube / politiikka",
    external: true
  },
  {
    title: "Kuinka Generatiivinen tekoäly toimii? Pieni kielikone on vastaus tähän kysymykseen!",
    url: "https://www.youtube.com/watch?v=RyItZto47t8",
    externalUrl: "https://www.youtube.com/watch?v=RyItZto47t8",
    thumbnail: "https://i.ytimg.com/vi/RyItZto47t8/maxresdefault.jpg",
    date: "2025-10-21",
    badgeText: "Webinaaritallenne",
    listText: "Generation AI: Pieni kielikone havainnollistaa tekoälyä",
    description: "Webinaaritallenne 21.10.2025. Jari Laru esittelee Generation AI -hankkeen kehittämän pienen kielikoneen, joka havainnollistaa kuinka generatiivinen tekoäly toimii.",
    sourceLabel: "YouTube / webinaari",
    external: true
  },
  {
    title: "Generation AI: Selitettävä tekoäly, mitä se on ja miksi se on tärkeä huomioida opetuksessa?",
    url: "https://www.youtube.com/watch?v=q2K04VmN3sQ",
    externalUrl: "https://www.youtube.com/watch?v=q2K04VmN3sQ",
    thumbnail: "https://i.ytimg.com/vi/q2K04VmN3sQ/maxresdefault.jpg",
    date: "2025-03-11",
    badgeText: "Webinaaritallenne",
    listText: "Generation AI: Selitettävä tekoäly opetuksessa",
    description: "Webinaaritallenne 11.3.2025. Jari Laru esittelee selitettävän tekoälyn käsitteen ja Generation AI -hankkeessa kehitettyjä tekoälytaitojen opetustyökaluja.",
    sourceLabel: "YouTube / webinaari",
    external: true
  },
  {
    title: "ITK-webinaari: Miten opetan tekoälyä oppilaille? Generation AI",
    url: "https://www.youtube.com/watch?v=U4iFFFY3rhM",
    externalUrl: "https://www.youtube.com/watch?v=U4iFFFY3rhM",
    thumbnail: "https://i.ytimg.com/vi/U4iFFFY3rhM/maxresdefault.jpg",
    date: "2024-04-02",
    badgeText: "ITK-webinaaritallenne",
    listText: "Tekoälyn opettaminen oppilaille - Generation AI -ratkaisu",
    description: "ITK-webinaaritallenne 2.4.2024. Jari Laru esittelee Generation AI -hankkeen tutkimusperustaisen ratkaisun tekoälyn opettamiseen oppilaille.",
    sourceLabel: "YouTube / ITK-webinaari",
    external: true
  },
  {
    title: "ITK-webinaari: Generation AI - kyberturvallisen ajattelutavan opettaminen tekoälysukupolvelle",
    url: "https://www.youtube.com/watch?v=fcDjAZZZs4U",
    externalUrl: "https://www.youtube.com/watch?v=fcDjAZZZs4U",
    thumbnail: "https://i.ytimg.com/vi/fcDjAZZZs4U/maxresdefault.jpg",
    date: "2023-03-28",
    badgeText: "ITK-webinaaritallenne",
    listText: "Generation AI: Kyberturvallinen ajattelutapa tekoälysukupolvelle",
    description: "ITK-webinaaritallenne 28.3.2023. Jari Laru, Matti Tedre ja Henriikka Vartiainen esittelevät kyberturvallisuus- ja tekoälykasvatuksen haasteita ja ratkaisuja.",
    sourceLabel: "YouTube / ITK-webinaari",
    external: true
  },
  {
    title: "Teknologia, oppiminen ja osaaminen yhteiskunnassa - videotallenne",
    url: "https://www.youtube.com/watch?v=SoeW6zexrWQ",
    pageUrl: "/presentations/ss-teknologia-oppiminen-ja-osaaminen-yhteiskunnassa-uudet-teknologiat-isannan-vai-r/",
    externalUrl: "https://www.youtube.com/watch?v=SoeW6zexrWQ",
    thumbnail: "https://i.ytimg.com/vi/SoeW6zexrWQ/hqdefault.jpg",
    date: "2013-02-21",
    badgeText: "Verkkoluennon tallenne",
    listText: "www.etäopetus.fi: uudet teknologiat isännän vai rengin roolissa",
    description: "EKO - Etäopetuksen koordinointihankkeen verkkoluentotallenne 21.2.2013. Puheenvuoro käsittelee teknologian, oppimisen ja osaamisen suhdetta yhteiskunnassa.",
    sourceLabel: "YouTube / www.etäopetus.fi",
    external: true
  }
];

const VIDEO_SERIES_ITEMS = [
  {
    title: "Jari Larun verkkolive",
    url: "/2020/03/12/jari-larun-verkkolive/",
    externalUrl: "https://www.youtube.com/playlist?list=PLDG0jxUrk8z19_ThqBiynpYG4g-mjwgpt",
    thumbnail: "/img/uploads/2021/01/verkkolive.jpg",
    date: "2020-03-12",
    itemCount: 10,
    badgeText: "10 jakson haastattelusarja",
    listText: "10 jakson oma haastattelusarja",
    description: "Koronakevään 2020 haastattelusarja, jossa Jari Laru keskusteli suomalaisten opettajien ja koulutusteknologian asiantuntijoiden kanssa etäopetuksen arjesta.",
    sourceLabel: "YouTube / oma sarja"
  },
  {
    title: "Larun laitenurkka: opetusteknologia läpivalaisussa",
    url: "https://www.youtube.com/playlist?list=PLDG0jxUrk8z2E7S2ggyzt0bIBXiDEgXob",
    externalUrl: "https://www.youtube.com/playlist?list=PLDG0jxUrk8z2E7S2ggyzt0bIBXiDEgXob",
    thumbnail: "https://i.ytimg.com/vi/KXr7AQqOzMQ/hqdefault.jpg",
    date: "",
    badgeText: "Opetusteknologian videosarja",
    listText: "Oma videosarja opetusteknologian välineistä",
    description: "Videosarja, jossa opetusteknologian välineitä tarkastellaan käytön, pedagogiikan ja arjen opetustyön näkökulmasta.",
    sourceLabel: "YouTube / oma sarja",
    external: true
  },
  {
    title: "Larun pikkuvinkit",
    url: "https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY",
    pageUrl: "/presentations/larun-pikkuvinkit/",
    externalUrl: "https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY",
    thumbnail: "https://i.ytimg.com/vi/hCZ9lgODkes/hqdefault.jpg",
    date: "2020",
    badgeText: "Koronakevään pikkuvinkit",
    listText: "Korona-ajan lyhyitä käytännön vinkkejä etäopetuksen tueksi",
    description: "Koronakevään 2020 lyhytvideosarja, jossa Jari Laru jakoi käytännön pikkuvinkkejä etäopetuksen, digityökalujen ja opetusteknologian arkeen.",
    sourceLabel: "YouTube / oma sarja",
    external: true
  }
];

const CUSTOM_MATERIAL_ITEMS = [
  {
    title: "Arjen tekoälyhaaste",
    url: "https://www.ouka.fi/lukevinkaupunni/arjen-tekoalyhaaste",
    pageUrl: "/presentations/arjen-tekoalyhaaste/",
    externalUrl: "https://www.ouka.fi/lukevinkaupunni/arjen-tekoalyhaaste",
    thumbnail: "https://www.ouka.fi/themes/custom/ouka/ouka_some_share.png",
    date: "2026-05-06",
    badgeText: "Verkkohaaste",
    listText: "Arjen tekoälyhaaste tekoälylukutaidon harjoitteluun",
    description: "Oulun kaupungin Lukevin kaupunni -sivustolla julkaistu verkkohaaste, joka auttaa tunnistamaan arjen tekoälytilanteita ja vahvistamaan tekoälylukutaitoa.",
    sourceLabel: "Oulun kaupunki / verkkomateriaali",
    external: true
  }
];

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function sortByDateDesc(items, field = "_isoDate") {
  return [...toArray(items)].sort((a, b) => String(b?.[field] || "").localeCompare(String(a?.[field] || "")));
}

function sortCanonicalItems(items = []) {
  return [...toArray(items)].sort((a, b) => {
    const dateDiff = String(b?.date || "").localeCompare(String(a?.date || ""));
    if (dateDiff !== 0) return dateDiff;

    const sourceDiff =
      PRESENTATION_SOURCE_ORDER.indexOf(a?.sourceKey) - PRESENTATION_SOURCE_ORDER.indexOf(b?.sourceKey);
    if (sourceDiff !== 0) return sourceDiff;

    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });
}

function toSortableDate(value) {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}$/.test(raw)) return `${raw}-12-31`;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sortSourceSectionItems(items = []) {
  return [...toArray(items)].sort((a, b) => {
    const dateDiff = toSortableDate(b?.date).localeCompare(toSortableDate(a?.date));
    if (dateDiff !== 0) return dateDiff;
    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });
}

function buildPresentationSourceSections(items = [], locale = "fi") {
  const normalizedLocale = locale === "en" ? "en" : "fi";

  return SOURCE_SECTION_KEYS.map((key) => {
    const meta = SOURCE_SECTION_META[key];
    const sourceItems = sortSourceSectionItems(
      toArray(items).filter((item) => {
        if (!item || item.sourceKey !== key) return false;
        if (normalizedLocale === "en" && key === "canva" && item.lang !== "en") return false;
        return true;
      })
    );

    return {
      key,
      icon: meta.icon,
      label: meta.label[normalizedLocale],
      ctaLabel: meta.cta[normalizedLocale],
      detailCtaLabel: meta.detailCta[normalizedLocale],
      count: sourceItems.length,
      featuredItem: sourceItems[0] || null,
      rows: sourceItems.slice(1),
      items: sourceItems
    };
  });
}

function buildPresentationFilterYears(items = []) {
  return [...new Set(
    toArray(items)
      .map((item) => String(item?.year || "").trim())
      .filter((value) => /^\d{4}$/.test(value))
  )].sort((a, b) => Number(b) - Number(a));
}

function buildPresentationFilterTopics(items = []) {
  const counts = new Map();

  toArray(items).forEach((item) => {
    toArray(item?.topics).forEach((topic) => {
      const label = String(topic || "").trim();
      if (!label) return;
      counts.set(label, (counts.get(label) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0], "fi");
    })
    .map(([label]) => label);
}

function normalizeSlideshareUrl(url = "") {
  return String(url || "")
    .trim()
    .replace(/^http:\/\//i, "https://")
    .replace(/^https:\/\/slideshare\.net\//i, "https://www.slideshare.net/")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function readAcceptedPresentationCurationDecisions() {
  if (!fs.existsSync(ACCEPTED_PRESENTATION_CURATION_DECISIONS_PATH)) return {};
  return JSON.parse(fs.readFileSync(ACCEPTED_PRESENTATION_CURATION_DECISIONS_PATH, "utf8"));
}

function getYouTubeId(url = "") {
  const value = String(url || "").trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] || "";
    if (host.endsWith("youtube.com")) return parsed.searchParams.get("v") || "";
  } catch (_) {
    return "";
  }

  return "";
}

function sourceIdentifierForUrl(url = "") {
  const canvaId = getCanvaDesignId(url);
  if (canvaId) return `canva:${canvaId}`;

  const youtubeId = getYouTubeId(url);
  if (youtubeId) return `youtube:${youtubeId}`;

  const slideshareUrl = normalizeSlideshareUrl(url);
  if (/slideshare\.net/i.test(slideshareUrl)) return `slideshare:${slideshareUrl}`;

  return "";
}

function isGenericSlideshareDescription(text = "") {
  const normalized = String(text || "").trim().toLowerCase();
  return !normalized || normalized === "slideshare-esitys" || normalized === "slideshare presentation";
}

// Named/numeric HTML-entity decoder. Narrow scope: SlideShare transcript
// captures in `slideshare-content.json` were scraped as HTML and preserve
// entities like `&quot;` in what should be plain-text transcript content.
// Left encoded they leak into meta descriptions (double-encoded), OG/Twitter
// tags, and JSON-LD (single-encoded, which check:jsonld flags as
// html-entity-leak). `&amp;` must run LAST so that any hypothetical
// `&amp;quot;` in source data does not get double-decoded.
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
    toArray(items).map((item) => [normalizeSlideshareUrl(item.url), item])
  );
}

function getSlideshareDescription(item, match) {
  const localDescription = String(item?.description || "").trim();
  if (!isGenericSlideshareDescription(localDescription)) return localDescription;

  const remoteDescription = String(match?.description || "").trim();
  if (!isGenericSlideshareDescription(remoteDescription)) return remoteDescription;

  const transcriptLead = transcriptExcerpt(match?.transcript || "");
  if (transcriptLead) return transcriptLead;

  return localDescription;
}

function createSlideshareItems(presentations = []) {
  const slideshareLookup = buildSlideshareLookup(slideshareContent);
  return presentations
    .filter((item) => item?.source === "slideshare")
    .map((item) => {
      const match = slideshareLookup.get(normalizeSlideshareUrl(item.url || item.sourceUrl || ""));
      return {
        title: item.title,
        url: item.url,
        pageUrl: item.pageUrl,
        thumbnail: item.thumbnail,
        date: item.date,
        description: getSlideshareDescription(item, match),
        categories: item.categories || [],
        keywords: item.keywords || [],
        courseContexts: item.courseContexts || [],
        sourceLanguage: item.sourceLanguage || "",
        slideCount: Number.isFinite(item.slideCount) ? item.slideCount : null,
        viewCount: Number.isFinite(item.viewCount) ? item.viewCount : null
      };
    });
}

function createCanvaPageUrls(presentations = []) {
  return Array.from(createCanvaPresentationLookup(presentations), ([id, item]) => ({
    id,
    pageUrl: item.pageUrl || ""
  })).filter((item) => item.id && item.pageUrl);
}

function buildCanvaMaterialLookup({ canvaRows = [], presentations = [] } = {}) {
  const lookup = new Map(createCanvaPresentationLookup(presentations));
  const titleLookup = new Map();

  toArray(presentations).forEach((item) => {
    const title = String(item?.title || "").trim().toLowerCase();
    if (!title) return;
    titleLookup.set(title, {
      pageUrl: item?.pageUrl || "",
      publicUrl: item?.publicUrl || "",
      sourceUrl: item?.sourceUrl || item?.url || "",
      title: item?.title || ""
    });
  });

  toArray(canvaRows).forEach((item) => {
    const candidateUrl = item?.sourceUrl || item?.publicUrl || item?.url || "";
    const id = getCanvaDesignId(candidateUrl);
    const titleKey = String(item?.title || "").trim().toLowerCase();
    const previous = id ? (lookup.get(id) || {}) : {};
    const normalizedItem = {
      pageUrl: previous.pageUrl || item?.pageUrl || "",
      publicUrl: previous.publicUrl || item?.publicUrl || item?.url || "",
      sourceUrl: previous.sourceUrl || item?.sourceUrl || "",
      title: item?.title || ""
    };

    if (id) {
      lookup.set(id, normalizedItem);
    }

    if (titleKey) {
      const previousByTitle = titleLookup.get(titleKey) || {};
      titleLookup.set(titleKey, {
        pageUrl: previousByTitle.pageUrl || normalizedItem.pageUrl,
        publicUrl: previousByTitle.publicUrl || normalizedItem.publicUrl,
        sourceUrl: previousByTitle.sourceUrl || normalizedItem.sourceUrl,
        title: previousByTitle.title || normalizedItem.title
      });
    }
  });

  return { byId: lookup, byTitle: titleLookup };
}

function resolveContextMaterialUrl(url, label, canvaLookup) {
  const id = getCanvaDesignId(url);
  if (id) {
    const match = canvaLookup.byId.get(id);
    if (match?.publicUrl) return match.publicUrl;
    if (match?.sourceUrl) return match.sourceUrl;
  }

  const titleKey = String(label || "").trim().toLowerCase();
  if (titleKey) {
    const matchByTitle = canvaLookup.byTitle.get(titleKey);
    if (matchByTitle?.publicUrl) return matchByTitle.publicUrl;
    if (matchByTitle?.sourceUrl) return matchByTitle.sourceUrl;
  }

  return String(url || "").trim();
}

function enrichPresentationContexts(contextItems = [], canvaLookup = { byId: new Map(), byTitle: new Map() }) {
  return toArray(contextItems).map((context) => {
    const materialTitles = toArray(context.materialTitles);
    const materials = toArray(context.materials).map((material) => ({
      ...material,
      url: resolveContextMaterialUrl(material?.url, material?.label, canvaLookup)
    }));

    const materialUrls = toArray(context.materialUrls).map((url, index) =>
      resolveContextMaterialUrl(url, materialTitles[index] || "", canvaLookup)
    );

    return {
      ...context,
      materials,
      materialUrls
    };
  });
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

function toPublicPresentationRecord(record = {}) {
  return pickFields(record, PUBLIC_PRESENTATION_FIELDS);
}

function uniqueStrings(values = []) {
  return [...new Set(
    toArray(values)
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  )];
}

function normalizePresentationPageUrl(url = "") {
  const value = String(url || "").trim();
  if (!value || /^https?:\/\//i.test(value)) return "";
  const ensuredLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  if (ensuredLeadingSlash === "/") return "/";
  return ensuredLeadingSlash.endsWith("/") ? ensuredLeadingSlash : `${ensuredLeadingSlash}/`;
}

function normalizeContexts(values = []) {
  const wanted = new Set(uniqueStrings(values));
  return CONTEXT_ORDER.filter((context) => wanted.has(context));
}

function inputPathForPresentationDetail(detail = {}) {
  const pageUrl = normalizePresentationPageUrl(detail.pageUrl || "");
  const slug = pageUrl.split("/").filter(Boolean).pop();
  return slug ? path.join(ROOT, "src", "presentations", `${slug}.md`) : "";
}

function enrichLocalPresentationDetailContexts(details = []) {
  return toArray(details).map((detail) => ({
    ...detail,
    declaredContexts: Array.isArray(detail.contexts) ? [...detail.contexts] : [],
    contexts: normalizeContexts(resolveContexts(detail, inputPathForPresentationDetail(detail)))
  }));
}

function matchedLocalPresentationUrls(item = {}) {
  const urls = new Set();
  const add = (value) => {
    const normalized = normalizePresentationPageUrl(value);
    if (normalized) urls.add(normalized);
  };

  add(item.localPageUrl || item.pageUrl || "");

  toArray(item.representations).forEach((representation) => {
    add(representation.localPageUrl || "");
    add(representation.url || "");
  });

  return [...urls];
}

function projectLocalDetailContextsToCanonicalItems(items = [], localDetails = []) {
  const localDetailsByPageUrl = new Map(
    toArray(localDetails)
      .filter((detail) => detail.pageUrl)
      .map((detail) => [normalizePresentationPageUrl(detail.pageUrl), detail])
  );

  return toArray(items).map((item) => {
    const contexts = normalizeContexts([
      ...toArray(item.contexts),
      ...matchedLocalPresentationUrls(item).flatMap((pageUrl) => {
        const detail = localDetailsByPageUrl.get(pageUrl);
        return Array.isArray(detail?.contexts) ? detail.contexts : [];
      })
    ]);

    if (!contexts.length) return item;
    return { ...item, contexts };
  });
}

function deriveYear(value = "") {
  const match = String(value || "").match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

function normalizeSourceType(sourceKey = "") {
  switch (sourceKey) {
    case "aoe":
      return "aoe";
    case "canva":
      return "canva";
    case "slideshare":
      return "slideshare";
    case "customMaterials":
      return "ouka";
    case "curatedVideos":
    case "videoSeries":
    case "youtubeVideos":
    case "youtube":
      return "youtube";
    default:
      return "other";
  }
}

function normalizeMediaType(sourceKey = "") {
  switch (sourceKey) {
    case "canva":
    case "slideshare":
      return "slides";
    case "curatedVideos":
    case "youtubeVideos":
      return "video";
    case "videoSeries":
    case "youtube":
      return "videoSeries";
    case "aoe":
      return "document";
    case "customMaterials":
      return "webMaterial";
    default:
      return "unknown";
  }
}

function normalizePresentationType(record = {}, sourceKey = "") {
  const explicit = String(record.kategoria || record.badgeText || "").trim();
  if (explicit) return explicit;
  if (sourceKey === "aoe") return "learningMaterial";
  if (sourceKey === "customMaterials") return "webMaterial";
  if (sourceKey === "curatedVideos") return "recording";
  if (sourceKey === "videoSeries" || sourceKey === "youtube") return "series";
  return "presentation";
}

function sourceKeyForLocalDetail(record = {}) {
  const source = String(record.source || "").trim().toLowerCase();
  if (source === "canva") return "canva";
  if (source === "slideshare") return "slideshare";
  if (source === "youtube") return "curatedVideos";
  if (source === "ouka" || source === "web") return "customMaterials";
  return "customMaterials";
}

function sourceLabelForLocalDetail(record = {}) {
  const sourceKey = sourceKeyForLocalDetail(record);
  if (sourceKey === "curatedVideos") return "YouTube / paikallinen esityssivu";
  if (sourceKey === "customMaterials") return "Paikallinen esityssivu";
  return PRESENTATION_SOURCE_LABELS[sourceKey] || "Paikallinen esityssivu";
}

function normalizePresentationRole(record = {}) {
  const route = String(record.paareitti || "").trim();
  if (route) return route.replace(/^route:/, "");
  const profiles = Array.isArray(record.asiantuntijaprofiili) ? record.asiantuntijaprofiili : [];
  return profiles.length ? profiles[0] : "";
}

function normalizeEvent(record = {}) {
  return String(record.jarjestaja || "").trim();
}

function normalizeEventType(record = {}, sourceKey = "") {
  const explicit = String(record.kategoria || "").trim();
  if (explicit) return explicit;
  if (sourceKey === "aoe") return "learning-material";
  if (sourceKey === "curatedVideos") return "recording";
  if (sourceKey === "videoSeries" || sourceKey === "youtube") return "series";
  return "";
}

function inferLocation(record = {}) {
  const text = `${record.title || ""} ${record.description || ""} ${record.jarjestaja || ""}`.toLowerCase();
  const known = [
    ["riihim", "Riihimaki"],
    ["kempele", "Kempele"],
    ["kokkola", "Kokkola"],
    ["tampere", "Tampere"],
    ["pori", "Pori"],
    ["kerava", "Kerava"],
    ["simo", "Simo"],
    ["oulu", "Oulu"]
  ];
  const match = known.find(([needle]) => text.includes(needle));
  return match ? match[1] : "";
}

function withPresentationSemantics(record = {}, sourceKey = "") {
  const localPageUrl = String(record.localPageUrl || record.pageUrl || "").trim();
  const externalSourceUrl = String(record.sourceUrl || record.externalUrl || record.url || "").trim();
  const hasLocalDetail = Boolean(localPageUrl);
  const landingUrl = hasLocalDetail ? localPageUrl : externalSourceUrl;
  const topics = uniqueStrings([
    ...toArray(record.topics),
    ...toArray(record.categories),
    ...toArray(record.keywords)
  ]);

  return {
    ...record,
    sourceType: record.sourceType || normalizeSourceType(sourceKey),
    sourceUrl: externalSourceUrl,
    mediaType: record.mediaType || normalizeMediaType(sourceKey),
    localPageUrl,
    hasLocalDetail,
    externalFirst: !hasLocalDetail,
    landingType: hasLocalDetail ? "localDetail" : "externalSource",
    landingUrl,
    topics,
    presentationType: record.presentationType || normalizePresentationType(record, sourceKey),
    role: record.role || normalizePresentationRole(record),
    event: record.event || normalizeEvent(record),
    eventType: record.eventType || normalizeEventType(record, sourceKey),
    location: record.location || inferLocation(record),
    year: record.year || deriveYear(record.date)
  };
}

function createPresentationRepresentation(record = {}, {
  relationship = "primary",
  provenance = "canonical-source",
  label = ""
} = {}) {
  const sourceKey = record.sourceKey || sourceKeyForLocalDetail(record);
  const sourceType = record.sourceType || normalizeSourceType(sourceKey);
  const mediaType = record.mediaType || normalizeMediaType(sourceKey);
  const localPageUrl = String(record.localPageUrl || record.pageUrl || "").trim();
  const externalUrl = String(record.externalUrl || record.sourceUrl || record.publicUrl || record.url || "").trim();
  const url = String(record.url || record.publicUrl || record.sourceUrl || record.externalUrl || localPageUrl || "").trim();
  const sourceIdentifier = sourceIdentifierForUrl(externalUrl || url);

  return pickFields({
    relationship,
    type: relationship,
    sourceKey,
    sourceType,
    mediaType,
    title: record.title || "",
    label: label || record.badgeText || record.sourceLabel || "",
    url,
    sourceUrl: externalUrl,
    externalUrl,
    localPageUrl,
    sourceIdentifier,
    provenance
  }, [
    "relationship",
    "type",
    "sourceKey",
    "sourceType",
    "mediaType",
    "title",
    "label",
    "url",
    "sourceUrl",
    "externalUrl",
    "localPageUrl",
    "sourceIdentifier",
    "provenance"
  ]);
}

function mergeRepresentations(...groups) {
  const seen = new Set();
  const merged = [];

  groups.flat().filter(Boolean).forEach((representation) => {
    const key = [
      representation.relationship || "",
      representation.sourceIdentifier || "",
      representation.localPageUrl || "",
      representation.externalUrl || representation.sourceUrl || representation.url || "",
      representation.title || ""
    ].join("|");
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(representation);
  });

  return merged;
}

function addRepresentation(item = {}, representation = {}) {
  return {
    ...item,
    representations: mergeRepresentations(item.representations || [], representation)
  };
}

function findCanonicalPresentationByDecisionId(items = [], id = "") {
  const value = String(id || "").trim();
  if (!value) return null;
  return items.find((item) =>
    item.id === value ||
    getCanvaDesignId(item.url || item.sourceUrl || item.externalUrl || "") === value ||
    item.localPageUrl === value ||
    item.pageUrl === value ||
    item.landingUrl === value ||
    item.url === value ||
    item.externalUrl === value ||
    item.sourceUrl === value
  ) || null;
}

function createCanonicalDistinctLocalPresentation(detail = {}) {
  const sourceKey = sourceKeyForLocalDetail(detail);
  return toPublicPresentationRecord(withPresentationSemantics({
    id: detail.pageUrl || detail.url || "",
    sourceKey,
    sourceLabel: sourceLabelForLocalDetail(detail),
    title: detail.title || "Nimeton esitys",
    url: detail.url || detail.publicUrl || detail.sourceUrl || detail.pageUrl || "",
    pageUrl: "",
    localPageUrl: detail.pageUrl || "",
    externalUrl: detail.publicUrl || detail.sourceUrl || detail.url || "",
    sourceUrl: detail.sourceUrl || detail.url || detail.publicUrl || "",
    thumbnail: detail.thumbnail || "",
    description: detail.description || "",
    date: detail.date || "",
    categories: Array.isArray(detail.categories) ? detail.categories.filter(Boolean) : [],
    keywords: Array.isArray(detail.keywords) ? detail.keywords.filter(Boolean) : [],
    courseContexts: Array.isArray(detail.courseContexts) ? detail.courseContexts : [],
    sourceLanguage: detail.sourceLanguage || "",
    slideCount: Number.isFinite(detail.slideCount) ? detail.slideCount : null,
    badgeText: detail.badgeText || "",
    curationStatus: "human-approved-distinct-local-presentation"
  }, sourceKey));
}

function applyAcceptedPresentationCuration(items = [], sourceData = {}) {
  const decisions = readAcceptedPresentationCurationDecisions();
  const decisionEntries = Object.entries(decisions);
  if (!decisionEntries.length) return items;

  const detailsByPageUrl = new Map(
    toArray(sourceData.presentations)
      .filter((detail) => detail.pageUrl)
      .map((detail) => [detail.pageUrl, detail])
  );
  const nextItems = items.filter(Boolean).map((item) => ({
    ...item,
    representations: mergeRepresentations(
      item.representations || [],
      createPresentationRepresentation(item)
    )
  }));
  const itemIndexByKey = () => new Map(nextItems.filter(Boolean).map((item, index) => [item, index]));

  decisionEntries.forEach(([caseId, decision]) => {
    const detailUrl = String(decision.detailUrl || "").trim();
    if (!detailUrl) {
      throw new Error(`Accepted presentation curation decision ${caseId} is missing detailUrl.`);
    }

    const detail = detailsByPageUrl.get(detailUrl);
    if (!detail) {
      throw new Error(`Accepted presentation curation decision ${caseId} does not resolve to a local detail record: ${detailUrl}`);
    }

    if (decision.humanDecision === "MATCHES_EXISTING_CANONICAL") {
      const match = findCanonicalPresentationByDecisionId(nextItems, decision.humanCanonicalId);
      if (!match) {
        throw new Error(`Accepted match ${caseId} target not found: ${decision.humanCanonicalId}`);
      }
      const index = itemIndexByKey().get(match);
      nextItems[index] = addRepresentation({
        ...match,
        localPageUrl: detail.pageUrl,
        hasLocalDetail: true,
        externalFirst: false,
        landingType: "localDetail",
        landingUrl: detail.pageUrl,
        curationStatus: "human-approved-local-detail-match"
      }, createPresentationRepresentation(detail, {
        relationship: "canonicalLocalDetail",
        provenance: `F3C-P2:${caseId}`,
        label: "Hyvaksytty paikallinen esityssivu"
      }));
      return;
    }

    if (decision.humanDecision === "ALTERNATE_REPRESENTATION") {
      const match = findCanonicalPresentationByDecisionId(nextItems, decision.humanCanonicalId);
      if (!match) {
        throw new Error(`Accepted alternate representation ${caseId} target not found: ${decision.humanCanonicalId}`);
      }
      const index = itemIndexByKey().get(match);
      nextItems[index] = addRepresentation({
        ...match,
        curationStatus: match.curationStatus || "human-approved-alternate-representation"
      }, createPresentationRepresentation(detail, {
        relationship: "alternateRepresentation",
        provenance: `F3C-P2:${caseId}`,
        label: "Hyvaksytty vaihtoehtoinen representaatio"
      }));
      return;
    }

    if (decision.humanDecision === "IS_DISTINCT_LOCAL_PRESENTATION") {
      const distinctItem = addRepresentation(
        createCanonicalDistinctLocalPresentation(detail),
        createPresentationRepresentation(detail, {
          relationship: "canonicalLocalDetail",
          provenance: `F3C-P2:${caseId}`,
          label: "Hyvaksytty erillinen paikallinen esitys"
        })
      );

      if (nextItems.some((item) => (item.id || item.landingUrl || item.url) === (distinctItem.id || distinctItem.landingUrl || distinctItem.url))) {
        throw new Error(`Accepted distinct presentation ${caseId} would create duplicate canonical id: ${distinctItem.id}`);
      }

      nextItems.push(distinctItem);
    }
  });

  return sortCanonicalItems(nextItems);
}

function createCanonicalAoeItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord(withPresentationSemantics({
    sourceKey: "aoe",
    sourceLabel: PRESENTATION_SOURCE_LABELS.aoe,
    title: item?.title || "Nimetön oppimateriaali",
    url: item?.url || "",
    thumbnail: item?.image ?? null,
    description: item?.summary || "",
    date: String(item?.year || "").trim(),
    year: String(item?.year || "").trim()
  }, "aoe")));
}

function createCanonicalCanvaItems(rows = [], canvaLookup = { byId: new Map(), byTitle: new Map() }) {
  return toArray(rows).map((item) => toPublicPresentationRecord({
    ...withPresentationSemantics({
      id: item?.id || getCanvaDesignId(item?.sourceUrl || item?.publicUrl || item?.url || item?.link || "") || "",
      sourceKey: "canva",
      sourceLabel: PRESENTATION_SOURCE_LABELS.canva,
      title: item?.title || "Nimetön esitys",
      url: item?.url || item?.publicUrl || item?.link || "",
      pageUrl: item?.pageUrl ?? null,
      localPageUrl:
        item?.pageUrl ||
        canvaLookup.byId.get(item?.id || "")?.pageUrl ||
        canvaLookup.byTitle.get(String(item?.title || "").trim().toLowerCase())?.pageUrl ||
        "",
      thumbnail: item?.thumbnail || "",
      description: item?.description || "",
      date: item?.date ?? null,
      categories: Array.isArray(item?.categories) ? item.categories.filter(Boolean) : [],
      lang: item?.lang || "fi",
      sourceLanguage: item?.sourceLanguage || "",
      slideCount: Number.isFinite(item?.slideCount) ? item.slideCount : null,
      jarjestaja: item?.jarjestaja || "",
      kategoria: item?.kategoria || "",
      paakortti: item?.paakortti === true,
      paareitti: item?.paareitti,
      asiantuntijaprofiili: Array.isArray(item?.asiantuntijaprofiili) ? item.asiantuntijaprofiili : [],
      sivuyhteys: Array.isArray(item?.sivuyhteys) ? item.sivuyhteys : [],
      courseContexts: Array.isArray(item?.courseContexts) ? item.courseContexts : []
    }, "canva")
  }));
}

function createCanonicalCustomMaterialItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord(withPresentationSemantics({
    sourceKey: "customMaterials",
    sourceLabel: PRESENTATION_SOURCE_LABELS.customMaterials,
    title: item?.title || "Nimetön materiaali",
    url: item?.url || item?.externalUrl || "",
    pageUrl: item?.pageUrl,
    externalUrl: item?.externalUrl,
    thumbnail: item?.thumbnail || "",
    description: item?.description || "",
    date: item?.date || "",
    badgeText: item?.badgeText || "Verkkomateriaali"
  }, "customMaterials")));
}

function createCanonicalCuratedVideoItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord(withPresentationSemantics({
    sourceKey: "curatedVideos",
    sourceLabel: item?.sourceLabel || PRESENTATION_SOURCE_LABELS.curatedVideos,
    title: item?.title || "Nimetön video",
    url: item?.url || item?.externalUrl || "",
    pageUrl: item?.pageUrl,
    externalUrl: item?.externalUrl,
    thumbnail: item?.thumbnail || "",
    description: item?.description || "",
    date: item?.date || "",
    badgeText: item?.badgeText || "Video / tallenne"
  }, "curatedVideos")));
}

function createCanonicalVideoSeriesItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord(withPresentationSemantics({
    sourceKey: "videoSeries",
    sourceLabel: item?.sourceLabel || PRESENTATION_SOURCE_LABELS.videoSeries,
    title: item?.title || "Nimetön videosarja",
    url: item?.url || item?.externalUrl || "",
    pageUrl: item?.pageUrl,
    externalUrl: item?.externalUrl,
    thumbnail: item?.thumbnail || "",
    description: item?.description || "",
    date: item?.date || "",
    itemCount: Number.isFinite(item?.itemCount) ? item.itemCount : undefined,
    badgeText: item?.badgeText || "Videosarja"
  }, "videoSeries")));
}

function createCanonicalYoutubeVideoItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord(withPresentationSemantics({
    sourceKey: "youtubeVideos",
    sourceLabel: PRESENTATION_SOURCE_LABELS.youtubeVideos,
    title: item?.title || "Nimetön video",
    url: item?.url || "",
    thumbnail: item?.thumbnail || "",
    description: item?.description || "",
    date: item?.publishedAt || ""
  }, "youtubeVideos")));
}

function createCanonicalYoutubePlaylistItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord(withPresentationSemantics({
    sourceKey: "youtube",
    sourceLabel: PRESENTATION_SOURCE_LABELS.youtube,
    title: item?.title || "Nimetön soittolista",
    url: item?.url || "",
    thumbnail: item?.thumbnail || "",
    description: item?.description || "",
    date: item?.publishedAt || "",
    itemCount: Number.isFinite(item?.itemCount) ? item.itemCount : 0
  }, "youtube")));
}

function createCanonicalSlideshareItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord(withPresentationSemantics({
    sourceKey: "slideshare",
    sourceLabel: PRESENTATION_SOURCE_LABELS.slideshare,
    title: item?.title || "Nimetön esitys",
    url: item?.url || "",
    pageUrl: item?.pageUrl || "",
    thumbnail: item?.thumbnail || "",
    description: item?.description || "",
    date: item?.date || "",
    categories: Array.isArray(item?.categories) ? item.categories.filter(Boolean) : [],
    keywords: Array.isArray(item?.keywords) ? item.keywords.filter(Boolean) : [],
    courseContexts: Array.isArray(item?.courseContexts) ? item.courseContexts : [],
    sourceLanguage: item?.sourceLanguage || "",
    slideCount: Number.isFinite(item?.slideCount) ? item.slideCount : null
  }, "slideshare")));
}

function buildCanonicalPresentationItems(sourceData = {}) {
  const items = sortCanonicalItems([
    ...createCanonicalAoeItems(sourceData.aoeRows),
    ...createCanonicalCanvaItems(sourceData.canvaRows, sourceData.canvaLookup),
    ...createCanonicalCustomMaterialItems(sourceData.customMaterials),
    ...createCanonicalCuratedVideoItems(sourceData.curatedVideos),
    ...createCanonicalVideoSeriesItems(sourceData.videoSeries),
    ...createCanonicalYoutubeVideoItems(sourceData.youtubeVideos),
    ...createCanonicalYoutubePlaylistItems(sourceData.youtubeRows),
    ...createCanonicalSlideshareItems(sourceData.slideshareItems)
  ]);

  const curatedItems = sourceData.applyAcceptedCuration
    ? applyAcceptedPresentationCuration(items, sourceData)
    : items;

  return projectLocalDetailContextsToCanonicalItems(curatedItems, sourceData.presentations);
}

function buildCanonicalPresentationPageRecords(sourceData = {}) {
  const canonicalItemsByPageUrl = new Map();
  buildCanonicalPresentationItems(sourceData).forEach((item) => {
    if (item?.pageUrl) canonicalItemsByPageUrl.set(item.pageUrl, item);
    if (item?.localPageUrl) canonicalItemsByPageUrl.set(item.localPageUrl, item);
  });

  return toArray(sourceData.presentations)
    .map((item) => {
      const canonicalItem = canonicalItemsByPageUrl.get(item?.pageUrl || "") || null;
      const canonicalCourseContexts = Array.isArray(canonicalItem?.courseContexts)
        ? canonicalItem.courseContexts
        : [];
      const localCourseContexts = Array.isArray(item?.courseContexts) ? item.courseContexts : [];
      const canonicalContexts = Array.isArray(canonicalItem?.contexts) ? canonicalItem.contexts : [];
      const localContexts = Array.isArray(item?.contexts) ? item.contexts : [];
      const localDeclaredContexts = Array.isArray(item?.declaredContexts) ? item.declaredContexts : [];
      const canonicalDeclaredContexts = Array.isArray(canonicalItem?.declaredContexts) ? canonicalItem.declaredContexts : [];

      return {
        pageUrl: item?.pageUrl || "",
        title: item?.title || canonicalItem?.title || "",
        description: item?.description || canonicalItem?.description || "",
        categories: Array.isArray(item?.categories)
          ? item.categories.filter(Boolean)
          : (Array.isArray(canonicalItem?.categories) ? canonicalItem.categories : []),
        keywords: Array.isArray(item?.keywords)
          ? item.keywords.filter(Boolean)
          : (Array.isArray(canonicalItem?.keywords) ? canonicalItem.keywords : []),
        source: item?.source || canonicalItem?.sourceKey || "",
        sourceLabel: canonicalItem?.sourceLabel || PRESENTATION_SOURCE_LABELS[item?.source] || "",
        url: item?.url || canonicalItem?.url || item?.publicUrl || item?.sourceUrl || "",
        sourceUrl: item?.sourceUrl || item?.url || canonicalItem?.url || "",
        publicUrl: item?.publicUrl || "",
        thumbnail: item?.thumbnail || canonicalItem?.thumbnail || "",
        date: item?.date ?? canonicalItem?.date ?? "",
        year: canonicalItem?.year || null,
        lang: canonicalItem?.lang || "fi",
        sourceLanguage: item?.sourceLanguage ?? (canonicalItem?.sourceLanguage || undefined),
        slideCount: Number.isFinite(item?.slideCount)
          ? item.slideCount
          : (Number.isFinite(canonicalItem?.slideCount) ? canonicalItem.slideCount : undefined),
        viewCount: Number.isFinite(item?.viewCount)
          ? item.viewCount
          : undefined,
        courseContexts: localCourseContexts.length ? localCourseContexts : canonicalCourseContexts,
        contexts: localContexts.length ? localContexts : canonicalContexts,
        declaredContexts: localDeclaredContexts.length ? localDeclaredContexts : canonicalDeclaredContexts
      };
    })
    .filter((item) => item.pageUrl);
}

function buildCanonicalPresentationPageLookup(data = {}) {
  const sourceData = buildPresentationsPageSourceData(data);
  return new Map(
    buildCanonicalPresentationPageRecords(sourceData).map((item) => [item.pageUrl, item])
  );
}

function toLegacyPublicRow(item = {}) {
  if (item.curationStatus === "human-approved-distinct-local-presentation") {
    return null;
  }

  switch (item.sourceKey) {
    case "aoe":
      return pickFields({
        title: item.title || "Nimetön oppimateriaali",
        url: item.url || "",
        image: item.thumbnail ?? null,
        year: item.year || item.date || "",
        summary: item.description || ""
      }, PUBLIC_PRESENTATION_LEGACY_FIELDS.aoe);

    case "canva":
      return pickFields({
        id: item.id || "",
        title: item.title || "Nimetön esitys",
        description: item.description || "",
        url: item.url || "",
        pageUrl: item.pageUrl,
        thumbnail: item.thumbnail || "",
        date: item.date ?? null,
        categories: Array.isArray(item.categories) ? item.categories : [],
        lang: item.lang || "fi",
        jarjestaja: item.jarjestaja || "",
        kategoria: item.kategoria || "",
        paakortti: item.paakortti === true,
        paareitti: item.paareitti,
        asiantuntijaprofiili: Array.isArray(item.asiantuntijaprofiili) ? item.asiantuntijaprofiili : [],
        sivuyhteys: Array.isArray(item.sivuyhteys) ? item.sivuyhteys : [],
        courseContexts: Array.isArray(item.courseContexts) ? item.courseContexts : [],
        sourceLanguage: item.sourceLanguage || "",
        slideCount: Number.isFinite(item.slideCount) ? item.slideCount : null
      }, PUBLIC_PRESENTATION_LEGACY_FIELDS.canva);

    case "customMaterials":
      return pickFields({
        title: item.title || "Nimetön materiaali",
        url: item.url || item.externalUrl || "",
        pageUrl: item.pageUrl,
        externalUrl: item.externalUrl,
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        badgeText: item.badgeText || "Verkkomateriaali",
        date: item.date || ""
      }, PUBLIC_PRESENTATION_LEGACY_FIELDS.customMaterials);

    case "curatedVideos":
      return pickFields({
        title: item.title || "Nimetön video",
        url: item.url || item.externalUrl || "",
        pageUrl: item.pageUrl,
        externalUrl: item.externalUrl,
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        badgeText: item.badgeText || "Video / tallenne",
        date: item.date || ""
      }, PUBLIC_PRESENTATION_LEGACY_FIELDS.curatedVideos);

    case "videoSeries":
      return pickFields({
        title: item.title || "Nimetön videosarja",
        url: item.url || item.externalUrl || "",
        pageUrl: item.pageUrl,
        externalUrl: item.externalUrl,
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        badgeText: item.badgeText || "Videosarja",
        date: item.date || "",
        itemCount: Number.isFinite(item.itemCount) ? item.itemCount : undefined
      }, PUBLIC_PRESENTATION_LEGACY_FIELDS.videoSeries);

    case "youtubeVideos":
      return pickFields({
        title: item.title || "Nimetön video",
        url: item.url || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        publishedAt: item.date || ""
      }, PUBLIC_PRESENTATION_LEGACY_FIELDS.youtubeVideos);

    case "youtube":
      return pickFields({
        title: item.title || "Nimetön soittolista",
        url: item.url || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        publishedAt: item.date || "",
        itemCount: Number.isFinite(item.itemCount) ? item.itemCount : 0
      }, PUBLIC_PRESENTATION_LEGACY_FIELDS.youtube);

    case "slideshare":
      return pickFields({
        title: item.title || "Nimetön esitys",
        url: item.url || "",
        pageUrl: item.pageUrl || "",
        thumbnail: item.thumbnail || "",
        description: item.description || "",
        categories: Array.isArray(item.categories) ? item.categories : [],
        keywords: Array.isArray(item.keywords) ? item.keywords : [],
        date: item.date || "",
        courseContexts: Array.isArray(item.courseContexts) ? item.courseContexts : [],
        sourceLanguage: item.sourceLanguage || "",
        slideCount: Number.isFinite(item.slideCount) ? item.slideCount : null
      }, PUBLIC_PRESENTATION_LEGACY_FIELDS.slideshare);

    default:
      return null;
  }
}

function buildPublicPresentationLegacyBuckets(items = []) {
  const buckets = {};

  PRESENTATION_SOURCE_ORDER.forEach((sourceKey) => {
    buckets[sourceKey] = [];
  });

  toArray(items).forEach((item) => {
    const sourceKey = String(item?.sourceKey || "").trim();
    if (!sourceKey || !buckets[sourceKey]) return;

    const row = toLegacyPublicRow(item);
    if (row) {
      buckets[sourceKey].push(row);
    }
  });

  return buckets;
}

function buildLegacyPresentationSourceBuckets(sourceData = {}) {
  return {
    aoe: toArray(sourceData.aoeRows),
    canva: toArray(sourceData.canvaRows),
    customMaterials: toArray(sourceData.customMaterials),
    curatedVideos: toArray(sourceData.curatedVideos),
    videoSeries: toArray(sourceData.videoSeries),
    youtubeVideos: toArray(sourceData.youtubeVideos),
    youtube: toArray(sourceData.youtubeRows),
    slideshare: toArray(sourceData.slideshareItems)
  };
}

function countPresentationMaterials({
  canvaRows = [],
  presentations = [],
  aoeRows = [],
  youtubeVideos = [],
  curatedVideos = [],
  videoSeries = [],
  customMaterials = []
}) {
  const keys = new Set();
  const add = (url, title) => {
    const key = `${String(url || "").trim()}|${String(title || "").trim()}`;
    if (key !== "|") keys.add(key);
  };

  canvaRows.forEach((item) => add(item?.sourceUrl || item?.url || item?.pageUrl, item?.title));
  presentations.forEach((item) => add(item?.sourceUrl || item?.url || item?.pageUrl, item?.title));
  aoeRows.forEach((item) => add(item?.url, item?.title));
  youtubeVideos.forEach((item) => add(item?.url, item?.title));
  curatedVideos.forEach((item) => add(item?.url || item?.externalUrl, item?.title));
  videoSeries.forEach((item) => add(item?.url || item?.externalUrl, item?.title));
  customMaterials.forEach((item) => add(item?.url || item?.externalUrl, item?.title));

  return keys.size;
}

function countFeedbackRefs(items = []) {
  const ids = new Set();
  items.forEach((context) => {
    toArray(context?.feedbackIds).forEach((feedbackId) => {
      if (feedbackId) ids.add(feedbackId);
    });
  });
  return ids.size;
}

function canvaRowKey(item = {}) {
  return item.id || getCanvaDesignId(item.sourceUrl || item.publicUrl || item.url || item.link || "") || "";
}

function mergeCanvaRows(primaryRows = [], fallbackRows = []) {
  const rows = [];
  const seen = new Set();

  [...toArray(primaryRows), ...toArray(fallbackRows)].forEach((item) => {
    const key = canvaRowKey(item) || `${item?.title || ""}|${item?.url || item?.link || ""}`;
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push(item);
  });

  return rows;
}

function readFallbackCanvaRows() {
  try {
    return toArray(require("./canva")()?.tableRows);
  } catch (_) {
    return [];
  }
}

function buildPresentationsPageSourceData(data = {}) {
  const presentations = enrichLocalPresentationDetailContexts(readLocalPresentationSources());
  const canvaRows = mergeCanvaRows(data.canva?.tableRows, readFallbackCanvaRows());
  const canvaLookup = buildCanvaMaterialLookup({ canvaRows, presentations });

  return {
    presentations,
    canvaRows,
    aoeRows: toArray(data.finnaAoe?.rows),
    youtubeVideos: toArray(data.youtube?.videos),
    youtubeRows: toArray(data.youtube?.tableRows),
    curatedVideos: CURATED_VIDEO_ITEMS.map((item) => ({ ...item })),
    videoSeries: VIDEO_SERIES_ITEMS.map((item) => ({ ...item })),
    customMaterials: CUSTOM_MATERIAL_ITEMS.map((item) => ({ ...item })),
    slideshareItems: createSlideshareItems(presentations),
    canvaLookup,
    canvaPageUrls: createCanvaPageUrls(presentations),
    applyAcceptedCuration: true,
    contextItems: sortByDateDesc(
      enrichPresentationContexts(data.presentationContexts?.items || [], canvaLookup),
      "date"
    )
  };
}

function buildPresentationsPageModel(data = {}) {
  const sourceData = buildPresentationsPageSourceData(data);
  const items = buildCanonicalPresentationItems(sourceData);

  return {
    ssDataItems: sourceData.slideshareItems,
    canvaPageUrls: sourceData.canvaPageUrls,
    curatedVideoItems: sourceData.curatedVideos,
    videoSeriesItems: sourceData.videoSeries,
    customMaterialItems: sourceData.customMaterials,
    videoContentCount: sourceData.youtubeVideos.length + sourceData.curatedVideos.length + sourceData.videoSeries.length,
    presentationAnalysisCount: 2,
    presentationMaterialTotal: countPresentationMaterials({
      canvaRows: sourceData.canvaRows,
      presentations: sourceData.presentations,
      aoeRows: sourceData.aoeRows,
      youtubeVideos: sourceData.youtubeVideos,
      curatedVideos: sourceData.curatedVideos,
      videoSeries: sourceData.videoSeries,
      customMaterials: sourceData.customMaterials
    }),
    presentationContextItems: sourceData.contextItems,
    presentationContextFeedbackTotal: countFeedbackRefs(sourceData.contextItems),
    highlightedContextItems: sourceData.contextItems.slice(0, 4),
    filterYears: buildPresentationFilterYears(items),
    filterTopics: buildPresentationFilterTopics(items),
    sourceSections: {
      fi: buildPresentationSourceSections(items, "fi"),
      en: buildPresentationSourceSections(items, "en")
    },
    items
  };
}

module.exports = {
  PRESENTATION_SOURCE_ORDER,
  PRESENTATION_SOURCE_LABELS,
  PUBLIC_PRESENTATION_FIELDS,
  PUBLIC_PRESENTATION_LEGACY_FIELDS,
  buildPresentationsPageSourceData,
  buildLegacyPresentationSourceBuckets,
  buildCanonicalPresentationItems,
  buildCanonicalPresentationPageRecords,
  buildCanonicalPresentationPageLookup,
  buildPresentationSourceSections,
  buildPresentationFilterYears,
  buildPresentationFilterTopics,
  buildPublicPresentationLegacyBuckets,
  buildPresentationsPageModel,
  decodeHtmlEntities,
  transcriptExcerpt
};

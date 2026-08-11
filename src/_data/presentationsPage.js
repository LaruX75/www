const { createCanvaPresentationLookup, readLocalPresentationSources } = require("./presentationSources");
const { getCanvaDesignId } = require("./canvaUrl");
const slideshareContent = require("../../slideshare-content.json");

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

const PUBLIC_PRESENTATION_FIELDS = Object.freeze([
  "id",
  "sourceKey",
  "sourceLabel",
  "title",
  "url",
  "pageUrl",
  "externalUrl",
  "thumbnail",
  "description",
  "date",
  "year",
  "lang",
  "sourceLanguage",
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
  "courseContexts"
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

function normalizeSlideshareUrl(url = "") {
  return String(url || "")
    .trim()
    .replace(/^http:\/\//i, "https://")
    .replace(/^https:\/\/slideshare\.net\//i, "https://www.slideshare.net/")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

function isGenericSlideshareDescription(text = "") {
  const normalized = String(text || "").trim().toLowerCase();
  return !normalized || normalized === "slideshare-esitys" || normalized === "slideshare presentation";
}

function transcriptExcerpt(text = "", maxLength = 420) {
  const normalized = String(text || "")
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

function createCanonicalAoeItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord({
    sourceKey: "aoe",
    sourceLabel: PRESENTATION_SOURCE_LABELS.aoe,
    title: item?.title || "Nimetön oppimateriaali",
    url: item?.url || "",
    thumbnail: item?.image ?? null,
    description: item?.summary || "",
    date: String(item?.year || "").trim(),
    year: String(item?.year || "").trim()
  }));
}

function createCanonicalCanvaItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord({
    id: item?.id || "",
    sourceKey: "canva",
    sourceLabel: PRESENTATION_SOURCE_LABELS.canva,
    title: item?.title || "Nimetön esitys",
    url: item?.url || "",
    pageUrl: item?.pageUrl ?? null,
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
  }));
}

function createCanonicalCustomMaterialItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord({
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
  }));
}

function createCanonicalCuratedVideoItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord({
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
  }));
}

function createCanonicalVideoSeriesItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord({
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
  }));
}

function createCanonicalYoutubeVideoItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord({
    sourceKey: "youtubeVideos",
    sourceLabel: PRESENTATION_SOURCE_LABELS.youtubeVideos,
    title: item?.title || "Nimetön video",
    url: item?.url || "",
    thumbnail: item?.thumbnail || "",
    description: item?.description || "",
    date: item?.publishedAt || ""
  }));
}

function createCanonicalYoutubePlaylistItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord({
    sourceKey: "youtube",
    sourceLabel: PRESENTATION_SOURCE_LABELS.youtube,
    title: item?.title || "Nimetön soittolista",
    url: item?.url || "",
    thumbnail: item?.thumbnail || "",
    description: item?.description || "",
    date: item?.publishedAt || "",
    itemCount: Number.isFinite(item?.itemCount) ? item.itemCount : 0
  }));
}

function createCanonicalSlideshareItems(rows = []) {
  return toArray(rows).map((item) => toPublicPresentationRecord({
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
  }));
}

function buildCanonicalPresentationItems(sourceData = {}) {
  return sortCanonicalItems([
    ...createCanonicalAoeItems(sourceData.aoeRows),
    ...createCanonicalCanvaItems(sourceData.canvaRows),
    ...createCanonicalCustomMaterialItems(sourceData.customMaterials),
    ...createCanonicalCuratedVideoItems(sourceData.curatedVideos),
    ...createCanonicalVideoSeriesItems(sourceData.videoSeries),
    ...createCanonicalYoutubeVideoItems(sourceData.youtubeVideos),
    ...createCanonicalYoutubePlaylistItems(sourceData.youtubeRows),
    ...createCanonicalSlideshareItems(sourceData.slideshareItems)
  ]);
}

function buildCanonicalPresentationPageRecords(sourceData = {}) {
  const canonicalItemsByPageUrl = new Map(
    buildCanonicalPresentationItems(sourceData)
      .filter((item) => item?.pageUrl)
      .map((item) => [item.pageUrl, item])
  );

  return toArray(sourceData.presentations)
    .map((item) => {
      const canonicalItem = canonicalItemsByPageUrl.get(item?.pageUrl || "") || null;
      const canonicalCourseContexts = Array.isArray(canonicalItem?.courseContexts)
        ? canonicalItem.courseContexts
        : [];
      const localCourseContexts = Array.isArray(item?.courseContexts) ? item.courseContexts : [];

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
        sourceLanguage: item?.sourceLanguage ?? canonicalItem?.sourceLanguage,
        slideCount: Number.isFinite(item?.slideCount)
          ? item.slideCount
          : (Number.isFinite(canonicalItem?.slideCount) ? canonicalItem.slideCount : undefined),
        viewCount: Number.isFinite(item?.viewCount)
          ? item.viewCount
          : undefined,
        courseContexts: localCourseContexts.length ? localCourseContexts : canonicalCourseContexts
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

function buildPresentationsPageSourceData(data = {}) {
  const presentations = readLocalPresentationSources();
  const canvaRows = toArray(data.canva?.tableRows);
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
    canvaPageUrls: createCanvaPageUrls(presentations),
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
  buildPublicPresentationLegacyBuckets,
  buildPresentationsPageModel
};

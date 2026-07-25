const { createCanvaPresentationLookup, readLocalPresentationSources } = require("./presentationSources");
const { getCanvaDesignId } = require("./canvaUrl");

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
    url: "https://www.youtube.com/playlist?list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY",
    externalUrl: "https://www.youtube.com/playlist?list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY",
    thumbnail: "https://i.ytimg.com/vi/hCZ9lgODkes/hqdefault.jpg",
    date: "",
    badgeText: "Lyhyiden vinkkien videosarja",
    listText: "Käytännön vinkkejä opetusteknologian ja digityökalujen arkeen",
    description: "Lyhyiden vinkkivideoiden sarja opetusteknologian, digityökalujen ja käytännön opetustyön tueksi.",
    sourceLabel: "YouTube / oma sarja",
    external: true
  }
];

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function sortByDateDesc(items, field = "_isoDate") {
  return [...toArray(items)].sort((a, b) => String(b?.[field] || "").localeCompare(String(a?.[field] || "")));
}

function createSlideshareItems(presentations = []) {
  return presentations
    .filter((item) => item?.source === "slideshare")
    .map((item) => ({
      title: item.title,
      url: item.url,
      pageUrl: item.pageUrl,
      thumbnail: item.thumbnail,
      date: item.date,
      description: item.description || "",
      categories: item.categories || [],
      keywords: item.keywords || []
    }));
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

function countPresentationMaterials({
  canvaRows = [],
  presentations = [],
  aoeRows = [],
  youtubeVideos = [],
  curatedVideos = [],
  videoSeries = []
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

function buildPresentationsPageModel(data = {}) {
  const presentations = readLocalPresentationSources();
  const canvaRows = toArray(data.canva?.tableRows);
  const canvaLookup = buildCanvaMaterialLookup({ canvaRows, presentations });
  const contextItems = sortByDateDesc(
    enrichPresentationContexts(data.presentationContexts?.items || [], canvaLookup),
    "date"
  );
  const curatedVideos = CURATED_VIDEO_ITEMS.map((item) => ({ ...item }));
  const videoSeries = VIDEO_SERIES_ITEMS.map((item) => ({ ...item }));
  const slideshareItems = createSlideshareItems(presentations);
  const canvaPageUrls = createCanvaPageUrls(presentations);

  return {
    ssDataItems: slideshareItems,
    canvaPageUrls,
    curatedVideoItems: curatedVideos,
    videoSeriesItems: videoSeries,
    videoContentCount: toArray(data.youtube?.videos).length + curatedVideos.length + videoSeries.length,
    presentationAnalysisCount: 2,
    presentationMaterialTotal: countPresentationMaterials({
      canvaRows,
      presentations,
      aoeRows: toArray(data.finnaAoe?.rows),
      youtubeVideos: toArray(data.youtube?.videos),
      curatedVideos,
      videoSeries
    }),
    presentationContextItems: contextItems,
    presentationContextFeedbackTotal: countFeedbackRefs(contextItems),
    highlightedContextItems: contextItems.slice(0, 4),
    rawData: {
      aoe: toArray(data.finnaAoe?.rows),
      canva: toArray(data.canva?.tableRows),
      curatedVideos,
      videoSeries,
      youtubeVideos: toArray(data.youtube?.videos),
      youtube: toArray(data.youtube?.tableRows),
      slideshare: slideshareItems
    }
  };
}

module.exports = {
  buildPresentationsPageModel
};

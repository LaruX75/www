const canva = require("../src/_data/canva");
const finnaAoe = require("../src/_data/finnaAoe");
const youtube = require("../src/_data/youtube");
const presentationContextsData = require("../src/_data/presentationContexts.json");
const {
  buildLegacyPresentationSourceBuckets,
  buildPresentationsPageModel,
  buildPresentationsPageSourceData
} = require("../src/_data/presentationsPage");

const archiveMetaByKey = {
  canva: {
    archiveType: "own",
    archiveTypeLabel: "Koulutus / esitys",
    sourceLabel: "Canva"
  },
  slideshare: {
    archiveType: "own",
    archiveTypeLabel: "Koulutus / esitys",
    sourceLabel: "SlideShare"
  },
  aoe: {
    archiveType: "aoe",
    archiveTypeLabel: "Avoin oppimateriaali",
    sourceLabel: "AOE / Finna"
  },
  curatedVideos: {
    archiveType: "video",
    archiveTypeLabel: "Video / tallenne",
    sourceLabel: "YouTube / oma puheenvuoro"
  },
  customMaterials: {
    archiveType: "aoe",
    archiveTypeLabel: "Verkkomateriaali",
    sourceLabel: "Oulun kaupunki"
  },
  videoSeries: {
    archiveType: "video",
    archiveTypeLabel: "Videosarja",
    sourceLabel: "YouTube / oma sarja"
  },
  youtubeVideos: {
    archiveType: "video",
    archiveTypeLabel: "Video / tallenne",
    sourceLabel: "YouTube"
  },
  youtube: {
    archiveType: "video",
    archiveTypeLabel: "Soittolista",
    sourceLabel: "YouTube"
  }
};

function itemSourceKey(item, sourceKeyOverride = "") {
  return String(sourceKeyOverride || item?.sourceKey || "").trim();
}

function toDisplayDate(value) {
  if (!value) return "";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return new Intl.DateTimeFormat("fi-FI").format(parsed);
  }
  return String(value);
}

function toIsoDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extractSlideshareDateFromThumbnail(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  const match = String(thumbnailUrl).match(/-(\d{6})\d{6}-/);
  if (!match) return null;
  const yymmdd = match[1];
  const yy = Number.parseInt(yymmdd.slice(0, 2), 10);
  const mm = Number.parseInt(yymmdd.slice(2, 4), 10);
  const dd = Number.parseInt(yymmdd.slice(4, 6), 10);
  if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const year = yy >= 90 ? 1900 + yy : 2000 + yy;
  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function normalizeSlideshareIsoDate(value, thumbnailUrl) {
  return extractSlideshareDateFromThumbnail(thumbnailUrl) || toIsoDate(value) || "";
}

function createEmptySectionRowsByKey() {
  return {
    aoe: [],
    canva: [],
    customMaterials: [],
    curatedVideos: [],
    videoSeries: [],
    youtubeVideos: [],
    youtube: [],
    slideshare: []
  };
}

function normalizeLegacyRows(key, rows) {
  if (!Array.isArray(rows)) return [];

  if (key === "aoe") {
    return rows.map((r) => ({
      sourceKey: key,
      title: r.title || "Nimetön oppimateriaali",
      url: r.url || "",
      thumbnail: r.image || "",
      description: r.summary || "",
      meta: "AOE / Oppimateriaali",
      date: r.year || "",
      _isoDate: r.year ? `${r.year}-12-31` : ""
    }));
  }

  if (key === "canva") {
    return rows.map((r) => {
      const iso = toIsoDate(r.date || r.publishedAt || r.createdAt || r.updatedAt || "") || "";
      return {
        sourceKey: key,
        id: r.id || "",
        title: r.title || "Nimetön esitys",
        url: r.url || "",
        pageUrl: r.pageUrl || "",
        thumbnail: r.thumbnail || "",
        description: r.description || "",
        keywords: Array.isArray(r.categories) ? r.categories.filter(Boolean) : [],
        lang: r.lang || "fi",
        sourceLanguage: r.sourceLanguage || r.lang || "fi",
        slideCount: Number.isFinite(r.slideCount) ? r.slideCount : null,
        meta: "Canva",
        date: toDisplayDate(iso),
        _isoDate: iso,
        jarjestaja: r.jarjestaja || "",
        kategoria: r.kategoria || "",
        paakortti: r.paakortti === true,
        paareitti: r.paareitti || "",
        asiantuntijaprofiili: Array.isArray(r.asiantuntijaprofiili) ? r.asiantuntijaprofiili : [],
        sivuyhteys: Array.isArray(r.sivuyhteys) ? r.sivuyhteys : [],
        courseContexts: Array.isArray(r.courseContexts) ? r.courseContexts : []
      };
    });
  }

  if (key === "youtubeVideos") {
    return rows.map((r) => ({
      sourceKey: key,
      title: r.title || "Nimetön video",
      url: r.url || "",
      thumbnail: r.thumbnail || "",
      description: r.description || "",
      meta: "YouTube-video",
      date: toDisplayDate(r.publishedAt || ""),
      _isoDate: toIsoDate(r.publishedAt || "") || ""
    }));
  }

  if (key === "curatedVideos") {
    return rows.map((r) => ({
      sourceKey: key,
      title: r.title || "Nimetön video",
      url: r.url || r.externalUrl || "",
      pageUrl: r.pageUrl || "",
      externalUrl: r.externalUrl || "",
      thumbnail: r.thumbnail || "",
      description: r.description || "",
      meta: r.badgeText || "Video / tallenne",
      date: toDisplayDate(r.date || ""),
      _isoDate: toIsoDate(r.date || "") || ""
    }));
  }

  if (key === "videoSeries") {
    return rows.map((r) => ({
      sourceKey: key,
      title: r.title || "Nimetön videosarja",
      url: r.url || r.externalUrl || "",
      pageUrl: r.pageUrl || "",
      externalUrl: r.externalUrl || "",
      thumbnail: r.thumbnail || "",
      description: r.description || "",
      meta: r.badgeText || (r.itemCount ? `${r.itemCount} videota` : "Videosarja"),
      date: toDisplayDate(r.date || ""),
      _isoDate: toIsoDate(r.date || "") || ""
    }));
  }

  if (key === "youtube") {
    return rows.map((r) => ({
      sourceKey: key,
      title: r.title || "Nimetön soittolista",
      url: r.url || "",
      thumbnail: r.thumbnail || "",
      description: r.description || "",
      meta: `${r.itemCount || 0} videota`,
      date: toDisplayDate(r.publishedAt || ""),
      _isoDate: toIsoDate(r.publishedAt || "") || ""
    }));
  }

  if (key === "slideshare") {
    return rows.map((r) => {
      const iso = normalizeSlideshareIsoDate(r.date || "", r.thumbnail || "");
      return {
        sourceKey: key,
        date: toDisplayDate(iso),
        title: r.title || "Nimetön esitys",
        url: r.url || "",
        pageUrl: r.pageUrl || "",
        thumbnail: r.thumbnail || "",
        description: r.description || "",
        keywords: [
          ...(Array.isArray(r.categories) ? r.categories : []),
          ...(Array.isArray(r.keywords) ? r.keywords : [])
        ].map((value) => String(value || "").trim()).filter(Boolean),
        courseContexts: Array.isArray(r.courseContexts) ? r.courseContexts : [],
        sourceLanguage: r.sourceLanguage || "",
        slideCount: Number.isFinite(r.slideCount) ? r.slideCount : null,
        _isoDate: iso
      };
    });
  }

  if (key === "customMaterials") {
    return rows.map((r) => ({
      sourceKey: key,
      title: r.title || "Nimetön materiaali",
      url: r.url || r.externalUrl || "",
      pageUrl: r.pageUrl || "",
      externalUrl: r.externalUrl || "",
      thumbnail: r.thumbnail || "",
      description: r.description || "",
      meta: r.badgeText || "Verkkomateriaali",
      date: toDisplayDate(r.date || ""),
      _isoDate: toIsoDate(r.date || "") || ""
    }));
  }

  return [];
}

function normalizeCanonicalItem(item) {
  const sourceKey = itemSourceKey(item);
  if (!sourceKey) return null;

  if (sourceKey === "aoe") {
    const year = String(item.year || item.date || "").trim();
    return {
      sourceKey,
      title: item.title || "Nimetön oppimateriaali",
      url: item.url || "",
      thumbnail: item.thumbnail || "",
      description: item.description || "",
      meta: "AOE / Oppimateriaali",
      date: year,
      _isoDate: year ? `${year}-12-31` : ""
    };
  }

  if (sourceKey === "canva") {
    const iso = toIsoDate(item.date || "") || "";
    return {
      sourceKey,
      id: item.id || "",
      title: item.title || "Nimetön esitys",
      url: item.url || "",
      pageUrl: item.pageUrl || "",
      thumbnail: item.thumbnail || "",
      description: item.description || "",
      keywords: Array.isArray(item.categories) ? item.categories.filter(Boolean) : [],
      lang: item.lang || "fi",
      sourceLanguage: item.sourceLanguage || item.lang || "fi",
      slideCount: Number.isFinite(item.slideCount) ? item.slideCount : null,
      meta: "Canva",
      date: toDisplayDate(iso),
      _isoDate: iso,
      jarjestaja: item.jarjestaja || "",
      kategoria: item.kategoria || "",
      paakortti: item.paakortti === true,
      paareitti: item.paareitti || "",
      asiantuntijaprofiili: Array.isArray(item.asiantuntijaprofiili) ? item.asiantuntijaprofiili : [],
      sivuyhteys: Array.isArray(item.sivuyhteys) ? item.sivuyhteys : [],
      courseContexts: Array.isArray(item.courseContexts) ? item.courseContexts : []
    };
  }

  if (sourceKey === "youtubeVideos") {
    const iso = toIsoDate(item.date || "") || "";
    return {
      sourceKey,
      title: item.title || "Nimetön video",
      url: item.url || "",
      thumbnail: item.thumbnail || "",
      description: item.description || "",
      meta: "YouTube-video",
      date: toDisplayDate(iso),
      _isoDate: iso
    };
  }

  if (sourceKey === "curatedVideos") {
    const iso = toIsoDate(item.date || "") || "";
    return {
      sourceKey,
      title: item.title || "Nimetön video",
      url: item.url || item.externalUrl || "",
      pageUrl: item.pageUrl || "",
      externalUrl: item.externalUrl || "",
      thumbnail: item.thumbnail || "",
      description: item.description || "",
      meta: item.badgeText || "Video / tallenne",
      date: toDisplayDate(iso),
      _isoDate: iso
    };
  }

  if (sourceKey === "videoSeries") {
    const iso = toIsoDate(item.date || "") || "";
    return {
      sourceKey,
      title: item.title || "Nimetön videosarja",
      url: item.url || item.externalUrl || "",
      pageUrl: item.pageUrl || "",
      externalUrl: item.externalUrl || "",
      thumbnail: item.thumbnail || "",
      description: item.description || "",
      meta: item.badgeText || (item.itemCount ? `${item.itemCount} videota` : "Videosarja"),
      date: toDisplayDate(iso),
      _isoDate: iso
    };
  }

  if (sourceKey === "youtube") {
    const iso = toIsoDate(item.date || "") || "";
    return {
      sourceKey,
      title: item.title || "Nimetön soittolista",
      url: item.url || "",
      thumbnail: item.thumbnail || "",
      description: item.description || "",
      meta: `${item.itemCount || 0} videota`,
      date: toDisplayDate(iso),
      _isoDate: iso
    };
  }

  if (sourceKey === "slideshare") {
    const iso = normalizeSlideshareIsoDate(item.date || "", item.thumbnail || "");
    return {
      sourceKey,
      date: toDisplayDate(iso),
      title: item.title || "Nimetön esitys",
      url: item.url || "",
      pageUrl: item.pageUrl || "",
      thumbnail: item.thumbnail || "",
      description: item.description || "",
      keywords: [
        ...(Array.isArray(item.categories) ? item.categories : []),
        ...(Array.isArray(item.keywords) ? item.keywords : [])
      ].map((value) => String(value || "").trim()).filter(Boolean),
      courseContexts: Array.isArray(item.courseContexts) ? item.courseContexts : [],
      sourceLanguage: item.sourceLanguage || "",
      slideCount: Number.isFinite(item.slideCount) ? item.slideCount : null,
      _isoDate: iso
    };
  }

  if (sourceKey === "customMaterials") {
    const iso = toIsoDate(item.date || "") || "";
    return {
      sourceKey,
      title: item.title || "Nimetön materiaali",
      url: item.url || item.externalUrl || "",
      pageUrl: item.pageUrl || "",
      externalUrl: item.externalUrl || "",
      thumbnail: item.thumbnail || "",
      description: item.description || "",
      meta: item.badgeText || "Verkkomateriaali",
      date: toDisplayDate(iso),
      _isoDate: iso
    };
  }

  return null;
}

function sortSectionRows(rows) {
  return [...rows].sort((a, b) => (b._isoDate || "").localeCompare(a._isoDate || ""));
}

function buildSectionRowsFromItems(items) {
  const buckets = createEmptySectionRowsByKey();
  items.forEach((item) => {
    const normalized = normalizeCanonicalItem(item);
    const sourceKey = itemSourceKey(normalized);
    if (!normalized || !sourceKey || !Array.isArray(buckets[sourceKey])) return;
    buckets[sourceKey].push(normalized);
  });
  Object.keys(buckets).forEach((key) => {
    buckets[key] = sortSectionRows(buckets[key]);
  });
  return buckets;
}

function buildSectionRowsFromRawData(data) {
  const buckets = createEmptySectionRowsByKey();
  Object.keys(buckets).forEach((key) => {
    buckets[key] = sortSectionRows(normalizeLegacyRows(key, data[key]));
  });
  return buckets;
}

function normalizeContextUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function itemCourseContexts(item) {
  return Array.isArray(item?.courseContexts) ? item.courseContexts : [];
}

function createMatcherText(parts) {
  return parts
    .flatMap((part) => {
      if (Array.isArray(part)) return part;
      return [part];
    })
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
}

function uniquePush(list, value) {
  const normalized = String(value || "").trim();
  if (!normalized || list.includes(normalized)) return;
  list.push(normalized);
}

function findContextsForItem(item, presentationContexts) {
  const itemUrls = [item.url, item.externalUrl, item.pageUrl].map(normalizeContextUrl).filter(Boolean);
  const itemTitle = String(item.title || "").trim();

  return presentationContexts.filter((context) => {
    const materialUrls = Array.isArray(context.materialUrls)
      ? context.materialUrls.map(normalizeContextUrl).filter(Boolean)
      : [];
    const materialTitles = Array.isArray(context.materialTitles)
      ? context.materialTitles.map((title) => String(title || "").trim())
      : [];
    return itemUrls.some((url) => materialUrls.includes(url)) || (itemTitle && materialTitles.includes(itemTitle));
  });
}

function classifyPresentationItem(item, contexts = []) {
  const categoryTags = [];
  const profileTags = [];
  const routeTags = [];
  const explicitCategory = String(item.kategoria || "").trim();
  const explicitProfiles = Array.isArray(item.asiantuntijaprofiili) ? item.asiantuntijaprofiili : [];
  const explicitPrimaryRoute = String(item.paareitti || "").trim();
  const hasCourseContext = itemCourseContexts(item).length > 0;
  const contextTypes = contexts.map((context) => String(context.type || "").trim()).filter(Boolean);
  const text = createMatcherText([
    item.title,
    item.description,
    item.meta,
    item.sourceLabel,
    item.archiveTypeLabel,
    item.jarjestaja,
    item.organizer,
    item.sourceKey,
    item.keywords,
    item.categories,
    contexts.map((context) => [
      context.title,
      context.type,
      context.typeLabel,
      context.format,
      context.role,
      context.organizer,
      context.audience,
      context.summary,
      context.topics
    ])
  ]);
  const has = (pattern) => pattern.test(text);

  if (explicitCategory) uniquePush(categoryTags, explicitCategory);
  explicitProfiles.forEach((profile) => uniquePush(profileTags, profile));

  if (contextTypes.includes("keynote")) {
    uniquePush(categoryTags, "konferenssi-keynote");
    uniquePush(profileTags, "asiantuntija");
  }
  if (contextTypes.includes("continuing-education")) {
    uniquePush(categoryTags, "täydennyskoulutus");
    uniquePush(profileTags, "kouluttaja");
  }
  if (contextTypes.includes("academic-lecture")) {
    uniquePush(categoryTags, "tdk-luento");
    uniquePush(profileTags, "tutkija");
    uniquePush(profileTags, "kouluttaja");
  }
  if (contextTypes.includes("expert-video")) {
    uniquePush(profileTags, "asiantuntija");
  }
  if (contextTypes.includes("video-series")) {
    uniquePush(profileTags, "kouluttaja");
    uniquePush(routeTags, "route:materiaalit");
  }
  if (has(/\bkeynote\b|avauspuheenvuoro|avauspuhe|plenary|opening keynote/)) {
    uniquePush(categoryTags, "konferenssi-keynote");
  }
  if (has(/\b(isls|earli|iste|hicss|site|edmedia|ed-media|ectel|icls|edulearn|steam|arctic frontiers|fablearn|conference|symposium|kongressi|konferenssi)\b/)) {
    uniquePush(categoryTags, "kansainvälinen-konferenssi");
  }
  if (has(/\bwebinaari\b|\bwebinar\b|itk-webinaari|verkkoluent|verkkolive/)) {
    uniquePush(categoryTags, "webinaari");
  }
  if (has(/\bveso\b|täydennyskoulut|taydennyskoulut|koulutuspaketti|opettajille suunnattu|opettajien täydennys|digierko|opopassi|\bavi\b/)) {
    uniquePush(categoryTags, "täydennyskoulutus");
  }
  if (has(/\bhanke\b|hankkeen|project presentation|hankeesittely|esittely japanilaiselle vieraalle/)) {
    uniquePush(categoryTags, "hanke-esittely");
  }
  if (has(/\bluento\b|opintojak|kurssi|kurssin|väitös|vaitos|doctoral defence|akateeminen luento|\b\d{5,6}[a-z]\b/)) {
    uniquePush(categoryTags, "tdk-luento");
  }

  if (categoryTags.includes("konferenssi-keynote") || categoryTags.includes("kansainvälinen-konferenssi")) {
    uniquePush(profileTags, "tutkija");
    uniquePush(profileTags, "asiantuntija");
  }
  if (categoryTags.includes("täydennyskoulutus") || categoryTags.includes("webinaari") || categoryTags.includes("hanke-esittely")) {
    uniquePush(profileTags, "kouluttaja");
  }
  if (categoryTags.includes("tdk-luento")) {
    uniquePush(profileTags, "kouluttaja");
    uniquePush(profileTags, "tutkija");
  }
  if (item.archiveType === "aoe") {
    uniquePush(profileTags, "kouluttaja");
  }
  if (item.archiveType === "analysis") {
    uniquePush(profileTags, "asiantuntija");
    uniquePush(profileTags, "tutkija");
  }
  if (item.sourceKey === "videoSeries") {
    uniquePush(profileTags, "kouluttaja");
    uniquePush(profileTags, "asiantuntija");
  }
  if (has(/asiantuntija|paneeli|palveluverkko|tausta-aineisto|päätöksenteko/)) {
    uniquePush(profileTags, "asiantuntija");
  }
  if (has(/väittelijä|research|doctoral|väitös|vaitos|conference|symposium|cscl|learning analytics/)) {
    uniquePush(profileTags, "tutkija");
  }
  if (has(/kouluttaja|workshop|työpaja|opettajille suunnattu|opettajien täydennys|digierko|veso/)) {
    uniquePush(profileTags, "kouluttaja");
  }
  if (item.archiveType === "video" || item.archiveType === "aoe") {
    uniquePush(routeTags, "route:materiaalit");
  }
  if (hasCourseContext) {
    uniquePush(routeTags, "route:opintojaksot");
  }

  const isAcademicLectureOnly = categoryTags.length === 1 && categoryTags[0] === "tdk-luento";
  const hasTrainingCategory =
    categoryTags.includes("täydennyskoulutus") ||
    categoryTags.includes("webinaari") ||
    categoryTags.includes("hanke-esittely") ||
    categoryTags.includes("tdk-luento");

  if (
    categoryTags.includes("konferenssi-keynote") ||
    categoryTags.includes("kansainvälinen-konferenssi") ||
    (profileTags.includes("tutkija") && !isAcademicLectureOnly && !hasTrainingCategory)
  ) {
    uniquePush(routeTags, "route:puheenvuorot");
  }
  if (hasTrainingCategory) {
    uniquePush(routeTags, "route:koulutukset");
  }
  if (profileTags.includes("asiantuntija") && !routeTags.includes("route:koulutukset") && item.archiveType !== "aoe") {
    uniquePush(routeTags, "route:puheenvuorot");
  }
  if (!routeTags.length && item.archiveType === "own") {
    if (has(/teacher education|opettajankoulutus|opettaj|pedagog|opetus|oppiminen|learning|education|kurssi|luento|workshop|mobiilioppiminen|multimedia|social media|teknologiatuettu/)) {
      uniquePush(routeTags, "route:koulutukset");
    } else {
      uniquePush(routeTags, "route:puheenvuorot");
    }
  }
  if (explicitPrimaryRoute) {
    uniquePush(routeTags, explicitPrimaryRoute);
  }

  let routePrimary = "";
  if (item.archiveType !== "analysis") {
    if (explicitPrimaryRoute) {
      routePrimary = explicitPrimaryRoute;
    } else if (hasCourseContext) {
      routePrimary = "route:opintojaksot";
    } else if (item.archiveType === "video" || item.archiveType === "aoe") {
      routePrimary = "route:materiaalit";
    } else if (categoryTags.includes("konferenssi-keynote") || categoryTags.includes("kansainvälinen-konferenssi")) {
      routePrimary = "route:puheenvuorot";
    } else if (hasTrainingCategory) {
      routePrimary = "route:koulutukset";
    } else if (routeTags.includes("route:puheenvuorot")) {
      routePrimary = "route:puheenvuorot";
    } else if (routeTags.includes("route:koulutukset")) {
      routePrimary = "route:koulutukset";
    } else if (routeTags.includes("route:materiaalit")) {
      routePrimary = "route:materiaalit";
    }
  }

  return {
    categoryTags,
    profileTags,
    routeTags,
    routePrimary,
    primaryCategory: categoryTags[0] || ""
  };
}

function buildUnifiedArchiveItems(sectionRowsByKey, presentationContexts) {
  const items = [];
  Object.entries(sectionRowsByKey).forEach(([key, rows]) => {
    const meta = archiveMetaByKey[key];
    if (!meta) return;
    rows.forEach((item) => {
      const matchedContexts = findContextsForItem(item, presentationContexts);
      const taxonomy = classifyPresentationItem(
        {
          ...item,
          archiveType: meta.archiveType,
          archiveTypeLabel: meta.archiveTypeLabel,
          sourceLabel: meta.sourceLabel,
          sourceKey: key
        },
        matchedContexts
      );
      items.push({
        ...item,
        archiveType: meta.archiveType,
        archiveTypeLabel: meta.archiveTypeLabel,
        sourceLabel: meta.sourceLabel,
        sourceKey: key,
        matchedContexts,
        categoryTags: taxonomy.categoryTags,
        profileTags: taxonomy.profileTags,
        routeTags: taxonomy.routeTags,
        routePrimary: taxonomy.routePrimary,
        kategoria: item.kategoria || taxonomy.primaryCategory
      });
    });
  });

  const seen = new Set();
  return items
    .filter((item) => {
      const key = `${item.url || item.pageUrl || ""}|${item.title || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => (b._isoDate || "").localeCompare(a._isoDate || ""));
}

function stableValue(value) {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = stableValue(value[key]);
      return acc;
    }, {});
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function signatureForSectionItem(item) {
  return {
    sourceKey: item.sourceKey,
    title: item.title || "",
    url: item.url || "",
    pageUrl: item.pageUrl || "",
    externalUrl: item.externalUrl || "",
    date: item.date || "",
    _isoDate: item._isoDate || "",
    meta: item.meta || "",
    sourceLanguage: item.sourceLanguage || "",
    lang: item.lang || "",
    slideCount: item.slideCount ?? null,
    kategoria: item.kategoria || "",
    paakortti: item.paakortti === true,
    courseContexts: Array.isArray(item.courseContexts) ? item.courseContexts : [],
    keywords: Array.isArray(item.keywords) ? item.keywords : []
  };
}

function signatureForArchiveItem(item) {
  return {
    sourceKey: item.sourceKey,
    archiveType: item.archiveType,
    archiveTypeLabel: item.archiveTypeLabel,
    sourceLabel: item.sourceLabel,
    title: item.title || "",
    url: item.url || "",
    pageUrl: item.pageUrl || "",
    externalUrl: item.externalUrl || "",
    date: item.date || "",
    _isoDate: item._isoDate || "",
    routePrimary: item.routePrimary || "",
    routeTags: Array.isArray(item.routeTags) ? item.routeTags : [],
    categoryTags: Array.isArray(item.categoryTags) ? item.categoryTags : [],
    profileTags: Array.isArray(item.profileTags) ? item.profileTags : [],
    kategoria: item.kategoria || "",
    courseContexts: Array.isArray(item.courseContexts) ? item.courseContexts : [],
    matchedContexts: Array.isArray(item.matchedContexts)
      ? item.matchedContexts.map((context) => ({
        id: context.id || "",
        title: context.title || "",
        type: context.type || ""
      }))
      : []
  };
}

function compareLists(a = [], b = [], signatureFn = (value) => value) {
  const left = a.map((item) => stableJson(signatureFn(item))).sort();
  const right = b.map((item) => stableJson(signatureFn(item))).sort();
  return {
    ok: stableJson(left) === stableJson(right),
    leftCount: left.length,
    rightCount: right.length,
    onlyInLeft: left.filter((item) => !right.includes(item)),
    onlyInRight: right.filter((item) => !left.includes(item))
  };
}

function classifyParityDifferences(parity = {}, intentionalCanonicalOnly = new Set()) {
  const expectedCanonicalOnly = parity.onlyInLeft.filter((item) => intentionalCanonicalOnly.has(item));
  const unexplainedCanonicalOnly = parity.onlyInLeft.filter((item) => !intentionalCanonicalOnly.has(item));
  const unexplainedLegacyOnly = parity.onlyInRight.slice();

  return {
    ok: unexplainedCanonicalOnly.length === 0 && unexplainedLegacyOnly.length === 0,
    leftCount: parity.leftCount,
    rightCount: parity.rightCount,
    intentionalCanonicalOnly: expectedCanonicalOnly,
    unexplainedCanonicalOnly,
    unexplainedLegacyOnly
  };
}

async function loadBuildData() {
  return {
    canva: await canva(),
    finnaAoe: await finnaAoe(),
    youtube: await youtube(),
    presentationContexts: presentationContextsData
  };
}

async function main() {
  const data = await loadBuildData();
  const sourceData = buildPresentationsPageSourceData(data);
  const model = buildPresentationsPageModel(data);
  const presentationContexts = model.presentationContextItems || [];
  const legacySourceBuckets = buildLegacyPresentationSourceBuckets(sourceData);
  const distinctLocalCanonicalItems = (model.items || []).filter(
    (item) => item?.curationStatus === "human-approved-distinct-local-presentation"
  );

  const itemsBuckets = buildSectionRowsFromItems(model.items || []);
  const legacyBuckets = buildSectionRowsFromRawData(legacySourceBuckets);
  const intentionalBuckets = buildSectionRowsFromItems(distinctLocalCanonicalItems);
  const bucketParity = {};
  let ok = true;

  Object.keys(itemsBuckets).forEach((key) => {
    const parity = compareLists(itemsBuckets[key], legacyBuckets[key], signatureForSectionItem);
    const intentionalCanonicalOnly = new Set(
      intentionalBuckets[key].map((item) => stableJson(signatureForSectionItem(item)))
    );
    bucketParity[key] = classifyParityDifferences(parity, intentionalCanonicalOnly);
    if (!bucketParity[key].ok) ok = false;
  });

  const itemsArchive = buildUnifiedArchiveItems(itemsBuckets, presentationContexts);
  const legacyArchive = buildUnifiedArchiveItems(legacyBuckets, presentationContexts);
  const intentionalArchiveItems = buildUnifiedArchiveItems(intentionalBuckets, presentationContexts);
  const archiveParity = classifyParityDifferences(
    compareLists(itemsArchive, legacyArchive, signatureForArchiveItem),
    new Set(intentionalArchiveItems.map((item) => stableJson(signatureForArchiveItem(item))))
  );
  if (!archiveParity.ok) ok = false;

  const report = {
    generatedAt: new Date().toISOString(),
    ok,
    canonicalItemsCount: Array.isArray(model.items) ? model.items.length : 0,
    acceptedDistinctLocalPresentationCount: distinctLocalCanonicalItems.length,
    bucketParity,
    archiveParity: {
      ok: archiveParity.ok,
      leftCount: archiveParity.leftCount,
      rightCount: archiveParity.rightCount,
      intentionalCanonicalOnly: archiveParity.intentionalCanonicalOnly.slice(0, 10),
      unexplainedCanonicalOnly: archiveParity.unexplainedCanonicalOnly.slice(0, 10),
      unexplainedLegacyOnly: archiveParity.unexplainedLegacyOnly.slice(0, 10)
    }
  };

  console.log(JSON.stringify(report, null, 2));

  if (!ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const fs = require("fs");
const path = require("path");
const Image = require("@11ty/eleventy-img");
const {
  getContextMeta,
  resolveContexts
} = require("./src/_data/contentContext");

function getLangFromUrl(url) {
  return String(url || "").startsWith("/en/") ? "en" : "fi";
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function normalizeTerm(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTerms(values) {
  return new Set(toArray(values).map(normalizeTerm).filter(Boolean));
}

function uniqueContentItems(collections) {
  const sources = [
    ...(collections?.blog || []),
    ...(collections?.publications || []),
    ...(collections?.politics || []),
    ...(collections?.media || []),
    ...(collections?.presentations || [])
  ];
  const seen = new Set();
  return sources.filter((item) => {
    if (!item || !item.url || !item.data?.title || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function intersectionCount(values, wanted) {
  return toArray(values).reduce((count, value) => (
    wanted.has(normalizeTerm(value)) ? count + 1 : count
  ), 0);
}

function contentTypeLabel(data = {}, tags = [], lang = "fi") {
  const tagSet = new Set(toArray(tags));
  const type = data.type || "";
  if (data.mediaType === "video") return lang === "en" ? "Video" : "Video";
  if (data.mediaType === "podcast") return lang === "en" ? "Podcast" : "Podcast";
  if (data.mediaType === "radio") return lang === "en" ? "Radio" : "Radio";
  if (data.mediaType === "article") return lang === "en" ? "Media article" : "Lehtijuttu";
  if (type === "esitys" || tagSet.has("presentations")) return lang === "en" ? "Presentation" : "Esitys";
  if (type === "lausunto") return lang === "en" ? "Expert statement" : "Asiantuntijalausunto";
  if (type === "puhe") return lang === "en" ? "Speech" : "Puheenvuoro";
  if (type === "mielipide") return lang === "en" ? "Opinion" : "Mielipide";
  if (type === "kolumni") return lang === "en" ? "Column" : "Kolumni";
  if (tagSet.has("politics")) return lang === "en" ? "Initiative" : "Aloite";
  if (tagSet.has("blog")) return lang === "en" ? "Blog post" : "Blogikirjoitus";
  return lang === "en" ? "Text" : "Kirjoitus";
}

function archiveTerms(items, limit = 14, source = "both") {
  const labels = new Map();
  const counts = new Map();

  toArray(items).forEach((item) => {
    const terms = source === "categories"
      ? toArray(item.data?.categories)
      : source === "keywords"
        ? toArray(item.data?.keywords)
        : [...toArray(item.data?.categories), ...toArray(item.data?.keywords)];
    terms.forEach((term) => {
      const normalized = normalizeTerm(term);
      if (!normalized) return;
      labels.set(normalized, labels.get(normalized) || term);
      counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([normalized, count]) => ({
      name: labels.get(normalized) || normalized,
      count,
      weight: count >= 20 ? "xl" : count >= 10 ? "lg" : count >= 5 ? "md" : "sm"
    }))
    .filter((term) => term.count > 1)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fi"))
    .slice(0, Number(limit) || 14);
}

function buildImgFallback(src, alt, className = "") {
  return `<img src="${src}" alt="${alt}" class="${className}" loading="lazy" decoding="async">`;
}

module.exports = function registerFilters(eleventyConfig) {
  eleventyConfig.addFilter("toManualPub", function (items) {
    const item = Array.isArray(items) ? items[0] : items;
    if (!item) return {};
    const d = item.data || {};
    const dateStr = String(d.date || "");
    const pubName = d.publisher || d.publication || "";
    const collName = d.publicationCollection || "";
    const journalDisplay = collName && pubName ? `${collName} – ${pubName}` : (collName || pubName);
    return {
      title: d.title || "",
      year: dateStr.slice(0, 4) || "",
      authors: d.author || "Jari Laru",
      url: d.source_url || d.url || "",
      typeCode: d.publicationType || "",
      typeShort: d.publicationType || "",
      publisher: pubName,
      journal: journalDisplay
    };
  });

  eleventyConfig.addFilter("jsonSafe", function (value) {
    return JSON.stringify(value)
      .replace(/<\/script/gi, "<\\/script")
      .replace(/<!--/g, "<\\!--");
  });

  eleventyConfig.addFilter("inlineCSS", function (relativePath) {
    const fullPath = path.join(__dirname, "src/css", relativePath);
    try {
      return fs.readFileSync(fullPath, "utf-8");
    } catch (e) {
      console.warn(`[inlineCSS] Tiedostoa ei löydy: ${fullPath}`);
      return "";
    }
  });

  eleventyConfig.addFilter("toTimestamp", function (date) {
    return new Date(date).getTime() || 0;
  });

  eleventyConfig.addFilter("dateFormat", function (date) {
    const url = (this.page && this.page.url) || "";
    const locale = url.startsWith("/en/") ? "en-GB" : "fi-FI";
    return new Date(date).toLocaleDateString(locale, {
      day: "numeric", month: "long", year: "numeric"
    });
  });

  eleventyConfig.addFilter("dateYear", function (date) {
    return new Date(date).getFullYear();
  });

  eleventyConfig.addFilter("secondsToClock", function (value) {
    const total = Number(value || 0);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    return [hours, minutes, seconds]
      .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
      .join(":");
  });

  eleventyConfig.addFilter("excerpt", function (content) {
    if (!content) return "";
    const text = content.replace(/<[^>]+>/g, "");
    return text.substring(0, 200) + "...";
  });

  eleventyConfig.addFilter("slugify", function (str) {
    if (!str) return "";
    return str.toLowerCase()
      .replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  });

  eleventyConfig.addFilter("take", function (arr, n) {
    if (!arr) return [];
    return arr.slice(0, n);
  });

  eleventyConfig.addFilter("skip", function (arr, n) {
    if (!arr) return [];
    return arr.slice(n);
  });

  eleventyConfig.addFilter("relatedContent", function (collections, pageUrl, categories, keywords, tags, type, contextsOrLimit = [], maybeLimit = 4) {
    const wantedCategories = normalizeTerms(categories);
    const wantedKeywords = normalizeTerms(keywords);
    const wantedTags = normalizeTerms(tags);
    const wantedType = String(type || "");
    const wantedContexts = typeof contextsOrLimit === "number" ? new Set() : normalizeTerms(contextsOrLimit);
    const limit = typeof contextsOrLimit === "number" ? contextsOrLimit : maybeLimit;
    const lang = getLangFromUrl(pageUrl);

    if (!wantedCategories.size && !wantedKeywords.size && !wantedTags.size && !wantedContexts.size && !wantedType) return [];

    return uniqueContentItems(collections)
      .filter((item) => item.url !== pageUrl)
      .map((item) => {
        const data = item.data || {};
        const categoryScore = intersectionCount(data.categories, wantedCategories) * 5;
        const keywordScore = intersectionCount(data.keywords, wantedKeywords) * 3;
        const tagScore = intersectionCount(data.tags, wantedTags) * 2;
        const contextScore = intersectionCount(data.contexts, wantedContexts) * 4;
        const typeScore = wantedType && data.type === wantedType ? 2 : 0;
        const score = categoryScore + keywordScore + tagScore + contextScore + typeScore;
        return {
          url: item.url,
          title: data.title || "",
          description: data.description || "",
          date: item.date || data.date || null,
          typeLabel: contentTypeLabel(data, data.tags, lang),
          score
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.date || 0) - new Date(a.date || 0);
      })
      .slice(0, Number(limit) || 4);
  });

  eleventyConfig.addFilter("contentTermCloud", function (collections, categories, keywords, limit = 12) {
    const ownTerms = [...toArray(categories), ...toArray(keywords)];
    if (!ownTerms.length) return [];

    const frequencies = new Map();
    uniqueContentItems(collections).forEach((item) => {
      [...toArray(item.data?.categories), ...toArray(item.data?.keywords)].forEach((term) => {
        const normalized = normalizeTerm(term);
        if (!normalized) return;
        frequencies.set(normalized, (frequencies.get(normalized) || 0) + 1);
      });
    });

    const seen = new Set();
    return ownTerms
      .filter((term) => {
        const normalized = normalizeTerm(term);
        if (!normalized || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      })
      .map((term) => {
        const count = frequencies.get(normalizeTerm(term)) || 1;
        return {
          name: term,
          count,
          weight: count >= 20 ? "xl" : count >= 10 ? "lg" : count >= 5 ? "md" : "sm"
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fi"))
      .slice(0, Number(limit) || 12);
  });

  eleventyConfig.addFilter("archiveTermCloud", function (items, limit = 14, source = "both") {
    return archiveTerms(items, limit, source);
  });

  eleventyConfig.addFilter("filterByType", function (arr, type) {
    if (!arr) return [];
    return arr.filter(item => item.data.type === type);
  });

  eleventyConfig.addFilter("resolveContexts", function (data, inputPath = "") {
    return resolveContexts(data || {}, inputPath);
  });

  eleventyConfig.addFilter("contextLabel", function (context, lang = "fi") {
    return getContextMeta(context, lang).label;
  });

  eleventyConfig.addFilter("contextHref", function (context, lang = "fi") {
    return getContextMeta(context, lang).href;
  });

  eleventyConfig.addFilter("apa7authors", function (authors) {
    if (!Array.isArray(authors)) return "";
    const formattedAuthors = authors.map(name => {
      const commaIdx = name.indexOf(',');
      if (commaIdx === -1) return name;
      const last = name.slice(0, commaIdx).trim();
      const firsts = name.slice(commaIdx + 1).trim();
      const initials = firsts
        .split(/\s+/)
        .filter(Boolean)
        .map(part => part
          .split("-")
          .filter(Boolean)
          .map(w => `${w[0].toUpperCase()}.`)
          .join("-"))
        .join(" ");
      return `${last}, ${initials}`;
    }).filter(Boolean);
    if (formattedAuthors.length <= 1) return formattedAuthors.join("");
    return `${formattedAuthors.slice(0, -1).join(", ")}, & ${formattedAuthors[formattedAuthors.length - 1]}`;
  });

  eleventyConfig.addFilter("absoluteUrl", function (url, base) {
    if (!url) return base || "";
    if (/^https?:\/\//i.test(url)) return url;
    const normalizedBase = (base || "").replace(/\/+$/, "");
    const normalizedUrl = String(url).startsWith("/") ? url : `/${url}`;
    return `${normalizedBase}${normalizedUrl}`;
  });

  eleventyConfig.addFilter("langFromUrl", function (url) {
    return getLangFromUrl(url);
  });

  eleventyConfig.addFilter("localeForLang", function (lang) {
    return lang === "en" ? "en_US" : "fi_FI";
  });

  eleventyConfig.addFilter("switchLangUrl", function (url, targetLang) {
    const source = String(url || "/");
    if (targetLang === "en") {
      if (source === "/") return "/en/";
      if (source.startsWith("/en/")) return source;
      return `/en${source.startsWith("/") ? source : `/${source}`}`;
    }
    if (source === "/en/") return "/";
    if (source.startsWith("/en/")) {
      const fiUrl = source.replace(/^\/en/, "");
      return fiUrl || "/";
    }
    return source || "/";
  });

  eleventyConfig.addFilter("findTranslationUrl", function (items, translationKey, targetLang) {
    if (!translationKey || !Array.isArray(items)) return "";
    const match = items.find((item) => {
      if (!item || !item.data) return false;
      const itemLang = item.data.lang || getLangFromUrl(item.url);
      return item.data.translationKey === translationKey && itemLang === targetLang;
    });
    return match && match.url ? match.url : "";
  });

  eleventyConfig.addFilter("navItemByKey", function (items, key) {
    if (!Array.isArray(items) || !key) return null;
    return items.find((item) => item && item.key === key) || null;
  });

  eleventyConfig.addAsyncShortcode("optimizedImage", async function (src, alt, className = "", sizes = "100vw") {
    if (!src || !alt) return "";
    try {
      const sourcePath = src.startsWith("/")
        ? path.join(process.cwd(), "src", src.replace(/^\/+/, ""))
        : src;

      const metadata = await Image(sourcePath, {
        widths: [320, 640],
        formats: ["webp", "jpeg"],
        outputDir: path.join(process.cwd(), "_site", "img", "optimized"),
        urlPath: "/img/optimized/",
        filenameFormat: (id, originalSrc, width, format) => {
          const baseName = path.basename(originalSrc, path.extname(originalSrc));
          return `${baseName}-${id}-${width}w.${format}`;
        }
      });

      return Image.generateHTML(metadata, {
        alt,
        class: className,
        sizes,
        loading: "lazy",
        decoding: "async"
      });
    } catch (_) {
      return buildImgFallback(src, alt, className);
    }
  });
};

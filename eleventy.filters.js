const fs = require("fs");
const path = require("path");
const Image = require("@11ty/eleventy-img");

function getLangFromUrl(url) {
  return String(url || "").startsWith("/en/") ? "en" : "fi";
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
    return {
      title: d.title || "",
      year: dateStr.slice(0, 4) || "",
      authors: d.author || "Jari Laru",
      url: d.source_url || d.url || "",
      typeCode: d.publicationType || "",
      typeShort: d.publicationType || "",
      publisher: d.publisher || d.publication || "",
      journal: d.publicationCollection || ""
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

  eleventyConfig.addFilter("filterByType", function (arr, type) {
    if (!arr) return [];
    return arr.filter(item => item.data.type === type);
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

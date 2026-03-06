const pluginRss = require("@11ty/eleventy-plugin-rss");
const sitemap = require("@quasibit/eleventy-plugin-sitemap");
const fs = require("fs");
const path = require("path");
const EleventyPluginOgImage = require("eleventy-plugin-og-image");
const brokenLinksPlugin = require("eleventy-plugin-broken-links");
const SUPPORTED_LANGS = ["fi", "en"];

// Eleventy defaults EventBus max listeners to 100; larger sites exceed this without actual leaks.
try {
  const eleventyEventBus = require("@11ty/eleventy/src/EventBus");
  eleventyEventBus.setMaxListeners(1000);
} catch (_) {}

function getLangFromUrl(url) {
  return String(url || "").startsWith("/en/") ? "en" : "fi";
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addGlobalData("supportedLangs", SUPPORTED_LANGS);
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://www.jarilaru.fi",
    },
  });
  eleventyConfig.addPlugin(EleventyPluginOgImage, {
    generateHTML: (outputUrl) => outputUrl,
    satoriOptions: {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Inter",
          data: fs.readFileSync(
            path.join(
              __dirname,
              "node_modules",
              "@fontsource",
              "inter",
              "files",
              "inter-latin-ext-700-normal.woff"
            )
          ),
          weight: 700,
          style: "normal",
        },
        {
          name: "Inter",
          data: fs.readFileSync(
            path.join(
              __dirname,
              "node_modules",
              "@fontsource",
              "inter",
              "files",
              "inter-latin-ext-400-normal.woff"
            )
          ),
          weight: 400,
          style: "normal",
        },
      ],
    },
  });
  eleventyConfig.addPlugin(brokenLinksPlugin, {
    broken: "warn",
    redirect: "warn",
    forbidden: "warn",
    loggingLevel: 2,
  });

  // Kopioi staattiset tiedostot
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("admin");

  // =====================
  // KOKOELMAT
  // =====================

  // Blogipostaukset (uusin ensin)
  eleventyConfig.addCollection("blog", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/blog/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // Julkaisut — kaikki (uusin ensin)
  eleventyConfig.addCollection("publications", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/publications/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // Julkaisut tyypeittäin
  ["mielipide", "kolumni", "puhe", "tieteellinen", "esitelma"].forEach(type => {
    eleventyConfig.addCollection(`pub_${type}`, function (collectionApi) {
      return collectionApi
        .getFilteredByGlob("src/publications/*.md")
        .filter(item => item.data.type === type)
        .sort((a, b) => b.date - a.date);
    });
  });

  // Aloitteet (uusin ensin)
  eleventyConfig.addCollection("politics", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/politics/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // Koulutukset ja materiaalit
  eleventyConfig.addCollection("training", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/training/*.md")
      .sort((a, b) => {
        const orderA = a.data.order || 999;
        const orderB = b.data.order || 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.data.title.localeCompare(b.data.title, "fi");
      });
  });

  // Portfolio
  eleventyConfig.addCollection("portfolio", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/portfolio/*.md")
      .sort((a, b) => {
        const yearA = a.data.year || 0;
        const yearB = b.data.year || 0;
        return yearB - yearA;
      });
  });

  // Uusi kokoelma tickerille: Politiikka ja mielipiteet
  eleventyConfig.addCollection("politicsAndOpinions", function (collectionApi) {
    const items = [
      ...collectionApi.getFilteredByGlob("src/politics/*.md"),
      ...collectionApi.getFilteredByGlob("src/publications/*.md").filter(item => item.data.type === "mielipide")
    ];
    return items.sort((a, b) => b.date - a.date);
  });

  // Uusi kokoelma tickerille: Esitykset
  eleventyConfig.addCollection("presentations", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/presentations/*.md").sort((a, b) => b.date - a.date);
  });

  // =====================
  // KATEGORIAT & AVAINSANAT
  // =====================
  function buildTermList(items, key) {
    const map = new Map();
    items.forEach(item => {
      const terms = item.data && item.data[key];
      if (!Array.isArray(terms)) return;
      terms.forEach(term => {
        if (!term) return;
        const name = String(term).trim();
        if (!name) return;
        if (!map.has(name)) {
          map.set(name, []);
        }
        map.get(name).push(item);
      });
    });
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      slug: eleventyConfig.getFilter("slugify")(name),
      items,
      count: items.length
    })).sort((a, b) => a.name.localeCompare(b.name, "fi"));
  }

  eleventyConfig.addCollection("categoryList", function (collectionApi) {
    const items = [
      ...collectionApi.getFilteredByGlob("src/blog/*.md"),
      ...collectionApi.getFilteredByGlob("src/publications/*.md"),
      ...collectionApi.getFilteredByGlob("src/politics/*.md")
    ];
    return buildTermList(items, "categories");
  });

  eleventyConfig.addCollection("keywordList", function (collectionApi) {
    const items = [
      ...collectionApi.getFilteredByGlob("src/blog/*.md"),
      ...collectionApi.getFilteredByGlob("src/publications/*.md"),
      ...collectionApi.getFilteredByGlob("src/politics/*.md")
    ];
    return buildTermList(items, "keywords");
  });

  // =====================
  // SUODATTIMET
  // =====================

  // Päivämäärä (suomalainen)
  eleventyConfig.addFilter("dateFormat", function (date) {
    return new Date(date).toLocaleDateString("fi-FI", {
      day: "numeric", month: "long", year: "numeric"
    });
  });

  // Vuosiluku
  eleventyConfig.addFilter("dateYear", function (date) {
    return new Date(date).getFullYear();
  });

  // Tiivistelmä
  eleventyConfig.addFilter("excerpt", function (content) {
    if (!content) return "";
    const text = content.replace(/<[^>]+>/g, "");
    return text.substring(0, 200) + "...";
  });

  // Slugify (suomenkieliset merkit)
  eleventyConfig.addFilter("slugify", function (str) {
    if (!str) return "";
    return str.toLowerCase()
      .replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  });

  // Ota N ensimmäistä
  eleventyConfig.addFilter("take", function (arr, n) {
    if (!arr) return [];
    return arr.slice(0, n);
  });

  // Ohita N ensimmäistä
  eleventyConfig.addFilter("skip", function (arr, n) {
    if (!arr) return [];
    return arr.slice(n);
  });

  // Suodata tyypin mukaan
  eleventyConfig.addFilter("filterByType", function (arr, type) {
    if (!arr) return [];
    return arr.filter(item => item.data.type === type);
  });

  // Muunna suhteellinen polku absoluuttiseksi URL:ksi
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

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: false
  };
};

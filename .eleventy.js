const { default: pluginRss, feedPlugin } = require("@11ty/eleventy-plugin-rss");
const pluginNavigation = require("@11ty/eleventy-navigation");
const pluginToc = require("eleventy-plugin-toc");
const markdownItAnchor = require("markdown-it-anchor");
const fs = require("fs");
const path = require("path");
const Image = require("@11ty/eleventy-img");
const { default: EleventyPluginOgImage } = require("eleventy-plugin-og-image");
const brokenLinksPlugin = require("eleventy-plugin-broken-links");
const SUPPORTED_LANGS = ["fi", "en"];
const shouldCheckExternalLinks = process.env.CHECK_EXTERNAL_LINKS === "true";
const shouldGenerateOgImages = process.env.DISABLE_OG_IMAGES !== "true";
const SITE_ORIGIN = "https://www.jarilaru.fi";
const LINK_REDIRECT_ALLOWLIST = [
  /^https?:\/\/(dx\.)?doi\.org\/.+/i
];


function getLangFromUrl(url) {
  return String(url || "").startsWith("/en/") ? "en" : "fi";
}

function getProviderFromHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  if (host.includes("facebook.com")) return "facebook";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("slideshare.net")) return "slideshare";
  if (host.includes("scribd.com")) return "scribd";
  if (host.includes("google.com")) return "google";
  if (host.includes("vimeo.com")) return "vimeo";
  return "external";
}

function shouldWrapIframeSrc(src) {
  if (!src || String(src).startsWith("data:")) return false;
  try {
    const resolved = new URL(src, SITE_ORIGIN);
    if (!/^https?:$/i.test(resolved.protocol)) return false;
    const siteOrigin = new URL(SITE_ORIGIN).origin;
    return resolved.origin !== siteOrigin;
  } catch (_) {
    return false;
  }
}

function wrapExternalIframes(content) {
  if (!content || !content.includes("<iframe")) return content;

  return content.replace(/<iframe\b[\s\S]*?<\/iframe>/gi, (iframeHtml) => {
    if (iframeHtml.includes("data-consent-src=") || iframeHtml.includes("data-external-media-managed")) {
      return iframeHtml;
    }

    const srcMatch = iframeHtml.match(/\ssrc\s*=\s*("([^"]*)"|'([^']*)')/i);
    const srcValue = srcMatch ? (srcMatch[2] || srcMatch[3] || "") : "";
    if (!shouldWrapIframeSrc(srcValue)) return iframeHtml;

    let resolved;
    try {
      resolved = new URL(srcValue, SITE_ORIGIN);
    } catch (_) {
      return iframeHtml;
    }
    const provider = getProviderFromHost(resolved.hostname);

    const iframeNoSrc = iframeHtml.replace(/\ssrc\s*=\s*("([^"]*)"|'([^']*)')/i, "");
    const iframeManaged = iframeNoSrc.replace(
      /<iframe\b/i,
      `<iframe data-consent-src="${srcValue.replace(/"/g, "&quot;")}" data-external-media-managed="true" class="external-media-consent__iframe" hidden`
    );

    return [
      `<div class="external-media-consent" data-external-media-provider="${provider}">`,
      `<div class="external-media-consent__notice" data-external-media-notice>`,
      `<p class="external-media-consent__text" data-external-media-text></p>`,
      `<div class="external-media-consent__actions">`,
      `<button type="button" class="btn btn-primary btn-sm" data-external-media-load></button>`,
      `<button type="button" class="btn btn-outline-secondary btn-sm" data-external-media-allow-all></button>`,
      `</div>`,
      `</div>`,
      iframeManaged,
      `</div>`
    ].join("");
  });
}

function walkHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(fullPath, files);
    } else if (entry.isFile() && fullPath.endsWith(".html")) {
      files.push(fullPath);
    }
  });
  return files;
}

function buildImgFallback(src, alt, className = "") {
  return `<img src="${src}" alt="${alt}" class="${className}" loading="lazy" decoding="async">`;
}

function serializeExternalLink(link) {
  return {
    url: link.url,
    statusCode: link.getHttpStatusCode(),
    count: link.getLinkCount(),
    pages: link.getPages()
  };
}

function isAllowedRedirect(url) {
  return LINK_REDIRECT_ALLOWLIST.some((pattern) => pattern.test(String(url || "")));
}

function writeExternalLinkReport({ brokenLinks, forbiddenLinks, redirectLinks, allowedRedirects }) {
  const report = {
    generatedAt: new Date().toISOString(),
    allowlistedRedirectPatterns: LINK_REDIRECT_ALLOWLIST.map((pattern) => pattern.toString()),
    summary: {
      broken: brokenLinks.length,
      forbidden: forbiddenLinks.length,
      redirects: {
        unexpected: redirectLinks.length,
        allowlisted: allowedRedirects.length
      }
    },
    brokenLinks,
    forbiddenLinks,
    unexpectedRedirects: redirectLinks,
    allowlistedRedirects: allowedRedirects
  };

  const reportDir = path.join(process.cwd(), "_site", "reports");
  const reportPath = path.join(reportDir, "external-links-report.json");
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`[plugin-broken-links] External link report written: ${reportPath}`);
}

module.exports = function (eleventyConfig) {
  // Add heading IDs to markdown output so TOC links can target headings.
  eleventyConfig.amendLibrary("md", (mdLib) => {
    mdLib.use(markdownItAnchor, {
      level: [2, 3, 4]
    });

    const defaultImageRenderer =
      mdLib.renderer.rules.image ||
      function (tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
      };

    mdLib.renderer.rules.image = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      if (!token.attrGet("loading")) token.attrSet("loading", "lazy");
      if (!token.attrGet("decoding")) token.attrSet("decoding", "async");
      return defaultImageRenderer(tokens, idx, options, env, self);
    };
  });

  // Avoid intermittent Eleventy v2 watch crashes in large sites:
  // "Watching requires `.getFiles()` to be called first in EleventyFiles"
  // This disables JS dependency graph watching, but normal file watching remains.
  eleventyConfig.setWatchJavaScriptDependencies(false);

  // Pre-clean OG image output robustly before og-image plugin runs.
  // This avoids occasional ENOTEMPTY failures on some filesystems.
  eleventyConfig.on("eleventy.before", () => {
    const ogOutputDir = path.join(process.cwd(), "_site", "og-images");
    try {
      fs.rmSync(ogOutputDir, {
        recursive: true,
        force: true,
        maxRetries: 10,
        retryDelay: 100
      });
    } catch (_) {
      // Keep build running; plugin's own cleanup will still run afterwards.
    }
  });

  // Ensure all generated HTML pages have external iframe consent wrappers.
  eleventyConfig.on("eleventy.after", () => {
    const outputDir = path.join(process.cwd(), "_site");
    const htmlFiles = walkHtmlFiles(outputDir);
    htmlFiles.forEach((filePath) => {
      const original = fs.readFileSync(filePath, "utf8");
      const updated = wrapExternalIframes(original);
      if (updated !== original) {
        fs.writeFileSync(filePath, updated, "utf8");
      }
    });
  });

  eleventyConfig.addGlobalData("supportedLangs", SUPPORTED_LANGS);
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom",
    outputPath: "/feed.xml",
    collection: {
      name: "blog",
      limit: 10,
    },
    metadata: {
      language: "fi",
      title: "Jari Laru",
      subtitle: "Koulutusteknologian asiantuntija. Yliopistonlehtori. Kaupunginvaltuutettu.",
      base: "https://www.jarilaru.fi/",
      author: {
        name: "Jari Laru",
      },
    },
  });
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(pluginToc);
  if (shouldGenerateOgImages) {
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
  } else {
    // Keep templates compilable when OG generation is disabled.
    eleventyConfig.addAsyncShortcode("ogImage", async () => null);
  }
  // External link checks are network-dependent and noisy in local/offline runs.
  // Enable explicitly (e.g. CI): CHECK_EXTERNAL_LINKS=true npx @11ty/eleventy
  if (shouldCheckExternalLinks) {
    eleventyConfig.addPlugin(brokenLinksPlugin, {
      broken: "warn",
      redirect: "warn",
      forbidden: "warn",
      // Redirects are reported via callback to allow DOI redirect allowlisting.
      loggingLevel: 1,
      callback: (brokenLinks = [], redirectLinks = [], forbiddenLinks = []) => {
        const serializedBroken = brokenLinks.map(serializeExternalLink);
        const serializedForbidden = forbiddenLinks.map(serializeExternalLink);
        const serializedRedirects = redirectLinks.map(serializeExternalLink);
        const allowlistedRedirects = serializedRedirects.filter((link) => isAllowedRedirect(link.url));
        const unexpectedRedirects = serializedRedirects.filter((link) => !isAllowedRedirect(link.url));

        writeExternalLinkReport({
          brokenLinks: serializedBroken,
          forbiddenLinks: serializedForbidden,
          redirectLinks: unexpectedRedirects,
          allowedRedirects: allowlistedRedirects
        });
      }
    });
  }

  // Kopioi staattiset tiedostot
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
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

  // EN-blogiposts feedipluginille (suodatetaan lang: en -merkityt)
  eleventyConfig.addCollection("blogEn", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/blog/*.md")
      .filter(item => item.data.lang === "en")
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

  // Lukee CSS-tiedoston sisällön build-aikana (kriittistä CSS:ää varten)
  eleventyConfig.addFilter("inlineCSS", function (relativePath) {
    const fullPath = path.join(__dirname, "src/css", relativePath);
    try {
      return fs.readFileSync(fullPath, "utf-8");
    } catch (e) {
      console.warn(`[inlineCSS] Tiedostoa ei löydy: ${fullPath}`);
      return "";
    }
  });

  // Muuntaa päivämäärän Unix-aikaleimaksi (lajittelua varten)
  eleventyConfig.addFilter("toTimestamp", function (date) {
    return new Date(date).getTime() || 0;
  });

  // Päivämäärä — kieliriippuvainen (fi-FI tai en-GB sivun URL:n perusteella)
  eleventyConfig.addFilter("dateFormat", function (date) {
    const url = (this.page && this.page.url) || "";
    const locale = url.startsWith("/en/") ? "en-GB" : "fi-FI";
    return new Date(date).toLocaleDateString(locale, {
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

  // Wrap third-party media iframes with a consent gate to avoid loading external
  // trackers/cookies before user action.
  eleventyConfig.addTransform("externalMediaConsent", (content, outputPath) => {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    return wrapExternalIframes(content);
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

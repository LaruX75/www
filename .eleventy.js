const { default: pluginRss, feedPlugin } = require("@11ty/eleventy-plugin-rss");
const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const pluginNavigation = require("@11ty/eleventy-navigation");
const pluginToc = require("eleventy-plugin-toc");
const markdownItAnchor = require("markdown-it-anchor");
const fs = require("fs");
const path = require("path");
const { default: EleventyPluginOgImage } = require("eleventy-plugin-og-image");
const brokenLinksPlugin = require("eleventy-plugin-broken-links");
const registerCollections = require("./eleventy.collections.js");
const registerFilters = require("./eleventy.filters.js");

const SUPPORTED_LANGS = ["fi", "en"];
const shouldCheckExternalLinks = process.env.CHECK_EXTERNAL_LINKS === "true";
const shouldGenerateOgImages = process.env.DISABLE_OG_IMAGES !== "true";
const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://www.jarilaru.fi";
const LINK_REDIRECT_ALLOWLIST = [
  /^https?:\/\/(dx\.)?doi\.org\/.+/i
];

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
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);
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

  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("src/.well-known");
  eleventyConfig.addPassthroughCopy("src/_headers");
  eleventyConfig.addPassthroughCopy("src/_redirects");
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("admin");

  registerFilters(eleventyConfig);
  registerCollections(eleventyConfig);

  eleventyConfig.addTransform("externalMediaConsent", (content, outputPath) => {
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    return wrapExternalIframes(content);
  });

  return {
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/",
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["njk", "md", "html", "11ty.js"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: false
  };
};

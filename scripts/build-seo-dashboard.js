#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const projectRoot = process.cwd();
const siteRoot = path.join(projectRoot, "_site");
const apiDir = path.join(siteRoot, "api");
const outputPath = path.join(apiDir, "seo-dashboard.json");
const siteOrigin = (process.env.SITE_URL || "https://www.jarilaru.fi").replace(/\/+$/, "");
const seoTextLimits = {
  titleMin: 25,
  titleMax: 65,
  descriptionMin: 80,
  descriptionMax: 170
};

function walkHtmlFiles(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkHtmlFiles(full, list);
    } else if (entry.isFile() && full.endsWith(".html")) {
      list.push(full);
    }
  }
  return list;
}

function filePathToUrlPath(filePath) {
  const rel = path.relative(siteRoot, filePath).replace(/\\/g, "/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"index.html".length)}`;
  if (rel.endsWith(".html")) return `/${rel.slice(0, -".html".length)}`;
  return `/${rel}`;
}

function textOrEmpty(value) {
  return String(value || "").trim();
}

function isValidMetaValue(value) {
  const normalized = textOrEmpty(value).toLowerCase();
  if (!normalized) return false;
  if (normalized === "null") return false;
  if (normalized.endsWith("/null")) return false;
  return true;
}

function isAbsoluteHttpUrl(value) {
  const normalized = textOrEmpty(value);
  if (!normalized) return false;
  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function normalizeLocalPath(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.startsWith("mailto:") || raw.startsWith("tel:")) return null;
  if (raw.startsWith(siteOrigin)) {
    return normalizeLocalPath(raw.slice(siteOrigin.length));
  }
  if (!raw.startsWith("/")) return null;
  return raw.split("#")[0].split("?")[0] || "/";
}

function urlPathVariants(urlPath) {
  if (!urlPath) return [];
  const raw = urlPath === "/" ? "/" : urlPath.replace(/\/+$/, "");
  const variants = [raw];
  try {
    const decoded = decodeURIComponent(raw);
    if (!variants.includes(decoded)) {
      variants.push(decoded);
    }
  } catch (_) {}
  return variants;
}

function urlPathToOutputCandidates(urlPath) {
  const variants = urlPathVariants(urlPath);
  const candidates = [];

  for (const variant of variants) {
    if (variant === "/") {
      candidates.push(path.join(siteRoot, "index.html"));
      continue;
    }
    const relative = variant.replace(/^\/+/, "");
    candidates.push(
      path.join(siteRoot, relative, "index.html"),
      path.join(siteRoot, relative),
      path.join(siteRoot, `${relative}.html`)
    );
  }

  return [...new Set(candidates)];
}

function extractSitemapMetrics() {
  const sitemapPath = path.join(siteRoot, "sitemap.xml");
  const robotsPath = path.join(siteRoot, "robots.txt");
  const report = {
    sitemapExists: fs.existsSync(sitemapPath),
    robotsExists: fs.existsSync(robotsPath),
    robotsContainsSitemap: false,
    sitemapUrlCount: 0,
    sitemapLastmodCount: 0,
    missingOutputFiles: 0,
    missingOutputExamples: []
  };

  if (report.sitemapExists) {
    const xml = fs.readFileSync(sitemapPath, "utf8");
    const locs = Array.from(xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)).map((match) => textOrEmpty(match[1]));
    const lastmods = Array.from(xml.matchAll(/<lastmod>([\s\S]*?)<\/lastmod>/g)).map((match) => textOrEmpty(match[1]));
    report.sitemapUrlCount = locs.length;
    report.sitemapLastmodCount = lastmods.length;

    for (const loc of locs) {
      const localPath = normalizeLocalPath(loc);
      if (!localPath) continue;
      const exists = urlPathToOutputCandidates(localPath).some((candidate) => fs.existsSync(candidate));
      if (!exists) {
        report.missingOutputFiles += 1;
        if (report.missingOutputExamples.length < 5) {
          report.missingOutputExamples.push(localPath);
        }
      }
    }
  }

  if (report.robotsExists) {
    const robots = fs.readFileSync(robotsPath, "utf8");
    report.robotsContainsSitemap = robots.includes(`Sitemap: ${siteOrigin}/sitemap.xml`);
  }

  return report;
}

function collectPageData() {
  const htmlFiles = walkHtmlFiles(siteRoot).filter((filePath) => !filePath.includes(`${path.sep}pagefind${path.sep}`));
  const pages = [];
  const pathSet = new Set();
  let hreflangIssues = 0;
  let structuredDataBlockCount = 0;
  let structuredDataInvalidCount = 0;
  const hreflangExamples = [];
  const structuredDataInvalidExamples = [];

  for (const filePath of htmlFiles) {
    const html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html);
    const urlPath = filePathToUrlPath(filePath);
    pathSet.add(urlPath);

    const title = textOrEmpty($("title").first().text());
    const description = textOrEmpty($('meta[name="description"]').attr("content"));
    const canonical = textOrEmpty($('link[rel="canonical"]').attr("href"));
    const robots = textOrEmpty($('meta[name="robots"]').attr("content"));
    const ogImage = textOrEmpty($('meta[property="og:image"]').attr("content"));
    const h1 = textOrEmpty($("h1").first().text());
    const hreflangs = {};
    const structuredDataTypes = [];

    $('script[type="application/ld+json"]').each((_, el) => {
      structuredDataBlockCount += 1;
      const rawJson = textOrEmpty($(el).text());
      try {
        const parsed = JSON.parse(rawJson);
        const entries = Array.isArray(parsed) ? parsed : [parsed];
        for (const entry of entries) {
          if (entry && entry["@type"]) {
            structuredDataTypes.push(entry["@type"]);
          }
        }
      } catch (error) {
        structuredDataInvalidCount += 1;
        if (structuredDataInvalidExamples.length < 8) {
          structuredDataInvalidExamples.push({ page: urlPath, message: error.message });
        }
      }
    });

    $('link[rel="alternate"][hreflang]').each((_, el) => {
      const lang = textOrEmpty($(el).attr("hreflang"));
      const href = textOrEmpty($(el).attr("href"));
      if (lang) {
        hreflangs[lang] = href;
        const normalized = normalizeLocalPath(href);
        if (normalized) {
          const exists = urlPathToOutputCandidates(normalized).some((candidate) => fs.existsSync(candidate));
          if (!exists) {
            hreflangIssues += 1;
            if (hreflangExamples.length < 8) {
              hreflangExamples.push({ page: urlPath, hreflang: lang, target: normalized });
            }
          }
        }
      }
    });

    pages.push({
      path: urlPath,
      title,
      description,
      canonical,
      robots,
      ogImage,
      h1,
      hasH1: Boolean(h1),
      hasDescription: Boolean(description),
      titleLength: title.length,
      descriptionLength: description.length,
      hasCanonical: Boolean(canonical),
      canonicalIsAbsolute: isAbsoluteHttpUrl(canonical),
      hasOgImage: isValidMetaValue(ogImage),
      isNoindex: robots.toLowerCase().includes("noindex"),
      structuredDataTypes,
      hreflangs
    });
  }

  return {
    pages: pages.sort((a, b) => a.path.localeCompare(b.path, "fi")),
    pathSet,
    hreflangIssues,
    hreflangExamples,
    structuredDataBlockCount,
    structuredDataInvalidCount,
    structuredDataInvalidExamples
  };
}

function buildSummary(pages) {
  const indexablePages = pages.filter((page) => !page.isNoindex);
  const missingDescription = indexablePages.filter((page) => !page.hasDescription);
  const missingCanonical = indexablePages.filter((page) => !page.hasCanonical);
  const relativeCanonical = pages.filter((page) => page.hasCanonical && !page.canonicalIsAbsolute);
  const indexableRelativeCanonical = indexablePages.filter((page) => page.hasCanonical && !page.canonicalIsAbsolute);
  const missingOgImage = indexablePages.filter((page) => !page.hasOgImage);
  const missingH1 = indexablePages.filter((page) => !page.hasH1);
  const shortTitle = indexablePages.filter((page) => page.titleLength > 0 && page.titleLength < seoTextLimits.titleMin);
  const longTitle = indexablePages.filter((page) => page.titleLength > seoTextLimits.titleMax);
  const shortDescription = indexablePages.filter(
    (page) => page.descriptionLength > 0 && page.descriptionLength < seoTextLimits.descriptionMin
  );
  const longDescription = indexablePages.filter((page) => page.descriptionLength > seoTextLimits.descriptionMax);
  const textExample = (page) => `${page.path} (${page.titleLength}/${page.descriptionLength})`;

  return {
    pageCount: pages.length,
    indexableCount: indexablePages.length,
    noindexCount: pages.length - indexablePages.length,
    missingDescriptionCount: missingDescription.length,
    missingCanonicalCount: missingCanonical.length,
    relativeCanonicalCount: relativeCanonical.length,
    indexableRelativeCanonicalCount: indexableRelativeCanonical.length,
    missingOgImageCount: missingOgImage.length,
    missingH1Count: missingH1.length,
    shortTitleCount: shortTitle.length,
    longTitleCount: longTitle.length,
    shortDescriptionCount: shortDescription.length,
    longDescriptionCount: longDescription.length,
    seoTextLimits,
    examples: {
      missingDescription: missingDescription.slice(0, 8).map((page) => page.path),
      missingCanonical: missingCanonical.slice(0, 8).map((page) => page.path),
      relativeCanonical: relativeCanonical.slice(0, 8).map((page) => page.path),
      indexableRelativeCanonical: indexableRelativeCanonical.slice(0, 8).map((page) => page.path),
      missingOgImage: missingOgImage.slice(0, 8).map((page) => page.path),
      missingH1: missingH1.slice(0, 8).map((page) => page.path),
      shortTitle: shortTitle.slice(0, 8).map(textExample),
      longTitle: longTitle.slice(0, 8).map(textExample),
      shortDescription: shortDescription.slice(0, 8).map(textExample),
      longDescription: longDescription.slice(0, 8).map(textExample)
    }
  };
}

function main() {
  if (!fs.existsSync(siteRoot)) {
    console.error("[seo-dashboard] _site directory not found. Build the site first.");
    process.exit(1);
  }

  const sitemap = extractSitemapMetrics();
  const {
    pages,
    hreflangIssues,
    hreflangExamples,
    structuredDataBlockCount,
    structuredDataInvalidCount,
    structuredDataInvalidExamples
  } = collectPageData();
  const summary = buildSummary(pages);

  const payload = {
    generatedAt: new Date().toISOString(),
    siteOrigin,
    ogBuildEnabled: process.env.DISABLE_OG_IMAGES !== "true",
    summary,
    checks: {
      sitemap,
      hreflang: {
        issueCount: hreflangIssues,
        examples: hreflangExamples
      },
      structuredData: {
        blockCount: structuredDataBlockCount,
        invalidCount: structuredDataInvalidCount,
        examples: structuredDataInvalidExamples
      }
    },
    pages
  };

  fs.mkdirSync(apiDir, { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(
    `[seo-dashboard] OK | pages=${summary.pageCount} missingDescription=${summary.missingDescriptionCount} missingOgImage=${summary.missingOgImageCount} output=${outputPath}`
  );
}

main();

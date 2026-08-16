#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const ROOT = process.cwd();
const SITE_ROOT = path.join(ROOT, "_site");
const DATA_PATH = path.join(
  ROOT,
  "docs",
  "data",
  "seo2-social-sharing-metadata-audit-2026-08-16.json"
);
const SITE_ORIGIN = "https://www.jarilaru.fi";
const siteData = JSON.parse(fs.readFileSync(path.join(ROOT, "src", "_data", "site.json"), "utf8"));

const PAGE_SPECS = [
  {
    key: "home",
    url: "/",
    file: "index.html",
    lang: "fi",
    expectGeneratedImage: true,
    expectPageSpecificImage: false,
    expectArticleMeta: false,
    expectedAltLanguage: "fi",
    expectedLocales: ["fi_FI"],
    expectedHreflangs: ["fi", "en", "x-default"]
  },
  {
    key: "research",
    url: "/tutkimus/",
    file: path.join("tutkimus", "index.html"),
    lang: "fi",
    expectGeneratedImage: true,
    expectPageSpecificImage: false,
    expectArticleMeta: false,
    expectedAltLanguage: "fi",
    expectedLocales: ["fi_FI"],
    expectedHreflangs: ["fi", "en", "x-default"]
  },
  {
    key: "publication",
    url: "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/",
    file: path.join("julkaisut", "rf-a1-10-1016-j-caeo-2026-100396", "index.html"),
    lang: "fi",
    expectGeneratedImage: true,
    expectPageSpecificImage: false,
    expectArticleMeta: true,
    expectedAltLanguage: "fi",
    expectedLocales: ["fi_FI"],
    expectedHreflangs: ["x-default"]
  },
  {
    key: "thesis",
    url: "/opinnaytteet/7327/",
    file: path.join("opinnaytteet", "7327", "index.html"),
    lang: "fi",
    expectGeneratedImage: true,
    expectPageSpecificImage: false,
    expectArticleMeta: true,
    expectedAltLanguage: "fi",
    expectedLocales: ["fi_FI"],
    expectedHreflangs: ["x-default"]
  },
  {
    key: "writing",
    url: "/2024/10/29/tiedolla-johtaminen-tarvitsee-yhteiset-nakymat/",
    file: path.join("2024", "10", "29", "tiedolla-johtaminen-tarvitsee-yhteiset-nakymat", "index.html"),
    lang: "fi",
    expectedImagePath: "/img/uploads/2024/10/tiedolla-johtaminen-kaupungin-vakiluku-bi.jpg",
    expectGeneratedImage: false,
    expectPageSpecificImage: true,
    expectArticleMeta: true,
    expectedAltLanguage: "fi",
    expectedLocales: ["fi_FI"],
    expectedHreflangs: ["x-default"]
  },
  {
    key: "presentation",
    url: "/presentations/ss-the-role-and-importance-of-social-media-in-science/",
    file: path.join("presentations", "ss-the-role-and-importance-of-social-media-in-science", "index.html"),
    lang: "en",
    expectedImageContains: "cdn.slidesharecdn.com/ss_thumbnails/someuniogs2014",
    expectGeneratedImage: false,
    expectPageSpecificImage: true,
    expectArticleMeta: true,
    expectedAltLanguage: "en",
    expectedLocales: ["en_US"],
    expectedHreflangs: ["x-default"]
  },
  {
    key: "media",
    url: "/mediassa/2023/11/13/munoulu-tekoaly-valtaa-alaa-luova-luokka-mediakasvatusseminaari/",
    file: path.join("mediassa", "2023", "11", "13", "munoulu-tekoaly-valtaa-alaa-luova-luokka-mediakasvatusseminaari", "index.html"),
    lang: "fi",
    expectedImagePath: "https://www.munoulu.fi/app/uploads/sites/20/2023/11/tekoaly-1600x899.jpg",
    expectGeneratedImage: false,
    expectPageSpecificImage: true,
    expectArticleMeta: true,
    expectedAltLanguage: "fi",
    expectedLocales: ["fi_FI"],
    expectedHreflangs: ["x-default"]
  },
  {
    key: "englishResearch",
    url: "/en/research/",
    file: path.join("en", "research", "index.html"),
    lang: "en",
    expectGeneratedImage: true,
    expectPageSpecificImage: false,
    expectArticleMeta: false,
    expectedAltLanguage: "en",
    expectedLocales: ["en_US"],
    expectedHreflangs: ["fi", "en", "x-default"]
  }
];

const FORBIDDEN_CHANGED_PATHS = [
  "src/js/find-explore.js",
  "src/css/find-explore.css",
  "src/js/starter-chips.js",
  "src/css/starter-chips.css",
  "src/js/content-engine.js",
  "src/js/content-presets.js",
  "scripts/audit-media-pagefind-m2.js",
  "scripts/audit-presentation-pagefind.js"
];
const FORBIDDEN_CHANGED_PREFIXES = ["scripts/audit-pf", "scripts/audit-f4"];

function parseAttrs(fragment = "") {
  const attrs = {};
  const attrRegex = /([:@A-Za-z0-9_-]+)\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = attrRegex.exec(fragment)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function collectTags(html = "", tagName = "") {
  const regex = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
  return [...html.matchAll(regex)].map((match) => parseAttrs(match[0]));
}

function decodeEntities(value = "") {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractTitle(html = "") {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return decodeEntities(match ? match[1].trim() : "");
}

function metaValue(html = "", attrName = "", attrValue = "") {
  return collectTags(html, "meta")
    .find((attrs) => attrs[attrName] === attrValue)?.content || "";
}

function linkValues(html = "", relValue = "") {
  return collectTags(html, "link").filter((attrs) => attrs.rel === relValue);
}

function hasAll(values = [], expected = []) {
  const set = new Set(values);
  return expected.every((value) => set.has(value));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function readHtml(file) {
  return fs.readFileSync(path.join(SITE_ROOT, file), "utf8");
}

function changedFiles() {
  return childProcess
    .execFileSync("git", ["diff", "--name-only"], { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function checkSpec(spec) {
  const html = readHtml(spec.file);
  const title = extractTitle(html);
  const description = metaValue(html, "name", "description");
  const canonical = linkValues(html, "canonical")[0]?.href || "";
  const ogTitle = metaValue(html, "property", "og:title");
  const ogDescription = metaValue(html, "property", "og:description");
  const ogImage = metaValue(html, "property", "og:image");
  const ogImageAlt = metaValue(html, "property", "og:image:alt");
  const ogUrl = metaValue(html, "property", "og:url");
  const ogLocale = metaValue(html, "property", "og:locale");
  const twitterCard = metaValue(html, "name", "twitter:card");
  const twitterTitle = metaValue(html, "name", "twitter:title");
  const twitterDescription = metaValue(html, "name", "twitter:description");
  const twitterImage = metaValue(html, "name", "twitter:image");
  const twitterImageAlt = metaValue(html, "name", "twitter:image:alt");
  const articlePublished = metaValue(html, "property", "article:published_time");
  const articleModified = metaValue(html, "property", "article:modified_time");
  const hreflangs = linkValues(html, "alternate").map((attrs) => attrs.hreflang).filter(Boolean);

  const checks = {
    title: Boolean(title),
    description: Boolean(description),
    canonical: canonical === `${SITE_ORIGIN}${spec.url}`,
    ogTitle: Boolean(ogTitle),
    ogDescription: Boolean(ogDescription),
    ogImage: Boolean(ogImage),
    ogImageAlt: Boolean(ogImageAlt),
    ogUrl: ogUrl === `${SITE_ORIGIN}${spec.url}`,
    ogLocale: spec.expectedLocales.includes(ogLocale),
    twitterCard: twitterCard === "summary_large_image",
    twitterTitle: twitterTitle === ogTitle,
    twitterDescription: twitterDescription === ogDescription,
    twitterImage: twitterImage === ogImage,
    twitterImageAlt: twitterImageAlt === ogImageAlt,
    hreflang: hasAll(hreflangs, spec.expectedHreflangs),
    noDataPagefindBody: !/data-pagefind-body\b/i.test(html),
    articleMeta: spec.expectArticleMeta
      ? Boolean(articlePublished && articleModified)
      : !(articlePublished || articleModified)
  };

  const imageChecks = {
    generatedImage: spec.expectGeneratedImage ? /\/og-images\/.+\.(png|jpg|jpeg)$/i.test(ogImage) : !/\/og-images\/.+\.(png|jpg|jpeg)$/i.test(ogImage),
    expectedImagePath: spec.expectedImagePath ? ogImage === `${SITE_ORIGIN}${spec.expectedImagePath}` || ogImage === spec.expectedImagePath : true,
    expectedImageContains: spec.expectedImageContains ? ogImage.includes(spec.expectedImageContains) : true,
    altNotGenericName: ogImageAlt !== "Jari Laru" && twitterImageAlt !== "Jari Laru",
    altLanguage:
      spec.expectedAltLanguage === "en"
        ? !/sivun jakokuva/i.test(ogImageAlt)
        : !/social sharing image/i.test(ogImageAlt),
    pageSpecificImage:
      spec.expectPageSpecificImage
        ? !/\/og-images\/.+\.(png|jpg|jpeg)$/i.test(ogImage) && !/\/img\/WIN_20210329_16_06_01_Pro\.jpg$/i.test(ogImage)
        : true,
    fallbackImage:
      spec.expectGeneratedImage
        ? /\/og-images\/.+\.(png|jpg|jpeg)$/i.test(ogImage)
        : true
  };

  const descriptionChecks = {
    notSiteGeneric:
      ["publication", "thesis", "writing", "presentation", "media"].includes(spec.key)
        ? ogDescription !== siteData.description && ogDescription !== siteData.descriptionEn
        : true,
    socialDescriptionPresent: Boolean(ogDescription),
    socialTitlePresent: Boolean(ogTitle)
  };

  return {
    key: spec.key,
    url: spec.url,
    file: spec.file,
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    ogImageAlt,
    ogUrl,
    ogLocale,
    twitterCard,
    twitterTitle,
    twitterDescription,
    twitterImage,
    twitterImageAlt,
    articlePublished,
    articleModified,
    hreflangs,
    checks,
    imageChecks,
    descriptionChecks
  };
}

function main() {
  if (!fs.existsSync(SITE_ROOT)) {
    console.error("ERROR: _site directory not found. Run a build first.");
    process.exit(1);
  }

  const pages = PAGE_SPECS.map(checkSpec);
  const changed = changedFiles();
  const forbiddenChanged = changed.filter((file) => (
    FORBIDDEN_CHANGED_PATHS.includes(file)
    || FORBIDDEN_CHANGED_PREFIXES.some((prefix) => file.startsWith(prefix))
  ));
  const ogImagesDir = path.join(SITE_ROOT, "og-images");
  const ogImages = fs.existsSync(ogImagesDir)
    ? fs.readdirSync(ogImagesDir).filter((entry) => /\.(png|jpe?g)$/i.test(entry))
    : [];
  const pagesWithSeparateSocialTitle = pages
    .filter((page) => page.title && page.ogTitle && !page.title.startsWith(page.ogTitle))
    .map((page) => page.key);
  const pagesWithSeparateSocialDescription = pages
    .filter((page) => page.description && page.ogDescription && page.description !== page.ogDescription)
    .map((page) => page.key);

  const summary = {
    generatedAt: new Date().toISOString(),
    changedFiles: changed,
    forbiddenChanged,
    ogImagesGenerated: ogImages.length,
    pagesWithSeparateSocialTitle,
    pagesWithSeparateSocialDescription,
    twitterAttributionPresent: {
      twitterSite: pages.some((page) => /twitter:site/i.test(readHtml(page.file))),
      twitterCreator: pages.some((page) => /twitter:creator/i.test(readHtml(page.file)))
    }
  };

  const failures = [];

  if (forbiddenChanged.length) {
    failures.push(`Forbidden Pagefind-related files changed: ${forbiddenChanged.join(", ")}`);
  }
  if (ogImages.length === 0) {
    failures.push("No generated OG images found in _site/og-images.");
  }
  if (pagesWithSeparateSocialTitle.length === 0) {
    failures.push("No representative page showed a social title distinct from the HTML <title>.");
  }

  pages.forEach((page) => {
    Object.entries(page.checks).forEach(([key, pass]) => {
      if (!pass) failures.push(`${page.key}: check failed -> ${key}`);
    });
    Object.entries(page.imageChecks).forEach(([key, pass]) => {
      if (!pass) failures.push(`${page.key}: image check failed -> ${key}`);
    });
    Object.entries(page.descriptionChecks).forEach(([key, pass]) => {
      if (!pass) failures.push(`${page.key}: description check failed -> ${key}`);
    });
  });

  const payload = {
    ok: failures.length === 0,
    summary,
    pages,
    failures
  };

  ensureDir(DATA_PATH);
  fs.writeFileSync(DATA_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  if (payload.ok) {
    console.log(
      `[seo2-audit] OK | pages=${pages.length} ogImages=${ogImages.length} separateTitles=${pagesWithSeparateSocialTitle.length} data=${DATA_PATH}`
    );
    return;
  }

  console.error(`[seo2-audit] FAIL | issues=${failures.length} data=${DATA_PATH}`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

main();

const fs = require("fs");
const os = require("os");
const path = require("path");
const yaml = require("js-yaml");
const { performance } = require("node:perf_hooks");

function toFrontMatterMarkdown(frontMatter, body) {
  return `---\n${yaml.dump(frontMatter, { lineWidth: 1000 }).trim()}\n---\n\n${String(body || "").trim()}\n`;
}

function getAuthoringInputPaths(slug, domain = "presentations") {
  const authoringInputRoot = path.join(os.tmpdir(), "jarilaru-authoring-input", domain);

  if (domain === "publications") {
    const tempDataDir = path.join(authoringInputRoot, "_data");
    return {
      authoringInputRoot,
      tempDataDir,
      inputPath: path.join(process.cwd(), "src", "julkaisut", "researchfi-details.njk"),
      tempGlobalDataPath: path.join(tempDataDir, "publicationDetailPages.js")
    };
  }

  const tempPresentationsDir = path.join(authoringInputRoot, "presentations");
  return {
    authoringInputRoot,
    tempPresentationsDir,
    tempInputPath: path.join(
      tempPresentationsDir,
      `zz-authoring-preview-${slug}.md`
    ),
    tempDirectoryDataPath: path.join(tempPresentationsDir, "presentations.11tydata.js")
  };
}

function renderEleventyPages(inputPath, previewDir) {
  const importStart = performance.now();
  const { Eleventy } = require("@11ty/eleventy");
  const importMs = performance.now() - importStart;

  const eleventy = new Eleventy(inputPath, previewDir, {
    configPath: ".eleventy.js",
    quietMode: true
  });

  return (async () => {
    const initStart = performance.now();
    await eleventy.init();
    const initMs = performance.now() - initStart;

    const renderStart = performance.now();
    const pages = await eleventy.toJSON();
    const renderMs = performance.now() - renderStart;

    return {
      pages,
      timings: {
        importMs,
        initMs,
        renderMs,
        totalMs: importMs + initMs + renderMs
      }
    };
  })();
}

async function renderPresentationPreview({
  draft,
  keepTemp = false
}) {
  const previewDir = path.join(process.cwd(), ".tmp", "authoring-preview", draft.slug);
  const relativePreviewPath = path.join(".tmp", "authoring-preview", draft.slug, "index.html");
  const previewPath = path.join(previewDir, "index.html");
  const {
    authoringInputRoot,
    tempPresentationsDir,
    tempInputPath,
    tempDirectoryDataPath
  } = getAuthoringInputPaths(draft.slug);

  fs.mkdirSync(tempPresentationsDir, { recursive: true });
  fs.writeFileSync(
    tempDirectoryDataPath,
    `module.exports = require(${JSON.stringify(path.join(process.cwd(), "src", "presentations", "presentations.11tydata.js"))});\n`,
    "utf8"
  );
  fs.writeFileSync(tempInputPath, toFrontMatterMarkdown(draft.frontMatter, draft.body), "utf8");

  const previousCacheOnly = process.env.CACHE_ONLY;
  process.env.CACHE_ONLY = "true";

  try {
    const { pages, timings } = await renderEleventyPages(tempInputPath, previewDir);

    const page = pages.find((entry) => entry.url === draft.pageUrl);
    if (!page) {
      throw new Error(`Eleventy-preview ei palauttanut sivua URL:lle ${draft.pageUrl}`);
    }

    fs.rmSync(previewDir, { recursive: true, force: true });
    fs.mkdirSync(previewDir, { recursive: true });
    fs.writeFileSync(previewPath, String(page.content || ""), "utf8");

    return {
      previewPath: relativePreviewPath,
      pagesProcessed: pages.length,
      htmlBytes: Buffer.byteLength(String(page.content || ""), "utf8"),
      timings
    };
  } finally {
    if (typeof previousCacheOnly === "undefined") {
      delete process.env.CACHE_ONLY;
    } else {
      process.env.CACHE_ONLY = previousCacheOnly;
    }

    if (!keepTemp) {
      fs.rmSync(authoringInputRoot, { recursive: true, force: true });
    }
  }
}

function toInlineModuleExport(value) {
  return `module.exports = ${JSON.stringify(value, null, 2)};\n`;
}

async function renderPublicationPreview({
  draft,
  keepTemp = false
}) {
  const previewDir = path.join(process.cwd(), ".tmp", "authoring-preview", draft.slug);
  const relativePreviewPath = path.join(".tmp", "authoring-preview", draft.slug, "index.html");
  const previewPath = path.join(previewDir, "index.html");
  const {
    authoringInputRoot,
    tempDataDir,
    inputPath,
    tempGlobalDataPath
  } = getAuthoringInputPaths(draft.slug, "publications");

  fs.mkdirSync(tempDataDir, { recursive: true });
  fs.writeFileSync(
    tempGlobalDataPath,
    toInlineModuleExport({ researchfiItems: [draft.canonicalDetail] }),
    "utf8"
  );

  const previousCacheOnly = process.env.CACHE_ONLY;
  const previousPublicationOverride = process.env.AUTHORING_PUBLICATION_DETAIL_PAGES_PATH;
  process.env.CACHE_ONLY = "true";
  process.env.AUTHORING_PUBLICATION_DETAIL_PAGES_PATH = tempGlobalDataPath;

  try {
    const { pages, timings } = await renderEleventyPages(inputPath, previewDir);

    const page = pages.find((entry) => entry.url === draft.pageUrl);
    if (!page) {
      throw new Error(`Eleventy-preview ei palauttanut sivua URL:lle ${draft.pageUrl}`);
    }

    fs.rmSync(previewDir, { recursive: true, force: true });
    fs.mkdirSync(previewDir, { recursive: true });
    fs.writeFileSync(previewPath, String(page.content || ""), "utf8");

    return {
      previewPath: relativePreviewPath,
      pagesProcessed: pages.length,
      htmlBytes: Buffer.byteLength(String(page.content || ""), "utf8"),
      timings
    };
  } finally {
    if (typeof previousCacheOnly === "undefined") {
      delete process.env.CACHE_ONLY;
    } else {
      process.env.CACHE_ONLY = previousCacheOnly;
    }

    if (typeof previousPublicationOverride === "undefined") {
      delete process.env.AUTHORING_PUBLICATION_DETAIL_PAGES_PATH;
    } else {
      process.env.AUTHORING_PUBLICATION_DETAIL_PAGES_PATH = previousPublicationOverride;
    }

    if (!keepTemp) {
      fs.rmSync(authoringInputRoot, { recursive: true, force: true });
    }
  }
}

module.exports = {
  getAuthoringInputPaths,
  renderPublicationPreview,
  renderEleventyPages,
  renderPresentationPreview
};

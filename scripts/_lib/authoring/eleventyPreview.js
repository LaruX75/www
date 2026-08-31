const fs = require("fs");
const os = require("os");
const path = require("path");
const yaml = require("js-yaml");
const { performance } = require("node:perf_hooks");

function toFrontMatterMarkdown(frontMatter, body) {
  return `---\n${yaml.dump(frontMatter, { lineWidth: 1000 }).trim()}\n---\n\n${String(body || "").trim()}\n`;
}

function getAuthoringInputPaths(slug) {
  const authoringInputRoot = path.join(os.tmpdir(), "jarilaru-authoring-input");
  const tempPresentationsDir = path.join(authoringInputRoot, "presentations");
  const tempInputPath = path.join(
    tempPresentationsDir,
    `zz-authoring-preview-${slug}.md`
  );
  const tempDirectoryDataPath = path.join(tempPresentationsDir, "presentations.11tydata.js");

  return {
    authoringInputRoot,
    tempPresentationsDir,
    tempInputPath,
    tempDirectoryDataPath
  };
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
    const importStart = performance.now();
    const { Eleventy } = require("@11ty/eleventy");
    const importMs = performance.now() - importStart;

    const eleventy = new Eleventy(tempInputPath, previewDir, {
      configPath: ".eleventy.js",
      quietMode: true
    });

    const initStart = performance.now();
    await eleventy.init();
    const initMs = performance.now() - initStart;

    const renderStart = performance.now();
    const pages = await eleventy.toJSON();
    const renderMs = performance.now() - renderStart;

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
      timings: {
        importMs,
        initMs,
        renderMs,
        totalMs: importMs + initMs + renderMs
      }
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

module.exports = {
  getAuthoringInputPaths,
  renderPresentationPreview
};

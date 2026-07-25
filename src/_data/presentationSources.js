const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { getCanvaDesignId, normalizeCanvaUrl } = require("./canvaUrl");

const PRESENTATIONS_DIR = path.join(__dirname, "..", "presentations");

function walkPresentationFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkPresentationFiles(fullPath, results);
    } else if (name.endsWith(".md")) {
      results.push(fullPath);
    }
  }
  return results;
}

function parsePresentationFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;

  let frontMatter;
  try {
    frontMatter = yaml.load(match[1]) || {};
  } catch (_) {
    return null;
  }

  const fileSlug = path.basename(filePath, ".md");
  const body = String(match[2] || "").trim();
  const sourceUrl = frontMatter.sourceUrl || frontMatter.url || "";
  const publicUrl = normalizeCanvaUrl(frontMatter.publicUrl || frontMatter.url || "");

  return {
    title: frontMatter.title || "",
    url: frontMatter.url || "",
    sourceUrl,
    publicUrl,
    thumbnail: frontMatter.thumbnail || "",
    date: frontMatter.date || "",
    description: frontMatter.description || body,
    categories: frontMatter.categories || [],
    keywords: frontMatter.keywords || [],
    source: frontMatter.source || "",
    pageUrl: `/presentations/${fileSlug}/`
  };
}

function readLocalPresentationSources() {
  return walkPresentationFiles(PRESENTATIONS_DIR)
    .map(parsePresentationFile)
    .filter(Boolean)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
}

function createCanvaPresentationLookup(presentations = []) {
  const lookup = new Map();

  presentations
    .filter((item) => {
      const candidateUrl = item?.sourceUrl || item?.publicUrl || item?.url || "";
      return String(candidateUrl).includes("canva.com");
    })
    .forEach((item) => {
      const candidateUrl = item.sourceUrl || item.publicUrl || item.url || "";
      const id = getCanvaDesignId(candidateUrl);
      if (!id) return;

      lookup.set(id, {
        pageUrl: item.pageUrl || "",
        publicUrl: item.publicUrl || "",
        sourceUrl: item.sourceUrl || item.url || ""
      });
    });

  return lookup;
}

module.exports = {
  readLocalPresentationSources,
  createCanvaPresentationLookup
};

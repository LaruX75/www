const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { getCanvaDesignId, normalizeCanvaUrl } = require("./canvaUrl");
const { derivePresentationMetadata } = require("../_utils/presentationDerivedMetadata");

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
  const source = normalizePresentationSource({
    source: frontMatter.source,
    sourceUrl,
    publicUrl,
    url: frontMatter.url || ""
  });

  const baseRecord = {
    title: frontMatter.title || "",
    url: frontMatter.url || "",
    sourceUrl,
    publicUrl,
    thumbnail: frontMatter.thumbnail || "",
    date: frontMatter.date || "",
    description: frontMatter.description || body,
    categories: frontMatter.categories || [],
    keywords: frontMatter.keywords || [],
    courseContexts: Array.isArray(frontMatter.courseContexts) ? frontMatter.courseContexts : [],
    source,
    pageUrl: `/presentations/${fileSlug}/`
  };

  return {
    ...baseRecord,
    ...derivePresentationMetadata(baseRecord)
  };
}

function classifyPresentationUrl(url = "") {
  const value = String(url || "").trim();
  if (!value) return "";

  try {
    const { hostname } = new URL(value);
    const host = String(hostname || "").toLowerCase().replace(/^www\./, "");

    if (host.endsWith("slideshare.net")) return "slideshare";
    if (host === "youtu.be" || host.endsWith("youtube.com")) return "youtube";
    if (host.endsWith("canva.com") || host === "canva.link") return "canva";
    if (host.endsWith("ouka.fi")) return "ouka";

    return "web";
  } catch (_) {
    return "";
  }
}

function normalizePresentationSource({
  source = "",
  sourceUrl = "",
  publicUrl = "",
  url = ""
} = {}) {
  const normalizedSource = String(source || "").trim().toLowerCase();
  if (normalizedSource && normalizedSource !== "json") {
    return normalizedSource;
  }

  for (const candidate of [sourceUrl, publicUrl, url]) {
    const inferred = classifyPresentationUrl(candidate);
    if (inferred) return inferred;
  }

  if (normalizedSource === "json") {
    return "canva";
  }

  return "";
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
      return classifyPresentationUrl(candidateUrl) === "canva";
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

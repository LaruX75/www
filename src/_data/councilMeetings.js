const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const { buildCouncilMeetings } = require("../../eleventy.filters");

const ROOT = path.join(__dirname, "..", "..");
const SOURCE_DIRECTORIES = ["blog", "publications", "politics", "media", "presentations"];

function toDateSlug(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0].replace(/-/g, "/");
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0")
  ].join("/");
}

function normalizePermalink(value) {
  if (!value) return "";
  const permalink = String(value);
  if (permalink === false || permalink === "false") return "";
  return permalink.startsWith("/") ? permalink : `/${permalink}`;
}

function itemUrl(filePath, data = {}) {
  const permalink = normalizePermalink(data.permalink);
  if (permalink) return permalink;

  const dateSlug = toDateSlug(data.date);
  if (!dateSlug) return "";

  const basename = path.basename(filePath, path.extname(filePath));
  return `/${dateSlug}/${basename}/`;
}

function readDirectory(directory) {
  const fullDirectory = path.join(ROOT, "src", directory);
  if (!fs.existsSync(fullDirectory)) return [];

  return fs.readdirSync(fullDirectory)
    .filter((entry) => entry.endsWith(".md") || entry.endsWith(".njk"))
    .map((entry) => {
      const inputPath = path.join(fullDirectory, entry);
      const raw = fs.readFileSync(inputPath, "utf8");
      const parsed = matter(raw);
      const url = itemUrl(inputPath, parsed.data);
      return {
        inputPath,
        url,
        date: parsed.data.date || null,
        data: parsed.data
      };
    })
    .filter((item) => item.url && item.data?.title);
}

function readCouncilMeetingCollections() {
  return SOURCE_DIRECTORIES.reduce((groups, directory) => {
    groups[directory] = readDirectory(directory);
    return groups;
  }, {});
}

module.exports = function councilMeetingsData() {
  const collections = readCouncilMeetingCollections();
  return buildCouncilMeetings(collections, "fi");
};

module.exports.readCouncilMeetingCollections = readCouncilMeetingCollections;

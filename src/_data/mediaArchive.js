const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const MEDIA_DIR = path.join(__dirname, "..", "media");

function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildItem(fileName) {
  const fullPath = path.join(MEDIA_DIR, fileName);
  const raw = fs.readFileSync(fullPath, "utf8");
  const parsed = matter(raw);
  const slug = fileName.replace(/\.md$/i, "");
  const explicitDate = toDate(parsed.data.date);

  let url = `/mediassa/${slug}/`;
  if (explicitDate) {
    const y = explicitDate.getFullYear();
    const m = String(explicitDate.getMonth() + 1).padStart(2, "0");
    const d = String(explicitDate.getDate()).padStart(2, "0");
    url = `/mediassa/${y}/${m}/${d}/${slug}/`;
  }

  return {
    slug,
    url,
    date: explicitDate,
    content: parsed.content,
    data: {
      ...parsed.data,
      categories: Array.isArray(parsed.data.categories) ? parsed.data.categories : [],
      keywords: Array.isArray(parsed.data.keywords) ? parsed.data.keywords : []
    }
  };
}

function sortItems(a, b) {
  if (a.date && b.date) {
    const diff = b.date - a.date;
    if (diff !== 0) return diff;
  } else if (a.date || b.date) {
    return a.date ? -1 : 1;
  }

  const orderA = Number(a.data.mediaOrder || 0);
  const orderB = Number(b.data.mediaOrder || 0);
  if (orderA !== orderB) return orderB - orderA;

  return String(a.data.title || "").localeCompare(String(b.data.title || ""), "fi");
}

module.exports = function mediaArchive() {
  if (!fs.existsSync(MEDIA_DIR)) {
    return {
      all: [],
      about: [],
      expertAssignments: [],
      guest: [],
      interviewer: []
    };
  }

  const all = fs
    .readdirSync(MEDIA_DIR)
    .filter((file) => file.endsWith(".md"))
    .map(buildItem)
    .sort(sortItems);

  return {
    all,
    about: all.filter((item) => item.data.mediaRole === "about"),
    expertAssignments: all.filter((item) => item.data.mediaRole === "expertAssignment"),
    guest: all.filter((item) => item.data.mediaRole === "guest"),
    interviewer: all.filter((item) => item.data.mediaRole === "interviewer")
  };
};

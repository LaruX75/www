const cheerio = require("cheerio");
const { readCache, writeCache } = require("./_apiCache");

const CACHE_KEY = "slideshare-presentations-v1";
const PROFILE_URL = "https://www.slideshare.net/larux";

function isPresentationRow(item) {
  return (
    item &&
    typeof item === "object" &&
    (item.canonicalUrl || item.id) &&
    typeof item.title === "string"
  );
}

function findPresentationArray(node) {
  if (!node || typeof node !== "object") return null;

  if (Array.isArray(node)) {
    if (node.length > 0 && node.every(isPresentationRow)) {
      return node;
    }

    for (const item of node) {
      const found = findPresentationArray(item);
      if (found) return found;
    }
    return null;
  }

  for (const value of Object.values(node)) {
    const found = findPresentationArray(value);
    if (found) return found;
  }

  return null;
}

function normalizeRow(item) {
  const url =
    item.canonicalUrl ||
    item.url ||
    (item.id ? `https://www.slideshare.net/slideshow/${item.id}/${item.id}` : null);

  return {
    id: String(item.id || ""),
    title: item.title || "Untitled SlideShare",
    thumbnail: item.thumbnail || null,
    url,
    author: item?.user?.name || "Jari Laru",
    views: Number(item.viewCount || 0)
  };
}

async function fetchSlideshareRows() {
  const response = await fetch(PROFILE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Eleventy build bot)",
      Accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`SlideShare fetch failed (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const nextDataRaw = $("#__NEXT_DATA__").text();

  if (!nextDataRaw) {
    throw new Error("SlideShare next data payload missing");
  }

  const nextData = JSON.parse(nextDataRaw);
  const presentations = findPresentationArray(nextData?.props?.pageProps || nextData);

  if (!Array.isArray(presentations) || presentations.length === 0) {
    throw new Error("SlideShare presentations not found in payload");
  }

  return presentations.map(normalizeRow).filter((item) => item.id && item.url);
}

module.exports = async function () {
  const cached = readCache(CACHE_KEY);
  const cachedRows = Array.isArray(cached?.data) ? cached.data : [];
  const maxItems = Number(process.env.SLIDESHARE_LIMIT || 24);

  try {
    const rows = await fetchSlideshareRows();
    writeCache(CACHE_KEY, rows);
    return rows.slice(0, maxItems);
  } catch (error) {
    if (cachedRows.length) {
      console.warn(`SlideShare: live fetch failed, using cache (${cached.savedAt}): ${error.message}`);
      return cachedRows.slice(0, maxItems);
    }

    console.warn(`SlideShare: live fetch failed and cache missing: ${error.message}`);
    return [];
  }
};

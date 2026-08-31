const cheerio = require("cheerio");
const { fetchWithTimeout } = require("../../../src/_data/_apiCache");

function normalizeYouTubeUrl(input) {
  let parsed;
  try {
    parsed = new URL(String(input || "").trim());
  } catch (_) {
    throw new Error("Virheellinen URL");
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  let videoId = "";

  if (host === "youtu.be") {
    videoId = parsed.pathname.split("/").filter(Boolean)[0] || "";
  } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
    if (parsed.pathname === "/watch") {
      videoId = parsed.searchParams.get("v") || "";
    } else if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/").filter(Boolean)[1] || "";
    }
  }

  if (!/^[A-Za-z0-9_-]{6,}$/.test(videoId)) {
    throw new Error("YouTube-URL:sta ei löytynyt kelvollista video-ID:tä");
  }

  const listId = parsed.searchParams.get("list") || "";
  const normalized = new URL("https://www.youtube.com/watch");
  normalized.searchParams.set("v", videoId);
  if (listId) normalized.searchParams.set("list", listId);

  return {
    inputUrl: String(input || "").trim(),
    sourceUrl: normalized.toString(),
    watchUrl: normalized.toString(),
    videoId,
    listId
  };
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (normalized) return normalized;
  }
  return "";
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const match = raw.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function parseLdJsonDate($) {
  const nodes = $('script[type="application/ld+json"]').toArray();
  for (const node of nodes) {
    try {
      const payload = JSON.parse($(node).text());
      const objects = Array.isArray(payload) ? payload : [payload];
      for (const item of objects) {
        const date = normalizeDate(item?.uploadDate || item?.datePublished);
        if (date) return date;
      }
    } catch (_) {
      continue;
    }
  }
  return "";
}

function parseYouTubeMetadataHtml(html, normalized) {
  const $ = cheerio.load(String(html || ""));
  const title = firstNonEmpty(
    $('meta[property="og:title"]').attr("content"),
    $('meta[name="title"]').attr("content"),
    $("title").text().replace(/\s*-\s*YouTube\s*$/i, "")
  );
  const description = firstNonEmpty(
    $('meta[property="og:description"]').attr("content"),
    $('meta[name="description"]').attr("content")
  );
  const thumbnail = firstNonEmpty(
    $('meta[property="og:image"]').attr("content"),
    $('link[itemprop="thumbnailUrl"]').attr("href"),
    normalized?.videoId ? `https://i.ytimg.com/vi/${normalized.videoId}/hqdefault.jpg` : ""
  );
  const date = firstNonEmpty(
    normalizeDate($('meta[itemprop="uploadDate"]').attr("content")),
    normalizeDate($('meta[itemprop="datePublished"]').attr("content")),
    parseLdJsonDate($)
  );

  if (!title) {
    throw new Error("YouTube-metadatan otsikkoa ei löytynyt");
  }

  return {
    source: "youtube",
    sourceType: normalized?.listId ? "youtubePlaylistEntry" : "youtubeVideo",
    sourceLabel: "YouTube",
    title,
    description,
    date,
    thumbnail,
    sourceUrl: normalized.sourceUrl,
    videoId: normalized.videoId,
    listId: normalized.listId || ""
  };
}

async function fetchYouTubeMetadata(inputUrl, { fetchImpl = fetchWithTimeout } = {}) {
  const normalized = normalizeYouTubeUrl(inputUrl);
  const response = await fetchImpl(normalized.watchUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; AUTHORING-PIPELINE-01/1.0; +https://www.jarilaru.fi/)"
    }
  }, 15000);

  if (!response.ok) {
    throw new Error(`YouTube-sivun haku epäonnistui (${response.status})`);
  }

  const html = await response.text();
  const proposal = parseYouTubeMetadataHtml(html, normalized);

  return {
    ...proposal,
    evidenceUrl: normalized.watchUrl
  };
}

module.exports = {
  fetchYouTubeMetadata,
  normalizeDate,
  normalizeYouTubeUrl,
  parseYouTubeMetadataHtml
};

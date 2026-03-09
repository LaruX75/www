const cheerio = require("cheerio");
const { readCache, readCacheIfFresh, writeCache, fetchWithTimeout } = require("./_apiCache");

const CACHE_TTL_HOURS = 6;

const CACHE_KEY = "slideshare-presentations-v1";
const PROFILE_URL = "https://www.slideshare.net/larux";
const MAX_SLIDESHARE_DATE = "2020-12-31";

function clampSlideshareDate(isoDate) {
  if (!isoDate) return null;
  return isoDate > MAX_SLIDESHARE_DATE ? MAX_SLIDESHARE_DATE : isoDate;
}

function extractDateFromThumbnail(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  // Kaikki SlideShare-formaatit: -YYMMDDHHMMSS- (12 numeroa väliviivojen välissä)
  const match = String(thumbnailUrl).match(/-(\d{6})\d{6}-/);
  if (!match) return null;

  const yymmdd = match[1];
  const yy = Number.parseInt(yymmdd.slice(0, 2), 10);
  const mm = Number.parseInt(yymmdd.slice(2, 4), 10);
  const dd = Number.parseInt(yymmdd.slice(4, 6), 10);
  if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;

  const year = yy >= 90 ? 1900 + yy : 2000 + yy;
  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function normalizeSlideshareDate(inputDate, thumbnailUrl) {
  // Thumbnail-URL on luotettavin lähde; fallback front matter -päivämäärään.
  const extracted = extractDateFromThumbnail(thumbnailUrl);
  if (extracted) return clampSlideshareDate(extracted);
  const fromInput = typeof inputDate === "string" ? inputDate.trim().slice(0, 10) : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fromInput)) return null;
  return clampSlideshareDate(fromInput);
}

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
    date: normalizeSlideshareDate(item.date, item.thumbnail),
    url,
    author: item?.user?.name || "Jari Laru",
    views: Number(item.viewCount || 0)
  };
}

async function fetchSlideshareRows() {
  const allRows = [];
  const seenIds = new Set();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const pageUrl = new URL(PROFILE_URL);
    if (page > 1) {
      pageUrl.searchParams.set("page", String(page));
    }
    const pagePayload = await fetchSlidesharePage(pageUrl.toString());
    const rows = pagePayload.rows || [];
    rows.forEach((row) => {
      if (!row?.id || seenIds.has(row.id)) return;
      seenIds.add(row.id);
      allRows.push(row);
    });

    totalPages = Number(pagePayload.totalPages || totalPages || 1);
    page += 1;
  }

  return allRows;
}

async function fetchSlidesharePage(url) {
  const response = await fetchWithTimeout(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Eleventy build bot)",
      Accept: "text/html,application/xhtml+xml"
    }
  }, 15000);

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
  const paginated =
    nextData?.props?.pageProps?.results?.rawQueryResponses?.presentations?.data?.userSingle?.slideshowsPaginated || null;
  const presentations =
    (Array.isArray(paginated?.results) ? paginated.results : null) ||
    findPresentationArray(nextData?.props?.pageProps || nextData);

  if (!Array.isArray(presentations) || presentations.length === 0) {
    throw new Error("SlideShare presentations not found in payload");
  }

  const totalPages = Number(paginated?.pageInfo?.totalPages || 1);
  return {
    rows: presentations.map(normalizeRow).filter((item) => item.id && item.url),
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1
  };
}

module.exports = async function () {
  const fresh = readCacheIfFresh(CACHE_KEY, CACHE_TTL_HOURS);
  if (fresh) {
    const freshRows = Array.isArray(fresh.data) ? fresh.data : [];
    console.log(`SlideShare: käytetään tuoretta välimuistia (${fresh.savedAt}), ${freshRows.length} esitystä.`);
    return freshRows;
  }

  const cached = readCache(CACHE_KEY);
  const cachedRows = Array.isArray(cached?.data) ? cached.data : [];
  const rawLimit = process.env.SLIDESHARE_LIMIT;
  const maxItems =
    rawLimit === undefined || rawLimit === null || rawLimit === ""
      ? null
      : Number(rawLimit);
  const applyLimit = (rows) => {
    if (!Array.isArray(rows)) return [];
    if (!Number.isFinite(maxItems) || maxItems <= 0) return rows;
    return rows.slice(0, maxItems);
  };

  try {
    const rows = await fetchSlideshareRows();
    writeCache(CACHE_KEY, rows);
    return applyLimit(rows);
  } catch (error) {
    if (cachedRows.length) {
      console.warn(`SlideShare: live fetch failed, using cache (${cached.savedAt}): ${error.message}`);
      return applyLimit(cachedRows);
    }

    console.warn(`SlideShare: live fetch failed and cache missing: ${error.message}`);
    return [];
  }
};

/**
 * Hakee Jari Larun AOE-oppimateriaalit Finna-rajapinnasta.
 * Filter: format:"0/LearningMaterial/" (Oppimateriaali)
 */

const { readCache, readCacheIfFresh, writeCache, fetchWithTimeout } = require("./_apiCache");
const curation = require("./curated/finna.json");

const CACHE_TTL_HOURS = 6;

const CACHE_KEY = "finna-aoe-v2";
const API_BASE = "https://api.finna.fi/v1/search";
const PUBLIC_BASE = "https://www.finna.fi";

function normalizeUrl(id) {
  return id ? `${PUBLIC_BASE}/Record/${encodeURIComponent(id)}` : PUBLIC_BASE;
}

function toAbsoluteImageUrl(candidate) {
  if (!candidate) return null;
  const value = String(candidate).trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `${PUBLIC_BASE}${value}`;
  if (value.startsWith("Cover/Show")) return `${PUBLIC_BASE}/${value}`;
  return null;
}

function normalizeImage(record) {
  const id = record?.id || "";
  if (!id) return null;

  const ext = Array.isArray(record?.imagesExtended) ? record.imagesExtended : [];
  for (const item of ext) {
    const urls = item?.urls || {};
    const candidates = [
      urls.large,
      urls.medium,
      urls.small,
      urls.master,
      item?.url,
      item?.href
    ];
    for (const raw of candidates) {
      const normalized = toAbsoluteImageUrl(raw);
      if (normalized) return normalized;
    }
  }

  const images = Array.isArray(record?.images) ? record.images : [];
  for (const item of images) {
    const normalized = toAbsoluteImageUrl(item);
    if (normalized) return normalized;
  }

  const hasImage = images.length > 0 || ext.length > 0;
  if (!hasImage) return null;
  return `${PUBLIC_BASE}/Cover/Show?id=${encodeURIComponent(id)}&size=medium`;
}

function normalizeSummary(record) {
  if (Array.isArray(record?.summary) && record.summary.length) {
    return String(record.summary[0]).trim();
  }
  return "";
}

function normalizeRecord(record) {
  const id = record?.id || "";
  return {
    id,
    title: record?.title || "Nimetön oppimateriaali",
    url: normalizeUrl(id),
    image: normalizeImage(record),
    year: record?.year || "",
    summary: normalizeSummary(record),
    format: "Oppimateriaali"
  };
}

module.exports = async function () {
  const hidden = new Set(Array.isArray(curation.hidden) ? curation.hidden : []);
  const applyCuration = (rows) => rows.filter((r) => !hidden.has(r.id));

  const fresh = readCacheIfFresh(CACHE_KEY, CACHE_TTL_HOURS);
  if (fresh?.data) {
    console.log(`FinnaAoe: käytetään tuoretta välimuistia (${fresh.savedAt}).`);
    const rows = applyCuration(Array.isArray(fresh.data.rows) ? fresh.data.rows : []);
    return { ...fresh.data, rows, total: rows.length, source: "cache" };
  }

  const cached = readCache(CACHE_KEY);

  try {
    const url = new URL(API_BASE);
    url.searchParams.set("lookfor", "Jari Laru");
    url.searchParams.set("type", "Author");
    url.searchParams.set("sort", "main_date_str desc");
    url.searchParams.set("limit", "50");
    url.searchParams.append("filter[]", 'format:"0/LearningMaterial/"');
    url.searchParams.append("field[]", "id");
    url.searchParams.append("field[]", "title");
    url.searchParams.append("field[]", "year");
    url.searchParams.append("field[]", "summary");
    url.searchParams.append("field[]", "images");
    url.searchParams.append("field[]", "imagesExtended");

    const response = await fetchWithTimeout(url.toString(), {
      headers: { Accept: "application/json" }
    }, 15000);

    if (!response.ok) {
      throw new Error(`Finna AOE API failed (${response.status})`);
    }

    const payload = await response.json();
    const records = Array.isArray(payload?.records) ? payload.records : [];
    // Keep only aoe.* records (filter out non-AOE results)
    const rows = applyCuration(records
      .filter((r) => r?.id && String(r.id).startsWith("aoe."))
      .map(normalizeRecord)
      .filter((r) => r.id && r.title));

    const result = { rows, total: rows.length, fetchedAt: new Date().toISOString(), source: "live" };
    writeCache(CACHE_KEY, result);
    return result;
  } catch (error) {
    console.warn(`FinnaAoe: ${error.message}`);
    if (cached?.data) {
      const rows = applyCuration(Array.isArray(cached.data.rows) ? cached.data.rows : []);
      return { ...cached.data, rows, total: rows.length, source: "cache" };
    }
    return { rows: [], total: 0, source: "error", error: error.message };
  }
};

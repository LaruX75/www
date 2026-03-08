const fs = require("fs");
const path = require("path");
const { readCache, readCacheIfFresh, writeCache, fetchWithTimeout } = require("./_apiCache");

const CACHE_TTL_HOURS = 6;

const CACHE_KEY = "finna-search-v1";
const API_BASE = "https://api.finna.fi/v1/search";
const PUBLIC_BASE = "https://www.finna.fi";
const CMS_CONFIG_PATH = path.join(process.cwd(), "src", "_data", "finna-config.json");

function readCmsConfig() {
  if (!fs.existsSync(CMS_CONFIG_PATH)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(CMS_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const limit = Number(parsed?.limit);
    return {
      enabled: parsed?.enabled !== false,
      lookfor: typeof parsed?.lookfor === "string" ? parsed.lookfor.trim() : "",
      type: typeof parsed?.type === "string" ? parsed.type.trim() : "",
      sort: typeof parsed?.sort === "string" ? parsed.sort.trim() : "",
      limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : null,
      filters: Array.isArray(parsed?.filters)
        ? parsed.filters.map((f) => String(f || "").trim()).filter(Boolean)
        : []
    };
  } catch (error) {
    console.warn(`Finna: CMS config read failed: ${error.message}`);
    return {};
  }
}

function normalizeUrl(urlOrPath, fallbackId) {
  if (urlOrPath && /^https?:\/\//i.test(urlOrPath)) {
    return urlOrPath;
  }
  if (urlOrPath && String(urlOrPath).startsWith("/")) {
    return `${PUBLIC_BASE}${urlOrPath}`;
  }
  return fallbackId ? `${PUBLIC_BASE}/Record/${encodeURIComponent(fallbackId)}` : PUBLIC_BASE;
}

function normalizeFormat(record) {
  const candidate =
    record?.formats?.[0] ||
    record?.format ||
    record?.format_ext_str_mv?.[0] ||
    null;

  if (!candidate) return "";
  if (typeof candidate === "string") return candidate;
  if (typeof candidate === "object") {
    return (
      candidate.translated ||
      candidate.value ||
      candidate.id ||
      ""
    );
  }
  return "";
}

function normalizeAuthors(record) {
  const fromPrimary = record?.primaryAuthors?.[0]?.name;
  if (fromPrimary) return fromPrimary;

  const fromSecondary = record?.secondaryAuthors?.[0]?.name;
  if (fromSecondary) return fromSecondary;

  const fromArray = Array.isArray(record?.nonPresenterAuthors)
    ? record.nonPresenterAuthors
        .map((a) => a?.name || "")
        .filter(Boolean)
        .join(", ")
    : "";
  return fromArray || "";
}

function normalizeYear(record) {
  return (
    record?.year ||
    record?.main_date_str ||
    record?.humanReadablePublicationDates?.[0] ||
    ""
  );
}

function normalizeSummary(record) {
  if (Array.isArray(record?.summary) && record.summary.length) {
    return String(record.summary[0]).trim();
  }
  if (typeof record?.summary === "string") {
    return record.summary.trim();
  }
  return "";
}

function normalizeImage(record) {
  const id = record?.id || "";
  if (!id) return null;

  const hasImage =
    (Array.isArray(record?.images) && record.images.length > 0) ||
    (Array.isArray(record?.imagesExtended) && record.imagesExtended.length > 0);

  if (!hasImage) return null;
  return `https://api.finna.fi/v1/Cover/Show?id=${encodeURIComponent(id)}&size=medium`;
}

function normalizeRecord(record) {
  const id = record?.id || "";
  const title = record?.title || "Nimetön aineisto";
  const url = normalizeUrl(record?.url, id);
  const image = normalizeImage(record);

  return {
    id,
    title,
    url,
    image,
    year: normalizeYear(record),
    authors: normalizeAuthors(record),
    format: normalizeFormat(record),
    summary: normalizeSummary(record)
  };
}

function buildResult({
  enabled = true,
  source = "live",
  rows = [],
  lookfor = "",
  type = "",
  sort = "",
  limit = 0,
  filters = [],
  total = 0,
  warning = null,
  cacheSavedAt = null,
  error = null
}) {
  return {
    enabled,
    source,
    fetchedAt: new Date().toISOString(),
    query: {
      lookfor,
      type,
      sort,
      limit,
      filters
    },
    searchUrl: `${PUBLIC_BASE}/Search/Results?${new URLSearchParams({
      lookfor,
      type
    }).toString()}`,
    total,
    rows,
    warning,
    cacheSavedAt,
    error
  };
}

module.exports = async function () {
  const cmsConfig = readCmsConfig();

  const enabled = cmsConfig.enabled !== false && process.env.FINNA_ENABLED !== "0";
  if (!enabled) {
    return buildResult({
      enabled: false,
      source: "disabled",
      rows: [],
      lookfor: process.env.FINNA_LOOKFOR || cmsConfig.lookfor || "Jari Laru",
      type: process.env.FINNA_TYPE || cmsConfig.type || "Author",
      sort: process.env.FINNA_SORT || cmsConfig.sort || "main_date_str desc",
      limit: cmsConfig.limit || 24,
      filters: cmsConfig.filters || [],
      warning: "FINNA-integraatio on poistettu käytöstä."
    });
  }

  const fresh = readCacheIfFresh(CACHE_KEY, CACHE_TTL_HOURS);
  if (fresh?.data) {
    console.log(`Finna: käytetään tuoretta välimuistia (${fresh.savedAt}).`);
    return { ...fresh.data, source: "cache", cacheSavedAt: fresh.savedAt };
  }

  const cached = readCache(CACHE_KEY);
  const cachedData = cached?.data || null;

  const lookfor = process.env.FINNA_LOOKFOR || cmsConfig.lookfor || "Jari Laru";
  const type = process.env.FINNA_TYPE || cmsConfig.type || "Author";
  const sort = process.env.FINNA_SORT || cmsConfig.sort || "main_date_str desc";
  const limitEnv = Number(process.env.FINNA_LIMIT || "");
  const limit = Number.isFinite(limitEnv) && limitEnv > 0
    ? Math.min(limitEnv, 100)
    : (cmsConfig.limit || 24);
  const filters = cmsConfig.filters || [];

  try {
    const url = new URL(API_BASE);
    url.searchParams.set("lookfor", lookfor);
    url.searchParams.set("type", type);
    url.searchParams.set("sort", sort);
    url.searchParams.set("limit", String(limit));
    filters.forEach((f) => url.searchParams.append("filter[]", f));

    const response = await fetchWithTimeout(url.toString(), {
      headers: { Accept: "application/json" }
    }, 15000);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Finna API failed (${response.status}): ${body.slice(0, 180)}`);
    }

    const payload = await response.json();
    const records = Array.isArray(payload?.records) ? payload.records : [];
    const rows = records.map(normalizeRecord).filter((row) => row.id && row.title);

    const result = buildResult({
      enabled: true,
      source: "live",
      rows,
      lookfor,
      type,
      sort,
      limit,
      filters,
      total: Number(payload?.resultCount || rows.length)
    });

    writeCache(CACHE_KEY, result);
    return result;
  } catch (error) {
    console.warn(`Finna: ${error.message}`);

    if (cachedData) {
      return {
        ...cachedData,
        source: "cache",
        cacheSavedAt: cached?.savedAt || null,
        error: error.message
      };
    }

    return buildResult({
      enabled: true,
      source: "error",
      rows: [],
      lookfor,
      type,
      sort,
      limit,
      filters,
      error: error.message
    });
  }
};

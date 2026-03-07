require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { readCache, writeCache } = require("./_apiCache");

const CACHE_KEY = "canva-designs-v1";
const API_BASE = "https://api.canva.com/rest/v1";
const TICKER_LIMIT = Number(process.env.CANVA_TICKER_LIMIT || 12);
const PRESENTATIONS_DIR = path.join(process.cwd(), "src", "presentations");

function toIsoDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

function extractDesignIdFromUrl(url) {
  if (!url) return null;
  const match = String(url).match(/\/d\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function parseQuotedValue(frontmatter, key) {
  const pattern = new RegExp(`^${key}:\\s*"(.*)"\\s*$`, "m");
  const match = frontmatter.match(pattern);
  if (!match) return null;
  return match[1].replace(/\\"/g, "\"").trim();
}

function parseUnquotedValue(frontmatter, key) {
  const pattern = new RegExp(`^${key}:\\s*(.+)\\s*$`, "m");
  const match = frontmatter.match(pattern);
  if (!match) return null;
  return match[1].trim();
}

function readLocalPresentations() {
  if (!fs.existsSync(PRESENTATIONS_DIR)) return [];

  const files = fs
    .readdirSync(PRESENTATIONS_DIR)
    .filter((name) => name.endsWith(".md"));

  const rows = [];

  files.forEach((fileName) => {
    const fullPath = path.join(PRESENTATIONS_DIR, fileName);
    const content = fs.readFileSync(fullPath, "utf8");
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) return;

    const fm = frontmatterMatch[1];
    const title = parseQuotedValue(fm, "title");
    const description = parseQuotedValue(fm, "description");
    const url = parseQuotedValue(fm, "url");
    const thumbnail = parseQuotedValue(fm, "thumbnail");
    const rawDate = parseUnquotedValue(fm, "date");
    const date = toIsoDate(rawDate) || rawDate || null;
    const id = extractDesignIdFromUrl(url);

    rows.push({
      id: id || fileName.replace(/\.md$/, ""),
      title: title || fileName.replace(/\.md$/, ""),
      description: description || "",
      url: url || null,
      thumbnail: thumbnail || null,
      date,
      source: "local"
    });
  });

  rows.sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });

  return rows;
}

function parseEnvDesignIds(fallbackRows) {
  const raw = process.env.CANVA_DESIGN_IDS || "";
  if (raw.trim()) {
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }

  return fallbackRows
    .map((row) => row.id)
    .filter(Boolean);
}

function normalizeCanvaDesign(item) {
  const design = item?.design || item || {};
  const id =
    design.id ||
    design.design_id ||
    design.designId ||
    null;

  const title = design.title || design.name || "Untitled Canva design";
  const description = design.description || "";
  const url =
    design.url ||
    design.edit_url ||
    design.view_url ||
    design?.urls?.edit_url ||
    design?.urls?.view_url ||
    (id ? `https://www.canva.com/d/${id}` : null);
  const thumbnail =
    design.thumbnail_url ||
    design?.thumbnail?.url ||
    design?.thumbnail?.image_url ||
    design?.preview?.thumbnail_url ||
    null;
  const date =
    toIsoDate(design.updated_at) ||
    toIsoDate(design.created_at) ||
    null;

  return {
    id,
    title,
    description,
    url,
    thumbnail,
    date,
    source: "canva"
  };
}

async function canvaRequest(pathname, accessToken) {
  const url = `${API_BASE}/${pathname.replace(/^\/+/, "")}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Canva API ${pathname} failed (${response.status}): ${body.slice(0, 180)}`);
  }

  return response.json();
}

async function fetchDesignsById(designIds, accessToken) {
  const rows = [];
  for (const id of designIds) {
    try {
      const payload = await canvaRequest(`designs/${id}`, accessToken);
      const normalized = normalizeCanvaDesign(payload);
      if (normalized.id || normalized.url) {
        rows.push(normalized);
      }
    } catch (error) {
      console.warn(`Canva: design ${id} fetch failed: ${error.message}`);
    }
  }
  return rows;
}

function mergeWithFallback(primaryRows, fallbackRows) {
  const fallbackById = new Map(fallbackRows.map((row) => [row.id, row]));
  const fallbackByUrl = new Map(fallbackRows.map((row) => [row.url, row]));

  const merged = primaryRows.map((row) => {
    const fallback = fallbackById.get(row.id) || fallbackByUrl.get(row.url) || {};
    return {
      ...fallback,
      ...row,
      title: row.title || fallback.title || "Untitled Canva design",
      description: row.description || fallback.description || "",
      url: row.url || fallback.url || null,
      thumbnail: row.thumbnail || fallback.thumbnail || null,
      date: row.date || fallback.date || null
    };
  });

  const seen = new Set(merged.map((row) => row.id || row.url));
  fallbackRows.forEach((row) => {
    const key = row.id || row.url;
    if (!seen.has(key)) {
      merged.push(row);
    }
  });

  merged.sort((a, b) => {
    const aTime = a.date ? new Date(a.date).getTime() : 0;
    const bTime = b.date ? new Date(b.date).getTime() : 0;
    return bTime - aTime;
  });

  return merged;
}

function buildResult(rows, source, extra = {}) {
  const tableRows = rows;
  const tickerRows = rows.slice(0, TICKER_LIMIT);
  const cardRows = rows;

  return {
    enabled: true,
    source,
    fetchedAt: new Date().toISOString(),
    tableRows,
    tickerRows,
    cardRows,
    ...extra
  };
}

module.exports = async function () {
  const cached = readCache(CACHE_KEY);
  const cachedData = cached?.data || null;
  const fallbackRows = readLocalPresentations();
  const accessToken = process.env.CANVA_ACCESS_TOKEN;
  const designIds = parseEnvDesignIds(fallbackRows);

  if (!accessToken) {
    if (cachedData) {
      return buildResult(cachedData.tableRows || [], "cache", {
        cacheSavedAt: cached.savedAt,
        warning: "CANVA_ACCESS_TOKEN puuttuu, käytetään välimuistia."
      });
    }
    return buildResult(fallbackRows, "local", {
      warning: "CANVA_ACCESS_TOKEN puuttuu, käytetään paikallisia Markdown-tiedostoja."
    });
  }

  if (!designIds.length) {
    if (cachedData) {
      return buildResult(cachedData.tableRows || [], "cache", {
        cacheSavedAt: cached.savedAt,
        warning: "CANVA_DESIGN_IDS puuttuu, käytetään välimuistia."
      });
    }
    return buildResult(fallbackRows, "local", {
      warning: "CANVA_DESIGN_IDS puuttuu, käytetään paikallisia Markdown-tiedostoja."
    });
  }

  try {
    const liveRows = await fetchDesignsById(designIds, accessToken);
    const mergedRows = mergeWithFallback(liveRows, fallbackRows);
    const result = buildResult(mergedRows, "live");
    writeCache(CACHE_KEY, result);
    return result;
  } catch (error) {
    if (cachedData) {
      return buildResult(cachedData.tableRows || [], "cache", {
        cacheSavedAt: cached.savedAt,
        error: error.message
      });
    }
    return buildResult(fallbackRows, "local", {
      error: error.message
    });
  }
};

const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(process.cwd(), ".cache", "api-fallback");
const OFFLINE_FETCH_ENV_KEYS = [
  "PLAYWRIGHT_A11Y_OFFLINE",
  "ELEVENTY_OFFLINE",
  "A11Y_OFFLINE",
  "NO_NETWORK"
];

function cachePath(key) {
  return path.join(CACHE_DIR, `${key}.json`);
}

function readCache(key) {
  try {
    const file = cachePath(key);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !("data" in parsed)) return null;
    return parsed;
  } catch (error) {
    console.warn(`[api-cache] Failed reading cache '${key}': ${error.message}`);
    return null;
  }
}

/**
 * Palauttaa välimuistin jos se on alle maxAgeHours tuntia vanha, muuten null.
 */
function readCacheIfFresh(key, maxAgeHours = 6) {
  const cached = readCache(key);
  if (!cached || !cached.savedAt) return null;
  const ageMs = Date.now() - new Date(cached.savedAt).getTime();
  if (ageMs < maxAgeHours * 60 * 60 * 1000) return cached;
  return null;
}

function writeCache(key, data) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const payload = {
      savedAt: new Date().toISOString(),
      data
    };
    fs.writeFileSync(cachePath(key), JSON.stringify(payload), "utf8");
  } catch (error) {
    console.warn(`[api-cache] Failed writing cache '${key}': ${error.message}`);
  }
}

function isOfflineFetchMode() {
  return OFFLINE_FETCH_ENV_KEYS.some((key) => {
    const value = String(process.env[key] || "").trim().toLowerCase();
    return ["1", "true", "yes", "on"].includes(value);
  });
}

/**
 * fetch() aikarajalla. Heittää AbortError jos timeoutMs ylittyy.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  if (isOfflineFetchMode()) {
    throw new Error(`[offline] Network fetch skipped for ${url}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  readCache,
  readCacheIfFresh,
  writeCache,
  fetchWithTimeout,
  isOfflineFetchMode
};

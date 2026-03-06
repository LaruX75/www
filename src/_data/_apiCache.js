const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(process.cwd(), ".cache", "api-fallback");

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

module.exports = {
  readCache,
  writeCache
};

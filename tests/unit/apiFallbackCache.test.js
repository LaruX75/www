const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  cachePath,
  readCache,
  readCacheIfFresh,
  resolveCacheDir,
  writeCache
} = require("../../src/_data/_apiCache");

function makeTempRoot(prefix = "api-cache-") {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function withTempCwd(fn) {
  const previous = process.cwd();
  const next = makeTempRoot("api-cache-cwd-");
  process.chdir(next);
  try {
    return fn(next);
  } finally {
    process.chdir(previous);
    fs.rmSync(next, { recursive: true, force: true });
  }
}

function withCacheOverride(value, fn) {
  const previous = process.env.API_FALLBACK_CACHE_DIR;
  if (typeof value === "undefined") {
    delete process.env.API_FALLBACK_CACHE_DIR;
  } else {
    process.env.API_FALLBACK_CACHE_DIR = value;
  }
  try {
    return fn();
  } finally {
    if (typeof previous === "undefined") {
      delete process.env.API_FALLBACK_CACHE_DIR;
    } else {
      process.env.API_FALLBACK_CACHE_DIR = previous;
    }
  }
}

test("API fallback cache: default path stays under <cwd>/.cache/api-fallback", () => {
  withTempCwd(() => {
    withCacheOverride(undefined, () => {
      const expectedDir = path.join(process.cwd(), ".cache", "api-fallback");
      assert.equal(resolveCacheDir(), expectedDir);
      assert.equal(cachePath("demo-key"), path.join(expectedDir, "demo-key.json"));
      writeCache("demo-key", { ok: true });
      const stored = readCache("demo-key");
      assert.deepEqual(stored.data, { ok: true });
      assert.equal(fs.existsSync(path.join(expectedDir, "demo-key.json")), true);
    });
  });
});

test("API fallback cache: absolute override redirects both read and write outside cwd", () => {
  withTempCwd((cwd) => {
    const external = makeTempRoot("api-cache-external-");
    try {
      withCacheOverride(external, () => {
        writeCache("crossref-enrichments-v1", { source: "external" });
        assert.equal(resolveCacheDir(), external);
        assert.equal(
          cachePath("crossref-enrichments-v1"),
          path.join(external, "crossref-enrichments-v1.json")
        );
        const stored = readCache("crossref-enrichments-v1");
        assert.deepEqual(stored.data, { source: "external" });
        assert.equal(
          fs.existsSync(path.join(cwd, ".cache", "api-fallback", "crossref-enrichments-v1.json")),
          false
        );
      });
    } finally {
      fs.rmSync(external, { recursive: true, force: true });
    }
  });
});

test("API fallback cache: empty override uses default path", () => {
  withTempCwd(() => {
    withCacheOverride("", () => {
      assert.equal(resolveCacheDir(), path.join(process.cwd(), ".cache", "api-fallback"));
    });
  });
});

test("API fallback cache: whitespace-only override uses default path", () => {
  withTempCwd(() => {
    withCacheOverride("   ", () => {
      assert.equal(resolveCacheDir(), path.join(process.cwd(), ".cache", "api-fallback"));
    });
  });
});

test("API fallback cache: relative override resolves deterministically from cwd", () => {
  withTempCwd(() => {
    withCacheOverride(".authoring-cache/external", () => {
      const expectedDir = path.resolve(process.cwd(), ".authoring-cache/external");
      assert.equal(resolveCacheDir(), expectedDir);
      writeCache("relative-key", { ok: "relative" });
      const stored = readCacheIfFresh("relative-key", 1);
      assert.deepEqual(stored.data, { ok: "relative" });
      assert.equal(fs.existsSync(path.join(expectedDir, "relative-key.json")), true);
      assert.equal(fs.existsSync(path.join(process.cwd(), ".cache", "api-fallback", "relative-key.json")), false);
    });
  });
});

test("API fallback cache: configured write failure warns and does not fall back into repo cache", () => {
  withTempCwd((cwd) => {
    const blocked = path.join(cwd, "blocked-cache-root");
    fs.writeFileSync(blocked, "not a directory", "utf8");

    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (message) => warnings.push(String(message));

    try {
      withCacheOverride(blocked, () => {
        writeCache("blocked-key", { blocked: true });
        assert.equal(readCache("blocked-key"), null);
      });
    } finally {
      console.warn = originalWarn;
    }

    assert.ok(warnings.some((message) => message.includes("Failed writing cache 'blocked-key'")));
    assert.equal(fs.existsSync(path.join(cwd, ".cache", "api-fallback", "blocked-key.json")), false);
  });
});

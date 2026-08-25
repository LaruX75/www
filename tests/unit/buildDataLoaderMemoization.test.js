const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const THESES_MODULE_PATH = path.resolve(__dirname, "../../src/_data/theses.js");
const RESEARCHFI_MODULE_PATH = path.resolve(__dirname, "../../src/_data/researchfi.js");

function captureConsole(methodName, callback) {
  const original = console[methodName];
  const entries = [];
  console[methodName] = (...args) => {
    entries.push(args.map((value) => String(value)).join(" "));
  };

  return Promise.resolve()
    .then(() => callback(entries))
    .finally(() => {
      console[methodName] = original;
    });
}

function reloadModule(modulePath) {
  delete require.cache[modulePath];
  return require(modulePath);
}

describe("build data loader memoization", () => {
  test("theses loader shares one Promise across concurrent callers", async () => {
    const previousCacheOnly = process.env.CACHE_ONLY;
    process.env.CACHE_ONLY = "true";

    try {
      await captureConsole("log", async (logs) => {
        const loadTheses = reloadModule(THESES_MODULE_PATH);
        const firstPromise = loadTheses();
        const secondPromise = loadTheses();
        const thirdPromise = loadTheses();

        assert.strictEqual(firstPromise, secondPromise);
        assert.strictEqual(firstPromise, thirdPromise);

        const [firstResult, secondResult, thirdResult] = await Promise.all([
          firstPromise,
          secondPromise,
          thirdPromise
        ]);

        assert.deepStrictEqual(secondResult, firstResult);
        assert.deepStrictEqual(thirdResult, firstResult);

        const startCount = logs.filter((entry) => entry.includes("[theses] Haetaan opinnäytetöitä OuluREPO:sta...")).length;
        assert.equal(startCount, 1);
      });
    } finally {
      if (previousCacheOnly === undefined) {
        delete process.env.CACHE_ONLY;
      } else {
        process.env.CACHE_ONLY = previousCacheOnly;
      }
      delete require.cache[THESES_MODULE_PATH];
    }
  });

  test("researchfi loader shares one Promise across concurrent callers", async () => {
    const previousCacheOnly = process.env.CACHE_ONLY;
    process.env.CACHE_ONLY = "true";

    try {
      await captureConsole("log", async (logs) => {
        const loadResearchfi = reloadModule(RESEARCHFI_MODULE_PATH);
        const firstPromise = loadResearchfi();
        const secondPromise = loadResearchfi();
        const thirdPromise = loadResearchfi();

        assert.strictEqual(firstPromise, secondPromise);
        assert.strictEqual(firstPromise, thirdPromise);

        const [firstResult, secondResult, thirdResult] = await Promise.all([
          firstPromise,
          secondPromise,
          thirdPromise
        ]);

        assert.deepStrictEqual(secondResult, firstResult);
        assert.deepStrictEqual(thirdResult, firstResult);

        const startCount = logs.filter((entry) => entry.includes("Haetaan julkaisuja Research.fi:stä...")).length;
        assert.equal(startCount, 1);
      });
    } finally {
      if (previousCacheOnly === undefined) {
        delete process.env.CACHE_ONLY;
      } else {
        process.env.CACHE_ONLY = previousCacheOnly;
      }
      delete require.cache[RESEARCHFI_MODULE_PATH];
    }
  });
});

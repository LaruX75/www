/**
 * THESIS-HUB-02 regression tests.
 *
 * Guards the three properties that the hub restructure depends on:
 *   1. normalizeIssuedDate preserves source precision (never fabricates
 *      January 1 for year-only records).
 *   2. compareThesisDetailChronology sorts by real publication date
 *      when both records have day/month precision, then falls back to
 *      year, then title, then id.
 *   3. buildCanonicalThesisDetailsModel emits advisedMasters /
 *      advisedBachelors / reviewed groups whose first item equals the
 *      first item the corresponding /opinnaytteet/<group>/ archive
 *      renders — the hub-first-5 invariant.
 *   4. The known thesis 10024/61633 lands in advisedMasters.
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeIssuedDate,
  compareThesisDetailChronology,
  buildCanonicalThesisDetailsModel
} = require("../../src/_data/thesisDetails");

const loadThesisDetails = require("../../src/_data/thesisDetails");
const {
  buildThesesArchivePages
} = require("../../src/_utils/thesesArchivePages");

const {
  isThesesCacheSchemaValid,
  countIssuedDateCoverage,
  CACHE_MIN_ISSUED_DATE_COVERAGE
} = require("../../src/_data/theses");
const fs = require("node:fs");
const path = require("node:path");

describe("normalizeIssuedDate", () => {
  test("day precision returns full ISO-shape sort key", () => {
    const norm = normalizeIssuedDate("2026-05-07");
    assert.equal(norm.precision, "day");
    assert.equal(norm.sortKey, "2026-05-07");
    assert.equal(norm.raw, "2026-05-07");
  });

  test("day precision accepts ISO with time suffix", () => {
    const norm = normalizeIssuedDate("2025-11-30T00:00:00Z");
    assert.equal(norm.precision, "day");
    assert.equal(norm.sortKey, "2025-11-30");
  });

  test("month precision returns YYYY-MM", () => {
    const norm = normalizeIssuedDate("2024-08");
    assert.equal(norm.precision, "month");
    assert.equal(norm.sortKey, "2024-08");
  });

  test("year precision returns YYYY (no fabricated Jan 1)", () => {
    const norm = normalizeIssuedDate("2022");
    assert.equal(norm.precision, "year");
    assert.equal(norm.sortKey, "2022");
  });

  test("empty / non-date returns none precision + empty sortKey", () => {
    assert.deepEqual(normalizeIssuedDate(""), { precision: "none", sortKey: "", raw: "" });
    assert.deepEqual(normalizeIssuedDate(null), { precision: "none", sortKey: "", raw: "" });
    const nonDate = normalizeIssuedDate("not-a-date");
    assert.equal(nonDate.precision, "none");
    assert.equal(nonDate.sortKey, "");
  });
});

describe("compareThesisDetailChronology", () => {
  const mk = (issuedSortKey, year, title, id) => ({ issuedSortKey, year, title, id });

  test("same year, different day: newer day sorts first", () => {
    const older = mk("2026-01-15", "2026", "Alpha", "a");
    const newer = mk("2026-08-30", "2026", "Zulu", "z");
    const sorted = [older, newer].sort(compareThesisDetailChronology);
    assert.equal(sorted[0].id, "z");
    assert.equal(sorted[1].id, "a");
  });

  test("same year, different month: newer month sorts first", () => {
    const older = mk("2026-02", "2026", "Alpha", "a");
    const newer = mk("2026-11", "2026", "Zulu", "z");
    const sorted = [older, newer].sort(compareThesisDetailChronology);
    assert.equal(sorted[0].id, "z");
  });

  test("year-only records tie on year and fall back to title (fi locale)", () => {
    const a = mk("2024", "2024", "Ökö", "a");
    const b = mk("2024", "2024", "Alfa", "b");
    const sorted = [a, b].sort(compareThesisDetailChronology);
    assert.equal(sorted[0].id, "b"); // "Alfa" precedes "Ökö"
  });

  test("mixed precision: day-precision record with newer year still wins", () => {
    const older = mk("2020-12-31", "2020", "Alpha", "a");
    const newer = mk("2026", "2026", "Zulu", "z");
    const sorted = [older, newer].sort(compareThesisDetailChronology);
    assert.equal(sorted[0].id, "z");
    assert.equal(sorted[0].year, "2026");
  });

  test("full tie on year+title falls back to stable id", () => {
    const a = mk("2024", "2024", "Same", "b");
    const b = mk("2024", "2024", "Same", "a");
    const sorted = [a, b].sort(compareThesisDetailChronology);
    assert.equal(sorted[0].id, "a");
  });

  test("year-only vs same-year with month: month-precision record wins", () => {
    const yearOnly = mk("2025", "2025", "Alpha", "y");
    const withMonth = mk("2025-03", "2025", "Bravo", "m");
    const sorted = [yearOnly, withMonth].sort(compareThesisDetailChronology);
    // "2025-03" > "2025" lexicographically
    assert.equal(sorted[0].id, "m");
  });
});

describe("buildCanonicalThesisDetailsModel groupings", () => {
  const makeThesis = (overrides = {}) => ({
    title: "Sample thesis",
    year: "2024",
    authors: ["A. Author"],
    type: "masterThesis",
    link: `https://oulurepo.oulu.fi/handle/10024/${overrides.id || "10000"}`,
    abstract: "abstract",
    language: "fin",
    issuedDate: "2024-06-01",
    ...overrides
  });

  test("emits advisedMasters / advisedBachelors / reviewed arrays", () => {
    const model = buildCanonicalThesisDetailsModel({
      gradut: [
        makeThesis({ id: "1", type: "masterThesis", issuedDate: "2026-05-01" }),
        makeThesis({ id: "2", type: "bachelorThesis", issuedDate: "2026-06-01" })
      ],
      kandit: [
        makeThesis({ id: "3", type: "bachelorThesis", issuedDate: "2025-04-01" })
      ],
      reviewerOnly: [
        makeThesis({ id: "4", type: "masterThesis", issuedDate: "2023-01-01" })
      ]
    });

    assert.equal(model.advisedMasters.length, 1);
    assert.equal(model.advisedMasters[0].id, "1");

    assert.equal(model.advisedBachelors.length, 2);
    assert.equal(model.advisedBachelors[0].id, "2"); // 2026 before 2025
    assert.equal(model.advisedBachelors[1].id, "3");

    assert.equal(model.reviewed.length, 1);
    assert.equal(model.reviewed[0].id, "4");
    assert.equal(model.reviewed[0].thesisRole, "reviewed");
  });

  test("groups are pre-sorted by the canonical chronology comparator", () => {
    const model = buildCanonicalThesisDetailsModel({
      gradut: [
        makeThesis({ id: "1001", type: "masterThesis", issuedDate: "2020-01-01" }),
        makeThesis({ id: "1002", type: "masterThesis", issuedDate: "2026-08-30" }),
        makeThesis({ id: "1003", type: "masterThesis", issuedDate: "2023-05-15" })
      ],
      kandit: [],
      reviewerOnly: []
    });

    assert.deepEqual(
      model.advisedMasters.map((item) => item.id),
      ["1002", "1003", "1001"]
    );
  });

  test("advised MINUS reviewed (reviewed thesis promoted to advised elsewhere is not duplicated)", () => {
    // Same source URL appearing in both gradut and reviewerOnly is
    // deduplicated by the canonical collector; the FIRST role wins.
    const link = "https://oulurepo.oulu.fi/handle/10024/12345";
    const model = buildCanonicalThesisDetailsModel({
      gradut: [{ ...makeThesis({ id: "12345", type: "masterThesis", issuedDate: "2024-01-01" }), link }],
      kandit: [],
      reviewerOnly: [{ ...makeThesis({ id: "12345", type: "masterThesis", issuedDate: "2024-01-01" }), link }]
    });
    assert.equal(model.count, 1);
    assert.equal(model.advisedMasters.length, 1);
    assert.equal(model.reviewed.length, 0);
  });
});

describe("hub-first-5 invariant (subarchive first page == hub section)", () => {
  test("advisedMasters first 5 == /opinnaytteet/gradut/ first page (from cache)", async () => {
    process.env.CACHE_ONLY = "true";
    const model = await loadThesisDetails();
    const hubFirst5 = model.advisedMasters.slice(0, 5).map((item) => item.id);

    const archive = buildThesesArchivePages(model.advisedMasters, {
      scope: "fi-gradut",
      lang: "fi",
      landingPermalink: "/opinnaytteet/gradut/",
      paginatedBasePermalink: "/opinnaytteet/gradut/sivu/"
    });
    const archiveFirst5 = archive.pages[0].visibleRows
      .slice(0, 5)
      .map((row) => {
        // Row.pageUrl is /opinnaytteet/<id>/
        const match = row.pageUrl.match(/\/opinnaytteet\/([^/]+)\/$/);
        return match ? match[1] : row.title;
      });

    assert.deepEqual(archiveFirst5, hubFirst5);
  });

  test("advisedBachelors first 5 == /opinnaytteet/kandit/ first page (from cache)", async () => {
    process.env.CACHE_ONLY = "true";
    const model = await loadThesisDetails();
    const hubFirst5 = model.advisedBachelors.slice(0, 5).map((item) => item.id);

    const archive = buildThesesArchivePages(model.advisedBachelors, {
      scope: "fi-kandit",
      lang: "fi",
      landingPermalink: "/opinnaytteet/kandit/",
      paginatedBasePermalink: "/opinnaytteet/kandit/sivu/"
    });
    const archiveFirst5 = archive.pages[0].visibleRows
      .slice(0, 5)
      .map((row) => {
        const match = row.pageUrl.match(/\/opinnaytteet\/([^/]+)\/$/);
        return match ? match[1] : row.title;
      });

    assert.deepEqual(archiveFirst5, hubFirst5);
  });
});

describe("regression: known thesis 10024/61633", () => {
  test("classifies as advisedMasters (masterThesis + advised) and stays discoverable", async () => {
    process.env.CACHE_ONLY = "true";
    const model = await loadThesisDetails();

    const target = model.byId["61633"];
    assert.ok(target, "thesis 61633 must exist in the canonical detail model");
    assert.equal(target.thesisType, "masterThesis");
    assert.equal(target.thesisRole, "advised");

    const inMasters = model.advisedMasters.some((item) => item.id === "61633");
    assert.ok(inMasters, "thesis 61633 must appear in advisedMasters (renders on /opinnaytteet/gradut/)");
  });
});

// THESIS-HUB-02: cache schema regression. A cache serialized before the
// `issuedDate` field existed must not be silently accepted, because the
// canonical chronology comparator would then fall back to year+title
// and the hub would claim chronological ordering while continuing the
// pre-fix title-order behavior in production.
describe("cache schema guard (issuedDate coverage)", () => {
  test("empty cache is considered valid (bootstrap case)", () => {
    assert.equal(isThesesCacheSchemaValid({ gradut: [], kandit: [], reviewerOnly: [] }), true);
  });

  test("pre-THESIS-HUB-02 cache (no issuedDate anywhere) is REJECTED", () => {
    const preFieldCache = {
      gradut: [{ title: "T", year: "2026", link: "https://oulurepo.oulu.fi/handle/10024/1", type: "masterThesis" }],
      kandit: [{ title: "T2", year: "2025", link: "https://oulurepo.oulu.fi/handle/10024/2", type: "bachelorThesis" }],
      reviewerOnly: [{ title: "T3", year: "2024", link: "https://oulurepo.oulu.fi/handle/10024/3", type: "masterThesis" }]
    };
    const { total, withIssuedDate } = countIssuedDateCoverage(preFieldCache);
    assert.equal(total, 3);
    assert.equal(withIssuedDate, 0);
    assert.equal(isThesesCacheSchemaValid(preFieldCache), false,
      "a cache with 0/3 issuedDate coverage must be treated as invalid so live fetch runs");
  });

  test("cache with 100% coverage is accepted", () => {
    const goodCache = {
      gradut: [{ title: "T", year: "2026", issuedDate: "2026-06-01", link: "https://oulurepo.oulu.fi/handle/10024/1", type: "masterThesis" }],
      kandit: [{ title: "T2", year: "2025", issuedDate: "2025-05-15", link: "https://oulurepo.oulu.fi/handle/10024/2", type: "bachelorThesis" }],
      reviewerOnly: []
    };
    assert.equal(isThesesCacheSchemaValid(goodCache), true);
  });

  test("threshold: 80% coverage is accepted; below is rejected", () => {
    // 4/5 = 80% exactly — accepted
    const at80 = {
      gradut: [
        { title: "A", year: "2026", issuedDate: "2026-01-01", link: "https://oulurepo.oulu.fi/handle/10024/1", type: "masterThesis" },
        { title: "B", year: "2026", issuedDate: "2026-02-01", link: "https://oulurepo.oulu.fi/handle/10024/2", type: "masterThesis" },
        { title: "C", year: "2026", issuedDate: "2026-03-01", link: "https://oulurepo.oulu.fi/handle/10024/3", type: "masterThesis" },
        { title: "D", year: "2026", issuedDate: "2026-04-01", link: "https://oulurepo.oulu.fi/handle/10024/4", type: "masterThesis" },
        { title: "E", year: "2026", link: "https://oulurepo.oulu.fi/handle/10024/5", type: "masterThesis" }
      ],
      kandit: [],
      reviewerOnly: []
    };
    assert.equal(CACHE_MIN_ISSUED_DATE_COVERAGE, 0.8);
    assert.equal(isThesesCacheSchemaValid(at80), true);

    // 2/5 = 40% — rejected
    const at40 = { ...at80, gradut: at80.gradut.map((t, i) => i < 2 ? t : { ...t, issuedDate: undefined }) };
    assert.equal(isThesesCacheSchemaValid(at40), false);
  });

  test("current committed cache passes the schema guard", () => {
    // Load the actual committed cache and prove it carries issuedDate
    // for enough records to satisfy the guard. Guarantees the first
    // post-merge production build (which reads this cache when the
    // network is down, or via CACHE_ONLY) does not silently degrade.
    const cachePath = path.join(__dirname, "..", "..", ".cache", "api-fallback", "theses-oulurepo-v2.json");
    if (!fs.existsSync(cachePath)) return; // repo without the cache file — skip
    const payload = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    assert.ok(payload?.data, "cache payload must expose data");
    const { total, withIssuedDate } = countIssuedDateCoverage(payload.data);
    assert.ok(total > 0, "committed cache must contain thesis records");
    assert.ok(
      isThesesCacheSchemaValid(payload.data),
      `committed cache must satisfy THESIS-HUB-02 schema guard (got ${withIssuedDate}/${total} = ${Math.round(100*withIssuedDate/total)}% issuedDate coverage; threshold ${Math.round(100*CACHE_MIN_ISSUED_DATE_COVERAGE)}%)`
    );
  });
});

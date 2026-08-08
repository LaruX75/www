/**
 * Node-testit src/_utils/contentPresets.js:lle.
 * Aja: `node scripts/test-content-engine.js` (exit 0 = kaikki OK).
 */

const assert = require("assert");
const cp = require("../src/_utils/contentPresets");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("  ✓ " + name);
  } catch (err) {
    failed += 1;
    console.log("  ✗ " + name);
    console.log("    " + (err.stack || err.message));
  }
}

function suite(name, fn) {
  console.log("\n" + name);
  fn();
}

// -----------------------------------------------------------------------------
// Mock-data: Eleventy-collection-tyyliset itemit
// -----------------------------------------------------------------------------
const mockCollections = {
  publications: [
    {
      inputPath: "./src/publications/opinion-1.md",
      url: "/publications/opinion-1/",
      date: new Date("2026-05-10"),
      data: {
        title: "Tekoäly opetuksessa",
        description: "Kirjoitus tekoälyn roolista.",
        type: "mielipide",
        publication: "Kaleva",
        categories: ["tekoäly", "opetus"],
        writingRoles: ["expert"],
        lang: "fi"
      }
    },
    {
      inputPath: "./src/publications/opinion-2.md",
      url: "/publications/opinion-2/",
      date: new Date("2025-03-01"),
      data: {
        title: "Palveluverkko",
        description: "Kannanotto kouluverkkoon.",
        type: "mielipide",
        publication: "Kaleva",
        categories: ["palveluverkko"],
        writingRoles: ["political"],
        lang: "fi"
      }
    },
    {
      inputPath: "./src/publications/column-1.md",
      url: "/publications/column-1/",
      date: new Date("2024-11-11"),
      data: {
        title: "Väitöskirjan yhteenveto",
        type: "kolumni",
        publication: "Kaleva",
        categories: ["tekoäly"],
        writingRoles: ["expert", "political"],
        lang: "fi"
      }
    }
  ],
  blog: [
    {
      inputPath: "./src/blog/post-1.md",
      url: "/blog/post-1/",
      date: new Date("2026-06-01"),
      data: {
        title: "Blogipostaus 1",
        categories: ["opetus"],
        lang: "fi"
      }
    }
  ],
  politics: [
    {
      inputPath: "./src/politics/init-1.md",
      url: "/politics/init-1/",
      date: new Date("2024-01-05"),
      data: {
        title: "Aloite palveluverkosta",
        initiative_type: "valtuustoaloite",
        categories: ["palveluverkko"],
        lang: "fi"
      }
    }
  ]
};

// -----------------------------------------------------------------------------
// Mock-data: normalisoidut record-formaatti (kuten /data/*.json)
// -----------------------------------------------------------------------------
const mockRecords = [
  {
    id: "/a/", url: "/a/", title: "Tekoäly opetuksessa", description: "Kirjoitus.",
    date: "2026-05-10", year: 2026, lang: "fi",
    contentType: "opinion", publication: "Kaleva",
    categories: ["tekoäly", "opetus"], writingRoles: ["expert"]
  },
  {
    id: "/b/", url: "/b/", title: "Palveluverkko", description: "Kouluverkosta.",
    date: "2025-03-01", year: 2025, lang: "fi",
    contentType: "opinion", publication: "Kaleva",
    categories: ["palveluverkko"], writingRoles: ["political"]
  },
  {
    id: "/c/", url: "/c/", title: "Blog", description: "",
    date: "2026-06-01", year: 2026, lang: "fi",
    contentType: "blogPost", categories: ["opetus"]
  },
  {
    id: "/d/", url: "/d/", title: "AI in schools", description: "",
    date: "2026-04-01", year: 2026, lang: "en",
    contentType: "blogPost", categories: ["ai"]
  }
];

// -----------------------------------------------------------------------------
suite("KIND_MATCHERS", function () {
  const m = cp.KIND_MATCHERS;

  test("eq matches equal values", function () {
    assert.strictEqual(m.eq("fi", "fi"), true);
    assert.strictEqual(m.eq("fi", "en"), false);
  });

  test("eq accepts array as OR-list", function () {
    assert.strictEqual(m.eq("fi", ["fi", "en"]), true);
    assert.strictEqual(m.eq("sv", ["fi", "en"]), false);
  });

  test("oneOf accepts string or array filter value", function () {
    assert.strictEqual(m.oneOf("opinion", "opinion"), true);
    assert.strictEqual(m.oneOf("opinion", ["opinion", "column"]), true);
    assert.strictEqual(m.oneOf("blog", ["opinion", "column"]), false);
    assert.strictEqual(m.oneOf(null, "opinion"), false);
  });

  test("anyOf checks array-intersection non-emptiness", function () {
    assert.strictEqual(m.anyOf(["tekoäly", "opetus"], "tekoäly"), true);
    assert.strictEqual(m.anyOf(["tekoäly", "opetus"], ["muut", "tekoäly"]), true);
    assert.strictEqual(m.anyOf(["opetus"], ["tekoäly"]), false);
    assert.strictEqual(m.anyOf([], "tekoäly"), false);
  });

  test("yearRange supports number, array, and { min, max }", function () {
    assert.strictEqual(m.yearRange(2026, 2026), true);
    assert.strictEqual(m.yearRange(2026, 2025), false);
    assert.strictEqual(m.yearRange(2026, [2025, 2026]), true);
    assert.strictEqual(m.yearRange(2024, [2025, 2026]), false);
    assert.strictEqual(m.yearRange(2026, { min: 2025 }), true);
    assert.strictEqual(m.yearRange(2024, { min: 2025 }), false);
    assert.strictEqual(m.yearRange(2026, { max: 2025 }), false);
    assert.strictEqual(m.yearRange(2025, { min: 2020, max: 2025 }), true);
    assert.strictEqual(m.yearRange(null, 2026), false);
  });
});

// -----------------------------------------------------------------------------
suite("FIELD_RULES.getFromEleventy", function () {
  const r = cp.FIELD_RULES;
  const opinion = mockCollections.publications[0];
  const initiative = mockCollections.politics[0];

  test("contentType resolves from legacy type (mielipide → opinion)", function () {
    assert.strictEqual(r.contentType.getFromEleventy(opinion), "opinion");
  });

  test("contentType resolves from inputPath (/politics/ → initiative)", function () {
    assert.strictEqual(r.contentType.getFromEleventy(initiative), "initiative");
  });

  test("year extracts from item.date", function () {
    assert.strictEqual(r.year.getFromEleventy(opinion), 2026);
  });

  test("categories normalizes array", function () {
    assert.deepStrictEqual(
      r.categories.getFromEleventy(opinion),
      ["tekoäly", "opetus"]
    );
  });

  test("writingRoles falls back to opinionRoles when needed", function () {
    const item = { data: { opinionRoles: ["political"] } };
    assert.deepStrictEqual(r.writingRoles.getFromEleventy(item), ["political"]);
  });

  test("lang defaults to fi", function () {
    assert.strictEqual(r.lang.getFromEleventy({ data: {} }), "fi");
    assert.strictEqual(r.lang.getFromEleventy({ data: { lang: "en" } }), "en");
  });
});

// -----------------------------------------------------------------------------
suite("FIELD_RULES.getFromRecord", function () {
  const r = cp.FIELD_RULES;
  const rec = mockRecords[0];

  test("contentType from record", function () {
    assert.strictEqual(r.contentType.getFromRecord(rec), "opinion");
  });

  test("year from record", function () {
    assert.strictEqual(r.year.getFromRecord(rec), 2026);
  });

  test("categories from record", function () {
    assert.deepStrictEqual(r.categories.getFromRecord(rec), ["tekoäly", "opetus"]);
  });

  test("returns null if missing", function () {
    assert.strictEqual(r.publication.getFromRecord({}), null);
  });
});

// -----------------------------------------------------------------------------
suite("applyPresetToCollection (Node)", function () {
  test("filters publications by contentType=opinion", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      filters: { contentType: "opinion" }
    });
    assert.strictEqual(items.length, 2);
    assert.strictEqual(items[0].data.type, "mielipide");
  });

  test("filters by year", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      filters: { year: 2025 }
    });
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].data.title, "Palveluverkko");
  });

  test("filters by year range { min }", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      filters: { year: { min: 2025 } }
    });
    assert.strictEqual(items.length, 2);
  });

  test("filters by categories (anyOf)", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      filters: { categories: ["tekoäly"] }
    });
    assert.strictEqual(items.length, 2);
  });

  test("filters by writingRoles", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      filters: { writingRoles: "expert" }
    });
    assert.strictEqual(items.length, 2);
  });

  test("filters by publication (eq)", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      filters: { publication: "Kaleva" }
    });
    assert.strictEqual(items.length, 3);
  });

  test("sort=date-desc puts newest first", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      sort: "date-desc"
    });
    assert.strictEqual(items[0].data.title, "Tekoäly opetuksessa");
    assert.strictEqual(items[2].data.title, "Väitöskirjan yhteenveto");
  });

  test("sort=date-asc puts oldest first", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      sort: "date-asc"
    });
    assert.strictEqual(items[0].data.title, "Väitöskirjan yhteenveto");
  });

  test("limit slices result", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      sort: "date-desc",
      limit: 2
    });
    assert.strictEqual(items.length, 2);
  });

  test("offset skips items", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      sort: "date-desc",
      offset: 1,
      limit: 1
    });
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].data.title, "Palveluverkko");
  });

  test("supports source=blog", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "blog"
    });
    assert.strictEqual(items.length, 1);
  });

  test("supports source=politics with initiativeType filter", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "politics",
      filters: { initiativeType: "valtuustoaloite" }
    });
    assert.strictEqual(items.length, 1);
  });

  test("Nunjucks-tyylin overrides yhdistyvat spec:iin", function () {
    // Simulate: preset("name") returns 10 items, but caller says { limit: 2 }
    const base = { source: "publications", sort: "date-desc", limit: 10 };
    const items = cp.applyPresetToCollection(mockCollections, base, { limit: 2 });
    assert.strictEqual(items.length, 2);
  });

  test("throws on unknown source (no Eleventy-collection binding)", function () {
    assert.throws(function () {
      cp.applyPresetToCollection(mockCollections, { source: "researchfi" });
    }, /no Eleventy-collection binding/);
  });

  test("throws on unknown filter field", function () {
    assert.throws(function () {
      cp.applyPresetToCollection(mockCollections, {
        source: "publications",
        filters: { garbage: "x" }
      });
    }, /unknown filter field/);
  });

  test("throws on unknown sort", function () {
    assert.throws(function () {
      cp.applyPresetToCollection(mockCollections, {
        source: "publications",
        sort: "banana"
      });
    }, /unknown sort/);
  });

  test("ignores search parameter (SSR does not search)", function () {
    const items = cp.applyPresetToCollection(mockCollections, {
      source: "publications",
      search: "täysin puuttuva teksti xyz123"
    });
    assert.strictEqual(items.length, 3); // Kaikki mukana, search ohitettu
  });
});

// -----------------------------------------------------------------------------
suite("queryPreset (browser)", function () {
  test("filters records by contentType", function () {
    const r = cp.queryPreset(mockRecords, {
      source: "content",
      filters: { contentType: ["blogPost"] }
    });
    assert.strictEqual(r.items.length, 2);
    assert.strictEqual(r.total, 2);
  });

  test("filters records by lang", function () {
    const r = cp.queryPreset(mockRecords, {
      source: "content",
      filters: { lang: "en" }
    });
    assert.strictEqual(r.items.length, 1);
  });

  test("search matches title tokens (diakriitit poistettu)", function () {
    // "tekoäly" -> "tekoaly" tokenisoituna, matchaa "Tekoäly opetuksessa" -> "tekoaly opetuksessa"
    const r = cp.queryPreset(mockRecords, {
      source: "content",
      search: "tekoäly"
    });
    assert.strictEqual(r.items.length, 1);
    assert.strictEqual(r.items[0].title, "Tekoäly opetuksessa");
  });

  test("search matches keyword in categories", function () {
    const r = cp.queryPreset(mockRecords, {
      source: "content",
      search: "palveluverkko"
    });
    assert.strictEqual(r.items.length, 1);
  });

  test("returns metadata (total, offset, limit, source)", function () {
    const r = cp.queryPreset(mockRecords, {
      source: "content",
      sort: "date-desc",
      limit: 2
    });
    assert.strictEqual(r.total, 4);
    assert.strictEqual(r.offset, 0);
    assert.strictEqual(r.limit, 2);
    assert.strictEqual(r.source, "content");
    assert.strictEqual(r.items.length, 2);
  });

  test("offset and limit slice correctly", function () {
    const r = cp.queryPreset(mockRecords, {
      source: "content",
      sort: "date-desc",
      offset: 1,
      limit: 2
    });
    assert.strictEqual(r.items.length, 2);
    assert.strictEqual(r.items[0].title, "Tekoäly opetuksessa"); // 2026-05
  });

  test("throws on unknown filter field", function () {
    assert.throws(function () {
      cp.queryPreset(mockRecords, {
        source: "content",
        filters: { unknownField: "x" }
      });
    }, /unknown filter field/);
  });
});

// -----------------------------------------------------------------------------
suite("Thesis-kentat (browser-only)", function () {
  const mockTheses = [
    { url: "/t1", title: "Gradu 1", year: 2025, contentType: "thesis",
      thesisRole: "advised", thesisType: "masterThesis",
      researchLine: "let", researchThemes: ["ai", "learning"] },
    { url: "/t2", title: "Kandi 1", year: 2024, contentType: "thesis",
      thesisRole: "advised", thesisType: "bachelorThesis",
      researchLine: "opettajankoulutus", researchThemes: ["teacher-education"] },
    { url: "/t3", title: "Reviewed 1", year: 2023, contentType: "thesis",
      thesisRole: "reviewed", thesisType: "masterThesis" }
  ];

  test("thesisRole=advised filters correctly", function () {
    const r = cp.queryPreset(mockTheses, {
      source: "theses",
      filters: { thesisRole: "advised" }
    });
    assert.strictEqual(r.items.length, 2);
  });

  test("thesisRole + thesisType kombinointi (AND)", function () {
    const r = cp.queryPreset(mockTheses, {
      source: "theses",
      filters: { thesisRole: "advised", thesisType: "masterThesis" }
    });
    assert.strictEqual(r.items.length, 1);
    assert.strictEqual(r.items[0].title, "Gradu 1");
  });

  test("researchLine=let matches one", function () {
    const r = cp.queryPreset(mockTheses, {
      source: "theses",
      filters: { researchLine: "let" }
    });
    assert.strictEqual(r.items.length, 1);
  });

  test("researchThemes anyOf matches array-intersection", function () {
    const r = cp.queryPreset(mockTheses, {
      source: "theses",
      filters: { researchThemes: ["ai"] }
    });
    assert.strictEqual(r.items.length, 1);
    assert.strictEqual(r.items[0].title, "Gradu 1");
  });
});

// -----------------------------------------------------------------------------
suite("Isomorphic exports", function () {
  test("exports contain public API", function () {
    assert.ok(typeof cp.PRESETS === "object");
    assert.ok(typeof cp.FIELD_RULES === "object");
    assert.ok(typeof cp.KIND_MATCHERS === "object");
    assert.ok(typeof cp.ENDPOINTS === "object");
    assert.ok(typeof cp.applyPresetToCollection === "function");
    assert.ok(typeof cp.queryPreset === "function");
    assert.ok(typeof cp.queryItems === "function");
  });

  test("ENDPOINTS covers content sources", function () {
    assert.ok(cp.ENDPOINTS.content);
    assert.ok(cp.ENDPOINTS.publications);
    assert.ok(cp.ENDPOINTS.theses);
  });
});

// -----------------------------------------------------------------------------
console.log("\n----");
console.log("Passed: " + passed);
console.log("Failed: " + failed);

if (failed > 0) {
  process.exit(1);
}

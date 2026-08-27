const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildOrderedValues,
  buildPresenterOptions,
  buildSearchFilters,
  collectFilterCounts
} = require("../../src/js/search-facet-availability.js");

describe("SearchFacetAvailability", () => {
  test("buildSearchFilters preserves pinned filters and adds active domain + values", () => {
    const filters = buildSearchFilters({
      pinnedFilters: { Kieli: ["Suomi"] },
      activeDomain: "Esitykset",
      activeValues: {
        PresentationYear: "2025",
        PresentationTopic: "AI literacy"
      }
    });

    assert.deepEqual(filters, {
      Kieli: ["Suomi"],
      "Sisältö": ["Esitykset"],
      PresentationYear: ["2025"],
      PresentationTopic: ["AI literacy"]
    });
  });

  test("inactive group hides zero-count values and keeps positive values", () => {
    const options = buildPresenterOptions({
      values: ["2007", "2024", "2025"],
      activeValue: "",
      currentCounts: {
        "2007": 0,
        "2024": 19,
        "2025": 32
      }
    });

    assert.deepEqual(options, [
      { value: "2024", count: 19, active: false },
      { value: "2025", count: 32, active: false }
    ]);
  });

  test("active group keeps the active zero-count value and uses replacement counts for siblings", () => {
    const options = buildPresenterOptions({
      values: ["2007", "2024", "2025"],
      activeValue: "2007",
      currentCounts: {
        "2007": 0,
        "2024": 0,
        "2025": 0
      },
      replacementCounts: {
        "2007": 0,
        "2024": 19,
        "2025": 32
      }
    });

    assert.deepEqual(options, [
      { value: "2007", count: 0, active: true },
      { value: "2024", count: 19, active: false },
      { value: "2025", count: 32, active: false }
    ]);
  });

  test("ordered values preserve known order and append replacement-only values", () => {
    const values = buildOrderedValues({
      knownValues: ["2025"],
      activeValue: "2025",
      currentCounts: {
        "2025": 1
      },
      replacementCounts: {
        "2024": 1,
        "2025": 1,
        "2026": 1
      }
    });

    assert.deepEqual(values, ["2025", "2024", "2026"]);
  });

  test("collectFilterCounts keeps other active groups as constraints and can omit the target group", () => {
    const records = [
      { filters: { PresentationYear: ["2024"], PresentationTopic: ["AI literacy"], "Sisältö": ["Esitykset"] } },
      { filters: { PresentationYear: ["2025"], PresentationTopic: ["AI literacy"], "Sisältö": ["Esitykset"] } },
      { filters: { PresentationYear: ["2026"], PresentationTopic: ["AI literacy"], "Sisältö": ["Esitykset"] } },
      { filters: { PresentationYear: ["2025"], PresentationTopic: ["Generation AI"], "Sisältö": ["Esitykset"] } }
    ];

    assert.deepEqual(
      collectFilterCounts({
        records,
        targetFilter: "PresentationYear",
        activeValues: {
          PresentationYear: "2025",
          PresentationTopic: "AI literacy"
        }
      }),
      { "2025": 1 }
    );

    assert.deepEqual(
      collectFilterCounts({
        records,
        targetFilter: "PresentationYear",
        activeValues: {
          PresentationYear: "2025",
          PresentationTopic: "AI literacy"
        },
        omitFilter: "PresentationYear"
      }),
      {
        "2024": 1,
        "2025": 1,
        "2026": 1
      }
    );
  });
});

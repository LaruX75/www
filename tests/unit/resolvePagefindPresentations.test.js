const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  projectPresentationRecord,
  resolvePagefindPresentations
} = require("../../src/src.11tydata.js");

// projectPresentationRecord is a pure function that maps an already-
// enriched canonical presentation item (as produced by
// buildCanonicalPresentationItems -> withPresentationSemantics) to the
// Pagefind {filters, meta} shape. resolvePagefindPresentations is a
// thin wrapper that does the lookup-by-page.url. Unit-testing the
// projector separately keeps these tests free of the filesystem-
// backed buildPresentationsPageSourceData.

describe("projectPresentationRecord", () => {
  test("returns null for a null/undefined item", () => {
    assert.equal(projectPresentationRecord(null), null);
    assert.equal(projectPresentationRecord(undefined), null);
  });

  test("emits Sisältö:Esitykset + FindExplore:presentations on every projected record", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/example/",
      year: 2024,
      presentationType: "keynote",
      event: "AAAI 2024",
      topics: ["tekoäly"]
    });
    assert.ok(doc.filters.some((f) => f.name === "Sisältö" && f.value === "Esitykset"));
    assert.ok(doc.filters.some((f) => f.name === "FindExplore" && f.value === "presentations"));
  });

  test("projects PresentationYear/Type/Topic filters and PresentationYear/Type/Event meta", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/example/",
      year: 2024,
      presentationType: "keynote",
      event: "AAAI 2024",
      topics: ["tekoäly", "opetus"]
    });
    assert.ok(doc.filters.some((f) => f.name === "PresentationYear" && f.value === "2024"));
    assert.ok(doc.filters.some((f) => f.name === "PresentationType" && f.value === "keynote"));
    assert.ok(doc.filters.some((f) => f.name === "PresentationTopic" && f.value === "tekoäly"));
    assert.ok(doc.filters.some((f) => f.name === "PresentationTopic" && f.value === "opetus"));
    assert.equal(doc.meta.PresentationYear, "2024");
    assert.equal(doc.meta.PresentationType, "keynote");
    assert.equal(doc.meta.PresentationEvent, "AAAI 2024");
  });

  test("emits Research context:research filter only when canonical contexts include 'research'", () => {
    const research = projectPresentationRecord({
      pageUrl: "/presentations/r/",
      year: 2024,
      presentationType: "keynote",
      contexts: ["research", "teaching"]
    });
    const nonResearch = projectPresentationRecord({
      pageUrl: "/presentations/n/",
      year: 2024,
      presentationType: "keynote",
      contexts: ["teaching"]
    });
    assert.ok(
      research.filters.some((f) => f.name === "Research context" && f.value === "research"),
      "canonical contexts including 'research' must emit Research context:research"
    );
    assert.ok(
      !nonResearch.filters.some((f) => f.name === "Research context"),
      "non-research contexts must NOT emit Research context filter"
    );
  });

  test("does NOT infer Research from topic/type/event/sourceKey — only from canonical contexts", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/looks-like-research/",
      year: 2024,
      presentationType: "keynote",
      event: "Research conference on AI in education",
      topics: ["tekoäly", "tutkimus"], // topics that could be topic-inferred elsewhere
      contexts: [] // but NO research context in canonical → NO Research filter
    });
    assert.ok(
      !doc.filters.some((f) => f.name === "Research context"),
      "topic/event heuristics must NOT admit a record without canonical contexts:['research']"
    );
  });

  test("omits meta keys for missing optional fields — never emits undefined values", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/minimal/",
      year: 2025
      // no presentationType, no event
    });
    assert.equal(doc.meta.PresentationYear, "2025");
    assert.equal("PresentationType" in doc.meta, false,
      "missing presentationType must be absent, not projected as 'undefined'");
    assert.equal("PresentationEvent" in doc.meta, false,
      "missing event must be absent, not projected as 'undefined'");
  });

  test("guards against undefined/empty year — no PresentationYear filter or meta", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/no-year/",
      presentationType: "keynote"
    });
    assert.ok(
      !doc.filters.some((f) => f.name === "PresentationYear"),
      "missing year must NOT emit PresentationYear filter"
    );
    assert.equal("PresentationYear" in doc.meta, false);
  });

  test("caps topics at 6 (normalizeFilterValues limit) and deduplicates", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/many-topics/",
      year: 2024,
      presentationType: "keynote",
      topics: ["a", "b", "c", "d", "e", "f", "g", "h", "a", "b"]
    });
    const topicCount = doc.filters.filter((f) => f.name === "PresentationTopic").length;
    assert.ok(topicCount <= 6, `PresentationTopic must be capped at 6, got ${topicCount}`);
    assert.ok(topicCount >= 6, `PresentationTopic must retain up to 6 distinct topics, got ${topicCount}`);
  });
});

describe("resolvePagefindPresentations", () => {
  test("returns null when data has no page.url", () => {
    assert.equal(resolvePagefindPresentations({}), null);
    assert.equal(resolvePagefindPresentations({ page: {} }), null);
  });

  test("returns null when page.url does not correspond to any indexed presentation (e.g. external-first without local detail)", () => {
    // The projector's lookup only contains records with a pageUrl or
    // localPageUrl. External-first Canva/YouTube/AOE without local
    // detail cannot have any page.url that matches. This test uses a
    // manifestly-unrelated URL to prove the null-return contract
    // without depending on the filesystem lookup state.
    assert.equal(
      resolvePagefindPresentations({
        page: { url: "/blogi/some-post/" },
        collections: {}
      }),
      null
    );
  });
});

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  INTERNAL_TIMELINE_FIELDS,
  normalizeAuthoritativeDate,
  projectCanonicalTimelineItem,
  sortTimelineItems,
  groupTimelineItemsByYear,
  buildTimelineProjection
} = require("../../src/_utils/timelineProjection");

function canonicalRecord(overrides = {}) {
  return {
    id: "/blog/example/",
    pageUrl: "/blog/example/",
    title: "Example",
    date: "2026-08-20",
    contentType: "blogPost",
    contexts: ["research", "teaching"],
    categories: ["timeline"],
    keywords: ["not-used"],
    ...overrides
  };
}

describe("timelineProjection", () => {
  test("preserves canonical id, pageUrl, contentType, and contexts without leaking source object", () => {
    const projected = projectCanonicalTimelineItem(canonicalRecord(), { sourceCollection: "blog" });
    assert.equal(projected.ok, true);
    assert.deepEqual(projected.item, {
      id: "/blog/example/",
      pageUrl: "/blog/example/",
      title: "Example",
      date: "2026-08-20",
      year: 2026,
      contentType: "blogPost",
      contexts: ["research", "teaching"]
    });
    assert.deepEqual(Object.keys(projected.item).sort(), [...INTERNAL_TIMELINE_FIELDS].sort());
    assert.equal("categories" in projected.item, false);
    assert.equal("keywords" in projected.item, false);
    assert.equal("sourceDomain" in projected.item, false);
    assert.equal("sourceCollection" in projected.item, false);
  });

  test("normalizes authoritative Date objects deterministically", () => {
    const normalized = normalizeAuthoritativeDate(new Date("2024-02-03T12:45:00.000Z"));
    assert.deepEqual(normalized, {
      ok: true,
      reason: null,
      date: "2024-02-03",
      year: 2024
    });
  });

  test("normalizes ISO-like date strings and derives year", () => {
    const projected = projectCanonicalTimelineItem(
      canonicalRecord({ date: "2025-01-02T10:11:12.000Z" }),
      { sourceCollection: "politics" }
    );
    assert.equal(projected.ok, true);
    assert.equal(projected.item.date, "2025-01-02");
    assert.equal(projected.item.year, 2025);
  });

  test("sorts newest-first and uses pageUrl as deterministic tie-break", () => {
    const items = sortTimelineItems([
      projectCanonicalTimelineItem(canonicalRecord({ id: "b", pageUrl: "/b/", date: "2025-05-05" }), { sourceCollection: "blog" }).item,
      projectCanonicalTimelineItem(canonicalRecord({ id: "a", pageUrl: "/a/", date: "2026-05-05" }), { sourceCollection: "blog" }).item,
      projectCanonicalTimelineItem(canonicalRecord({ id: "c", pageUrl: "/c/", date: "2026-05-05" }), { sourceCollection: "blog" }).item
    ]);

    assert.deepEqual(items.map((item) => item.pageUrl), ["/a/", "/c/", "/b/"]);
  });

  test("groups projected items by year after deterministic sorting", () => {
    const groups = groupTimelineItemsByYear([
      projectCanonicalTimelineItem(canonicalRecord({ id: "b", pageUrl: "/b/", date: "2025-05-05" }), { sourceCollection: "blog" }).item,
      projectCanonicalTimelineItem(canonicalRecord({ id: "a", pageUrl: "/a/", date: "2026-05-05" }), { sourceCollection: "blog" }).item,
      projectCanonicalTimelineItem(canonicalRecord({ id: "c", pageUrl: "/c/", date: "2026-01-01" }), { sourceCollection: "blog" }).item
    ]);

    assert.deepEqual(groups.map((group) => group.year), [2026, 2025]);
    assert.deepEqual(groups[0].items.map((item) => item.pageUrl), ["/a/", "/c/"]);
  });

  test("missing dates are excluded with explicit reason", () => {
    const projected = projectCanonicalTimelineItem(
      canonicalRecord({ date: "" }),
      { sourceCollection: "publications" }
    );
    assert.deepEqual(projected, {
      ok: false,
      sourceCollection: "publications",
      reason: "missing-date",
      input: {
        id: "/blog/example/",
        pageUrl: "/blog/example/",
        title: "Example"
      }
    });
  });

  test("invalid or approximate dates are excluded with explicit reason", () => {
    const projected = projectCanonicalTimelineItem(
      canonicalRecord({ date: "2026" }),
      { sourceCollection: "publications" }
    );
    assert.equal(projected.ok, false);
    assert.equal(projected.reason, "invalid-date");
  });

  test("duplicate projected identities are rejected", () => {
    assert.throws(() => buildTimelineProjection([
      {
        sourceCollection: "blog",
        items: [
          canonicalRecord({ id: "/same/", pageUrl: "/a/" }),
          canonicalRecord({ id: "/same/", pageUrl: "/b/" })
        ]
      }
    ]), {
      code: "duplicate-identity"
    });
  });

  test("duplicate canonical pageUrls are rejected", () => {
    assert.throws(() => buildTimelineProjection([
      {
        sourceCollection: "blog",
        items: [
          canonicalRecord({ id: "/a/", pageUrl: "/same/" }),
          canonicalRecord({ id: "/b/", pageUrl: "/same/" })
        ]
      }
    ]), {
      code: "duplicate-pageUrl"
    });
  });

  test("buildTimelineProjection preserves contexts without topic to research inference", () => {
    const projection = buildTimelineProjection([
      {
        sourceCollection: "blog",
        items: [
          canonicalRecord({
            id: "/blog/no-research/",
            pageUrl: "/blog/no-research/",
            categories: ["research"],
            keywords: ["research"],
            contexts: ["teaching"]
          })
        ]
      }
    ]);

    assert.equal(projection.projectedCount, 1);
    assert.deepEqual(projection.items[0].contexts, ["teaching"]);
    assert.deepEqual(projection.contextCounts, { teaching: 1 });
  });

  test("buildTimelineProjection reports counts, exclusions, year range, and source collections", () => {
    const projection = buildTimelineProjection([
      {
        sourceCollection: "blog",
        items: [
          canonicalRecord({ id: "/blog/a/", pageUrl: "/blog/a/", date: "2026-01-02", contexts: ["research"] }),
          canonicalRecord({ id: "/blog/b/", pageUrl: "/blog/b/", date: "" })
        ]
      },
      {
        sourceCollection: "politics",
        items: [
          canonicalRecord({ id: "/politics/c/", pageUrl: "/politics/c/", date: "2024-05-06", contexts: ["societal-interaction"] })
        ]
      }
    ]);

    assert.equal(projection.inputCount, 3);
    assert.equal(projection.projectedCount, 2);
    assert.equal(projection.excludedCount, 1);
    assert.deepEqual(projection.excludedReasons, { "missing-date": 1 });
    assert.equal(projection.latestYear, 2026);
    assert.equal(projection.earliestYear, 2024);
    assert.deepEqual(projection.sourceCollectionCounts, { blog: 1, politics: 1 });
    assert.deepEqual(projection.itemsPerYear, { "2024": 1, "2026": 1 });
    assert.deepEqual(projection.ordering, {
      primary: "date DESC",
      tieBreaker: "pageUrl ASC"
    });
  });
});

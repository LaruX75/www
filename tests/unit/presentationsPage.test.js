const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildCanonicalPresentationItems,
  buildCanonicalPresentationPageRecords
} = require("../../src/_data/presentationsPage");

describe("buildCanonicalPresentationPageRecords", () => {
  test("sailyttaa detailisivun nykyiset kentat ja kayttaa canonical itemia fallbackina", () => {
    const records = buildCanonicalPresentationPageRecords({
      presentations: [
        {
          pageUrl: "/presentations/foo/",
          title: "Local title",
          description: "Local description",
          categories: ["Paikallinen"],
          keywords: ["local-keyword"],
          contexts: ["education", "research", "teaching"],
          source: "slideshare",
          url: "https://legacy.example/foo",
          sourceUrl: "https://slides.example/foo",
          publicUrl: "https://public.example/foo",
          thumbnail: "/img/local.jpg",
          date: "2025-01-01",
          sourceLanguage: "fi",
          slideCount: 12,
          viewCount: 321,
          courseContexts: [{ courseId: "LOCAL-1" }]
        }
      ],
      slideshareItems: [
        {
          pageUrl: "/presentations/foo/",
          title: "Canonical title",
          url: "https://slides.example/foo",
          thumbnail: "/img/canonical.jpg",
          description: "Canonical description",
          categories: ["Kanoninen"],
          keywords: ["canonical-keyword"],
          date: "2025-02-02",
          sourceLanguage: "en",
          slideCount: 24,
          courseContexts: [{ courseId: "CANON-1" }]
        }
      ]
    });

    assert.equal(records.length, 1);
    assert.deepEqual(records[0], {
      pageUrl: "/presentations/foo/",
      title: "Local title",
      description: "Local description",
      categories: ["Paikallinen"],
      keywords: ["local-keyword"],
      source: "slideshare",
      sourceLabel: "SlideShare",
      url: "https://legacy.example/foo",
      sourceUrl: "https://slides.example/foo",
      publicUrl: "https://public.example/foo",
      thumbnail: "/img/local.jpg",
      date: "2025-01-01",
      year: "2025",
      lang: "fi",
      sourceLanguage: "fi",
      slideCount: 12,
      viewCount: 321,
      courseContexts: [{ courseId: "LOCAL-1" }],
      contexts: ["education", "research", "teaching"]
    });
  });

  test("fallback toimii jos canonical itemia ei loydy", () => {
    const records = buildCanonicalPresentationPageRecords({
      presentations: [
        {
          pageUrl: "/presentations/bar/",
          title: "Bar",
          description: "Local only",
          categories: ["Paikallinen"],
          keywords: ["bar"],
          source: "canva",
          sourceUrl: "https://canva.example/bar",
          publicUrl: "https://public.example/bar",
          thumbnail: "/img/bar.jpg",
          date: "2024-04-04",
          sourceLanguage: "fi",
          slideCount: 15,
          viewCount: 10,
          courseContexts: [{ courseId: "BAR-1" }]
        }
      ]
    });

    assert.equal(records.length, 1);
    assert.deepEqual(records[0], {
      pageUrl: "/presentations/bar/",
      title: "Bar",
      description: "Local only",
      categories: ["Paikallinen"],
      keywords: ["bar"],
      source: "canva",
      sourceLabel: "Canva",
      url: "https://public.example/bar",
      sourceUrl: "https://canva.example/bar",
      publicUrl: "https://public.example/bar",
      thumbnail: "/img/bar.jpg",
      date: "2024-04-04",
      year: null,
      lang: "fi",
      sourceLanguage: "fi",
      slideCount: 15,
      viewCount: 10,
      courseContexts: [{ courseId: "BAR-1" }],
      contexts: []
    });
  });
});

describe("buildCanonicalPresentationItems", () => {
  test("projects matched local-detail contexts onto canonical items without recomputing unmatched canonicals", () => {
    const items = buildCanonicalPresentationItems({
      presentations: [
        {
          pageUrl: "/presentations/foo/",
          title: "Local Foo",
          contexts: ["education", "research", "teaching"]
        },
        {
          pageUrl: "/presentations/alt/",
          title: "Alternate local detail",
          contexts: ["business", "teaching"]
        }
      ],
      customMaterials: [
        {
          title: "Canonical with direct match",
          url: "https://example.com/foo",
          pageUrl: "/presentations/foo/",
          date: "2025-01-01"
        },
        {
          title: "Canonical with alternate representation match only",
          url: "https://example.com/alt-canonical",
          date: "2025-01-02"
        },
        {
          title: "Unmatched external canonical",
          url: "https://example.com/unmatched",
          description: "research keyword in canonical copy should not be reused here",
          date: "2025-01-03"
        }
      ],
      applyAcceptedCuration: false
    });

    const directMatch = items.find((item) => item.pageUrl === "/presentations/foo/");
    const unmatched = items.find((item) => item.title === "Unmatched external canonical");

    assert.deepEqual(directMatch?.contexts, ["education", "research", "teaching"]);
    assert.equal(unmatched?.contexts, undefined);
  });
});

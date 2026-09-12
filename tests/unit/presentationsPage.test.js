const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildPresentationFilterTopics,
  buildPresentationFilterYears,
  buildPresentationSourceSections,
  buildCanonicalPresentationItems,
  buildCanonicalPresentationPageRecords,
  buildPresentationsPageModel
} = require("../../src/_data/presentationsPage");
const { readLocalPresentationSources } = require("../../src/_data/presentationSources");

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
      contexts: ["education", "research", "teaching"],
      declaredContexts: []
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
      contexts: [],
      declaredContexts: []
    });
  });
});

describe("buildCanonicalPresentationItems", () => {
  test("keeps curated YouTube playlist series as the single projected owner", () => {
    const verkkolive = "PLDG0jxUrk8z19_ThqBiynpYG4g-mjwgpt";
    const laitenurkka = "PLDG0jxUrk8z2E7S2ggyzt0bIBXiDEgXob";
    const unrelatedPlaylist = "PL-unrelated-playlist";

    const items = buildCanonicalPresentationItems({
      videoSeries: [
        {
          title: "Jari Larun verkkolive",
          url: "/2020/03/12/jari-larun-verkkolive/",
          externalUrl: `https://www.youtube.com/playlist?list=${verkkolive}`,
          date: "2020-03-12"
        },
        {
          title: "Larun laitenurkka: opetusteknologia läpivalaisussa",
          url: `https://www.youtube.com/playlist?list=${laitenurkka}`,
          externalUrl: `https://www.youtube.com/playlist?list=${laitenurkka}`
        }
      ],
      youtubeRows: [
        {
          title: "FIN: Jarin verkkolive",
          url: `https://www.youtube.com/playlist?list=${verkkolive}`,
          publishedAt: "2020-03-22T11:59:24Z"
        },
        {
          title: "Larun laitenurkka: opetusteknologia läpivalaisussa",
          url: `https://www.youtube.com/playlist?list=${laitenurkka}`,
          publishedAt: "2021-06-09T12:49:20Z"
        },
        {
          title: "Unrelated playlist",
          url: `https://www.youtube.com/playlist?list=${unrelatedPlaylist}`,
          publishedAt: "2022-01-01T00:00:00Z"
        }
      ],
      youtubeVideos: [
        {
          title: "Ordinary YouTube video",
          url: "https://www.youtube.com/watch?v=ordinary-video-id",
          publishedAt: "2022-02-02T00:00:00Z"
        }
      ],
      applyAcceptedCuration: false
    });

    for (const playlistId of [verkkolive, laitenurkka]) {
      const matches = items.filter((item) =>
        (item.sourceUrl || item.externalUrl || item.url).includes(`list=${playlistId}`)
      );
      assert.equal(matches.length, 1);
      assert.equal(matches[0].sourceKey, "videoSeries");
      assert.equal(matches[0].landingType, "externalSource");
    }

    assert.equal(items.filter((item) => item.sourceKey === "youtube" && item.sourceUrl.includes(unrelatedPlaylist)).length, 1);
    assert.equal(items.filter((item) => item.sourceKey === "youtubeVideos" && item.sourceUrl.includes("ordinary-video-id")).length, 1);
  });

  test("projects the verified 7LPyHCnuYJE talk once with a local landing", () => {
    const matches = buildPresentationsPageModel({}).items.filter((item) =>
      item.sourceUrl === "https://www.youtube.com/watch?v=7LPyHCnuYJE"
    );

    assert.equal(matches.length, 1);
    const [item] = matches;
    assert.equal(item.title, "Millainen on nykyaikainen oppimisympäristö");
    assert.equal(item.date, "2017-01-25");
    assert.equal(item.sourceKey, "curatedVideos");
    assert.equal(item.sourceUrl, "https://www.youtube.com/watch?v=7LPyHCnuYJE");
    assert.equal(item.externalUrl, "https://www.youtube.com/watch?v=7LPyHCnuYJE");
    assert.equal(item.localPageUrl, "/presentations/millainen-on-nykyaikainen-oppimisymparisto/");
    assert.equal(item.landingType, "localDetail");
    assert.equal(item.landingUrl, "/presentations/millainen-on-nykyaikainen-oppimisymparisto/");
    assert.equal(item.event, "Oppimisympäristön kehittäminen / workshop, Oulun yliopisto");

    const [localDetail] = readLocalPresentationSources().filter((detail) =>
      detail.sourceUrl === "https://www.youtube.com/watch?v=7LPyHCnuYJE"
    );
    assert.ok(localDetail);
    assert.deepEqual(localDetail.contexts, []);
  });

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

describe("presentations SSR view-model helpers", () => {
  const sourceFixture = [
    {
      title: "Canva newest FI",
      sourceKey: "canva",
      sourceUrl: "https://example.com/canva-fi-new",
      date: "2026-03-01",
      year: "2026",
      lang: "fi",
      topics: ["AI literacy", "Tekoäly"],
      categories: ["AI"],
      keywords: ["Literacy"]
    },
    {
      title: "Canva newest EN",
      sourceKey: "canva",
      sourceUrl: "https://example.com/canva-en-new",
      date: "2026-04-01",
      year: "2026",
      lang: "en",
      topics: ["AI literacy"]
    },
    {
      title: "Canva older EN",
      sourceKey: "canva",
      sourceUrl: "https://example.com/canva-en-old",
      date: "2025-04-01",
      year: "2025",
      lang: "en",
      topics: ["Opettajankoulutus"]
    },
    {
      title: "AOE newest",
      sourceKey: "aoe",
      sourceUrl: "https://example.com/aoe-new",
      date: "2026-02-01",
      year: "2026",
      lang: "fi",
      topics: ["AI literacy"]
    },
    {
      title: "AOE older",
      sourceKey: "aoe",
      sourceUrl: "https://example.com/aoe-old",
      date: "2024-02-01",
      year: "2024",
      lang: "fi",
      topics: []
    },
    {
      title: "YouTube playlist",
      sourceKey: "youtube",
      sourceUrl: "https://example.com/playlist",
      date: "2023-01-01",
      year: "2023",
      lang: "fi",
      topics: ["Mobiilioppiminen"]
    },
    {
      title: "SlideShare one",
      sourceKey: "slideshare",
      sourceUrl: "https://example.com/slideshare-one",
      date: "2020-01-01",
      year: "2020",
      lang: "fi",
      topics: ["Tekoäly"]
    }
  ];

  test("buildPresentationSourceSections keeps current source order and featured selection deterministic", () => {
    const sections = buildPresentationSourceSections(sourceFixture, "fi");

    assert.deepEqual(
      sections.map((section) => section.key),
      ["aoe", "canva", "slideshare", "youtubeVideos", "youtube"]
    );

    assert.equal(sections[0].featuredItem?.title, "AOE newest");
    assert.equal(sections[0].rows[0]?.title, "AOE older");
    assert.equal(sections[1].featuredItem?.title, "Canva newest EN");
    assert.equal(sections[1].rows[0]?.title, "Canva newest FI");
  });

  test("buildPresentationSourceSections preserves the current EN membership rule", () => {
    const sections = buildPresentationSourceSections(sourceFixture, "en");
    const canvaSection = sections.find((section) => section.key === "canva");
    const aoeSection = sections.find((section) => section.key === "aoe");

    assert.deepEqual(
      canvaSection.items.map((item) => item.title),
      ["Canva newest EN", "Canva older EN"]
    );
    assert.deepEqual(
      aoeSection.items.map((item) => item.title),
      ["AOE newest", "AOE older"]
    );
  });

  test("buildPresentationFilterYears matches runtime year derivation order", () => {
    assert.deepEqual(
      buildPresentationFilterYears(sourceFixture),
      ["2026", "2025", "2024", "2023", "2020"]
    );
  });

  test("buildPresentationFilterTopics matches runtime topic option counting and sorting", () => {
    assert.deepEqual(
      buildPresentationFilterTopics(sourceFixture),
      ["AI literacy", "Tekoäly", "Mobiilioppiminen", "Opettajankoulutus"]
    );
  });
});

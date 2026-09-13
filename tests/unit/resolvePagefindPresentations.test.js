const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  projectPresentationRecord,
  resolvePagefindPresentations
} = require("../../src/src.11tydata.js");

const {
  buildPresentationPagefindFilters,
  buildPresentationPagefindMeta
} = require("../../scripts/_lib/presentationPagefind.js");

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

describe("projectPresentationRecord — schema parity extension (LandingType, MediaType, SourceType, Context, ResearchPreset, Event)", () => {
  test("does NOT emit Kieli filter — base.njk provides it universally from currentLang", () => {
    // Kieli is emitted by src/_includes/base.njk on every HTML page,
    // not through pagefindDocument.filters. Projecting it here would
    // duplicate the filter value in the local-first fragment (custom
    // records still emit it because they bypass base.njk).
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/x/",
      year: 2024,
      lang: "en"
    });
    assert.ok(!doc.filters.some((f) => f.name === "Kieli"),
      "projectPresentationRecord must NOT project Kieli — base.njk handles it universally");
  });

  test("projects landingType, mediaType, sourceType, event filters and their meta counterparts", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/example/",
      year: 2024,
      presentationType: "keynote",
      event: "AAAI 2024",
      landingType: "localDetail",
      mediaType: "slides",
      sourceType: "canva",
      landingUrl: "/presentations/example/"
    });
    assert.ok(doc.filters.some((f) => f.name === "PresentationLandingType" && f.value === "localDetail"));
    assert.ok(doc.filters.some((f) => f.name === "PresentationMediaType" && f.value === "slides"));
    assert.ok(doc.filters.some((f) => f.name === "PresentationSourceType" && f.value === "canva"));
    assert.ok(doc.filters.some((f) => f.name === "PresentationEvent" && f.value === "AAAI 2024"));
    assert.equal(doc.meta.PresentationLandingType, "localDetail");
    assert.equal(doc.meta.PresentationMediaType, "slides");
    assert.equal(doc.meta.PresentationSourceType, "canva");
    assert.equal(doc.meta.PresentationLandingUrl, "/presentations/example/");
  });

  test("emits PresentationContext filters for every context and joined meta string", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/multi/",
      year: 2024,
      contexts: ["research", "teaching", "public"]
    });
    const contextFilters = doc.filters.filter((f) => f.name === "PresentationContext").map((f) => f.value);
    assert.deepEqual(contextFilters.sort(), ["public", "research", "teaching"]);
    assert.equal(doc.meta.PresentationContext, "research|teaching|public");
    assert.equal(doc.meta.ResearchContext, "research");
  });

  test("does not emit ResearchContext meta when contexts have no 'research'", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/x/",
      year: 2024,
      contexts: ["teaching"]
    });
    assert.equal("ResearchContext" in doc.meta, false);
  });

  test("emits PresentationDate meta and sort.date from item.date", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/dated/",
      year: 2024,
      date: "2024-06-15"
    });
    assert.equal(doc.meta.PresentationDate, "2024-06-15");
    assert.equal(doc.sort.date, "2024-06-15");
  });

  test("omits sort.date when item.date is missing or invalid", () => {
    const noDate = projectPresentationRecord({ pageUrl: "/presentations/nodate/", year: 2024 });
    const badDate = projectPresentationRecord({ pageUrl: "/presentations/baddate/", year: 2024, date: "not-a-date" });
    assert.equal("date" in noDate.sort, false);
    assert.equal("date" in badDate.sort, false);
  });

  test("normalises Date objects to YYYY-MM-DD ISO date in sort.date and meta.PresentationDate", () => {
    const dateObj = new Date("2024-06-15T14:30:00Z");
    const doc = projectPresentationRecord({ pageUrl: "/presentations/d/", year: 2024, date: dateObj });
    assert.equal(doc.sort.date, "2024-06-15");
    assert.equal(doc.meta.PresentationDate, "2024-06-15");
  });

  test("emits PresentationIndexDocument meta from item.pageUrl (local-first indexing anchor)", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/anchored/",
      year: 2024
    });
    assert.equal(doc.meta.PresentationIndexDocument, "/presentations/anchored/");
  });

  test("emits title, PresentationLanguage, PresentationRole meta when the corresponding item fields are populated", () => {
    const doc = projectPresentationRecord({
      pageUrl: "/presentations/full/",
      year: 2024,
      title: "Täydellinen esitys",
      lang: "fi",
      sourceLanguage: "fi",
      role: "speaker"
    });
    assert.equal(doc.meta.title, "Täydellinen esitys");
    assert.equal(doc.meta.PresentationLanguage, "fi");
    assert.equal(doc.meta.PresentationRole, "speaker");
  });
});

describe("projectPresentationRecord — schema parity with buildPresentationPagefindFilters/Meta", () => {
  // A realistic item as produced by withPresentationSemantics. This is
  // the shared input for both projection paths: the Eleventy projection
  // (src/src.11tydata.js:projectPresentationRecord) and the postbuild
  // custom-record builder (scripts/_lib/presentationPagefind.js). The
  // parity contract: for any such input, both paths must emit the same
  // filter names + meta keys with equivalent values.
  const realisticItem = {
    id: "canva:vqtdccorb3yxb9h",
    sourceKey: "canva",
    title: "Tekoäly ja lukutaito 2026",
    description: "Puheenvuoro opettajien täydennyskoulutuksessa.",
    date: "2026-04-15",
    year: 2026,
    lang: "fi",
    sourceLanguage: "fi",
    sourceUrl: "https://www.canva.com/design/vqtdccorb3yxb9h/view",
    pageUrl: "/presentations/tekoaly-ja-lukutaito-2026-a/",
    localPageUrl: "/presentations/tekoaly-ja-lukutaito-2026-a/",
    landingUrl: "/presentations/tekoaly-ja-lukutaito-2026-a/",
    landingType: "localDetail",
    hasLocalDetail: true,
    externalFirst: false,
    sourceType: "canva",
    mediaType: "slides",
    presentationType: "keynote",
    role: "speaker",
    event: "OAJ täydennyskoulutus 2026",
    topics: ["tekoäly", "lukutaito", "opetus"],
    contexts: ["teaching", "research"]
  };

  // The custom-record builder consumes a `record` shape produced by
  // buildPresentationExistingHtmlRecord. Its field names differ from
  // the canonical item (e.g. `presentationYear` vs `year`). We
  // hand-derive the minimum shape here so this test does not depend on
  // filesystem-backed audit data.
  const equivalentRecord = {
    canonicalPresentationId: realisticItem.id,
    canonicalTitle: realisticItem.title,
    preferredLandingUrl: realisticItem.landingUrl,
    landingType: realisticItem.landingType,
    sourceType: realisticItem.sourceType,
    mediaType: realisticItem.mediaType,
    presentationYear: String(realisticItem.year),
    presentationDate: "2026-04-15",
    presentationDescription: realisticItem.description,
    presentationTopics: realisticItem.topics,
    presentationContexts: realisticItem.contexts,
    presentationEvent: realisticItem.event,
    presentationType: realisticItem.presentationType,
    presentationRole: realisticItem.role,
    presentationLanguage: realisticItem.sourceLanguage,
    pagefindLanguage: "fi",
    presentationResearchPresets: [],
    presentationResearchPresetLabels: [],
    indexCandidateDocument: realisticItem.pageUrl
  };

  function eleventyFilterNames(doc) {
    return new Set(doc.filters.map((f) => f.name));
  }

  function customFilterNames(customFilters) {
    return new Set(Object.keys(customFilters));
  }

  test("filter name set is identical between Eleventy projection and custom-record builder (except Kieli, emitted by base.njk on local-first pages)", () => {
    const eleventy = projectPresentationRecord(realisticItem);
    const customFilters = buildPresentationPagefindFilters(equivalentRecord);
    const customExpected = new Set(customFilterNames(customFilters));
    customExpected.delete("Kieli"); // universal template-level emission
    assert.deepEqual(
      [...eleventyFilterNames(eleventy)].sort(),
      [...customExpected].sort(),
      "filter names must match between Eleventy projection and custom-record builder (excluding Kieli)"
    );
  });

  test("meta key set is identical between Eleventy projection and custom-record builder", () => {
    const eleventy = projectPresentationRecord(realisticItem);
    const customMeta = buildPresentationPagefindMeta(equivalentRecord);
    assert.deepEqual(
      Object.keys(eleventy.meta).sort(),
      Object.keys(customMeta).sort(),
      "meta keys must match between Eleventy projection and custom-record builder"
    );
  });

  test("PresentationYear, PresentationEvent, PresentationType, PresentationDate values agree across both paths", () => {
    const eleventy = projectPresentationRecord(realisticItem);
    const customMeta = buildPresentationPagefindMeta(equivalentRecord);
    assert.equal(eleventy.meta.PresentationYear, customMeta.PresentationYear);
    assert.equal(eleventy.meta.PresentationEvent, customMeta.PresentationEvent);
    assert.equal(eleventy.meta.PresentationType, customMeta.PresentationType);
    assert.equal(eleventy.meta.PresentationDate, customMeta.PresentationDate);
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

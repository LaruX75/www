/**
 * Testit `toPublicContentRecord(item)` -serialisointikerrokselle.
 *
 * Ajo: npm run test:unit
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const toPublicContentRecord = require("../../src/_utils/toPublicContentRecord");
const { isoDate, extractYear, normalizeArray, omitEmpty } = toPublicContentRecord;
const contentSchema = require("../../src/_data/contentSchema");

// -----------------------------------------------------------------------------
// Helper-funktiot
// -----------------------------------------------------------------------------
describe("helper-funktiot", () => {
  test("isoDate: Date-objekti", () => {
    assert.equal(isoDate(new Date("2026-06-15T14:30:00Z")), "2026-06-15");
  });

  test("isoDate: string 'YYYY-MM-DD'", () => {
    assert.equal(isoDate("2026-06-15"), "2026-06-15");
  });

  test("isoDate: virheellinen input => null", () => {
    assert.equal(isoDate("ei-paivamaara"), null);
    assert.equal(isoDate(null), null);
    assert.equal(isoDate(undefined), null);
    assert.equal(isoDate(""), null);
  });

  test("extractYear", () => {
    assert.equal(extractYear("2026-06-15"), 2026);
    assert.equal(extractYear(new Date("2020-01-01")), 2020);
    assert.equal(extractYear(null), null);
    assert.equal(extractYear("invalid"), null);
  });

  test("normalizeArray: array => siivottu", () => {
    assert.deepEqual(normalizeArray(["a", "", null, "b"]), ["a", "b"]);
  });

  test("normalizeArray: string => yksi elementti", () => {
    assert.deepEqual(normalizeArray("politics"), ["politics"]);
  });

  test("normalizeArray: tyhja => null", () => {
    assert.equal(normalizeArray([]), null);
    assert.equal(normalizeArray(""), null);
    assert.equal(normalizeArray(null), null);
    assert.equal(normalizeArray(undefined), null);
  });

  test("omitEmpty: poistaa null/undefined/tyhjat", () => {
    const result = omitEmpty({
      a: "value",
      b: null,
      c: undefined,
      d: "",
      e: [],
      f: 0,
      g: false,
      h: ["item"]
    });
    assert.deepEqual(result, { a: "value", f: 0, g: false, h: ["item"] });
  });
});

// -----------------------------------------------------------------------------
// Perustapaus: valtuustopuhe
// -----------------------------------------------------------------------------
describe("valtuustopuhe", () => {
  const item = {
    url: "/2022/09/12/puheenvuoro-valtuustossa-aloitteiden-seuranta/",
    date: new Date("2022-09-12T00:00:00Z"),
    inputPath: "./src/publications/puheenvuoro-valtuustossa-aloitteiden-seuranta.md",
    data: {
      title: "Puheenvuoro valtuustossa § 8: Aloitteiden seuranta",
      description: "Puheenvuorossa nostan esiin aloitteiden kasittelyn hitauden.",
      date: new Date("2022-09-12T00:00:00Z"),
      lang: "fi",
      type: "puhe",
      speechContext: "valtuusto",
      event: "Oulun kaupunginvaltuusto",
      forum: ["Kaupunginvaltuusto"],
      categories: ["Politiikka ja päätöksenteko"],
      keywords: ["aloitteet ja seuranta", "avoimuus"],
      contexts: ["politics"],
      writingRoles: ["political"],
      politicalProfiles: ["avoinhallinto"],
      asiakohta: "§ 8 – Kesäkuu 2021–heinäkuu 2022 kuntalaisaloitteet"
    }
  };

  test("canonical contentType tulee resolverista (speech)", () => {
    const rec = toPublicContentRecord(item);
    assert.equal(rec.contentType, "speech");
    assert.equal(rec.contentTypeLabel, "Valtuustopuheenvuoro");
    assert.equal(rec.section, "writings");
  });

  test("legacy `type` EI vuoda canonical-arvoksi", () => {
    const rec = toPublicContentRecord(item);
    assert.equal(rec.type, undefined, "raakaa type-kentta ei saa vuotaa");
    assert.notEqual(rec.contentType, "puhe");
  });

  test("id ja url ovat samat", () => {
    const rec = toPublicContentRecord(item);
    assert.equal(rec.id, rec.url);
  });

  test("paivamaara ISO 8601 -muodossa + year", () => {
    const rec = toPublicContentRecord(item);
    assert.equal(rec.date, "2022-09-12");
    assert.equal(rec.year, 2022);
  });

  test("arrays normalisoituvat", () => {
    const rec = toPublicContentRecord(item);
    assert.deepEqual(rec.categories, ["Politiikka ja päätöksenteko"]);
    assert.deepEqual(rec.forum, ["Kaupunginvaltuusto"]);
    assert.deepEqual(rec.writingRoles, ["political"]);
  });

  test("speechContext, event, forum sailyvat", () => {
    const rec = toPublicContentRecord(item);
    assert.equal(rec.speechContext, "valtuusto");
    assert.equal(rec.event, "Oulun kaupunginvaltuusto");
  });

  test("asiakohta (frontmatter-lisakentta) EI saa vuotaa", () => {
    const rec = toPublicContentRecord(item);
    assert.equal(rec.asiakohta, undefined);
  });
});

// -----------------------------------------------------------------------------
// Sisaisten kenttien vuotamattomuus
// -----------------------------------------------------------------------------
describe("sisaiset kentat eivat pade JSON:iin", () => {
  test("inputPath, page, layout, permalink, templateEngineOverride EI vuoda", () => {
    const item = {
      url: "/foo/",
      date: new Date("2026-01-01"),
      inputPath: "./src/publications/foo.md",
      data: {
        title: "Foo",
        type: "puhe",
        speechContext: "valtuusto",
        page: { fileSlug: "foo", inputPath: "./src/publications/foo.md" },
        layout: "writing-post.njk",
        permalink: "/foo/",
        templateEngineOverride: "md",
        eleventyExcludeFromCollections: false,
        collections: { publications: [] }
      }
    };

    const rec = toPublicContentRecord(item);
    for (const forbidden of ["inputPath", "page", "layout", "permalink",
        "templateEngineOverride", "eleventyExcludeFromCollections", "collections"]) {
      assert.equal(rec[forbidden], undefined, `${forbidden} ei saa vuotaa`);
    }
  });

  test("draft-kaltaiset kentat (draft, noindex, robots) EI vuoda", () => {
    const item = {
      url: "/foo/",
      date: new Date("2026-01-01"),
      data: {
        title: "Foo",
        type: "puhe",
        draft: true,
        noindex: true,
        robots: "noindex,follow"
      }
    };
    const rec = toPublicContentRecord(item);
    assert.equal(rec.draft, undefined);
    assert.equal(rec.noindex, undefined);
    assert.equal(rec.robots, undefined);
  });
});

// -----------------------------------------------------------------------------
// Tyhjat kentat poistetaan
// -----------------------------------------------------------------------------
describe("tyhjat kentat poistetaan", () => {
  test("null/undefined/tyhjat arrayt eivat pade outputtiin", () => {
    const item = {
      url: "/foo/",
      date: new Date("2026-01-01"),
      data: {
        title: "Foo",
        type: "puhe",
        description: null,
        categories: [],
        keywords: undefined,
        mediaType: ""
      }
    };
    const rec = toPublicContentRecord(item);
    assert.equal(rec.description, undefined);
    assert.equal(rec.categories, undefined);
    assert.equal(rec.keywords, undefined);
    assert.equal(rec.mediaType, undefined);
  });
});

// -----------------------------------------------------------------------------
// Media-item
// -----------------------------------------------------------------------------
describe("media-item", () => {
  test("mediaType=podcast, mediaRole=guest", () => {
    const item = {
      url: "/mediassa/foo-podcast/",
      date: new Date("2025-11-01"),
      inputPath: "./src/media/foo-podcast.md",
      data: {
        title: "Foo podcast",
        description: "Vieraana podcastissa",
        mediaType: "podcast",
        mediaRole: "guest",
        mediaOutlet: "Foo Media",
        sourceUrl: "https://example.com/podcast",
        thumbnail: "https://example.com/thumb.jpg",
        categories: ["Media"],
        keywords: ["tekoäly"]
      }
    };
    const rec = toPublicContentRecord(item);
    assert.equal(rec.contentType, "mediaItem");
    assert.equal(rec.section, "media");
    assert.equal(rec.mediaType, "podcast");
    assert.equal(rec.mediaRole, "guest");
    assert.equal(rec.mediaOutlet, "Foo Media");
    assert.equal(rec.sourceUrl, "https://example.com/podcast");
  });
});

// -----------------------------------------------------------------------------
// Presentation
// -----------------------------------------------------------------------------
describe("presentation", () => {
  test("type=esitys, source=canva", () => {
    const item = {
      url: "/esitykset/foo-esitys/",
      date: new Date("2024-05-15"),
      inputPath: "./src/presentations/foo-esitys.md",
      data: {
        title: "Foo esitys",
        type: "esitys",
        source: "canva",
        event: "Foo-konferenssi 2024"
      }
    };
    const rec = toPublicContentRecord(item);
    assert.equal(rec.contentType, "presentation");
    assert.equal(rec.section, "presentations");
    assert.equal(rec.source, "canva");
    assert.equal(rec.event, "Foo-konferenssi 2024");
  });
});

// -----------------------------------------------------------------------------
// Minimivaatimukset (url + title pakollisia)
// -----------------------------------------------------------------------------
describe("minimivaatimukset", () => {
  test("puuttuva url => null", () => {
    const rec = toPublicContentRecord({ data: { title: "Foo" } });
    assert.equal(rec, null);
  });

  test("puuttuva title => null", () => {
    const rec = toPublicContentRecord({ url: "/foo/", data: {} });
    assert.equal(rec, null);
  });

  test("tyhja input => null", () => {
    assert.equal(toPublicContentRecord({}), null);
    assert.equal(toPublicContentRecord(null), null);
    assert.equal(toPublicContentRecord(undefined), null);
  });
});

// -----------------------------------------------------------------------------
// publication-kentta (lehden nimi)
// -----------------------------------------------------------------------------
describe("publication-kentta", () => {
  test("publication frontmatterista sailyy JSON:issa", () => {
    const item = {
      url: "/foo/",
      date: new Date("2012-03-10"),
      data: { title: "Foo", type: "mielipide", publication: "Kaleva" }
    };
    const rec = toPublicContentRecord(item);
    assert.equal(rec.publication, "Kaleva");
  });

  test("publication puuttuu => ei mukana JSON:issa", () => {
    const item = {
      url: "/foo/",
      date: new Date("2012-03-10"),
      data: { title: "Foo", type: "mielipide" }
    };
    const rec = toPublicContentRecord(item);
    assert.equal(rec.publication, undefined);
  });
});

// -----------------------------------------------------------------------------
// FI/EN
// -----------------------------------------------------------------------------
describe("FI/EN-labelit", () => {
  test("lang=en tuottaa EN-labelin", () => {
    const item = {
      url: "/en/2022/09/12/foo/",
      date: new Date("2022-09-12"),
      data: {
        title: "Council speech",
        lang: "en",
        type: "puhe",
        speechContext: "valtuusto"
      }
    };
    const rec = toPublicContentRecord(item);
    assert.equal(rec.lang, "en");
    assert.equal(rec.contentType, "speech");
    assert.equal(rec.contentTypeLabel, "Council speech");
  });

  test("lang puuttuu => oletus 'fi'", () => {
    const item = {
      url: "/foo/",
      date: new Date("2024-01-01"),
      data: { title: "Foo", type: "kolumni" }
    };
    const rec = toPublicContentRecord(item);
    assert.equal(rec.lang, "fi");
    assert.equal(rec.contentTypeLabel, "Kolumni");
  });
});

// -----------------------------------------------------------------------------
// contentType kuuluu canonical-vocabulariaan
// -----------------------------------------------------------------------------
describe("contentType canonical-vocabularyssa", () => {
  const cases = [
    { desc: "puhe", data: { title: "T", type: "puhe" }, expected: "speech" },
    { desc: "mielipide", data: { title: "T", type: "mielipide" }, expected: "opinion" },
    { desc: "esitys", data: { title: "T", type: "esitys" }, expected: "presentation" },
    { desc: "mediaType=podcast", data: { title: "T", mediaType: "podcast" }, expected: "mediaItem" },
    { desc: "contentType=scientificPublication", data: { title: "T", contentType: "scientificPublication" }, expected: "scientificPublication" }
  ];

  for (const c of cases) {
    test(`${c.desc} => ${c.expected} kuuluu canonical vocabulariaan`, () => {
      const rec = toPublicContentRecord({ url: "/t/", date: new Date(), data: c.data });
      assert.equal(rec.contentType, c.expected);
      assert.ok(
        contentSchema.vocabularies.contentTypes.includes(rec.contentType),
        `${rec.contentType} ei ole canonical vocabularyssa`
      );
    });
  }
});

// -----------------------------------------------------------------------------
// JSON-serialisoitavuus
// -----------------------------------------------------------------------------
describe("JSON-serialisoitavuus", () => {
  test("record on JSON.stringify+parse -round-trippable", () => {
    const item = {
      url: "/foo/",
      date: new Date("2024-05-15"),
      data: {
        title: "Foo",
        type: "puhe",
        speechContext: "valtuusto",
        categories: ["A", "B"]
      }
    };
    const rec = toPublicContentRecord(item);
    const roundTripped = JSON.parse(JSON.stringify(rec));
    assert.deepEqual(roundTripped, rec);
  });
});

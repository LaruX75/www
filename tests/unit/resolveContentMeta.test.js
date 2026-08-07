/**
 * Testit `resolveContentMeta(data, inputPath, lang)` -resolverille.
 *
 * Kaksi vastuuta:
 *  1. `contentTypeLabel` ja `schemaType` pitaa vastata TASMALLEEN aiempia
 *     funktioita (contentTypeLabel + resolveSchemaType). Tama on lukitseva
 *     characterization-testi: jos migraatio VAIHE 5:ssa muuttaa jotain,
 *     nama testit hajoavat.
 *  2. `contentType` (canonical) ja `section` ovat uutta pintaa. Testit
 *     dokumentoivat niiden mapatuksen contentSchema.js:n vocabulariaan.
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const resolveContentMeta = require("../../src/_utils/resolveContentMeta");
const contentTypeLabel = require("../../src/_utils/contentTypeLabel");
const resolveSchemaType = require("../../src/_utils/resolveSchemaType");

// -----------------------------------------------------------------------------
// Yhdenmukaisuus aiempien funktioiden kanssa
// -----------------------------------------------------------------------------
describe("resolveContentMeta: yhdenmukaisuus contentTypeLabel + resolveSchemaType kanssa", () => {
  const cases = [
    { label: "valtuustopuhe (fi)", data: { type: "puhe", speechContext: "valtuusto" }, tags: [], lang: "fi" },
    { label: "valtuustopuhe (en)", data: { type: "puhe", speechContext: "valtuusto" }, tags: [], lang: "en" },
    { label: "kyselytunti (fi)", data: { type: "puhe", speechContext: "kyselytunti" }, tags: [], lang: "fi" },
    { label: "mielipide", data: { type: "mielipide" }, tags: ["publications"], lang: "fi" },
    { label: "kolumni", data: { type: "kolumni" }, tags: [], lang: "fi" },
    { label: "lausunto", data: { type: "lausunto" }, tags: [], lang: "fi" },
    { label: "esitys", data: { type: "esitys" }, tags: [], lang: "fi" },
    { label: "artikkeli-legacy", data: { type: "artikkeli" }, tags: [], lang: "fi" },
    { label: "blogikirjoitus-legacy", data: { type: "blogikirjoitus" }, tags: ["blog"], lang: "fi" },
    { label: "tieteellinen-legacy", data: { type: "tieteellinen" }, tags: [], lang: "fi" },
    { label: "media podcast", data: { mediaType: "podcast" }, tags: [], lang: "fi" },
    { label: "media video", data: { mediaType: "video" }, tags: [], lang: "fi" },
    { label: "media article", data: { mediaType: "article" }, tags: [], lang: "fi" },
    { label: "media radio", data: { mediaType: "radio" }, tags: [], lang: "fi" },
    { label: "media tv", data: { mediaType: "tv" }, tags: [], lang: "fi" },
    { label: "researchfi source", data: { source: "researchfi", contentType: "scientificPublication" }, tags: [], lang: "fi" },
    { label: "kyselytunti agenda_title-signaali", data: { type: "puhe", agenda_title: "Valtuuston kyselytunti" }, tags: [], lang: "fi" },
    { label: "tags=blog fallback", data: {}, tags: ["blog"], lang: "fi" },
    { label: "tags=politics fallback", data: {}, tags: ["politics"], lang: "fi" },
    { label: "tyhja data", data: {}, tags: [], lang: "fi" },
    { label: "schemaType=CollectionPage override", data: { schemaType: "CollectionPage" }, tags: [], lang: "fi" }
  ];

  for (const c of cases) {
    test(`${c.label}: contentTypeLabel + schemaType + pageBlockType + specialPageType tasmalleen samat`, () => {
      const meta = resolveContentMeta({ ...c.data, tags: c.tags }, "", c.lang);
      const expectedLabel = contentTypeLabel({ ...c.data, tags: c.tags }, c.tags, c.lang);
      const expectedSchema = resolveSchemaType({ ...c.data, tags: c.tags });

      assert.equal(meta.contentTypeLabel, expectedLabel, `contentTypeLabel eroa: ${c.label}`);
      assert.equal(meta.schemaType, expectedSchema.resolvedSchemaType, `schemaType eroa: ${c.label}`);
      assert.equal(meta.pageBlockType, expectedSchema.pageBlockType, `pageBlockType eroa: ${c.label}`);
      assert.equal(meta.specialPageType, expectedSchema.specialPageType, `specialPageType eroa: ${c.label}`);
    });
  }
});

// -----------------------------------------------------------------------------
// canonical contentType (uutta pintaa)
// -----------------------------------------------------------------------------
describe("resolveContentMeta: canonical contentType", () => {
  test("eksplisiittinen contentType voittaa kaiken", () => {
    const meta = resolveContentMeta(
      { contentType: "scientificPublication", type: "puhe" },
      "./src/publications/foo.md",
      "fi"
    );
    assert.equal(meta.contentType, "scientificPublication");
  });

  test("legacy type=puhe => canonical speech", () => {
    assert.equal(resolveContentMeta({ type: "puhe" }).contentType, "speech");
  });

  test("legacy type=mielipide => canonical opinion", () => {
    assert.equal(resolveContentMeta({ type: "mielipide" }).contentType, "opinion");
  });

  test("legacy type=kolumni => canonical column", () => {
    assert.equal(resolveContentMeta({ type: "kolumni" }).contentType, "column");
  });

  test("legacy type=lausunto => canonical statement", () => {
    assert.equal(resolveContentMeta({ type: "lausunto" }).contentType, "statement");
  });

  test("legacy type=artikkeli => canonical article", () => {
    assert.equal(resolveContentMeta({ type: "artikkeli" }).contentType, "article");
  });

  test("legacy type=blogikirjoitus => canonical blogPost", () => {
    assert.equal(resolveContentMeta({ type: "blogikirjoitus" }).contentType, "blogPost");
  });

  test("legacy type=esitys => canonical presentation", () => {
    assert.equal(resolveContentMeta({ type: "esitys" }).contentType, "presentation");
  });

  test("legacy type=tieteellinen => canonical scientificPublication", () => {
    assert.equal(resolveContentMeta({ type: "tieteellinen" }).contentType, "scientificPublication");
  });

  test("mediaType=podcast (ilman type) => canonical mediaItem", () => {
    assert.equal(resolveContentMeta({ mediaType: "podcast" }).contentType, "mediaItem");
  });

  test("mediaType=video (ilman type) => canonical video", () => {
    assert.equal(resolveContentMeta({ mediaType: "video" }).contentType, "video");
  });

  test("mediaType=tv => canonical mediaItem", () => {
    assert.equal(resolveContentMeta({ mediaType: "tv" }).contentType, "mediaItem");
  });

  test("source=researchfi (ilman type) => canonical scientificPublication", () => {
    assert.equal(resolveContentMeta({ source: "researchfi" }).contentType, "scientificPublication");
  });

  test("inputPath=/media/ (ilman type/mediaType) => canonical mediaItem", () => {
    assert.equal(
      resolveContentMeta({}, "./src/media/foo.md").contentType,
      "mediaItem"
    );
  });

  test("inputPath=/presentations/ (ilman type) => canonical presentation", () => {
    assert.equal(
      resolveContentMeta({}, "./src/presentations/foo.md").contentType,
      "presentation"
    );
  });

  test("inputPath=/blog/ (ilman type) => canonical blogPost", () => {
    assert.equal(
      resolveContentMeta({}, "./src/blog/foo.md").contentType,
      "blogPost"
    );
  });

  test("inputPath=/politics/ (ilman type) => canonical initiative", () => {
    assert.equal(
      resolveContentMeta({}, "./src/politics/foo.md").contentType,
      "initiative"
    );
  });

  test("tags=blog fallback => canonical blogPost", () => {
    assert.equal(resolveContentMeta({ tags: ["blog"] }).contentType, "blogPost");
  });

  test("tags=politics fallback => canonical initiative", () => {
    assert.equal(resolveContentMeta({ tags: ["politics"] }).contentType, "initiative");
  });

  test("tags=publications fallback => canonical article", () => {
    assert.equal(resolveContentMeta({ tags: ["publications"] }).contentType, "article");
  });

  test("ei mitaan signaalia => default article", () => {
    assert.equal(resolveContentMeta({}).contentType, "article");
  });
});

// -----------------------------------------------------------------------------
// section
// -----------------------------------------------------------------------------
describe("resolveContentMeta: section (laaja alue)", () => {
  test("speech, opinion, column, statement, article => writings", () => {
    assert.equal(resolveContentMeta({ type: "puhe" }).section, "writings");
    assert.equal(resolveContentMeta({ type: "mielipide" }).section, "writings");
    assert.equal(resolveContentMeta({ type: "kolumni" }).section, "writings");
    assert.equal(resolveContentMeta({ type: "lausunto" }).section, "writings");
    assert.equal(resolveContentMeta({ type: "artikkeli" }).section, "writings");
  });

  test("blogPost => blog", () => {
    assert.equal(resolveContentMeta({ type: "blogikirjoitus" }).section, "blog");
  });

  test("presentation => presentations", () => {
    assert.equal(resolveContentMeta({ type: "esitys" }).section, "presentations");
  });

  test("mediaItem, video => media", () => {
    assert.equal(resolveContentMeta({ mediaType: "podcast" }).section, "media");
    assert.equal(resolveContentMeta({ mediaType: "video" }).section, "media");
  });

  test("initiative => politics", () => {
    assert.equal(resolveContentMeta({}, "./src/politics/foo.md").section, "politics");
  });

  test("scientificPublication => publications", () => {
    assert.equal(resolveContentMeta({ type: "tieteellinen" }).section, "publications");
    assert.equal(resolveContentMeta({ source: "researchfi" }).section, "publications");
  });

  test("tuntematon contentType => other", () => {
    // resolver ei koskaan tuota tuntematonta contentTypea normaali-inputilla,
    // mutta jos manuaalisesti annetaan, section on 'other'
    assert.equal(resolveContentMeta({ contentType: "outoUusi" }).section, "other");
  });
});

// -----------------------------------------------------------------------------
// Serialisoitavuus (myohempaa JSON-datakerrosta varten)
// -----------------------------------------------------------------------------
describe("resolveContentMeta: JSON-serialisoitavuus", () => {
  test("palautusarvo on JSON.stringifyable", () => {
    const meta = resolveContentMeta({ type: "puhe", speechContext: "valtuusto" }, "", "fi");
    const roundTripped = JSON.parse(JSON.stringify(meta));
    assert.deepEqual(roundTripped, meta);
  });

  test("kaikki kentat ovat primitiiveja (ei funktioita, ei undefined)", () => {
    const meta = resolveContentMeta({ type: "puhe" }, "", "fi");
    for (const [key, value] of Object.entries(meta)) {
      const valid = value === null || typeof value === "string";
      assert.ok(valid, `kentta ${key} ei ole string tai null: ${typeof value}`);
    }
  });
});

// -----------------------------------------------------------------------------
// pageBlockType / specialPageType (Schema.org-renderointihaarat)
// -----------------------------------------------------------------------------
describe("resolveContentMeta: pageBlockType + specialPageType", () => {
  test("type=esitys => pageBlockType=presentation", () => {
    const meta = resolveContentMeta({ type: "esitys" });
    assert.equal(meta.pageBlockType, "presentation");
    assert.equal(meta.specialPageType, null);
  });

  test("type=puhe => pageBlockType=article", () => {
    const meta = resolveContentMeta({ type: "puhe" });
    assert.equal(meta.pageBlockType, "article");
    assert.equal(meta.specialPageType, null);
  });

  test("schemaType=CollectionPage => pageBlockType=specialpage, specialPageType=CollectionPage", () => {
    const meta = resolveContentMeta({ schemaType: "CollectionPage" });
    assert.equal(meta.pageBlockType, "specialpage");
    assert.equal(meta.specialPageType, "CollectionPage");
  });

  test("schemaType=AboutPage => pageBlockType=specialpage, specialPageType=AboutPage", () => {
    const meta = resolveContentMeta({ schemaType: "AboutPage" });
    assert.equal(meta.pageBlockType, "specialpage");
    assert.equal(meta.specialPageType, "AboutPage");
  });

  test("schemaType=Organization => pageBlockType=business", () => {
    const meta = resolveContentMeta({ schemaType: "Organization" });
    assert.equal(meta.pageBlockType, "business");
    assert.equal(meta.specialPageType, null);
  });

  test("schemaType=Thesis => pageBlockType=thesis", () => {
    const meta = resolveContentMeta({ schemaType: "Thesis" });
    assert.equal(meta.pageBlockType, "thesis");
    assert.equal(meta.specialPageType, null);
  });

  test("tyhja data => pageBlockType=webpage, schemaType=null", () => {
    const meta = resolveContentMeta({});
    assert.equal(meta.pageBlockType, "webpage");
    assert.equal(meta.schemaType, null);
    assert.equal(meta.specialPageType, null);
  });
});

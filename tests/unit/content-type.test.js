/**
 * Unit-testit sisaltotyypin paattelylle (contentTypeLabel,
 * resolveSchemaType, getTaxonomyType).
 *
 * Alkuperainen tarkoitus oli characterization: lukita nykyinen
 * kayttaytyminen ennen resolveContentMeta-refaktoria. Osa testeista
 * dokumentoi edelleen tarkoituksellisia kayttaytymisia (nakyy
 * kommenteissa), ja jaljella olevat [ristiriita]-tagit merkitsevat
 * getTaxonomyType-tason ristiriitoja (raportin #19-2, jaljella oleva
 * arkkitehtuurinen paatos).
 *
 * Ajo: npm run test:unit
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const contentTypeLabel = require("../../src/_utils/contentTypeLabel");
const resolveSchemaType = require("../../src/_utils/resolveSchemaType");
const getTaxonomyType = require("../../src/_utils/getTaxonomyType");

// -----------------------------------------------------------------------------
// contentTypeLabel(data, tags, lang)
// -----------------------------------------------------------------------------
describe("contentTypeLabel", () => {
  describe("legacy type", () => {
    test("type=puhe ilman speechContextia => 'Puhe' / 'Speech'", () => {
      assert.equal(contentTypeLabel({ type: "puhe" }, [], "fi"), "Puhe");
      assert.equal(contentTypeLabel({ type: "puhe" }, [], "en"), "Speech");
    });

    test("type=puhe + speechContext=valtuusto => 'Valtuustopuheenvuoro' / 'Council speech'", () => {
      const data = { type: "puhe", speechContext: "valtuusto" };
      assert.equal(contentTypeLabel(data, [], "fi"), "Valtuustopuheenvuoro");
      assert.equal(contentTypeLabel(data, [], "en"), "Council speech");
    });

    test("type=puhe + speechContext=kyselytunti => 'Valtuuston kyselytunti'", () => {
      const data = { type: "puhe", speechContext: "kyselytunti" };
      assert.equal(contentTypeLabel(data, [], "fi"), "Valtuuston kyselytunti");
      assert.equal(contentTypeLabel(data, [], "en"), "Council question hour");
    });

    test("type=puhe + speechContext=akateeminen-puhe => 'Akateeminen puhe'", () => {
      assert.equal(
        contentTypeLabel({ type: "puhe", speechContext: "akateeminen-puhe" }, [], "fi"),
        "Akateeminen puhe"
      );
    });

    test("type=puhe + speechContext=juhlapuhe => 'Juhlapuhe'", () => {
      assert.equal(
        contentTypeLabel({ type: "puhe", speechContext: "juhlapuhe" }, [], "fi"),
        "Juhlapuhe"
      );
    });

    test("type=puhe + speechContext=julkinen-tilaisuus => 'Julkinen puhe'", () => {
      assert.equal(
        contentTypeLabel({ type: "puhe", speechContext: "julkinen-tilaisuus" }, [], "fi"),
        "Julkinen puhe"
      );
    });

    test("type=mielipide => 'Mielipide'", () => {
      assert.equal(contentTypeLabel({ type: "mielipide" }, [], "fi"), "Mielipide");
      assert.equal(contentTypeLabel({ type: "mielipide" }, [], "en"), "Opinion");
    });

    test("type=kolumni => 'Kolumni'", () => {
      assert.equal(contentTypeLabel({ type: "kolumni" }, [], "fi"), "Kolumni");
      assert.equal(contentTypeLabel({ type: "kolumni" }, [], "en"), "Column");
    });

    test("type=lausunto => 'Asiantuntijalausunto'", () => {
      assert.equal(contentTypeLabel({ type: "lausunto" }, [], "fi"), "Asiantuntijalausunto");
      assert.equal(contentTypeLabel({ type: "lausunto" }, [], "en"), "Expert statement");
    });

    test("type=esitys => 'Esitys'", () => {
      assert.equal(contentTypeLabel({ type: "esitys" }, [], "fi"), "Esitys");
      assert.equal(contentTypeLabel({ type: "esitys" }, [], "en"), "Presentation");
    });

    test("type=artikkeli (ilman tags=blog) => 'Artikkeli' / 'Article'", () => {
      assert.equal(contentTypeLabel({ type: "artikkeli" }, [], "fi"), "Artikkeli");
      assert.equal(contentTypeLabel({ type: "artikkeli" }, [], "en"), "Article");
    });

    test("type=artikkeli + tags=blog => 'Blogikirjoitus' (tags voittaa, sailyy)", () => {
      // Blog/-hakemistossa 11 artikkelia joissa type=artikkeli mutta tags=blog
      // saavat blog.11tydata.js:sta. Nama sailyvat "Blogikirjoitus"-labelina
      // taaksepain yhteensopivuuden vuoksi.
      assert.equal(contentTypeLabel({ type: "artikkeli" }, ["blog"], "fi"), "Blogikirjoitus");
    });

    test("type=blogikirjoitus ilman tags=blog => 'Blogikirjoitus'", () => {
      assert.equal(contentTypeLabel({ type: "blogikirjoitus" }, [], "fi"), "Blogikirjoitus");
      assert.equal(contentTypeLabel({ type: "blogikirjoitus" }, [], "en"), "Blog post");
    });

    test("type=tieteellinen => 'Tieteellinen julkaisu' / 'Scientific publication'", () => {
      assert.equal(contentTypeLabel({ type: "tieteellinen" }, [], "fi"), "Tieteellinen julkaisu");
      assert.equal(contentTypeLabel({ type: "tieteellinen" }, [], "en"), "Scientific publication");
    });

    test("contentType=scientificPublication (ilman type) => 'Tieteellinen julkaisu'", () => {
      assert.equal(
        contentTypeLabel({ contentType: "scientificPublication" }, [], "fi"),
        "Tieteellinen julkaisu"
      );
      assert.equal(
        contentTypeLabel({ contentType: "scientificPublication" }, [], "en"),
        "Scientific publication"
      );
    });
  });

  describe("mediaType", () => {
    test("mediaType=video => 'Video'", () => {
      assert.equal(contentTypeLabel({ mediaType: "video" }, [], "fi"), "Video");
      assert.equal(contentTypeLabel({ mediaType: "video" }, [], "en"), "Video");
    });

    test("mediaType=podcast => 'Podcast'", () => {
      assert.equal(contentTypeLabel({ mediaType: "podcast" }, [], "fi"), "Podcast");
    });

    test("mediaType=radio => 'Radio'", () => {
      assert.equal(contentTypeLabel({ mediaType: "radio" }, [], "fi"), "Radio");
    });

    test("mediaType=article => 'Lehtijuttu' / 'Media article'", () => {
      assert.equal(contentTypeLabel({ mediaType: "article" }, [], "fi"), "Lehtijuttu");
      assert.equal(contentTypeLabel({ mediaType: "article" }, [], "en"), "Media article");
    });

    test("mediaType=tv => 'TV'", () => {
      assert.equal(contentTypeLabel({ mediaType: "tv" }, [], "fi"), "TV");
      assert.equal(contentTypeLabel({ mediaType: "tv" }, [], "en"), "TV");
    });
  });

  describe("agenda_title / contexts / keywords", () => {
    test("agenda_title='Valtuuston kyselytunti' voittaa type-vaikutuksen", () => {
      assert.equal(
        contentTypeLabel({ type: "puhe", agenda_title: "Valtuuston kyselytunti" }, [], "fi"),
        "Valtuuston kyselytunti"
      );
    });

    test("keywords sisaltaa 'valtuustokysely' => 'Valtuuston kyselytunti'", () => {
      assert.equal(
        contentTypeLabel({ type: "puhe", keywords: ["valtuustokysely"] }, [], "fi"),
        "Valtuuston kyselytunti"
      );
    });

    test("contexts sisaltaa 'Valtuuston kyselytunti' => 'Valtuuston kyselytunti'", () => {
      assert.equal(
        contentTypeLabel({ type: "puhe", contexts: ["Valtuuston kyselytunti"] }, [], "fi"),
        "Valtuuston kyselytunti"
      );
    });
  });

  describe("tags-perusteinen fallback", () => {
    test("tags=blog + ei type => 'Blogikirjoitus'", () => {
      assert.equal(contentTypeLabel({}, ["blog"], "fi"), "Blogikirjoitus");
      assert.equal(contentTypeLabel({}, ["blog"], "en"), "Blog post");
    });

    test("tags=politics + ei type => 'Valtuustoaloite'", () => {
      assert.equal(contentTypeLabel({}, ["politics"], "fi"), "Valtuustoaloite");
      assert.equal(contentTypeLabel({}, ["politics"], "en"), "Council initiative");
    });

    test("tags=presentations => 'Esitys'", () => {
      assert.equal(contentTypeLabel({}, ["presentations"], "fi"), "Esitys");
    });

    test("tyhja data + tyhjat tags => 'Kirjoitus' / 'Text'", () => {
      assert.equal(contentTypeLabel({}, [], "fi"), "Kirjoitus");
      assert.equal(contentTypeLabel({}, [], "en"), "Text");
    });
  });

  describe("prioriteettijarjestys", () => {
    test("mediaType voittaa tags:blog:in", () => {
      assert.equal(contentTypeLabel({ mediaType: "podcast" }, ["blog"], "fi"), "Podcast");
    });

    test("type=esitys voittaa tags:blog:in", () => {
      assert.equal(contentTypeLabel({ type: "esitys" }, ["blog"], "fi"), "Esitys");
    });

    test("type=lausunto voittaa agenda_title=Valtuuston kyselytunti:n", () => {
      assert.equal(
        contentTypeLabel({ type: "lausunto", agenda_title: "Valtuuston kyselytunti" }, [], "fi"),
        "Asiantuntijalausunto"
      );
    });

    test("type=puhe + speechContext=valtuusto + tags=politics => 'Valtuustopuheenvuoro'", () => {
      // type=puhe voittaa tags-fallback:ista
      const data = { type: "puhe", speechContext: "valtuusto" };
      assert.equal(contentTypeLabel(data, ["politics"], "fi"), "Valtuustopuheenvuoro");
    });
  });
});

// -----------------------------------------------------------------------------
// resolveSchemaType(data)
// -----------------------------------------------------------------------------
describe("resolveSchemaType", () => {
  describe("legacy type => Schema.org-luokka", () => {
    test("type=esitys => PresentationDigitalDocument", () => {
      const r = resolveSchemaType({ type: "esitys" });
      assert.equal(r.resolvedSchemaType, "PresentationDigitalDocument");
      assert.equal(r.pageBlockType, "presentation");
    });

    test("type=tieteellinen => ScholarlyArticle", () => {
      const r = resolveSchemaType({ type: "tieteellinen" });
      assert.equal(r.resolvedSchemaType, "ScholarlyArticle");
      assert.equal(r.pageBlockType, "article");
    });

    test("type=mielipide => OpinionNewsArticle", () => {
      const r = resolveSchemaType({ type: "mielipide" });
      assert.equal(r.resolvedSchemaType, "OpinionNewsArticle");
      assert.equal(r.pageBlockType, "article");
    });

    test("type=kolumni => NewsArticle", () => {
      const r = resolveSchemaType({ type: "kolumni" });
      assert.equal(r.resolvedSchemaType, "NewsArticle");
      assert.equal(r.pageBlockType, "article");
    });

    test("type=puhe => Article (ei speechContext-erottelua)", () => {
      const r = resolveSchemaType({ type: "puhe", speechContext: "valtuusto" });
      assert.equal(r.resolvedSchemaType, "Article");
    });

    test("type=lausunto => Article", () => {
      assert.equal(resolveSchemaType({ type: "lausunto" }).resolvedSchemaType, "Article");
    });

    test("type=artikkeli => Article", () => {
      assert.equal(resolveSchemaType({ type: "artikkeli" }).resolvedSchemaType, "Article");
    });

    test("type=blogikirjoitus => BlogPosting", () => {
      const r = resolveSchemaType({ type: "blogikirjoitus" });
      assert.equal(r.resolvedSchemaType, "BlogPosting");
      assert.equal(r.pageBlockType, "article");
    });
  });

  describe("frontmatter schemaType voittaa aina", () => {
    test("schemaType=CollectionPage vaikka type=puhe", () => {
      const r = resolveSchemaType({ schemaType: "CollectionPage", type: "puhe" });
      assert.equal(r.resolvedSchemaType, "CollectionPage");
      assert.equal(r.pageBlockType, "specialpage");
      assert.equal(r.specialPageType, "CollectionPage");
    });

    test("schemaType=AboutPage => specialpage", () => {
      const r = resolveSchemaType({ schemaType: "AboutPage" });
      assert.equal(r.pageBlockType, "specialpage");
      assert.equal(r.specialPageType, "AboutPage");
    });

    test("schemaType=Organization => business", () => {
      const r = resolveSchemaType({ schemaType: "Organization" });
      assert.equal(r.pageBlockType, "business");
    });

    test("schemaType=Thesis => thesis", () => {
      const r = resolveSchemaType({ schemaType: "Thesis" });
      assert.equal(r.pageBlockType, "thesis");
    });
  });

  describe("mediaType / contentType fallback", () => {
    test("mediaType=video ilman type => NewsArticle", () => {
      assert.equal(resolveSchemaType({ mediaType: "video" }).resolvedSchemaType, "NewsArticle");
    });

    test("contentType=scientificPublication ilman type => ScholarlyArticle", () => {
      // Yhdenmukainen type=tieteellinen kanssa. Aiemmin antoi "Article".
      const r = resolveSchemaType({ contentType: "scientificPublication" });
      assert.equal(r.resolvedSchemaType, "ScholarlyArticle");
      assert.equal(r.pageBlockType, "article");
    });
  });

  describe("tags fallback (ei type, ei mediaType, ei contentType)", () => {
    test("tags=blog => BlogPosting", () => {
      assert.equal(resolveSchemaType({ tags: ["blog"] }).resolvedSchemaType, "BlogPosting");
    });

    test("tags=politics => Article", () => {
      assert.equal(resolveSchemaType({ tags: ["politics"] }).resolvedSchemaType, "Article");
    });

    test("tags=publications => Article", () => {
      assert.equal(resolveSchemaType({ tags: ["publications"] }).resolvedSchemaType, "Article");
    });

    test("ei mitaan signaalia => resolvedSchemaType=null, pageBlockType=webpage", () => {
      const r = resolveSchemaType({});
      assert.equal(r.resolvedSchemaType, null);
      assert.equal(r.pageBlockType, "webpage");
    });
  });
});

// -----------------------------------------------------------------------------
// getTaxonomyType(item)
// -----------------------------------------------------------------------------
describe("getTaxonomyType", () => {
  describe("inputPath voittaa (media, presentations)", () => {
    test("inputPath sisaltaa /media/ => media", () => {
      const r = getTaxonomyType({ inputPath: "./src/media/foo.md", data: { type: "artikkeli" } });
      assert.deepEqual(r, { key: "media", label: "Mediassa" });
    });

    test("inputPath sisaltaa /presentations/ => presentations", () => {
      const r = getTaxonomyType({ inputPath: "./src/presentations/foo.md", data: {} });
      assert.deepEqual(r, { key: "presentations", label: "Esitykset ja videot" });
    });
  });

  describe("type-perusteiset (voittavat myohempia inputPath-fallbackeja)", () => {
    test("type=lausunto => statements", () => {
      assert.deepEqual(
        getTaxonomyType({ data: { type: "lausunto" } }),
        { key: "statements", label: "Lausunnot" }
      );
    });

    test("type=puhe + speechContext=valtuusto => council-speeches", () => {
      const r = getTaxonomyType({ data: { type: "puhe", speechContext: "valtuusto" } });
      assert.equal(r.key, "council-speeches");
      assert.equal(r.label, "Valtuustopuheenvuorot");
    });

    test("type=puhe + speechContext=kyselytunti => council-question-hours", () => {
      assert.equal(
        getTaxonomyType({ data: { type: "puhe", speechContext: "kyselytunti" } }).key,
        "council-question-hours"
      );
    });

    test("type=puhe + speechContext=akateeminen-puhe => academic-speeches", () => {
      assert.equal(
        getTaxonomyType({ data: { type: "puhe", speechContext: "akateeminen-puhe" } }).key,
        "academic-speeches"
      );
    });

    test("type=puhe + speechContext=juhlapuhe => ceremonial-speeches", () => {
      assert.equal(
        getTaxonomyType({ data: { type: "puhe", speechContext: "juhlapuhe" } }).key,
        "ceremonial-speeches"
      );
    });

    test("type=puhe + speechContext=julkinen-tilaisuus => public-speeches", () => {
      assert.equal(
        getTaxonomyType({ data: { type: "puhe", speechContext: "julkinen-tilaisuus" } }).key,
        "public-speeches"
      );
    });

    test("type=puhe ilman speechContext => speeches", () => {
      assert.equal(getTaxonomyType({ data: { type: "puhe" } }).key, "speeches");
    });

    test("type=mielipide => opinions", () => {
      assert.equal(getTaxonomyType({ data: { type: "mielipide" } }).key, "opinions");
    });

    test("type=kolumni => columns", () => {
      assert.equal(getTaxonomyType({ data: { type: "kolumni" } }).key, "columns");
    });
  });

  describe("inputPath fallback (politics, blog)", () => {
    test("inputPath sisaltaa /politics/ (ilman type) => initiatives", () => {
      const r = getTaxonomyType({ inputPath: "./src/politics/foo.md", data: {} });
      assert.deepEqual(r, { key: "initiatives", label: "Aloitteet ja asiat" });
    });

    test("inputPath sisaltaa /blog/ (ilman type) => blog", () => {
      const r = getTaxonomyType({ inputPath: "./src/blog/foo.md", data: {} });
      assert.deepEqual(r, { key: "blog", label: "Blogikirjoitukset" });
    });
  });

  describe("scientificPublication signaalit", () => {
    test("contentType=scientificPublication => scientific-publications", () => {
      const r = getTaxonomyType({ data: { contentType: "scientificPublication" } });
      assert.equal(r.key, "scientific-publications");
    });

    test("source=researchfi => scientific-publications", () => {
      const r = getTaxonomyType({ data: { source: "researchfi" } });
      assert.equal(r.key, "scientific-publications");
    });

    // [ristiriita] type=tieteellinen ei anna scientific-publications:ta ilman
    // contentType/source-avainta. resolveSchemaType antaa sen ScholarlyArticle:na.
    test("[ristiriita] type=tieteellinen ilman contentType/source => other", () => {
      assert.equal(getTaxonomyType({ data: { type: "tieteellinen" } }).key, "other");
    });
  });

  describe("fallback ja yhdistelmat", () => {
    test("ei mitaan signaalia => other", () => {
      assert.equal(getTaxonomyType({ data: {}, inputPath: "" }).key, "other");
    });

    test("inputPath=/media/ voittaa type=puhe+speechContext=valtuusto", () => {
      const r = getTaxonomyType({
        inputPath: "./src/media/foo.md",
        data: { type: "puhe", speechContext: "valtuusto" }
      });
      assert.equal(r.key, "media");
    });

    // [ristiriita] initiative_type-kentta ei vaikuta getTaxonomyType:iin,
    // vaikka writing-post.njk ja contentTypeLabel voisivat sitten kayttaa
    // sita. Vain inputPath /politics/ antaa initiatives-tunnisteen.
    test("[ristiriita] initiative_type=kuntalaisaloite ilman /politics/-polkua => other", () => {
      const r = getTaxonomyType({
        inputPath: "./src/publications/foo.md",
        data: { initiative_type: "kuntalaisaloite" }
      });
      assert.equal(r.key, "other");
    });
  });
});

// -----------------------------------------------------------------------------
// Kolmen paattelijan ristiriita samalle sisallolle
// -----------------------------------------------------------------------------
describe("kolmen paattelijan yhdenmukaisuus samalle sisallolle", () => {
  test("valtuustopuhe: label, schema, taxonomy", () => {
    const data = { type: "puhe", speechContext: "valtuusto" };
    const item = { inputPath: "./src/publications/foo.md", data };

    assert.equal(contentTypeLabel(data, [], "fi"), "Valtuustopuheenvuoro");
    assert.equal(resolveSchemaType(data).resolvedSchemaType, "Article");
    assert.equal(getTaxonomyType(item).key, "council-speeches");
  });

  test("valtuuston kyselytunti: label, schema, taxonomy", () => {
    const data = { type: "puhe", speechContext: "kyselytunti" };
    const item = { inputPath: "./src/publications/foo.md", data };

    assert.equal(contentTypeLabel(data, [], "fi"), "Valtuuston kyselytunti");
    assert.equal(resolveSchemaType(data).resolvedSchemaType, "Article");
    assert.equal(getTaxonomyType(item).key, "council-question-hours");
  });

  test("mielipide (pub_mielipide_political): label, schema, taxonomy", () => {
    const data = { type: "mielipide", opinionRoles: ["political"] };
    const item = { inputPath: "./src/publications/foo.md", data };

    assert.equal(contentTypeLabel(data, ["publications"], "fi"), "Mielipide");
    assert.equal(resolveSchemaType(data).resolvedSchemaType, "OpinionNewsArticle");
    assert.equal(getTaxonomyType(item).key, "opinions");
  });

  test("media podcast: label, schema, taxonomy", () => {
    const data = { mediaType: "podcast", mediaRole: "guest" };
    const item = { inputPath: "./src/media/foo.md", data };

    assert.equal(contentTypeLabel(data, [], "fi"), "Podcast");
    assert.equal(resolveSchemaType(data).resolvedSchemaType, "NewsArticle");
    assert.equal(getTaxonomyType(item).key, "media");
  });

  test("blogi: label, schema, taxonomy", () => {
    const data = { type: "blogikirjoitus" };
    const item = { inputPath: "./src/blog/foo.md", data: { ...data, tags: ["blog"] } };

    // Nyt type=blogikirjoitus antaa "Blogikirjoitus" myos ilman tags=blog:ia.
    assert.equal(contentTypeLabel({ ...data, tags: ["blog"] }, ["blog"], "fi"), "Blogikirjoitus");
    assert.equal(contentTypeLabel(data, [], "fi"), "Blogikirjoitus");
    assert.equal(resolveSchemaType(data).resolvedSchemaType, "BlogPosting");
    assert.equal(getTaxonomyType(item).key, "blog");
  });

  test("scientificPublication (researchfi): label, schema, taxonomy", () => {
    const data = { contentType: "scientificPublication", source: "researchfi" };
    const item = { inputPath: "./src/pages/foo.md", data };

    // Nyt kaikki kolme paattelijaa antavat yhdenmukaisen tuloksen.
    assert.equal(contentTypeLabel(data, [], "fi"), "Tieteellinen julkaisu");
    assert.equal(resolveSchemaType(data).resolvedSchemaType, "ScholarlyArticle");
    assert.equal(getTaxonomyType(item).key, "scientific-publications");
  });

  test("esitys: label, schema, taxonomy", () => {
    const data = { type: "esitys", source: "canva" };
    const item = { inputPath: "./src/presentations/foo.md", data };

    assert.equal(contentTypeLabel(data, [], "fi"), "Esitys");
    assert.equal(resolveSchemaType(data).resolvedSchemaType, "PresentationDigitalDocument");
    assert.equal(getTaxonomyType(item).key, "presentations");
  });
});

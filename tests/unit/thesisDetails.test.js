const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  extractStableThesisId,
  buildThesisDetailModel,
  buildCanonicalThesisDetailsModel,
  getThesisDetailById
} = require("../../src/_data/thesisDetails");

describe("thesisDetails", () => {
  test("extractStableThesisId parses OuluREPO handle id", () => {
    assert.equal(
      extractStableThesisId("https://oulurepo.oulu.fi/handle/10024/62907"),
      "62907"
    );
  });

  test("buildThesisDetailModel creates local canonical detail projection", () => {
    const detail = buildThesisDetailModel({
      title: "Kuinka opettajaopiskelijoiden tekoalytaidot nakyvat heidan tekemissaan luokittelijasovelluksissa",
      year: "2026",
      authors: ["Turunen, Petteri", "Annola, Minna"],
      type: "masterThesis",
      link: "https://oulurepo.oulu.fi/handle/10024/62907",
      abstract: "Tiivistelma.",
      language: "fin",
      keywords: ["tekoaly", "opettajankoulutus"],
      researchLine: "ai-literacy",
      researchThemes: ["tekoalylukutaito"],
      citationApa: "Turunen, P., & Annola, M. (2026). Example."
    });

    assert.equal(detail.id, "62907");
    assert.equal(detail.pageUrl, "/opinnaytteet/62907/");
    assert.equal(detail.sourceUrl, "https://oulurepo.oulu.fi/handle/10024/62907");
    assert.equal(detail.thesisTypeLabelFi, "Pro gradu -tutkielma");
    assert.equal(detail.lang, "fi");
  });

  test("buildCanonicalThesisDetailsModel deduplicates by stable source URL", () => {
    const model = buildCanonicalThesisDetailsModel({
      gradut: [{
        title: "Same thesis",
        year: "2026",
        authors: ["A"],
        type: "masterThesis",
        link: "https://oulurepo.oulu.fi/handle/10024/62907",
        abstract: "Tiivistelmä",
        language: "fin"
      }],
      kandit: [],
      reviewerOnly: [{
        title: "Same thesis duplicate",
        year: "2026",
        authors: ["A"],
        type: "masterThesis",
        link: "https://oulurepo.oulu.fi/handle/10024/62907",
        abstract: "Tiivistelmä",
        language: "fin"
      }]
    });

    assert.equal(model.count, 1);
    assert.equal(model.items.length, 1);
    assert.equal(model.items[0].pageUrl, "/opinnaytteet/62907/");
    assert.equal(model.byId["62907"].id, "62907");
  });

  test("known thesis id resolves from canonical cache-backed data", async () => {
    process.env.CACHE_ONLY = "true";
    const detail = await getThesisDetailById("62907");

    assert.ok(detail);
    assert.equal(detail.id, "62907");
    assert.equal(detail.pageUrl, "/opinnaytteet/62907/");
    assert.equal(detail.title, "Kuinka opettajaopiskelijoiden tekoälytaidot näkyvät heidän tekemissään luokittelijasovelluksissa");
  });

  test("unknown thesis id returns null", async () => {
    process.env.CACHE_ONLY = "true";
    const detail = await getThesisDetailById("999999999");
    assert.equal(detail, null);
  });
});

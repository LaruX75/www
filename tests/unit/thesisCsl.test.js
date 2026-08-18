const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildThesisCslItem,
  THESIS_GENRE_FI,
  THESIS_GENRE_DEFAULT_FI,
  THESIS_PUBLISHER
} = require("../../src/_utils/thesisCsl");

describe("buildThesisCslItem — constants", () => {
  test("Finnish canonical genre map covers master + bachelor + doctoral + licentiate", () => {
    assert.equal(THESIS_GENRE_FI.masterThesis, "Pro gradu -tutkielma");
    assert.equal(THESIS_GENRE_FI.bachelorThesis, "Kandidaatintutkielma");
    assert.equal(THESIS_GENRE_FI.doctoralThesis, "Väitöskirja");
    assert.equal(THESIS_GENRE_FI.licentiateThesis, "Lisensiaatintutkielma");
    assert.equal(THESIS_GENRE_DEFAULT_FI, "Opinnäyte");
  });
  test("publisher is canonical Finnish 'Oulun yliopisto'", () => {
    assert.equal(THESIS_PUBLISHER, "Oulun yliopisto");
  });
});

describe("buildThesisCslItem — master's thesis (canonical shape)", () => {
  test("maps canonical thesis to CSL with type=thesis + FI genre + issued", () => {
    const csl = buildThesisCslItem({
      link: "https://oulurepo.oulu.fi/handle/18096",
      title: "Professional development of technology integration into teaching",
      authors: ["Mattila, Teemu"],
      year: "2021",
      type: "masterThesis",
      language: "eng"
    });
    assert.equal(csl.id, "https://oulurepo.oulu.fi/handle/18096");
    assert.equal(csl.type, "thesis");
    assert.equal(csl.title, "Professional development of technology integration into teaching");
    assert.deepEqual(csl.author, [{ family: "Mattila", given: "Teemu" }]);
    assert.deepEqual(csl.issued, { "date-parts": [[2021]] });
    assert.equal(csl.genre, "Pro gradu -tutkielma");
    assert.equal(csl.publisher, "Oulun yliopisto");
    assert.equal(csl.URL, "https://oulurepo.oulu.fi/handle/18096");
    assert.equal(csl.language, "en");
  });
});

describe("buildThesisCslItem — thesisDetail shape (built model, not raw)", () => {
  test("prefers pageUrl as id when both are present", () => {
    const csl = buildThesisCslItem({
      pageUrl: "/opinnaytteet/18096/",
      sourceUrl: "https://oulurepo.oulu.fi/handle/18096",
      title: "T",
      authorLine: "Mattila, Teemu",
      year: "2021",
      thesisType: "masterThesis",
      lang: "en"
    });
    assert.equal(csl.id, "/opinnaytteet/18096/");
    assert.equal(csl.URL, "https://oulurepo.oulu.fi/handle/18096");
  });
});

describe("buildThesisCslItem — bachelor / doctoral / licentiate / unknown", () => {
  const base = { pageUrl: "x", title: "t", authors: ["A"], year: "2020" };
  test("bachelor → Kandidaatintutkielma", () => {
    assert.equal(buildThesisCslItem({ ...base, type: "bachelorThesis" }).genre, "Kandidaatintutkielma");
  });
  test("doctoral → Väitöskirja", () => {
    assert.equal(buildThesisCslItem({ ...base, type: "doctoralThesis" }).genre, "Väitöskirja");
  });
  test("licentiate → Lisensiaatintutkielma", () => {
    assert.equal(buildThesisCslItem({ ...base, type: "licentiateThesis" }).genre, "Lisensiaatintutkielma");
  });
  test("unknown / missing type → Opinnäyte fallback", () => {
    assert.equal(buildThesisCslItem({ ...base, type: "" }).genre, "Opinnäyte");
    assert.equal(buildThesisCslItem({ ...base }).genre, "Opinnäyte");
  });
});

describe("buildThesisCslItem — reviewer-only records still produce a CSL item", () => {
  test("thesisRole is not required by the CSL projection", () => {
    const csl = buildThesisCslItem({
      link: "https://oulurepo.oulu.fi/handle/99999",
      title: "Reviewed thesis title",
      authors: ["Someone, Else"],
      year: "2018",
      type: "masterThesis",
      language: "fin",
      thesisRole: "reviewed"
    });
    assert.equal(csl.type, "thesis");
    assert.equal(csl.title, "Reviewed thesis title");
  });
});

describe("buildThesisCslItem — missing / partial fields", () => {
  test("missing year → issued omitted, no crash", () => {
    const csl = buildThesisCslItem({
      pageUrl: "x", title: "t", authors: ["A, B"], type: "masterThesis"
    });
    assert.equal(csl.issued, undefined);
    assert.equal(csl.genre, "Pro gradu -tutkielma");
  });
  test("missing authors → author omitted", () => {
    const csl = buildThesisCslItem({
      pageUrl: "x", title: "t", year: "2020", type: "masterThesis"
    });
    assert.equal(csl.author, undefined);
  });
  test("empty title returns null", () => {
    assert.equal(buildThesisCslItem({ pageUrl: "x", authors: ["A"] }), null);
  });
  test("empty id returns null", () => {
    assert.equal(buildThesisCslItem({ title: "t", authors: ["A"] }), null);
  });
  test("non-object input returns null", () => {
    assert.equal(buildThesisCslItem(null), null);
    assert.equal(buildThesisCslItem(undefined), null);
    assert.equal(buildThesisCslItem("string"), null);
  });
  test("non-http URL is dropped", () => {
    const csl = buildThesisCslItem({
      pageUrl: "/opinnaytteet/x/",
      sourceUrl: "ftp://old-server.example",
      title: "t", authors: ["A"], year: 2020, type: "masterThesis"
    });
    assert.equal(csl.URL, undefined);
  });
});

describe("buildThesisCslItem — language normalization", () => {
  test("'fin' / 'fi' both map to 'fi'", () => {
    const a = buildThesisCslItem({ pageUrl: "x", title: "t", language: "fin", type: "masterThesis" });
    const b = buildThesisCslItem({ pageUrl: "x", title: "t", language: "fi", type: "masterThesis" });
    assert.equal(a.language, "fi");
    assert.equal(b.language, "fi");
  });
  test("'eng' / 'en' both map to 'en'", () => {
    const a = buildThesisCslItem({ pageUrl: "x", title: "t", language: "eng", type: "masterThesis" });
    const b = buildThesisCslItem({ pageUrl: "x", title: "t", language: "en", type: "masterThesis" });
    assert.equal(a.language, "en");
    assert.equal(b.language, "en");
  });
  test("unknown language is omitted", () => {
    const csl = buildThesisCslItem({ pageUrl: "x", title: "t", language: "xx", type: "masterThesis" });
    assert.equal(csl.language, undefined);
  });
});

describe("buildThesisCslItem — input immutability", () => {
  test("does not mutate the input object", () => {
    const input = {
      link: "https://oulurepo.oulu.fi/handle/18096",
      title: "T", authors: ["Mattila, Teemu"], year: "2021",
      type: "masterThesis", language: "eng"
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    buildThesisCslItem(input);
    assert.deepEqual(input, snapshot);
  });
});

describe("buildThesisCslItem — determinism", () => {
  test("identical input yields identical output across repeated calls", () => {
    const input = {
      link: "https://oulurepo.oulu.fi/handle/18096",
      title: "T", authors: ["A, B"], year: 2021, type: "masterThesis"
    };
    const a = buildThesisCslItem(input);
    const b = buildThesisCslItem(input);
    assert.deepEqual(a, b);
    assert.deepEqual(Object.keys(a), Object.keys(b));
  });
});

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildCslItem,
  parseAuthors,
  normalizeDoi,
  normalizePages,
  OKM_TO_CSL_TYPE
} = require("../../src/_utils/publicationCsl");

describe("buildCslItem — journal article (OKM A1)", () => {
  test("maps A1 to article-journal with all core fields", () => {
    const csl = buildCslItem({
      anchorId: "researchfi-abc",
      title: "Learning analytics in higher education",
      typeCode: "A1",
      authors: "Laru, Jari; Näykki, Piia",
      journal: "Journal of Learning Analytics",
      publisher: "Society for Learning Analytics Research",
      volume: "10",
      issue: "2",
      pages: "45–62",
      doi: "10.1234/JLA.2024.001",
      doiUrl: "https://doi.org/10.1234/JLA.2024.001",
      year: 2024,
      lang: "en"
    });

    assert.equal(csl.id, "researchfi-abc");
    assert.equal(csl.type, "article-journal");
    assert.equal(csl.title, "Learning analytics in higher education");
    assert.deepEqual(csl.author, [
      { family: "Laru", given: "Jari" },
      { family: "Näykki", given: "Piia" }
    ]);
    assert.equal(csl["container-title"], "Journal of Learning Analytics");
    assert.equal(csl.publisher, "Society for Learning Analytics Research");
    assert.equal(csl.volume, "10");
    assert.equal(csl.issue, "2");
    assert.equal(csl.page, "45-62");
    assert.equal(csl.DOI, "10.1234/jla.2024.001");
    assert.equal(csl.URL, "https://doi.org/10.1234/JLA.2024.001");
    assert.deepEqual(csl.issued, { "date-parts": [[2024]] });
    assert.equal(csl.language, "en");
  });
});

describe("buildCslItem — conference paper (OKM A4)", () => {
  test("maps A4 to paper-conference", () => {
    const csl = buildCslItem({
      anchorId: "researchfi-a4",
      title: "Design experiment on collaborative learning",
      typeCode: "A4",
      authors: "Laru, J.",
      journal: "Proceedings of CSCL 2019",
      year: 2019
    });
    assert.equal(csl.type, "paper-conference");
    assert.equal(csl["container-title"], "Proceedings of CSCL 2019");
  });
});

describe("buildCslItem — book / chapter", () => {
  test("maps C1 to book", () => {
    const csl = buildCslItem({
      anchorId: "manual-c1",
      title: "Some Monograph",
      typeCode: "C1",
      authors: "Laru, Jari",
      isbn: "978-1-2345-6789-0",
      year: 2022
    });
    assert.equal(csl.type, "book");
    assert.equal(csl.ISBN, "978-1-2345-6789-0");
  });

  test("maps B2 to chapter", () => {
    const csl = buildCslItem({
      anchorId: "manual-b2",
      title: "Chapter title",
      typeCode: "B2",
      journal: "Edited volume",
      year: 2020
    });
    assert.equal(csl.type, "chapter");
    assert.equal(csl["container-title"], "Edited volume");
  });
});

describe("buildCslItem — thesis (OKM G-codes)", () => {
  test("maps G4 to thesis with doctoral genre", () => {
    const csl = buildCslItem({
      anchorId: "manual-g4",
      title: "Sytyttäjää seikkailemassa",
      typeCode: "G4",
      authors: "Laru, Jari",
      year: 2012
    });
    assert.equal(csl.type, "thesis");
    assert.equal(csl.genre, "Doctoral dissertation");
  });

  test("maps G2 to thesis with master's genre", () => {
    const csl = buildCslItem({
      anchorId: "manual-g2",
      title: "Some master thesis",
      typeCode: "G2",
      year: 2005
    });
    assert.equal(csl.type, "thesis");
    assert.equal(csl.genre, "Master's thesis");
  });
});

describe("buildCslItem — DOI normalization", () => {
  test("strips https://doi.org/ prefix and lowercases", () => {
    const csl = buildCslItem({
      anchorId: "x",
      title: "t",
      typeCode: "A1",
      doi: "https://doi.org/10.1234/ABC.DEF"
    });
    assert.equal(csl.DOI, "10.1234/abc.def");
  });

  test("strips doi: prefix", () => {
    const csl = buildCslItem({
      anchorId: "x",
      title: "t",
      typeCode: "A1",
      doi: "doi:10.5555/Foo.Bar"
    });
    assert.equal(csl.DOI, "10.5555/foo.bar");
  });

  test("rejects strings that are not DOIs", () => {
    const csl = buildCslItem({
      anchorId: "x",
      title: "t",
      typeCode: "A1",
      doi: "not-a-doi"
    });
    assert.equal(csl.DOI, undefined);
  });
});

describe("buildCslItem — issued / year", () => {
  test("emits issued.date-parts from year", () => {
    const csl = buildCslItem({
      anchorId: "x",
      title: "t",
      typeCode: "A1",
      year: 2018
    });
    assert.deepEqual(csl.issued, { "date-parts": [[2018]] });
  });

  test("omits issued when year is missing", () => {
    const csl = buildCslItem({
      anchorId: "x",
      title: "t",
      typeCode: "A1"
    });
    assert.equal(csl.issued, undefined);
  });
});

describe("buildCslItem — pages normalization", () => {
  test("converts en-dash and em-dash to hyphen", () => {
    assert.equal(normalizePages("12–34"), "12-34");
    assert.equal(normalizePages("12—34"), "12-34");
  });

  test("removes internal whitespace", () => {
    assert.equal(normalizePages("12 – 34"), "12-34");
  });
});

describe("buildCslItem — free-text author parsing", () => {
  test("parses 'family, given' pairs separated by semicolons", () => {
    assert.deepEqual(parseAuthors("Laru, J.; Näykki, P."), [
      { family: "Laru", given: "J." },
      { family: "Näykki", given: "P." }
    ]);
  });

  test("falls back to {literal} when comma-parse fails", () => {
    assert.deepEqual(parseAuthors("Anonymous"), [{ literal: "Anonymous" }]);
  });

  test("mixed literal and structured is preserved per-entry", () => {
    assert.deepEqual(parseAuthors("Laru, J.; The Collective"), [
      { family: "Laru", given: "J." },
      { literal: "The Collective" }
    ]);
  });

  test("empty string yields empty array", () => {
    assert.deepEqual(parseAuthors(""), []);
  });
});

describe("buildCslItem — missing / partial fields", () => {
  test("omits empty container-title, publisher, ISBN, URL", () => {
    const csl = buildCslItem({
      anchorId: "x",
      title: "t",
      typeCode: "A1"
    });
    assert.equal(csl["container-title"], undefined);
    assert.equal(csl.publisher, undefined);
    assert.equal(csl.ISBN, undefined);
    assert.equal(csl.URL, undefined);
  });

  test("returns null when title is missing", () => {
    assert.equal(buildCslItem({ anchorId: "x", typeCode: "A1" }), null);
  });

  test("returns null when id is missing", () => {
    assert.equal(buildCslItem({ title: "t", typeCode: "A1" }), null);
  });

  test("returns null for non-object input", () => {
    assert.equal(buildCslItem(null), null);
    assert.equal(buildCslItem(undefined), null);
    assert.equal(buildCslItem("string"), null);
  });
});

describe("buildCslItem — unknown OKM type fallback", () => {
  test("defaults to article-journal for unrecognized code", () => {
    const csl = buildCslItem({
      anchorId: "x",
      title: "t",
      typeCode: "ZZZ"
    });
    assert.equal(csl.type, "article-journal");
    assert.equal(csl.genre, undefined);
  });

  test("defaults to article-journal for missing code", () => {
    const csl = buildCslItem({
      anchorId: "x",
      title: "t"
    });
    assert.equal(csl.type, "article-journal");
  });
});

describe("buildCslItem — input immutability", () => {
  test("does not mutate the input object", () => {
    const input = {
      anchorId: "x",
      title: "t",
      typeCode: "A1",
      authors: "Laru, J.",
      year: 2024
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    buildCslItem(input);
    assert.deepEqual(input, snapshot);
  });
});

describe("buildCslItem — determinism", () => {
  test("returns structurally equal output for identical input", () => {
    const input = {
      anchorId: "x",
      title: "t",
      typeCode: "A1",
      authors: "Laru, J.; Näykki, P.",
      journal: "J",
      year: 2024,
      doi: "10.1/2"
    };
    const a = buildCslItem(input);
    const b = buildCslItem(input);
    assert.deepEqual(a, b);
    assert.deepEqual(Object.keys(a), Object.keys(b));
  });
});

describe("OKM_TO_CSL_TYPE — coverage", () => {
  test("covers all A/B/C/D/E/F/G codes referenced in the audit", () => {
    const expectedCodes = [
      "A1", "A2", "A3", "A4",
      "B1", "B2", "B3",
      "C1", "C2",
      "D1", "D2", "D3", "D4", "D5", "D6",
      "E1", "E2", "E3",
      "F1", "F2", "F3",
      "G1", "G2", "G3", "G4", "G5"
    ];
    expectedCodes.forEach((code) => {
      assert.ok(OKM_TO_CSL_TYPE[code], `missing OKM→CSL mapping for ${code}`);
    });
  });
});

describe("buildCslItem — normalizeDoi is exported and idempotent", () => {
  test("bare DOI is unchanged (except case)", () => {
    assert.equal(normalizeDoi("10.1234/abc"), "10.1234/abc");
    assert.equal(normalizeDoi("10.1234/ABC"), "10.1234/abc");
  });

  test("empty / invalid input yields empty string", () => {
    assert.equal(normalizeDoi(""), "");
    assert.equal(normalizeDoi(null), "");
    assert.equal(normalizeDoi("nonsense"), "");
  });
});

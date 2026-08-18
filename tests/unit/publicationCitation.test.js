const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildCitation,
  SUPPORTED_STYLES,
  DEFAULT_STYLE
} = require("../../src/_utils/publicationCitation");

const { buildCslItem } = require("../../src/_utils/publicationCsl");

function cslJournal() {
  return buildCslItem({
    anchorId: "j1",
    title: "Collaborative learning in networked environments",
    typeCode: "A1",
    authors: "Laru, Jari; Näykki, Piia",
    journal: "Computers & Education",
    publisher: "Elsevier",
    volume: "42",
    issue: "3",
    pages: "101-115",
    doi: "10.1000/CE.2020.001",
    year: 2020,
    lang: "en"
  });
}

function cslConference() {
  return buildCslItem({
    anchorId: "c1",
    title: "Designing scripts for CSCL",
    typeCode: "A4",
    authors: "Laru, Jari",
    journal: "Proceedings of CSCL 2019",
    year: 2019
  });
}

function cslChapter() {
  return buildCslItem({
    anchorId: "b2-1",
    title: "Mobile SRL tools",
    typeCode: "B2",
    authors: "Laru, Jari",
    journal: "Handbook of Mobile Learning",
    publisher: "Routledge",
    pages: "12-30",
    year: 2018
  });
}

function cslBook() {
  return buildCslItem({
    anchorId: "c1-book",
    title: "Some Monograph",
    typeCode: "C1",
    authors: "Laru, Jari",
    publisher: "Some Publisher",
    isbn: "978-1-2345-6789-0",
    year: 2022
  });
}

function cslThesis() {
  return buildCslItem({
    anchorId: "g5-1",
    title: "Scaffolding learning activities",
    typeCode: "G5",
    authors: "Laru, Jari",
    publisher: "University of Oulu",
    year: 2012
  });
}

function cslLiteralAuthors() {
  return buildCslItem({
    anchorId: "lit1",
    title: "Free-text authored paper",
    typeCode: "A1",
    authors: "Krenare Pireva Nuci; Jari Laru",
    journal: "Journal X",
    year: 2026
  });
}

function cslNoDoi() {
  return buildCslItem({
    anchorId: "nodoi",
    title: "Paper without a DOI",
    typeCode: "A1",
    authors: "Laru, Jari",
    journal: "Local Journal",
    year: 2010
  });
}

describe("buildCitation — API surface", () => {
  test("SUPPORTED_STYLES is the expected set", () => {
    assert.deepEqual(SUPPORTED_STYLES, ["apa", "mla", "chicago", "bibtex", "ris"]);
  });

  test("DEFAULT_STYLE is apa", () => {
    assert.equal(DEFAULT_STYLE, "apa");
  });

  test("returns empty for missing / null csl", () => {
    assert.deepEqual(buildCitation({ csl: null, style: "apa" }), { text: "", style: "apa", empty: true });
    assert.deepEqual(buildCitation({}), { text: "", style: "apa", empty: true });
  });

  test("returns empty for csl missing id or title", () => {
    assert.equal(buildCitation({ csl: { title: "T" }, style: "apa" }).empty, true);
    assert.equal(buildCitation({ csl: { id: "x" }, style: "apa" }).empty, true);
  });

  test("unknown style falls back to APA", () => {
    const csl = cslJournal();
    const unk = buildCitation({ csl, style: "unknown" });
    const apa = buildCitation({ csl, style: "apa" });
    assert.equal(unk.text, apa.text);
    assert.equal(unk.style, "apa");
  });
});

describe("buildCitation — APA journal article", () => {
  test("includes structured authors, year, title, journal, volume(issue), pages, DOI", () => {
    const out = buildCitation({ csl: cslJournal(), style: "apa" }).text;
    assert.match(out, /Laru, J\., & Näykki, P\./);
    assert.match(out, /\(2020\)\./);
    assert.match(out, /Collaborative learning in networked environments\./);
    assert.match(out, /Computers & Education/);
    assert.match(out, /42\(3\)/);
    assert.match(out, /101-115/);
    assert.match(out, /https:\/\/doi\.org\/10\.1000\/ce\.2020\.001/);
  });
});

describe("buildCitation — APA conference paper", () => {
  test("uses container-title as venue", () => {
    const out = buildCitation({ csl: cslConference(), style: "apa" }).text;
    assert.match(out, /Laru, J\. \(2019\)\. Designing scripts for CSCL\./);
    assert.match(out, /Proceedings of CSCL 2019/);
  });
});

describe("buildCitation — APA book chapter", () => {
  test("uses 'Teoksessa' preposition and publisher trailing", () => {
    const out = buildCitation({ csl: cslChapter(), style: "apa" }).text;
    assert.match(out, /Laru, J\. \(2018\)\. Mobile SRL tools\./);
    assert.match(out, /Teoksessa Handbook of Mobile Learning \(12-30\)/);
    assert.match(out, /Routledge\./);
  });
});

describe("buildCitation — APA book", () => {
  test("book: publisher after title, no container-title needed", () => {
    const out = buildCitation({ csl: cslBook(), style: "apa" }).text;
    assert.match(out, /Laru, J\. \(2022\)\. Some Monograph\./);
    assert.match(out, /Some Publisher\./);
  });
});

describe("buildCitation — APA thesis (Phase 2 bracket format)", () => {
  test("APA thesis renders APA 7 bracket notation with no period between title and bracket", () => {
    const out = buildCitation({ csl: cslThesis(), style: "apa" }).text;
    // Authors (Year). Title [Genre, Publisher].
    // Title has NO trailing period before the bracket per APA 7 §10.6.
    assert.match(out, /Laru, J\. \(2012\)\. Scaffolding learning activities \[Doctoral dissertation \(article-based\), University of Oulu\]\./);
    // Belt-and-suspenders: assert no `Title. [` sequence sneaked in.
    assert.doesNotMatch(out, /activities\. \[/);
  });

  test("APA thesis (OuluREPO Finnish genre) — bracket keeps FI strings by default", () => {
    const csl = {
      id: "https://oulurepo.oulu.fi/handle/18096",
      type: "thesis",
      title: "Kouluikäisten teknologiataitojen kehitys",
      author: [{ family: "Mattila", given: "Teemu" }],
      issued: { "date-parts": [[2021]] },
      genre: "Pro gradu -tutkielma",
      publisher: "Oulun yliopisto"
    };
    const out = buildCitation({ csl, style: "apa" }).text;
    assert.match(out, /Mattila, T\. \(2021\)\. Kouluikäisten teknologiataitojen kehitys \[Pro gradu -tutkielma, Oulun yliopisto\]\./);
  });

  test("APA thesis lang='en' translates Finnish genre + publisher via display map", () => {
    const csl = {
      id: "https://oulurepo.oulu.fi/handle/18096",
      type: "thesis",
      title: "School-age technology skills development",
      author: [{ family: "Mattila", given: "Teemu" }],
      issued: { "date-parts": [[2021]] },
      genre: "Pro gradu -tutkielma",
      publisher: "Oulun yliopisto"
    };
    const out = buildCitation({ csl, style: "apa", lang: "en" }).text;
    assert.match(out, /\[Master's thesis, University of Oulu\]\./);
  });

  test("APA thesis lang='en' translates all four canonical FI genres", () => {
    const base = {
      id: "x", type: "thesis", title: "T",
      author: [{ family: "F", given: "G" }],
      issued: { "date-parts": [[2020]] },
      publisher: "Oulun yliopisto"
    };
    const master = buildCitation({ csl: { ...base, genre: "Pro gradu -tutkielma" }, style: "apa", lang: "en" }).text;
    const bachelor = buildCitation({ csl: { ...base, genre: "Kandidaatintutkielma" }, style: "apa", lang: "en" }).text;
    const doctoral = buildCitation({ csl: { ...base, genre: "Väitöskirja" }, style: "apa", lang: "en" }).text;
    const licentiate = buildCitation({ csl: { ...base, genre: "Lisensiaatintutkielma" }, style: "apa", lang: "en" }).text;
    const fallback = buildCitation({ csl: { ...base, genre: "Opinnäyte" }, style: "apa", lang: "en" }).text;
    assert.match(master, /\[Master's thesis, University of Oulu\]/);
    assert.match(bachelor, /\[Bachelor's thesis, University of Oulu\]/);
    assert.match(doctoral, /\[Doctoral dissertation, University of Oulu\]/);
    assert.match(licentiate, /\[Licentiate thesis, University of Oulu\]/);
    assert.match(fallback, /\[Thesis, University of Oulu\]/);
  });

  test("APA thesis lang='en' passes unknown genre through unchanged", () => {
    const csl = {
      id: "x", type: "thesis", title: "T",
      author: [{ family: "F", given: "G" }],
      issued: { "date-parts": [[2020]] },
      genre: "Doctoral dissertation (article-based)",
      publisher: "University of Oulu"
    };
    const out = buildCitation({ csl, style: "apa", lang: "en" }).text;
    // Unknown genre and English publisher both pass through verbatim.
    assert.match(out, /\[Doctoral dissertation \(article-based\), University of Oulu\]\./);
  });

  test("APA thesis without publisher renders bracket with genre only", () => {
    const csl = {
      id: "x", type: "thesis", title: "T",
      author: [{ family: "F", given: "G" }],
      issued: { "date-parts": [[2020]] },
      genre: "Pro gradu -tutkielma"
    };
    const out = buildCitation({ csl, style: "apa" }).text;
    assert.match(out, /\[Pro gradu -tutkielma\]\./);
    assert.doesNotMatch(out, /,\s*\]/);
  });

  test("APA thesis without genre falls back to language-appropriate default", () => {
    const base = {
      id: "x", type: "thesis", title: "T",
      author: [{ family: "F", given: "G" }],
      issued: { "date-parts": [[2020]] },
      publisher: "Oulun yliopisto"
    };
    const fi = buildCitation({ csl: base, style: "apa" }).text;
    const en = buildCitation({ csl: base, style: "apa", lang: "en" }).text;
    assert.match(fi, /\[Opinnäyte, Oulun yliopisto\]/);
    assert.match(en, /\[Thesis, University of Oulu\]/);
  });

  test("APA thesis lang param defaults to 'fi' for unknown values", () => {
    const csl = {
      id: "x", type: "thesis", title: "T",
      author: [{ family: "F", given: "G" }],
      issued: { "date-parts": [[2020]] },
      genre: "Pro gradu -tutkielma",
      publisher: "Oulun yliopisto"
    };
    const bogus = buildCitation({ csl, style: "apa", lang: "de" }).text;
    const fi = buildCitation({ csl, style: "apa", lang: "fi" }).text;
    assert.equal(bogus, fi);
  });

  test("APA thesis lang param does not affect non-thesis types", () => {
    const csl = cslBook();
    const noLang = buildCitation({ csl, style: "apa" }).text;
    const enLang = buildCitation({ csl, style: "apa", lang: "en" }).text;
    assert.equal(noLang, enLang);
  });
});

describe("buildCitation — 'Given [Middle] Family' authors", () => {
  test("Phase 4c: raw 'Given Family' pattern is normalised to 'Family, G.' per APA", () => {
    // Phase 1's parser used to fall through to {literal} for this
    // pattern. Phase 4c extended parseAuthorPart to detect the
    // "Given [Middle] Family" case so the APA renderer produces
    // the expected initials-based citation for every taxonomy
    // publication row.
    const out = buildCitation({ csl: cslLiteralAuthors(), style: "apa" }).text;
    assert.match(out, /Nuci, K\. P\., & Laru, J\./);
    assert.match(out, /\(2026\)/);
    assert.match(out, /Journal X/);
  });
});

describe("buildCitation — no DOI", () => {
  test("omits DOI suffix when csl.DOI is absent", () => {
    const out = buildCitation({ csl: cslNoDoi(), style: "apa" }).text;
    assert.doesNotMatch(out, /doi\.org/);
  });
});

describe("buildCitation — MLA", () => {
  test("MLA journal article", () => {
    const out = buildCitation({ csl: cslJournal(), style: "mla" }).text;
    assert.match(out, /^Laru, Jari, and Piia Näykki\./);
    assert.match(out, /"Collaborative learning in networked environments\."/);
    assert.match(out, /Computers & Education, vol\. 42, no\. 3, 2020, pp\. 101-115/);
    assert.match(out, /doi:10\.1000\/ce\.2020\.001\.$/);
  });
});

describe("buildCitation — Chicago", () => {
  test("Chicago journal article", () => {
    const out = buildCitation({ csl: cslJournal(), style: "chicago" }).text;
    assert.match(out, /^Laru, Jari, and Piia Näykki\./);
    assert.match(out, /Computers & Education 42, no\. 3 \(2020\): 101-115\./);
    assert.match(out, /https:\/\/doi\.org\/10\.1000\/ce\.2020\.001\.$/);
  });
});

describe("buildCitation — BibTeX", () => {
  test("BibTeX @article for journal", () => {
    const out = buildCitation({ csl: cslJournal(), style: "bibtex" }).text;
    assert.match(out, /^@article\{/);
    assert.match(out, /author = \{Laru, Jari and Näykki, Piia\}/);
    assert.match(out, /journal = \{Computers & Education\}/);
    assert.match(out, /doi = \{10\.1000\/ce\.2020\.001\}/);
  });

  test("BibTeX @inbook for chapter with booktitle", () => {
    const out = buildCitation({ csl: cslChapter(), style: "bibtex" }).text;
    assert.match(out, /^@inbook\{/);
    assert.match(out, /booktitle = \{Handbook of Mobile Learning\}/);
  });

  test("BibTeX @inproceedings for conference paper", () => {
    const out = buildCitation({ csl: cslConference(), style: "bibtex" }).text;
    assert.match(out, /^@inproceedings\{/);
    assert.match(out, /booktitle = \{Proceedings of CSCL 2019\}/);
  });

  test("BibTeX @phdthesis for thesis", () => {
    const out = buildCitation({ csl: cslThesis(), style: "bibtex" }).text;
    assert.match(out, /^@phdthesis\{/);
  });

  test("BibTeX includes isbn when present", () => {
    const out = buildCitation({ csl: cslBook(), style: "bibtex" }).text;
    assert.match(out, /isbn = \{978-1-2345-6789-0\}/);
  });
});

describe("buildCitation — RIS", () => {
  test("RIS TY JOUR for journal, AU per author, SP/EP for page range", () => {
    const out = buildCitation({ csl: cslJournal(), style: "ris" }).text;
    assert.match(out, /^TY  - JOUR\n/);
    assert.match(out, /AU  - Laru, Jari/);
    assert.match(out, /AU  - Näykki, Piia/);
    assert.match(out, /SP  - 101\nEP  - 115/);
    assert.match(out, /DO  - 10\.1000\/ce\.2020\.001/);
    assert.match(out, /ER  - $/);
  });

  test("RIS TY THES for thesis", () => {
    const out = buildCitation({ csl: cslThesis(), style: "ris" }).text;
    assert.match(out, /^TY  - THES/);
  });

  test("RIS TY CHAP for chapter with T2", () => {
    const out = buildCitation({ csl: cslChapter(), style: "ris" }).text;
    assert.match(out, /^TY  - CHAP/);
    assert.match(out, /T2  - Handbook of Mobile Learning/);
  });
});

describe("buildCitation — input immutability", () => {
  test("does not mutate the csl input", () => {
    const csl = cslJournal();
    const snapshot = JSON.parse(JSON.stringify(csl));
    ["apa", "mla", "chicago", "bibtex", "ris"].forEach((style) => {
      buildCitation({ csl, style });
    });
    assert.deepEqual(csl, snapshot);
  });
});

describe("buildCitation — determinism", () => {
  test("identical input yields identical text across repeated calls", () => {
    const csl = cslJournal();
    for (const style of ["apa", "mla", "chicago", "bibtex", "ris"]) {
      const a = buildCitation({ csl, style }).text;
      const b = buildCitation({ csl, style }).text;
      assert.equal(a, b, `style ${style} not deterministic`);
    }
  });
});

describe("buildCitation — missing optional metadata", () => {
  test("APA still renders with only id + title", () => {
    const csl = buildCslItem({ anchorId: "min", title: "Just a title" });
    const out = buildCitation({ csl, style: "apa" }).text;
    assert.match(out, /Tuntematon tekijä \(n\.d\.\)\. Just a title\./);
  });

  test("BibTeX still renders with only id + title", () => {
    const csl = buildCslItem({ anchorId: "min", title: "Just a title" });
    const out = buildCitation({ csl, style: "bibtex" }).text;
    assert.match(out, /author = \{Tuntematon Tekija\}/);
    assert.match(out, /title = \{Just a title\}/);
    assert.match(out, /year = \{n\.d\.\}/);
  });
});

// ---------------------------------------------------------------------------
// TH-CITE1 Phase 4A — thesis-branch coverage across MLA / Chicago / BibTeX /
// RIS. Uses raw thesis CSL shapes (as produced by src/_utils/thesisCsl.js)
// instead of the publications buildCslItem so the genre + publisher strings
// exactly reflect the canonical thesis pipeline.
// ---------------------------------------------------------------------------

function thesisCsl(overrides) {
  return Object.assign({
    id: "/opinnaytteet/18096/",
    type: "thesis",
    title: "Professional development of technology integration into teaching",
    author: [{ family: "Mattila", given: "Teemu" }],
    issued: { "date-parts": [[2021]] },
    genre: "Pro gradu -tutkielma",
    publisher: "Oulun yliopisto",
    URL: "https://oulurepo.oulu.fi/handle/10024/18096"
  }, overrides || {});
}

describe("Phase 4A — APA thesis regression (Phase 2 output preserved)", () => {
  test("FI master thesis APA is byte-identical to Phase 2 target", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "apa", lang: "fi" }).text;
    assert.equal(out, "Mattila, T. (2021). Professional development of technology integration into teaching [Pro gradu -tutkielma, Oulun yliopisto]. https://oulurepo.oulu.fi/handle/10024/18096");
  });
  test("EN master thesis APA translates genre + publisher via display map", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "apa", lang: "en" }).text;
    assert.equal(out, "Mattila, T. (2021). Professional development of technology integration into teaching [Master's thesis, University of Oulu]. https://oulurepo.oulu.fi/handle/10024/18096");
  });
});

describe("Phase 4A — MLA thesis branch", () => {
  test("FI master: Authors. \"Title.\" Genre, Publisher, Year. URL.", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "mla", lang: "fi" }).text;
    assert.equal(out, 'Mattila, Teemu. "Professional development of technology integration into teaching." Pro gradu -tutkielma, Oulun yliopisto, 2021. https://oulurepo.oulu.fi/handle/10024/18096.');
  });
  test("EN master: genre + publisher translated via shared display map", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "mla", lang: "en" }).text;
    assert.equal(out, 'Mattila, Teemu. "Professional development of technology integration into teaching." Master\'s thesis, University of Oulu, 2021. https://oulurepo.oulu.fi/handle/10024/18096.');
  });
  test("FI bachelor emits Kandidaatintutkielma", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Kandidaatintutkielma", title: "Emotionaalisen älykkyyden yhteydet", author: [{ family: "Latvala", given: "L." }], issued: { "date-parts": [[2026]] } }), style: "mla", lang: "fi" }).text;
    assert.match(out, /Kandidaatintutkielma, Oulun yliopisto, 2026\./);
  });
  test("EN bachelor emits Bachelor's thesis", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Kandidaatintutkielma", author: [{ family: "Latvala", given: "L." }] }), style: "mla", lang: "en" }).text;
    assert.match(out, /Bachelor's thesis, University of Oulu/);
  });
  test("FI doctoral emits Väitöskirja, EN doctoral emits Doctoral dissertation", () => {
    const fi = buildCitation({ csl: thesisCsl({ genre: "Väitöskirja" }), style: "mla", lang: "fi" }).text;
    const en = buildCitation({ csl: thesisCsl({ genre: "Väitöskirja" }), style: "mla", lang: "en" }).text;
    assert.match(fi, /Väitöskirja, Oulun yliopisto/);
    assert.match(en, /Doctoral dissertation, University of Oulu/);
  });
  test("thesis MLA never fabricates authors when csl.author is missing", () => {
    const out = buildCitation({ csl: thesisCsl({ author: undefined }), style: "mla", lang: "fi" }).text;
    assert.match(out, /^Tuntematon tekijä\. /);
    assert.doesNotMatch(out, /Laru, Jari/);
  });
  test("thesis MLA omits publisher clause when publisher missing", () => {
    const out = buildCitation({ csl: thesisCsl({ publisher: "" }), style: "mla", lang: "fi" }).text;
    assert.match(out, /Pro gradu -tutkielma, 2021\./);
    assert.doesNotMatch(out, /, ,/);
  });
  test("thesis MLA omits URL clause when URL missing", () => {
    const out = buildCitation({ csl: thesisCsl({ URL: "" }), style: "mla", lang: "fi" }).text;
    assert.equal(out.endsWith("2021."), true);
  });
});

describe("Phase 4A — Chicago thesis branch", () => {
  test("FI master: Authors. Year. \"Title.\" Genre, Publisher. URL.", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "chicago", lang: "fi" }).text;
    assert.equal(out, 'Mattila, Teemu. 2021. "Professional development of technology integration into teaching." Pro gradu -tutkielma, Oulun yliopisto. https://oulurepo.oulu.fi/handle/10024/18096.');
  });
  test("EN master: genre + publisher translated", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "chicago", lang: "en" }).text;
    assert.equal(out, 'Mattila, Teemu. 2021. "Professional development of technology integration into teaching." Master\'s thesis, University of Oulu. https://oulurepo.oulu.fi/handle/10024/18096.');
  });
  test("FI bachelor emits Kandidaatintutkielma", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Kandidaatintutkielma" }), style: "chicago", lang: "fi" }).text;
    assert.match(out, /Kandidaatintutkielma, Oulun yliopisto\./);
  });
  test("thesis Chicago never fabricates authors when csl.author is missing", () => {
    const out = buildCitation({ csl: thesisCsl({ author: undefined }), style: "chicago", lang: "fi" }).text;
    assert.match(out, /^Tuntematon tekijä\. /);
  });
});

describe("Phase 4A — BibTeX thesis entry-type mapping", () => {
  test("master → @mastersthesis with school = {Oulun yliopisto} (FI)", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "bibtex", lang: "fi" }).text;
    assert.match(out, /^@mastersthesis\{/);
    assert.match(out, /school = \{Oulun yliopisto\}/);
    assert.doesNotMatch(out, /publisher = /);
    assert.doesNotMatch(out, /howpublished = /);
  });
  test("master → @mastersthesis with school = {University of Oulu} (EN)", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "bibtex", lang: "en" }).text;
    assert.match(out, /^@mastersthesis\{/);
    assert.match(out, /school = \{University of Oulu\}/);
  });
  test("bachelor → @misc with howpublished carrying level + institution (FI)", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Kandidaatintutkielma", author: [{ family: "Latvala", given: "L." }] }), style: "bibtex", lang: "fi" }).text;
    assert.match(out, /^@misc\{/);
    assert.match(out, /howpublished = \{Kandidaatintutkielma, Oulun yliopisto\}/);
    assert.doesNotMatch(out, /school = /);
  });
  test("bachelor → @misc with howpublished translated (EN)", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Kandidaatintutkielma", author: [{ family: "Latvala", given: "L." }] }), style: "bibtex", lang: "en" }).text;
    assert.match(out, /howpublished = \{Bachelor's thesis, University of Oulu\}/);
  });
  test("doctoral → @phdthesis", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Väitöskirja" }), style: "bibtex", lang: "fi" }).text;
    assert.match(out, /^@phdthesis\{/);
    assert.match(out, /school = \{Oulun yliopisto\}/);
  });
  test("licentiate → @phdthesis (closest BibTeX equivalent)", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Lisensiaatintutkielma" }), style: "bibtex", lang: "fi" }).text;
    assert.match(out, /^@phdthesis\{/);
    assert.match(out, /school = \{Oulun yliopisto\}/);
  });
  test("unknown thesis genre → @phdthesis fallback", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Doctoral dissertation (article-based)" }), style: "bibtex", lang: "fi" }).text;
    assert.match(out, /^@phdthesis\{/);
  });
  test("thesis BibTeX key is human-readable: family+year+firstTitleWord, ASCII-lowercase", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "bibtex", lang: "fi" }).text;
    assert.match(out, /^@mastersthesis\{mattila2021professional,/);
  });
  test("thesis BibTeX key handles diacritics and non-ASCII title words", () => {
    const out = buildCitation({ csl: thesisCsl({ author: [{ family: "Öysti", given: "S." }], title: "Ääniä tarhassa" }), style: "bibtex", lang: "fi" }).text;
    assert.match(out, /^@mastersthesis\{oysti2021aania,/);
  });
  test("thesis BibTeX key is stable for repeated calls", () => {
    const a = buildCitation({ csl: thesisCsl(), style: "bibtex", lang: "fi" }).text;
    const b = buildCitation({ csl: thesisCsl(), style: "bibtex", lang: "fi" }).text;
    assert.equal(a, b);
  });
  test("thesis BibTeX never fabricates authors when csl.author is missing", () => {
    const out = buildCitation({ csl: thesisCsl({ author: undefined }), style: "bibtex", lang: "fi" }).text;
    assert.match(out, /author = \{Tuntematon Tekija\}/);
    assert.doesNotMatch(out, /Laru, Jari/);
  });
  test("thesis BibTeX preserves URL", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "bibtex", lang: "fi" }).text;
    assert.match(out, /url = \{https:\/\/oulurepo\.oulu\.fi\/handle\/10024\/18096\}/);
  });
});

describe("Phase 4A — RIS thesis M3 line + display map", () => {
  test("FI master emits TY - THES, AU, PY, TI, PB - Oulun yliopisto, M3 - Pro gradu -tutkielma, UR, ER", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "ris", lang: "fi" }).text;
    assert.match(out, /^TY  - THES\n/);
    assert.match(out, /AU  - Mattila, Teemu/);
    assert.match(out, /PY  - 2021/);
    assert.match(out, /TI  - Professional development/);
    assert.match(out, /PB  - Oulun yliopisto/);
    assert.match(out, /M3  - Pro gradu -tutkielma/);
    assert.match(out, /UR  - https:\/\/oulurepo\.oulu\.fi\/handle\/10024\/18096/);
    assert.match(out, /ER  - $/);
  });
  test("EN master translates PB + M3 via display map", () => {
    const out = buildCitation({ csl: thesisCsl(), style: "ris", lang: "en" }).text;
    assert.match(out, /PB  - University of Oulu/);
    assert.match(out, /M3  - Master's thesis/);
  });
  test("FI bachelor emits M3 - Kandidaatintutkielma", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Kandidaatintutkielma" }), style: "ris", lang: "fi" }).text;
    assert.match(out, /M3  - Kandidaatintutkielma/);
  });
  test("EN bachelor emits M3 - Bachelor's thesis", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Kandidaatintutkielma" }), style: "ris", lang: "en" }).text;
    assert.match(out, /M3  - Bachelor's thesis/);
  });
  test("FI doctoral emits M3 - Väitöskirja", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "Väitöskirja" }), style: "ris", lang: "fi" }).text;
    assert.match(out, /M3  - Väitöskirja/);
  });
  test("thesis RIS omits M3 when genre missing but keeps TY - THES", () => {
    const out = buildCitation({ csl: thesisCsl({ genre: "" }), style: "ris", lang: "fi" }).text;
    assert.match(out, /^TY  - THES\n/);
    assert.doesNotMatch(out, /^M3  - /m);
  });
});

describe("Phase 4A — non-thesis regression: publication paths unchanged", () => {
  test("cslJournal APA unchanged", () => {
    const out = buildCitation({ csl: cslJournal(), style: "apa" }).text;
    assert.match(out, /Laru, J\., & Näykki, P\./);
    assert.match(out, /Computers & Education, 42\(3\), 101-115/);
  });
  test("cslBook BibTeX still @book with publisher =", () => {
    const out = buildCitation({ csl: cslBook(), style: "bibtex" }).text;
    assert.match(out, /^@book\{/);
    assert.match(out, /publisher = \{Some Publisher\}/);
    assert.doesNotMatch(out, /school = /);
    assert.doesNotMatch(out, /howpublished = /);
  });
  test("cslChapter BibTeX still @inbook", () => {
    const out = buildCitation({ csl: cslChapter(), style: "bibtex" }).text;
    assert.match(out, /^@inbook\{/);
    assert.match(out, /booktitle = \{Handbook of Mobile Learning\}/);
  });
  test("cslJournal RIS omits thesis-only M3 line", () => {
    const out = buildCitation({ csl: cslJournal(), style: "ris" }).text;
    assert.doesNotMatch(out, /^M3  - /m);
    assert.match(out, /^TY  - JOUR\n/);
  });
  test("cslBook RIS PB unchanged (not routed through thesis display map)", () => {
    const out = buildCitation({ csl: cslBook(), style: "ris" }).text;
    assert.match(out, /PB  - Some Publisher/);
    assert.doesNotMatch(out, /^M3  - /m);
  });
  test("cslJournal MLA unchanged", () => {
    const out = buildCitation({ csl: cslJournal(), style: "mla" }).text;
    assert.match(out, /Laru, Jari, and Piia Näykki/);
    assert.match(out, /Computers & Education, vol\. 42, no\. 3/);
  });
  test("cslJournal Chicago unchanged", () => {
    const out = buildCitation({ csl: cslJournal(), style: "chicago" }).text;
    assert.match(out, /Computers & Education 42, no\. 3 \(2020\)/);
  });
});

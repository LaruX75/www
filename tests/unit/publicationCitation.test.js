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

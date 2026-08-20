const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const {
  thesisRoleLabel,
  thesisTypeRoleFilterOptions,
  buildThesisFindExploreDocument
} = require("../../src/_utils/thesesFindExplore");

function sampleThesisDetail(overrides = {}) {
  return {
    pageUrl: "/opinnaytteet/62699/",
    sourceUrl: "https://oulurepo.oulu.fi/handle/10024/62699",
    title: "6-luokkalaisten kokemuksia matematiikka-ahdistuksesta",
    thesisType: "masterThesis",
    thesisRole: "reviewed",
    year: "2026",
    lang: "fi",
    authorLine: "Riikonen, Hanni",
    authors: ["Riikonen, Hanni"],
    abstract: "Ensimmainen kappale.\n\nToinen kappale jota ei pidä tarvita.",
    categories: ["tekoäly", "matematiikka"],
    contexts: ["research"],
    ...overrides
  };
}

describe("thesisRoleLabel", () => {
  test("returns localized labels", () => {
    assert.equal(thesisRoleLabel("advised", "fi"), "Ohjattu opinnäyte");
    assert.equal(thesisRoleLabel("reviewed", "fi"), "Tarkastettu opinnäyte");
    assert.equal(thesisRoleLabel("advised", "en"), "Supervised thesis");
    assert.equal(thesisRoleLabel("reviewed", "en"), "Reviewed thesis");
  });
});

describe("thesisTypeRoleFilterOptions", () => {
  test("returns only valid FI domain options", () => {
    assert.deepEqual(
      thesisTypeRoleFilterOptions("fi").map((option) => option.label),
      ["Gradu · ohjattu", "Gradu · tarkastettu", "Kandi · ohjattu"]
    );
  });

  test("returns only valid EN domain options", () => {
    assert.deepEqual(
      thesisTypeRoleFilterOptions("en").map((option) => option.label),
      ["Master's · advised", "Master's · reviewed", "Bachelor's · advised"]
    );
  });

  test("never exposes impossible bachelor's reviewed option", () => {
    const values = [
      ...thesisTypeRoleFilterOptions("fi").map((option) => option.value),
      ...thesisTypeRoleFilterOptions("en").map((option) => option.value)
    ];
    assert.ok(!values.includes("bachelorThesis::reviewed"));
  });
});

describe("buildThesisFindExploreDocument", () => {
  test("adds explicit thesis role filter and explicit sourceUrl meta", () => {
    const doc = buildThesisFindExploreDocument(sampleThesisDetail());
    assert.ok(doc);

    assert.deepEqual(
      doc.filters.filter((entry) => entry.name === "Theses role"),
      [{ name: "Theses role", value: "reviewed" }]
    );

    assert.equal(doc.meta.thesesType, "masterThesis");
    assert.equal(doc.meta.thesesRole, "reviewed");
    assert.equal(doc.meta.thesesSourceUrl, "https://oulurepo.oulu.fi/handle/10024/62699");
    assert.equal(doc.meta.thesesAuthorLine, "Riikonen, Hanni");
    assert.equal(doc.meta.thesesYear, "2026");
  });

  test("retains existing research/topic/author filters", () => {
    const doc = buildThesisFindExploreDocument(sampleThesisDetail());
    const filters = doc.filters.map((entry) => `${entry.name}:${entry.value}`);

    assert.ok(filters.includes("Sisältö:Opinnäytteet"));
    assert.ok(filters.includes("FindExplore:theses"));
    assert.ok(filters.includes("Theses scope:fi"));
    assert.ok(filters.includes("Theses scope:en"));
    assert.ok(filters.includes("Theses type:masterThesis"));
    assert.ok(filters.includes("Theses year:2026"));
    assert.ok(filters.includes("Theses language:fi"));
    assert.ok(filters.includes("Research context:research"));
    assert.ok(filters.includes("Theses topic:tekoäly"));
    assert.ok(filters.includes("Theses author:Riikonen, Hanni"));
  });

  test("never fabricates thesesSourceUrl from pageUrl", () => {
    const doc = buildThesisFindExploreDocument(sampleThesisDetail({ sourceUrl: "" }));
    assert.equal(doc.meta.thesesSourceUrl, "");
    assert.equal(doc.meta.thesesRole, "reviewed");
    assert.equal(doc.meta.thesesType, "masterThesis");
  });

  test("returns null without local canonical pageUrl or title", () => {
    assert.equal(buildThesisFindExploreDocument(sampleThesisDetail({ pageUrl: "" })), null);
    assert.equal(buildThesisFindExploreDocument(sampleThesisDetail({ title: "" })), null);
  });

  test("defaults missing role to advised for additive filter/meta compatibility", () => {
    const doc = buildThesisFindExploreDocument(sampleThesisDetail({ thesisRole: "" }));
    assert.deepEqual(
      doc.filters.filter((entry) => entry.name === "Theses role"),
      [{ name: "Theses role", value: "advised" }]
    );
    assert.equal(doc.meta.thesesRole, "advised");
  });
});

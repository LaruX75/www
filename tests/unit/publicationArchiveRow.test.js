const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  buildArchiveRow,
  buildArchiveRowFromPagefind,
  resolveSourceLabel,
  resolveSourceUrl
} = require("../../src/_utils/publicationArchiveRow");
const { buildPublicationsArchiveGroups } = require("../../src/_utils/publicationsArchiveGroups");

function canonicalPublication() {
  return {
    title: "Assessing Digital Competence of K1-12 Teachers in Kosovo",
    authors: "Nuci, Krenare; Laru, Jari",
    year: 2026,
    pageUrl: "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/",
    publicationGroup: "A",
    typeCode: "A1",
    type: "Alkuperäisartikkeli tieteellisessä aikakauslehdessä",
    doi: "10.1016/j.caeo.2026.100396",
    doiUrl: "https://doi.org/10.1016/j.caeo.2026.100396",
    url: "https://research.fi/en/results/publication/123",
    sourceLabel: "Research.fi",
    journal: "Computers and Education Open",
    csl: { id: "rf-a1-10-1016-j-caeo-2026-100396", title: "Assessing Digital Competence of K1-12 Teachers in Kosovo" }
  };
}

function pagefindMeta() {
  return {
    title: "Assessing Digital Competence of K1-12 Teachers in Kosovo",
    publicationYear: "2026",
    publicationAuthors: "Nuci, Krenare; Laru, Jari",
    publicationGroup: "A",
    publicationTypeCode: "A1",
    publicationTypeLabel: "Alkuperäisartikkeli tieteellisessä aikakauslehdessä",
    publicationDoi: "10.1016/j.caeo.2026.100396",
    publicationDoiUrl: "https://doi.org/10.1016/j.caeo.2026.100396",
    publicationSourceUrl: "https://research.fi/en/results/publication/123",
    publicationSourceLabel: "Research.fi",
    publicationCsl: JSON.stringify({
      id: "rf-a1-10-1016-j-caeo-2026-100396",
      title: "Assessing Digital Competence of K1-12 Teachers in Kosovo"
    })
  };
}

describe("publicationArchiveRow", () => {
  test("canonical publication prefers DOI as external source while preserving local pageUrl", () => {
    const row = buildArchiveRow(canonicalPublication(), "fi");
    assert.equal(row.pageUrl, "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/");
    assert.equal(row.sourceUrl, "https://doi.org/10.1016/j.caeo.2026.100396");
    assert.notEqual(row.pageUrl, row.sourceUrl);
    assert.equal(row.sourceLabel, "DOI");
    assert.equal(row.typeDisplay, "A1");
  });

  test("pagefind meta rebuilds the same local/external distinction", () => {
    const row = buildArchiveRowFromPagefind(pagefindMeta(), "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/", "fi");
    assert.equal(row.pageUrl, "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/");
    assert.equal(row.sourceUrl, "https://doi.org/10.1016/j.caeo.2026.100396");
    assert.equal(row.sourceLabel, "DOI");
    assert.equal(row.typeDisplay, "A1");
    assert.ok(row.csl);
  });

  test("non-external fallback never reuses local pageUrl as a source action", () => {
    const row = buildArchiveRow({
      title: "Manual publication",
      authors: "Jari Laru",
      year: 2024,
      pageUrl: "/julkaisut/manual-publication/",
      url: "/julkaisut/manual-publication/",
      sourceLabel: "Research.fi"
    }, "fi");
    assert.equal(row.sourceUrl, "");
  });

  test("source labels stay localized when DOI is absent", () => {
    assert.equal(resolveSourceLabel({ sourceLabel: "Research.fi" }, "fi"), "Research.fi");
    assert.equal(resolveSourceLabel({ sourceLabel: "Manual source" }, "fi"), "Lähde");
    assert.equal(resolveSourceLabel({ sourceLabel: "Manual source" }, "en"), "Source");
  });

  test("resolveSourceUrl falls back from DOI to canonical external URL only when distinct", () => {
    assert.equal(resolveSourceUrl({ doiUrl: "", url: "https://example.com/source", pageUrl: "/julkaisut/a/" }), "https://example.com/source");
    assert.equal(resolveSourceUrl({ doiUrl: "", url: "/julkaisut/a/", pageUrl: "/julkaisut/a/" }), "");
  });
});

describe("buildPublicationsArchiveGroups", () => {
  test("keeps canonical A→G grouping order and row counts", () => {
    const archive = buildPublicationsArchiveGroups([
      canonicalPublication(),
      {
        title: "Professional publication",
        authors: "Laru, Jari",
        year: 2025,
        pageUrl: "/julkaisut/professional-publication/",
        publicationGroup: "D",
        typeCode: "D1",
        type: "Artikkeli ammattilehdessä",
        url: "https://example.com/professional"
      }
    ], { lang: "en" });

    assert.equal(archive.count, 2);
    assert.deepEqual(archive.groups.map((group) => group.key), ["A", "D"]);
    assert.equal(archive.groups[0].rows[0].pageUrl, "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/");
  });
});

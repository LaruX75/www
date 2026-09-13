const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const canva = require("../../src/_data/canva");
const {
  buildCanonicalPresentationItems,
  buildPresentationsPageSourceData
} = require("../../src/_data/presentationsPage");

describe("canva data", () => {
  test("liittaa paikallisen pageUrlin designId-mappauksen kautta", () => {
    const data = canva();
    const row = data.tableRows.find((item) => item.pageUrl === "/presentations/kempele-veso-2026/");

    assert.ok(row);
    assert.equal(row.pageUrl, "/presentations/kempele-veso-2026/");
  });

  test("sailyttaa rivin oman Canva designId:n vaikka merged-data tarjoaisi toisen mapin", () => {
    const data = canva();
    const row = data.tableRows.find((item) => item.sourceUrl === "https://www.canva.com/d/H8tSyhG_9jcwRpr");

    assert.ok(row);
    assert.equal(row.id, "H8tSyhG_9jcwRpr");
  });

  test("poistaa jakamattomat Canva-esitykset mutta sailyttaa TkaEditen public-lahteen", () => {
    const data = canva();
    const removedIds = new Set(["kJtKo_ZUxCFEOTn", "Hlih1iAZAFJZTxM"]);

    assert.equal(data.tableRows.filter((item) => removedIds.has(item.id)).length, 0);

    const items = buildCanonicalPresentationItems(
      buildPresentationsPageSourceData({ canva: data })
    );
    assert.equal(
      items.filter((item) =>
        ["Sivistysverkosto 4.5.", "Finnish Teacher Education & Professional Development"].includes(item.title)
      ).length,
      0
    );
    const retained = items.filter((item) => item.id === "ELi8lObr4rmLy89");

    assert.equal(retained.length, 1);
    assert.equal(retained[0].title, "TkaEdite – Kosovo Finland & Teacher's Professional Development");
    assert.equal(retained[0].landingType, "externalSource");
    assert.equal(retained[0].landingUrl, "https://canva.link/vqtdccorb3yxb9h");
  });
});

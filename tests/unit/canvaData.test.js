const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const canva = require("../../src/_data/canva");

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
});

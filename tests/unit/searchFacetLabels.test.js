const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const searchFacetLabels = require("../../src/_data/searchFacetLabels.js");

describe("searchFacetLabels", () => {
  test("localizes top-level content type values for English UI without changing raw filter keys", () => {
    assert.equal(searchFacetLabels.en["Sisältö"]["Esitykset"], "Presentations");
    assert.equal(searchFacetLabels.en["Sisältö"]["Mediassa"], "Media");
    assert.equal(searchFacetLabels.en["Sisältö"]["Opinnäytteet"], "Theses");
  });

  test("provides human-readable labels for raw publication, thesis, and writings values", () => {
    assert.equal(
      searchFacetLabels.fi["Publications group"].A,
      "A - Vertaisarvioidut tieteelliset artikkelit"
    );
    assert.equal(searchFacetLabels.en["Publications quality"]["peer-reviewed"], "Peer-reviewed");
    assert.equal(searchFacetLabels.fi["Theses type"].masterThesis, "Pro gradu -tutkielmat");
    assert.equal(searchFacetLabels.en["Theses role"].advised, "Supervised");
    assert.equal(searchFacetLabels.en["Writings content type"].blogPost, "Blog");
  });
});

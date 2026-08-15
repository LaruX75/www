const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  createCanvaPresentationLookup,
  readLocalPresentationSources
} = require("../../src/_data/presentationSources");

describe("createCanvaPresentationLookup", () => {
  test("kayttaa slug->designId-mappausta paikallisille Canva-detail-sivuille", () => {
    const lookup = createCanvaPresentationLookup(readLocalPresentationSources());
    const mapped = lookup.get("DAG_CuXyWfE");

    assert.ok(mapped);
    assert.equal(mapped.pageUrl, "/presentations/kempele-veso-2026/");
  });

  test("sailyttaa myos suoran /d/ Canva-ID:n lookupissa", () => {
    const lookup = createCanvaPresentationLookup(readLocalPresentationSources());
    const direct = lookup.get("cbYXXNXQtLqaOC");

    assert.ok(direct);
    assert.equal(direct.pageUrl, "/presentations/kempele-veso-2026/");
  });
});

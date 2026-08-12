const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  PUBLIC_PRESENTATION_FIELDS
} = require("../../src/_data/presentationsPage");
const {
  PUBLIC_PUBLICATIONS_PAGE_FIELDS
} = require("../../src/_data/publicationsPage");
const {
  PUBLIC_WRITINGS_PAGE_FIELDS
} = require("../../src/_data/writingsPage");
const {
  VALID_LANG_CODES,
  validateProjection
} = require("../../src/_utils/validateProjectionContract");

describe("validateProjection", () => {
  test("hyvaksyy rakenteellisesti validin projection", () => {
    const result = validateProjection({
      name: "demo",
      canonicalItems: [
        { id: "one", title: "First", lang: "fi", pageUrl: "/items/one/" },
        { id: "two", title: "Second", lang: "en", pageUrl: "/items/two/" }
      ],
      projectedItems: [
        { id: "one", title: "First", lang: "fi", pageUrl: "/items/one/" },
        { id: "two", title: "Second", lang: "en", pageUrl: "/items/two/" }
      ],
      publicFields: ["id", "title", "lang", "pageUrl"],
      requiredFields: ["id", "title"],
      identityKey: "id",
      count: 2
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.itemsLength, 2);
    assert.deepEqual(result.errors.duplicateIds, []);
    assert.deepEqual(result.errors.allowlistViolations, []);
    assert.deepEqual(result.errors.invalidLangs, []);
    assert.deepEqual(result.errors.invalidLocalPageUrls, []);
  });

  test("liputtaa count-, allowlist-, lang- ja pageUrl-rikkomukset", () => {
    const result = validateProjection({
      name: "broken",
      projectedItems: [
        { id: "one", title: "First", lang: "sv", pageUrl: "https://example.com/one/", extra: true },
        { id: "one", title: "", lang: "fi", pageUrl: "/items/one/" }
      ],
      publicFields: ["id", "title", "lang", "pageUrl"],
      requiredFields: ["id", "title"],
      count: 3
    });

    assert.equal(result.ok, false);
    assert.equal(result.errors.countMismatch, true);
    assert.deepEqual(result.errors.duplicateIds, ["one"]);
    assert.deepEqual(result.errors.invalidLangs, [{ id: "one", lang: "sv" }]);
    assert.deepEqual(result.errors.invalidLocalPageUrls, [
      { id: "one", pageUrl: "https://example.com/one/" }
    ]);
    assert.deepEqual(result.errors.allowlistViolations, [
      { id: "one", field: "extra" }
    ]);
    assert.deepEqual(result.errors.missingRequiredFields, [
      { id: "one", field: "title" }
    ]);
  });

  test("tunnistaa canonical-projection parity erot", () => {
    const result = validateProjection({
      name: "parity",
      canonicalItems: [
        { id: "one", title: "First" },
        { id: "two", title: "Second" }
      ],
      projectedItems: [
        { id: "one", title: "First" },
        { id: "three", title: "Third" }
      ],
      publicFields: ["id", "title"],
      requiredFields: ["id", "title"]
    });

    assert.equal(result.ok, false);
    assert.deepEqual(result.errors.missingFromProjection, ["two"]);
    assert.deepEqual(result.errors.unexpectedInProjection, ["three"]);
  });
});

describe("canonical public field allowlists", () => {
  test("kayttavat uniikkeja kenttia", () => {
    const fieldSets = [
      PUBLIC_PRESENTATION_FIELDS,
      PUBLIC_PUBLICATIONS_PAGE_FIELDS,
      PUBLIC_WRITINGS_PAGE_FIELDS
    ];

    fieldSets.forEach((fields) => {
      assert.equal(new Set(fields).size, fields.length);
    });
  });

  test("sisaltavat ydinidentiteetin", () => {
    [
      PUBLIC_PRESENTATION_FIELDS,
      PUBLIC_PUBLICATIONS_PAGE_FIELDS,
      PUBLIC_WRITINGS_PAGE_FIELDS
    ].forEach((fields) => {
      assert.ok(fields.includes("id"));
      assert.ok(fields.includes("title"));
      assert.ok(fields.includes("url") || fields.includes("pageUrl"));
    });
  });

  test("validatorin sallitut kielikoodit vastaavat nykyista contractia", () => {
    assert.deepEqual(VALID_LANG_CODES, ["fi", "en"]);
  });
});

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const ThesesFeed = require("../../src/data/theses.json.11ty.js");

describe("theses.json serializer", () => {
  test("normalizeThesisLangCode johdetaan authoritative lähdekielestä", () => {
    assert.equal(ThesesFeed.normalizeThesisLangCode("eng"), "en");
    assert.equal(ThesesFeed.normalizeThesisLangCode("en"), "en");
    assert.equal(ThesesFeed.normalizeThesisLangCode("fin"), "fi");
    assert.equal(ThesesFeed.normalizeThesisLangCode(""), "fi");
  });

  test("englanninkielinen thesis-record saa en-langin ja englanninkielisen tyypin", () => {
    const record = ThesesFeed.toThesisRecord({
      link: "https://oulurepo.oulu.fi/handle/10024/12345",
      pageUrl: "/opinnaytteet/12345/",
      title: "Sample English thesis",
      abstract: "English abstract",
      language: "eng",
      type: "masterThesis",
      authors: ["Example Author"]
    }, ThesesFeed.normalizeThesisLangCode("eng"), "advised");

    assert.equal(record.lang, "en");
    assert.equal(record.contentTypeLabel, "Master's thesis");
    assert.equal(record.description, "English abstract");
  });
});

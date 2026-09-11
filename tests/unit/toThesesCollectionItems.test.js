const { test } = require("node:test");
const assert = require("node:assert/strict");

const { toCollectionItem } = require("../../src/_utils/toThesesCollectionItems");

test("thesis collection items keep the internal landing separate from OuluREPO", () => {
  const sourceUrl = "https://oulurepo.oulu.fi/handle/10024/63041";
  const item = toCollectionItem({
    link: sourceUrl,
    title: "Opettajaopiskelijoiden ajatuksia tekoälystä",
    year: "2024",
    type: "masterThesis"
  }, "advised");

  assert.equal(item.url, "/opinnaytteet/63041/");
  assert.equal(item.data.pageUrl, "/opinnaytteet/63041/");
  assert.equal(item.data.sourceUrl, sourceUrl);
  assert.equal(item.data.thesisRole, "advised");
});

test("reviewed thesis candidates retain the same canonical landing contract", () => {
  const sourceUrl = "https://oulurepo.oulu.fi/handle/10024/12345";
  const item = toCollectionItem({
    link: sourceUrl,
    title: "Tarkastettu opinnäyte",
    year: 2023,
    type: "masterThesis"
  }, "reviewed");

  assert.equal(item.url, "/opinnaytteet/12345/");
  assert.equal(item.data.pageUrl, "/opinnaytteet/12345/");
  assert.equal(item.data.sourceUrl, sourceUrl);
  assert.equal(item.data.thesisRole, "reviewed");
});

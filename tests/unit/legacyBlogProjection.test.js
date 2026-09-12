const test = require("node:test");
const assert = require("node:assert/strict");

const {
  projectionByBasename,
  getLegacyBlogProjection,
  validateLegacyBlogProjection
} = require("../../src/_data/legacyBlogProjection");

test("legacy blog projection covers the accepted 55/25 split", () => {
  assert.deepEqual(validateLegacyBlogProjection(), { total: 80, active: 55, historical: 25 });
  assert.equal(Object.keys(projectionByBasename).length, 80);
});

test("known semantic fixtures have their accepted active or historical projection", () => {
  assert.equal(getLegacyBlogProjection("src/blog/kehuttua-koulutusteknologian-perusopintojen-johdantoluento.md").activeBlog, true);
  assert.equal(getLegacyBlogProjection("src/blog/jari-larulle-kansallinen-avoimen-tieteen-palkinto.md").historicalArchive, true);
  assert.equal(getLegacyBlogProjection("src/blog/tvt-koulun-johtamisen-valineena-luento-mobiilioppiminen-mita-se-teknologia-tahtoo.md").semanticClass, "C");
  assert.equal(getLegacyBlogProjection("src/blog/jari-larun-verkkolive.md").semanticClass, "D");
  assert.equal(getLegacyBlogProjection("src/blog/ulkoiset-rss-syotteet-kohdalleen.md").semanticClass, "F");
});

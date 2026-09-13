const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const { queryPreset } = require("../../src/_utils/contentPresets");

const cardTemplate = fs.readFileSync(
  path.join(__dirname, "../../src/_includes/presentations/result-card.njk"),
  "utf8"
);

describe("PRESENTATIONS-RUNTIME-DATA-01 SSR metadata", () => {
  test("card metadata carries every field used by shared presentation search", () => {
    assert.match(cardTemplate, /data-presentation-search-record=/);
    [
      "title: item.title",
      "description: item.description",
      "publication: item.publication",
      "event: item.event",
      "presentationType: item.presentationType",
      "mediaType: item.mediaType",
      "categories: item.categories",
      "keywords: item.keywords",
      "topics: cardTopics",
      "year: cardYear"
    ].forEach((field) => {
      assert.ok(cardTemplate.includes(field), `metadata is missing ${field}`);
    });
  });

  test("shared query semantics find every metadata search field", () => {
    const record = {
      title: "title-token",
      description: "description-token",
      publication: "publication-token",
      event: "event-token",
      presentationType: "presentation-type-token",
      mediaType: "media-type-token",
      categories: ["category-token"],
      keywords: ["keyword-token"],
      topics: ["topic-token"],
      year: "2026"
    };

    [
      "title-token",
      "description-token",
      "publication-token",
      "event-token",
      "presentation-type-token",
      "media-type-token",
      "category-token",
      "keyword-token",
      "topic-token"
    ].forEach((search) => {
      const result = queryPreset([record], {
        source: "presentationsPage",
        search
      });
      assert.equal(result.total, 1, `${search} must match SSR metadata`);
    });
  });
});

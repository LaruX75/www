const test = require("node:test");
const assert = require("node:assert/strict");

const {
  resolvePagefindDocument
} = require("../../src/src.11tydata.js");

test("resolvePagefindDocument falls back to blog Pagefind filters for src/blog articles", () => {
  const doc = resolvePagefindDocument({
    page: {
      url: "/2025/06/24/lakimuutokset-nakyvat-koulun-arjessa-paikallisina-ratkaisuina/",
      inputPath: "./src/blog/lakimuutokset-nakyvat-koulun-arjessa-paikallisina-ratkaisuina.md",
      date: new Date("2025-06-24T00:00:00Z")
    },
    type: "artikkeli",
    tags: ["blog"],
    categories: ["Sivistys ja koulutus"],
    contexts: ["politics"],
    writingRoles: ["political", "expert"]
  });

  assert.ok(doc);
  assert.ok(doc.filters.some((filter) => filter.name === "Sisältö" && filter.value === "Kirjoitukset ja puheenvuorot"));
  assert.ok(doc.filters.some((filter) => filter.name === "FindExplore" && filter.value === "writings"));
  assert.ok(doc.filters.some((filter) => filter.name === "Writings content type" && filter.value === "blogPost"));
  assert.ok(doc.filters.some((filter) => filter.name === "Writings scope" && filter.value === "fi"));
  assert.equal(doc.meta.writingsContentType, "blogPost");
  assert.equal(doc.meta.writingsYear, "2025");
});

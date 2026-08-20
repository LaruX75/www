const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  PAGE_SIZE,
  buildThesesArchivePages
} = require("../../src/_utils/thesesArchivePages");

function thesis(index, overrides = {}) {
  return {
    title: `Thesis ${index}`,
    authors: [`Author, ${index}`],
    year: String(2026 - (index % 4)),
    type: index % 2 === 0 ? "masterThesis" : "bachelorThesis",
    thesisRole: index % 3 === 0 ? "reviewed" : "advised",
    link: `https://oulurepo.oulu.fi/handle/10024/${60000 + index}`,
    pageUrl: `/opinnaytteet/${60000 + index}/`,
    ...overrides
  };
}

describe("buildThesesArchivePages", () => {
  test("builds a flat 20-row archive with landing + paginated permalinks", () => {
    const items = Array.from({ length: 41 }, (_, index) => thesis(index + 1));
    const model = buildThesesArchivePages(items, {
      scope: "fi",
      lang: "fi",
      landingPermalink: "/opinnaytteet/",
      paginatedBasePermalink: "/opinnaytteet/sivu/"
    });

    assert.equal(PAGE_SIZE, 20);
    assert.equal(model.pageSize, 20);
    assert.equal(model.pages.length, 3);
    assert.equal(model.pages[0].pageKind, "landing");
    assert.equal(model.pages[0].permalink, "/opinnaytteet/");
    assert.equal(model.pages[1].permalink, "/opinnaytteet/sivu/2/");
    assert.equal(model.pages[2].permalink, "/opinnaytteet/sivu/3/");
    assert.equal(model.pages[0].visibleRows.length, 20);
    assert.equal(model.pages[1].visibleRows.length, 20);
    assert.equal(model.pages[2].visibleRows.length, 1);
    assert.equal(model.pages[2].totalCount, 41);
    assert.equal(model.pages[2].pageCount, 3);
    assert.equal(model.pages[2].currentPage, 3);
  });

  test("drops rows that cannot render as local archive entries", () => {
    const model = buildThesesArchivePages([
      thesis(1),
      thesis(2, { pageUrl: "" }),
      thesis(3, { title: "" }),
      thesis(4)
    ], {
      scope: "en",
      lang: "en",
      landingPermalink: "/en/theses/",
      paginatedBasePermalink: "/en/theses/page/"
    });

    assert.equal(model.pages.length, 1);
    assert.equal(model.pages[0].totalCount, 2);
    assert.deepEqual(
      model.pages[0].visibleRows.map((row) => row.pageUrl),
      ["/opinnaytteet/60001/", "/opinnaytteet/60004/"]
    );
    assert.equal(model.pages[0].lang, "en");
    assert.equal(model.pages[0].scope, "en");
  });
});

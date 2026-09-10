const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs");

// OPETUS-CANVA-THUMBNAILS-01A — verify the canonical Presentation projection
// resolves a local /images/canva-thumbnails/*.png for each of the eight
// canonical 405040Y lectures (autumn A + spring B).

const REPO = path.resolve(__dirname, "..", "..");

const canvaFn = require(path.join(REPO, "src/_data/canva.js"));
const {
  buildCanonicalPresentationPageLookup
} = require(path.join(REPO, "src/_data/presentationsPage.js"));

const TARGETS = [
  {
    pageUrl: "/presentations/405040y-luento-1-johdanto-2026-a/",
    thumbnail: "/images/canva-thumbnails/405040y-luento-1-johdanto-2026-a.png"
  },
  {
    pageUrl: "/presentations/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a/",
    thumbnail: "/images/canva-thumbnails/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.png"
  },
  {
    pageUrl: "/presentations/405040y-luento-3-tekoalylukutaito-2026-a/",
    thumbnail: "/images/canva-thumbnails/405040y-luento-3-tekoalylukutaito-2026-a.png"
  },
  {
    pageUrl: "/presentations/405040y-luento-4-media-ja-informaatiolukutaito-2026-a/",
    thumbnail: "/images/canva-thumbnails/405040y-luento-4-media-ja-informaatiolukutaito-2026-a.png"
  },
  {
    pageUrl: "/presentations/405040y-luento-1-johdanto-2026-b/",
    thumbnail: "/images/canva-thumbnails/405040y-luento-1-johdanto-2026-b.png"
  },
  {
    pageUrl: "/presentations/405040y-luento-2-digitaalinen-osaaminen-2026-b/",
    thumbnail: "/images/canva-thumbnails/405040y-luento-2-digitaalinen-osaaminen-2026-b.png"
  },
  {
    pageUrl: "/presentations/405040y-luento-3-ohjelmointiosaaminen-2026-b/",
    thumbnail: "/images/canva-thumbnails/405040y-luento-3-ohjelmointiosaaminen-2026-b.png"
  },
  {
    pageUrl: "/presentations/405040y-luento-4-medialukutaito-2026-b/",
    thumbnail: "/images/canva-thumbnails/405040y-luento-4-medialukutaito-2026-b.png"
  }
];

describe("OPETUS-CANVA-THUMBNAILS-01A canonical projection", () => {
  const data = { canva: canvaFn() };
  const lookup = buildCanonicalPresentationPageLookup(data);

  for (const target of TARGETS) {
    test(`canonical Presentation ${target.pageUrl} resolves ${target.thumbnail}`, () => {
      const record = lookup.get(target.pageUrl);
      assert.ok(record, `lookup must contain ${target.pageUrl}`);
      assert.equal(record.thumbnail, target.thumbnail, `thumbnail must equal expected local asset`);
    });

    test(`local asset file exists for ${target.pageUrl}`, () => {
      const filePath = path.join(REPO, "src", target.thumbnail);
      assert.ok(fs.existsSync(filePath), `local asset ${filePath} must exist on disk`);
    });
  }

  test("all eight designIds have entries in content-slug-to-designid.json", () => {
    const map = require(path.join(REPO, "data/canva/content-slug-to-designid.json"));
    for (const target of TARGETS) {
      const entry = map[target.pageUrl];
      assert.ok(entry, `content-slug map must contain ${target.pageUrl}`);
      assert.ok(entry.designId, `${target.pageUrl} entry must have designId`);
      assert.equal(entry.confidence, "high", `${target.pageUrl} confidence must be high`);
    }
  });
});

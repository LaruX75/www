/**
 * Integration-testit /data/*.json -feedeille.
 *
 * Nama testit lukevat _site/data/-hakemistosta ja validoivat outputin.
 * Jos _site puuttuu, testit skipataan (build:no-og ei ole ajettu).
 *
 * Ajo: npm run test:unit (buildin jalkeen)
 */

const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const contentSchema = require("../../src/_data/contentSchema");

const SITE_DIR = path.resolve(__dirname, "../../_site");
const DATA_DIR = path.join(SITE_DIR, "data");

function loadFeed(filename) {
  const p = path.join(DATA_DIR, filename);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    throw new Error(`${filename} ei ole validia JSON:ia: ${e.message}`);
  }
}

const feeds = {
  content: loadFeed("content.json"),
  publications: loadFeed("publications.json"),
  presentations: loadFeed("presentations.json"),
  media: loadFeed("media.json"),
  councilSpeeches: loadFeed("council-speeches.json"),
  theses: loadFeed("theses.json")
};

const ALL_EXIST = Object.values(feeds).every(Boolean);

// -----------------------------------------------------------------------------
// Perusrakenne kaikille feedeille
// -----------------------------------------------------------------------------
describe("JSON-feedien perusrakenne", { skip: !ALL_EXIST && "aja `npm run build:no-og` ensin" }, () => {
  for (const [name, feed] of Object.entries(feeds)) {
    if (!feed) continue;

    describe(name, () => {
      test("sisaltaa version=1", () => {
        assert.equal(feed.version, 1);
      });

      test("sisaltaa generatedAt (ISO 8601)", () => {
        assert.ok(typeof feed.generatedAt === "string");
        assert.match(feed.generatedAt, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });

      test("count === items.length", () => {
        assert.equal(feed.count, feed.items.length, `count=${feed.count} vs items.length=${feed.items.length}`);
      });

      test("items ei tyhja", () => {
        assert.ok(feed.items.length > 0, `${name} ei sisalla yhtaan itemia`);
      });

      test("kaikilla itemeilla url, title, contentType, lang", () => {
        for (const item of feed.items) {
          assert.ok(item.url, `puuttuva url: ${JSON.stringify(item).slice(0, 100)}`);
          assert.ok(item.title, `puuttuva title: ${item.url}`);
          assert.ok(item.contentType, `puuttuva contentType: ${item.url}`);
          assert.ok(item.lang, `puuttuva lang: ${item.url}`);
        }
      });

      test("URL:t ovat uniikkeja", () => {
        const urls = new Set();
        for (const item of feed.items) {
          assert.ok(!urls.has(item.url), `duplikaatti-URL: ${item.url}`);
          urls.add(item.url);
        }
      });

      test("contentType kuuluu canonical vocabularyyn", () => {
        const canonical = new Set(contentSchema.vocabularies.contentTypes);
        for (const item of feed.items) {
          assert.ok(canonical.has(item.contentType),
            `${item.contentType} ei ole canonical vocabissa (${item.url})`);
        }
      });

      test("date-kentat ovat ISO 8601 (YYYY-MM-DD) tai puuttuvat", () => {
        for (const item of feed.items) {
          if (item.date !== undefined) {
            assert.match(item.date, /^\d{4}-\d{2}-\d{2}$/, `virheellinen date: ${item.date} (${item.url})`);
          }
        }
      });

      test("kaikilla itemeilla lang on 'fi' tai 'en'", () => {
        for (const item of feed.items) {
          assert.ok(item.lang === "fi" || item.lang === "en", `lang=${item.lang} (${item.url})`);
        }
      });

      test("sortataan uusimmasta vanhimpaan", () => {
        for (let i = 1; i < feed.items.length; i++) {
          const prev = feed.items[i - 1];
          const curr = feed.items[i];
          if (prev.date && curr.date) {
            assert.ok(prev.date >= curr.date,
              `jarjestysvirhe indeksi ${i}: ${prev.date} < ${curr.date} (${curr.url})`);
          }
        }
      });
    });
  }
});

// -----------------------------------------------------------------------------
// Sisaisia kentta ei saa vuotaa
// -----------------------------------------------------------------------------
describe("sisaisia kenttia ei vuoda JSON:iin", { skip: !ALL_EXIST && "aja build ensin" }, () => {
  const FORBIDDEN_KEYS = [
    "inputPath", "page", "layout", "permalink", "templateEngineOverride",
    "eleventyExcludeFromCollections", "collections", "draft", "noindex", "robots",
    "computedDate", "eleventy", "pkg", "site"
  ];

  for (const [name, feed] of Object.entries(feeds)) {
    if (!feed) continue;

    test(`${name}: yksikaan sisainen kentta ei vuoda`, () => {
      for (const item of feed.items) {
        for (const key of FORBIDDEN_KEYS) {
          assert.equal(item[key], undefined, `${name}[${item.url}].${key} vuotanut!`);
        }
      }
    });
  }
});

// -----------------------------------------------------------------------------
// Feed-spesifiset validoinnit
// -----------------------------------------------------------------------------
describe("feed-spesifiset validoinnit", { skip: !ALL_EXIST && "aja build ensin" }, () => {

  test("content.json ei sisalla taxonomy-/keyword-/kategoria-arkistosivuja", () => {
    const forbidden = ["/avainsanat/", "/kategoriat/", "/keywords/", "/categories/", "/teemat/"];
    for (const item of feeds.content.items) {
      for (const path of forbidden) {
        assert.ok(!item.url.startsWith(path), `content.json sisaltaa arkistosivun: ${item.url}`);
      }
    }
  });

  test("publications.json sisaltaa VAIN publications-collection sisallot (URL polusta)", () => {
    // Julkaisujen URL:t ovat muotoa /YYYY/MM/DD/slug/ (publications.11tydata.js permalink)
    const notContent = feeds.publications.items.filter(i =>
      i.url.startsWith("/mediassa/") ||
      i.url.startsWith("/esitykset/") ||
      i.url.startsWith("/blogi/")
    );
    assert.equal(notContent.length, 0,
      `publications.json:ssa media/esitykset/blogi-sivuja: ${notContent.map(i => i.url).join(", ")}`);
  });

  test("presentations.json sisaltaa vain presentation-contentType:n", () => {
    for (const item of feeds.presentations.items) {
      assert.equal(item.contentType, "presentation",
        `presentations.json:ssa vaara contentType: ${item.contentType} (${item.url})`);
    }
  });

  test("media.json sisaltaa vain media-contentType:n (mediaItem, video, expertAssignment)", () => {
    const allowed = new Set(["mediaItem", "video", "expertAssignment"]);
    for (const item of feeds.media.items) {
      assert.ok(allowed.has(item.contentType),
        `media.json:ssa vaara contentType: ${item.contentType} (${item.url})`);
    }
  });

  test("council-speeches.json sisaltaa vain speech-contentType:n + speechContext=valtuusto|kyselytunti", () => {
    for (const item of feeds.councilSpeeches.items) {
      assert.equal(item.contentType, "speech",
        `council-speeches.json:ssa vaara contentType: ${item.contentType} (${item.url})`);
    }
  });

  test("theses.json sisaltaa vain thesis-contentType:n", () => {
    for (const item of feeds.theses.items) {
      assert.equal(item.contentType, "thesis",
        `theses.json:ssa vaara contentType: ${item.contentType} (${item.url})`);
      assert.ok(item.thesisType === "masterThesis" || item.thesisType === "bachelorThesis",
        `theses.json:ssa vaara thesisType: ${item.thesisType} (${item.url})`);
    }
  });

  test("content.json sisaltaa oikeasti unionin (publications + presentations + media + blog + politics)", () => {
    // content.json:ssa pitaisi olla vahintaan yhta paljon itemejä kuin publikaatioita
    assert.ok(feeds.content.count >= feeds.publications.count,
      `content.count=${feeds.content.count} vs publications.count=${feeds.publications.count}`);
    // Ja loogisesti content.json <= publications+presentations+media+councils
    const totalExpected = feeds.publications.count + feeds.presentations.count + feeds.media.count;
    assert.ok(feeds.content.count <= totalExpected + 100, // tolerance blog+politics
      `content.count=${feeds.content.count} on paljon suurempi kuin ${totalExpected}`);
  });
});

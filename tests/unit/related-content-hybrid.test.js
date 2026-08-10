/**
 * v4.4 relatedContent-filtterin hybrid-toteutus (H0-kaava).
 *
 * Kattaa käyttäjän vaatimuslistan 10 kohtaa:
 *   1. metadata-only fallback ilman semantic-dataa
 *   2. sim < 0.6 ei vaikuta scoreen (satunnaiskohina)
 *   3. sim >= 0.6 vaikuttaa scoreen (H0-boost)
 *   4. metadataScore=0 + vahva sim voi päästä tuloksiin (Scaffolding-tyyppi)
 *   5. self-reference poistuu
 *   6. duplicate poistuu (uniqueContentItems-logiikka)
 *   7. top-N pysyy neljässä
 *   8. tulos deterministinen
 *   9. semanticRelated puuttuu → toimii identtisesti metadata-only:in kanssa
 *   10. UI renderöityy muuttumattomana → regression check erikseen
 *      (scripts/debug-hybrid-comparison.js production-filtterillä)
 *
 * Aja: npm run test:unit
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  computeRelatedContent,
  SEM_MIN,
  SEM_WEIGHT
} = require("../../eleventy.filters");

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

function makeItem(url, data = {}) {
  return {
    url,
    date: data.date || null,
    data: {
      title: data.title || `Title ${url}`,
      categories: data.categories || [],
      keywords: data.keywords || [],
      tags: data.tags || [],
      contexts: data.contexts || [],
      type: data.type || null
    }
  };
}

function makeCollections(items) {
  // uniqueContentItems iteroi collections.{blog,publications,politics,media,presentations,theses}
  return { blog: items };
}

// -----------------------------------------------------------------------------
// 1. Metadata-only fallback ilman semantic-dataa
// -----------------------------------------------------------------------------

describe("computeRelatedContent — H0 hybrid", () => {
  test("1. semanticRelated={} → tulos on identtinen metadata-only-toteutuksen kanssa", () => {
    const items = [
      makeItem("/a/", { categories: ["kampus"] }),
      makeItem("/b/", { categories: ["kampus"] }),
      makeItem("/c/", { categories: ["opetus"] })
    ];
    const collections = makeCollections(items);
    const anchor = { pageUrl: "/anchor/", categories: ["kampus"] };
    const result = computeRelatedContent(
      collections, anchor.pageUrl, anchor.categories, [], [], "", [], 4,
      {}
    );
    assert.equal(result.length, 2);
    assert.equal(result[0].url, "/a/");
    assert.equal(result[1].url, "/b/");
    // Score = category(5) * 1 = 5. Ei semantic boostia.
    assert.equal(result[0].score, 5);
    assert.equal(result[1].score, 5);
  });

  // ---------------------------------------------------------------------------
  // 2. sim < 0.6 ei vaikuta scoreen
  // ---------------------------------------------------------------------------

  test("2. semantic sim < 0.6 ei vaikuta scoreen (satunnaisuus-kynnys)", () => {
    const items = [makeItem("/a/", { categories: ["kampus"] })];
    const collections = makeCollections(items);
    const semanticRelated = {
      "/anchor/": [{ url: "/a/", sim: 0.599 }]  // juuri kynnyksen alle
    };
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      semanticRelated
    );
    // metadataScore = 5, semanticBoost = 0 → score = 5
    assert.equal(result[0].score, 5);
  });

  test("2b. semantic sim=0 (candidate ei semanticRelated:issa) ei vaikuta scoreen", () => {
    const items = [makeItem("/a/", { categories: ["kampus"] })];
    const collections = makeCollections(items);
    const semanticRelated = {
      "/anchor/": [{ url: "/other/", sim: 0.99 }]  // eri url
    };
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      semanticRelated
    );
    assert.equal(result[0].score, 5);
  });

  // ---------------------------------------------------------------------------
  // 3. sim >= 0.6 vaikuttaa scoreen
  // ---------------------------------------------------------------------------

  test("3. semantic sim >= 0.6 tuottaa boostin metadataScore + sim*5", () => {
    const items = [makeItem("/a/", { categories: ["kampus"] })];
    const collections = makeCollections(items);
    const semanticRelated = {
      "/anchor/": [{ url: "/a/", sim: 0.8 }]
    };
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      semanticRelated
    );
    // metadataScore=5, boost = 0.8 * 5 = 4 → score = 9
    assert.equal(result[0].score, 5 + 0.8 * 5);
  });

  test("3b. sim=0.6 tasan → boostaa (kynnys on inklusiivinen)", () => {
    const items = [makeItem("/a/", { categories: ["kampus"] })];
    const collections = makeCollections(items);
    const semanticRelated = { "/anchor/": [{ url: "/a/", sim: 0.6 }] };
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      semanticRelated
    );
    assert.equal(result[0].score, 5 + 0.6 * 5);
  });

  // ---------------------------------------------------------------------------
  // 4. metadataScore=0 + vahva sim voi päästä tuloksiin (Scaffolding-tyyppi)
  // ---------------------------------------------------------------------------

  test("4. metadataScore=0 + vahva semantic sim päästää itemin top-N:iin", () => {
    const items = [
      makeItem("/scaffolding-2011/", { categories: ["ei-mitään"], keywords: [], contexts: [] })
    ];
    const collections = makeCollections(items);
    const semanticRelated = {
      "/anchor/": [{ url: "/scaffolding-2011/", sim: 0.75 }]
    };
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      semanticRelated
    );
    // metadataScore=0, boost = 0.75 * 5 = 3.75 → score > 0 → mukana
    assert.equal(result.length, 1);
    assert.equal(result[0].url, "/scaffolding-2011/");
    assert.equal(result[0].score, 3.75);
  });

  test("4b. metadataScore=0 ja sim < 0.6 → putoaa pois (score=0)", () => {
    const items = [makeItem("/other/", { categories: ["ei-mitään"] })];
    const collections = makeCollections(items);
    const semanticRelated = {
      "/anchor/": [{ url: "/other/", sim: 0.5 }]
    };
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      semanticRelated
    );
    assert.equal(result.length, 0);
  });

  // ---------------------------------------------------------------------------
  // 5. self-reference poistuu
  // ---------------------------------------------------------------------------

  test("5. self-reference (item.url === pageUrl) poistuu", () => {
    const items = [
      makeItem("/anchor/", { categories: ["kampus"] }),
      makeItem("/a/", { categories: ["kampus"] })
    ];
    const collections = makeCollections(items);
    const semanticRelated = {
      "/anchor/": [{ url: "/anchor/", sim: 1.0 }, { url: "/a/", sim: 0.8 }]
    };
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      semanticRelated
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].url, "/a/");
  });

  // ---------------------------------------------------------------------------
  // 6. duplicate poistuu (uniqueContentItems)
  // ---------------------------------------------------------------------------

  test("6. duplicate item (sama url kahdessa collectionissa) näkyy vain kerran", () => {
    const items = [makeItem("/a/", { categories: ["kampus"] })];
    const collections = {
      blog: items,
      publications: items  // sama url molemmissa
    };
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      {}
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].url, "/a/");
  });

  // ---------------------------------------------------------------------------
  // 7. top-N pysyy neljässä (default)
  // ---------------------------------------------------------------------------

  test("7. top-N default = 4 vaikka candidateja on enemmän", () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem(`/a-${i}/`, { categories: ["kampus"] }));
    const collections = makeCollections(items);
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      {}
    );
    assert.equal(result.length, 4);
  });

  test("7b. explicit limit param toimii (backwards compat)", () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem(`/a-${i}/`, { categories: ["kampus"] }));
    const collections = makeCollections(items);
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", 2, undefined,  // contextsOrLimit=2 (number)
      {}
    );
    assert.equal(result.length, 2);
  });

  // ---------------------------------------------------------------------------
  // 8. tulos on deterministinen (sama input → sama output)
  // ---------------------------------------------------------------------------

  test("8. tulos on deterministinen: kaksi peräkkäistä kutsua tuottavat saman", () => {
    const items = [
      makeItem("/a/", { categories: ["kampus"], date: "2024-01-01" }),
      makeItem("/b/", { categories: ["kampus"], date: "2023-01-01" }),
      makeItem("/c/", { categories: ["kampus"], date: "2025-01-01" })
    ];
    const collections = makeCollections(items);
    const semanticRelated = { "/anchor/": [{ url: "/b/", sim: 0.8 }] };
    const r1 = computeRelatedContent(collections, "/anchor/", ["kampus"], [], [], "", [], 4, semanticRelated);
    const r2 = computeRelatedContent(collections, "/anchor/", ["kampus"], [], [], "", [], 4, semanticRelated);
    assert.deepEqual(r1.map((r) => r.url), r2.map((r) => r.url));
    assert.deepEqual(r1.map((r) => r.score), r2.map((r) => r.score));
  });

  test("8b. tie-break: sama score → uudempi date ensin (nykyinen sort-logiikka)", () => {
    const items = [
      makeItem("/vanha/", { categories: ["kampus"], date: "2020-01-01" }),
      makeItem("/uusi/", { categories: ["kampus"], date: "2025-01-01" })
    ];
    const collections = makeCollections(items);
    const result = computeRelatedContent(collections, "/anchor/", ["kampus"], [], [], "", [], 4, {});
    assert.equal(result[0].url, "/uusi/");
    assert.equal(result[1].url, "/vanha/");
  });

  // ---------------------------------------------------------------------------
  // 9. semanticRelated puuttuu (undefined / null) → toimii identtisesti fallback:iin
  // ---------------------------------------------------------------------------

  test("9. semanticRelated=undefined → fallback: metadata-only tulokset", () => {
    const items = [makeItem("/a/", { categories: ["kampus"] })];
    const collections = makeCollections(items);
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      undefined
    );
    assert.equal(result.length, 1);
    assert.equal(result[0].score, 5);
  });

  test("9b. semanticRelated=null → fallback", () => {
    const items = [makeItem("/a/", { categories: ["kampus"] })];
    const collections = makeCollections(items);
    const result = computeRelatedContent(
      collections, "/anchor/", ["kampus"], [], [], "", [], 4,
      null
    );
    assert.equal(result[0].score, 5);
  });

  // ---------------------------------------------------------------------------
  // Vakiot: dokumentaatio
  // ---------------------------------------------------------------------------

  test("SEM_MIN = 0.6, SEM_WEIGHT = 5 (H0-kaava)", () => {
    assert.equal(SEM_MIN, 0.6);
    assert.equal(SEM_WEIGHT, 5);
  });

  // ---------------------------------------------------------------------------
  // Nykyinen käytös: filtteri palauttaa [] jos anchor:issa ei ole taxonomiaa
  // (§10: semantic on enhancement, ei muuta tätä behaviouria)
  // ---------------------------------------------------------------------------

  test("anchoreilla ei taxonomiaa → tyhjä lista (semantic ei muuta tätä)", () => {
    const items = [makeItem("/a/", { categories: ["kampus"] })];
    const collections = makeCollections(items);
    const semanticRelated = { "/anchor/": [{ url: "/a/", sim: 0.9 }] };
    const result = computeRelatedContent(
      collections, "/anchor/", [], [], [], "", [], 4,
      semanticRelated
    );
    assert.deepEqual(result, []);
  });
});

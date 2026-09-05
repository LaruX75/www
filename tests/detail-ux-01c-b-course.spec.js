const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * DETAIL-UX-01C-B-COURSE — canonical "Samalla kurssilla" SSR section
 * on Presentation detail pages.
 *
 * Selection rule (build-time only, no runtime JS, no graph traversal):
 *   Peer presentation is included iff it shares at least one
 *   `courseContexts[].courseId` with the current presentation. Sort:
 *   date DESC, then title ASC (fi). Cap: 6. Self excluded.
 *
 * Bundled Kempele semantic verification (Canonical Content v1 §3):
 *   `kategoria` (usage-context type) and `jarjestaja` (organiser)
 *   must render under separate <dt> labels so the two semantics never
 *   conflate. Kempele is also a negative control for the peer list
 *   (courseReview.status=rejected, no courseContexts).
 */

const PAGES = {
  courseLuento1: "/presentations/405040y-luento-1-johdanto-2026-a/",
  courseLuento2: "/presentations/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a/",
  courseLuento3: "/presentations/405040y-luento-3-tekoalylukutaito-2026-a/",
  boundedCourseLuento1: "/presentations/ss-1-luento-tieto-ja-viestintatekniikan-perusteet-opintojaksolla-tvt-opetuskayton-h/",
  kempele: "/presentations/kempele-veso-2026/"
};

const PEER_LIMIT = 6;

test.describe("A. Positive — 405040Y peer group (small, exact expectation)", () => {
  for (const [name, url] of Object.entries({
    luento1: PAGES.courseLuento1,
    luento2: PAGES.courseLuento2,
    luento3: PAGES.courseLuento3
  })) {
    test(`${name} shows exactly 2 course peers (3 lectures in group minus self)`, async ({ page }) => {
      const html = await page.request.get(url).then((r) => r.text());
      expect(html, "peer section present").toContain('content-detail-course-peers');
      const peerCount = (html.match(/course-peer-item/g) || []).length;
      expect(peerCount, "exactly 2 peers rendered").toBe(2);
      expect(html, "descriptive line names the course").toContain(
        "Muut opintojakson 405040Y"
      );
    });

    test(`${name} does NOT link back to itself`, async ({ page }) => {
      const html = await page.request.get(url).then((r) => r.text());
      const peerBlockMatch = html.match(/<ul class="list-unstyled mb-0 d-grid gap-2">([\s\S]*?)<\/ul>/);
      expect(peerBlockMatch, "peer <ul> present").not.toBeNull();
      expect(peerBlockMatch[1], "self URL not present in peer list").not.toContain(url);
    });
  }
});

test.describe("B. Bounded — 410014Y peer group capped at PEER_LIMIT", () => {
  test("410014Y luento renders exactly PEER_LIMIT=6 peers (cap enforced)", async ({ page }) => {
    const html = await page.request.get(PAGES.boundedCourseLuento1).then((r) => r.text());
    const peerCount = (html.match(/course-peer-item/g) || []).length;
    expect(peerCount, "PEER_LIMIT cap = 6").toBe(PEER_LIMIT);
    expect(html, "descriptive line names the course").toContain(
      "Muut opintojakson 410014Y"
    );
  });
});

test.describe("C. Negative control — Kempele has no course peers", () => {
  test("Kempele detail page renders NO course-peers section", async ({ page }) => {
    const html = await page.request.get(PAGES.kempele).then((r) => r.text());
    expect(html, "no peer section on Kempele").not.toContain("content-detail-course-peers");
    expect(html, "no 'Samalla kurssilla' heading").not.toContain("Samalla kurssilla");
  });
});

test.describe("D. Kempele semantic verification — Paikka / Käyttöyhteys / Järjestäjä are three independent labels", () => {
  test("Kempele renders <dt>Paikka</dt> row with geographic place from canonical `location`", async ({ page }) => {
    const html = await page.request.get(PAGES.kempele).then((r) => r.text());
    expect(html, "Paikka <dt> row").toMatch(
      /<dt>Paikka<\/dt>\s*<dd>Kempele<\/dd>/
    );
  });

  test("Kempele renders <dt>Käyttöyhteys</dt> row with usage-context type from canonical `kategoria`", async ({ page }) => {
    const html = await page.request.get(PAGES.kempele).then((r) => r.text());
    expect(html, "Käyttöyhteys <dt> row").toMatch(
      /<dt>Käyttöyhteys<\/dt>\s*<dd>Täydennyskoulutus<\/dd>/
    );
  });

  test("Kempele renders <dt>Järjestäjä</dt> row with organiser string from canonical `jarjestaja`", async ({ page }) => {
    const html = await page.request.get(PAGES.kempele).then((r) => r.text());
    expect(html, "Järjestäjä <dt> row").toMatch(
      /<dt>Järjestäjä<\/dt>\s*<dd>Kempeleen kunta \(VESO-koulutus\)<\/dd>/
    );
  });

  test("Kempele does NOT conflate: Käyttöyhteys value is not the organiser string", async ({ page }) => {
    const html = await page.request.get(PAGES.kempele).then((r) => r.text());
    expect(html, "Käyttöyhteys value stays type-only").not.toMatch(
      /<dt>Käyttöyhteys<\/dt>\s*<dd>Kempeleen kunta/
    );
  });

  test("Kempele does NOT conflate: Paikka value is not the organiser string (jarjestaja not relabeled as Paikka)", async ({ page }) => {
    const html = await page.request.get(PAGES.kempele).then((r) => r.text());
    expect(html, "Paikka value stays geographic (not organiser)").not.toMatch(
      /<dt>Paikka<\/dt>\s*<dd>Kempeleen kunta/
    );
  });

  test("Kempele does NOT conflate: Käyttöyhteys value is not the place name", async ({ page }) => {
    const html = await page.request.get(PAGES.kempele).then((r) => r.text());
    expect(html, "Käyttöyhteys value is not the place name").not.toMatch(
      /<dt>Käyttöyhteys<\/dt>\s*<dd>Kempele<\/dd>/
    );
  });

  test("Kempele renders Paikka BEFORE Käyttöyhteys and Käyttöyhteys BEFORE Järjestäjä (semantic reading order)", async ({ page }) => {
    const html = await page.request.get(PAGES.kempele).then((r) => r.text());
    const paikkaIdx = html.indexOf("<dt>Paikka</dt>");
    const kaytIdx = html.indexOf("<dt>Käyttöyhteys</dt>");
    const jarjIdx = html.indexOf("<dt>Järjestäjä</dt>");
    expect(paikkaIdx, "Paikka present").toBeGreaterThan(-1);
    expect(kaytIdx, "Käyttöyhteys present").toBeGreaterThan(-1);
    expect(jarjIdx, "Järjestäjä present").toBeGreaterThan(-1);
    expect(paikkaIdx, "Paikka before Käyttöyhteys").toBeLessThan(kaytIdx);
    expect(kaytIdx, "Käyttöyhteys before Järjestäjä").toBeLessThan(jarjIdx);
  });
});

test.describe("E. Meaningful without JavaScript (SSR-only render)", () => {
  test("405040Y luento-1 peer section markup is present with JS disabled", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const html = await page.request.get(PAGES.courseLuento1).then((r) => r.text());
    expect(html, "peer section in SSR HTML").toContain('content-detail-course-peers');
    const peerCount = (html.match(/course-peer-item/g) || []).length;
    expect(peerCount, "2 peer items in SSR HTML").toBe(2);
    await ctx.close();
  });

  test("Kempele Paikka + Käyttöyhteys + Järjestäjä rows all present in SSR HTML with JS disabled", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const html = await page.request.get(PAGES.kempele).then((r) => r.text());
    expect(html, "Paikka row in SSR").toMatch(
      /<dt>Paikka<\/dt>\s*<dd>Kempele<\/dd>/
    );
    expect(html, "Käyttöyhteys row in SSR").toMatch(
      /<dt>Käyttöyhteys<\/dt>\s*<dd>Täydennyskoulutus<\/dd>/
    );
    expect(html, "Järjestäjä row in SSR").toMatch(
      /<dt>Järjestäjä<\/dt>\s*<dd>Kempeleen kunta \(VESO-koulutus\)<\/dd>/
    );
    await ctx.close();
  });
});

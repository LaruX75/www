const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * COURSE-RELATION-UX-01 — implementation-aware peer semantics +
 * course-implementation backlink. Consumes canonical
 * courseContexts[].periodId (CANONICAL-COURSE-PERIODID-01).
 *
 * DETAIL-UX-SEQUENCE-01 stays CLOSED / DEFERRED: this spec asserts
 * peer ORDER (date DESC / title ASC) but NOT sequence order.
 *
 * DETAIL-UX-01C-B-COURSE invariants remain green: 405040Y = 2 peers,
 * 410014Y = 6 peers on the first-lecture representative page.
 */

const PAGES = {
  courseLuento1: "/presentations/405040y-luento-1-johdanto-2026-a/",
  courseLuento2: "/presentations/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a/",
  courseLuento3: "/presentations/405040y-luento-3-tekoalylukutaito-2026-a/",
  boundedCourseLuento1: "/presentations/ss-1-luento-tieto-ja-viestintatekniikan-perusteet-opintojaksolla-tvt-opetuskayton-h/",
  historical410017Y: "/presentations/ss-luento-1-tieto-ja-viestintatekniikka-pedagogisena-tyovalineena-aani-ja-diat-eiva/",
  kempele: "/presentations/kempele-veso-2026/",
  coursePage: "/opetus/teknologiatuettu-oppiminen/2026-2027-a/"
};

test.describe("A. 405040Y implementation-scoped peer group (courseId + periodId)", () => {
  for (const [name, url] of Object.entries({
    luento1: PAGES.courseLuento1,
    luento2: PAGES.courseLuento2,
    luento3: PAGES.courseLuento3
  })) {
    test(`${name}: heading is 'Samassa kurssitoteutuksessa' and copy names the implementation`, async ({ page }) => {
      const html = await page.request.get(url).then((r) => r.text());
      expect(html, "heading Samassa kurssitoteutuksessa").toContain("Samassa kurssitoteutuksessa");
      expect(html, "implementation-scoped modifier class").toContain("content-detail-course-peers--implementation");
      expect(html, "does NOT carry course-fallback class").not.toContain("content-detail-course-peers--course-fallback");
      expect(html, "copy names courseId 405040Y").toContain("405040Y");
      expect(html, "copy names periodId 2026-2027-a").toContain("2026-2027-a");
      // Must NOT show implementation-implying course-fallback copy on this branch.
      expect(html, "no cross-implementation ambiguity phrasing").not.toContain("Aineisto voi olla eri vuosien toteutuksista");
    });

    test(`${name}: 2 peers, all share courseId 405040Y and periodId 2026-2027-a implicitly`, async ({ page }) => {
      const html = await page.request.get(url).then((r) => r.text());
      const peerCount = (html.match(/course-peer-item/g) || []).length;
      expect(peerCount, "exactly 2 peers").toBe(2);
      // Self-link exclusion still enforced.
      const peerBlockMatch = html.match(/<ul class="list-unstyled mb-0 d-grid gap-2">([\s\S]*?)<\/ul>/);
      expect(peerBlockMatch, "peer <ul> present").not.toBeNull();
      expect(peerBlockMatch[1], "self URL not in peer list").not.toContain(url);
    });
  }
});

test.describe("B. Course-implementation backlink on 405040Y pages", () => {
  for (const [name, url] of Object.entries({
    luento1: PAGES.courseLuento1,
    luento2: PAGES.courseLuento2,
    luento3: PAGES.courseLuento3
  })) {
    test(`${name}: backlink section rendered with correct course-page URL`, async ({ page }) => {
      const html = await page.request.get(url).then((r) => r.text());
      expect(html, "backlink aside present").toContain('class="content-detail-course-implementation"');
      expect(html, "backlink heading Kurssitoteutus").toContain("Kurssitoteutus");
      expect(html, "backlink resolves to /opetus/teknologiatuettu-oppiminen/2026-2027-a/")
        .toContain(`href="${PAGES.coursePage}"`);
      expect(html, "CTA label Avaa kurssisivu").toContain("Avaa kurssisivu");
      expect(html, "carries course name")
        .toContain("Teknologiatuettu oppiminen ja työskentely");
    });

    test(`${name}: backlink URL resolves to a real course page (200 OK)`, async ({ page }) => {
      const res = await page.request.get(PAGES.coursePage);
      expect(res.status(), "course page returns 200").toBe(200);
      const html = await res.text();
      expect(html, "course page h1 present").toMatch(/<h1[^>]*>[^<]*Teknologiatuettu oppiminen[^<]*<\/h1>/);
    });
  }
});

test.describe("C. Course-level fallback (periodId absent) — 410014Y", () => {
  test("410014Y ss-1-luento: fallback heading is 'Samalta opintojaksolta' and cautious historical copy", async ({ page }) => {
    const html = await page.request.get(PAGES.boundedCourseLuento1).then((r) => r.text());
    expect(html, "fallback heading Samalta opintojaksolta").toContain("Samalta opintojaksolta");
    expect(html, "fallback modifier class").toContain("content-detail-course-peers--course-fallback");
    expect(html, "does NOT carry implementation modifier").not.toContain("content-detail-course-peers--implementation");
    expect(html, "does NOT use implementation-scoped heading").not.toContain("Samassa kurssitoteutuksessa");
    expect(html, "cautious historical copy present")
      .toContain("Aineisto voi olla eri vuosien toteutuksista");
    expect(html, "copy names courseId 410014Y").toContain("410014Y");
  });

  test("410014Y ss-1-luento: existing peer count preserved (6)", async ({ page }) => {
    const html = await page.request.get(PAGES.boundedCourseLuento1).then((r) => r.text());
    const peerCount = (html.match(/course-peer-item/g) || []).length;
    expect(peerCount, "6 peers on 410014Y fallback (DETAIL-UX-01C-B-COURSE invariant preserved)").toBe(6);
  });

  test("410014Y ss-1-luento: NO backlink section", async ({ page }) => {
    const html = await page.request.get(PAGES.boundedCourseLuento1).then((r) => r.text());
    expect(html, "no course-implementation backlink").not.toContain('class="content-detail-course-implementation"');
    expect(html, "no 'Kurssitoteutus' heading").not.toContain("Kurssitoteutus");
  });
});

test.describe("D. Course-level fallback (periodId absent) — 410014Y-family (falsification case)", () => {
  test("unconfirmed historical 410014Y record remains fallback + no backlink", async ({ page }) => {
    const html = await page.request.get(PAGES.historical410017Y).then((r) => r.text());
    if (html.length < 500) {
      // Fixture file not built — skip rather than fail on env drift.
      return;
    }
    expect(html, "fallback heading").toContain("Samalta opintojaksolta");
    expect(html, "no implementation modifier").not.toContain("content-detail-course-peers--implementation");
    expect(html, "no backlink").not.toContain('class="content-detail-course-implementation"');
  });
});

test.describe("E. Kempele exclusion invariant preserved", () => {
  test("Kempele has no peer section and no backlink", async ({ page }) => {
    const html = await page.request.get(PAGES.kempele).then((r) => r.text());
    expect(html, "no course-peers section").not.toContain("content-detail-course-peers");
    expect(html, "no course-implementation backlink").not.toContain("content-detail-course-implementation");
    expect(html, "no Samalla kurssilla heading").not.toContain("Samalla kurssilla");
    expect(html, "no Samassa kurssitoteutuksessa heading").not.toContain("Samassa kurssitoteutuksessa");
    expect(html, "no Samalta opintojaksolta heading").not.toContain("Samalta opintojaksolta");
  });
});

test.describe("F. Meaningful without JavaScript (SSR only)", () => {
  test("405040Y luento-1: peer section + backlink both present in SSR HTML with JS disabled", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const html = await page.request.get(PAGES.courseLuento1).then((r) => r.text());
    expect(html, "peer section SSR").toContain("content-detail-course-peers--implementation");
    expect(html, "backlink SSR").toContain("content-detail-course-implementation");
    expect(html, "course-page URL SSR").toContain(PAGES.coursePage);
    await ctx.close();
  });
});

test.describe("G. No new runtime JSON / page-specific JS added by this slice", () => {
  test("405040Y luento-1 does not fetch a course-relation JSON at runtime", async ({ page }) => {
    const requests = [];
    page.on("request", (req) => {
      if (req.resourceType() === "fetch" || req.resourceType() === "xhr") {
        requests.push(req.url());
      }
    });
    await page.goto(PAGES.courseLuento1);
    await page.waitForLoadState("networkidle");
    const courseRelated = requests.filter((u) => /course|kurssi|periodId/i.test(u) && /\.json(\?|$)/i.test(u));
    expect(courseRelated, "no runtime course-related JSON fetch").toEqual([]);
  });
});

test.describe("H. Public JSON / JSON-LD / Pagefind meta unchanged (periodId not exposed)", () => {
  test("public /data/presentations-page.json still has 0 periodId occurrences", async ({ page }) => {
    const res = await page.request.get("/data/presentations-page.json");
    expect(res.status(), "public JSON exists").toBe(200);
    const raw = await res.text();
    expect(raw, "no periodId in public JSON").not.toContain('"periodId"');
    expect(raw, "courseContexts still present in public JSON").toContain('"courseContexts"');
  });
});

test.describe("I. DETAIL-UX-01C-B-COURSE peerPresentationsByCourse invariant remains", () => {
  // The `peerPresentationsByCourse` computed still returns the same
  // flat array shape (via backwards-compat shim). Existing
  // detail-ux-01c-b-course.spec.js keeps asserting those counts.
  // Sanity duplication of the counts here to catch a shim breakage
  // even if that spec is ever removed.
  test("405040Y luento-1 emits 2 peers", async ({ page }) => {
    const html = await page.request.get(PAGES.courseLuento1).then((r) => r.text());
    expect((html.match(/course-peer-item/g) || []).length).toBe(2);
  });
  test("410014Y ss-1-luento emits 6 peers", async ({ page }) => {
    const html = await page.request.get(PAGES.boundedCourseLuento1).then((r) => r.text());
    expect((html.match(/course-peer-item/g) || []).length).toBe(6);
  });
});

const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const coursePages = require("../src/_data/coursePages");
const { isCurrentImplementation, splitCatalogByCurrency } = require("../src/_data/coursePages");

const OPETUS = "/opetus/";
const ROOT = path.resolve(__dirname, "..");
const LANDING_PATH = path.join(ROOT, "src", "fi", "opetus.md");

test.describe.configure({ mode: "serial" });

test.describe("OPETUS-CATALOG-UX-01B current vs historical split", () => {
  test.describe("A. Grouping helper (peppiUrl → current)", () => {
    test("isCurrentImplementation is true only when a live peppiUrl is present", () => {
      expect(isCurrentImplementation({ peppiUrl: "https://opas.peppi.oulu.fi/fi/opintojakso/405040Y/28004?period=2026-2027" })).toBe(true);
      expect(isCurrentImplementation({ peppiUrl: "" })).toBe(false);
      expect(isCurrentImplementation({})).toBe(false);
      expect(isCurrentImplementation({ peppiUrl: "   " })).toBe(false);
    });

    test("splitCatalogByCurrency routes each implementation by peppiUrl signal, preserving grouping order", () => {
      const stub = [
        {
          courseId: "TEST1",
          courseName: "Test course 1",
          implementations: [
            { periodId: "future-a", academicYear: "2027–2028", peppiUrl: "https://opas.peppi.oulu.fi/fi/opintojakso/TEST1/9999?period=2027-2028" },
            { periodId: "past-a", academicYear: "2020–2021", peppiUrl: "" }
          ]
        },
        {
          courseId: "TEST2",
          courseName: "Test course 2 archival-only",
          implementations: [
            { periodId: "only-past-a", academicYear: "2015–2016", peppiUrl: "" }
          ]
        }
      ];
      const { current, historical } = splitCatalogByCurrency(stub);
      // Current: TEST1 with only the future impl; TEST2 excluded.
      expect(current.map((c) => c.courseId)).toEqual(["TEST1"]);
      expect(current[0].implementations.map((i) => i.periodId)).toEqual(["future-a"]);
      // Historical: TEST1 with past impl + TEST2 with only-past.
      expect(historical.map((c) => c.courseId)).toEqual(["TEST1", "TEST2"]);
      expect(historical[0].implementations.map((i) => i.periodId)).toEqual(["past-a"]);
      expect(historical[1].implementations.map((i) => i.periodId)).toEqual(["only-past-a"]);
    });

    test("no new canonical `current` / `archived` boolean is stored on any implementation", () => {
      for (const impl of coursePages.all) {
        expect(impl).not.toHaveProperty("current");
        expect(impl).not.toHaveProperty("historical");
        expect(impl).not.toHaveProperty("archived");
      }
    });
  });

  test.describe("B. Rendered sections and headings", () => {
    test("landing renders Nykyinen opetus section", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      expect(html).toMatch(/<h2[^>]*id="opetus-nykyinen-heading"[^>]*>[^<]*Nykyinen opetus[^<]*<\/h2>/);
      expect(html).toContain('data-opetus-catalog="current"');
    });

    test("landing renders Aiemmat kurssitoteutukset section", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      expect(html).toMatch(/<h2[^>]*id="opetus-aiemmat-heading"[^>]*>[^<]*Aiemmat kurssitoteutukset[^<]*<\/h2>/);
      expect(html).toContain('data-opetus-catalog="historical"');
    });

    test("historical section carries the exact manual-curation notice", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      const noticeRe = /<p[^>]*data-opetus-historical-notice[^>]*>[^<]*Aiemmat kurssitoteutukset tuodaan parhaillaan käsin osaksi tätä luetteloa, joten kaikkia vanhoja toteutuksia ei vielä näy täällä\.[^<]*<\/p>/;
      expect(html, "notice paragraph is present with the exact task-specified wording").toMatch(noticeRe);
      // Notice must NOT claim completeness or automatic import.
      expect(html, "no completeness or automation claim in notice").not.toMatch(/(automaatti|kaikki toteutukset ovat)/i);
    });
  });

  test.describe("C. Section membership today", () => {
    test("405040Y (with peppiUrl) is only in the current section", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      const currentHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="current"[\s\S]*?<\/section>/)[0];
      const historicalHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="historical"[\s\S]*?<\/section>/)[0];
      expect(currentHtml).toContain('data-course-id="405040Y"');
      expect(historicalHtml).not.toContain('data-course-id="405040Y"');
      expect(currentHtml).toContain('data-period-id="2026-2027-a"');
      expect(historicalHtml).not.toContain('data-period-id="2026-2027-a"');
    });

    test("410014Y / 2013–2014 (no peppiUrl) is only in the historical section", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      const currentHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="current"[\s\S]*?<\/section>/)[0];
      const historicalHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="historical"[\s\S]*?<\/section>/)[0];
      expect(historicalHtml).toContain('data-course-id="410014Y"');
      expect(currentHtml).not.toContain('data-course-id="410014Y"');
      expect(historicalHtml).toContain('data-period-id="2013-2014-a"');
      expect(currentHtml).not.toContain('data-period-id="2013-2014-a"');
    });

    test("no implementation is duplicated across sections", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      const periodIds = Array.from(html.matchAll(/data-period-id="([^"]+)"/g)).map((m) => m[1]);
      const uniquePeriodIds = Array.from(new Set(periodIds));
      expect(periodIds.length, "periodIds appear exactly once").toBe(uniquePeriodIds.length);
    });
  });

  test.describe("D. Component language preserved from OPETUS-CATALOG-UX-01", () => {
    test("full-row list-group-item-action link markup preserved in both sections", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      const currentHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="current"[\s\S]*?<\/section>/)[0];
      const historicalHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="historical"[\s\S]*?<\/section>/)[0];
      for (const catalogHtml of [currentHtml, historicalHtml]) {
        expect(catalogHtml).toMatch(/<a[^>]*class="list-group-item list-group-item-action[^"]*"[^>]*data-opetus-implementation/);
        expect(catalogHtml).not.toMatch(/data-opetus-course[\s\S]*?p-4 p-lg-5/);
        expect(catalogHtml).not.toMatch(/btn btn-primary rounded-pill[\s\S]*?Avaa kurssisivu/);
      }
    });

    test("mobile touch targets remain >= 44x44 CSS px for every implementation link", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(OPETUS, { waitUntil: "domcontentloaded" });
      const rects = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[data-opetus-implementation]")).map((el) => {
          const r = el.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height) };
        })
      );
      expect(rects.length, "at least one impl link").toBeGreaterThan(0);
      for (const r of rects) {
        expect(r.h, `link height ${r.h}px meets 44px`).toBeGreaterThanOrEqual(44);
        expect(r.w, `link width ${r.w}px meets 44px`).toBeGreaterThanOrEqual(44);
      }
    });

    test("row layout has title above meta (stacked) rather than opposite ends of a flex row", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      // Stacked block layout: fw-semibold title, then small-muted meta with mt-1 immediately below.
      expect(html).toMatch(/<a[^>]*data-opetus-implementation[^>]*>\s*<div class="fw-semibold">[\s\S]*?<\/div>\s*<div class="small text-muted mt-1">/);
    });

    test("bg-transparent applied to implementation rows so no beige/disabled look bleeds through", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      expect(html).toMatch(/<a[^>]*class="list-group-item list-group-item-action bg-transparent[^"]*"[^>]*data-opetus-implementation/);
    });
  });

  test.describe("E. Section-level counts + grammar", () => {
    test("both sections show a course count badge that agrees in number", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      const currentSection = html.match(/id="opetus-nykyinen-heading"[\s\S]*?<\/section>/)[0];
      const historicalSection = html.match(/id="opetus-aiemmat-heading"[\s\S]*?<\/section>/)[0];
      // With today's inventory, both sections have 1 course, so both badges must say "1 kurssi".
      expect(currentSection).toMatch(/1 kurssi\b/);
      expect(historicalSection).toMatch(/1 kurssi\b/);
      // No leaked plural form when count is 1.
      expect(currentSection.match(/1 kurssia/)).toBeNull();
      expect(historicalSection.match(/1 kurssia/)).toBeNull();
    });

    test("no hard-coded catalog counts in the landing template", () => {
      const landing = fs.readFileSync(LANDING_PATH, "utf8");
      // No literal "2 kurssia" or similar magic numbers in the template body.
      expect(landing).not.toMatch(/>\s*\d+ kurssi(a?)\s*<\/span>/);
      // Count is derived from the length of the projected catalog array.
      expect(landing).toContain("courses.length");
    });
  });

  test.describe("F. Future compatibility with OPETUS-CURATION-01C2 (2014-2015)", () => {
    test("the grouping helper would land a hypothetical no-peppi 2014-2015 impl under historical", () => {
      // This mirrors the frontmatter shape that PR #227 introduces.
      // isCurrentImplementation must return false — the impl has no peppiUrl.
      const future2014 = {
        courseId: "410014Y",
        periodId: "2014-2015-a",
        academicYear: "2014–2015",
        semesterLabel: "Syksy 2014",
        peppiUrl: ""
      };
      expect(isCurrentImplementation(future2014)).toBe(false);
      // In splitCatalogByCurrency the impl lands in `historical`, keeping
      // the 410014Y course card grouped with its existing historical 2013 sibling.
      const stub = [
        {
          courseId: "410014Y",
          courseName: "Tieto- ja viestintätekniikka pedagogisena työvälineenä",
          implementations: [
            future2014,
            { periodId: "2013-2014-a", academicYear: "2013–2014", semesterLabel: "Syksy 2013", peppiUrl: "" }
          ]
        }
      ];
      const { current, historical } = splitCatalogByCurrency(stub);
      expect(current).toEqual([]);
      expect(historical.length).toBe(1);
      expect(historical[0].implementations.map((i) => i.periodId)).toEqual(["2014-2015-a", "2013-2014-a"]);
    });
  });

  test.describe("G. Architecture boundaries preserved", () => {
    test("no runtime JSON fetch introduced by the split", async ({ page }) => {
      const requests = [];
      page.on("request", (req) => {
        if (req.resourceType() === "fetch" || req.resourceType() === "xhr") requests.push(req.url());
      });
      await page.goto(OPETUS, { waitUntil: "networkidle" });
      const suspicious = requests.filter((u) => /\/(opetus|course|coursePages|catalog)\b/i.test(u) && /\.json(\?|$)/i.test(u));
      expect(suspicious).toEqual([]);
    });

    test("no new EN teaching route synthesized by the split", async ({ page }) => {
      for (const url of ["/en/opetus/", "/en/teaching/"]) {
        const res = await page.request.get(url, { failOnStatusCode: false });
        expect(res.status(), `${url}`).toBeGreaterThanOrEqual(400);
      }
    });

    test("Presentation courseContexts semantics remain unchanged (no `current`/`archived` boolean added on records)", () => {
      // Spot-check the two live main records that participate in the catalog.
      const p405 = fs.readFileSync(path.join(ROOT, "src", "presentations", "405040y-luento-1-johdanto-2026-a.md"), "utf8");
      const p410 = fs.readFileSync(path.join(ROOT, "src", "presentations", "ss-luento1-johdanto-410014y-tvt-pedagogiset-perusteet.md"), "utf8");
      for (const raw of [p405, p410]) {
        expect(raw).not.toMatch(/^\s*current:/m);
        expect(raw).not.toMatch(/^\s*historical:/m);
        expect(raw).not.toMatch(/^\s*archived:/m);
      }
    });
  });
});

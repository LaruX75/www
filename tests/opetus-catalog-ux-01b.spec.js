const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const coursePages = require("../src/_data/coursePages");
const {
  isCurrentImplementation,
  splitCatalogByCurrency,
  extractAcademicYearStart,
  computeCurrentAcademicYearStart
} = require("../src/_data/coursePages");

const OPETUS = "/opetus/";
const ROOT = path.resolve(__dirname, "..");
const LANDING_PATH = path.join(ROOT, "src", "fi", "opetus.md");

test.describe.configure({ mode: "serial" });

test.describe("OPETUS-CATALOG-UX-01B current vs historical split", () => {
  test.describe("A. Grouping helper (academicYear → current/historical)", () => {
    test("extractAcademicYearStart parses en-dash, em-dash and plain-hyphen 'YYYY–YYYY' identifiers", () => {
      expect(extractAcademicYearStart("2026–2027")).toBe(2026);
      expect(extractAcademicYearStart("2013—2014")).toBe(2013);
      expect(extractAcademicYearStart("2015-2016")).toBe(2015);
      expect(extractAcademicYearStart(" 2020–2021 ")).toBe(2020);
      expect(Number.isNaN(extractAcademicYearStart(""))).toBe(true);
      expect(Number.isNaN(extractAcademicYearStart(undefined))).toBe(true);
      expect(Number.isNaN(extractAcademicYearStart("2026"))).toBe(true);
    });

    test("computeCurrentAcademicYearStart follows Oulu's 1 Aug – 31 Jul academic year", () => {
      // Jan through Jul: current academic year started the PREVIOUS calendar year.
      expect(computeCurrentAcademicYearStart(new Date(Date.UTC(2027, 0, 15)))).toBe(2026);
      expect(computeCurrentAcademicYearStart(new Date(Date.UTC(2027, 6, 31)))).toBe(2026);
      // Aug through Dec: current academic year started this calendar year.
      expect(computeCurrentAcademicYearStart(new Date(Date.UTC(2027, 7, 1)))).toBe(2027);
      expect(computeCurrentAcademicYearStart(new Date(Date.UTC(2027, 11, 31)))).toBe(2027);
    });

    test("isCurrentImplementation compares implementation academic year against the current academic year", () => {
      const septemberThisYear = new Date(Date.UTC(2026, 8, 7)); // 2026-09-07 — Nykyinen: 2026–2027
      // Current or upcoming implementations classify as current.
      expect(isCurrentImplementation({ academicYear: "2026–2027" }, septemberThisYear)).toBe(true);
      expect(isCurrentImplementation({ academicYear: "2027–2028" }, septemberThisYear)).toBe(true);
      // Older academic years classify as historical.
      expect(isCurrentImplementation({ academicYear: "2013–2014" }, septemberThisYear)).toBe(false);
      expect(isCurrentImplementation({ academicYear: "2014–2015" }, septemberThisYear)).toBe(false);
      expect(isCurrentImplementation({ academicYear: "2025–2026" }, septemberThisYear)).toBe(false);
      // Missing / malformed academic year is treated as unclassified → historical.
      expect(isCurrentImplementation({}, septemberThisYear)).toBe(false);
      expect(isCurrentImplementation({ academicYear: "" }, septemberThisYear)).toBe(false);
    });

    test("A resource pointer (peppiUrl or any external URL) does NOT determine temporal status", () => {
      // peppiUrl is a source/orientation link, not a status field. Even
      // if a historical implementation carries an archive Peppi link, it
      // must remain historical.
      const septemberThisYear = new Date(Date.UTC(2026, 8, 7));
      const historicalWithPeppi = {
        academicYear: "2013–2014",
        peppiUrl: "https://opas.peppi.oulu.fi/fi/opintojakso/410014Y/3213?period=2013-2014"
      };
      expect(isCurrentImplementation(historicalWithPeppi, septemberThisYear)).toBe(false);
      // And the converse: a current implementation without a Peppi link
      // (pending curation) must still be classified as current.
      const currentWithoutPeppi = { academicYear: "2026–2027" };
      expect(isCurrentImplementation(currentWithoutPeppi, septemberThisYear)).toBe(true);
    });

    test("splitCatalogByCurrency routes each implementation by academic-year comparison, preserving grouping order", () => {
      const septemberThisYear = new Date(Date.UTC(2026, 8, 7));
      const stub = [
        {
          courseId: "TEST1",
          courseName: "Test course 1",
          implementations: [
            { periodId: "future-a", academicYear: "2027–2028" },
            { periodId: "past-a", academicYear: "2020–2021" }
          ]
        },
        {
          courseId: "TEST2",
          courseName: "Test course 2 archival-only",
          implementations: [
            { periodId: "only-past-a", academicYear: "2015–2016" }
          ]
        }
      ];
      const { current, historical } = splitCatalogByCurrency(stub, septemberThisYear);
      expect(current.map((c) => c.courseId)).toEqual(["TEST1"]);
      expect(current[0].implementations.map((i) => i.periodId)).toEqual(["future-a"]);
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
    test("405040Y (academicYear 2026–2027, current) is only in the current section", async ({ page }) => {
      const html = await page.request.get(OPETUS).then((r) => r.text());
      const currentHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="current"[\s\S]*?<\/section>/)[0];
      const historicalHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="historical"[\s\S]*?<\/section>/)[0];
      expect(currentHtml).toContain('data-course-id="405040Y"');
      expect(historicalHtml).not.toContain('data-course-id="405040Y"');
      expect(currentHtml).toContain('data-period-id="2026-2027-a"');
      expect(historicalHtml).not.toContain('data-period-id="2026-2027-a"');
    });

    test("410014Y / 2013–2014 (older academic year, historical) is only in the historical section", async ({ page }) => {
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
    test("the grouping helper would land a hypothetical 2014-2015 impl under historical", () => {
      // This mirrors the frontmatter shape PR #227 introduces. The
      // classifier compares academicYear against today's academic year;
      // 2014-2015 is well in the past regardless of whether the page
      // happens to carry a Peppi archive link.
      const septemberThisYear = new Date(Date.UTC(2026, 8, 7));
      const future2014 = {
        courseId: "410014Y",
        periodId: "2014-2015-a",
        academicYear: "2014–2015",
        semesterLabel: "Syksy 2014"
      };
      expect(isCurrentImplementation(future2014, septemberThisYear)).toBe(false);
      const stub = [
        {
          courseId: "410014Y",
          courseName: "Tieto- ja viestintätekniikka pedagogisena työvälineenä",
          implementations: [
            future2014,
            { periodId: "2013-2014-a", academicYear: "2013–2014", semesterLabel: "Syksy 2013" }
          ]
        }
      ];
      const { current, historical } = splitCatalogByCurrency(stub, septemberThisYear);
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

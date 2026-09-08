const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const coursePages = require("../src/_data/coursePages");

const OPETUS = "/opetus/";
const COURSE = "/opetus/teknologiatuettu-oppiminen/2026-2027-a/";
const HISTORICAL_COURSE = "/opetus/teknologiatuettu-oppiminen/2025-2026-b/";
const ROOT = path.resolve(__dirname, "..");

test.describe.configure({ mode: "serial" });

test.describe("OPETUS-CATALOG-01A derived SSR catalog", () => {
  test("coursePages projects the local course page into a course to implementation catalog", () => {
    const currentCourse = coursePages.catalog.find((course) => course.courseId === "405040Y");
    expect(currentCourse).toMatchObject({
      courseId: "405040Y",
      courseName: "Teknologiatuettu oppiminen ja työskentely"
    });
    expect(currentCourse.implementations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        periodId: "2026-2027-a",
        academicYear: "2026–2027",
        pageUrl: COURSE
      }),
      expect.objectContaining({
        periodId: "2025-2026-b",
        academicYear: "2025-2026",
        pageUrl: HISTORICAL_COURSE
      })
    ]));
  });

  test("landing renders course to implementation hierarchy in SSR HTML with JavaScript disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.request.get(OPETUS);
    const html = await response.text();

    expect(response.status()).toBe(200);
    expect(html).toContain("data-opetus-catalog");
    expect(html).toContain('data-course-id="405040Y"');
    expect(html).toContain('data-period-id="2026-2027-a"');
    expect(html).toContain(`href="${COURSE}"`);
    await context.close();
  });

  test("landing consumes the shared catalog projection instead of a handwritten course inventory", () => {
    // OPETUS-CATALOG-UX-01B derived the catalog into two projections
    // (coursePages.catalogCurrent, coursePages.catalogHistorical) built
    // from the same buildCoursePagesIndex() output. The invariant that
    // matters is: the template consumes derived data, never a handwritten
    // course list.
    const landing = fs.readFileSync(path.join(ROOT, "src", "fi", "opetus.md"), "utf8");
    expect(landing).toContain("coursePages.catalogCurrent");
    expect(landing).toContain("coursePages.catalogHistorical");
    expect(landing).not.toContain('href="/opetus/teknologiatuettu-oppiminen/2026-2027-a/"');
    expect(landing).not.toContain("Opintojakson 405040Y syyslukukauden 2026 toteutus");
  });

  test("scope stays local, FI-only, and free of Peppi build or runtime fetches", async ({ page }) => {
    const landing = fs.readFileSync(path.join(ROOT, "src", "fi", "opetus.md"), "utf8");
    const catalogSource = fs.readFileSync(path.join(ROOT, "src", "_data", "coursePages.js"), "utf8");
    expect(catalogSource).toContain('"..", "opetus"');
    expect(catalogSource).not.toMatch(/fetch\s*\(/);
    expect(landing).not.toMatch(/fetch\s*\(/);

    for (const url of ["/en/opetus/", "/en/teaching/", "/opetus/410014y/", "/opetus/410017y/"]) {
      const response = await page.request.get(url, { failOnStatusCode: false });
      expect(response.status(), `${url} is not a catalog page`).toBeGreaterThanOrEqual(400);
    }
  });
});

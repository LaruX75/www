const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const coursePages = require("../src/_data/coursePages");

const OPETUS = "/opetus/";
const ROOT = path.resolve(__dirname, "..");
const LANDING_PATH = path.join(ROOT, "src", "fi", "opetus.md");

test.describe.configure({ mode: "serial" });

test.describe("OPETUS-CATALOG-UX-01 compact course-group presentation", () => {
  test("landing is SSR and keeps the derived catalog data flow", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const response = await page.request.get(OPETUS);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("data-opetus-catalog");
    expect(html).toContain("data-opetus-course");
    expect(html).toContain("data-opetus-implementation");
    await context.close();
  });

  test("landing template still consumes the shared coursePages.catalog projection", () => {
    const landing = fs.readFileSync(LANDING_PATH, "utf8");
    expect(landing).toContain("{% for course in coursePages.catalog %}");
    expect(landing).not.toContain('href="/opetus/teknologiatuettu-oppiminen/2026-2027-a/"');
    expect(landing).not.toContain("Opintojakson 405040Y syyslukukauden 2026 toteutus");
  });

  test("every catalog course and implementation preserves canonical identity attributes", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    for (const course of coursePages.catalog) {
      expect(html, `data-course-id ${course.courseId}`).toContain(`data-course-id="${course.courseId}"`);
      expect(html, `courseName ${course.courseName}`).toContain(course.courseName);
      for (const impl of course.implementations) {
        expect(html, `data-period-id ${impl.periodId}`).toContain(`data-period-id="${impl.periodId}"`);
        expect(html, `pageUrl ${impl.pageUrl}`).toContain(`href="${impl.pageUrl}"`);
      }
    }
  });

  test("catalog renders both current and historical courses as separate groups", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    const catalogMatch = html.match(/<div class="vstack gap-3" data-opetus-catalog>[\s\S]*?<\/section>/);
    expect(catalogMatch, "catalog wrapper present").not.toBeNull();
    const catalogHtml = catalogMatch[0];
    // 410014Y and 405040Y must appear as separately grouped courses
    const courses = catalogHtml.match(/data-opetus-course/g) || [];
    expect(courses.length, "at least two course groups today").toBeGreaterThanOrEqual(2);
    const has405040 = /data-opetus-course[^>]*data-course-id="405040Y"[\s\S]*?<h3[^>]*>[^<]*Teknologiatuettu/.test(catalogHtml);
    const has410014 = /data-opetus-course[^>]*data-course-id="410014Y"[\s\S]*?<h3[^>]*>[^<]*Tieto- ja viestintätekniikka/.test(catalogHtml);
    expect(has405040, "405040Y group heading").toBe(true);
    expect(has410014, "410014Y group heading").toBe(true);
  });

  test("410014Y implementations render inside its own course group, not as loose peers", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    const html410 = html.match(/data-opetus-course[^>]*data-course-id="410014Y"[\s\S]*?<\/article>/);
    expect(html410, "410014Y course card block").not.toBeNull();
    for (const impl of coursePages.catalog.find((c) => c.courseId === "410014Y").implementations) {
      expect(html410[0], `410014Y impl ${impl.periodId} inside 410014Y card`).toContain(`data-period-id="${impl.periodId}"`);
    }
  });

  test("implementations render as compact list-group rows, not oversized cards", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    const catalogMatch = html.match(/<div class="vstack gap-3" data-opetus-catalog>[\s\S]*?<\/section>/);
    const catalogHtml = catalogMatch[0];
    // Reuse Bootstrap list-group-flush density primitive
    expect(catalogHtml).toContain("list-group list-group-flush");
    // Old spacious presentation must be gone from the catalog area
    expect(catalogHtml, "no oversized card padding inside catalog").not.toMatch(/data-opetus-course[\s\S]*?p-4 p-lg-5/);
    // Only linked titles are the primary action; no repeated pill CTA per implementation
    expect(catalogHtml, "no repeated Avaa kurssisivu pill button").not.toMatch(/btn btn-primary rounded-pill[\s\S]*?Avaa kurssisivu/);
  });

  test("stale one-implementation copy is removed and replaced with evergreen wording", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, "stale hardcoded count claim").not.toContain("Tällä hetkellä julkinen kurssisivu on avattu vain");
    expect(html, "evergreen pointer to esitykset").toContain("esitysten kokoelmasta");
  });

  test("implementation ordering follows coursePages.catalog projection deterministically", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    const catalogHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog>[\s\S]*?<\/section>/)[0];
    // Verify course order matches the catalog projection (alphabetical by name)
    const domCourseIds = Array.from(catalogHtml.matchAll(/data-course-id="([^"]+)"/g)).map((m) => m[1]);
    const projectedCourseIds = coursePages.catalog.map((c) => c.courseId);
    expect(domCourseIds).toEqual(projectedCourseIds);
    // And per course, implementation order matches
    for (const course of coursePages.catalog) {
      const courseBlock = catalogHtml.match(new RegExp(`data-course-id="${course.courseId}"[\\s\\S]*?</article>`))[0];
      const domImplPeriods = Array.from(courseBlock.matchAll(/data-period-id="([^"]+)"/g)).map((m) => m[1]);
      const projectedImplPeriods = course.implementations.map((i) => i.periodId);
      expect(domImplPeriods, `${course.courseId} implementation order`).toEqual(projectedImplPeriods);
    }
  });

  test("no runtime JSON fetch is added by the redesigned catalog", async ({ page }) => {
    const requests = [];
    page.on("request", (req) => {
      if (req.resourceType() === "fetch" || req.resourceType() === "xhr") requests.push(req.url());
    });
    await page.goto(OPETUS, { waitUntil: "networkidle" });
    const suspicious = requests.filter((u) => /\/(opetus|catalog|courses|coursePages)\b/i.test(u) && /\.json(\?|$)/i.test(u));
    expect(suspicious, "no catalog runtime JSON fetch").toEqual([]);
  });

  test("no synthesized EN teaching route surfaces from the redesign", async ({ page }) => {
    for (const url of ["/en/opetus/", "/en/teaching/"]) {
      const res = await page.request.get(url, { failOnStatusCode: false });
      expect(res.status(), `${url}`).toBeGreaterThanOrEqual(400);
    }
  });
});

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
    // OPETUS-CATALOG-UX-01B: the catalog is now split into
    // coursePages.catalogCurrent and coursePages.catalogHistorical
    // (derived from the same buildCoursePagesIndex() output as
    // coursePages.catalog). The important invariant is that the
    // template consumes a derived projection, not a handwritten list.
    const landing = fs.readFileSync(LANDING_PATH, "utf8");
    expect(landing).toContain("coursePages.catalogCurrent");
    expect(landing).toContain("coursePages.catalogHistorical");
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
    // OPETUS-CATALOG-UX-01B splits the catalog into two sections. Each
    // course still gets its own bounded card, just possibly under a
    // different section heading.
    const html = await page.request.get(OPETUS).then((r) => r.text());
    const currentMatch = html.match(/<div class="vstack gap-3" data-opetus-catalog="current"[\s\S]*?<\/section>/);
    const historicalMatch = html.match(/<div class="vstack gap-3" data-opetus-catalog="historical"[\s\S]*?<\/section>/);
    expect(currentMatch, "current-section catalog wrapper present").not.toBeNull();
    expect(historicalMatch, "historical-section catalog wrapper present").not.toBeNull();
    const combinedCatalog = currentMatch[0] + historicalMatch[0];
    const courses = combinedCatalog.match(/data-opetus-course/g) || [];
    expect(courses.length, "at least two course groups today (across both sections)").toBeGreaterThanOrEqual(2);
    const has405040 = /data-opetus-course[^>]*data-course-id="405040Y"[\s\S]*?<h3[^>]*>[^<]*Teknologiatuettu/.test(combinedCatalog);
    const has410014 = /data-opetus-course[^>]*data-course-id="410014Y"[\s\S]*?<h3[^>]*>[^<]*Tieto- ja viestintätekniikka/.test(combinedCatalog);
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
    const currentMatch = html.match(/<div class="vstack gap-3" data-opetus-catalog="current"[\s\S]*?<\/section>/)[0];
    const historicalMatch = html.match(/<div class="vstack gap-3" data-opetus-catalog="historical"[\s\S]*?<\/section>/)[0];
    for (const catalogHtml of [currentMatch, historicalMatch]) {
      // Reuse Bootstrap list-group-flush density primitive
      expect(catalogHtml).toContain("list-group list-group-flush");
      // Old spacious presentation must be gone from the catalog area
      expect(catalogHtml, "no oversized card padding inside catalog").not.toMatch(/data-opetus-course[\s\S]*?p-4 p-lg-5/);
      // Only linked titles are the primary action; no repeated pill CTA per implementation
      expect(catalogHtml, "no repeated Avaa kurssisivu pill button").not.toMatch(/btn btn-primary rounded-pill[\s\S]*?Avaa kurssisivu/);
    }
  });

  test("each implementation row is a full-row interactive link with sufficient touch area", async ({ page }) => {
    // OPETUS-CATALOG-UX-01 pre-merge fix: the implementation row IS the
    // link (`<a class="list-group-item list-group-item-action">`), so the
    // clickable/tappable target = the row, not just the inline title.
    // Repo precedent: src/en/keywords.njk uses the identical
    // "<a class='list-group-item list-group-item-action'>" pattern.
    const html = await page.request.get(OPETUS).then((r) => r.text());
    const currentHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="current"[\s\S]*?<\/section>/)[0];
    const historicalHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="historical"[\s\S]*?<\/section>/)[0];
    for (const catalogHtml of [currentHtml, historicalHtml]) {
      // The data marker MUST live on the <a> element that owns the click area.
      expect(catalogHtml, "implementation link is an <a> with list-group-item-action").toMatch(
        /<a[^>]*class="list-group-item list-group-item-action[^"]*"[^>]*data-opetus-implementation/
      );
      // No implementation is rendered as a non-clickable <li> anymore.
      expect(catalogHtml, "no non-anchor implementation row").not.toMatch(
        /<li[^>]*data-opetus-implementation/
      );
    }
    // Verify actual link geometry (WCAG 2.5.5 AAA 44x44). Rendered via a
    // JS-enabled browser context because clickable-area measurement is
    // layout-dependent.
    await page.goto(OPETUS, { waitUntil: "domcontentloaded" });
    const rects = await page.evaluate(() => Array.from(document.querySelectorAll("a[data-opetus-implementation]")).map((el) => {
      const r = el.getBoundingClientRect();
      return { w: Math.round(r.width), h: Math.round(r.height) };
    }));
    expect(rects.length, "at least one implementation link").toBeGreaterThan(0);
    for (const r of rects) {
      expect(r.h, `link height ${r.h}px meets 44px`).toBeGreaterThanOrEqual(44);
      expect(r.w, `link width ${r.w}px meets 44px`).toBeGreaterThanOrEqual(44);
    }
  });

  test("course count label agrees in number (kurssi vs kurssia)", () => {
    // Grammar helper is inline in the template because no shared pluralize
    // utility exists in the repo. This spec pins BOTH branches so a future
    // catalog with 1 course still reads correctly.
    const landing = fs.readFileSync(LANDING_PATH, "utf8");
    expect(landing).toContain("== 1 %}kurssi{% else %}kurssia{% endif %}");
  });

  test("stale one-implementation copy is removed and replaced with evergreen wording", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, "stale hardcoded count claim").not.toContain("Tällä hetkellä julkinen kurssisivu on avattu vain");
    expect(html, "evergreen pointer to esitykset").toContain("esitysten kokoelmasta");
  });

  test("implementation ordering follows coursePages.catalog projection deterministically", async ({ page }) => {
    // OPETUS-CATALOG-UX-01B: courses may appear in the current section
    // or the historical section depending on whether they have a live
    // Peppi URL. Within each course card, implementations still sort
    // newest-first as per coursePages.js.
    const html = await page.request.get(OPETUS).then((r) => r.text());
    const currentHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="current"[\s\S]*?<\/section>/)[0];
    const historicalHtml = html.match(/<div class="vstack gap-3" data-opetus-catalog="historical"[\s\S]*?<\/section>/)[0];
    const combined = currentHtml + historicalHtml;
    for (const course of coursePages.catalog) {
      const courseBlock = combined.match(new RegExp(`data-course-id="${course.courseId}"[\\s\\S]*?</article>`))[0];
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

const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");

const ROOT = path.resolve(__dirname, "..");
const COURSE = "/opetus/tieto-ja-viestintatekniikka-pedagogisena-tyovalineena/2013-2014-a/";
const TARGETS = [
  "ss-luento1-johdanto-410014y-tvt-pedagogiset-perusteet.md",
  "ss-luento-2-teoria-410014y-tieto-ja-viestintatekniikka-pedagogisena-valineena.md",
  "ss-luento-3-suunnittelu-ja-pedagogiset-mallit-410014y-tieto-ja-viestintatekniikka-p.md",
  "ss-luento-5-haasteet-ja-koulun-todellisuus-410014y.md"
];

test.describe("OPETUS-CURATION-01B2 verified 410014Y implementation", () => {
  test("only the confirmed four records carry the opaque implementation ID", () => {
    const files = fs.readdirSync(path.join(ROOT, "src", "presentations"));
    const matched = files.filter((file) => fs.readFileSync(path.join(ROOT, "src", "presentations", file), "utf8").includes('periodId: "2013-2014-a"'));
    expect(matched.sort()).toEqual(TARGETS.slice().sort());
    for (const file of TARGETS) {
      const source = fs.readFileSync(path.join(ROOT, "src", "presentations", file), "utf8");
      expect(source).toContain("courseId: 410014Y");
      expect(source).not.toMatch(/sessionIndex|sequence/i);
    }
  });

  test("course page, catalog, and exact backlinks are SSR", async ({ page }) => {
    const course = await page.request.get(COURSE);
    expect(course.status()).toBe(200);
    const courseHtml = await course.text();
    expect(courseHtml).toContain("410014Y");
    expect(courseHtml).toContain("2013–2014");
    expect(courseHtml).toContain("Syksy 2013");

    const catalogHtml = await page.request.get("/opetus/").then((r) => r.text());
    expect(catalogHtml).toContain('data-course-id="410014Y"');
    expect(catalogHtml).toContain(`href="${COURSE}"`);

    for (const file of TARGETS) {
      const slug = file.replace(/^ss-/, "").replace(/\.md$/, "");
      const presentation = await page.request.get(`/presentations/ss-${slug}/`);
      const html = await presentation.text();
      expect(html).toContain('class="content-detail-course-implementation"');
      expect(html).toContain(`href="${COURSE}"`);
      expect((html.match(/course-peer-item/g) || []).length).toBe(3);
    }
  });
});

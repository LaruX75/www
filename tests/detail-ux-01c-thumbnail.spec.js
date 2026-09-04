const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * DETAIL-UX-01C — Presentation thumbnail regression fix.
 *
 * Reporter case: /presentations/kempele-veso-2026/ rendered a broken
 * design.canva.ai URL in the detail hero while the archive /esitykset/
 * card rendered a working local /images/canva-thumbnails/*.png for the
 * same content. Root cause: buildCanonicalPresentationPageRecords
 * preferred the frontmatter thumbnail over the canonical Canva
 * projection, and the detail page consumed the frontmatter value
 * directly.
 *
 * Fix: canonical projection now prefers a local /images/… thumbnail
 * when one is available; detail page routes thumbnail through the
 * projection.
 *
 * Guards:
 *   1. Kempele VESO (reporter case) renders local thumbnail
 *   2. Other affected presentations with local canonical thumbnails render local
 *   3. Presentations WITHOUT canonical mapping keep frontmatter fallback
 *      (no false success claim; documents the data-curation follow-up)
 *   4. Non-Canva presentations (SlideShare, YouTube) unchanged
 *   5. Presentations without any frontmatter thumbnail keep single-column hero
 *   6. Archive /esitykset/ still uses local thumbnails (regression guard)
 */

const KEMPELE_URL = "/presentations/kempele-veso-2026/";
const KEMPELE_LOCAL_THUMB = "/images/canva-thumbnails/veso-2026-tekoaly-opetuksessa.png";

const FIXED_SAMPLES = [
  { url: "/presentations/kempele-veso-2026/", localThumb: "/images/canva-thumbnails/veso-2026-tekoaly-opetuksessa.png" },
  { url: "/presentations/kohti-kriittist-teko-lylukutaitoa-2026-finnoschool/", localThumb: "/images/canva-thumbnails/riko-rakenna-ja-ymmarra-kohti-kriittista-tekoalylukutaitoa.png" },
  { url: "/presentations/riihim-ki-veso-2026/", localThumb: "/images/canva-thumbnails/ihmeita-tekeva-tekoaly-vai-tavallinen-tyokalu-veso-2026.png" }
];

test.describe("Kempele VESO — reporter case", () => {
  test("renders local canonical thumbnail in hero (not design.canva.ai)", async ({ page }) => {
    const html = await page.request.get(KEMPELE_URL).then((r) => r.text());
    expect(html, "hero uses local thumbnail").toContain(KEMPELE_LOCAL_THUMB);
    // Old broken URL must not appear as the actual detail thumbnail src.
    // (May legitimately appear inside inline JSON-LD or comments — we
    //  assert only that the visible hero <img> uses the local path.)
    const heroImgMatch = html.match(/<aside class="content-detail-visual"[\s\S]*?<img[^>]*src="([^"]+)"/);
    expect(heroImgMatch, "hero aside <img> found").not.toBeNull();
    expect(heroImgMatch[1], "hero <img> src is the local canonical asset").toContain("/images/canva-thumbnails/");
    expect(heroImgMatch[1], "hero <img> is not the stale Canva CDN URL").not.toContain("design.canva.ai");
  });
});

test.describe("Other affected presentations with canonical mapping", () => {
  for (const sample of FIXED_SAMPLES) {
    test(`${sample.url} renders local canonical thumbnail`, async ({ page }) => {
      const html = await page.request.get(sample.url).then((r) => r.text());
      expect(html, `contains ${sample.localThumb}`).toContain(sample.localThumb);
    });
  }
});

test.describe("Presentations without canonical mapping — documented follow-up", () => {
  // These 3 have `null` in data/canva/content-slug-to-designid.json
  // (no confident Canva design ID). Fix cannot help them; needs data
  // curation. Test locks the current state so a future data-curation
  // slice can flip these to FIXED cleanly.
  const NULL_MAPPING = [
    "/presentations/generation-ai-yleisesitys-sovellukset-2026/",
    "/presentations/luento-4-ohjelmointiosaaminen/",
    "/presentations/luento-1-johdanto/"
  ];
  for (const url of NULL_MAPPING) {
    test(`${url} still renders SOME thumbnail (frontmatter fallback)`, async ({ page }) => {
      const html = await page.request.get(url).then((r) => r.text());
      const heroImgMatch = html.match(/<aside class="content-detail-visual"[\s\S]*?<img[^>]*src="([^"]+)"/);
      expect(heroImgMatch, "hero aside <img> exists").not.toBeNull();
      expect(heroImgMatch[1].length, "src not empty").toBeGreaterThan(0);
    });
  }
});

test.describe("Non-Canva presentations (SlideShare) unchanged", () => {
  test("SlideShare thumbnail preserved on detail page", async ({ page }) => {
    const html = await page.request.get("/presentations/ss-410014y-luento-2-taman-vuosisadan-ydintaidot-21th-skills-ja-koulun-muutospaineet/").then((r) => r.text());
    expect(html, "SlideShare CDN thumbnail preserved").toMatch(/cdn\.slidesharecdn\.com/);
  });
});

test.describe("Presentation without any thumbnail — hero fallback", () => {
  test("no aside markup, single-column hero fallback preserved", async ({ page }) => {
    const html = await page.request.get("/presentations/405040y-luento-1-johdanto-2026-a/").then((r) => r.text());
    expect(html, "no aside").not.toContain("content-detail-visual");
    expect(html, "single-column hero grid class").toContain("content-detail-hero-grid--single");
  });
});

test.describe("Archive /esitykset/ regression guard", () => {
  test("archive cards still use local /images/canva-thumbnails/", async ({ page }) => {
    const html = await page.request.get("/esitykset/").then((r) => r.text());
    const localCount = (html.match(/\/images\/canva-thumbnails\//g) || []).length;
    expect(localCount, "archive renders many local canva-thumbnail images").toBeGreaterThan(20);
  });
});

test.describe("No runtime Canva fetch — SSR only", () => {
  test("Kempele detail page makes zero requests to canva domains at runtime", async ({ page }) => {
    const canvaRequests = [];
    page.on("request", (req) => {
      const url = req.url();
      if (/canva\.(com|ai)/.test(url)) canvaRequests.push(url);
    });
    await page.goto(KEMPELE_URL, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    expect(canvaRequests, `no runtime Canva requests expected: ${JSON.stringify(canvaRequests)}`).toEqual([]);
  });
});

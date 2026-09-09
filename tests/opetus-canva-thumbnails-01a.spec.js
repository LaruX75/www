const { test, expect } = require("@playwright/test");

/*
 * OPETUS-CANVA-THUMBNAILS-01A — 405040Y course pages surface canonical
 * Canva cover previews grouped with the lecture title (Aihe cell) for
 * each lecture that has a canonical Presentation with a local thumbnail.
 * The Material column remains action-oriented (text links only).
 *
 * Guards:
 *   1. All eight canonical Presentation records resolve /images/canva-thumbnails/*.png
 *   2. Autumn 2026-A course page renders four previews (lectures 1-4) in the Aihe cell
 *   3. Spring 2026-B course page renders four previews (lectures 1-4) in the Aihe cell
 *   4. Every preview links to the canonical Presentation pageUrl (never direct to Canva)
 *   5. Material cell contains the "Avaa esitys" text link but NOT the preview image
 *   6. Kopiosto rows have no fabricated preview thumbnail
 *   7. SSR-only: previews present when JavaScript is disabled
 *   8. No horizontal overflow at 320px or 390px viewports
 *   9. Canva source URLs are NOT reintroduced on course pages
 */

const COURSE_URLS = {
  autumn: "/opetus/teknologiatuettu-oppiminen/2026-2027-a/",
  spring: "/opetus/teknologiatuettu-oppiminen/2025-2026-b/"
};

const AUTUMN_LECTURES = [
  { number: 1, landing: "/presentations/405040y-luento-1-johdanto-2026-a/", thumbnail: "/images/canva-thumbnails/405040y-luento-1-johdanto-2026-a.png" },
  { number: 2, landing: "/presentations/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a/", thumbnail: "/images/canva-thumbnails/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.png" },
  { number: 3, landing: "/presentations/405040y-luento-3-tekoalylukutaito-2026-a/", thumbnail: "/images/canva-thumbnails/405040y-luento-3-tekoalylukutaito-2026-a.png" },
  { number: 4, landing: "/presentations/405040y-luento-4-media-ja-informaatiolukutaito-2026-a/", thumbnail: "/images/canva-thumbnails/405040y-luento-4-media-ja-informaatiolukutaito-2026-a.png" }
];

const SPRING_LECTURES = [
  { number: 1, landing: "/presentations/405040y-luento-1-johdanto-2026-b/", thumbnail: "/images/canva-thumbnails/405040y-luento-1-johdanto-2026-b.png" },
  { number: 2, landing: "/presentations/405040y-luento-2-digitaalinen-osaaminen-2026-b/", thumbnail: "/images/canva-thumbnails/405040y-luento-2-digitaalinen-osaaminen-2026-b.png" },
  { number: 3, landing: "/presentations/405040y-luento-3-ohjelmointiosaaminen-2026-b/", thumbnail: "/images/canva-thumbnails/405040y-luento-3-ohjelmointiosaaminen-2026-b.png" },
  { number: 4, landing: "/presentations/405040y-luento-4-medialukutaito-2026-b/", thumbnail: "/images/canva-thumbnails/405040y-luento-4-medialukutaito-2026-b.png" }
];

const AUTUMN_CANVA_SHORTCUTS = [
  "https://canva.link/rd3kruke4i7fzns",
  "https://canva.link/vmsct2fivgoxykk",
  "https://canva.link/666rwb1kr9owlhh",
  "https://canva.link/yrtz7vbd2ofhlwk"
];

const SPRING_CANVA_SHORTCUTS = [
  "https://canva.link/plg8i1sco89t66w",
  "https://canva.link/gotmw1ihohslnb8",
  "https://canva.link/6p8ra9g7z216azi",
  "https://canva.link/wn36nr8vfdyyqxs"
];

test.describe("Canonical thumbnail projection (all 8 records)", () => {
  const ALL = [...AUTUMN_LECTURES, ...SPRING_LECTURES];

  for (const lecture of ALL) {
    test(`canonical Presentation ${lecture.landing} resolves local thumbnail`, async ({ page }) => {
      const html = await page.request.get(lecture.landing).then((r) => r.text());
      expect(html, `${lecture.landing} must reference local ${lecture.thumbnail}`).toContain(lecture.thumbnail);
    });

    test(`thumbnail asset ${lecture.thumbnail} exists (200 image/*)`, async ({ page }) => {
      const res = await page.request.get(lecture.thumbnail);
      expect(res.ok(), `${lecture.thumbnail} must return 200`).toBeTruthy();
      const contentType = res.headers()["content-type"] || "";
      expect(contentType, `${lecture.thumbnail} must be an image`).toMatch(/^image\//);
    });
  }
});

test.describe("2026-A course page previews", () => {
  test("autumn course page renders exactly 4 lecture-preview thumbnails", async ({ page }) => {
    await page.goto(COURSE_URLS.autumn);
    const previews = page.locator(".course-lecture-preview");
    await expect(previews, "4 lecture previews expected").toHaveCount(4);
  });

  for (const lecture of AUTUMN_LECTURES) {
    test(`autumn lecture ${lecture.number} preview links to canonical landing`, async ({ page }) => {
      await page.goto(COURSE_URLS.autumn);
      const row = page.locator(`[data-course-lecture][data-lecture-number="${lecture.number}"]`);
      const previewLink = row.locator(`.course-lecture-topic a.course-lecture-preview-link[href="${lecture.landing}"]`);
      await expect(previewLink, `preview link to ${lecture.landing} inside title cell`).toHaveCount(1);
      const img = previewLink.locator("img.course-lecture-preview");
      await expect(img).toHaveAttribute("src", lecture.thumbnail);
      await expect(img).toHaveAttribute("loading", "lazy");
      await expect(img).toHaveAttribute("decoding", "async");
      await expect(img).toHaveAttribute("alt", "");
    });

    test(`autumn lecture ${lecture.number} retains separate "Avaa esitys" text link`, async ({ page }) => {
      await page.goto(COURSE_URLS.autumn);
      const row = page.locator(`[data-course-lecture][data-lecture-number="${lecture.number}"]`);
      const textLink = row.locator(`a.text-decoration-none.fw-semibold[href="${lecture.landing}"]`, { hasText: /Avaa esitys/ });
      await expect(textLink).toHaveCount(1);
    });
  }

  test("autumn course page does NOT reintroduce direct Canva shortcuts", async ({ page }) => {
    const html = await page.request.get(COURSE_URLS.autumn).then((r) => r.text());
    for (const shortcut of AUTUMN_CANVA_SHORTCUTS) {
      expect(html, `must not link to ${shortcut}`).not.toContain(shortcut);
    }
  });
});

test.describe("2026-B course page previews", () => {
  test("spring course page renders exactly 4 lecture-preview thumbnails", async ({ page }) => {
    await page.goto(COURSE_URLS.spring);
    const previews = page.locator(".course-lecture-preview");
    await expect(previews, "4 lecture previews expected").toHaveCount(4);
  });

  for (const lecture of SPRING_LECTURES) {
    test(`spring lecture ${lecture.number} preview links to canonical landing`, async ({ page }) => {
      await page.goto(COURSE_URLS.spring);
      const row = page.locator(`[data-course-lecture][data-lecture-number="${lecture.number}"]`);
      const previewLink = row.locator(`.course-lecture-topic a.course-lecture-preview-link[href="${lecture.landing}"]`);
      await expect(previewLink, `preview link to ${lecture.landing} inside title cell`).toHaveCount(1);
      const img = previewLink.locator("img.course-lecture-preview");
      await expect(img).toHaveAttribute("src", lecture.thumbnail);
      await expect(img).toHaveAttribute("loading", "lazy");
      await expect(img).toHaveAttribute("decoding", "async");
      await expect(img).toHaveAttribute("alt", "");
    });

    test(`spring lecture ${lecture.number} retains separate "Avaa esitys" text link`, async ({ page }) => {
      await page.goto(COURSE_URLS.spring);
      const row = page.locator(`[data-course-lecture][data-lecture-number="${lecture.number}"]`);
      const textLink = row.locator(`a.text-decoration-none.fw-semibold[href="${lecture.landing}"]`, { hasText: /Avaa esitys/ });
      await expect(textLink).toHaveCount(1);
    });
  }

  test("spring course page does NOT reintroduce direct Canva shortcuts", async ({ page }) => {
    const html = await page.request.get(COURSE_URLS.spring).then((r) => r.text());
    for (const shortcut of SPRING_CANVA_SHORTCUTS) {
      expect(html, `must not link to ${shortcut}`).not.toContain(shortcut);
    }
  });
});

test.describe("Material column stays action-oriented (no preview image)", () => {
  for (const [label, url, lectures] of [
    ["autumn", COURSE_URLS.autumn, AUTUMN_LECTURES],
    ["spring", COURSE_URLS.spring, SPRING_LECTURES]
  ]) {
    for (const lecture of lectures) {
      test(`${label} lecture ${lecture.number} Material cell has no preview image`, async ({ page }) => {
        await page.goto(url);
        const row = page.locator(`[data-course-lecture][data-lecture-number="${lecture.number}"]`);
        // Row-level: the "Avaa esitys" link exists (in Material cell).
        const openLink = row.locator(`a[href="${lecture.landing}"]`, { hasText: /Avaa esitys/ });
        await expect(openLink).toHaveCount(1);
        // The Material cell containing "Avaa esitys" MUST NOT contain a
        // preview thumbnail. Locate that specific <td> and assert.
        const materialCell = row.locator("td", { hasText: "Avaa esitys" });
        await expect(materialCell.locator("img.course-lecture-preview")).toHaveCount(0);
      });
    }
  }
});

test.describe("Kopiosto rows carry no fabricated preview", () => {
  test("autumn lecture 5 (Kopiosto) has no lecture-preview thumbnail", async ({ page }) => {
    await page.goto(COURSE_URLS.autumn);
    const row = page.locator('[data-course-lecture][data-lecture-number="5"]');
    await expect(row.locator(".course-lecture-preview")).toHaveCount(0);
  });

  test("spring lecture 5 (Kopiosto) has no lecture-preview thumbnail", async ({ page }) => {
    await page.goto(COURSE_URLS.spring);
    const row = page.locator('[data-course-lecture][data-lecture-number="5"]');
    await expect(row.locator(".course-lecture-preview")).toHaveCount(0);
  });
});

test.describe("SSR-only rendering (JS disabled)", () => {
  test("autumn previews render with JavaScript disabled", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(COURSE_URLS.autumn);
    const previews = await page.locator(".course-lecture-preview").count();
    expect(previews, "4 SSR previews present without JS").toBe(4);
    await ctx.close();
  });

  test("spring previews render with JavaScript disabled", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(COURSE_URLS.spring);
    const previews = await page.locator(".course-lecture-preview").count();
    expect(previews, "4 SSR previews present without JS").toBe(4);
    await ctx.close();
  });
});

test.describe("Mobile viewport — no horizontal overflow with previews", () => {
  for (const url of Object.values(COURSE_URLS)) {
    for (const width of [320, 390]) {
      test(`${url} @ ${width}px: document width does not exceed viewport`, async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width, height: 800 } });
        const page = await ctx.newPage();
        await page.goto(url);
        const docWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(docWidth, `${url} @ ${width}px must not overflow viewport horizontally`).toBeLessThanOrEqual(width);
        await ctx.close();
      });
    }
  }
});

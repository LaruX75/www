const { test, expect } = require("@playwright/test");

/*
 * OPETUS-CANVA-THUMBNAILS-01A — 405040Y course pages present each lecture
 * row in five semantic columns:
 *
 *   1. sequence number
 *   2. Aikataulu ja paikka  (date / time / "Luento X" / optional
 *                            externalSpeaker / room LAST)
 *   3. Aihe                 (title only)
 *   4. Esikatselu           (canonical Canva thumbnail only, empty for
 *                            Kopiosto)
 *   5. Materiaali           (Avaa esitys, Panopto, other material actions
 *                            — no preview image)
 *
 * Guards:
 *   1. All eight canonical Presentation records resolve /images/canva-thumbnails/*.png
 *   2. Autumn 2026-A course page renders four previews (lectures 1-4) in the Esikatselu cell
 *   3. Spring 2026-B course page renders four previews (lectures 1-4) in the Esikatselu cell
 *   4. Every preview links to the canonical Presentation pageUrl (never direct to Canva)
 *   5. Title cell contains only the title, no preview image
 *   6. Material cell contains the "Avaa esitys" text link but no preview image
 *   7. Schedule cell groups date + time + "Luento X" + room, room LAST
 *   8. Kopiosto rows have no fabricated preview thumbnail
 *   9. SSR-only: previews present when JavaScript is disabled
 *  10. No horizontal overflow at 320px or 390px viewports
 *  11. Canva source URLs are NOT reintroduced on course pages
 */

const COURSE_URLS = {
  autumn: "/opetus/teknologiatuettu-oppiminen/2026-2027-a/",
  spring: "/opetus/teknologiatuettu-oppiminen/2025-2026-b/"
};

const AUTUMN_LECTURES = [
  { number: 1, landing: "/presentations/405040y-luento-1-johdanto-2026-a/", thumbnail: "/images/canva-thumbnails/405040y-luento-1-johdanto-2026-a.png", title: "Johdanto", room: "L2 Martti Ahtisaari" },
  { number: 2, landing: "/presentations/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a/", thumbnail: "/images/canva-thumbnails/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.png", title: "Digitaalinen osaaminen vuonna 2026 – DigComp 3.0", room: "L2 Martti Ahtisaari" },
  { number: 3, landing: "/presentations/405040y-luento-3-tekoalylukutaito-2026-a/", thumbnail: "/images/canva-thumbnails/405040y-luento-3-tekoalylukutaito-2026-a.png", title: "Tekoälylukutaito", room: "L2 Martti Ahtisaari" },
  { number: 4, landing: "/presentations/405040y-luento-4-media-ja-informaatiolukutaito-2026-a/", thumbnail: "/images/canva-thumbnails/405040y-luento-4-media-ja-informaatiolukutaito-2026-a.png", title: "Media- ja informaatiolukutaito tekoälyn aikakaudella", room: "L2 Martti Ahtisaari" }
];

const SPRING_LECTURES = [
  { number: 1, landing: "/presentations/405040y-luento-1-johdanto-2026-b/", thumbnail: "/images/canva-thumbnails/405040y-luento-1-johdanto-2026-b.png", title: "Johdanto", room: "L2 Martti Ahtisaari -sali" },
  { number: 2, landing: "/presentations/405040y-luento-2-digitaalinen-osaaminen-2026-b/", thumbnail: "/images/canva-thumbnails/405040y-luento-2-digitaalinen-osaaminen-2026-b.png", title: "Digitaalinen osaaminen", room: "L10 OP-sali" },
  { number: 3, landing: "/presentations/405040y-luento-3-ohjelmointiosaaminen-2026-b/", thumbnail: "/images/canva-thumbnails/405040y-luento-3-ohjelmointiosaaminen-2026-b.png", title: "Ohjelmointiosaaminen", room: "TA105 Arina-sali" },
  { number: 4, landing: "/presentations/405040y-luento-4-medialukutaito-2026-b/", thumbnail: "/images/canva-thumbnails/405040y-luento-4-medialukutaito-2026-b.png", title: "Medialukutaito", room: "TA105 Arina-sali" }
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
    test(`autumn lecture ${lecture.number} preview lives in Esikatselu cell + links to canonical landing`, async ({ page }) => {
      await page.goto(COURSE_URLS.autumn);
      const row = page.locator(`[data-course-lecture][data-lecture-number="${lecture.number}"]`);
      const previewLink = row.locator(`.course-lecture-thumbnail-cell a.course-lecture-preview-link[href="${lecture.landing}"]`);
      await expect(previewLink, `preview link to ${lecture.landing} inside Esikatselu cell`).toHaveCount(1);
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
    test(`spring lecture ${lecture.number} preview lives in Esikatselu cell + links to canonical landing`, async ({ page }) => {
      await page.goto(COURSE_URLS.spring);
      const row = page.locator(`[data-course-lecture][data-lecture-number="${lecture.number}"]`);
      const previewLink = row.locator(`.course-lecture-thumbnail-cell a.course-lecture-preview-link[href="${lecture.landing}"]`);
      await expect(previewLink, `preview link to ${lecture.landing} inside Esikatselu cell`).toHaveCount(1);
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

test.describe("Title column carries only the title (no preview image)", () => {
  for (const [label, url, lectures] of [
    ["autumn", COURSE_URLS.autumn, AUTUMN_LECTURES],
    ["spring", COURSE_URLS.spring, SPRING_LECTURES]
  ]) {
    for (const lecture of lectures) {
      test(`${label} lecture ${lecture.number} Aihe cell has title but no preview img`, async ({ page }) => {
        await page.goto(url);
        const row = page.locator(`[data-course-lecture][data-lecture-number="${lecture.number}"]`);
        const titleCell = row.locator("td.course-lecture-title-cell");
        await expect(titleCell).toHaveCount(1);
        await expect(titleCell).toContainText(lecture.title);
        await expect(titleCell.locator("img.course-lecture-preview")).toHaveCount(0);
        await expect(titleCell.locator("a.course-lecture-preview-link")).toHaveCount(0);
      });
    }
  }
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
        const openLink = row.locator(`a[href="${lecture.landing}"]`, { hasText: /Avaa esitys/ });
        await expect(openLink).toHaveCount(1);
        const materialCell = row.locator("td.course-lecture-material-cell");
        await expect(materialCell).toHaveCount(1);
        await expect(materialCell.locator("img.course-lecture-preview")).toHaveCount(0);
      });
    }
  }
});

test.describe("Schedule column groups date/time/session/room with room LAST", () => {
  for (const [label, url, lectures] of [
    ["autumn", COURSE_URLS.autumn, AUTUMN_LECTURES],
    ["spring", COURSE_URLS.spring, SPRING_LECTURES]
  ]) {
    for (const lecture of lectures) {
      test(`${label} lecture ${lecture.number} schedule cell contains date+time+"Luento X"+room, room last`, async ({ page }) => {
        const html = await page.request.get(url).then((r) => r.text());
        // Extract the specific row's HTML
        const rowRe = new RegExp(`<tr[^>]*data-lecture-number="${lecture.number}"[\\s\\S]*?</tr>`, "i");
        const rowMatch = html.match(rowRe);
        expect(rowMatch, `row for lecture ${lecture.number}`).not.toBeNull();
        const rowHtml = rowMatch[0];
        // Locate the schedule cell and extract its inner HTML
        const scheduleRe = /<td[^>]*course-lecture-schedule[^>]*>([\s\S]*?)<\/td>/i;
        const scheduleMatch = rowHtml.match(scheduleRe);
        expect(scheduleMatch, "course-lecture-schedule cell present").not.toBeNull();
        const scheduleHtml = scheduleMatch[1];
        // Time
        expect(scheduleHtml, "time present in schedule cell").toContain(">");
        // "Luento X" ordinal
        expect(scheduleHtml, `"Luento ${lecture.number}" text present`).toMatch(new RegExp(`Luento\\s+${lecture.number}\\b`));
        // Room present
        const roomEscape = lecture.room.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        expect(scheduleHtml, `room "${lecture.room}" present`).toMatch(new RegExp(roomEscape));
        // Room must be LAST — no non-whitespace text after room string in the cell body
        const roomIdx = scheduleHtml.lastIndexOf(lecture.room);
        const trailing = scheduleHtml.slice(roomIdx + lecture.room.length).replace(/<[^>]*>/g, "").replace(/\s+/g, "");
        expect(trailing, `no text after room in schedule cell (got "${trailing}")`).toBe("");
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

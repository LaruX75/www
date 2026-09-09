const { test, expect } = require("@playwright/test");

const COURSE_URL = "/opetus/teknologiatuettu-oppiminen/2025-2026-b/";
const LANDINGS = [
  "/presentations/405040y-luento-1-johdanto-2026-b/",
  "/presentations/405040y-luento-2-digitaalinen-osaaminen-2026-b/",
  "/presentations/405040y-luento-3-ohjelmointiosaaminen-2026-b/",
  "/presentations/405040y-luento-4-medialukutaito-2026-b/"
];
const SOURCES = [
  "https://canva.link/plg8i1sco89t66w",
  "https://canva.link/gotmw1ihohslnb8",
  "https://canva.link/6p8ra9g7z216azi",
  "https://canva.link/wn36nr8vfdyyqxs"
];

test.describe("405040Y spring 2026 canonical Presentation integration", () => {
  test("course page routes lectures 1-4 through canonical detail pages", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    for (const landing of LANDINGS) {
      expect(html, `course page must link ${landing}`).toContain(landing);
    }
    for (const source of SOURCES) {
      expect(html, `course page must not shortcut to ${source}`).not.toContain(source);
    }
  });

  test("all four canonical detail pages resolve and retain their Canva source", async ({ page }) => {
    for (let i = 0; i < LANDINGS.length; i += 1) {
      const response = await page.request.get(LANDINGS[i]);
      expect(response.ok(), `${LANDINGS[i]} must return 200`).toBeTruthy();
      const html = await response.text();
      expect(html, `${LANDINGS[i]} must retain canonical source ${SOURCES[i]}`).toContain(SOURCES[i]);
    }
  });

  test("Kopiosto lecture 5 remains external and non-canonical", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    expect(html).toContain("Kopiosto");
    expect(html).toContain("unioulu-my.sharepoint.com");
    const probe = await page.request.get("/presentations/405040y-luento-5-tekijanoikeudet-2026-b/");
    expect(probe.ok(), "external Kopiosto lecture must not gain a canonical Presentation detail").toBeFalsy();
  });
});

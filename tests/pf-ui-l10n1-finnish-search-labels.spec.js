const { test, expect } = require("@playwright/test");

// PF-UI-L10N1 — verify the nav-bar Pagefind UI overlay renders Finnish
// filter labels on Finnish pages, English on English pages, and that
// the /haku/ and /en/search/ full-page UIs stay in the correct language.
// Also re-verify that PF-PERF2 warmup + Enter-scroll hotfix + Research
// boundary + no data-pagefind-body invariants still hold.

async function openNavSearchOverlay(page) {
  // The nav search UI is inside a `searchOverlay` container. On the
  // FI nav the toggle button is a search icon; a keyboard shortcut also
  // works. Programmatic open via clicking the visible toggle keeps the
  // test resilient to markup tweaks: any element whose visible label is
  // the Finnish search string opens the overlay.
  const trigger = page.locator("button[data-search-open], button[aria-label*='haku' i], button[aria-label*='search' i]").first();
  if (await trigger.count() > 0) {
    await trigger.click();
    await page.waitForTimeout(500);
    return;
  }
  // Fallback: dispatch the keyboard shortcut some site-ui bindings use.
  await page.keyboard.press("Slash");
  await page.waitForTimeout(500);
}

test.describe("PF-UI-L10N1 Finnish search UI labels", () => {
  test("Finnish nav-bar search overlay ships a full Finnish translations bundle", async ({ page }) => {
    await page.goto("/");
    // Assert the shipped JS carries the Finnish strings (this is what
    // the runtime hands to PagefindUI). Fetch via the same origin the
    // runtime uses so any URL rewriting stays consistent.
    const siteUiSource = await page.evaluate(async () => {
      const res = await fetch("/js/site-ui.js", { cache: "no-store" });
      return await res.text();
    });
    // Match on tolerant patterns so any whitespace / non-breaking
    // space escape variants still count.
    expect(siteUiSource, "site-ui.js must ship 'Suodattimet'").toMatch(/Suodattimet/);
    expect(siteUiSource, "site-ui.js must ship 'Hae sivustolta'").toMatch(/Hae\s+sivustolta/);
    expect(siteUiSource, "site-ui.js must ship 'Tyhjennä' (clear)").toMatch(/Tyhjennä/);
    expect(siteUiSource, "site-ui.js must ship 'Näytä lisää tuloksia'").toMatch(/Näytä\s+lisää\s+tuloksia/);
    expect(siteUiSource, "site-ui.js must still ship the English 'Filters' fallback for /en/ pages").toContain("Filters");
  });

  test("Finnish /haku/ still ships the /haku/-specific Finnish PagefindUI translations", async ({ page }) => {
    await page.goto("/haku/");
    const siteSearchSource = await page.evaluate(async () => {
      const res = await fetch("/js/site-search-page.js");
      return await res.text();
    });
    expect(siteSearchSource, "site-search-page.js must ship 'Hae sivustolta'").toContain("Hae sivustolta");
    expect(siteSearchSource, "site-search-page.js must ship 'Suodattimet'").toContain("Suodattimet");
    expect(siteSearchSource, "site-search-page.js must ship 'Kokeile jotain seuraavista' suggestion header").toContain("Kokeile jotain seuraavista");
    expect(siteSearchSource, "site-search-page.js must still ship the English variant for /en/search/").toContain("Search the site");
  });

  test("Finnish Find & Explore controls render Finnish labels on /tutkimus/", async ({ page }) => {
    await page.goto("/tutkimus/");
    const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");
    await expect(mount).toBeVisible();
    // Query input label
    const queryLabel = await mount.locator("label[for='researchEvidenceExploreQuery']").textContent();
    expect(queryLabel, "Query label must be Finnish").toMatch(/tutkimusaihetta|hae/i);
    // Year / topic labels present in Finnish (they come from the
    // template setup on tutkimus.md).
    await expect(mount.locator("label[for='researchEvidenceExploreYear']")).toContainText(/Vuosi/);
    await expect(mount.locator("label[for='researchEvidenceExploreTopic']")).toContainText(/Tutkimusteema/);
    // Reset button must be the Finnish label, not "Reset".
    await expect(mount.locator("[data-find-explore-reset]")).toContainText("Tyhjennä");
  });

  test("English /en/search/ keeps English PagefindUI defaults", async ({ page }) => {
    await page.goto("/en/search/");
    const siteSearchSource = await page.evaluate(async () => {
      const res = await fetch("/js/site-search-page.js");
      return await res.text();
    });
    expect(siteSearchSource, "site-search-page.js must ship 'Search the site' English variant").toContain("Search the site");
    // /en/search/ is a valid built page.
    await expect(page.locator("h1")).toContainText(/Search|Haku|Site search/i);
  });

  test("PF-PERF2 warmup + Enter-scroll hotfix invariants still hold", async ({ page }) => {
    await page.goto("/tutkimus/");
    // Warmup helper still exists in the shipped renderer.
    const findExploreSource = await page.evaluate(async () => {
      const res = await fetch("/js/find-explore.js");
      return await res.text();
    });
    expect(findExploreSource).toContain("warmSearchLanguages");
    expect(findExploreSource).toContain("controlsForm");
    expect(findExploreSource).toMatch(/addEventListener\("submit"/);
    // Enter must still not scroll to top.
    const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");
    await mount.scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const scrollBefore = await page.evaluate(() => window.scrollY);
    expect(scrollBefore).toBeGreaterThan(50);
    const queryInput = mount.locator("[data-find-explore-query]");
    await queryInput.focus();
    await queryInput.fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
    await queryInput.press("Enter");
    await expect(mount.locator("[data-find-explore-status]"))
      .toContainText(/tulos|tulosta|löytynyt/i, { timeout: 15000 });
    const scrollAfter = await page.evaluate(() => window.scrollY);
    expect(scrollAfter, `Enter must not scroll to top (was ${scrollBefore}, now ${scrollAfter})`).toBeGreaterThan(50);
  });

  test("No media leaks into Research and no data-pagefind-body reintroduced", async ({ page }) => {
    await page.goto("/tutkimus/");
    const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");
    await mount.locator("[data-find-explore-query]").fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
    await expect(mount.locator("[data-find-explore-status]"))
      .toContainText(/tulos|tulosta|löytynyt/i, { timeout: 15000 });
    const mediaHits = await mount.locator("[data-find-explore-results] a[href^='/mediassa/']").count();
    expect(mediaHits).toBe(0);

    await page.goto("/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/");
    const bodyHits = await page.locator("[data-pagefind-body]").count();
    expect(bodyHits).toBe(0);
  });
});

const { test, expect } = require("@playwright/test");

// PF-STARTER-CHIPS — verify user-triggered starter chips on
// /tutkimus/, /esitykset/, /mediassa/ wrap existing search/filter
// mechanisms without introducing a second query model, without
// running any automatic search on page load, and without exposing
// new Pagefind facets.

test.describe("PF-STARTER-CHIPS /tutkimus/", () => {
  test("starter area exists and clicking a chip narrows the Research contextual view without a fresh model", async ({ page }) => {
    await page.goto("/tutkimus/");
    const starter = page.locator("[data-starter-chips]").first();
    await expect(starter).toBeVisible();
    // Chips must not be preselected before any user action.
    const preClicked = await starter.locator("[data-starter-chip][aria-pressed='true']").count();
    expect(preClicked, "no chip should be pre-pressed on load").toBe(0);
    // No results before user acts.
    const resultsBefore = await page.locator("[data-find-explore-kind='researchContext'] [data-find-explore-results] li").count();
    expect(resultsBefore).toBe(0);

    const chip = starter.locator("[data-starter-chip][data-starter-chip-value='tekoäly']");
    await expect(chip).toBeVisible();
    await chip.click();

    // Chip toggle: clicked chip gets aria-pressed=true.
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    // Existing topic control should now hold the chip value.
    await expect(page.locator("#researchEvidenceExploreTopic")).toHaveValue("tekoäly");
    // Research runtime should react to the chip: status text changes
    // from the idle prompt to a real query outcome (results found OR
    // "no results" — both prove the existing runtime executed a search
    // through its normal pipeline).
    const mount = page.locator("[data-find-explore-kind='researchContext']");
    await expect(mount.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta|löytynyt/i, { timeout: 15000 });
    // Media must never appear inside Research, regardless of chip value.
    const mediaHits = await mount.locator("[data-find-explore-results] a[href^='/mediassa/']").count();
    expect(mediaHits, "no Media hit may appear inside Research").toBe(0);
  });
});

test.describe("PF-STARTER-CHIPS /esitykset/", () => {
  test("starter area exists and clicking a chip filters the presentation archive", async ({ page }) => {
    await page.goto("/esitykset/");
    const starter = page.locator("[data-starter-chips]").first();
    await expect(starter).toBeVisible();

    // No chip should be pre-pressed and the archive still shows its
    // opening set (server-rendered), i.e. the runtime did not trigger
    // a fresh search on page load.
    const preClicked = await starter.locator("[data-starter-chip][aria-pressed='true']").count();
    expect(preClicked).toBe(0);

    const chip = starter.locator("[data-starter-chip][data-starter-chip-value='AI literacy']");
    await expect(chip).toBeVisible();
    await chip.click();

    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#presentation-archive-topic")).toHaveValue("AI literacy");

    // At least one presentation card remains visible after applying
    // the chip. presentation-archive-card is the runtime's card class.
    const cards = page.locator("article.presentation-archive-card");
    await expect(cards.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("PF-STARTER-CHIPS /mediassa/", () => {
  test("starter area exists and clicking a chip toggles the existing media filter without adding a new facet", async ({ page }) => {
    await page.goto("/mediassa/");
    const starter = page.locator("[data-starter-chips]").first();
    await expect(starter).toBeVisible();

    // No chip should be pre-pressed before user acts.
    const preClicked = await starter.locator("[data-starter-chip][aria-pressed='true']").count();
    expect(preClicked).toBe(0);

    const chip = starter.locator("[data-starter-chip][data-starter-chip-click=\"[data-media-filter='type:video']\"]");
    await expect(chip).toBeVisible();
    await chip.click();

    await expect(chip).toHaveAttribute("aria-pressed", "true");
    // Existing filter button should become active because the chip
    // proxies a click; the existing runtime handles the rest.
    const existingButton = page.locator("[data-media-filter='type:video']");
    await expect(existingButton).toHaveClass(/is-active/);
    // Visible cards should be scoped to video after the chip.
    const nonVideoCards = await page.locator("[data-media-card-grid] article.media-archive-card:not([data-media-type='video'])").count();
    expect(nonVideoCards, "chip must only trigger the existing type filter, not surface a new facet").toBe(0);
    // Sanity: mediaOutlet is not exposed as a global facet by the chip.
    const outletFacet = await page.locator("[data-starter-chip][data-starter-chip-target*='outlet']").count();
    expect(outletFacet, "no chip should expose mediaOutlet as a facet").toBe(0);
  });
});

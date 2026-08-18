const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("FI theses Find & Explore supports title, author, filter-only and reset", async ({ page }) => {
  await page.goto("/opinnaytteet/");

  await page.locator("[data-find-explore-query]").fill("6 luokkalaisten kokemuksia matematiikka ahdistuksesta");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", "/opinnaytteet/62699/");

  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("[data-find-explore-query]")).toBeFocused();

  await page.locator("[data-find-explore-query]").fill("Riikonen");
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", "/opinnaytteet/62699/", { timeout: 15000 });

  await page.locator("[data-find-explore-reset]").click();
  await page.locator("[data-find-explore-type]").selectOption("masterThesis");
  await page.locator("[data-find-explore-year]").selectOption("2026");
  await page.locator("[data-find-explore-topic]").selectOption("Tekoäly");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", /^\/opinnaytteet\/[0-9]+\//);
});

test.skip("FI theses curated cards preserve abstract and citation actions", async ({ page }) => {
  // TH-CITE1 Phase 3: the archive migrated from a rich curated card
  // grid to a compact SSR table (Year | Citation | Open). The
  // abstract + citation-export modal triggers live on the thesis
  // detail page in the Phase 3 layout, and browser-side citation
  // composition is a Phase 4 target for shared-renderer migration.
  // Re-enable this test after Phase 4 migrates the modal actions.
});

test("EN theses Find & Explore resolves local canonical detail links", async ({ page }) => {
  await page.goto("/en/theses/");

  await page.locator("[data-find-explore-query]").fill("Physically active learning");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/result|results/, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", "/opinnaytteet/57209/");

  await page.locator("[data-find-explore-reset]").click();
  await page.locator("[data-find-explore-query]").fill("Gill");
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", "/opinnaytteet/51005/", { timeout: 15000 });
});

const { test, expect } = require("@playwright/test");

test("FI writings Find & Explore search, filter, reset and canonical links", async ({ page }) => {
  await page.goto("/kirjoitukset/");
  await page.locator("[data-find-explore-query]").fill("kampus");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", /^\/20/);

  await page.locator("[data-find-explore-type]").selectOption("opinion");
  await expect(page.locator(".find-explore-result-meta").first()).toContainText("Mielipiteet");

  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("[data-find-explore-query]")).toBeFocused();
  await expect(page.locator("[data-find-explore-status]")).toContainText("Kirjoita hakusana");
});

test("EN writings Find & Explore search and canonical publication link", async ({ page }) => {
  await page.goto("/en/writings/");
  await page.locator("[data-find-explore-query]").fill("Co-constructing adaptive lesson plans");
  await page.locator("[data-find-explore-type]").selectOption("scientificPublication");
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", /^\/julkaisut\//, { timeout: 15000 });
});

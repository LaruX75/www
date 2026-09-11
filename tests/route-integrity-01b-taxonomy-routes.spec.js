import { test, expect } from "@playwright/test";

const unavailableCategoryRoutes = [
  "/kategoriat/informaatiolukutaito/",
  "/kategoriat/generation-ai/",
  "/kategoriat/tekoalysovellukset/",
  "/kategoriat/perusopetus/"
];

test("Tekoälylukutaito profile only links categories with rendered archive routes", async ({ page }) => {
  await page.goto("/teemat/tekoalylukutaito/");

  for (const href of unavailableCategoryRoutes) {
    await expect(page.locator(`a[href="${href}"]`)).toHaveCount(0);
  }

  await expect(page.locator(".topic-profile-terms span").filter({ hasText: "Informaatiolukutaito" })).toHaveCount(1);
  await expect(page.locator(".topic-profile-terms span").filter({ hasText: "Generation AI" })).toHaveCount(1);
});

test("taxonomy archive degrades to text when the route index is unavailable", async ({ page }) => {
  let taxonomyIndexRequests = 0;
  await page.route("**/data/taxonomy-index.json", async (route) => {
    taxonomyIndexRequests += 1;
    await route.abort();
  });

  await page.goto("/kategoriat/tekoaly/");
  await page.waitForLoadState("networkidle");

  expect(taxonomyIndexRequests).toBe(1);
  for (const href of unavailableCategoryRoutes) {
    await expect(page.locator(`[data-taxonomy-list] a[href="${href}"]`)).toHaveCount(0);
  }
  await expect(page.locator("[data-taxonomy-list] .taxonomy-term-row span").first()).toBeVisible();
});

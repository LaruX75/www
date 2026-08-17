const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("FI research contextual mount renders presentation results using the horizontal variant", async ({ page }) => {
  await page.goto("/tutkimus/");
  // /tutkimus/ contextually surfaces presentations via the shared
  // researchContext mount. Search for a term that reliably matches
  // at least one research-tagged presentation.
  await page.locator("[data-find-explore-query]").fill("CSCL");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 20000 });

  const firstPres = page.locator("[data-find-explore-results] li.find-explore-result--presentation").first();
  await expect(firstPres).toBeVisible({ timeout: 15000 });
  // Horizontal layout: left-column thumb + right-column body.
  await expect(firstPres.locator(".find-explore-result-presentation-thumb")).toBeVisible();
  await expect(firstPres.locator(".find-explore-result-presentation-thumb i")).toHaveClass(/bi-/);
  await expect(firstPres.locator(".find-explore-result-presentation-body")).toBeVisible();
  // Body contains the title link.
  await expect(firstPres.locator(".find-explore-result-presentation-body .find-explore-result-title")).toBeVisible();
});

test("Presentation source-key icon reflects the presentation's source type", async ({ page }) => {
  await page.goto("/tutkimus/");
  await page.locator("[data-find-explore-query]").fill("CSCL");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 20000 });
  const presThumbs = page.locator("[data-find-explore-results] li.find-explore-result--presentation .find-explore-result-presentation-thumb i");
  const count = await presThumbs.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const iconClass = await presThumbs.nth(i).getAttribute("class");
    // Every icon is from Bootstrap Icons and one of the approved
    // presentation source icons (or the generic bi-easel2 fallback).
    expect(iconClass).toMatch(/bi-(easel2|file-earmark-slides|collection-play|youtube|book)/);
  }
});

test("Publications regression: /julkaisut/ still uses the closed publication variant, no PF5 variant leaks", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  await expect(page.locator(".find-explore-result--publication")).toHaveCount(56, { timeout: 15000 });
  await expect(page.locator(".find-explore-result-publication-citation")).toHaveCount(56, { timeout: 15000 });
  await expect(page.locator("section.find-explore-result-group")).toHaveCount(7);
  // No PF5 variants leak into publications.
  await expect(page.locator("[data-find-explore-results] li.find-explore-result--presentation")).toHaveCount(0);
});

test("Thesis rows on /opinnaytteet/ continue to use the pre-PF5 generic renderer", async ({ page }) => {
  // Thesis PF5 work has been moved to a separate TH-CITE1 workstream.
  // This branch must not introduce a new thesis renderer — the generic
  // default from PF4 remains authoritative until TH-CITE1 lands.
  await page.goto("/opinnaytteet/");
  await page.locator("[data-find-explore-query]").fill("6 luokkalaisten kokemuksia matematiikka ahdistuksesta");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  const firstResult = page.locator("[data-find-explore-results] li.find-explore-result").first();
  await expect(firstResult).toBeVisible();
  // The PF5 thesis-specific class must NOT appear on this branch.
  await expect(page.locator("[data-find-explore-results] li.find-explore-result--thesis")).toHaveCount(0);
  await expect(page.locator("[data-find-explore-results] .find-explore-result-thesis-citation")).toHaveCount(0);
});

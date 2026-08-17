const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("FI /julkaisut/ renders the full 56-item Pagefind list on initial load with APA rows", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  // Full-list default: no user query, no filters, but the status count
  // should announce 56 canonical publications once Pagefind returns.
  const status = page.locator("[data-find-explore-status]");
  await expect(status).toContainText(/56 tulosta/, { timeout: 15000 });
  // At least one visible result row uses the APA citation body.
  const apaBody = page.locator(".find-explore-result-publication-citation").first();
  await expect(apaBody).toBeVisible();
  // The primary title link inside the APA row points at the local
  // canonical landing page (either /julkaisut/... or one of the three
  // promoted editorial paths approved via MANUAL_PUBLICATION_RULES).
  const titleLink = page.locator(".find-explore-result-publication-citation a").first();
  await expect(titleLink).toHaveAttribute("href", /^\/(julkaisut\/|20\d{2}\/)/);
  // The old duplicate SSR opening list is gone.
  await expect(page.locator(".publication-opening-item")).toHaveCount(0);
});

test("EN /en/publications/ renders the full list with APA rows on initial load", async ({ page }) => {
  await page.goto("/en/publications/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  const status = page.locator("[data-find-explore-status]");
  await expect(status).toContainText(/56 results/, { timeout: 15000 });
  await expect(page.locator(".find-explore-result-publication-citation").first()).toBeVisible();
  await expect(page.locator(".publication-opening-item")).toHaveCount(0);
});

test("FI A-group filter restricts the list to canonical A publications", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  await page.locator("[data-find-explore-type]").selectOption("A");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/29 tulosta/, { timeout: 15000 });
});

test("FI reset returns the full list", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await page.locator("[data-find-explore-type]").selectOption("A");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/29 tulosta/, { timeout: 15000 });
  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
});

test("FI citation modal opens from a Pagefind result and uses the shared renderer via data-csl", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  const citationBtn = page.locator("[data-find-explore-results] .export-citation-btn").first();
  await expect(citationBtn).toBeVisible();
  await expect(citationBtn).toHaveAttribute("data-csl", /"id":/);
  await citationBtn.click();
  await expect(page.locator("#citationExportModal")).toHaveClass(/show/, { timeout: 10000 });
  await expect(page.locator("#citationOutput")).not.toHaveValue("");
});

import { test, expect } from "@playwright/test";

test.describe("presentation source sections SSR", () => {
  test("FI source sections render from HTML without legacy client mounts", async ({ page }) => {
    await page.goto("/esitykset/");

    const sourceArchive = page.locator("details.presentation-service-archive").nth(2);
    await expect(sourceArchive).toHaveAttribute("open", "");

    const canvaSection = sourceArchive.locator('section[aria-labelledby="canva-heading"]');
    const slideshareSection = sourceArchive.locator('section[aria-labelledby="slideshare-heading"]');

    await expect(canvaSection.locator("tbody tr").first()).toBeVisible();
    await expect(slideshareSection.locator("tbody tr").first()).toBeVisible();

    await expect(canvaSection.locator("#featured-canva")).toHaveCount(0);
    await expect(canvaSection.locator("#table-body-canva")).toHaveCount(0);
    await expect(canvaSection.locator("#mobile-list-canva")).toHaveCount(0);
    await expect(canvaSection.locator("#pagination-canva")).toHaveCount(0);

    await expect(slideshareSection.locator("#featured-slideshare")).toHaveCount(0);
    await expect(slideshareSection.locator("#table-body-slideshare")).toHaveCount(0);
    await expect(slideshareSection.locator("#mobile-list-slideshare")).toHaveCount(0);
    await expect(slideshareSection.locator("#pagination-slideshare")).toHaveCount(0);
  });

  test("FI archive exposes SSR year and topic options before interaction", async ({ page }) => {
    await page.goto("/esitykset/");

    const archive = page.locator("[data-presentation-find-explore]");
    await expect(archive).toBeVisible();
    await expect
      .poll(async () => archive.locator("#presentation-archive-year option").count())
      .toBeGreaterThan(1);
    await expect
      .poll(async () => archive.locator("#presentation-archive-topic-list option").count())
      .toBeGreaterThan(1);
  });
});

test.describe("presentation source sections without JS", () => {
  test.use({ javaScriptEnabled: false });

  test("FI source sections stay usable when browser JS is unavailable", async ({ page }) => {
    await page.goto("/esitykset/");

    const sourceArchive = page
      .locator("details.presentation-service-archive")
      .filter({ hasText: "Alkuperäiset lähteet" })
      .first();
    const sourceArchiveSummary = sourceArchive.locator(":scope > summary");
    await expect(sourceArchiveSummary).toHaveCount(1);
    await expect(sourceArchive).toHaveAttribute("open", "");
    await expect(sourceArchive.locator('section[aria-labelledby="canva-heading"]')).toHaveCount(1);
    await expect(sourceArchive.locator('section[aria-labelledby="aoe-heading"]')).toHaveCount(1);
    await expect(sourceArchive.locator('a[href*="canva.com/design/DAHI6X6dR_g"]')).toHaveCount(1);

    const sourceArchiveHtml = await sourceArchive.innerHTML();
    expect(sourceArchiveHtml).toContain("Canva-esitykset");
    expect(sourceArchiveHtml).toContain("AI Friend or Foe? – Tekoäly: ystävä vai vihollinen?");
    expect(sourceArchiveHtml).toContain("AOE-oppimateriaalit");
  });
});

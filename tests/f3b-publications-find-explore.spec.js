const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("FI publications Find & Explore preserves grouped SSR archive plus local detail, source and citation actions", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore]").first()).toBeVisible();
  await expect(page.locator("[data-find-explore-query]").first()).toBeVisible();
  await expect(page.locator(".publication-archive-group")).not.toHaveCount(0);
  await expect(page.locator("body")).not.toHaveClass(/find-explore-active/);

  await page.locator("[data-find-explore-query]").fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);
  await expect(page.locator(".publication-archive-row .publication-archive-title-link").first()).toHaveAttribute("href", "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/");
  await expect(page.locator(".publication-archive-row .publication-archive-source-actions a[href^='https://']").first()).toBeVisible();

  await page.locator("[data-find-explore-type]").selectOption("A");
  await expect(page.locator(".publication-archive-row .publication-archive-title-link").first()).toHaveAttribute("href", "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/", { timeout: 15000 });

  await page.locator(".export-citation-btn").first().click();
  await expect(page.locator("#citationExportModal")).toHaveClass(/show/, { timeout: 10000 });
  await expect(page.locator("#citationOutput")).not.toHaveValue("");
});

test("EN publications Find & Explore resolves canonical local publication links", async ({ page }) => {
  await page.goto("/en/publications/");
  await expect(page.locator("[data-find-explore]").first()).toBeVisible();
  await expect(page.locator("[data-find-explore-query]").first()).toBeVisible();
  await expect(page.locator(".publication-archive-group")).not.toHaveCount(0);

  await page.locator("[data-find-explore-query]").fill("Co-constructing adaptive lesson plans with GenAI");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/result|results/, { timeout: 15000 });
  await expect(page.locator(".publication-archive-row .publication-archive-title-link[href='/julkaisut/02254916YJ/']")).toBeVisible({ timeout: 15000 });

  await page.locator("[data-find-explore-type]").selectOption("A");
  await expect(page.locator(".publication-archive-row .publication-archive-title-link[href='/julkaisut/02254916YJ/']")).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".export-citation-btn")).toHaveCount(0);
});

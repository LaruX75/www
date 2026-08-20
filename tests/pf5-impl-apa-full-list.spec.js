const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

async function publicationArchiveCount(page) {
  return page.evaluate(async () => {
    const response = await fetch("/data/publications-page.json");
    const json = await response.json();
    return Array.isArray(json.items) ? json.items.length : 0;
  });
}

async function visibleArchiveRowCount(page) {
  const groups = page.locator(".publication-archive-group");
  const groupCount = await groups.count();
  let total = 0;
  for (let index = 0; index < groupCount; index += 1) {
    total += await groups.nth(index).locator("tbody tr").count();
  }
  return total;
}

test("FI publications archive is SSR-visible, grouped, and not a publication-card surface on load", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("body")).not.toHaveClass(/find-explore-active/);
  await expect(page.locator(".publication-archive-group")).not.toHaveCount(0);
  await expect(page.locator(".find-explore-result--publication")).toHaveCount(0);
  await expect(page.locator("#publicationFindExploreRecords")).toHaveCount(0);
  await expect(page.locator("[data-find-explore-topic]")).toHaveCount(0);

  const canonicalCount = await publicationArchiveCount(page);
  expect(await visibleArchiveRowCount(page)).toBe(canonicalCount);

  const firstGroup = page.locator(".publication-archive-group").first();
  await expect(firstGroup.locator("h3")).toBeVisible();
  await expect(firstGroup.locator("table.publication-archive-table")).toBeVisible();
});

test("EN publications archive is SSR-visible, grouped, and omits archive citation buttons", async ({ page }) => {
  await page.goto("/en/publications/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("body")).not.toHaveClass(/find-explore-active/);
  await expect(page.locator(".publication-archive-group")).not.toHaveCount(0);
  await expect(page.locator(".find-explore-result--publication")).toHaveCount(0);
  await expect(page.locator(".publication-archive-row .export-citation-btn")).toHaveCount(0);

  const canonicalCount = await publicationArchiveCount(page);
  expect(await visibleArchiveRowCount(page)).toBe(canonicalCount);
});

test("A-group filter narrows the active archive surface to one grouped table and reset restores SSR", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();

  await page.locator("[data-find-explore-type]").selectOption("A");
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator(".publication-archive-group")).toHaveCount(1);
  await expect(page.locator(".publication-archive-group").first()).toContainText(/A -/);

  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("body")).not.toHaveClass(/find-explore-active/);
  expect(await visibleArchiveRowCount(page)).toBe(await publicationArchiveCount(page));
});

test("Year and author ordering operate on the grouped archive surface without rendering publication cards", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();

  await page.locator("[data-find-explore-type]").selectOption("A");
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });

  const initialFirstHref = await page.locator(".publication-archive-row .publication-archive-title-link").first().getAttribute("href");

  await page.locator("[data-find-explore-year-order]").selectOption("year-asc");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  const oldestFirstHref = await page.locator(".publication-archive-row .publication-archive-title-link").first().getAttribute("href");
  expect(oldestFirstHref).not.toBe(initialFirstHref);

  await page.locator("[data-find-explore-author-sort]").selectOption("author-asc");
  await expect(page.locator(".find-explore-result--publication")).toHaveCount(0);
  await expect(page.locator(".publication-archive-group").first().locator("tbody .publication-archive-col-authors").first()).toHaveText(
    "Celik, Ismail; Kontkanen, Sini; Laru, Jari; Dalyanci, Alanur Ahsen",
    { timeout: 15000 }
  );
  await expect(page.locator(".publication-archive-group").first().locator("tbody .publication-archive-title-link").first()).toHaveAttribute(
    "href",
    "/julkaisut/02254916YJ/"
  );
});

test("Text query keeps grouped tables, local detail links, source links, and FI archive citation actions", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();

  await page.locator("[data-find-explore-query]").fill("Kosovo");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);
  await expect(page.locator(".find-explore-result--publication")).toHaveCount(0);

  const firstTitle = page.locator(".publication-archive-row .publication-archive-title-link").first();
  const firstSource = page.locator(".publication-archive-row .publication-archive-source-actions a").first();
  await expect(firstTitle).toHaveAttribute("href", "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/");
  await expect(firstSource).toHaveAttribute("href", /^https?:\/\//);
  expect(await firstSource.getAttribute("href")).not.toBe(await firstTitle.getAttribute("href"));

  await page.locator(".publication-archive-row .export-citation-btn").first().click();
  await expect(page.locator("#citationExportModal")).toHaveClass(/show/, { timeout: 10000 });
  await expect(page.locator("#citationOutput")).not.toHaveValue("");
});

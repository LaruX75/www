const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

const FI_URLS = [
  "/opinnaytteet/",
  "/opinnaytteet/sivu/2/",
  "/opinnaytteet/sivu/3/",
  "/opinnaytteet/sivu/4/",
  "/opinnaytteet/sivu/5/",
  "/opinnaytteet/sivu/6/",
  "/opinnaytteet/sivu/7/",
  "/opinnaytteet/sivu/8/",
  "/opinnaytteet/sivu/9/"
];

const EN_URLS = [
  "/en/theses/",
  "/en/theses/page/2/",
  "/en/theses/page/3/",
  "/en/theses/page/4/",
  "/en/theses/page/5/",
  "/en/theses/page/6/",
  "/en/theses/page/7/",
  "/en/theses/page/8/",
  "/en/theses/page/9/"
];

function archiveLocator(page) {
  return page.locator("[data-thesis-archive]");
}

function pagerLocator(page, position) {
  return page.locator(`[data-thesis-archive-pager-position="${position}"]`);
}

function resultsLocator(page) {
  return page.locator("[data-find-explore-results]");
}

async function activePageNumber(page, position) {
  const text = await pagerLocator(page, position)
    .locator(".page-item.active .page-link")
    .first()
    .innerText();
  return Number.parseInt(text.trim(), 10);
}

async function firstResultHref(page) {
  return resultsLocator(page).locator(".thesis-archive-title-link").first().getAttribute("href");
}

function numericYears(values) {
  return values.map((value) => Number.parseInt(String(value).trim(), 10)).filter(Number.isFinite);
}

test("flat thesis archive SSR pages exist as real documents with one table and one shared tbody", async ({ page }) => {
  for (const url of [...FI_URLS, ...EN_URLS]) {
    const response = await page.request.get(url);
    expect(response.ok(), `${url} SSR page must exist`).toBeTruthy();
    const html = await response.text();

    expect(html).toMatch(/data-thesis-archive/);
    expect((html.match(/<table[^>]+thesis-archive-table/g) || []).length, `${url} should have one archive table`).toBe(1);
    expect((html.match(/<tbody[^>]+data-find-explore-results/g) || []).length, `${url} should have one shared results tbody`).toBe(1);
    expect((html.match(/data-thesis-archive-pager-position="top"/g) || []).length, `${url} should have top pager`).toBe(1);
    expect((html.match(/data-thesis-archive-pager-position="bottom"/g) || []).length, `${url} should have bottom pager`).toBe(1);
    expect((html.match(/class="thesis-archive-title-link/g) || []).length, `${url} should show at most 20 rows`).toBeLessThanOrEqual(20);
    expect(html).not.toMatch(/data-thesis-section=/);
    expect(html).not.toMatch(/thesis-archive-citation/);
    expect(html).toMatch(/data-find-explore-year-order/);
    expect(html).toMatch(/data-find-explore-author-sort/);
    expect(html).toMatch(/data-find-explore-type-role/);
  }
});

test("landing SSR thesis archive remains year-descending before any active Pagefind interaction", async ({ page }) => {
  await page.goto("/opinnaytteet/");
  const years = numericYears(await resultsLocator(page).locator(".thesis-archive-col-year").allTextContents());
  expect(years.length).toBeGreaterThan(0);
  expect([...years]).toEqual([...years].sort((left, right) => right - left));
  await expect(page.locator("[data-find-explore-year-order]")).toHaveValue("year-desc");
  await expect(page.locator("body")).not.toHaveClass(/find-explore-active/);
});

test("flat thesis archive keeps top and bottom pagers in sync on SSR page documents", async ({ page }) => {
  await page.goto("/opinnaytteet/sivu/5/");
  await expect(archiveLocator(page)).toHaveAttribute("data-thesis-archive-current-page", "5");
  await expect(resultsLocator(page).locator("tr")).toHaveCount(20);
  expect(await activePageNumber(page, "top")).toBe(5);
  expect(await activePageNumber(page, "bottom")).toBe(5);

  await page.goto("/en/theses/page/3/");
  await expect(archiveLocator(page)).toHaveAttribute("data-thesis-archive-current-page", "3");
  await expect(resultsLocator(page).locator("tr")).toHaveCount(20);
  expect(await activePageNumber(page, "top")).toBe(3);
  expect(await activePageNumber(page, "bottom")).toBe(3);
});

test("JavaScript disabled: thesis pagination links are real anchors", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/opinnaytteet/");
  const fiHref = await pagerLocator(page, "top").locator('a[href="/opinnaytteet/sivu/5/"]').getAttribute("href");
  expect(fiHref).toBe("/opinnaytteet/sivu/5/");
  await page.goto(fiHref);
  await expect(page).toHaveURL(/\/opinnaytteet\/sivu\/5\/$/);
  expect(await activePageNumber(page, "top")).toBe(5);
  expect(await activePageNumber(page, "bottom")).toBe(5);

  await page.goto("/en/theses/");
  const enHref = await pagerLocator(page, "top").locator('a[href="/en/theses/page/3/"]').getAttribute("href");
  expect(enHref).toBe("/en/theses/page/3/");
  await page.goto(enHref);
  await expect(page).toHaveURL(/\/en\/theses\/page\/3\/$/);
  expect(await activePageNumber(page, "top")).toBe(3);
  expect(await activePageNumber(page, "bottom")).toBe(3);

  await context.close();
});

test("active thesis search replaces the same tbody and reset restores SSR rows and pagers", async ({ page }) => {
  await page.goto("/opinnaytteet/");

  const initialHref = await firstResultHref(page);
  await expect(resultsLocator(page).locator("tr")).toHaveCount(20);
  await expect(pagerLocator(page, "top")).toBeVisible();
  await expect(pagerLocator(page, "bottom")).toBeVisible();

  await page.locator("[data-find-explore-query]").fill("Riikonen");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(resultsLocator(page).locator(".thesis-archive-title-link").first()).toHaveAttribute("href", "/opinnaytteet/62699/");
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);
  await expect(pagerLocator(page, "top")).not.toBeVisible();
  await expect(pagerLocator(page, "bottom")).not.toBeVisible();

  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("[data-find-explore-query]")).toBeFocused();
  await expect(page.locator("body")).not.toHaveClass(/find-explore-active/);
  await expect(resultsLocator(page).locator("tr")).toHaveCount(20);
  await expect(resultsLocator(page).locator(".thesis-archive-title-link").first()).toHaveAttribute("href", initialHref);
  await expect(pagerLocator(page, "top")).toBeVisible();
  await expect(pagerLocator(page, "bottom")).toBeVisible();
});

test("type-role filter and author sort render constrained rows into the shared tbody", async ({ page }) => {
  await page.goto("/opinnaytteet/");

  await page.locator("[data-find-explore-type-role]").selectOption("masterThesis::advised");
  await page.locator("[data-find-explore-author-sort]").selectOption("author-desc");

  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);
  await expect(page.locator("li.find-explore-result")).toHaveCount(0);

  const rowCount = await resultsLocator(page).locator("tr").count();
  expect(rowCount).toBeGreaterThan(0);
  expect(rowCount).toBeLessThanOrEqual(10);

  const typeCells = await resultsLocator(page).locator(".thesis-archive-col-type").allTextContents();
  expect(typeCells.every((value) => value.includes("Gradu") && value.includes("ohjattu"))).toBeTruthy();

  const authorCells = await resultsLocator(page).locator(".thesis-archive-col-author").allTextContents();
  const normalizedAuthors = authorCells.map((value) => value.trim()).filter(Boolean);
  const descAuthors = [...normalizedAuthors].sort((left, right) => right.localeCompare(left, "fi"));
  expect(normalizedAuthors).toEqual(descAuthors);
});

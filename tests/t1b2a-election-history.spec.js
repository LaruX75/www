const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("FI and EN election history render the same shared term order", async ({ page }) => {
  await page.goto("/politiikka/vaalikaudet/");
  await expect(page.getByRole("heading", { level: 1, name: "Vaalikaudet" })).toBeVisible();
  const fiIds = await page.locator("article.term-card[id]").evaluateAll((nodes) => nodes.map((node) => node.id));

  await page.goto("/en/election-history/");
  await expect(page.getByRole("heading", { level: 1, name: "Election History" })).toBeVisible();
  const enIds = await page.locator("article.term-card[id]").evaluateAll((nodes) => nodes.map((node) => node.id));

  expect(enIds).toEqual(fiIds);
  expect(enIds).toEqual(["2025-2029", "2021-2025", "2017-2021", "2013-2017"]);
});

test("EN election history preserves shared term facts and authoritative archive boundaries", async ({ page }) => {
  await page.goto("/en/election-history/");

  await expect(page.locator('article.term-card[id="2025-2029"]')).toContainText("2nd Deputy City Councillor");
  await expect(page.locator('article.term-card[id="2025-2029"]')).toContainText("289 votes");
  await expect(page.locator('article.term-card[id="2021-2025"]')).toContainText("Campaign archive 2021 (Finnish)");
  await expect(page.locator('article.term-card[id="2017-2021"]')).toContainText("Chair, Local Democracy Committee");
  await expect(page.locator('article.term-card[id="2013-2017"]')).toContainText("Campaign archive 2012 (Finnish)");
  await expect(page.getByRole("heading", { name: "Other Civic Roles" })).toBeVisible();
});

test("legacy FI election-history redirect and no-JS SSR routes stay usable", async ({ browser, page }) => {
  const jsOffContext = await browser.newContext({ javaScriptEnabled: false });
  const jsOffPage = await jsOffContext.newPage();

  await jsOffPage.goto("/politiikka/vaalikaudet/");
  await expect(jsOffPage.locator("h1.term-hero-title")).toHaveText("Vaalikaudet");
  await expect(jsOffPage.locator("article.term-card")).toHaveCount(4);

  await jsOffPage.goto("/en/election-history/");
  await expect(jsOffPage.locator("h1.term-hero-title")).toHaveText("Election History");
  await expect(jsOffPage.locator("article.term-card")).toHaveCount(4);

  await page.goto("/vaalihistoria/");
  await expect(page).toHaveURL(/\/politiikka\/vaalikaudet\/$/);

  await jsOffContext.close();
});

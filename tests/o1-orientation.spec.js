const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("FI publications discovery state keeps canonical hub return and explicit results return", async ({ page }) => {
  await page.goto("/julkaisut/");
  const initialHref = await page.locator(".publication-archive-row .publication-archive-title-link").first().getAttribute("href");
  expect(initialHref).not.toContain("returnTo=");
  await page.locator("[data-find-explore-query]").fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);

  const resultLink = page.locator(".publication-archive-row .publication-archive-title-link").first();
  await expect(resultLink).toHaveAttribute("href", /q%3DAssessing/);
  const resultHref = await resultLink.getAttribute("href");
  await page.goto(resultHref);

  await expect(page.locator("nav[aria-label='Murupolku'], nav[aria-label='Breadcrumb']")).toBeVisible();
  await expect(page.locator(".breadcrumb [aria-current='page']")).toHaveCount(1);
  await expect(page.locator("[data-detail-hub-link]")).toHaveAttribute("href", /^\/julkaisut\/(?:#.+)?$/);
  await expect(page.locator("[data-detail-return-link]")).toBeVisible();
  await expect(page.locator("[data-detail-return-link]")).toHaveAttribute("href", /\/julkaisut\/\?.*q=Assessing/);
});

test("EN thesis detail preserves English hub return and explicit results return", async ({ page }) => {
  await page.goto("/en/theses/");
  const initialHref = await page.locator("[data-find-explore-results] .thesis-archive-title-link").first().getAttribute("href");
  expect(initialHref).not.toContain("returnTo=");
  await page.locator("[data-find-explore-query]").fill("Gill");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/result|results/, { timeout: 15000 });

  const resultLink = page.locator("[data-find-explore-results] .thesis-archive-title-link").first();
  await expect(resultLink).toHaveAttribute("href", /returnTo=/);
  await resultLink.click();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("nav[aria-label='Breadcrumb']")).toBeVisible();
  await expect(page.locator("[data-detail-hub-link]")).toHaveAttribute("href", "/en/theses/");
  await expect(page.locator("[data-detail-return-link]")).toBeVisible();
  await expect(page.locator("[data-detail-return-link]")).toHaveAttribute("href", /\/en\/theses\/\?q=Gill/);
});

test("FI thesis detail keeps canonical no-JS hub navigation and hides duplicate results return on default archive state", async ({ browser, page }) => {
  const jsOffContext = await browser.newContext({ javaScriptEnabled: false });
  const jsOffPage = await jsOffContext.newPage();

  await jsOffPage.goto("/opinnaytteet/62699/");
  const jsOffHubLink = jsOffPage.locator("[data-detail-hub-link]");
  await expect(jsOffHubLink).toHaveAttribute("href", "/opinnaytteet/");
  const jsOffHubHref = await jsOffHubLink.getAttribute("href");
  await jsOffPage.goto(jsOffHubHref);
  await expect(jsOffPage).toHaveURL(/\/opinnaytteet\/$/);

  await jsOffContext.close();

  await page.goto("/opinnaytteet/");
  await page.locator("[data-find-explore-results] .thesis-archive-title-link").first().click();
  await expect(page.locator("[data-detail-return-link]")).toBeHidden();

  await page.goto("/opinnaytteet/62699/?returnTo=https://example.com/");
  await expect(page.locator("[data-detail-return-link]")).toBeHidden();
});

test("FI writings detail uses explicit hub navigation instead of browser-history back magic", async ({ page }) => {
  await page.goto("/kirjoitukset/");
  await page.locator("[data-find-explore-query]").fill("Kampuspohdintaa Oulun yliopiston hallitus valitsi Kontinkankaan jatkokehitettäväksi kampusvaihtoehdoksi");
  await page.locator("[data-find-explore-type]").selectOption("opinion");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });

  const resultLink = page.locator("[data-find-explore-results] .find-explore-result-title").first();
  await expect(resultLink).toHaveAttribute("href", /returnTo=/);
  await resultLink.click();

  await expect(page.locator("[data-detail-hub-link]")).toBeVisible();
  await expect(page.locator("[data-detail-hub-link]")).toHaveAttribute("href", /\/kirjoitukset\//);
  await expect(page.locator("[data-detail-return-link]")).toBeVisible();
  await expect(page.locator("[data-detail-return-link]")).toHaveAttribute("href", /\/kirjoitukset\/\?q=Kampuspohdintaa/);
  await expect(page.locator("[data-history-back]")).toHaveCount(0);
});

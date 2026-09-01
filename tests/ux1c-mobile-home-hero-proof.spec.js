const { test, expect } = require("@playwright/test");

const HOME = "/";
const EN_HOME = "/en/";
const MOBILE_WIDTHS = [375, 390, 430];
const DESKTOP_WIDTHS = [1280, 1440];

async function expectNoHorizontalOverflow(page) {
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth + 1);
}

for (const width of MOBILE_WIDTHS) {
  test(`FI mobile hero keeps CTA and proof visible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(HOME);

    const hero = page.locator("#heroSection");
    const panel = hero.locator(".home-hero-panel");

    await expect(hero).toBeVisible();
    await expect(hero.locator(".home-hero-actions .btn")).toHaveCount(2);
    await expect(panel).toBeVisible();
    await expect(panel.locator(".home-hero-panel-text")).toBeHidden();
    await expect(panel.locator(".home-hero-kpi")).toHaveCount(5);
    await expect(hero.locator('.home-hero-kpi-link[href="/esitykset/"]')).toBeVisible();
    await expect(hero.locator('.home-hero-kpi-link[href="/opinnaytteet/"]')).toBeVisible();
    await expect(hero.locator('.home-hero-kpi-link[href="/mediassa/"]')).toBeVisible();
    await expect(page.locator("#aloita")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test(`EN mobile hero keeps roles and proof visible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(EN_HOME);

    const hero = page.locator("#heroSection");

    await expect(hero).toBeVisible();
    await expect(hero.locator(".home-hero-role-item")).toHaveCount(4);
    await expect(hero.locator('.home-hero-role-item[href="/en/work/"]')).toBeVisible();
    await expect(hero.locator('.home-hero-role-item[href="/en/politics/"]')).toBeVisible();
    await expect(hero.locator(".home-intro-actions .btn")).toHaveCount(2);
    await expect(hero.locator(".home-hero-kpi")).toHaveCount(6);
    await expect(hero.locator('.home-hero-kpi-link[href="/en/presentations/"]')).toBeVisible();
    await expect(hero.locator('.home-hero-kpi-link[href="/en/theses/"]')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
}

for (const width of DESKTOP_WIDTHS) {
  test(`FI and EN desktop hero surfaces remain visible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1200 });

    await page.goto(HOME);
    await expect(page.locator("#heroSection .home-hero-panel")).toBeVisible();
    await expect(page.locator("#heroSection .home-hero-kpi")).toHaveCount(5);
    await expect(page.locator('#heroSection .home-hero-kpi-link[href="/mediassa/"]')).toBeVisible();

    await page.goto(EN_HOME);
    await expect(page.locator("#heroSection .home-hero-roles")).toBeVisible();
    await expect(page.locator("#heroSection .home-hero-kpi")).toHaveCount(6);
    await expectNoHorizontalOverflow(page);
  });
}

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

function recognitionSection(page) {
  return page.locator(".home-recognition-section").first();
}

test("FI and EN homepages render recognised work from initial HTML", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(HOME);
    await expect(page.locator("#home-recognition-heading")).toHaveText("Tunnustettua työtä");
    await expect(recognitionSection(page).locator(".home-recognition-card")).toHaveCount(2);
    await expect(recognitionSection(page)).toContainText("2020");
    await expect(recognitionSection(page)).toContainText("Kansallinen avoimen tieteen palkinto");
    await expect(recognitionSection(page)).toContainText("2014");
    await expect(recognitionSection(page)).toContainText("Vuoden tieto- ja viestintätekniikkaopettaja");
    await expect(recognitionSection(page).locator('a[href="/palkinnot/"]')).toHaveText("Katso palkinnot ja tunnustukset");

    await page.goto(EN_HOME);
    await expect(page.locator("#home-recognition-heading")).toHaveText("Recognised work");
    await expect(recognitionSection(page).locator(".home-recognition-card")).toHaveCount(2);
    await expect(recognitionSection(page)).toContainText("2020");
    await expect(recognitionSection(page)).toContainText("National Open Science Award");
    await expect(recognitionSection(page)).toContainText("2014");
    await expect(recognitionSection(page)).toContainText("Teacher of the Year in Educational Technology");
    await expect(recognitionSection(page).locator('a[href="/en/awards/"]')).toHaveText("See awards and recognition");
  } finally {
    await context.close();
  }
});

test("FI homepage keeps recognised work between role cards and timeline", async ({ page }) => {
  await page.goto(HOME);

  const roles = page.locator("#roolit");
  const recognition = page.locator("#tunnustettu-tyo");
  const timeline = page.locator("#aikajana");

  await expect(roles).toHaveCount(1);
  await expect(recognition).toHaveCount(1);
  await expect(timeline).toHaveCount(1);

  const rolesBottom = await roles.evaluate((node) => node.getBoundingClientRect().bottom);
  const recognitionTop = await recognition.evaluate((node) => node.getBoundingClientRect().top);
  const recognitionBottom = await recognition.evaluate((node) => node.getBoundingClientRect().bottom);
  const timelineTop = await timeline.evaluate((node) => node.getBoundingClientRect().top);

  expect(recognitionTop).toBeGreaterThanOrEqual(rolesBottom - 1);
  expect(timelineTop).toBeGreaterThanOrEqual(recognitionBottom - 1);
});

for (const width of MOBILE_WIDTHS) {
  test(`recognised work stays compact on mobile at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1400 });

    await page.goto(HOME);
    const fiSection = page.locator("#tunnustettu-tyo");
    await expect(fiSection).toBeVisible();
    await expect(fiSection.locator(".home-recognition-card")).toHaveCount(2);
    const fiHeight = await fiSection.evaluate((node) => Math.round(node.getBoundingClientRect().height));
    expect(fiHeight).toBeLessThan(700);
    await expectNoHorizontalOverflow(page);

    await page.goto(EN_HOME);
    const enSection = page.locator("#recognised-work");
    await expect(enSection).toBeVisible();
    await expect(enSection.locator(".home-recognition-card")).toHaveCount(2);
    const enHeight = await enSection.evaluate((node) => Math.round(node.getBoundingClientRect().height));
    expect(enHeight).toBeLessThan(700);
    await expectNoHorizontalOverflow(page);
  });
}

for (const width of DESKTOP_WIDTHS) {
  test(`recognised work uses a stable two-card grid at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1200 });

    await page.goto(HOME);
    const fiTops = await page.locator("#tunnustettu-tyo .home-recognition-card").evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().top))
    );
    expect(new Set(fiTops).size).toBe(1);

    await page.goto(EN_HOME);
    const enTops = await page.locator("#recognised-work .home-recognition-card").evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().top))
    );
    expect(new Set(enTops).size).toBe(1);
    await expectNoHorizontalOverflow(page);
  });
}

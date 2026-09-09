const { test, expect } = require('@playwright/test');

async function open(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-bs-target="#mobileNavFi"]').click();
}

test('FI mixed mobile panels preserve legacy disclosures', async ({ page }) => {
  await open(page);
  for (const panel of ['work', 'media', 'contact']) {
    await expect(page.locator(`[data-mobile-panel-open="${panel}"]`)).toHaveCount(1);
  }
  for (const name of ['Minä', 'Politiikka', 'Kynästä']) {
    await expect(page.locator(`#mobileNavFi details.mobile-nav-card > summary`, { hasText: name })).toHaveCount(1);
  }
  await expect(page.locator('#mobileNavFi details.mobile-nav-card')).toHaveCount(3);
});

test('Work supports deep forward, back and focus restoration', async ({ page }) => {
  await open(page);
  const work = page.locator('[data-mobile-panel-open="work"]');
  await work.click();
  await expect(page.locator('[data-mobile-panel="work"]')).toBeVisible();
  const opetus = page.locator('[data-mobile-panel-open="work-1"]');
  await opetus.click();
  await expect(page.locator('[data-mobile-panel="work-1"] a[href="/opetus/"]')).toBeVisible();
  await page.locator('[data-mobile-panel="work-1"] [data-mobile-panel-back="work"]').click();
  await expect(opetus).toBeFocused();
  await page.locator('[data-mobile-panel="work"] [data-mobile-panel-back="root"]').click();
  await expect(work).toBeFocused();
});

test('Media and contact remain SSR direct destinations and actions', async ({ page }) => {
  await open(page);
  await page.locator('[data-mobile-panel-open="media"]').click();
  await expect(page.locator('[data-mobile-panel="media"] a[href="/mediassa/#media-arkisto"]')).toBeVisible();
  await page.locator('[data-mobile-panel="media"] [data-mobile-panel-back="root"]').click();
  await page.locator('[data-mobile-panel-open="contact"]').click();
  await expect(page.locator('[data-mobile-panel="contact"] a[href^="mailto:"]').first()).toBeVisible();
  await expect(page.locator('[data-mobile-panel="contact"] a[href^="tel:"]').first()).toBeVisible();
  await expect(page.locator('[data-mobile-panel="contact"] a[href*="zoom.us"]')).toBeVisible();
});

test('closing resets panels and legacy details still disclose', async ({ page }) => {
  await open(page);
  await page.locator('[data-mobile-panel-open="work"]').click();
  await page.locator('#mobileNavFi [data-bs-dismiss="offcanvas"]').click();
  await page.locator('[data-bs-target="#mobileNavFi"]').click();
  await expect(page.locator('[data-mobile-panel="work"]')).toBeHidden();
  const preserved = page.locator('#mobileNavFi details.mobile-nav-card');
  for (let index = 0; index < 3; index += 1) {
    const disclosure = preserved.nth(index);
    const initiallyOpen = await disclosure.evaluate((element) => element.open);
    await disclosure.locator('summary').click();
    await expect.poll(() => disclosure.evaluate((element) => element.open)).toBe(!initiallyOpen);
    await disclosure.locator('summary').click();
    await expect.poll(() => disclosure.evaluate((element) => element.open)).toBe(initiallyOpen);
  }
});

test('Escape closes the offcanvas without leaving a panel reachable', async ({ page }) => {
  await open(page);
  await page.locator('[data-mobile-panel-open="work"]').click();
  await expect(page.locator('[data-mobile-panel="work"]')).toBeVisible();
  await expect(page.locator('[data-mobile-panel="media"]')).toBeHidden();
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobileNavFi')).toBeHidden();
  await page.locator('[data-bs-target="#mobileNavFi"]').click();
  await expect(page.locator('[data-mobile-panel="work"]')).toBeHidden();
});

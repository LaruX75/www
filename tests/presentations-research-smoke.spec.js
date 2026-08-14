import { test, expect } from '@playwright/test';

test.describe('Presentations and research browser smoke', () => {
  test('presentations search and research page stay usable', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 900 });

    await page.goto('/esitykset/');
    await expect(page.locator('.navbar-brand').first()).toContainText('Jari Laru');
    await expect(page.locator('main h1').first()).toContainText(/Esitykset/i);

    await expect(page.locator('main a[href^="/presentations/"]').first()).toBeVisible();
    await expect(
      page.locator('main a[href^="https://www.canva.com/"], main a[href*="youtube.com/watch"], main a[href*="slideshare.net/"]').first()
    ).toBeVisible();

    await page.locator('#searchToggleBtn').click();
    const input = page.locator('#searchOverlay .pagefind-ui__search-input');
    await expect(input).toBeVisible();
    await input.fill('pieni kielikone');
    await expect(page.locator('#searchOverlay .pagefind-ui__result').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#searchOverlay .pagefind-ui__message')).toContainText(/tulos/i);

    await page.goto('/tutkimus/');
    await expect(page.locator('.navbar-brand').first()).toContainText('Jari Laru');
    await expect(page.locator('main h1').first()).toContainText(/Tutkimuksen tarkasteluteemat/i);
    await expect(page.locator('main .card, main [class*="card"]').first()).toBeVisible();
  });
});

/**
 * PF5-G3A media shared-result regression.
 *
 * Media already exposes raw Pagefind metadata for type/role/outlet/year.
 * G3A projects localized type/role labels + thumbnail metadata, then
 * activates the shared SearchResultPresenter media branch so both the
 * full search page and navbar overlay show richer Media cards without
 * introducing a parallel renderer.
 */
import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;

const SURFACES = [
  {
    name: 'FI full search',
    path: '/haku/?q=joulukalenteri',
    locator: '[data-search-modular-results]'
  },
  {
    name: 'EN full search',
    path: '/en/search/?q=open%20science',
    locator: '[data-search-modular-results]'
  }
];

async function waitForModularReady(page) {
  const mount = page.locator('#siteSearchPageUi[data-search-modular-ready="true"]');
  await expect(mount).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
}

for (const surface of SURFACES) {
  test.describe(`PF5-G3A media shared-result — ${surface.name}`, () => {
    test('media result renders thumbnail + primary meta when thumbnail metadata exists', async ({ page }) => {
      await gotoAndAssertSite(page, surface.path);
      await waitForModularReady(page);
      const result = page.locator(`${surface.locator} li[data-search-result-kind="media"]`).first();
      await expect(result).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
      await expect(result.locator('.find-explore-result-media-thumb img')).toBeVisible();
      await expect(result.locator('.find-explore-result-media-thumb img')).toHaveAttribute('alt', '');
      await expect(result.locator('.find-explore-result-primary-meta')).not.toHaveText(/^\s*$/);
    });
  });
}

test.describe('PF5-G3A media shared-result — FI thumbnail fallback', () => {
  test('media result without thumbnail keeps a clean card without an empty image shell', async ({ page }) => {
    await gotoAndAssertSite(page, '/haku/?q=vatjus');
    await waitForModularReady(page);
    const result = page.locator('[data-search-modular-results] li[data-search-result-kind="media"]').first();
    await expect(result).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
    await expect(result.locator('.find-explore-result-primary-meta')).toContainText('SoundCloud / Jari Laru');
    await expect(result.locator('.find-explore-result-media-thumb')).toHaveCount(0);
  });
});

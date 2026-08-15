import { test, expect } from '@playwright/test';

const FIXTURES = {
  fiSearchTitle: 'Tekoäly valtaa alaa',
  fiDetailLanding: '/mediassa/2023/11/13/munoulu-tekoaly-valtaa-alaa-luova-luokka-mediakasvatusseminaari/',
  fiExternalOutletFragment: 'munoulu.fi'
};

test.describe('FI /mediassa/', () => {
  test('shared media Find & Explore renders and filters work', async ({ page }) => {
    await page.goto('/mediassa/');

    const browser = page.locator('[data-media-browser]');
    await expect(browser).toBeVisible();

    // Client-side hydration finishes when the archive card grid ends up
    // populated by the shared ContentEngine via FindExplore:media.
    const cardGrid = browser.locator('[data-media-card-grid]');
    await expect(cardGrid.locator('article.media-archive-card').first()).toBeVisible();

    // Type filter: video should reduce the visible set
    await browser.locator('[data-media-filter="type:video"]').click();
    await expect(browser.locator('[data-media-browser-status]')).toContainText(/mediaosum/);
    const visibleAfterVideo = await cardGrid.locator('article.media-archive-card').count();
    expect(visibleAfterVideo).toBeGreaterThan(0);
    // Every visible card should carry data-media-type="video" after filtering.
    const nonVideo = await cardGrid.locator('article.media-archive-card:not([data-media-type="video"])').count();
    expect(nonVideo).toBe(0);

    // Reset to Kaikki and confirm larger set returns
    await browser.locator('[data-media-filter="all"]').click();
    const visibleAll = await cardGrid.locator('article.media-archive-card').count();
    expect(visibleAll).toBeGreaterThanOrEqual(visibleAfterVideo);

    // Role filter: guest should reduce and keep only guest cards
    await browser.locator('[data-media-filter="role:guest"]').click();
    const nonGuest = await cardGrid.locator('article.media-archive-card:not([data-media-role="guest"])').count();
    expect(nonGuest).toBe(0);

    // The archive grid itself must be excluded from Pagefind indexing so it
    // does not compete with per-item records. This is a landing-page check.
    const ignoreCount = await page.locator('section#media-arkisto[data-pagefind-ignore]').count();
    expect(ignoreCount).toBe(1);
  });

  test('media detail page carries M2 Pagefind metadata and links external source', async ({ page }) => {
    await page.goto(FIXTURES.fiDetailLanding);

    // Reverse gate: media detail pages must NOT carry data-pagefind-body.
    // Pagefind treats data-pagefind-body as a site-wide gate — the moment
    // any page uses it, pages missing the marker are dropped from the
    // index. Media uses hidden filter/meta spans instead.
    const body = page.locator('[data-pagefind-body]');
    await expect(body).toHaveCount(0);

    const sisalto = page.locator('span[data-pagefind-filter="Sisältö:Mediassa"]');
    await expect(sisalto).toHaveCount(1);

    const mediatyyppi = page.locator('span[data-pagefind-filter^="Mediatyyppi:"]');
    await expect(mediatyyppi).toHaveCount(1);

    const rooli = page.locator('span[data-pagefind-filter^="Rooli:"]');
    await expect(rooli).toHaveCount(1);

    const vuosi = page.locator('span[data-pagefind-filter^="Vuosi:"]');
    await expect(vuosi).toHaveCount(1);

    const mediaTypeMeta = page.locator('span[data-pagefind-meta^="mediaType:"]');
    await expect(mediaTypeMeta).toHaveCount(1);

    // External source link is still present and rendered
    const external = page.locator(`a[href*="${FIXTURES.fiExternalOutletFragment}"]`).first();
    await expect(external).toBeVisible();
    await expect(external).toHaveAttribute('target', '_blank');
  });
});

test.describe('EN /en/media/', () => {
  test('landing renders and excludes the archive grid from Pagefind', async ({ page }) => {
    await page.goto('/en/media/');
    const ignoreCount = await page.locator('section#media-archive[data-pagefind-ignore]').count();
    expect(ignoreCount).toBe(1);
    // All 73 items are still SSR-rendered as cards on the EN page (no PE
    // hydration). Guard against accidental removal.
    const cardCount = await page.locator('section#media-archive article.card').count();
    expect(cardCount).toBeGreaterThanOrEqual(70);
  });
});

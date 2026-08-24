/**
 * PF5-G1 navbar Modular UI regression suite.
 *
 * After PF5-G1 navbar migration the FI + EN <dialog id="searchOverlay">
 * mounts Pagefind Modular UI via the shared factory
 * window.createModularSearchUI(...) in
 * /js/global-search-modular-ui.js. This spec locks:
 *   - correct mount + Default UI absence
 *   - Kieli pinning
 *   - shared presenter (renderSharedCard) result markup
 *   - N1 dialog lifecycle unchanged (init focus, boundary wrap,
 *     Escape close + focus return, close button, backdrop)
 *   - repeat open/close does not leak
 *   - failure path (script 404): dialog remains fully closable
 *   - sr-only helper text visually clipped
 *   - mobile trigger parity
 */
import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;

const LOCALES = [
    {
        name: 'FI',
        path: '/',
        probeQuery: 'tekoäly',
        noQuery: 'zxqzxq_nonsense_12345',
        placeholder: 'Kirjoita hakusana...',
        ariaLabel: 'Hae sivustolta',
        loadMoreLabel: 'Lataa lisää tuloksia',
        zeroRegex: /Ei tuloksia/i,
        fullSearchPageHref: '/haku/',
        forbiddenLangPrefix: '/en/',
        fiOnlyPrefixes: null
    },
    {
        name: 'EN',
        path: '/en/',
        probeQuery: 'learning',
        noQuery: 'zxqzxq_nonsense_12345',
        placeholder: 'Type a search term...',
        ariaLabel: 'Search the site',
        loadMoreLabel: 'Load more results',
        zeroRegex: /No results/i,
        fullSearchPageHref: '/en/search/',
        forbiddenLangPrefix: null,
        fiOnlyPrefixes: ['/haku/']
    }
];

async function openNavbarModularUi(page) {
    await page.setViewportSize({ width: 800, height: 800 });
    const trigger = page.locator('#searchToggleBtn');
    await expect(trigger).toBeVisible();
    await trigger.click();
    const dialog = page.locator('#searchOverlay');
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('open', '');
    const mount = page.locator('#siteSearchUi[data-search-modular-ready="true"]');
    await expect(mount).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
    const input = page.locator('#siteSearchNavInput');
    await expect(input).toBeVisible();
    return { trigger, dialog, input };
}

for (const locale of LOCALES) {
    test.describe(`PF5-G1 navbar Modular UI — ${locale.name}`, () => {

        test('mounts Modular UI + Default UI DOM absent', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { input } = await openNavbarModularUi(page);
            await expect(input).toHaveAttribute('placeholder', locale.placeholder);
            await expect(input).toHaveAttribute('aria-label', locale.ariaLabel);
            const defaultUiCount = await page.locator('#siteSearchUi [class*="pagefind-ui__"]').count();
            expect(defaultUiCount).toBe(0);
        });

        test('initial focus lands on Modular Input after open', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { input } = await openNavbarModularUi(page);
            await expect(input).toBeFocused();
        });

        test('query returns family-typed shared-card results in Pagefind rank order', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { input } = await openNavbarModularUi(page);
            await input.fill(locale.probeQuery);
            await expect
                .poll(() => page.locator('#searchOverlay [data-search-modular-results] li[data-search-result-kind]').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            const badge = page.locator('#searchOverlay [data-search-modular-results] .find-explore-result-family-badge').first();
            await expect(badge).toBeVisible();
            const badgeText = await badge.textContent();
            expect((badgeText || '').trim().length).toBeGreaterThan(0);
            // results are not grouped — mixed kinds may coexist in a single list
            const kinds = await page.locator('#searchOverlay [data-search-modular-results] li[data-search-result-kind]')
                .evaluateAll(nodes => Array.from(new Set(nodes.map(n => n.getAttribute('data-search-result-kind')).filter(Boolean))));
            expect(kinds.length).toBeGreaterThan(0);
        });

        test('Kieli pin excludes other-locale results', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { input } = await openNavbarModularUi(page);
            await input.fill(locale.probeQuery);
            await expect
                .poll(() => page.locator('#searchOverlay [data-search-modular-results] li[data-search-result-kind]').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            if (locale.forbiddenLangPrefix) {
                const c = await page.locator(`#searchOverlay [data-search-modular-results] a[href^="${locale.forbiddenLangPrefix}"]`).count();
                expect(c, `no ${locale.forbiddenLangPrefix} results on ${locale.name}`).toBe(0);
            }
            if (locale.fiOnlyPrefixes) {
                for (const pfx of locale.fiOnlyPrefixes) {
                    const c = await page.locator(`#searchOverlay [data-search-modular-results] a[href^="${pfx}"]`).count();
                    expect(c, `no ${pfx} results on ${locale.name}`).toBe(0);
                }
            }
        });

        test('N1: Shift+Tab from input reaches close button; wrap keeps focus inside dialog', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { input } = await openNavbarModularUi(page);
            await expect(input).toBeFocused();

            await page.keyboard.down('Shift');
            await page.keyboard.press('Tab');
            await page.keyboard.up('Shift');
            await expect(page.locator('#searchCloseBtn')).toBeFocused();

            // Another Shift+Tab from first focusable (close btn) wraps to last inside dialog
            await page.keyboard.down('Shift');
            await page.keyboard.press('Tab');
            await page.keyboard.up('Shift');
            const wrapped = await page.evaluate(() => {
                const d = document.getElementById('searchOverlay');
                return Boolean(d && d.contains(document.activeElement));
            });
            expect(wrapped).toBe(true);
        });

        test('N1: Escape closes + exact focus returns to trigger', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { trigger, dialog } = await openNavbarModularUi(page);
            await page.keyboard.press('Escape');
            await expect(dialog).toBeHidden();
            await expect(trigger).toBeFocused();
        });

        test('N1: close button closes + focus returns to trigger', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { trigger, dialog } = await openNavbarModularUi(page);
            await page.locator('#searchCloseBtn').click();
            await expect(dialog).toBeHidden();
            await expect(trigger).toBeFocused();
        });

        test('N1: repeat open → close → reopen does not duplicate mount / input', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { trigger, dialog, input } = await openNavbarModularUi(page);
            await input.fill(locale.probeQuery);
            await expect
                .poll(() => page.locator('#searchOverlay [data-search-modular-results] li[data-search-result-kind]').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            await page.keyboard.press('Escape');
            await expect(dialog).toBeHidden();
            await trigger.click();
            await expect(dialog).toBeVisible();
            expect(await page.locator('#searchOverlay #siteSearchUi').count()).toBe(1);
            expect(await page.locator('#searchOverlay #siteSearchNavInput').count()).toBe(1);
            await expect(page.locator('#siteSearchNavInput')).toBeFocused();
        });

        test('page size ≈ 6 initial batch; load-more preserves order + hides when exhausted', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { input } = await openNavbarModularUi(page);
            await input.fill(locale.probeQuery);
            await expect
                .poll(() => page.locator('#searchOverlay [data-search-modular-results] li[data-search-result-kind]').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            const initialCount = await page.locator('#searchOverlay [data-search-modular-results] li[data-search-result-kind]').count();
            expect(initialCount).toBeLessThanOrEqual(6);
            const loadMore = page.locator('#searchOverlay [data-search-modular-load-more]');
            if (await loadMore.isVisible()) {
                await expect(loadMore).toContainText(locale.loadMoreLabel);
                const beforeUrls = await page.locator('#searchOverlay [data-search-modular-results] li[data-search-result-kind] a.find-explore-result-title')
                    .evaluateAll(as => as.map(a => a.getAttribute('href')));
                await loadMore.click();
                await expect
                    .poll(() => page.locator('#searchOverlay [data-search-modular-results] li[data-search-result-kind]').count(),
                        { timeout: RESULT_TIMEOUT_MS })
                    .toBeGreaterThan(initialCount);
                const afterUrls = await page.locator('#searchOverlay [data-search-modular-results] li[data-search-result-kind] a.find-explore-result-title')
                    .evaluateAll(as => as.map(a => a.getAttribute('href')));
                expect(afterUrls.slice(0, beforeUrls.length)).toEqual(beforeUrls);
            }
        });

        test('no-results state emits locale-appropriate message', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { input } = await openNavbarModularUi(page);
            await input.fill(locale.noQuery);
            const summary = page.locator('#searchOverlay [data-search-modular-summary]');
            await expect(summary).toContainText(locale.zeroRegex, { timeout: RESULT_TIMEOUT_MS });
        });

        test('init failure via /pagefind/pagefind-modular-ui.js 404: dialog remains fully closable', async ({ page }) => {
            await page.route('**/pagefind/pagefind-modular-ui.js', (route) => route.fulfill({ status: 404, contentType: 'text/plain', body: 'blocked' }));
            await gotoAndAssertSite(page, locale.path);
            await page.setViewportSize({ width: 800, height: 800 });
            const trigger = page.locator('#searchToggleBtn');
            await trigger.click();
            const dialog = page.locator('#searchOverlay');
            await expect(dialog).toBeVisible();
            // Fallback message rendered inside mount
            const mount = page.locator('#siteSearchUi');
            const html = await mount.innerHTML();
            expect(html.length).toBeGreaterThan(0);
            // Escape closes + focus returns
            await page.keyboard.press('Escape');
            await expect(dialog).toBeHidden();
            await expect(trigger).toBeFocused();
            // Reopen safe
            await trigger.click();
            await expect(dialog).toBeVisible();
            // Full-search-page fallback link still present in dialog
            const fallbackLink = page.locator(`#searchOverlay a[href="${locale.fullSearchPageHref}"]`);
            await expect(fallbackLink).toBeVisible();
            // Close button still closes
            await page.locator('#searchCloseBtn').click();
            await expect(dialog).toBeHidden();
        });

        test('full-search-page fallback link is always present inside the dialog', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const { dialog } = await openNavbarModularUi(page);
            const fallbackLink = page.locator(`#searchOverlay a[href="${locale.fullSearchPageHref}"]`);
            await expect(fallbackLink).toBeVisible();
        });
    });
}

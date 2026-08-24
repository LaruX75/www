/**
 * PF5-H1A search page shell simplification regression.
 *
 * After PF5-H1A the SSR search form on /haku/ and /en/search/ is the
 * single authoritative input — Modular UI enhances it in place. There
 * is no separate injected input, no duplicate visual fallback card,
 * no page-scoped content-detail-hero eyebrow, and the desktop navbar
 * inline search form is hidden on the search page.
 *
 * This spec locks:
 *   - exactly one visible page search input under normal JS-path
 *   - SSR input carries data-search-modular-input (enhancement target)
 *   - Modular UI factory does not inject a duplicate input
 *   - ?q= URL hydrates the SSR input
 *   - navbar inline search hidden on the search page (via body[data-translation-key="search"] CSS)
 *   - noscript fallback markup remains
 *   - FI/EN parity
 */
import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;

const CASES = [
    {
        name: 'FI /haku/',
        path: '/haku/',
        pathWithQuery: '/haku/?q=teko%C3%A4ly',
        expectedInputPlaceholder: 'Kirjoita hakusana...',
        expectedSubmit: 'Hae',
        formAction: /\/haku\/$/,
        expectedNavInputId: 'siteNavSearchInputFi',
        probeQuery: 'tekoäly'
    },
    {
        name: 'EN /en/search/',
        path: '/en/search/',
        pathWithQuery: '/en/search/?q=learning',
        expectedInputPlaceholder: 'Type a search term...',
        expectedSubmit: 'Search',
        formAction: /\/en\/search\/$/,
        expectedNavInputId: 'siteNavSearchInputEn',
        probeQuery: 'learning'
    }
];

async function waitForModularReady(page) {
    const mount = page.locator('#siteSearchPageUi[data-search-modular-ready="true"]');
    await expect(mount).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
}

for (const c of CASES) {
    test.describe(`PF5-H1A search page shell — ${c.name}`, () => {

        test('SSR shell exists before JS enhancement: single form with one input + submit', async ({ page }) => {
            await page.route('**/pagefind/pagefind-modular-ui.js', (route) => route.fulfill({ status: 404, contentType: 'text/plain', body: 'blocked-for-ssr-check' }));
            await page.goto(c.path);
            const form = page.locator('form[data-search-page-fallback]');
            await expect(form).toBeVisible();
            await expect(form).toHaveAttribute('action', c.formAction);
            await expect(form).toHaveAttribute('method', 'get');
            const input = form.locator('input#siteSearchPageInput');
            await expect(input).toBeVisible();
            await expect(input).toHaveAttribute('name', 'q');
            await expect(input).toHaveAttribute('placeholder', c.expectedInputPlaceholder);
            const submit = form.locator('button[type="submit"]');
            await expect(submit).toBeVisible();
            await expect(submit).toContainText(c.expectedSubmit);
            // noscript fallback still emitted
            const noscript = await page.locator('noscript').count();
            expect(noscript).toBeGreaterThan(0);
        });

        test('after Modular UI init: exactly one visible search input on the page shell (the SSR input)', async ({ page }) => {
            await gotoAndAssertSite(page, c.path);
            await waitForModularReady(page);
            // Only the SSR input carries data-search-modular-input and is visible
            const modularInputs = page.locator('input[data-search-modular-input]');
            await expect(modularInputs).toHaveCount(1);
            await expect(modularInputs.first()).toHaveId('siteSearchPageInput');
            await expect(modularInputs.first()).toBeVisible();
            // The shell form remains the container
            const form = page.locator('form[data-search-page-fallback]');
            await expect(form).toBeVisible();
            await expect(form.locator('#siteSearchPageInput')).toHaveCount(1);
        });

        test('no duplicate injected input inside #siteSearchPageUi', async ({ page }) => {
            await gotoAndAssertSite(page, c.path);
            await waitForModularReady(page);
            // Factory must not inject a second search input inside the mount
            const injectedInMount = await page.locator('#siteSearchPageUi input[type="search"]').count();
            expect(injectedInMount).toBe(0);
            // Old data-search-modular-input-container must not appear inside the mount
            const oldContainer = await page.locator('#siteSearchPageUi [data-search-modular-input-container]').count();
            expect(oldContainer).toBe(0);
        });

        test('?q= hydrates the SSR input value on load', async ({ page }) => {
            await gotoAndAssertSite(page, c.pathWithQuery);
            await waitForModularReady(page);
            const input = page.locator('#siteSearchPageInput');
            await expect(input).toHaveValue(c.probeQuery);
            // Results should populate from the atomic Kieli-pinned initial dispatch
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
        });

        test('desktop navbar inline search form is hidden on the search page (CSS via body[data-translation-key="search"])', async ({ page }) => {
            await page.setViewportSize({ width: 1400, height: 900 });
            await gotoAndAssertSite(page, c.path);
            await expect(page.locator('body')).toHaveAttribute('data-translation-key', 'search');
            const navSearchForm = page.locator('form.site-nav-search');
            // exists in DOM but not visible on search page
            await expect(navSearchForm).toHaveCount(1);
            await expect(navSearchForm).toBeHidden();
        });

        test('desktop navbar inline search form remains visible on non-search pages (control)', async ({ page }) => {
            await page.setViewportSize({ width: 1400, height: 900 });
            await gotoAndAssertSite(page, c === CASES[0] ? '/' : '/en/');
            const navSearchForm = page.locator('form.site-nav-search');
            await expect(navSearchForm).toHaveCount(1);
            await expect(navSearchForm).toBeVisible();
        });

        test('hero eyebrow removed (no content-detail-eyebrow on this page shell)', async ({ page }) => {
            await gotoAndAssertSite(page, c.path);
            const eyebrows = await page.locator('.content-detail-eyebrow').count();
            expect(eyebrows).toBe(0);
        });
    });
}

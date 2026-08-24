/**
 * PF5-G2 presentations shared-result regression.
 *
 * After PF5-G2 metadata projection, presentations detail pages emit
 * `Sisältö:Esitykset` filter + `PresentationYear/Type/Event` meta.
 * The shared SearchResultPresenter's presentations kind branches (which
 * existed pre-G2 as dead code paths) now activate. This spec asserts
 * global search on /haku/ and /en/search/ renders presentation results
 * with the correct family badge + year + primary-meta shape.
 *
 * Does NOT touch:
 *   - /esitykset/ SSR archive
 *   - navbar N1 dialog lifecycle (covered by pf5-g1-navbar-modular-ui.spec.js)
 *   - /tutkimus/ Research context find-explore (covered by f4-research-find-explore.spec.js)
 */
import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;

const CASES = [
    {
        name: 'FI /haku/',
        path: '/haku/?q=teko%C3%A4ly',
        familyLabel: 'Esitykset',
        forbiddenLangPrefix: '/en/'
    },
    {
        name: 'EN /en/search/',
        path: '/en/search/?q=learning',
        familyLabel: 'Esitykset', // PF3: Finnish family label reused on EN surface (SISALTO_LABELS decision)
        forbiddenLangPrefix: null
    }
];

async function waitForModularReady(page) {
    const mount = page.locator('#siteSearchPageUi[data-search-modular-ready="true"]');
    await expect(mount).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
}

for (const c of CASES) {
    test.describe(`PF5-G2 presentations shared-result — ${c.name}`, () => {

        test('at least one result carries data-search-result-kind="presentations"', async ({ page }) => {
            await gotoAndAssertSite(page, c.path);
            await waitForModularReady(page);
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind="presentations"]').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
        });

        test('presentation result carries family badge "Esitykset"', async ({ page }) => {
            await gotoAndAssertSite(page, c.path);
            await waitForModularReady(page);
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind="presentations"]').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            const badge = page.locator('[data-search-modular-results] li[data-search-result-kind="presentations"] .find-explore-result-family-badge').first();
            await expect(badge).toBeVisible();
            await expect(badge).toContainText(c.familyLabel);
            await expect(badge).toHaveAttribute('data-find-explore-family', 'presentations');
        });

        test('presentation result renders a PresentationYear inside the family header', async ({ page }) => {
            await gotoAndAssertSite(page, c.path);
            await waitForModularReady(page);
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind="presentations"] .find-explore-result-year').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            const yearText = await page.locator('[data-search-modular-results] li[data-search-result-kind="presentations"] .find-explore-result-year').first().textContent();
            expect((yearText || '').trim()).toMatch(/^\d{4}$/);
        });

        test('presentation result renders type in the primary-meta line', async ({ page }) => {
            await gotoAndAssertSite(page, c.path);
            await waitForModularReady(page);
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind="presentations"] .find-explore-result-primary-meta').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            const metaText = await page.locator('[data-search-modular-results] li[data-search-result-kind="presentations"] .find-explore-result-primary-meta').first().textContent();
            expect((metaText || '').trim().length, `primary-meta must be non-empty (got: "${metaText}")`).toBeGreaterThan(0);
        });

        test('presentation title link resolves to a non-empty canonical landing URL', async ({ page }) => {
            // G2 does not add client-side landing resolution. Whatever
            // Pagefind indexed as the result URL is what the presenter
            // uses. For the 135 local presentation detail pages this
            // resolves to a /presentations/{slug}/ path; for indexed
            // pages that Pagefind treats via anchor-based sub-results
            // (e.g. some SSR archive rows expose their outbound source
            // URL to Pagefind) the URL is the source href. Both are
            // valid canonical landings per the audit. Assert only that
            // every presentations result exposes a non-empty href.
            await gotoAndAssertSite(page, c.path);
            await waitForModularReady(page);
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind="presentations"] a.find-explore-result-title').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            const hrefs = await page.locator('[data-search-modular-results] li[data-search-result-kind="presentations"] a.find-explore-result-title')
                .evaluateAll((links) => links.map((a) => a.getAttribute('href') || ''));
            for (const href of hrefs) {
                expect(href.length, 'every presentations result must expose a non-empty title href').toBeGreaterThan(0);
            }
        });

        test('Kieli pin still excludes other-locale presentation results', async ({ page }) => {
            await gotoAndAssertSite(page, c.path);
            await waitForModularReady(page);
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind="presentations"]').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            if (c.forbiddenLangPrefix) {
                const count = await page.locator(`[data-search-modular-results] li[data-search-result-kind="presentations"] a[href^="${c.forbiddenLangPrefix}"]`).count();
                expect(count, `no ${c.forbiddenLangPrefix} presentation results on ${c.name}`).toBe(0);
            }
        });
    });
}

/**
 * Hotfix regression tests — post PF5-H1B two follow-up bugs:
 *
 *   1. Navbar full-results link did not carry the current dialog
 *      query, so clicking "Näytä koko sivulla" / "Open full search
 *      page" landed on plain /haku/ or /en/search/ without ?q=.
 *
 *   2. Sisältö FilterPills displayed numeric counts. Those counts
 *      are Pagefind's own "hits within currently-filtered result
 *      set" numbers — they do NOT sum to All (some hits have no
 *      Sisältö facet value), and they collapse to (0) on every
 *      non-selected domain after any selection, misleading users
 *      into thinking those categories are empty. Since Pagefind
 *      1.5.2 exposes no supported disjunctive-facet-count API,
 *      the hotfix hides the numeric counts on the top-level
 *      Sisältö pills and localises the hardcoded English "All"
 *      reset pill to Kaikki / All. Authoritative filtered result
 *      count remains in the summary line.
 *
 * Preserves H1A / H1B / PF5-G1 invariants.
 */
import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;

async function openNavbarAndSearch(page, inputId, query) {
    await page.fill(`#${inputId}`, query);
    await page.evaluate(() => document.querySelector('form.site-nav-search').requestSubmit());
    await expect(page.locator('#siteSearchUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
    // Give the search dispatch a beat so syncFullSearchLinks fires.
    await page.waitForTimeout(600);
}

test.describe('PF5 hotfix — navbar full-results link carries current query', () => {

    test('FI: navbar dialog full-results href becomes /haku/?q=<current query>', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await gotoAndAssertSite(page, '/');
        await openNavbarAndSearch(page, 'siteNavSearchInputFi', 'tekoäly');
        const href = await page.locator('#searchOverlay a[data-search-page-link]').first().getAttribute('href');
        expect(href, 'full-results link must carry URL-encoded query').toBe('/haku/?q=' + encodeURIComponent('tekoäly'));
    });

    test('FI: clicking the full-results link lands on /haku/ with input hydrated + results rendered', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await gotoAndAssertSite(page, '/');
        await openNavbarAndSearch(page, 'siteNavSearchInputFi', 'tekoäly');
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
            page.evaluate(() => document.querySelector('#searchOverlay a[data-search-page-link]').click())
        ]);
        await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        expect(page.url()).toContain('/haku/?q=');
        await expect(page.locator('#siteSearchPageInput')).toHaveValue('tekoäly');
        await expect
            .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(),
                { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(0);
    });

    test('EN: navbar dialog full-results href becomes /en/search/?q=<current query>', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await gotoAndAssertSite(page, '/en/');
        await openNavbarAndSearch(page, 'siteNavSearchInputEn', 'learning');
        const href = await page.locator('#searchOverlay a[data-search-page-link]').first().getAttribute('href');
        expect(href).toBe('/en/search/?q=learning');
    });

    test('with empty query, full-results href stays plain /haku/ (no ?q=)', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await gotoAndAssertSite(page, '/');
        // Open dialog via trigger with no query (mobile trigger works cross-viewport too)
        await page.evaluate(() => {
            const t = document.getElementById('searchToggleBtn');
            if (t && t.offsetParent !== null) { t.click(); return; }
            // Desktop XL: click submit on empty inline form instead
            const form = document.querySelector('form.site-nav-search');
            form.requestSubmit();
        });
        await expect(page.locator('#siteSearchUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        await page.waitForTimeout(500);
        const href = await page.locator('#searchOverlay a[data-search-page-link]').first().getAttribute('href');
        expect(href).toBe('/haku/');
    });
});

test.describe('PF5 hotfix — Sisältö pill counts hidden + "All" localised', () => {

    test('FI /haku/ Sisältö pills show label only, no "(N)" counts', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/?q=' + encodeURIComponent('tekoäly'));
        await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        await expect
            .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(),
                { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(0);
        // Give the mutation-observer strip a beat
        await page.waitForTimeout(700);
        const pillTexts = await page.evaluate(() => {
            const s = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
                .find(x => x.dataset.searchModularFilterName === 'Sisältö');
            return Array.from(s.querySelectorAll('button.pagefind-modular-filter-pill'))
                .map(b => (b.textContent || '').trim());
        });
        for (const t of pillTexts) {
            expect(t, `pill "${t}" must not contain a numeric count`).not.toMatch(/\(\d+\)/);
        }
    });

    test('FI: "All" reset pill is localised to "Kaikki" (label + aria-label)', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/?q=' + encodeURIComponent('tekoäly'));
        await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        await expect
            .poll(() => page.locator('.pagefind-modular-filter-pill').count(),
                { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(1);
        await page.waitForTimeout(700);
        const first = await page.evaluate(() => {
            const s = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
                .find(x => x.dataset.searchModularFilterName === 'Sisältö');
            const btn = s.querySelector('button.pagefind-modular-filter-pill');
            const span = btn.querySelector('span[aria-label]');
            return { text: (btn.textContent || '').trim(), ariaLabel: span?.getAttribute('aria-label') };
        });
        expect(first.text).toBe('Kaikki');
        expect(first.ariaLabel).toBe('Kaikki');
    });

    test('EN: "All" reset pill remains "All" (label + aria-label)', async ({ page }) => {
        await gotoAndAssertSite(page, '/en/search/?q=learning');
        await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        await expect
            .poll(() => page.locator('.pagefind-modular-filter-pill').count(),
                { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(1);
        await page.waitForTimeout(700);
        const first = await page.evaluate(() => {
            const s = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
                .find(x => x.dataset.searchModularFilterName === 'Sisältö');
            const btn = s.querySelector('button.pagefind-modular-filter-pill');
            const span = btn.querySelector('span[aria-label]');
            return { text: (btn.textContent || '').trim(), ariaLabel: span?.getAttribute('aria-label') };
        });
        expect(first.text).toBe('All');
        expect(first.ariaLabel).toBe('All');
    });

    test('selecting a domain does not restore "(0)" counts on other pills', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/?q=' + encodeURIComponent('tekoäly'));
        await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        await expect
            .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(),
                { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(0);
        await page.waitForTimeout(700);
        await page.evaluate(() => {
            const s = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
                .find(x => x.dataset.searchModularFilterName === 'Sisältö');
            const btn = Array.from(s.querySelectorAll('button.pagefind-modular-filter-pill'))
                .find(b => (b.querySelector('span[aria-label]')?.getAttribute('aria-label') || '').trim() === 'Julkaisut');
            btn.click();
        });
        await page.waitForTimeout(1000);
        const pillTexts = await page.evaluate(() => {
            const s = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
                .find(x => x.dataset.searchModularFilterName === 'Sisältö');
            return Array.from(s.querySelectorAll('button.pagefind-modular-filter-pill'))
                .map(b => (b.textContent || '').trim());
        });
        for (const t of pillTexts) {
            expect(t, `pill "${t}" must not contain any numeric count after selection either`).not.toMatch(/\(\d+\)/);
        }
    });

    test('summary line still displays the authoritative filtered result count', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/?q=' + encodeURIComponent('tekoäly'));
        await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        await expect
            .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(),
                { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(0);
        const summaryText = await page.locator('[data-search-modular-summary]').textContent();
        expect(summaryText?.trim() || '').toMatch(/\d+\s+tulos(ta)?/);
    });
});

/**
 * PF5 hotfix — search UI regressions after H1B closure.
 *
 * Locks the three fixes:
 *  1. Dark theme: FilterPill text uses theme-aware colours (readable).
 *  2. Result list: no browser-default bullet marker, non-zero gap.
 *  3. Navbar: submitting the inline navbar form opens the dialog with
 *     the query prefilled — does NOT navigate to /haku/ (which was
 *     the regression that made the navbar field appear to "disappear"
 *     after search because H1A hides it on the search page).
 *
 * Native form-submission fallback (JS disabled) is preserved by
 * keeping `action="/haku/"` on the form — this spec runs under JS so
 * the interception path is what we lock here.
 */
import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;

test.describe('PF5 hotfix — result list bullet + spacing', () => {

    test('/haku/ result container has no bullet marker and non-zero gap between cards', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await gotoAndAssertSite(page, '/haku/?q=teko%C3%A4ly');
        await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        await expect
            .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(),
                { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(1);
        const layout = await page.evaluate(() => {
            const c = document.querySelector('[data-search-modular-results]');
            const cs = c ? getComputedStyle(c) : null;
            const items = Array.from(document.querySelectorAll('[data-search-modular-results] li[data-search-result-kind]')).slice(0, 3);
            const liListStyle = items[0] ? getComputedStyle(items[0]).listStyleType : null;
            const gap = items.length >= 2
                ? Math.round(items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().bottom)
                : null;
            return {
                containerListStyle: cs?.listStyleType,
                containerDisplay: cs?.display,
                containerGap: cs?.gap,
                liListStyle,
                gapBetweenLi: gap
            };
        });
        expect(layout.containerListStyle, 'container must not render list markers').toBe('none');
        expect(layout.liListStyle, 'result li must not render list markers').toBe('none');
        expect(layout.gapBetweenLi, 'result cards must be separated by non-zero gap').toBeGreaterThan(0);
    });
});

test.describe('PF5 hotfix — FilterPills contrast on dark theme', () => {

    test('unselected pills carry theme-adaptive text colour on dark theme (readable)', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
        await gotoAndAssertSite(page, '/haku/?q=teko%C3%A4ly');
        await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        await expect
            .poll(() => page.locator('.pagefind-modular-filter-pill').count(),
                { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(1);
        const contrast = await page.evaluate(() => {
            const parseRgb = (s) => {
                const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s);
                return m ? [+m[1], +m[2], +m[3]] : null;
            };
            const luminance = ([r, g, b]) => {
                const norm = [r, g, b].map(v => {
                    const s = v / 255;
                    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
                });
                return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2];
            };
            const contrastRatio = (a, b) => {
                const la = luminance(a);
                const lb = luminance(b);
                const [hi, lo] = la > lb ? [la, lb] : [lb, la];
                return (hi + 0.05) / (lo + 0.05);
            };
            const pills = Array.from(document.querySelectorAll('.pagefind-modular-filter-pill[aria-pressed="false"]')).slice(0, 2);
            return pills.map(p => {
                const cs = getComputedStyle(p);
                const c = parseRgb(cs.color);
                const bg = parseRgb(cs.backgroundColor);
                return {
                    color: cs.color,
                    bg: cs.backgroundColor,
                    contrast: c && bg ? +contrastRatio(c, bg).toFixed(2) : null
                };
            });
        });
        expect(contrast.length).toBeGreaterThan(0);
        for (const p of contrast) {
            expect(p.contrast, `pill text must have AA contrast (≥4.5:1) on dark theme; got ${p.contrast}:1 (${p.color} on ${p.bg})`).toBeGreaterThanOrEqual(4.5);
        }
    });

    test('selected pill contrast on dark theme is readable', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
        await gotoAndAssertSite(page, '/haku/?q=teko%C3%A4ly');
        await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        await expect
            .poll(() => page.locator('.pagefind-modular-filter-pill[aria-pressed="true"]').count(),
                { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(0);
        const c = await page.evaluate(() => {
            const parseRgb = (s) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s); return m ? [+m[1], +m[2], +m[3]] : null; };
            const luminance = ([r, g, b]) => { const norm = [r, g, b].map(v => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }); return 0.2126 * norm[0] + 0.7152 * norm[1] + 0.0722 * norm[2]; };
            const ratio = (a, b) => { const la = luminance(a), lb = luminance(b); const [hi, lo] = la > lb ? [la, lb] : [lb, la]; return (hi + 0.05) / (lo + 0.05); };
            const p = document.querySelector('.pagefind-modular-filter-pill[aria-pressed="true"]');
            const cs = getComputedStyle(p);
            const col = parseRgb(cs.color), bg = parseRgb(cs.backgroundColor);
            return { color: cs.color, bg: cs.backgroundColor, contrast: col && bg ? +ratio(col, bg).toFixed(2) : null };
        });
        expect(c.contrast, `selected pill contrast must be ≥4.5:1 on dark theme; got ${c.contrast}:1 (${c.color} on ${c.bg})`).toBeGreaterThanOrEqual(4.5);
    });
});

test.describe('PF5 hotfix — navbar form submit opens dialog', () => {

    test('desktop navbar form submit opens dialog with query prefilled (no full-page navigation)', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await gotoAndAssertSite(page, '/');
        const startUrl = page.url();
        await page.fill('#siteNavSearchInputFi', 'tekoäly');

        let navigatedAway = false;
        page.on('framenavigated', (frame) => {
            if (frame === page.mainFrame() && !page.url().startsWith(startUrl)) navigatedAway = true;
        });

        await page.evaluate(() => document.querySelector('form.site-nav-search').requestSubmit());
        await page.waitForTimeout(1200);

        expect(page.url(), 'must not navigate to /haku/').toBe(startUrl);
        expect(navigatedAway, 'must not fire full-page navigation').toBe(false);
        await expect(page.locator('#searchOverlay')).toHaveAttribute('open', '');
        await expect(page.locator('#siteSearchNavInput')).toBeVisible();
        await expect(page.locator('#siteSearchNavInput')).toHaveValue('tekoäly');
    });

    test('after closing the dialog with Escape, navbar inline form remains visible on home', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await gotoAndAssertSite(page, '/');
        await page.fill('#siteNavSearchInputFi', 'tekoäly');
        await page.evaluate(() => document.querySelector('form.site-nav-search').requestSubmit());
        await expect(page.locator('#searchOverlay')).toHaveAttribute('open', '', { timeout: RESULT_TIMEOUT_MS });
        await page.keyboard.press('Escape');
        await expect(page.locator('#searchOverlay')).toBeHidden();
        await expect(page.locator('form.site-nav-search')).toBeVisible();
        await expect(page.locator('#siteNavSearchInputFi')).toBeVisible();
    });

    test('SSR form action="/haku/" preserved as JS-disabled fallback', async ({ page }) => {
        await gotoAndAssertSite(page, '/');
        const action = await page.locator('form.site-nav-search').getAttribute('action');
        const method = await page.locator('form.site-nav-search').getAttribute('method');
        expect(action, 'form action must remain /haku/ so JS-disabled users still reach the full search page').toBe('/haku/');
        expect(method).toBe('get');
    });

    test('EN navbar form submit opens dialog on /en/ home (parity)', async ({ page }) => {
        await page.setViewportSize({ width: 1400, height: 900 });
        await gotoAndAssertSite(page, '/en/');
        const startUrl = page.url();
        await page.fill('#siteNavSearchInputEn', 'learning');
        await page.evaluate(() => document.querySelector('form.site-nav-search').requestSubmit());
        await page.waitForTimeout(1200);
        expect(page.url()).toBe(startUrl);
        await expect(page.locator('#searchOverlay')).toHaveAttribute('open', '');
        await expect(page.locator('#siteSearchNavInput')).toHaveValue('learning');
    });
});

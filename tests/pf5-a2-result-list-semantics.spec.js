import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;

async function openNavbarModularUi(page) {
    await page.setViewportSize({ width: 800, height: 800 });
    await gotoAndAssertSite(page, '/');
    await page.locator('#searchToggleBtn').click();
    await expect(page.locator('#searchOverlay')).toHaveAttribute('open', '');
    await expect(page.locator('#siteSearchUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
    const input = page.locator('#siteSearchNavInput');
    await input.fill('tekoäly');
    await expect
        .poll(() => page.locator('#searchOverlay [data-search-modular-results] > li[data-search-result-kind]').count(),
            { timeout: RESULT_TIMEOUT_MS })
        .toBeGreaterThan(0);
}

async function openSearchPage(page, path, query) {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoAndAssertSite(page, `${path}?q=${query}`);
    await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
    await expect
        .poll(() => page.locator('[data-search-modular-results] > li[data-search-result-kind]').count(),
            { timeout: RESULT_TIMEOUT_MS })
        .toBeGreaterThan(0);
}

async function readResultListLayout(page, selector) {
    return page.locator(selector).evaluate((list) => {
        const items = Array.from(list.querySelectorAll(':scope > li[data-search-result-kind]')).slice(0, 3);
        const gapBetweenItems = items.length >= 2
            ? Math.round(items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().bottom)
            : null;
        const style = getComputedStyle(list);
        return {
            tagName: list.tagName,
            directChildTags: Array.from(list.children).map((node) => node.tagName),
            directLiCount: list.querySelectorAll(':scope > li').length,
            renderedResultCount: items.length,
            listStyleType: style.listStyleType,
            paddingLeft: style.paddingLeft,
            display: style.display,
            gap: style.gap,
            gapBetweenItems
        };
    });
}

test.describe('PF5-A2 result-list semantics', () => {

    test('navbar dialog mounts results in a semantic list with li children', async ({ page }) => {
        await openNavbarModularUi(page);
        const layout = await readResultListLayout(page, '#searchOverlay [data-search-modular-results]');
        expect(layout.tagName).toBe('UL');
        expect(layout.directLiCount).toBeGreaterThan(0);
        expect(layout.renderedResultCount).toBeGreaterThan(1);
        expect(layout.directChildTags.every((tag) => tag === 'LI')).toBe(true);
        expect(layout.listStyleType).toBe('none');
        expect(layout.paddingLeft).toBe('0px');
        expect(layout.display).toBe('grid');
        expect(layout.gapBetweenItems).toBeGreaterThan(0);
    });

    test('/haku/ keeps shared-card spacing while using a semantic list container', async ({ page }) => {
        await openSearchPage(page, '/haku/', 'teko%C3%A4ly');
        const layout = await readResultListLayout(page, '[data-search-modular-results]');
        expect(layout.tagName).toBe('UL');
        expect(layout.directLiCount).toBeGreaterThan(0);
        expect(layout.renderedResultCount).toBeGreaterThan(1);
        expect(layout.directChildTags.every((tag) => tag === 'LI')).toBe(true);
        expect(layout.listStyleType).toBe('none');
        expect(layout.paddingLeft).toBe('0px');
        expect(layout.display).toBe('grid');
        expect(layout.gapBetweenItems).toBeGreaterThan(0);
    });

    test('/en/search/ gets the same semantic list structure', async ({ page }) => {
        await openSearchPage(page, '/en/search/', 'learning');
        const layout = await readResultListLayout(page, '[data-search-modular-results]');
        expect(layout.tagName).toBe('UL');
        expect(layout.directLiCount).toBeGreaterThan(0);
        expect(layout.renderedResultCount).toBeGreaterThan(1);
        expect(layout.directChildTags.every((tag) => tag === 'LI')).toBe(true);
        expect(layout.listStyleType).toBe('none');
        expect(layout.paddingLeft).toBe('0px');
        expect(layout.display).toBe('grid');
        expect(layout.gapBetweenItems).toBeGreaterThan(0);
    });
});

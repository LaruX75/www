import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;

async function waitForModularReady(page) {
    await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
}

async function waitForResults(page) {
    await expect
        .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), {
            timeout: RESULT_TIMEOUT_MS
        })
        .toBeGreaterThan(0);
}

async function clickFacetByVisibleText(page, filterName, value) {
    const clicked = await page.evaluate(({ filterName: name, value: target }) => {
        const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();
        const slot = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .find((s) => !s.hidden && s.dataset.searchModularFilterName === name);
        if (!slot) return false;
        const btn = Array.from(slot.querySelectorAll('button.pagefind-modular-filter-pill'))
            .find((candidate) => normalize(candidate.textContent) === target);
        if (!btn) return false;
        btn.click();
        return true;
    }, { filterName, value });
    expect(clicked, `expected to click visible ${filterName}:${value}`).toBe(true);
    await page.waitForTimeout(900);
}

async function visibleFacetSnapshot(page) {
    return page.evaluate(() => {
        const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim();
        return Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .filter((slot) => !slot.hidden)
            .map((slot) => ({
                filterName: slot.dataset.searchModularFilterName,
                label: slot.dataset.searchModularFilterLabel,
                values: Array.from(slot.querySelectorAll('.pagefind-modular-filter-pill > span')).map((n) => normalize(n.textContent))
            }));
    });
}

test.describe('PF5-A3B.1 facet presenter layout + localization', () => {
    test('desktop layout uses wrapping rows with no forced one-pill-per-row regression', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 1200 });
        await gotoAndAssertSite(page, '/haku/?q=' + encodeURIComponent('tekoäly'));
        await waitForModularReady(page);
        await waitForResults(page);

        await clickFacetByVisibleText(page, 'Sisältö', 'Esitykset');

        const layout = await page.evaluate(() => {
            const slot = document.querySelector('[data-search-modular-filter-slot][data-search-modular-filter-name="PresentationYear"]');
            const wrapper = slot?.querySelector('.pagefind-modular-filter-pills-wrapper');
            const pills = Array.from(wrapper?.querySelectorAll('.pagefind-modular-filter-pill') || []).slice(0, 3);
            const rects = pills.map((pill) => {
                const rect = pill.getBoundingClientRect();
                return {
                    top: Math.round(rect.top),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right)
                };
            });
            return {
                pageScrollWidth: document.documentElement.scrollWidth,
                pageWidth: window.innerWidth,
                slotDisplay: slot ? getComputedStyle(slot).display : null,
                wrapperDisplay: wrapper ? getComputedStyle(wrapper).display : null,
                wrapperFlexWrap: wrapper ? getComputedStyle(wrapper).flexWrap : null,
                rects
            };
        });

        expect(layout.slotDisplay).toBe('flex');
        expect(layout.wrapperDisplay).toBe('flex');
        expect(layout.wrapperFlexWrap).toBe('wrap');
        expect(layout.pageScrollWidth).toBeLessThanOrEqual(layout.pageWidth);
        expect(layout.rects.length).toBeGreaterThanOrEqual(2);
        expect(Math.abs(layout.rects[0].top - layout.rects[1].top)).toBeLessThanOrEqual(4);
    });

    test('FI search localizes controlled-vocabulary facet values across representative domains', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/?q=' + encodeURIComponent('tekoäly'));
        await waitForModularReady(page);
        await waitForResults(page);

        await clickFacetByVisibleText(page, 'Sisältö', 'Julkaisut');
        const publications = await visibleFacetSnapshot(page);
        expect(publications.find((slot) => slot.filterName === 'Publications group')?.values).toContain('A - Vertaisarvioidut tieteelliset artikkelit (28)');
        expect(publications.find((slot) => slot.filterName === 'Publications quality')?.values).toContain('Vertaisarvioitu (36)');

        await gotoAndAssertSite(page, '/haku/?q=' + encodeURIComponent('tekoäly'));
        await waitForModularReady(page);
        await waitForResults(page);
        await clickFacetByVisibleText(page, 'Sisältö', 'Mediassa');
        const media = await visibleFacetSnapshot(page);
        expect(media.find((slot) => slot.filterName === 'Mediatyyppi')?.values).toContain('Lehtijuttu (54)');
        expect(media.find((slot) => slot.filterName === 'Rooli')?.values).toContain('Minusta tehty (63)');

        await gotoAndAssertSite(page, '/haku/?q=' + encodeURIComponent('tekoäly'));
        await waitForModularReady(page);
        await waitForResults(page);
        await clickFacetByVisibleText(page, 'Sisältö', 'Kirjoitukset ja puheenvuorot');
        const writings = await visibleFacetSnapshot(page);
        expect(writings.find((slot) => slot.filterName === 'Writings content type')?.values).toEqual([
            'Blogi (4)',
            'Kolumnit (1)',
            'Puheenvuorot (2)',
            'Lausunnot (6)'
        ]);
    });

    test('EN search localizes controlled vocabulary without forcing proper-name topic translation', async ({ page }) => {
        await gotoAndAssertSite(page, '/en/search/?q=learning');
        await waitForModularReady(page);
        await waitForResults(page);

        const initial = await visibleFacetSnapshot(page);
        expect(initial.find((slot) => slot.filterName === 'Sisältö')?.values).toEqual([
            'All',
            'Presentations',
            'Media',
            'Theses'
        ]);

        await clickFacetByVisibleText(page, 'Sisältö', 'Theses');
        const theses = await visibleFacetSnapshot(page);
        expect(theses.find((slot) => slot.filterName === 'Theses type')?.values).toContain("Master's theses (18)");
        expect(theses.find((slot) => slot.filterName === 'Theses role')?.values).toContain('Supervised (16)');

        await gotoAndAssertSite(page, '/en/search/?q=learning');
        await waitForModularReady(page);
        await waitForResults(page);
        await clickFacetByVisibleText(page, 'Sisältö', 'Media');
        const media = await visibleFacetSnapshot(page);
        expect(media.find((slot) => slot.filterName === 'Mediatyyppi')?.values).toContain('Video (1)');
        expect(media.find((slot) => slot.filterName === 'Rooli')?.values).toContain('About my work (1)');

        await gotoAndAssertSite(page, '/en/search/?q=learning');
        await waitForModularReady(page);
        await waitForResults(page);
        await clickFacetByVisibleText(page, 'Sisältö', 'Presentations');
        const presentations = await visibleFacetSnapshot(page);
        const topicValues = presentations.find((slot) => slot.filterName === 'PresentationTopic')?.values || [];
        expect(topicValues).toContain('AI literacy (8)');
        expect(topicValues).toContain('blogit (1)');
    });

    test('mobile layout wraps naturally without horizontal overflow', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await gotoAndAssertSite(page, '/haku/?q=' + encodeURIComponent('tekoäly'));
        await waitForModularReady(page);
        await waitForResults(page);

        await clickFacetByVisibleText(page, 'Sisältö', 'Esitykset');

        const mobile = await page.evaluate(() => {
            const slot = document.querySelector('[data-search-modular-filter-slot][data-search-modular-filter-name="PresentationYear"]');
            const wrapper = slot?.querySelector('.pagefind-modular-filter-pills-wrapper');
            return {
                pageWidth: window.innerWidth,
                pageScrollWidth: document.documentElement.scrollWidth,
                wrapperDisplay: wrapper ? getComputedStyle(wrapper).display : null,
                wrapperFlexWrap: wrapper ? getComputedStyle(wrapper).flexWrap : null
            };
        });

        expect(mobile.wrapperDisplay).toBe('flex');
        expect(mobile.wrapperFlexWrap).toBe('wrap');
        expect(mobile.pageScrollWidth).toBeLessThanOrEqual(mobile.pageWidth);
    });
});

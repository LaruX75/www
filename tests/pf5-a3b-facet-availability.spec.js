import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;

async function waitForModularReady(page) {
    await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
}

async function waitForSummary(page, pattern) {
    await expect(page.locator('[data-search-modular-summary]')).toContainText(pattern, { timeout: RESULT_TIMEOUT_MS });
}

async function waitForResults(page) {
    await expect
        .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), {
            timeout: RESULT_TIMEOUT_MS
        })
        .toBeGreaterThan(0);
}

async function waitForNoResults(page) {
    await expect
        .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), {
            timeout: RESULT_TIMEOUT_MS
        })
        .toBe(0);
}

async function fillSearchQuery(page, query) {
    await page.fill('#siteSearchPageInput', query);
    await page.waitForTimeout(900);
}

async function clickFacetValue(page, filterName, value) {
    const clicked = await page.evaluate(({ filterName: name, value: target }) => {
        const slot = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .find((s) => !s.hidden && s.dataset.searchModularFilterName === name);
        if (!slot) return false;
        const btn = Array.from(slot.querySelectorAll('button.pagefind-modular-filter-pill'))
            .find((candidate) => (candidate.querySelector('span[aria-label]')?.getAttribute('aria-label') || '').trim() === target);
        if (!btn) return false;
        btn.click();
        return true;
    }, { filterName, value });
    expect(clicked, `expected to click ${filterName}:${value}`).toBe(true);
    await page.waitForTimeout(900);
}

async function visibleFilterNames(page) {
    return page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .filter((slot) => !slot.hidden)
            .map((slot) => slot.dataset.searchModularFilterName)
    );
}

async function visibleFacetValues(page, filterName) {
    return page.evaluate((name) => {
        const slot = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .find((s) => !s.hidden && s.dataset.searchModularFilterName === name);
        if (!slot) return [];
        return Array.from(slot.querySelectorAll('button.pagefind-modular-filter-pill > span[aria-label]'))
            .map((span) => (span.getAttribute('aria-label') || '').trim())
            .filter(Boolean);
    }, filterName);
}

async function activeFacetValues(page, filterName) {
    return page.evaluate((name) => {
        const slot = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .find((s) => !s.hidden && s.dataset.searchModularFilterName === name);
        if (!slot) return [];
        return Array.from(slot.querySelectorAll('button.pagefind-modular-filter-pill[aria-pressed="true"] > span[aria-label]'))
            .map((span) => (span.getAttribute('aria-label') || '').trim())
            .filter(Boolean);
    }, filterName);
}

async function findRecoveryQuery(page, domain, activeFilters, candidates) {
    const recovery = await page.evaluate(async ({ domain: activeDomain, activeFilters: filters, candidates: probeQueries }) => {
        const pagefind = await import('/pagefind/pagefind.js');
        await pagefind.options({ baseUrl: '/' });

        for (const query of probeQueries) {
            const domainOnly = await pagefind.search(query, {
                filters: {
                    "Sisältö": [activeDomain]
                }
            });
            if ((domainOnly.results || []).length <= 0) continue;

            const constrained = await pagefind.search(query, {
                filters: {
                    "Sisältö": [activeDomain],
                    ...Object.fromEntries(
                        Object.entries(filters).map(([name, value]) => [name, [value]])
                    )
                }
            });
            if ((constrained.results || []).length === 0) {
                return {
                    query,
                    domainCount: domainOnly.results.length,
                    constrainedCount: 0
                };
            }
        }

        return null;
    }, { domain, activeFilters, candidates });

    expect(recovery, 'expected a recovery query with domain hits but zero results under the active secondary filter').not.toBeNull();
    return recovery;
}

test.describe('PF5-A3B facet availability presenter', () => {
    test('FI: secondary groups expose only meaningful replacement values and clear stale state on domain switch', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/?q=' + encodeURIComponent('tekoäly'));
        await waitForModularReady(page);
        await waitForResults(page);

        await clickFacetValue(page, 'Sisältö', 'Esitykset');

        const visibleAfterDomain = await visibleFilterNames(page);
        expect(visibleAfterDomain).toEqual(['Sisältö', 'PresentationYear', 'PresentationTopic']);

        const yearsAtDomain = await visibleFacetValues(page, 'PresentationYear');
        expect(yearsAtDomain).toContain('2024');
        expect(yearsAtDomain).toContain('2025');
        expect(yearsAtDomain).toContain('2026');
        expect(yearsAtDomain).not.toContain('2007');

        await clickFacetValue(page, 'PresentationYear', '2025');
        expect(await activeFacetValues(page, 'PresentationYear')).toEqual(['2025']);

        const topicsAt2025 = await visibleFacetValues(page, 'PresentationTopic');
        expect(topicsAt2025).toContain('AI literacy');
        expect(topicsAt2025).toContain('Generation AI');

        await clickFacetValue(page, 'PresentationTopic', 'AI literacy');
        expect(await activeFacetValues(page, 'PresentationTopic')).toEqual(['AI literacy']);

        const yearsAt2025AndTopic = await visibleFacetValues(page, 'PresentationYear');
        expect(yearsAt2025AndTopic).toContain('2024');
        expect(yearsAt2025AndTopic).toContain('2025');
        expect(yearsAt2025AndTopic).toContain('2026');
        expect(yearsAt2025AndTopic).not.toContain('2014');

        await clickFacetValue(page, 'Sisältö', 'Mediassa');
        const visibleAfterSwitch = await visibleFilterNames(page);
        expect(visibleAfterSwitch).toEqual(['Sisältö', 'Mediatyyppi', 'Rooli', 'Vuosi']);
    });

    test('EN: domain selection exposes meaningful secondary groups and years', async ({ page }) => {
        await gotoAndAssertSite(page, '/en/search/?q=learning');
        await waitForModularReady(page);
        await waitForResults(page);

        await clickFacetValue(page, 'Sisältö', 'Esitykset');
        expect(await activeFacetValues(page, 'Sisältö')).toEqual(['Esitykset']);
        expect(await visibleFilterNames(page)).toEqual(['Sisältö', 'PresentationYear', 'PresentationTopic']);

        const years = await visibleFacetValues(page, 'PresentationYear');
        expect(years).toContain('2021');
        expect(years).not.toContain('2007');

        await clickFacetValue(page, 'PresentationYear', '2021');
        expect(await activeFacetValues(page, 'PresentationYear')).toEqual(['2021']);
        expect(await visibleFilterNames(page)).toEqual(['Sisältö', 'PresentationYear']);
        await waitForSummary(page, /1 result/i);

        const recovery = await findRecoveryQuery(page, 'Esitykset', { PresentationYear: '2021' }, [
            'social media',
            'mobile learning',
            'robotics',
            'fab lab',
            'science'
        ]);

        await fillSearchQuery(page, recovery.query);
        await waitForSummary(page, /No results/i);
        await waitForNoResults(page);
        expect(await activeFacetValues(page, 'Sisältö')).toEqual(['Esitykset']);
        expect(await activeFacetValues(page, 'PresentationYear')).toEqual(['2021']);
        expect(await visibleFilterNames(page)).toEqual(['Sisältö', 'PresentationYear']);

        await clickFacetValue(page, 'PresentationYear', 'All');
        expect(await activeFacetValues(page, 'PresentationYear')).toEqual([]);
        await waitForResults(page);
        const visibleAfterRecovery = await visibleFilterNames(page);
        expect(visibleAfterRecovery[0]).toBe('Sisältö');
    });
});

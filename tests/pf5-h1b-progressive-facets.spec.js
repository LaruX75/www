/**
 * PF5-A3A regression coverage for the historical PF5-H1B progressive
 * facet surface.
 *
 * A3A changes only the top-level Sisältö facet semantics:
 *   - Sisältö is now single-select
 *   - switching Sisältö values replaces the prior selection
 *   - hidden domain-specific secondary filters are cleared when the
 *     top-level domain changes or when Kaikki / All is selected
 *
 * Pagefind remains the filter-state owner throughout.
 */
import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;
const INITIAL_RENDER_LIMIT = 10;

const DOMAIN_SECONDARY_FACETS = {
    "Julkaisut": ["Publications group", "Publications quality"],
    "Kirjoitukset ja puheenvuorot": ["Writings content type", "Writings topic"],
    "Opinnäytteet": ["Theses type", "Theses role"],
    "Mediassa": ["Mediatyyppi", "Rooli", "Vuosi"],
    "Esitykset": ["PresentationYear", "PresentationTopic"]
};

const LOCALES = [
    {
        name: 'FI /haku/',
        path: '/haku/',
        probeQuery: 'tekoäly',
        languageFilter: 'Suomi'
    },
    {
        name: 'EN /en/search/',
        path: '/en/search/',
        probeQuery: 'learning',
        languageFilter: 'English'
    }
];

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

async function primeQuery(page, query) {
    await page.fill('#siteSearchPageInput', query);
    await waitForResults(page);
    await page.waitForTimeout(600);
}

async function clickFilterValue(page, filterName, value) {
    const acceptValues = value === 'All'
        ? ['All', 'Kaikki']
        : [value];
    const clicked = await page.evaluate(({ filterName: name, values }) => {
        const slot = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .find((s) => s.dataset.searchModularFilterName === name);
        if (!slot) return false;
        const btn = Array.from(slot.querySelectorAll('button.pagefind-modular-filter-pill'))
            .find((b) => values.includes((b.querySelector('span[aria-label]')?.getAttribute('aria-label') || '').trim()));
        if (!btn) return false;
        btn.click();
        return true;
    }, { filterName, values: acceptValues });
    if (clicked) await page.waitForTimeout(700);
    return clicked;
}

async function activateFilterValueWithKeyboard(page, filterName, value, key = 'Enter') {
    const focused = await page.evaluate(({ filterName: name, value: target }) => {
        const acceptValues = target === 'All' ? ['All', 'Kaikki'] : [target];
        const slot = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .find((s) => s.dataset.searchModularFilterName === name);
        if (!slot) return false;
        const btn = Array.from(slot.querySelectorAll('button.pagefind-modular-filter-pill'))
            .find((b) => acceptValues.includes((b.querySelector('span[aria-label]')?.getAttribute('aria-label') || '').trim()));
        if (!btn) return false;
        btn.focus();
        return document.activeElement === btn;
    }, { filterName, value });
    expect(focused, `expected to focus ${filterName}:${value}`).toBe(true);
    await page.keyboard.press(key);
    await page.waitForTimeout(700);
}

async function visibleFilterNames(page) {
    return page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .filter((slot) => !slot.hidden && slot.querySelector('.pagefind-modular-filter-pills-wrapper'))
            .map((slot) => slot.dataset.searchModularFilterName)
    );
}

async function activeFilterLabels(page, filterName) {
    return page.evaluate((name) => {
        const slot = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .find((s) => s.dataset.searchModularFilterName === name);
        if (!slot) return [];
        return Array.from(slot.querySelectorAll('.pagefind-modular-filter-pill[aria-pressed="true"]'))
            .map((btn) => (btn.querySelector('span[aria-label]')?.getAttribute('aria-label') || '').trim())
            .filter(Boolean);
    }, filterName);
}

async function activeConcretePillCount(page, filterNames) {
    return page.evaluate((names) => {
        const accepted = new Set(names);
        const isReset = (value) => value === 'All' || value === 'Kaikki';
        return Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .filter((slot) => accepted.has(slot.dataset.searchModularFilterName))
            .reduce((count, slot) => (
                count
                + Array.from(slot.querySelectorAll('.pagefind-modular-filter-pill[aria-pressed="true"]'))
                    .filter((btn) => {
                        const label = (btn.querySelector('span[aria-label]')?.getAttribute('aria-label') || '').trim();
                        return label && !isReset(label);
                    })
                    .length
            ), 0);
    }, filterNames);
}

async function clickFirstConcretePill(page, filterNames) {
    const clicked = await page.evaluate((names) => {
        const isReset = (value) => value === 'All' || value === 'Kaikki';
        for (const filterName of names) {
            const slot = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
                .find((s) => s.dataset.searchModularFilterName === filterName && !s.hidden);
            if (!slot) continue;
            const btn = Array.from(slot.querySelectorAll('button.pagefind-modular-filter-pill'))
                .find((candidate) => {
                    const label = (candidate.querySelector('span[aria-label]')?.getAttribute('aria-label') || '').trim();
                    return label && !isReset(label);
                });
            if (!btn) continue;
            btn.click();
            return filterName;
        }
        return null;
    }, filterNames);
    if (clicked) await page.waitForTimeout(800);
    return clicked;
}

async function domResultSnapshot(page) {
    const summaryText = await page.locator('[data-search-modular-summary]').textContent();
    const totalMatch = (summaryText || '').match(/\d+/);
    const total = totalMatch ? Number(totalMatch[0]) : 0;
    const urls = await page.locator('[data-search-modular-results] a.find-explore-result-title[href]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')).filter(Boolean));
    const kinds = await page.locator('[data-search-modular-results] li[data-search-result-kind]')
        .evaluateAll((items) => Array.from(new Set(items.map((item) => item.dataset.searchResultKind).filter(Boolean))));
    return { total, urls, kinds };
}

async function rawPagefindSnapshot(page, query, filters) {
    return page.evaluate(async ({ query: q, filters: activeFilters, limit }) => {
        const pf = await import('/pagefind/pagefind.js');
        await pf.options({ baseUrl: '/' });
        const search = await pf.search(q, { filters: activeFilters });
        const first = await Promise.all(search.results.slice(0, limit).map((result) => result.data()));
        return {
            total: search.results.length,
            urls: first.map((row) => row.url)
        };
    }, { query, filters, limit: INITIAL_RENDER_LIMIT });
}

async function assertResultParity(page, query, filters) {
    const expected = await rawPagefindSnapshot(page, query, filters);
    await expect
        .poll(() => domResultSnapshot(page), { timeout: RESULT_TIMEOUT_MS })
        .toEqual({
            total: expected.total,
            urls: expected.urls,
            kinds: expect.any(Array)
        });
    return expected;
}

async function assertUlLiSemantics(page) {
    const semantics = await page.evaluate(() => {
        const list = document.querySelector('[data-search-modular-results]');
        if (!list) return null;
        const directChildren = Array.from(list.children).map((child) => ({
            tag: child.tagName,
            hasClass: child.classList.contains('find-explore-result')
        }));
        return {
            tag: list.tagName,
            directChildren
        };
    });
    expect(semantics?.tag).toBe('UL');
    expect((semantics?.directChildren || []).length).toBeGreaterThan(0);
    for (const child of semantics.directChildren) {
        expect(child.tag).toBe('LI');
        expect(child.hasClass).toBe(true);
    }
}

for (const locale of LOCALES) {
    test.describe(`PF5-A3A content-type single-select — ${locale.name}`, () => {

        test('default state shows only Sisältö, secondary slots stay hidden, UL/LI results intact', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            expect(await visibleFilterNames(page)).toEqual(['Sisältö']);
            expect(await page.locator('[data-search-modular-filter-slot]').count()).toBe(12);
            expect(await page.locator('[data-search-modular-filter-slot][data-search-modular-secondary-for][hidden]').count()).toBe(11);
            await assertUlLiSemantics(page);
        });

        test('Kaikki -> Esitykset reveals only presentation secondary facets and preserves the query', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            const clicked = await clickFilterValue(page, 'Sisältö', 'Esitykset');
            test.skip(!clicked, `partition lacks Esitykset for probe query "${locale.probeQuery}"`);

            const visible = await visibleFilterNames(page);
            const allowed = new Set(['Sisältö', ...DOMAIN_SECONDARY_FACETS['Esitykset']]);
            for (const name of visible) {
                expect(allowed.has(name), `unexpected facet visible: ${name}`).toBe(true);
            }
            expect(await activeFilterLabels(page, 'Sisältö')).toEqual(['Esitykset']);
            await expect(page.locator('#siteSearchPageInput')).toHaveValue(locale.probeQuery);
        });

        test('Esitykset -> Mediassa replaces the Sisältö selection instead of combining it', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            const gotPresentations = await clickFilterValue(page, 'Sisältö', 'Esitykset');
            const gotMedia = gotPresentations && await clickFilterValue(page, 'Sisältö', 'Mediassa');
            test.skip(!gotPresentations || !gotMedia, `partition lacks Esitykset or Mediassa for probe query "${locale.probeQuery}"`);

            expect(await activeFilterLabels(page, 'Sisältö')).toEqual(['Mediassa']);
            const visible = await visibleFilterNames(page);
            const allowed = new Set(['Sisältö', ...DOMAIN_SECONDARY_FACETS['Mediassa']]);
            for (const name of visible) {
                expect(allowed.has(name), `unexpected facet visible: ${name}`).toBe(true);
            }
            const snapshot = await domResultSnapshot(page);
            expect(snapshot.kinds.every((kind) => kind === 'media')).toBe(true);
            await expect(page.locator('#siteSearchPageInput')).toHaveValue(locale.probeQuery);
        });

        test('Esitykset secondary filters are cleared when switching to Mediassa', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            const gotPresentations = await clickFilterValue(page, 'Sisältö', 'Esitykset');
            test.skip(!gotPresentations, `partition lacks Esitykset for probe query "${locale.probeQuery}"`);
            const secondaryFilter = await clickFirstConcretePill(page, DOMAIN_SECONDARY_FACETS['Esitykset']);
            test.skip(!secondaryFilter, 'no visible presentation secondary pill available for this probe');
            const gotMedia = await clickFilterValue(page, 'Sisältö', 'Mediassa');
            test.skip(!gotMedia, `partition lacks Mediassa for probe query "${locale.probeQuery}"`);

            expect(await activeFilterLabels(page, 'Sisältö')).toEqual(['Mediassa']);
            expect(await activeConcretePillCount(page, DOMAIN_SECONDARY_FACETS['Esitykset'])).toBe(0);
            await assertResultParity(page, locale.probeQuery, {
                Kieli: locale.languageFilter,
                Sisältö: 'Mediassa'
            });
        });

        test('Media secondary filters are cleared when switching to Julkaisut', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            const gotMedia = await clickFilterValue(page, 'Sisältö', 'Mediassa');
            test.skip(!gotMedia, `partition lacks Mediassa for probe query "${locale.probeQuery}"`);
            const secondaryFilter = await clickFirstConcretePill(page, DOMAIN_SECONDARY_FACETS['Mediassa']);
            test.skip(!secondaryFilter, 'no visible media secondary pill available for this probe');
            const gotPublications = await clickFilterValue(page, 'Sisältö', 'Julkaisut');
            test.skip(!gotPublications, `partition lacks Julkaisut for probe query "${locale.probeQuery}"`);

            expect(await activeFilterLabels(page, 'Sisältö')).toEqual(['Julkaisut']);
            expect(await activeConcretePillCount(page, DOMAIN_SECONDARY_FACETS['Mediassa'])).toBe(0);
            const expected = await assertResultParity(page, locale.probeQuery, {
                Kieli: locale.languageFilter,
                Sisältö: 'Julkaisut'
            });
            expect(expected.total).toBeGreaterThan(0);
        });

        test('domain + secondary -> Kaikki restores cross-domain results and clears hidden secondary state', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            const gotPresentations = await clickFilterValue(page, 'Sisältö', 'Esitykset');
            test.skip(!gotPresentations, `partition lacks Esitykset for probe query "${locale.probeQuery}"`);
            const secondaryFilter = await clickFirstConcretePill(page, DOMAIN_SECONDARY_FACETS['Esitykset']);
            test.skip(!secondaryFilter, 'no visible presentation secondary pill available for this probe');
            await clickFilterValue(page, 'Sisältö', 'All');

            const activeLabels = await activeFilterLabels(page, 'Sisältö');
            expect(activeLabels.length).toBe(1);
            expect(['All', 'Kaikki']).toContain(activeLabels[0]);
            expect(await activeConcretePillCount(page, DOMAIN_SECONDARY_FACETS['Esitykset'])).toBe(0);
            expect(await visibleFilterNames(page)).toEqual(['Sisältö']);
            await assertResultParity(page, locale.probeQuery, {
                Kieli: locale.languageFilter
            });
        });

        test('keyboard activation keeps Sisältö single-select and focus meaningful', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            await activateFilterValueWithKeyboard(page, 'Sisältö', 'Esitykset', 'Enter');
            await activateFilterValueWithKeyboard(page, 'Sisältö', 'Mediassa', ' ');

            expect(await activeFilterLabels(page, 'Sisältö')).toEqual(['Mediassa']);
            const focusState = await page.evaluate(() => {
                const active = document.activeElement;
                return {
                    tag: active?.tagName || null,
                    label: (active?.querySelector?.('span[aria-label]')?.getAttribute('aria-label')
                        || active?.getAttribute?.('aria-label')
                        || '').trim()
                };
            });
            expect(focusState.tag).toBe('BUTTON');
            expect(focusState.label).toBe('Mediassa');
            expect(await activeConcretePillCount(page, DOMAIN_SECONDARY_FACETS['Esitykset'])).toBe(0);
        });

        test('?q= hydration still works and default state remains Kaikki-scoped', async ({ page }) => {
            const url = `${locale.path}?q=${encodeURIComponent(locale.probeQuery)}`;
            await gotoAndAssertSite(page, url);
            await waitForModularReady(page);
            await waitForResults(page);

            await expect(page.locator('#siteSearchPageInput')).toHaveValue(locale.probeQuery);
            expect(await visibleFilterNames(page)).toEqual(['Sisältö']);
            const activeLabels = await activeFilterLabels(page, 'Sisältö');
            expect(activeLabels.length).toBe(1);
            expect(['All', 'Kaikki']).toContain(activeLabels[0]);
        });
    });
}

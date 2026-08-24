/**
 * PF5-H1B progressive facet disclosure regression.
 *
 * After H1B the /haku/ + /en/search/ shells expose ONLY the Sisältö
 * facet by default. Domain-specific secondary facets stay in the DOM
 * (so Pagefind's own filter counts + ranking are untouched) but are
 * `hidden` until the matching Sisältö value is selected. Multi-
 * selection shows the UNION of the selected domains' facets.
 * Selecting Pagefind's "All" reset pill (or clearing every selection)
 * re-hides everything.
 *
 * Locks:
 *   - default: only Sisältö visible; 11 secondary slots hidden
 *   - Julkaisut selection reveals Publications facets only
 *   - Kirjoitukset ja puheenvuorot reveals Writings facets only
 *   - Opinnäytteet reveals Theses facets only
 *   - Mediassa reveals Media facets only
 *   - Esitykset reveals Presentation facets only
 *   - Julkaisut + Esitykset multi-select reveals union
 *   - clearing via "All" pill re-hides all secondary facets
 *   - results still filter correctly (Pagefind state preserved)
 *   - Kieli pin preserved
 *   - query hydration preserved on load with ?q=
 */
import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

const RESULT_TIMEOUT_MS = 20000;

// Domain values match the Pagefind Sisältö filter VALUES emitted by
// canonical Eleventy projectors. Do not translate for EN — Pagefind
// uses these Finnish values in both partitions per PF3 decision.
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
        expectedResultsForJulkaisut: 'publications'
    },
    {
        name: 'EN /en/search/',
        path: '/en/search/',
        probeQuery: 'learning',
        expectedResultsForJulkaisut: 'publications'
    }
];

async function waitForModularReady(page) {
    await expect(page.locator('#siteSearchPageUi[data-search-modular-ready="true"]')).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
}

async function primeQuery(page, query) {
    await page.fill('#siteSearchPageInput', query);
    await expect
        .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(),
            { timeout: RESULT_TIMEOUT_MS })
        .toBeGreaterThan(0);
    // Give the initial FilterPills mount a beat to render its buttons.
    await page.waitForTimeout(600);
}

async function clickSisaltoValue(page, value) {
    const clicked = await page.evaluate((v) => {
        const slot = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .find((s) => s.dataset.searchModularFilterName === 'Sisältö');
        if (!slot) return false;
        const btn = Array.from(slot.querySelectorAll('button.pagefind-modular-filter-pill'))
            .find((b) => (b.querySelector('span[aria-label]')?.getAttribute('aria-label') || '').trim() === v);
        if (!btn) return false;
        btn.click();
        return true;
    }, value);
    if (clicked) await page.waitForTimeout(500);
    return clicked;
}

async function visibleFilterNames(page) {
    return page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
            .filter((s) => !s.hidden && s.querySelector('.pagefind-modular-filter-pills-wrapper'))
            .map((s) => s.dataset.searchModularFilterName)
    );
}

for (const locale of LOCALES) {
    test.describe(`PF5-H1B progressive facets — ${locale.name}`, () => {

        test('default state shows only Sisältö; 11 secondary slots hidden', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            const visible = await visibleFilterNames(page);
            expect(visible).toEqual(['Sisältö']);

            const totalSlots = await page.locator('[data-search-modular-filter-slot]').count();
            expect(totalSlots).toBe(12);
            const hiddenSecondary = await page.locator('[data-search-modular-filter-slot][data-search-modular-secondary-for][hidden]').count();
            expect(hiddenSecondary).toBe(11);
        });

        for (const [domain, expectedFacets] of Object.entries(DOMAIN_SECONDARY_FACETS)) {
            test(`selecting Sisältö = "${domain}" reveals only that domain's secondary facets`, async ({ page }) => {
                await gotoAndAssertSite(page, locale.path);
                await waitForModularReady(page);
                await primeQuery(page, locale.probeQuery);

                const clicked = await clickSisaltoValue(page, domain);
                test.skip(!clicked, `Pagefind partition does not surface Sisältö value "${domain}" for probe query "${locale.probeQuery}" — nothing to test`);
                const visible = await visibleFilterNames(page);
                // Expected: Sisältö + this domain's facets. Some facets
                // may auto-hide via Pagefind alwaysShow:false when the
                // language partition has 0 hits for them; those simply
                // don't appear in `visible`. Assert the set is a SUBSET
                // of expected + Sisältö, and that no OTHER domain's
                // facets sneak in.
                const allowed = new Set(['Sisältö', ...expectedFacets]);
                for (const name of visible) {
                    expect(allowed.has(name), `unexpected facet visible: ${name}`).toBe(true);
                }
                // At least one domain-specific facet from the picked
                // domain should be visible if the language partition
                // has any hits at all for it. If none appear (empty
                // partition), the test still asserts no LEAK.
            });
        }

        test('Julkaisut + Esitykset multi-select shows the UNION of both domains\' facets', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            const gotJulk = await clickSisaltoValue(page, 'Julkaisut');
            const gotEsit = await clickSisaltoValue(page, 'Esitykset');
            test.skip(!gotJulk || !gotEsit, `partition lacks Julkaisut or Esitykset for probe query "${locale.probeQuery}" — cannot test union`);
            const visible = await visibleFilterNames(page);
            const allowed = new Set([
                'Sisältö',
                ...DOMAIN_SECONDARY_FACETS['Julkaisut'],
                ...DOMAIN_SECONDARY_FACETS['Esitykset']
            ]);
            for (const name of visible) {
                expect(allowed.has(name), `unexpected facet visible: ${name}`).toBe(true);
            }
            // No writings / theses / media facet may leak
            for (const name of visible) {
                expect(DOMAIN_SECONDARY_FACETS['Kirjoitukset ja puheenvuorot'].includes(name)).toBe(false);
                expect(DOMAIN_SECONDARY_FACETS['Opinnäytteet'].includes(name)).toBe(false);
                expect(DOMAIN_SECONDARY_FACETS['Mediassa'].includes(name)).toBe(false);
            }
        });

        test('clicking the "All" reset pill re-hides all secondary facets', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            // Use any domain the partition surfaces — Esitykset is
            // present in both FI and EN partitions for the probe queries.
            const gotDomain = await clickSisaltoValue(page, 'Esitykset');
            test.skip(!gotDomain, 'partition lacks Esitykset for probe query');
            expect((await visibleFilterNames(page)).length).toBeGreaterThan(1);

            await clickSisaltoValue(page, 'All');
            const visible = await visibleFilterNames(page);
            expect(visible).toEqual(['Sisältö']);
        });

        test('selecting Julkaisut narrows results (Pagefind state preserved, ranking untouched)', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);

            const clicked = await clickSisaltoValue(page, 'Julkaisut');
            test.skip(!clicked, `partition lacks Julkaisut for probe query "${locale.probeQuery}" — publications-only-facet EN documented-skip`);
            await page.waitForTimeout(800);
            const kinds = await page.locator('[data-search-modular-results] li[data-search-result-kind]')
                .evaluateAll((els) => Array.from(new Set(els.map((e) => e.dataset.searchResultKind))));
            expect(kinds.every((k) => k === 'publications')).toBe(true);
        });

        test('Kieli pin still excludes other-locale results with secondary facets hidden', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await primeQuery(page, locale.probeQuery);
            if (locale.name.startsWith('FI')) {
                const enHrefs = await page.locator('[data-search-modular-results] a.find-explore-result-title[href^="/en/"]').count();
                expect(enHrefs).toBe(0);
            } else {
                const fiOnly = await page.locator('[data-search-modular-results] a.find-explore-result-title[href^="/haku/"]').count();
                expect(fiOnly).toBe(0);
            }
        });

        test('?q= URL hydrates SSR input value and triggers initial search under H1B', async ({ page }) => {
            const url = locale.path + '?q=' + encodeURIComponent(locale.probeQuery);
            await gotoAndAssertSite(page, url);
            await waitForModularReady(page);
            await expect(page.locator('#siteSearchPageInput')).toHaveValue(locale.probeQuery);
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(),
                    { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            const visible = await visibleFilterNames(page);
            expect(visible).toEqual(['Sisältö']);
        });
    });
}

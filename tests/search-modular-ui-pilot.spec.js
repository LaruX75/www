import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

// PF5-G1 global-search Modular UI pilot — parameterised across
// both /haku/ (FI) and /en/search/ (EN). Both surfaces run the
// same src/js/global-search-modular-ui.js controller with their
// per-locale config from src/_includes/_search-page-config.njk.
//
// Scope invariants asserted per-locale:
//   - Modular UI mounts inside #siteSearchPageUi
//   - Default UI DOM absent
//   - Results in Pagefind's rank order (no grouping)
//   - Family-badge + primary-meta for shared-card kinds
//   - ?q= prefill
//   - Language filter pinned (FI → excludes /en/…; EN → excludes FI-only routes)
//   - Keyboard focus works
//   - Locale-appropriate no-results state
//   - All 12 baseline user-meaningful facets available
//   - Sisältö narrow + clear restores ranking
//   - Domain-specific facet narrowing
//   - Two-facet AND semantics
//   - Facet pill hit counts render
//   - Locale-appropriate accessible names on region + wrappers
//   - Facet pill keyboard focus + Enter toggle
//   - Load-more preserves order and hides when exhausted
//   - Modular UI init failure falls back to SSR form

const RESULT_TIMEOUT_MS = 20000;

async function waitForModularReady(page) {
    const mount = page.locator('#siteSearchPageUi[data-search-modular-ready="true"]');
    await expect(mount).toBeVisible();
    const input = page.locator('#siteSearchPageInput');
    await expect(input).toBeVisible();
    return input;
}

const LOCALES = [
    {
        name: 'FI /haku/',
        path: '/haku/',
        // Broad Finnish stem with hundreds of hits across multiple
        // content families in the FI Pagefind partition.
        probeQuery: 'tekoäly',
        expectedPlaceholder: 'Kirjoita hakusana...',
        expectedSearchLabel: 'Hae sivustolta',
        regionLabel: 'Rajaa hakua',
        zeroResultsRegex: /Ei tuloksia/i,
        loadMoreRegex: /Lataa lisää tuloksia/,
        fallbackMessageRegex: /Hakemisto ei ole käytettävissä/i,
        sisaltoFacetLabel: 'Sisältötyyppi',
        publicationsGroupLabel: 'Julkaisutyyppi (OKM)',
        // FI surface: pinned Kieli=Suomi should exclude every /en/
        // canonical URL.
        forbiddenLangPrefix: '/en/',
        fiOnlyPrefixes: null,
        // Sisältö pill text present on the FI corpus for probeQuery.
        // Used by the "Sisältö narrows" + keyboard-focus tests.
        sisaltoNarrowPill: /Julkaisut/,
        // Publications-group facet is populated on FI (publications
        // have Kieli:Suomi meta).
        publicationsGroupAvailable: true
    },
    {
        name: 'EN /en/search/',
        path: '/en/search/',
        // Broad English stem with 100+ hits in the EN Pagefind
        // partition, chosen because it hits multiple content
        // families (publications + writings + presentations).
        probeQuery: 'learning',
        expectedPlaceholder: 'Type a search term...',
        expectedSearchLabel: 'Search the site',
        regionLabel: 'Narrow the search',
        zeroResultsRegex: /No results/i,
        loadMoreRegex: /Load more results/,
        fallbackMessageRegex: /search index is not available/i,
        sisaltoFacetLabel: 'Content type',
        publicationsGroupLabel: 'Publication type (OKM)',
        forbiddenLangPrefix: null,
        // EN surface: pinned Kieli=English should ensure the FI-only
        // /haku/ search page never appears. Some canonical detail
        // pages (presentations without explicit Kieli meta) may
        // legitimately surface via Pagefind's language auto-detection
        // even when Kieli:English is pinned — that's a canonical
        // metadata concern outside PF5-G1 scope.
        fiOnlyPrefixes: ['/haku/'],
        // Sisältö pill text present on the EN corpus for probeQuery.
        // Note: "Julkaisut" (publications) is NOT rendered on EN
        // because publications are FI-canonical only (no EN detail
        // pages), so the pilot uses "Opinnäytteet" (theses) as the
        // concrete narrowing pill on the EN surface.
        sisaltoNarrowPill: /Opinnäytteet/,
        // Publications-group facet is empty on EN (no publications
        // in the EN partition).
        publicationsGroupAvailable: false
    }
];

for (const locale of LOCALES) {
    test.describe(`PF5-G1 global-search Modular UI pilot — ${locale.name}`, () => {

        test('mounts Modular UI with locale-appropriate placeholder + aria-label', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await expect(input).toHaveAttribute('placeholder', locale.expectedPlaceholder);
            await expect(input).toHaveAttribute('aria-label', locale.expectedSearchLabel);
        });

        test('Default UI DOM is absent', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            await waitForModularReady(page);
            await page.locator('#siteSearchPageInput').fill('tekoäly');
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            const defaultUiNodes = await page.locator('#siteSearchPageUi [class*="pagefind-ui__"]').count();
            expect(defaultUiNodes).toBe(0);
        });

        test('query returns results and cards carry family-badge + primary-meta', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);

            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            await expect
                .poll(() => page.locator('[data-search-modular-results] .find-explore-result-family-badge').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            await expect
                .poll(() => page.locator('[data-search-modular-results] .find-explore-result-primary-meta').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);

            const firstBadgeText = await page.locator('[data-search-modular-results] .find-explore-result-family-badge').first().textContent();
            expect((firstBadgeText || '').trim().length).toBeGreaterThan(0);
        });

        test('mixed kinds coexist in Pagefind rank order (no grouping)', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect(page.locator('[data-search-modular-results] li[data-search-result-kind]').first())
                .toBeVisible({ timeout: RESULT_TIMEOUT_MS });
            const kinds = await page.locator('[data-search-modular-results] li[data-search-result-kind]').evaluateAll(
                (nodes) => Array.from(new Set(nodes.map((n) => n.getAttribute('data-search-result-kind')).filter(Boolean)))
            );
            expect(kinds.length).toBeGreaterThan(1);
        });

        test('?q= URL parameter prefills and triggers the initial search', async ({ page }) => {
            await gotoAndAssertSite(page, `${locale.path}?q=${encodeURIComponent(locale.probeQuery)}`);
            const input = await waitForModularReady(page);
            await expect(input).toHaveValue(locale.probeQuery);
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
        });

        test('language filter is pinned and excludes the other locale', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            if (locale.forbiddenLangPrefix) {
                const forbiddenCount = await page.locator(`[data-search-modular-results] a[href^="${locale.forbiddenLangPrefix}"]`).count();
                expect(forbiddenCount).toBe(0);
            } else if (locale.fiOnlyPrefixes) {
                for (const prefix of locale.fiOnlyPrefixes) {
                    const count = await page.locator(`[data-search-modular-results] a[href^="${prefix}"]`).count();
                    expect(count, `no ${prefix} URLs on EN surface`).toBe(0);
                }
            }
        });

        test('input is keyboard-focusable and accepts text', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.focus();
            await expect(input).toBeFocused();
            await page.keyboard.type('opettajankoulutus');
            await expect(input).toHaveValue('opettajankoulutus');
        });

        test('no-results state renders a locale-appropriate message', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill('zxqzxqzxq_nonsense_1234567890');
            const summary = page.locator('[data-search-modular-summary]');
            await expect(summary).toContainText(locale.zeroResultsRegex, { timeout: RESULT_TIMEOUT_MS });
        });

        test('Sisältö facet narrows and clearing restores full result set + ranking', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect(page.locator('[data-search-modular-results] li[data-search-result-kind]').first())
                .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

            const initialUrls = await page.locator('[data-search-modular-results] li[data-search-result-kind] a').evaluateAll(
                (nodes) => nodes.map((n) => n.getAttribute('href'))
            );
            expect(initialUrls.length).toBe(10);

            const sisaltoSlot = page.locator('[data-search-modular-filter-slot][data-search-modular-filter-name="Sisältö"]');
            await expect
                .poll(() => sisaltoSlot.locator('.pagefind-modular-filter-pill').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(1);

            await sisaltoSlot.locator('.pagefind-modular-filter-pill', { hasText: locale.sisaltoNarrowPill }).first().click();
            await page.waitForTimeout(500);
            const kindsAfter = await page.locator('[data-search-modular-results] li[data-search-result-kind]').evaluateAll(
                (nodes) => Array.from(new Set(nodes.map((n) => n.getAttribute('data-search-result-kind')).filter(Boolean)))
            );
            expect(kindsAfter.length).toBeLessThanOrEqual(2);

            await sisaltoSlot.locator('.pagefind-modular-filter-pill', { hasText: /^All/ }).click();
            await page.waitForTimeout(500);
            const afterClearUrls = await page.locator('[data-search-modular-results] li[data-search-result-kind] a').evaluateAll(
                (nodes) => nodes.map((n) => n.getAttribute('href'))
            );
            expect(afterClearUrls).toEqual(initialUrls);
        });

        test('all baseline-visible facet slots present (rendered or 0-hit)', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect(page.locator('[data-search-modular-results] li[data-search-result-kind]').first())
                .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

            const facetNames = [
                'Sisältö', 'Publications group', 'Publications quality',
                'Writings content type', 'Writings topic', 'Theses type',
                'Theses role', 'Mediatyyppi', 'Rooli', 'Vuosi',
                'PresentationYear', 'PresentationTopic'
            ];
            const facetPresence = await page.evaluate((names) => {
                const summary = [];
                for (const name of names) {
                    const slot = document.querySelector(`[data-search-modular-filter-slot][data-search-modular-filter-name="${name}"]`);
                    if (!slot) {
                        summary.push({ name, status: 'slot-missing' });
                        continue;
                    }
                    const wrapper = slot.querySelector('.pagefind-modular-filter-pills-wrapper');
                    if (!wrapper) {
                        summary.push({ name, status: 'no-hits' });
                        continue;
                    }
                    const pillCount = wrapper.querySelectorAll('.pagefind-modular-filter-pill').length;
                    summary.push({ name, status: 'rendered', pillCount });
                }
                return summary;
            }, facetNames);

            for (const entry of facetPresence) {
                expect(entry.status, `facet ${entry.name}`).not.toBe('slot-missing');
            }
            const sisaltoEntry = facetPresence.find((e) => e.name === 'Sisältö');
            expect(sisaltoEntry.status).toBe('rendered');
            expect(sisaltoEntry.pillCount).toBeGreaterThan(1);
        });

        test('domain-specific facet (Publications group) narrows results by publication group', async ({ page }) => {
            test.skip(!locale.publicationsGroupAvailable, `Publications group facet not populated on ${locale.name} — publications are FI-canonical only`);
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect(page.locator('[data-search-modular-results] li[data-search-result-kind]').first())
                .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

            // PF5-H1B: Publications group secondary facet is hidden by
            // default. Select Sisältö=Julkaisut first to reveal it.
            await page.evaluate(() => {
                const slot = Array.from(document.querySelectorAll('[data-search-modular-filter-slot]'))
                    .find((s) => s.dataset.searchModularFilterName === 'Sisältö');
                const btn = Array.from(slot.querySelectorAll('button.pagefind-modular-filter-pill'))
                    .find((b) => (b.querySelector('span[aria-label]')?.getAttribute('aria-label') || '').trim() === 'Julkaisut');
                btn && btn.click();
            });
            await page.waitForTimeout(500);

            const groupSlot = page.locator('[data-search-modular-filter-slot][data-search-modular-filter-name="Publications group"]');
            await expect
                .poll(() => groupSlot.locator('.pagefind-modular-filter-pill').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(1);

            const concretePill = groupSlot.locator('.pagefind-modular-filter-pill:not(:has-text("All"))').first();
            await concretePill.click();
            await expect
                .poll(async () => {
                    const kinds = await page.locator('[data-search-modular-results] li[data-search-result-kind]').evaluateAll(
                        (nodes) => nodes.map((n) => n.getAttribute('data-search-result-kind'))
                    );
                    if (kinds.length === 0) return null;
                    return kinds.every((k) => k === 'publications' || k === 'unknown');
                }, { timeout: RESULT_TIMEOUT_MS })
                .toBe(true);
        });

        test('two facets combined narrow further than either alone (AND semantics)', async ({ page }) => {
            test.skip(!locale.publicationsGroupAvailable, `Publications quality facet not populated on ${locale.name} — publications are FI-canonical only`);
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect(page.locator('[data-search-modular-results] li[data-search-result-kind]').first())
                .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

            const sisaltoSlot = page.locator('[data-search-modular-filter-slot][data-search-modular-filter-name="Sisältö"]');
            await expect
                .poll(() => sisaltoSlot.locator('.pagefind-modular-filter-pill').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(1);
            await sisaltoSlot.locator('.pagefind-modular-filter-pill', { hasText: locale.sisaltoNarrowPill }).first().click();
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            const sisaltoOnly = await page.locator('[data-search-modular-results] li[data-search-result-kind]').count();

            const qualitySlot = page.locator('[data-search-modular-filter-slot][data-search-modular-filter-name="Publications quality"]');
            const qualityWrapper = qualitySlot.locator('.pagefind-modular-filter-pills-wrapper');
            await page.waitForTimeout(500);
            if (await qualityWrapper.count() === 0) {
                test.skip(true, 'Publications quality facet not rendered for this corpus');
            }
            const concreteQualityPill = qualityWrapper.locator('.pagefind-modular-filter-pill:not(:has-text("All"))').first();
            await concreteQualityPill.click();
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeLessThanOrEqual(sisaltoOnly);
        });

        test('facet pills expose numeric hit counts', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect(page.locator('[data-search-modular-results] li[data-search-result-kind]').first())
                .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

            const sisaltoSlot = page.locator('[data-search-modular-filter-slot][data-search-modular-filter-name="Sisältö"]');
            const pillTexts = await sisaltoSlot.locator('.pagefind-modular-filter-pill').evaluateAll(
                (nodes) => nodes.map((n) => (n.textContent || '').trim())
            );
            const withCounts = pillTexts.filter((t) => /\(\d+\)$/.test(t));
            expect(withCounts.length).toBeGreaterThanOrEqual(2);
        });

        test('filters region + every rendered facet expose a locale-appropriate accessible name', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect(page.locator('[data-search-modular-results] li[data-search-result-kind]').first())
                .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

            await expect(page.locator('[data-search-modular-filters]'))
                .toHaveAttribute('aria-label', locale.regionLabel);

            const sisaltoWrapper = page.locator('[data-search-modular-filter-slot][data-search-modular-filter-name="Sisältö"] .pagefind-modular-filter-pills-wrapper');
            await expect(sisaltoWrapper).toHaveAttribute('aria-label', locale.sisaltoFacetLabel);

            const nonLocalisedWrappers = await page.evaluate(() => {
                const wrappers = Array.from(document.querySelectorAll('[data-search-modular-filters] .pagefind-modular-filter-pills-wrapper'));
                return wrappers
                    .map((w) => ({
                        ariaLabel: w.getAttribute('aria-label'),
                        ariaLabelledBy: w.getAttribute('aria-labelledby')
                    }))
                    .filter((w) => !w.ariaLabel || w.ariaLabelledBy);
            });
            expect(nonLocalisedWrappers).toEqual([]);
        });

        test('facet pill is keyboard-focusable and Enter toggles it', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect(page.locator('[data-search-modular-results] li[data-search-result-kind]').first())
                .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

            const sisaltoSlot = page.locator('[data-search-modular-filter-slot][data-search-modular-filter-name="Sisältö"]');
            const julkaisutPill = sisaltoSlot.locator('.pagefind-modular-filter-pill', { hasText: locale.sisaltoNarrowPill }).first();
            await julkaisutPill.focus();
            await expect(julkaisutPill).toBeFocused();
            await page.keyboard.press('Enter');
            await page.waitForTimeout(400);
            await expect(julkaisutPill).toHaveAttribute('aria-pressed', 'true');
        });

        test('load-more preserves order and hides when exhausted', async ({ page }) => {
            await gotoAndAssertSite(page, locale.path);
            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect(page.locator('[data-search-modular-results] li[data-search-result-kind]').first())
                .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

            const initialCount = await page.locator('[data-search-modular-results] li[data-search-result-kind]').count();
            expect(initialCount).toBe(10);

            const initialUrls = await page.locator('[data-search-modular-results] li[data-search-result-kind] a').evaluateAll(
                (nodes) => nodes.map((n) => n.getAttribute('href'))
            );

            const loadMore = page.locator('[data-search-modular-load-more]');
            await expect(loadMore).toBeVisible();
            await expect(loadMore).toContainText(locale.loadMoreRegex);

            await loadMore.click();
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(initialCount);

            const afterUrls = await page.locator('[data-search-modular-results] li[data-search-result-kind] a').evaluateAll(
                (nodes) => nodes.map((n) => n.getAttribute('href'))
            );
            expect(afterUrls.slice(0, initialUrls.length)).toEqual(initialUrls);

            let guard = 0;
            while ((await loadMore.isVisible()) && guard < 100) {
                await loadMore.click();
                await page.waitForTimeout(120);
                guard += 1;
            }
            await expect(loadMore).toBeHidden();
        });

        test('loads /pagefind/pagefind-modular-ui.css and clips Modular UI sr-only helper text (regression: production launch 2026-08-23)', async ({ page }) => {
            // ROOT CAUSE (2026-08-23): the Modular UI Pagefind stylesheet
            // /pagefind/pagefind-modular-ui.css was not being requested by
            // /haku/ or /en/search/. Without it, elements carrying the
            // Pagefind attribute [data-pfmod-sr-hidden] (which contains
            // FilterPills accessible helper labels such as
            // "Filter results by …") had no `position: absolute; clip: …`
            // rule applied and therefore rendered as visible page text.
            // This test locks both the asset link AND the semantic effect
            // (sr-hidden nodes clipped to a 1×1 box) so the regression
            // cannot silently recur.

            await gotoAndAssertSite(page, locale.path);

            const modularCssLink = page.locator('link[rel="stylesheet"][href="/pagefind/pagefind-modular-ui.css"]');
            await expect(modularCssLink).toHaveCount(1);

            const input = await waitForModularReady(page);
            await input.fill(locale.probeQuery);
            await expect
                .poll(() => page.locator('[data-search-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);
            await expect
                .poll(() => page.locator('#siteSearchPageUi [data-pfmod-sr-hidden]').count(), { timeout: RESULT_TIMEOUT_MS })
                .toBeGreaterThan(0);

            const clippedBoxes = await page.locator('#siteSearchPageUi [data-pfmod-sr-hidden]').evaluateAll((nodes) =>
                nodes.map((node) => {
                    const rect = node.getBoundingClientRect();
                    const style = window.getComputedStyle(node);
                    return {
                        width: rect.width,
                        height: rect.height,
                        position: style.position,
                        textLength: (node.textContent || '').trim().length
                    };
                })
            );
            expect(clippedBoxes.length).toBeGreaterThan(0);
            for (const box of clippedBoxes) {
                expect(box.textLength, 'sr-only helper carries an accessible name').toBeGreaterThan(0);
                expect(box.width, 'sr-only helper visually clipped to <=1px width').toBeLessThanOrEqual(1);
                expect(box.height, 'sr-only helper visually clipped to <=1px height').toBeLessThanOrEqual(1);
                expect(box.position, 'sr-only helper removed from flow via absolute positioning').toBe('absolute');
            }
        });

        test('Modular UI init failure falls back to the SSR form (no dead skeleton)', async ({ page }) => {
            // PF5-H1A: the SSR shell form is the authoritative input on
            // /haku/ + /en/search/ — it exists regardless of whether
            // Modular UI initialises. When init fails, the form remains
            // usable (native GET submit works), and the mount surface
            // shows the fallback message instead of an empty skeleton.
            await page.route('**/pagefind/pagefind-modular-ui.js', (route) => route.fulfill({
                status: 404,
                contentType: 'text/plain',
                body: 'blocked-by-test'
            }));

            await gotoAndAssertSite(page, locale.path);

            const mount = page.locator('#siteSearchPageUi');
            await expect(mount).toContainText(locale.fallbackMessageRegex);

            const fallbackForm = page.locator('[data-search-page-fallback]');
            await expect(fallbackForm).toBeVisible();

            const fallbackInput = page.locator('[data-search-page-fallback-input]');
            await expect(fallbackInput).toHaveCount(1);
            await expect(fallbackInput).toBeVisible();
            await fallbackInput.fill(locale.probeQuery);
            await expect(fallbackInput).toHaveValue(locale.probeQuery);
        });
    });
}

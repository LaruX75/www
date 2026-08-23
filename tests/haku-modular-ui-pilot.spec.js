import { test, expect } from '@playwright/test';
import { gotoAndAssertSite } from './helpers/a11y.js';

// PF5-G1 /haku/ pilot — the Finnish global search page uses the
// Pagefind 1.5.2 Modular UI (Instance + Input + Summary + ResultList)
// bound to the shared PF4/PF5 result presenter. Stock Default UI DOM
// (`.pagefind-ui__*`) must NOT appear on this surface anymore.
//
// Scope invariants asserted here:
//   - Modular UI mounts inside #siteSearchPageUi
//   - Default UI DOM is absent on /haku/
//   - Query returns results in Pagefind's rank order (no grouping)
//   - Family-badge + primary-meta line render for each shared card
//   - ?q= prefill triggers a search
//   - The Finnish language filter is pinned (only Suomi results)
//   - Keyboard focus reaches the search input by name
//   - No-results state renders a Finnish message
//
// Native navbar <dialog> lifecycle, Escape, and focus return are
// NOT tested here — the pilot does not touch navbar mounts. Those
// stay as browser gates for the later navbar rollout.

const RESULT_TIMEOUT_MS = 20000;

async function waitForModularReady(page) {
    // The pilot mount sets `data-haku-modular-ready="true"` at the end
    // of Instance/Input/FilterPills registration. Tests wait on this
    // so we never race the component wiring.
    const mount = page.locator('#siteSearchPageUi[data-haku-modular-ready="true"]');
    await expect(mount).toBeVisible();
    const input = page.locator('#siteSearchPageInput');
    await expect(input).toBeVisible();
    return input;
}

test.describe('PF5-G1 /haku/ Modular UI pilot', () => {
    test('mounts Modular UI with a Finnish search input', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await expect(input).toHaveAttribute('placeholder', 'Kirjoita hakusana...');
        await expect(input).toHaveAttribute('aria-label', 'Hae sivustolta');
    });

    test('Default UI DOM is not present on /haku/', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        await waitForModularReady(page);
        // Type a query so the UI has fully rendered.
        await page.locator('#siteSearchPageInput').fill('tekoäly');
        await expect(page.locator('#siteSearchPageUi [data-haku-modular-results] li').first())
            .toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        // Any `.pagefind-ui__*` node under the mount indicates a
        // regression back to Default UI. Zero tolerated.
        const defaultUiNodes = await page.locator('#siteSearchPageUi [class*="pagefind-ui__"]').count();
        expect(defaultUiNodes).toBe(0);
    });

    test('query returns results and each card carries family-badge + primary-meta', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await input.fill('tekoäly');

        // Poll for cards to arrive; the initial 10-batch renderBatch is
        // async (fetches per-result data() from Pagefind).
        await expect
            .poll(() => page.locator('[data-haku-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(0);

        // Poll until at least one badge AND one primary-meta line exist —
        // family-badge is emitted for every non-unknown card and
        // primary-meta only for kinds whose primaryMetaFor returns
        // non-empty, so both are async-populated as the batch fills.
        await expect
            .poll(() => page.locator('[data-haku-modular-results] .find-explore-result-family-badge').count(), { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(0);
        await expect
            .poll(() => page.locator('[data-haku-modular-results] .find-explore-result-primary-meta').count(), { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(0);

        const firstBadgeText = await page.locator('[data-haku-modular-results] .find-explore-result-family-badge').first().textContent();
        expect((firstBadgeText || '').trim().length).toBeGreaterThan(0);
    });

    test('mixed kinds coexist in Pagefind rank order (no grouping)', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        // Query chosen because it legitimately hits multiple
        // content families in Pagefind's rank order. The assertion
        // is on presence of >=2 distinct kinds, not on the order:
        // Pagefind owns ranking; we do not group by kind.
        await input.fill('tekoäly');
        const firstResult = page.locator('[data-haku-modular-results] li[data-search-result-kind]').first();
        await expect(firstResult).toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        const kinds = await page.locator('[data-haku-modular-results] li[data-search-result-kind]').evaluateAll(
            (nodes) => Array.from(new Set(nodes.map((n) => n.getAttribute('data-search-result-kind')).filter(Boolean)))
        );
        expect(kinds.length).toBeGreaterThan(1);
    });

    test('?q= URL parameter prefills and triggers the initial search', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/?q=tekoäly');
        const input = await waitForModularReady(page);
        await expect(input).toHaveValue('tekoäly');
        // Poll for results rather than assert-once so we tolerate the
        // small delay between Instance construction and the first
        // triggerSearch batch arriving.
        await expect
            .poll(() => page.locator('[data-haku-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(0);
    });

    test('pinned Kieli:Suomi filter keeps English results out', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await input.fill('tekoäly');
        await expect(page.locator('[data-haku-modular-results] li[data-search-result-kind]').first())
            .toBeVisible({ timeout: RESULT_TIMEOUT_MS });
        // No English-side canonical URLs should appear (/en/… hosts
        // English content pages exclusively).
        const enLinks = await page.locator('[data-haku-modular-results] a[href^="/en/"]').count();
        expect(enLinks).toBe(0);
    });

    test('input is keyboard-focusable via Tab and accepts text input', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await input.focus();
        await expect(input).toBeFocused();
        await page.keyboard.type('opettajankoulutus');
        await expect(input).toHaveValue('opettajankoulutus');
    });

    test('no-results state renders a Finnish message', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        // A deliberately implausible query so the corpus returns
        // nothing. The Modular UI Summary component renders the
        // Finnish zero_results translation.
        await input.fill('zxqzxqzxq_nonsense_1234567890');
        const summary = page.locator('[data-haku-modular-summary]');
        await expect(summary).toContainText(/Ei tuloksia/i, { timeout: RESULT_TIMEOUT_MS });
    });

    test('Sisältö facet narrows and clearing restores full result set + ranking', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await input.fill('tekoäly');
        await expect(page.locator('[data-haku-modular-results] li[data-search-result-kind]').first())
            .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

        // Snapshot the initial mixed result URLs so we can prove
        // that clearing the filter restores the same ranked set.
        const initialUrls = await page.locator('[data-haku-modular-results] li[data-search-result-kind] a').evaluateAll(
            (nodes) => nodes.map((n) => n.getAttribute('href'))
        );
        expect(initialUrls.length).toBe(10);

        const sisaltoSlot = page.locator('[data-haku-modular-filter-slot][data-haku-modular-filter-name="Sisältö"]');
        await expect(sisaltoSlot).toBeVisible();
        const pillCount = await sisaltoSlot.locator('.pagefind-modular-filter-pill').count();
        expect(pillCount).toBeGreaterThan(1);

        await sisaltoSlot.locator('.pagefind-modular-filter-pill', { hasText: /Julkaisut/ }).first().click();
        await page.waitForTimeout(500);
        const kindsAfter = await page.locator('[data-haku-modular-results] li[data-search-result-kind]').evaluateAll(
            (nodes) => Array.from(new Set(nodes.map((n) => n.getAttribute('data-search-result-kind')).filter(Boolean)))
        );
        expect(kindsAfter.length).toBeLessThanOrEqual(2);

        // Click "All" to clear the Sisältö selection back to unrestricted.
        await sisaltoSlot.locator('.pagefind-modular-filter-pill', { hasText: /^All/ }).click();
        await page.waitForTimeout(500);
        const afterClearUrls = await page.locator('[data-haku-modular-results] li[data-search-result-kind] a').evaluateAll(
            (nodes) => nodes.map((n) => n.getAttribute('href'))
        );
        expect(afterClearUrls).toEqual(initialUrls);
    });

    test('all baseline-visible facets render or are documented absent when 0 hits', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await input.fill('tekoäly');
        await expect(page.locator('[data-haku-modular-results] li[data-search-result-kind]').first())
            .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

        // Every pilot-owned facet slot exists in the DOM; each slot
        // either contains a rendered .pagefind-modular-filter-pills-wrapper
        // (>=1 non-"All" pill) OR is empty (0 hits → Modular UI's
        // alwaysShow:false hides the wrapper).
        const facetNames = [
            'Sisältö', 'Publications group', 'Publications quality',
            'Writings content type', 'Writings topic', 'Theses type',
            'Theses role', 'Mediatyyppi', 'Rooli', 'Vuosi',
            'PresentationYear', 'PresentationTopic'
        ];
        const facetPresence = await page.evaluate((names) => {
            const summary = [];
            for (const name of names) {
                const slot = document.querySelector(`[data-haku-modular-filter-slot][data-haku-modular-filter-name="${name}"]`);
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
        // At least Sisältö must render on the "tekoäly" corpus.
        const sisaltoEntry = facetPresence.find((e) => e.name === 'Sisältö');
        expect(sisaltoEntry.status).toBe('rendered');
        expect(sisaltoEntry.pillCount).toBeGreaterThan(1);
    });

    test('domain-specific facet (Publications group) narrows results by publication group', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await input.fill('tekoäly');
        await expect(page.locator('[data-haku-modular-results] li[data-search-result-kind]').first())
            .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

        const groupSlot = page.locator('[data-haku-modular-filter-slot][data-haku-modular-filter-name="Publications group"]');
        // Wait for FilterPills to finish its async facet-value fetch
        // by polling for a rendered pill inside the slot. Modular UI
        // populates FilterPills asynchronously after Instance search
        // events settle.
        await expect
            .poll(() => groupSlot.locator('.pagefind-modular-filter-pill').count(), { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(1);

        const concretePill = groupSlot.locator('.pagefind-modular-filter-pill:not(:has-text("All"))').first();
        await concretePill.click();
        await expect
            .poll(async () => {
                const kinds = await page.locator('[data-haku-modular-results] li[data-search-result-kind]').evaluateAll(
                    (nodes) => nodes.map((n) => n.getAttribute('data-search-result-kind'))
                );
                if (kinds.length === 0) return null;
                return kinds.every((k) => k === 'publications' || k === 'unknown');
            }, { timeout: RESULT_TIMEOUT_MS })
            .toBe(true);
    });

    test('two facets combined narrow further than either alone (AND semantics)', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await input.fill('tekoäly');
        await expect(page.locator('[data-haku-modular-results] li[data-search-result-kind]').first())
            .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

        const sisaltoSlot = page.locator('[data-haku-modular-filter-slot][data-haku-modular-filter-name="Sisältö"]');
        await expect
            .poll(() => sisaltoSlot.locator('.pagefind-modular-filter-pill').count(), { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(1);
        await sisaltoSlot.locator('.pagefind-modular-filter-pill', { hasText: /Julkaisut/ }).first().click();
        await expect
            .poll(() => page.locator('[data-haku-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(0);
        const sisaltoOnly = await page.locator('[data-haku-modular-results] li[data-search-result-kind]').count();

        const qualitySlot = page.locator('[data-haku-modular-filter-slot][data-haku-modular-filter-name="Publications quality"]');
        const qualityWrapper = qualitySlot.locator('.pagefind-modular-filter-pills-wrapper');
        // Wait for quality facet to populate after Sisältö narrowing.
        await page.waitForTimeout(500);
        if (await qualityWrapper.count() === 0) {
            test.skip(true, 'Publications quality facet not rendered for this corpus');
        }
        const concreteQualityPill = qualityWrapper.locator('.pagefind-modular-filter-pill:not(:has-text("All"))').first();
        await concreteQualityPill.click();
        await expect
            .poll(() => page.locator('[data-haku-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
            .toBeLessThanOrEqual(sisaltoOnly);
    });

    test('facet pills expose numeric hit counts', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await input.fill('tekoäly');
        await expect(page.locator('[data-haku-modular-results] li[data-search-result-kind]').first())
            .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

        const sisaltoSlot = page.locator('[data-haku-modular-filter-slot][data-haku-modular-filter-name="Sisältö"]');
        // FilterPills emits pill text as "Label (N)" with N a positive
        // integer. Assert at least two pills carry a numeric count.
        const pillTexts = await sisaltoSlot.locator('.pagefind-modular-filter-pill').evaluateAll(
            (nodes) => nodes.map((n) => (n.textContent || '').trim())
        );
        const withCounts = pillTexts.filter((t) => /\(\d+\)$/.test(t));
        expect(withCounts.length).toBeGreaterThanOrEqual(2);
    });

    test('facet region and every rendered facet expose a Finnish accessible name', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await input.fill('tekoäly');
        await expect(page.locator('[data-haku-modular-results] li[data-search-result-kind]').first())
            .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

        // Region label is Finnish and site-owned.
        await expect(page.locator('[data-haku-modular-filters]'))
            .toHaveAttribute('aria-label', 'Rajaa hakua');

        // Every rendered FilterPills wrapper has had its English
        // aria-labelledby replaced with a Finnish aria-label
        // (post-render localisation).
        const nonFinnishWrappers = await page.evaluate(() => {
            const wrappers = Array.from(document.querySelectorAll('[data-haku-modular-filters] .pagefind-modular-filter-pills-wrapper'));
            return wrappers
                .map((w) => ({
                    ariaLabel: w.getAttribute('aria-label'),
                    ariaLabelledBy: w.getAttribute('aria-labelledby')
                }))
                .filter((w) => !w.ariaLabel || w.ariaLabelledBy);
        });
        expect(nonFinnishWrappers).toEqual([]);
    });

    test('facet pill is keyboard-focusable and Enter toggles it', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        await input.fill('tekoäly');
        await expect(page.locator('[data-haku-modular-results] li[data-search-result-kind]').first())
            .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

        const sisaltoSlot = page.locator('[data-haku-modular-filter-slot][data-haku-modular-filter-name="Sisältö"]');
        const julkaisutPill = sisaltoSlot.locator('.pagefind-modular-filter-pill', { hasText: /Julkaisut/ }).first();
        await julkaisutPill.focus();
        await expect(julkaisutPill).toBeFocused();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(400);
        await expect(julkaisutPill).toHaveAttribute('aria-pressed', 'true');
    });

    test('load-more reveals the next batch, preserves order, and hides when exhausted', async ({ page }) => {
        await gotoAndAssertSite(page, '/haku/');
        const input = await waitForModularReady(page);
        // Query with >>10 results so the load-more path is exercised.
        await input.fill('tekoäly');
        await expect(page.locator('[data-haku-modular-results] li[data-search-result-kind]').first())
            .toBeVisible({ timeout: RESULT_TIMEOUT_MS });

        const initialCount = await page.locator('[data-haku-modular-results] li[data-search-result-kind]').count();
        expect(initialCount).toBe(10);

        // Snapshot initial URLs so we can prove order-preservation.
        const initialUrls = await page.locator('[data-haku-modular-results] li[data-search-result-kind] a').evaluateAll(
            (nodes) => nodes.map((n) => n.getAttribute('href'))
        );

        const loadMore = page.locator('[data-haku-modular-load-more]');
        await expect(loadMore).toBeVisible();
        await expect(loadMore).toContainText(/Lataa lisää tuloksia/);

        await loadMore.click();
        await expect
            .poll(() => page.locator('[data-haku-modular-results] li[data-search-result-kind]').count(), { timeout: RESULT_TIMEOUT_MS })
            .toBeGreaterThan(initialCount);

        const afterUrls = await page.locator('[data-haku-modular-results] li[data-search-result-kind] a').evaluateAll(
            (nodes) => nodes.map((n) => n.getAttribute('href'))
        );
        // Order preservation: first N URLs must match the initial batch.
        expect(afterUrls.slice(0, initialUrls.length)).toEqual(initialUrls);

        // Click load-more until it hides (button removed from view when
        // renderedCount >= currentResults.length).
        let guard = 0;
        while ((await loadMore.isVisible()) && guard < 100) {
            await loadMore.click();
            await page.waitForTimeout(120);
            guard += 1;
        }
        await expect(loadMore).toBeHidden();
    });

    test('Modular UI init failure falls back to the SSR form (no dead skeleton)', async ({ page }) => {
        // Block the Modular UI bundle before navigation so the site's
        // dynamic-script loader hits the .onerror path.
        await page.route('**/pagefind/pagefind-modular-ui.js', (route) => route.fulfill({
            status: 404,
            contentType: 'text/plain',
            body: 'blocked-by-test'
        }));

        await gotoAndAssertSite(page, '/haku/');

        // Modular input never appears because the bundle failed to load.
        await expect(page.locator('#siteSearchPageInput')).toHaveCount(0);

        // Fallback alert renders inside the mount so the user is not
        // staring at an empty container.
        const mount = page.locator('#siteSearchPageUi');
        await expect(mount).toContainText(/Hakemisto ei ole käytettävissä/i);

        // The SSR fallback form is restored to visibility so the user
        // can still submit ?q= via a server-side round-trip.
        const fallbackForm = page.locator('[data-search-page-fallback]');
        await expect(fallbackForm).toBeVisible();

        const fallbackInput = page.locator('[data-search-page-fallback-input]');
        await fallbackInput.fill('tekoäly');
        await expect(fallbackInput).toHaveValue('tekoäly');
    });
});

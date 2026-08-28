import { test, expect } from '@playwright/test';

const PAGES = [
  { name: 'FI archive', url: '/esitykset/' },
  { name: 'EN archive', url: '/en/presentations/' }
];

const FIXTURES = {
  localTitle: 'Luento 4: Ohjelmointiosaaminen',
  localLanding: '/presentations/luento-4-ohjelmointiosaaminen/',
  localYear: '2025',
  localTopic: 'Ohjelmointi',
  externalTitle: 'AI Friend or Foe? – Tekoäly: ystävä vai vihollinen?',
  externalLanding: 'https://www.canva.com/design/DAHI6X6dR_g/_Jy-hfDeDZU5UA6DVkWjrQ/view',
  externalYear: '2026',
  externalTopic: 'AI literacy',
  topiclessTitle: 'Arjen tekoälyhaaste',
  topiclessLanding: '/presentations/arjen-tekoalyhaaste/'
};

// Under Slice 3 C1, all canonical archive cards are rendered once by the
// SSR partial and stay in the DOM. JS hydration toggles the `hidden`
// attribute on cards outside the current filter/page. The count-based
// assertions therefore target :not([hidden]) visible cards.
const VISIBLE_CARD = 'article.presentation-archive-card:not([hidden])';
const ANY_CARD = 'article.presentation-archive-card';

for (const pageCase of PAGES) {
  test.describe(pageCase.name, () => {
    test('shared archive discovery works for canonical presentations', async ({ page }) => {
      await page.goto(pageCase.url);

      const archive = page.locator('[data-presentation-find-explore]');
      await expect(archive).toBeVisible();

      const yearSelect = archive.locator('[data-presentation-control="year"]');
      await expect
        .poll(async () => await yearSelect.locator('option').count(), { message: 'year options should load' })
        .toBeGreaterThan(1);

      await expect(archive.locator('[data-presentation-control="topic"]')).toBeVisible();
      await expect(archive.locator('select')).toHaveCount(1);
      await expect(archive.getByText(/Role|Rooli/)).toHaveCount(0);
      await expect(archive.getByRole('button', { name: /Kouluttaja|Tutkija|Asiantuntija/ })).toHaveCount(0);

      const searchInput = archive.locator('[data-presentation-control="search"]');
      const topicInput = archive.locator('[data-presentation-control="topic"]');

      await searchInput.fill(FIXTURES.localTitle);
      await expect(archive.locator(VISIBLE_CARD)).toHaveCount(1);
      await expect(archive.locator(VISIBLE_CARD)).toContainText(FIXTURES.localTitle);

      await yearSelect.selectOption(FIXTURES.localYear);
      await expect(archive.locator(VISIBLE_CARD)).toHaveCount(1);

      await topicInput.fill(FIXTURES.localTopic);
      await topicInput.blur();
      await expect(archive.locator(VISIBLE_CARD)).toHaveCount(1);

      // O1 widening decorates local presentation card links with ?returnTo=..., so match by href prefix.
      await archive.locator(`${VISIBLE_CARD} a[href^="${FIXTURES.localLanding}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(FIXTURES.localLanding.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

      await page.goto(pageCase.url);
      const archiveAgain = page.locator('[data-presentation-find-explore]');
      const searchAgain = archiveAgain.locator('[data-presentation-control="search"]');
      const yearAgain = archiveAgain.locator('[data-presentation-control="year"]');
      const topicAgain = archiveAgain.locator('[data-presentation-control="topic"]');

      await expect
        .poll(async () => await yearAgain.locator('option').count(), { message: 'year options should reload' })
        .toBeGreaterThan(1);

      await searchAgain.fill(FIXTURES.externalTitle);
      await yearAgain.selectOption(FIXTURES.externalYear);
      await topicAgain.fill(FIXTURES.externalTopic);
      await topicAgain.blur();

      const externalCard = archiveAgain.locator(VISIBLE_CARD);
      await expect(externalCard).toHaveCount(1);
      await expect(externalCard).toContainText(FIXTURES.externalTitle);
      await expect(externalCard.locator(`a[href="${FIXTURES.externalLanding}"]`).first()).toBeVisible();

      await archiveAgain.locator('[data-presentation-reset]').click();
      await expect(searchAgain).toHaveValue('');
      await expect(topicAgain).toHaveValue('');

      await searchAgain.fill(FIXTURES.topiclessTitle);
      const topiclessCard = archiveAgain.locator(VISIBLE_CARD);
      await expect(topiclessCard).toHaveCount(1);
      await expect(topiclessCard).toContainText(FIXTURES.topiclessTitle);
      // O1 widening decorates local presentation card links with ?returnTo=..., so match by href prefix.
      await expect(topiclessCard.locator(`a[href^="${FIXTURES.topiclessLanding}"]`).first()).toBeVisible();
    });

    test('filtered external-first card preserves target=_blank and rel', async ({ page }) => {
      await page.goto(pageCase.url);
      const archive = page.locator('[data-presentation-find-explore]');
      await expect(archive).toBeVisible();

      await archive.locator('[data-presentation-control="search"]').fill(FIXTURES.externalTitle);
      const card = archive.locator(VISIBLE_CARD);
      await expect(card).toHaveCount(1);

      const externalAnchor = card.locator(`a[href="${FIXTURES.externalLanding}"]`).first();
      await expect(externalAnchor).toBeVisible();
      await expect(externalAnchor).toHaveAttribute('target', '_blank');
      await expect(externalAnchor).toHaveAttribute('rel', /noopener/);
    });

    test('SSR opening cards carry the same returnTo decoration as filtered cards', async ({ page }) => {
      await page.goto(pageCase.url);
      // Every SSR card that points at a local /presentations/... URL
      // must carry ?returnTo=<hub> so that O1 orientation works from
      // initial paint. Under C1 every canonical card is in the DOM, so
      // we assert against the full set — not just visible ones — via a
      // single snapshot to avoid per-element retry races.
      const hrefs = await page.$$eval(
        `[data-presentation-results] ${ANY_CARD} a[href^="/presentations/"]`,
        (anchors) => anchors.map((a) => a.getAttribute('href'))
      );
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(href).toMatch(/\?returnTo=/);
      }
    });

    test('description text on the shared card is truncated to the archive limit', async ({ page }) => {
      await page.goto(pageCase.url);
      // Nunjucks truncate(180, true, "...") caps the SSR description at
      // 180 chars including the ellipsis. Sample once via $$eval to
      // avoid a 218-round per-element roundtrip. Allow small slack for
      // whitespace collapse.
      const lengths = await page.$$eval(
        `[data-presentation-results] ${ANY_CARD} .presentation-archive-card-desc`,
        (nodes) => nodes.map((n) => (n.textContent || '').trim().length)
      );
      expect(lengths.length).toBeGreaterThan(0);
      for (const length of lengths) {
        expect(length).toBeLessThanOrEqual(190);
      }
    });

    test('JS hydration reduces visible archive to the initial page size', async ({ page }) => {
      await page.goto(pageCase.url);
      const archive = page.locator('[data-presentation-find-explore]');
      await expect(archive).toBeVisible();
      // JS init hides cards past the first page immediately, then the
      // async ContentEngine.prefetch confirms filter default. Visible
      // count should settle at the archive page size (12).
      await expect(archive.locator(VISIBLE_CARD)).toHaveCount(12);
    });

    test('a card outside the initial page becomes visible via filter', async ({ page }) => {
      await page.goto(pageCase.url);
      const archive = page.locator('[data-presentation-find-explore]');
      await expect(archive.locator(VISIBLE_CARD)).toHaveCount(12);

      // topiclessTitle "Arjen tekoälyhaaste" is not among the newest 12
      // by date; searching for it must surface it as the sole visible
      // card, proving the filter reaches beyond the SSR opening subset.
      await archive.locator('[data-presentation-control="search"]').fill(FIXTURES.topiclessTitle);
      await expect(archive.locator(VISIBLE_CARD)).toHaveCount(1);
      await expect(archive.locator(VISIBLE_CARD)).toContainText(FIXTURES.topiclessTitle);
    });

    test('filter interactions reuse the same SSR DOM nodes (no rebuild)', async ({ page }) => {
      await page.goto(pageCase.url);
      const archive = page.locator('[data-presentation-find-explore]');
      await expect(archive.locator(VISIBLE_CARD)).toHaveCount(12);

      // Mark every currently-visible card with a test-only probe. A rebuild
      // would drop the probe (fresh nodes); a visibility toggle keeps it.
      await page.evaluate(() => {
        document
          .querySelectorAll(
            '[data-presentation-results] article.presentation-archive-card:not([hidden])'
          )
          .forEach((el, index) => {
            el.setAttribute('data-test-probe', String(index));
          });
      });

      // Trigger a filter that will keep at least one of the initial 12
      // in the result set (searching by year 2026 = the current year at
      // audit time; the newest 12 include multiple 2026 entries).
      await archive
        .locator('[data-presentation-control="year"]')
        .selectOption(FIXTURES.externalYear);

      const survivingProbes = await page.evaluate(() => {
        return document.querySelectorAll(
          '[data-presentation-results] article.presentation-archive-card:not([hidden])[data-test-probe]'
        ).length;
      });
      expect(survivingProbes).toBeGreaterThan(0);
    });
  });
}

test.describe('Presentations archive progressive-enhancement failure path', () => {
  for (const pageCase of PAGES) {
    test(`${pageCase.name}: /data/presentations-page.json fetch failure falls back to full SSR archive`, async ({ page }) => {
      // Simulate the runtime filter-data endpoint being unavailable. The
      // page must not turn this into loss of the canonical archive: the
      // SSR-rendered 218 cards must remain visible so the user can still
      // browse presentations.
      await page.route('**/data/presentations-page.json', (route) =>
        route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
      );

      await page.goto(pageCase.url);

      // Allow the async ContentEngine.prefetch to complete/fail and the
      // fallback path (showAllCards) to run.
      await page.waitForFunction(() => {
        const hidden = document.querySelectorAll(
          '[data-presentation-results] article.presentation-archive-card[hidden]'
        ).length;
        const total = document.querySelectorAll(
          '[data-presentation-results] article.presentation-archive-card'
        ).length;
        return total > 200 && hidden === 0;
      }, undefined, { timeout: 15000 });

      const total = await page.locator(
        `[data-presentation-results] ${ANY_CARD}`
      ).count();
      const hidden = await page.locator(
        `[data-presentation-results] ${ANY_CARD}[hidden]`
      ).count();
      expect(total).toBeGreaterThanOrEqual(200);
      expect(hidden).toBe(0);
    });
  }
});

test.describe('no-JS Presentations archive', () => {
  test.use({ javaScriptEnabled: false });

  for (const pageCase of PAGES) {
    test(`${pageCase.name}: complete canonical archive visible without JS`, async ({ page }) => {
      await page.goto(pageCase.url);

      // Every canonical presentation card must be present in SSR markup.
      const total = await page.locator(
        `[data-presentation-results] ${ANY_CARD}`
      ).count();
      // Baseline canonical population is ~218 today; assert well above
      // the SSR-opening subset (12) and near the canonical total.
      expect(total).toBeGreaterThan(12);
      expect(total).toBeGreaterThanOrEqual(200);

      // No card is server-rendered with the `hidden` attribute.
      const hiddenAtBuild = await page.locator(
        `[data-presentation-results] ${ANY_CARD}[hidden]`
      ).count();
      expect(hiddenAtBuild).toBe(0);

      // Every card has a usable primary anchor.
      const hrefCount = await page.locator(
        `[data-presentation-results] ${ANY_CARD} h3.presentation-archive-card-title a[href]`
      ).count();
      expect(hrefCount).toBe(total);

      // External-first card still opens in a new tab even without JS.
      const externalAnchor = page.locator(
        `[data-presentation-results] a[href="${FIXTURES.externalLanding}"]`
      ).first();
      await expect(externalAnchor).toHaveAttribute('target', '_blank');
      await expect(externalAnchor).toHaveAttribute('rel', /noopener/);

      // Local-first card still carries returnTo without JS.
      const localAnchor = page.locator(
        `[data-presentation-results] a[href^="${FIXTURES.localLanding}"]`
      ).first();
      const localHref = await localAnchor.getAttribute('href');
      expect(localHref).toMatch(/\?returnTo=/);
    });
  }
});

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
      await expect(archive.locator('article.presentation-archive-card')).toHaveCount(1);
      await expect(archive.locator('article.presentation-archive-card')).toContainText(FIXTURES.localTitle);

      await yearSelect.selectOption(FIXTURES.localYear);
      await expect(archive.locator('article.presentation-archive-card')).toHaveCount(1);

      await topicInput.fill(FIXTURES.localTopic);
      await topicInput.blur();
      await expect(archive.locator('article.presentation-archive-card')).toHaveCount(1);

      // O1 widening decorates local presentation card links with ?returnTo=..., so match by href prefix.
      await archive.locator(`a[href^="${FIXTURES.localLanding}"]`).first().click();
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

      const externalCard = archiveAgain.locator('article.presentation-archive-card');
      await expect(externalCard).toHaveCount(1);
      await expect(externalCard).toContainText(FIXTURES.externalTitle);
      await expect(externalCard.locator(`a[href="${FIXTURES.externalLanding}"]`).first()).toBeVisible();

      await archiveAgain.locator('[data-presentation-reset]').click();
      await expect(searchAgain).toHaveValue('');
      await expect(topicAgain).toHaveValue('');

      await searchAgain.fill(FIXTURES.topiclessTitle);
      const topiclessCard = archiveAgain.locator('article.presentation-archive-card');
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
      const card = archive.locator('article.presentation-archive-card');
      await expect(card).toHaveCount(1);

      const externalAnchor = card.locator(`a[href="${FIXTURES.externalLanding}"]`).first();
      await expect(externalAnchor).toBeVisible();
      await expect(externalAnchor).toHaveAttribute('target', '_blank');
      await expect(externalAnchor).toHaveAttribute('rel', /noopener/);
    });

    test('SSR opening cards carry the same returnTo decoration as filtered cards', async ({ page }) => {
      await page.goto(pageCase.url);
      // Every SSR opening card that points at a local /presentations/... URL
      // must carry ?returnTo=<hub> so that O1 orientation works from initial
      // paint, not only after client-side filter re-render. Snapshot the
      // href set in one evaluate call to avoid per-element retry races.
      const hrefs = await page.$$eval(
        '[data-presentation-results] article.presentation-archive-card a[href^="/presentations/"]',
        (anchors) => anchors.map((a) => a.getAttribute('href'))
      );
      expect(hrefs.length).toBeGreaterThan(0);
      for (const href of hrefs) {
        expect(href).toMatch(/\?returnTo=/);
      }
    });

    test('description text on the shared card is truncated to the archive limit', async ({ page }) => {
      await page.goto(pageCase.url);
      const archive = page.locator('[data-presentation-find-explore]');
      await expect(archive).toBeVisible();
      const descriptions = archive.locator('article.presentation-archive-card .presentation-archive-card-desc');
      const count = await descriptions.count();
      expect(count).toBeGreaterThan(0);
      // Nunjucks truncate(180, true, "...") caps rendered text at 180 chars
      // including the ellipsis. Allow small slack for whitespace collapse.
      for (let i = 0; i < count; i += 1) {
        const text = ((await descriptions.nth(i).textContent()) || '').trim();
        expect(text.length).toBeLessThanOrEqual(190);
      }
    });
  });
}

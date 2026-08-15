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

      await archive.locator(`a[href="${FIXTURES.localLanding}"]`).first().click();
      await expect(page).toHaveURL(new RegExp(`${FIXTURES.localLanding}$`));

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
      await expect(topiclessCard.locator(`a[href="${FIXTURES.topiclessLanding}"]`).first()).toBeVisible();
    });
  });
}

const { test, expect } = require("@playwright/test");

// PF4 — verify the four-line hierarchy on shared Find & Explore result
// cards after the audit-driven card trim. Assertions target the stable
// data-find-explore-card-line hooks the renderer emits.

async function typeAndWait(page, mount, query) {
  const queryInput = mount.locator("[data-find-explore-query]");
  await queryInput.fill(query);
  await expect(mount.locator("[data-find-explore-status]"))
    .toContainText(/tulos|tulosta|löytynyt/i, { timeout: 15000 });
}

test.describe("PF4 shared card hierarchy", () => {
  test("FI publications result card renders four-line hierarchy and preserves actions", async ({ page }) => {
    await page.goto("/julkaisut/");
    const mount = page.locator("[data-find-explore]").first();
    await expect(mount).toBeVisible();
    await typeAndWait(page, mount, "Kosovo");

    const firstCard = mount.locator(".find-explore-result--publication").first();
    await expect(firstCard).toBeVisible();

    // Line 1 (family + year on the same row).
    const familyLine = firstCard.locator("[data-find-explore-card-line='family']");
    await expect(familyLine).toHaveCount(1);
    await expect(familyLine.locator(".find-explore-result-family-badge")).toContainText("Julkaisut");
    // Publications always carry a year in the current dataset.
    await expect(familyLine.locator("[data-find-explore-card-year]")).toBeVisible();

    // Line 2 (title).
    await expect(firstCard.locator(".find-explore-result-title")).toBeVisible();

    // Line 3 (single primary meta text line — not a chip strip).
    const primaryMeta = firstCard.locator("[data-find-explore-card-line='primary-meta']");
    await expect(primaryMeta).toHaveCount(1);

    // Quality micro-copy line: exactly one, and NOT a colored bootstrap badge stack.
    const qualityLine = firstCard.locator("[data-find-explore-card-line='quality']");
    if (await qualityLine.count() > 0) {
      // If quality data exists on this record, it must be a single subdued text line.
      await expect(qualityLine).toHaveCount(1);
      // No colored badges should remain inside the card.
      const bootstrapBadges = firstCard.locator("span.badge.text-bg-primary, span.badge.text-bg-success, span.badge.text-bg-warning");
      expect(await bootstrapBadges.count(), "publication quality must not render colored bootstrap badges").toBe(0);
    }

    // Line 5 (actions): Open button must still be present.
    const actions = firstCard.locator("[data-find-explore-card-line='actions']");
    await expect(actions).toHaveCount(1);
    await expect(actions.locator("a", { hasText: /Avaa|Open/ }).first()).toBeVisible();
  });

  test("FI theses result card renders the four-line hierarchy with a single primary meta line", async ({ page }) => {
    await page.goto("/opinnaytteet/");
    const mount = page.locator("[data-find-explore]").first();
    await typeAndWait(page, mount, "6 luokkalaisten kokemuksia matematiikka ahdistuksesta");

    const firstCard = mount.locator(".find-explore-result").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator("[data-find-explore-card-line='family']")).toHaveCount(1);
    await expect(firstCard.locator(".find-explore-result-family-badge")).toContainText("Opinnäytteet");
    await expect(firstCard.locator(".find-explore-result-title")).toBeVisible();
    await expect(firstCard.locator("[data-find-explore-card-line='primary-meta']")).toHaveCount(1);
    // Theses do not render the shared card actions row.
    await expect(firstCard.locator("[data-find-explore-card-line='actions']")).toHaveCount(0);
  });

  test("FI writings result card renders the writing type on its single meta line", async ({ page }) => {
    await page.goto("/kirjoitukset/");
    const mount = page.locator("[data-find-explore]").first();
    await typeAndWait(page, mount, "Kampuspohdintaa Oulun yliopiston hallitus valitsi Kontinkankaan jatkokehitettäväksi kampusvaihtoehdoksi");

    const firstCard = mount.locator(".find-explore-result").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator(".find-explore-result-family-badge")).toContainText("Kirjoitukset ja puheenvuorot");
    await expect(firstCard.locator("[data-find-explore-card-line='primary-meta']")).toHaveCount(1);
  });

  test("Research contextual mount surfaces the family + primary meta hierarchy for a publication hit", async ({ page }) => {
    await page.goto("/tutkimus/");
    const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");
    await typeAndWait(page, mount, "Assessing Digital Competence of K1-12 Teachers in Kosovo");

    // On the Research mount publication hits render through the generic
    // card path (no per-mount publications-page record store), so we
    // assert the shared four-line hooks rather than the publication-only
    // action row.
    const firstCard = mount.locator(".find-explore-result").first();
    await expect(firstCard).toBeVisible();
    await expect(firstCard.locator("[data-find-explore-family='publications']")).toContainText("Julkaisut");
    await expect(firstCard.locator("[data-find-explore-card-line='family']")).toHaveCount(1);
    await expect(firstCard.locator("[data-find-explore-card-line='primary-meta']")).toHaveCount(1);
  });

  test("No shared card leaks a technical FindExplore label or a Sisältö:Tutkimus label", async ({ page }) => {
    await page.goto("/kirjoitukset/");
    const mount = page.locator("[data-find-explore]").first();
    await typeAndWait(page, mount, "Kampuspohdintaa");
    const badges = await mount.locator(".find-explore-result-family-badge").allTextContents();
    for (const text of badges) {
      expect(text, `Family badge must not leak FindExplore token: ${text}`).not.toMatch(/FindExplore/i);
      expect(text, "Sisältö:Tutkimus must never appear as a family label").not.toMatch(/^Tutkimus$/);
    }
  });

  test("Starter chips remain rendered and bespoke archive cards are untouched", async ({ page }) => {
    await page.goto("/mediassa/");
    await expect(page.locator("[data-starter-chips]").first()).toBeVisible();
    // Bespoke media archive cards must still render.
    await expect(page.locator("article.media-archive-card").first()).toBeVisible();

    await page.goto("/esitykset/");
    await expect(page.locator("[data-starter-chips]").first()).toBeVisible();
    await expect(page.locator("article.presentation-archive-card").first()).toBeVisible();
  });
});

const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

// PF4 — verify the four-line hierarchy on shared Find & Explore result
// cards after the audit-driven card trim. Assertions target the stable
// data-find-explore-card-line hooks the renderer emits.

async function typeAndWait(page, mount, query) {
  const queryInput = mount.locator("[data-find-explore-query]");
  await queryInput.fill(query);
}

test.describe("PF4 shared card hierarchy", () => {
  test("FI publications archive uses grouped tables instead of publication cards on the main archive surface", async ({ page }) => {
    await page.goto("/julkaisut/");
    const mount = page.locator("[data-find-explore]").first();
    await expect(mount).toBeVisible();
    await typeAndWait(page, mount, "Kosovo");
    await expect(page.locator(".publication-archive-row .publication-archive-title-link").first()).toBeVisible({ timeout: 15000 });
    await expect(mount.locator(".find-explore-result--publication")).toHaveCount(0);
    await expect(page.locator(".publication-archive-group")).not.toHaveCount(0);
    await expect(page.locator(".publication-archive-row .publication-archive-title-link").first()).toBeVisible();
    await expect(page.locator(".publication-archive-row .publication-archive-source-actions").first()).toBeVisible();
  });

  test("FI theses archive search keeps the same tbody surface and does not expose shared result cards", async ({ page }) => {
    // THESIS-HUB-02: FE moved from hub to subarchive. Thesis 62699 is a
    // Gradu-tarkastettu record → lives in the tarkastetut subarchive.
    await page.goto("/opinnaytteet/tarkastetut/");
    const mount = page.locator("[data-find-explore]").first();
    await typeAndWait(page, mount, "matematiikka-ahdistuksesta");
    await expect(page.locator(".thesis-archive-row .thesis-archive-title-link[href^='/opinnaytteet/62699/']")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".thesis-archive-row .thesis-archive-col-type").first()).toContainText("Gradu · tarkastettu");
    await expect(mount.locator(".find-explore-result")).toHaveCount(0);
  });

  test("FI writings result card renders the writing type on its single meta line", async ({ page }) => {
    await page.goto("/kirjoitukset/");
    const mount = page.locator("[data-find-explore]").first();
    await typeAndWait(page, mount, "Kampuspohdintaa Oulun yliopiston hallitus valitsi Kontinkankaan jatkokehitettäväksi kampusvaihtoehdoksi");

    const firstCard = mount.locator(".find-explore-result").first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
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
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await expect(firstCard.locator("[data-find-explore-family='publications']")).toContainText("Julkaisut");
    await expect(firstCard.locator("[data-find-explore-card-line='family']")).toHaveCount(1);
    await expect(firstCard.locator("[data-find-explore-card-line='primary-meta']")).toHaveCount(1);
  });

  test("No shared card leaks a technical FindExplore label or a Sisältö:Tutkimus label", async ({ page }) => {
    await page.goto("/kirjoitukset/");
    const mount = page.locator("[data-find-explore]").first();
    await typeAndWait(page, mount, "Kampuspohdintaa");
    await expect(mount.locator(".find-explore-result-family-badge").first()).toBeVisible({ timeout: 15000 });
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

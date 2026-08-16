const { test, expect } = require("@playwright/test");

// PF3 — verify the shared Find & Explore result renderer shows a visible
// content-family label derived from PF2's Sisältö vocabulary on every
// non-empty result card. Preserves publication-specific richness.

async function runSharedFindExploreSearch(page, url, query, kindSelector, expectedLabel) {
  await page.goto(url);
  const mount = page.locator("[data-find-explore]").first();
  await expect(mount).toBeVisible();
  const queryInput = mount.locator("[data-find-explore-query]");
  await queryInput.fill(query);
  await expect(mount.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta|result/i, { timeout: 15000 });
  const firstFamilyBadge = mount.locator(kindSelector).first();
  await expect(firstFamilyBadge, `${url} should render family badge for ${expectedLabel}`).toContainText(expectedLabel, { timeout: 15000 });
  return { mount };
}

test("FI writings result card shows Sisältö:Kirjoitukset ja puheenvuorot", async ({ page }) => {
  await runSharedFindExploreSearch(
    page,
    "/kirjoitukset/",
    "Kampuspohdintaa Oulun yliopiston hallitus valitsi Kontinkankaan jatkokehitettäväksi kampusvaihtoehdoksi",
    ".find-explore-result [data-find-explore-family='writings']",
    "Kirjoitukset ja puheenvuorot"
  );
});

test("FI theses result card shows Sisältö:Opinnäytteet", async ({ page }) => {
  await runSharedFindExploreSearch(
    page,
    "/opinnaytteet/",
    "6 luokkalaisten kokemuksia matematiikka ahdistuksesta",
    ".find-explore-result [data-find-explore-family='theses']",
    "Opinnäytteet"
  );
});

test("FI publications result card shows Sisältö:Julkaisut and preserves rich UI", async ({ page }) => {
  const { mount } = await runSharedFindExploreSearch(
    page,
    "/julkaisut/",
    "Kosovo",
    ".find-explore-result--publication [data-find-explore-family='publications']",
    "Julkaisut"
  );

  // Publication-specific richness must still be present on the first result.
  const firstPublicationCard = mount.locator(".find-explore-result--publication").first();
  await expect(firstPublicationCard).toBeVisible();
  await expect(firstPublicationCard.locator(".find-explore-result-title")).toBeVisible();
  const openButton = firstPublicationCard.locator("a", { hasText: /Avaa|Open/ }).first();
  await expect(openButton).toBeVisible();
});

test("Research contextual result card exposes family badges for multiple kinds", async ({ page }) => {
  await page.goto("/tutkimus/");
  const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");
  await expect(mount).toBeVisible();
  await mount.locator("[data-find-explore-query]").fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
  await expect(mount.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  const publicationBadge = mount.locator(".find-explore-result [data-find-explore-family='publications']").first();
  await expect(publicationBadge).toContainText("Julkaisut", { timeout: 15000 });
});

test("No shared result card visibly leaks technical FindExplore labels", async ({ page }) => {
  await page.goto("/kirjoitukset/");
  const mount = page.locator("[data-find-explore]").first();
  await mount.locator("[data-find-explore-query]").fill("Kampuspohdintaa");
  await expect(mount.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  // The visible badge is `Kirjoitukset ja puheenvuorot`, never `FindExplore:writings` or similar.
  const badges = await mount.locator(".find-explore-result-family-badge").allTextContents();
  for (const text of badges) {
    expect(text, `Family badge must not leak FindExplore token: ${text}`).not.toMatch(/FindExplore/i);
  }
});

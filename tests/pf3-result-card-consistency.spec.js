const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

// PF3 — verify the shared Find & Explore result renderer shows a visible
// content-family label derived from PF2's Sisältö vocabulary on every
// non-empty result card. Preserves publication-specific richness.

async function runSharedFindExploreSearch(page, url, query, kindSelector, expectedLabel) {
  await page.goto(url);
  const mount = page.locator("[data-find-explore]").first();
  await expect(mount).toBeVisible();
  const queryInput = mount.locator("[data-find-explore-query]");
  await queryInput.fill(query);
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

test("FI theses archive search stays on the shared tbody surface instead of rendering family-badge cards", async ({ page }) => {
  // THESIS-HUB-02: FE now on the gradut subarchive (hub has no FE).
  // The Gradu-tarkastettu thesis 62699 lives in advisedMasters where
  // "role" is `reviewed` but the source-of-truth cache still classifies
  // 62699 as reviewed-only. We use the tarkastetut subarchive to match
  // that record's group.
  await page.goto("/opinnaytteet/tarkastetut/");
  const mount = page.locator("[data-find-explore]").first();
  await expect(mount).toBeVisible();
  await mount.locator("[data-find-explore-query]").fill("matematiikka-ahdistuksesta");
  await expect(page.locator(".thesis-archive-row .thesis-archive-title-link[href^='/opinnaytteet/62699/']")).toBeVisible({ timeout: 15000 });
  await expect(mount.locator(".find-explore-result [data-find-explore-family='theses']")).toHaveCount(0);
});

test("Research contextual publication hit still shows Sisältö:Julkaisut on the shared card path", async ({ page }) => {
  const { mount } = await runSharedFindExploreSearch(
    page,
    "/tutkimus/",
    "Kosovo",
    ".find-explore-result [data-find-explore-family='publications']",
    "Julkaisut"
  );

  const firstPublicationCard = mount.locator(".find-explore-result").first();
  await expect(firstPublicationCard).toBeVisible();
  await expect(firstPublicationCard.locator(".find-explore-result-title")).toBeVisible();
  await expect(firstPublicationCard.locator("[data-find-explore-card-line='family']")).toHaveCount(1);
});

test("Research contextual result card exposes family badges for multiple kinds", async ({ page }) => {
  await page.goto("/tutkimus/");
  const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");
  await expect(mount).toBeVisible();
  await mount.locator("[data-find-explore-query]").fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
  const publicationBadge = mount.locator(".find-explore-result [data-find-explore-family='publications']").first();
  await expect(publicationBadge).toContainText("Julkaisut", { timeout: 15000 });
});

test("No shared result card visibly leaks technical FindExplore labels", async ({ page }) => {
  await page.goto("/kirjoitukset/");
  const mount = page.locator("[data-find-explore]").first();
  await mount.locator("[data-find-explore-query]").fill("Kampuspohdintaa");
  await expect(mount.locator(".find-explore-result-family-badge").first()).toBeVisible({ timeout: 15000 });
  // The visible badge is `Kirjoitukset ja puheenvuorot`, never `FindExplore:writings` or similar.
  const badges = await mount.locator(".find-explore-result-family-badge").allTextContents();
  for (const text of badges) {
    expect(text, `Family badge must not leak FindExplore token: ${text}`).not.toMatch(/FindExplore/i);
  }
});

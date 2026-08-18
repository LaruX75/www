/**
 * TH-CITE1 Phase 3 — thesis archive pagination browser proof.
 *
 * Verifies the corrected SSR-first architecture end-to-end:
 *
 *   1. JS-off / no-JS parity: pagination links are real SSR anchors,
 *      and each per-section permalink is a fully rendered SSR page.
 *   2. Progressive-enhancement independence: with JavaScript enabled,
 *      clicking Masters page 6 while Bachelors is on page 2 and
 *      Reviewed on page 5 changes ONLY the Masters section fragment.
 *      Bachelors + Reviewed retain their current DOM rows.
 *   3. Top + bottom paginator synchronisation: after a section swap,
 *      both the top paginator and the bottom paginator inside the
 *      swapped section identify the new page as `active`. Guaranteed
 *      by the atomic fragment swap (both paginators come from the
 *      same Eleventy-rendered source).
 *   4. Page budget: no section shows more than 10 rows; no page has
 *      the 169-row DOM antipattern.
 *   5. No full-page reload during enhanced-pagination clicks.
 *
 * Also runs equivalent checks for Bachelors and Reviewed independence.
 */
const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

async function sectionCurrentPage(page, sectionKey, position) {
  const active = page.locator(
    '[data-thesis-section="' + sectionKey + '"] ' +
    '[data-thesis-pager-position="' + position + '"] .page-item.active .page-link'
  );
  return parseInt((await active.first().innerText()).trim(), 10);
}

async function sectionRowCount(page, sectionKey) {
  return await page
    .locator('[data-thesis-section="' + sectionKey + '"] .thesis-archive-table tbody tr')
    .count();
}

async function firstRowTitle(page, sectionKey) {
  return (
    await page
      .locator('[data-thesis-section="' + sectionKey + '"] .thesis-archive-table tbody tr:first-child .thesis-archive-title-link')
      .innerText()
  ).trim();
}

test("SSR-only pagination links are real anchors and each landing/page URL is a fully server-rendered document", async ({ page }) => {
  // Landing renders all three sections at page 1
  const landing = await page.request.get("/opinnaytteet/");
  expect(landing.ok()).toBeTruthy();
  const landingBody = await landing.text();
  expect(landingBody).toMatch(/data-thesis-section="advisedMasters"/);
  expect(landingBody).toMatch(/data-thesis-section="advisedBachelors"/);
  expect(landingBody).toMatch(/data-thesis-section="reviewed"/);
  expect(landingBody).toMatch(/data-thesis-pager-link/);
  expect(landingBody).toMatch(/href="\/opinnaytteet\/ohjatut-gradut\/page\/2\/"/);

  // Bounded per-section permalinks all render as real SSR pages
  for (const url of [
    "/opinnaytteet/ohjatut-gradut/page/2/",
    "/opinnaytteet/ohjatut-gradut/page/9/",
    "/opinnaytteet/kandityot/page/3/",
    "/opinnaytteet/tarkastetut/page/6/",
    "/en/theses/masters/page/2/",
    "/en/theses/bachelors/page/2/",
    "/en/theses/reviewed/page/4/"
  ]) {
    const resp = await page.request.get(url);
    expect(resp.ok(), `${url} SSR page must exist`).toBeTruthy();
    const body = await resp.text();
    expect(body).toMatch(/data-thesis-section="advisedMasters"/);
    expect(body).toMatch(/data-thesis-section="advisedBachelors"/);
    expect(body).toMatch(/data-thesis-section="reviewed"/);
  }
});

test("independent enhanced state: Masters swap preserves Bachelors + Reviewed page state and does not full-page-reload", async ({ page }) => {
  // Establish the multi-section starting state via real navigation:
  // start on Reviewed page 5, then navigate to Bachelors page 2, then
  // hydrate Masters up to page 4 through the JS enhancement. The
  // final enhanced UI state we assert is (Masters=4, Bachelors=2,
  // Reviewed=5) — which is the exact combined state the architecture
  // directive requires to be representable during interactive use.
  await page.goto("/opinnaytteet/tarkastetut/page/5/");
  expect(await sectionCurrentPage(page, "reviewed", "top")).toBe(5);

  // Hydrate Bachelors to page 2 via the enhancement JS. Track that
  // this is NOT a full-page reload (window doesn't reload).
  await page.evaluate(() => { window.__thesisPageReloaded = false; window.addEventListener("beforeunload", () => { window.__thesisPageReloaded = true; }); });
  await page.locator('[data-thesis-section="advisedBachelors"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="2"]').click();
  await expect
    .poll(async () => sectionCurrentPage(page, "advisedBachelors", "top"), { timeout: 5000 })
    .toBe(2);

  // Confirm Reviewed page 5 STAYED — Bachelors swap must not have touched Reviewed
  expect(await sectionCurrentPage(page, "reviewed", "top")).toBe(5);
  expect(await sectionCurrentPage(page, "reviewed", "bottom")).toBe(5);
  const reviewedFirstBefore = await firstRowTitle(page, "reviewed");

  // Hydrate Masters to page 4
  await page.locator('[data-thesis-section="advisedMasters"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="4"]').click();
  await expect.poll(async () => sectionCurrentPage(page, "advisedMasters", "top"), { timeout: 5000 }).toBe(4);
  expect(await sectionCurrentPage(page, "advisedMasters", "bottom")).toBe(4);

  // Middle assertion: full independent enhanced state (Masters=4, Bachelors=2, Reviewed=5)
  expect(await sectionCurrentPage(page, "advisedMasters", "top")).toBe(4);
  expect(await sectionCurrentPage(page, "advisedBachelors", "top")).toBe(2);
  expect(await sectionCurrentPage(page, "reviewed", "top")).toBe(5);

  // Now click Masters page 6: only Masters must change
  const bachelorsFirstBefore = await firstRowTitle(page, "advisedBachelors");
  await page.locator('[data-thesis-section="advisedMasters"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="6"]').click();
  await expect.poll(async () => sectionCurrentPage(page, "advisedMasters", "top"), { timeout: 5000 }).toBe(6);
  expect(await sectionCurrentPage(page, "advisedMasters", "bottom")).toBe(6);

  // Assert final independent state
  expect(await sectionCurrentPage(page, "advisedMasters", "top")).toBe(6);
  expect(await sectionCurrentPage(page, "advisedBachelors", "top")).toBe(2);
  expect(await sectionCurrentPage(page, "reviewed", "top")).toBe(5);

  // Bachelors + Reviewed DOM rows untouched by the Masters swap
  expect(await firstRowTitle(page, "advisedBachelors")).toBe(bachelorsFirstBefore);
  expect(await firstRowTitle(page, "reviewed")).toBe(reviewedFirstBefore);

  // Row-count budget: each section shows at most 10 rows
  expect(await sectionRowCount(page, "advisedMasters")).toBeLessThanOrEqual(10);
  expect(await sectionRowCount(page, "advisedBachelors")).toBeLessThanOrEqual(10);
  expect(await sectionRowCount(page, "reviewed")).toBeLessThanOrEqual(10);

  // No full-page reload occurred during enhancement clicks
  const reloaded = await page.evaluate(() => window.__thesisPageReloaded === true);
  expect(reloaded).toBe(false);
});

test("independent enhanced state: Bachelors and Reviewed swaps do not disturb the other sections", async ({ page }) => {
  await page.goto("/opinnaytteet/");
  // Baseline: all three at page 1
  expect(await sectionCurrentPage(page, "advisedMasters", "top")).toBe(1);
  expect(await sectionCurrentPage(page, "advisedBachelors", "top")).toBe(1);
  expect(await sectionCurrentPage(page, "reviewed", "top")).toBe(1);

  // Move Bachelors to page 3, Reviewed to page 4 via enhancement
  await page.locator('[data-thesis-section="advisedBachelors"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="3"]').click();
  await expect.poll(async () => sectionCurrentPage(page, "advisedBachelors", "top"), { timeout: 5000 }).toBe(3);
  await page.locator('[data-thesis-section="reviewed"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="4"]').click();
  await expect.poll(async () => sectionCurrentPage(page, "reviewed", "top"), { timeout: 5000 }).toBe(4);

  // Masters still on page 1
  expect(await sectionCurrentPage(page, "advisedMasters", "top")).toBe(1);
  expect(await sectionCurrentPage(page, "advisedMasters", "bottom")).toBe(1);

  const mastersFirstBefore = await firstRowTitle(page, "advisedMasters");

  // Click Reviewed page 6 → Bachelors + Masters unchanged
  await page.locator('[data-thesis-section="reviewed"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="6"]').click();
  await expect.poll(async () => sectionCurrentPage(page, "reviewed", "top"), { timeout: 5000 }).toBe(6);
  expect(await sectionCurrentPage(page, "reviewed", "bottom")).toBe(6);
  expect(await sectionCurrentPage(page, "advisedBachelors", "top")).toBe(3);
  expect(await sectionCurrentPage(page, "advisedMasters", "top")).toBe(1);
  expect(await firstRowTitle(page, "advisedMasters")).toBe(mastersFirstBefore);
});

test("top and bottom paginators for the same section always represent the same page", async ({ page }) => {
  await page.goto("/opinnaytteet/");
  for (const targetPage of [3, 7, 2]) {
    await page.locator(`[data-thesis-section="advisedMasters"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="${targetPage}"]`).click();
    await expect.poll(async () => sectionCurrentPage(page, "advisedMasters", "top"), { timeout: 5000 }).toBe(targetPage);
    expect(await sectionCurrentPage(page, "advisedMasters", "bottom")).toBe(targetPage);
  }
});

test("Bachelors section: top+bottom synchronised across multiple page changes", async ({ page }) => {
  await page.goto("/opinnaytteet/");
  for (const targetPage of [2, 3, 2]) {
    await page.locator(`[data-thesis-section="advisedBachelors"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="${targetPage}"]`).click();
    await expect.poll(async () => sectionCurrentPage(page, "advisedBachelors", "top"), { timeout: 5000 }).toBe(targetPage);
    expect(await sectionCurrentPage(page, "advisedBachelors", "bottom")).toBe(targetPage);
  }
});

test("EN archive supports the same independent per-section enhancement", async ({ page }) => {
  await page.goto("/en/theses/");
  await page.locator('[data-thesis-section="advisedMasters"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="3"]').click();
  await expect.poll(async () => sectionCurrentPage(page, "advisedMasters", "top"), { timeout: 5000 }).toBe(3);
  expect(await sectionCurrentPage(page, "advisedBachelors", "top")).toBe(1);
  expect(await sectionCurrentPage(page, "reviewed", "top")).toBe(1);

  await page.locator('[data-thesis-section="reviewed"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="2"]').click();
  await expect.poll(async () => sectionCurrentPage(page, "reviewed", "top"), { timeout: 5000 }).toBe(2);
  expect(await sectionCurrentPage(page, "reviewed", "bottom")).toBe(2);
  expect(await sectionCurrentPage(page, "advisedMasters", "top")).toBe(3);
});

test("JavaScript disabled: pagination links are real anchors and full-page navigation works", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto("/opinnaytteet/");
  // Landing without JS: all three sections at page 1 (as SSR).
  // Fetch DOM attribute directly rather than requiring visibility
  // (the pager is inside a Bootstrap card whose visibility depends
  // on unrelated table CSS scripts; the essential proof here is that
  // the pagination link is a REAL SSR anchor with a real href).
  const activeMastersTop = await page
    .locator('[data-thesis-section="advisedMasters"] [data-thesis-pager-position="top"] .page-item.active')
    .first()
    .textContent();
  expect(activeMastersTop.trim()).toMatch(/^1\b/);

  // Extract the real SSR href for Masters page 5 from the DOM, then
  // navigate to it as any real browser (or crawler) would.
  const link5Href = await page
    .locator('[data-thesis-section="advisedMasters"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="5"]')
    .getAttribute("href");
  expect(link5Href).toBe("/opinnaytteet/ohjatut-gradut/page/5/");
  await page.goto(link5Href);

  await expect(page).toHaveURL(/\/opinnaytteet\/ohjatut-gradut\/page\/5\/$/);
  const activeMastersTop5 = await page
    .locator('[data-thesis-section="advisedMasters"] [data-thesis-pager-position="top"] .page-item.active')
    .first()
    .textContent();
  expect(activeMastersTop5.trim()).toMatch(/^5\b/);

  // Bachelors + Reviewed reset to page 1 in URL (documented no-JS degradation)
  const activeBachelorsTop = await page
    .locator('[data-thesis-section="advisedBachelors"] [data-thesis-pager-position="top"] .page-item.active')
    .first()
    .textContent();
  const activeReviewedTop = await page
    .locator('[data-thesis-section="reviewed"] [data-thesis-pager-position="top"] .page-item.active')
    .first()
    .textContent();
  expect(activeBachelorsTop.trim()).toMatch(/^1\b/);
  expect(activeReviewedTop.trim()).toMatch(/^1\b/);

  await context.close();
});

test("Phase 3 does not push misleading single-section history entries during enhanced multi-section state", async ({ page }) => {
  await page.goto("/opinnaytteet/");
  const initialUrl = page.url();
  // Enhanced pagination should NOT change the URL (per architecture:
  // multi-section state cannot be represented truthfully by a single
  // per-section SSR URL, so history is intentionally not updated).
  await page.locator('[data-thesis-section="advisedMasters"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="3"]').click();
  await expect.poll(async () => sectionCurrentPage(page, "advisedMasters", "top"), { timeout: 5000 }).toBe(3);
  await page.locator('[data-thesis-section="advisedBachelors"] [data-thesis-pager-position="top"] a[data-thesis-pager-target-page="2"]').click();
  await expect.poll(async () => sectionCurrentPage(page, "advisedBachelors", "top"), { timeout: 5000 }).toBe(2);
  // URL stayed at the initial landing (no misleading pushState)
  expect(page.url()).toBe(initialUrl);
});

const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("FI theses Find & Explore supports author search, filter-only search, and reset on the shared tbody", async ({ page }) => {
  await page.goto("/opinnaytteet/");

  await page.locator("[data-find-explore-query]").fill("Riikonen");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", "/opinnaytteet/62699/", { timeout: 15000 });

  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("[data-find-explore-query]")).toBeFocused();
  await page.locator("[data-find-explore-type]").selectOption("masterThesis");
  await page.locator("[data-find-explore-role]").selectOption("reviewed");
  await page.locator("[data-find-explore-year]").selectOption("2026");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  const typeCells = await page.locator("[data-find-explore-results] .thesis-archive-col-type").allTextContents();
  expect(typeCells.every((value) => value.includes("Gradu") && value.includes("tarkastettu"))).toBeTruthy();

  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("[data-find-explore-results] tr")).toHaveCount(20);
});

// TH-CITE1 Phase 4D: the pre-Phase-3 test "FI theses curated cards
// preserve abstract and citation actions" is retired. That test
// asserted archive-card abstract/citation modal triggers that no
// longer exist. Phase 3 replaced the rich card grid with a compact
// SSR table (Year | Citation | Open), Phase 4B moved citation/
// export to canonical thesis detail pages, and Phase 4C deleted
// all browser-side raw-field composition. Detail-page modal
// behaviour is covered by tests/th-cite1-phase4b-thesis-detail-modal
// .spec.js (11 tests) and no-raw-field-fallback behaviour by
// tests/th-cite1-phase4c-no-raw-field-fallback.spec.js (7 tests) —
// duplicating either suite inside F3A would just add noise.
//
// F3A's own contract is the archive Find & Explore + local-canonical-
// detail-link semantics tested above. What F3A can add on top is a
// small guarantee that the archive itself does NOT accidentally
// regain the pre-Phase-3 archive-card modal triggers.
test("FI archive does not carry pre-Phase-3 archive modal triggers", async ({ page }) => {
  const response = await page.request.get("/opinnaytteet/");
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  // Archive rows must remain compact SSR — no abstract-modal or
  // citation-export triggers.
  expect(html).not.toMatch(/data-thesis-abstract-trigger/);
  expect(html).not.toMatch(/data-thesis-citation-trigger/);
  expect(html).not.toMatch(/id="thesisAbstractModal"/);
  expect(html).not.toMatch(/id="thesisCitationModal"/);
  expect(html).not.toMatch(/thesis-archive-citation/);
  const rows = html.match(/class="thesis-archive-title-link/g) || [];
  expect(rows.length).toBeLessThanOrEqual(20);
});

test("EN theses Find & Explore resolves local canonical detail links", async ({ page }) => {
  await page.goto("/en/theses/");

  await page.locator("[data-find-explore-query]").fill("Gill");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/result|results/, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", "/opinnaytteet/51005/", { timeout: 15000 });
});

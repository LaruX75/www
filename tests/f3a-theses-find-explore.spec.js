const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

function normalizeTexts(values) {
  return values.map((value) => value.trim()).filter(Boolean);
}

test("FI thesis header controls expose only valid domain options and combine with author sorting on the shared tbody", async ({ page }) => {
  await page.goto("/opinnaytteet/");

  await expect(page.locator("[data-find-explore-year-order]")).toHaveValue("year-desc");
  await expect(page.locator("[data-find-explore-author-sort]")).toHaveValue("use-year");

  const typeRoleOptions = normalizeTexts(await page.locator("[data-find-explore-type-role] option").allTextContents());
  expect(typeRoleOptions).toEqual([
    "Kaikki",
    "Gradu · ohjattu",
    "Gradu · tarkastettu",
    "Kandi · ohjattu"
  ]);
  expect(typeRoleOptions).not.toContain("Kandi · tarkastettu");

  await page.locator("[data-find-explore-type-role]").selectOption("masterThesis::reviewed");
  await page.locator("[data-find-explore-author-sort]").selectOption("author-asc");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);
  await expect(page.locator("li.find-explore-result")).toHaveCount(0);

  const typeCells = normalizeTexts(await page.locator("[data-find-explore-results] .thesis-archive-col-type").allTextContents());
  expect(typeCells.length).toBeGreaterThan(0);
  expect(typeCells.every((value) => value === "Gradu · tarkastettu")).toBeTruthy();

  const authors = normalizeTexts(await page.locator("[data-find-explore-results] .thesis-archive-col-author").allTextContents());
  const authorsAsc = [...authors].sort((left, right) => left.localeCompare(right, "fi"));
  expect(authors).toEqual(authorsAsc);

  const firstTitle = page.locator("[data-find-explore-results] .thesis-archive-title-link").first();
  const firstSource = page.locator("[data-find-explore-results] .thesis-archive-col-source a").first();
  await expect(firstTitle).toHaveAttribute("href", /\/opinnaytteet\/\d+\/$/);
  await expect(firstSource).toHaveAttribute("href", /^https:\/\/oulurepo\.oulu\.fi\/handle\/10024\//);
  await expect(firstSource).toHaveAttribute("target", "_blank");

  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("[data-find-explore-query]")).toBeFocused();
  await expect(page.locator("[data-find-explore-year-order]")).toHaveValue("year-desc");
  await expect(page.locator("[data-find-explore-author-sort]")).toHaveValue("use-year");
  await expect(page.locator("[data-find-explore-type-role]")).toHaveValue("");
  await expect(page.locator("[data-find-explore-results] tr")).toHaveCount(20);
});

test("FI theses year ordering switches to oldest-first via Pagefind and returns cleanly to SSR default", async ({ page }) => {
  await page.goto("/opinnaytteet/");

  const initialHref = await page.locator("[data-find-explore-results] .thesis-archive-title-link").first().getAttribute("href");

  await page.locator("[data-find-explore-year-order]").selectOption("year-asc");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);
  await expect(page.locator("[data-find-explore-results] .thesis-archive-title-link").first()).toHaveAttribute("href", "/opinnaytteet/38572/");

  await page.locator("[data-find-explore-year-order]").selectOption("year-desc");
  await expect(page.locator("body")).not.toHaveClass(/find-explore-active/);
  await expect(page.locator("[data-find-explore-results] .thesis-archive-title-link").first()).toHaveAttribute("href", initialHref);
  await expect(page.locator('[data-thesis-archive-pager-position="top"]')).toBeVisible();
  await expect(page.locator('[data-thesis-archive-pager-position="bottom"]')).toBeVisible();
});

test("FI theses Find & Explore still supports text search on the shared tbody", async ({ page }) => {
  await page.goto("/opinnaytteet/");

  await page.locator("[data-find-explore-query]").fill("Riikonen");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", "/opinnaytteet/62699/", { timeout: 15000 });
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

  const typeRoleOptions = normalizeTexts(await page.locator("[data-find-explore-type-role] option").allTextContents());
  expect(typeRoleOptions).toEqual([
    "All",
    "Master's · advised",
    "Master's · reviewed",
    "Bachelor's · advised"
  ]);
  expect(typeRoleOptions).not.toContain("Bachelor's · reviewed");

  await page.locator("[data-find-explore-query]").fill("Gill");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/result|results/, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", "/opinnaytteet/51005/", { timeout: 15000 });
});

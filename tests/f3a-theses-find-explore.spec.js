const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * F3A — thesis Find & Explore contract.
 *
 * THESIS-HUB-02 retargets thesis Find & Explore from the (now hub-only)
 * `/opinnaytteet/` landing to the three scoped subarchives:
 *   /opinnaytteet/gradut/        FE pinned type=masterThesis, role=advised
 *   /opinnaytteet/kandit/        FE pinned type=bachelorThesis, role=advised
 *   /opinnaytteet/tarkastetut/   FE pinned role=reviewed
 * EN mirrors are /en/theses/{masters,bachelors,reviewed}/.
 *
 * The hub landing carries NO FE (that assertion lives in
 * thesis-hub-02-hub-and-subarchives.spec.js). This spec verifies the
 * per-subarchive contract that:
 *   - the archive-row surface is the same shared tbody (no card cards)
 *   - the FI known-thesis text search resolves to canonical detail
 *   - the EN scoped search still works and returns local detail URLs
 *   - the archive is compact SSR (no pre-Phase-3 modal triggers)
 */

test("FI gradut subarchive: shared tbody + text search resolves to canonical detail", async ({ page }) => {
  await page.goto("/opinnaytteet/gradut/");
  const initialHref = await page.locator("[data-find-explore-results] .thesis-archive-title-link").first().getAttribute("href");
  expect(initialHref).not.toContain("returnTo=");

  // Search a term guaranteed to hit an advised master's thesis under
  // this scope. (The pre-hub monolithic archive used "Riikonen" but
  // that record is reviewerOnly — it lives in /opinnaytteet/tarkastetut/
  // now.)
  await page.locator("[data-find-explore-query]").fill("Teknologiakasvattajan");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);
  // Results replace the shared tbody, not the card list.
  await expect(page.locator("li.find-explore-result")).toHaveCount(0);

  const firstTitle = page.locator("[data-find-explore-results] .thesis-archive-title-link").first();
  await expect(firstTitle).toHaveAttribute("href", /^\/opinnaytteet\/\d+\/\?returnTo=/);
  const firstSource = page.locator("[data-find-explore-results] .thesis-archive-col-source a").first();
  await expect(firstSource).toHaveAttribute("href", /^https:\/\/oulurepo\.oulu\.fi\/handle\/10024\//);
  await expect(firstSource).toHaveAttribute("target", "_blank");

  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("[data-find-explore-query]")).toBeFocused();
  await expect(page.locator("body")).not.toHaveClass(/find-explore-active/);
  await expect(page.locator("[data-find-explore-results] .thesis-archive-title-link").first()).toHaveAttribute("href", initialHref);
});

test("FI tarkastetut subarchive scopes to role=reviewed via pinned mount attributes", async ({ page }) => {
  const html = await page.request.get("/opinnaytteet/tarkastetut/").then((r) => r.text());
  expect(html).toContain('data-find-explore-pinned-role="reviewed"');
  // Reviewed scope has no pinned type (canonical data may include both
  // master's and bachelor's roles as reviewed).
  expect(html).not.toMatch(/data-find-explore-pinned-type=/);

  await page.goto("/opinnaytteet/tarkastetut/");
  const rows = await page.locator("[data-find-explore-results] .thesis-archive-col-type").allTextContents();
  for (const cell of rows) {
    expect(cell.trim(), `tarkastetut SSR tbody must only show tarkastettu-role rows (got "${cell.trim()}")`)
      .toMatch(/tarkastettu/);
  }
});

test("subarchive tables do not carry pre-Phase-3 archive modal triggers", async ({ page }) => {
  for (const url of ["/opinnaytteet/gradut/", "/opinnaytteet/kandit/", "/opinnaytteet/tarkastetut/"]) {
    const html = await page.request.get(url).then((r) => r.text());
    expect(html, `${url} must not have thesis abstract trigger`).not.toMatch(/data-thesis-abstract-trigger/);
    expect(html, `${url} must not have thesis citation trigger`).not.toMatch(/data-thesis-citation-trigger/);
    expect(html, `${url} must not carry the archive-side citation modal`).not.toMatch(/id="thesisCitationModal"/);
    const rows = html.match(/class="thesis-archive-title-link/g) || [];
    expect(rows.length, `${url} must render at most 20 SSR rows on the first page`).toBeLessThanOrEqual(20);
  }
});

test("EN masters subarchive text search resolves to canonical detail link", async ({ page }) => {
  await page.goto("/en/theses/masters/");
  await page.locator("[data-find-explore-query]").fill("Gill");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/result|results/, { timeout: 15000 });
  const first = page.locator("[data-find-explore-results] .thesis-archive-title-link").first();
  await expect(first).toHaveAttribute("href", /^\/opinnaytteet\/51005\/\?returnTo=/, { timeout: 15000 });
});

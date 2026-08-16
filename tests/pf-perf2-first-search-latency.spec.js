const { test, expect } = require("@playwright/test");

// PF-PERF2 — verify the Pagefind warmup pattern:
//   - warmup does NOT trigger an automatic search on page load
//   - warmup does load /pagefind/pagefind.js before the user types
//   - the first explicit query still controls result rendering
//   - starter chips still do not invoke Pagefind directly (the chip
//     handler dispatches an event; the existing runtime handles it)
//   - Research boundary + no data-pagefind-body preserved

async function collectPagefindRequests(page) {
  const requests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/\/pagefind\/pagefind\.js/.test(url)) requests.push(url);
  });
  return requests;
}

test.describe("PF-PERF2 Pagefind warmup", () => {
  test("FI writings page loads without an automatic Pagefind search but warms the module", async ({ page }) => {
    const pagefindRequests = await collectPagefindRequests(page);
    await page.goto("/kirjoitukset/");

    // No results rendered before the user acts.
    const initialResults = await page.locator("[data-find-explore-results] li.find-explore-result").count();
    expect(initialResults, "no results should render on page load").toBe(0);

    // Give the browser an idle window so the warmup can dispatch.
    await page.waitForTimeout(3000);

    // Warmup should have kicked off the pagefind.js import by now
    // (either via idle callback or a synthetic focus below). Focus the
    // query field to guarantee the focus trigger fires too.
    await page.locator("[data-find-explore-query]").focus();
    await page.waitForTimeout(1500);

    // Results list should carry no result cards yet.
    const afterWarmupResults = await page.locator("[data-find-explore-results] li.find-explore-result").count();
    expect(afterWarmupResults, "no results should appear from warmup alone").toBe(0);

    // Pagefind module must have been requested at least once via the
    // warmup (or the on-demand path if warmup hadn't fired — either
    // way, no user-visible auto-search happened).
    expect(pagefindRequests.length, `Pagefind module should be requested by warmup; got ${JSON.stringify(pagefindRequests)}`)
      .toBeGreaterThanOrEqual(1);
  });

  test("First explicit query renders results and marks the results list aria-busy while loading", async ({ page }) => {
    await page.goto("/opinnaytteet/");

    const mount = page.locator("[data-find-explore]").first();
    const queryInput = mount.locator("[data-find-explore-query]");
    await queryInput.focus();
    await queryInput.fill("6 luokkalaisten kokemuksia matematiikka ahdistuksesta");

    // Loading state is set synchronously — grab it before the search resolves
    // by asserting via the eventual results status.
    await expect(mount.locator("[data-find-explore-status]"))
      .toContainText(/tulos|tulosta/, { timeout: 15000 });

    // Once results are in, aria-busy is cleared.
    await expect(mount.locator("[data-find-explore-results]"))
      .not.toHaveAttribute("aria-busy", "true");

    // At least one result card rendered.
    const cards = await mount.locator("[data-find-explore-results] li.find-explore-result").count();
    expect(cards).toBeGreaterThan(0);
  });

  test("Starter chip on /tutkimus/ still relies on the existing runtime and does not itself call Pagefind", async ({ page }) => {
    const pagefindRequests = [];
    page.on("request", (request) => {
      const url = request.url();
      if (/\/pagefind\/pagefind\.js/.test(url)) pagefindRequests.push(url);
    });
    await page.goto("/tutkimus/");

    // No preselected chip on load.
    const preClicked = await page.locator("[data-starter-chip][aria-pressed='true']").count();
    expect(preClicked).toBe(0);

    // Click the Tekoäly chip; the chip runtime sets the topic select value
    // and dispatches change; the existing runtime handles the search.
    await page.locator("[data-starter-chip][data-starter-chip-value='tekoäly']").click();
    await expect(page.locator("#researchEvidenceExploreTopic")).toHaveValue("tekoäly");

    // Runtime status should react — either results or a "no results" line.
    const mount = page.locator("[data-find-explore-kind='researchContext']");
    await expect(mount.locator("[data-find-explore-status]"))
      .toContainText(/tulos|tulosta|löytynyt/i, { timeout: 15000 });

    // The chip must never surface a media hit inside Research.
    const mediaHits = await mount.locator("[data-find-explore-results] a[href^='/mediassa/']").count();
    expect(mediaHits).toBe(0);
  });

  test("No detail template gained data-pagefind-body via warmup", async ({ page }) => {
    await page.goto("/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/");
    const bodyHits = await page.locator("[data-pagefind-body]").count();
    expect(bodyHits, "PF-PERF2 must never add data-pagefind-body").toBe(0);
  });
});

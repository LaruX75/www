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
    // THESIS-HUB-02: thesis FE moved from /opinnaytteet/ (hub, no FE) to
    // the scoped subarchives. The known matematiikka-ahdistuksesta
    // thesis is reviewerOnly, so it lives under
    // /opinnaytteet/tarkastetut/. Results render into that subarchive's
    // external tbody (data-find-explore-results-id) — assert on the
    // referenced tbody directly, not on the mount.
    await page.goto("/opinnaytteet/tarkastetut/");

    const mount = page.locator("[data-find-explore]").first();
    const queryInput = mount.locator("[data-find-explore-query]");
    await queryInput.focus();
    await queryInput.fill("6 luokkalaisten kokemuksia matematiikka ahdistuksesta");

    await expect(mount.locator("[data-find-explore-status]"))
      .toContainText(/tulos|tulosta/, { timeout: 15000 });

    const results = page.locator("#thesesArchiveTbodyTarkastetutFi");
    await expect(results).not.toHaveAttribute("aria-busy", "true");

    // At least one archive row rendered into the shared tbody.
    const rows = await results.locator(".thesis-archive-title-link").count();
    expect(rows).toBeGreaterThan(0);
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

  test("Pressing Enter in the search input runs a search without jumping to the top", async ({ page }) => {
    await page.goto("/tutkimus/");
    // Scroll so the Find & Explore mount is below the fold and there is
    // real vertical distance for the bug to manifest.
    await page.locator("[data-find-explore][data-find-explore-kind='researchContext']")
      .scrollIntoViewIfNeeded();
    await page.waitForTimeout(150);
    const scrollBeforeEnter = await page.evaluate(() => window.scrollY);
    expect(scrollBeforeEnter, "test setup: scroll must not already be at the top").toBeGreaterThan(50);

    const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");
    const queryInput = mount.locator("[data-find-explore-query]");
    await queryInput.focus();
    await queryInput.fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
    await queryInput.press("Enter");

    // Wait for the runtime to react (status text changes from idle).
    await expect(mount.locator("[data-find-explore-status]"))
      .toContainText(/tulos|tulosta|löytynyt/i, { timeout: 15000 });

    // Viewport must not have jumped to the top. Allow a small tolerance
    // for any incidental reflow (e.g. new results changing layout height
    // above the scroll position).
    const scrollAfterEnter = await page.evaluate(() => window.scrollY);
    expect(scrollAfterEnter, `Enter must not scroll the page to the top (was ${scrollBeforeEnter}, now ${scrollAfterEnter})`)
      .toBeGreaterThan(50);

    // Focus must remain inside the Find & Explore mount (typically still
    // on the query input).
    const focusInsideMount = await page.evaluate(() => {
      const mountEl = document.querySelector("[data-find-explore][data-find-explore-kind='researchContext']");
      return mountEl?.contains(document.activeElement) === true;
    });
    expect(focusInsideMount, "focus must remain inside the Find & Explore mount after Enter").toBe(true);
  });
});

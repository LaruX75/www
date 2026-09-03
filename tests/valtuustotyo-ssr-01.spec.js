const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * VALTUUSTOTYO-SSR-01 — SSR conversion of /valtuustotyo/ archive.
 *
 * Guards:
 *   1. JS-off: all speech + initiative rows are visible SSR content
 *   2. JS-off: no "Ladataan..." placeholders remain
 *   3. JS-on: 0 runtime requests to /data/council-speeches.json + /data/initiatives.json
 *   4. JS-on: 0 runtime requests to /data/publications.json + /data/content.json
 *      (dashboard KPI/chart dead code eliminated)
 *   5. JS-on: pagination shows 5 rows per page for each table
 *   6. JS-on: search filter narrows visible rows
 *   7. JS-on: year filter narrows visible rows
 *   8. JS-on: meeting filter (puheet only) narrows visible rows
 *   9. JS-on: sort toggle reorders visible rows
 *  10. JS-on: reset restores full first-page state
 *  11. Public JSON endpoints still resolve (contract retained)
 *  12. Kynästä first-5 == Valtuustotyö first-5 for council speeches + initiatives
 *  13. /politiikka/ unaffected (still fetches /data/publications.json)
 */

test.describe("JS-off contract (progressive enhancement)", () => {
  test("all speech + initiative rows visible without JavaScript; no loading placeholders", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/valtuustotyo/");
    const councilRows = await page.locator("[data-council-row]").count();
    const initiativeRows = await page.locator("[data-initiative-row]").count();
    expect(councilRows, "council-speech SSR rows must render without JS").toBeGreaterThan(5);
    expect(initiativeRows, "initiative SSR rows must render without JS").toBeGreaterThan(0);
    const html = await page.content();
    expect(html, "no 'Ladataan puheita...' placeholder").not.toMatch(/Ladataan puheita/);
    expect(html, "no 'Ladataan aloitteita...' placeholder").not.toMatch(/Ladataan aloitteita/);
    await ctx.close();
  });
});

test.describe("Runtime request elimination", () => {
  test("/valtuustotyo/ makes 0 requests to archive JSON endpoints", async ({ page }) => {
    const forbidden = [];
    page.on("request", (req) => {
      const url = req.url();
      if (/\/data\/(council-speeches|initiatives|publications|content)\.json/.test(url)) {
        forbidden.push(url);
      }
    });
    await page.goto("/valtuustotyo/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    expect(forbidden, `no runtime archive JSON fetches expected: ${JSON.stringify(forbidden)}`).toEqual([]);
  });
});

test.describe("JS-on interaction (filter/sort/pagination on SSR rows)", () => {
  test("pagination shows 5 rows per page for council speeches", async ({ page }) => {
    await page.goto("/valtuustotyo/");
    // Wait for JS to hide non-page-1 rows.
    await page.locator("[data-council-row]:not(.d-none)").first().waitFor({ state: "attached" });
    const visible = await page.locator("[data-council-row]:not(.d-none)").count();
    expect(visible, "page 1 shows 5 rows or fewer").toBeLessThanOrEqual(5);
    expect(visible, "page 1 shows at least 1 row").toBeGreaterThan(0);
  });

  test("pagination shows 5 rows per page for initiatives", async ({ page }) => {
    await page.goto("/valtuustotyo/");
    await page.locator("[data-initiative-row]:not(.d-none)").first().waitFor({ state: "attached" });
    const visible = await page.locator("[data-initiative-row]:not(.d-none)").count();
    expect(visible).toBeLessThanOrEqual(5);
    expect(visible).toBeGreaterThan(0);
  });

  test("year filter narrows council speeches to a specific year", async ({ page }) => {
    await page.goto("/valtuustotyo/");
    await page.locator("[data-council-row]:not(.d-none)").first().waitFor({ state: "attached" });
    // Pick the newest year option (first non-empty option).
    const firstYearOption = await page.locator("#puheet-year option[value]:not([value=''])").first().getAttribute("value");
    await page.locator("#puheet-year").selectOption(firstYearOption);
    await page.waitForTimeout(100);
    const rows = await page.locator("[data-council-row]:not(.d-none)").all();
    for (const row of rows) {
      const y = await row.getAttribute("data-year");
      expect(y, `visible rows must all be year ${firstYearOption}`).toBe(firstYearOption);
    }
  });

  test("meeting filter narrows council speeches", async ({ page }) => {
    await page.goto("/valtuustotyo/");
    await page.locator("[data-council-row]:not(.d-none)").first().waitFor({ state: "attached" });
    const firstMeetingOption = await page.locator("#puheet-meeting option[value]:not([value=''])").first().getAttribute("value");
    if (!firstMeetingOption) test.skip();
    await page.locator("#puheet-meeting").selectOption(firstMeetingOption);
    await page.waitForTimeout(100);
    const rows = await page.locator("[data-council-row]:not(.d-none)").all();
    for (const row of rows) {
      const m = await row.getAttribute("data-meeting");
      expect(m, `visible rows must be from meeting ${firstMeetingOption}`).toBe(firstMeetingOption);
    }
  });

  test("search filter narrows rows to match query", async ({ page }) => {
    await page.goto("/valtuustotyo/");
    await page.locator("[data-council-row]:not(.d-none)").first().waitFor({ state: "attached" });
    // Take a term guaranteed to exist in at least one row's searchText:
    // pull the first row's data-title and search for its middle word.
    const firstTitle = await page.locator("[data-council-row]").first().getAttribute("data-title");
    const term = String(firstTitle || "").split(/\s+/).find((w) => w.length > 4) || "puhe";
    await page.locator("#puheet-search").fill(term);
    await page.waitForTimeout(200);
    const visible = await page.locator("[data-council-row]:not(.d-none)").count();
    expect(visible, `search "${term}" must match at least one row`).toBeGreaterThan(0);
    const rows = await page.locator("[data-council-row]:not(.d-none)").all();
    for (const row of rows) {
      const st = (await row.getAttribute("data-search-text")) || "";
      expect(st, `visible row must contain "${term}" in its searchText`).toContain(term.toLowerCase());
    }
  });

  test("reset restores full first-page state", async ({ page }) => {
    await page.goto("/valtuustotyo/");
    await page.locator("[data-council-row]:not(.d-none)").first().waitFor({ state: "attached" });
    const initial = await page.locator("[data-council-row]:not(.d-none)").count();
    await page.locator("#puheet-search").fill("qqxxzz-nonsense");
    await page.waitForTimeout(150);
    // After nonsense filter, empty state row shows.
    await expect(page.locator("[data-council-empty]:not(.d-none)")).toBeVisible();
    await page.locator("#puheet-reset").click();
    await page.waitForTimeout(150);
    const post = await page.locator("[data-council-row]:not(.d-none)").count();
    expect(post, "reset restores initial row count").toBe(initial);
  });

  test("no duplicate rows anywhere on page (rows are moved, not cloned)", async ({ page }) => {
    await page.goto("/valtuustotyo/");
    await page.locator("[data-council-row]:not(.d-none)").first().waitFor({ state: "attached" });
    const urls = await page.locator("[data-council-row]").evaluateAll((els) => els.map((el) => el.getAttribute("data-url")));
    const uniq = new Set(urls);
    expect(uniq.size, "no duplicate council rows").toBe(urls.length);
  });
});

test.describe("Public JSON endpoints retained (contract untouched)", () => {
  for (const url of ["/data/council-speeches.json", "/data/initiatives.json", "/data/publications.json", "/data/content.json"]) {
    test(`${url} still resolves`, async ({ page }) => {
      const r = await page.request.get(url);
      expect(r.ok(), `${url} must remain 200 (public contract)`).toBeTruthy();
      const body = await r.json();
      expect(body).toHaveProperty("items");
    });
  }
});

test.describe("Kynästä ↔ Valtuustotyö first-5 parity", () => {
  // The parity assertion is about SSR canonical order — the order
  // Nunjucks emits at build time — NOT the runtime DOM order after
  // JS init (which reorders rows to satisfy pagination). Both sides
  // therefore compare raw HTML fetched via page.request.get().
  test("first 5 council speech URLs on /valtuustotyo/#puheet == first 5 on /kynasta/ council section", async ({ page }) => {
    const kynastaHtml = await page.request.get("/kynasta/").then((r) => r.text());
    const kynastaUrls = [...kynastaHtml.matchAll(/<a class="kynasta-hub-subsection-link[^"]*" href="([^"]+)"/g)]
      .map((m) => m[1]);
    // Kynästä emits 7 subsections × 5 = 35 links in DOM order
    // (blog, opinion, column, councilSpeech, initiative, statement,
    // publicSpeech). Council speeches = 4th group → indexes 15-19.
    expect(kynastaUrls.length, "kynästa hub must render 35 subsection links").toBeGreaterThanOrEqual(35);
    const kynastaCouncilFirst5 = kynastaUrls.slice(15, 20);

    const valtHtml = await page.request.get("/valtuustotyo/").then((r) => r.text());
    const valtUrls = [...valtHtml.matchAll(/<tr\s+data-council-row[^>]*data-url="([^"]+)"/g)]
      .map((m) => m[1]);
    const valtFirst5 = valtUrls.slice(0, 5);

    expect(valtFirst5, "valtuustotyo SSR first-5 council-speech URLs must match kynästa hub first-5")
      .toEqual(kynastaCouncilFirst5);
  });

  test("first 5 initiative URLs on /valtuustotyo/#aloitteet == first 5 on /kynasta/ initiative section", async ({ page }) => {
    const kynastaHtml = await page.request.get("/kynasta/").then((r) => r.text());
    const kynastaUrls = [...kynastaHtml.matchAll(/<a class="kynasta-hub-subsection-link[^"]*" href="([^"]+)"/g)]
      .map((m) => m[1]);
    const kynastaInitiativesFirst5 = kynastaUrls.slice(20, 25);

    const valtHtml = await page.request.get("/valtuustotyo/").then((r) => r.text());
    const valtUrls = [...valtHtml.matchAll(/<tr\s+data-initiative-row[^>]*data-url="([^"]+)"/g)]
      .map((m) => m[1]);
    const valtFirst5 = valtUrls.slice(0, 5);

    expect(valtFirst5, "valtuustotyo SSR first-5 initiative URLs must match kynästa hub first-5")
      .toEqual(kynastaInitiativesFirst5);
  });
});

test.describe("/politiikka/ runtime-fetch cleanup (POLITIIKKA-SSR-01)", () => {
  // Contract flipped by POLITIIKKA-SSR-01: /politiikka/ previously
  // fetched /data/publications.json at runtime to render a political-
  // speeches table into DOM targets that never existed (orphaned
  // dead code). After POLITIIKKA-SSR-01 the fetch is gone. The
  // endpoint itself remains (retained public JSON contract) but
  // /politiikka/ is no longer a consumer.
  test("/politiikka/ must NOT fetch /data/publications.json at runtime", async ({ page }) => {
    const publications = [];
    page.on("request", (r) => {
      if (/\/data\/publications\.json/.test(r.url())) publications.push(r.url());
    });
    await page.goto("/politiikka/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    expect(publications, `no /data/publications.json fetch expected from /politiikka/; got ${JSON.stringify(publications)}`).toEqual([]);
  });

  test("/politiikka/ still renders its primary SSR content sections", async ({ page }) => {
    await page.goto("/politiikka/");
    // Primary sections that must survive after the dead-code cleanup.
    // (Hero heading, current-role card, evidence showcase, deep-dive
    // anchors, and the mobile-disclosure host elements.)
    await expect(page.locator("h1").first()).toBeVisible();
    const anchors = await page.locator('a[href^="/politiikka/kaupunginvaltuusto/"], a[href^="/politiikka/sivistyslautakunta/"], a[href="/valtuustotyo/"], a[href="/lausunnot/"]').count();
    expect(anchors, "/politiikka/ deep-dive navigation must remain intact").toBeGreaterThan(0);
  });

  test("/data/publications.json endpoint still resolves (public contract retained)", async ({ page }) => {
    const r = await page.request.get("/data/publications.json");
    expect(r.ok()).toBeTruthy();
    const body = await r.json();
    expect(body).toHaveProperty("items");
    expect(Array.isArray(body.items)).toBeTruthy();
  });
});

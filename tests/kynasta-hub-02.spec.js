const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * KYNÄSTÄ-HUB-02 — hub landing contract for /kynasta/ and /en/kynasta/.
 *
 * The two hubs render 3 major sections (Kirjoitukset / Valtuustotyö /
 * Asiantuntijatyö). The FI hub renders 7 subgroups × 5 latest = 35
 * canonical items. The EN hub renders only the Writings section
 * (3 subgroups × 5 = 15 items) and shows the other two sections as
 * "Available only in Finnish" notes linking to the FI archives.
 *
 * Coverage:
 *   1. FI hub renders 3 major sections + 7 subgroups + ≤5 items each
 *   2. EN hub renders 3 major sections + 3 populated subgroups + 2 FI-only notes
 *   3. Each subgroup's "Show all" link targets its existing archive anchor
 *   4. Hub items link to real destinations
 *   5. No Find & Explore mount on either hub (SSR content only per spec §7)
 *   6. No runtime /data/*.json fetch during hub load
 *   7. No JavaScript-generated hub lists (works with JS off)
 *   8. Legacy /kynasta/#<anchor> redirect stubs preserved
 */

test.describe("FI /kynasta/ hub contract", () => {
  test("renders 3 major sections + 7 subgroups + exactly 5 items each", async ({ page }) => {
    const html = await page.request.get("/kynasta/").then((r) => r.text());
    expect(html, "must not mount FE on hub (spec §7)").not.toMatch(/data-find-explore/);
    expect((html.match(/data-kynasta-hub-subsection/g) || []).length,
      "7 subsections expected (blog + opinion + column + council speech + initiative + statement + public speech)").toBe(7);

    await page.goto("/kynasta/");
    const titleLinks = await page.locator("[data-kynasta-hub-subsection] .kynasta-hub-subsection-link").count();
    expect(titleLinks, "FI hub renders 7 × 5 = 35 latest title links total").toBe(35);

    // Section wrappers by anchor id
    for (const id of ["kirjoitukset", "valtuustotyo", "asiantuntijatyo"]) {
      await expect(page.locator(`section#${id}`), `section#${id} must render`).toBeVisible();
    }
  });

  test("each Show all CTA targets the correct existing archive anchor", async ({ page }) => {
    const html = await page.request.get("/kynasta/").then((r) => r.text());
    const expected = [
      "/kirjoitukset/#blogi",
      "/kirjoitukset/#mielipiteet",
      "/kirjoitukset/#kolumnit",
      "/valtuustotyo/#puheet",
      "/valtuustotyo/#aloitteet",
      "/lausunnot/#lausunnot",
      "/lausunnot/#julkiset-puheet"
    ];
    for (const url of expected) {
      expect(html, `Show all CTA to ${url} must be present`).toContain(`href="${url}"`);
    }
  });

  test("hub items link to concrete destinations (never empty href)", async ({ page }) => {
    await page.goto("/kynasta/");
    const hrefs = await page.locator("[data-kynasta-hub-subsection] .kynasta-hub-subsection-link")
      .evaluateAll((els) => els.map((el) => el.getAttribute("href") || ""));
    for (const href of hrefs) {
      expect(href.length, "no empty href in hub items").toBeGreaterThan(1);
      // Local path or absolute URL — never "#" or javascript:
      expect(href, `href "${href}" must not be a bare anchor / js link`).not.toMatch(/^(#|javascript:)/);
    }
  });

  test("no runtime /data/*.json fetch fires while the hub loads", async ({ page }) => {
    const dataRequests = [];
    page.on("request", (r) => {
      const u = r.url();
      if (/\/data\/[^?]*\.json/.test(u)) dataRequests.push(u);
    });
    await page.goto("/kynasta/");
    // Small settle window for any deferred fetch attempts
    await page.waitForLoadState("networkidle");
    expect(dataRequests, `no /data/*.json fetch expected on hub; got ${JSON.stringify(dataRequests)}`).toEqual([]);
  });

  test("JavaScript disabled: hub content renders + Show all anchors are real links", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/kynasta/");
    const items = await page.locator("[data-kynasta-hub-subsection] .kynasta-hub-subsection-link").count();
    expect(items, "hub items are pure SSR and must render without JS").toBe(35);
    // Assert the anchor exists as a real link (may be below the fold —
    // don't require visibility, only presence + correct href).
    const anchorCount = await page.locator('a[href="/kirjoitukset/#blogi"]').count();
    expect(anchorCount, "Show all anchor to /kirjoitukset/#blogi must be present without JS").toBeGreaterThan(0);
    await context.close();
  });

  test("legacy /kynasta/#<anchor> redirect stubs are preserved", async ({ page }) => {
    const html = await page.request.get("/kynasta/").then((r) => r.text());
    for (const id of ["lausunnot", "julkiset-puheet", "puheet", "aloitteet", "blogi", "mielipiteet", "kolumnit"]) {
      expect(html, `legacy anchor stub #${id} must remain (external inbound links)`).toMatch(new RegExp(`id="${id}"[^>]*data-legacy-anchor`));
    }
  });
});

test.describe("EN /en/kynasta/ hub contract (Option A: partial)", () => {
  test("renders 3 major sections; only Writings has item lists (15 = 3×5)", async ({ page }) => {
    const html = await page.request.get("/en/kynasta/").then((r) => r.text());
    // Writings section = 3 populated subsections; Council + Expert have 0
    expect((html.match(/data-kynasta-hub-subsection/g) || []).length,
      "only 3 populated subsections on EN (Writings only)").toBe(3);
    expect(html).not.toMatch(/data-find-explore/);

    await page.goto("/en/kynasta/");
    const titleLinks = await page.locator("[data-kynasta-hub-subsection] .kynasta-hub-subsection-link").count();
    expect(titleLinks, "EN hub renders 3 × 5 = 15 latest title links total").toBe(15);

    // Section wrappers
    for (const id of ["writings", "council-work", "expert-work"]) {
      await expect(page.locator(`section#${id}`)).toBeVisible();
    }
  });

  test("council + expert sections show Available-only-in-Finnish notes with FI archive links", async ({ page }) => {
    await page.goto("/en/kynasta/");
    await expect(page.locator("section#council-work")).toContainText("Available only in Finnish");
    await expect(page.locator("section#expert-work")).toContainText("Available only in Finnish");
    for (const url of ["/valtuustotyo/#puheet", "/valtuustotyo/#aloitteet", "/lausunnot/#lausunnot", "/lausunnot/#julkiset-puheet"]) {
      await expect(page.locator(`a[href="${url}"]`).first()).toBeVisible();
    }
  });

  test("EN writings Show all CTAs point to /en/writings/ anchors", async ({ page }) => {
    const html = await page.request.get("/en/kynasta/").then((r) => r.text());
    for (const url of ["/en/writings/#blog", "/en/writings/#opinion", "/en/writings/#column"]) {
      expect(html).toContain(`href="${url}"`);
    }
  });

  test("no runtime /data/*.json fetch fires while the EN hub loads", async ({ page }) => {
    const dataRequests = [];
    page.on("request", (r) => {
      const u = r.url();
      if (/\/data\/[^?]*\.json/.test(u)) dataRequests.push(u);
    });
    await page.goto("/en/kynasta/");
    await page.waitForLoadState("networkidle");
    expect(dataRequests).toEqual([]);
  });
});

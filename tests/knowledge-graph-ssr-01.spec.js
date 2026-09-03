const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * KNOWLEDGE-GRAPH-SSR-01 — SSR conversion of /tutkimus/tietograafi/
 * and deletion of the /data/knowledge-graph.json runtime transport.
 *
 * Guards:
 *   1. JS-off: KPI counts, node-kind cards, edge-type cards, coverage
 *      badges, node list, and edge list are all rendered by Nunjucks
 *   2. JS-off: no "Ladataan…" placeholders remain
 *   3. JS-off: no "Avaa JSON" affordance to a deleted endpoint
 *   4. Runtime: 0 requests to /data/knowledge-graph.json
 *   5. Public: /data/knowledge-graph.json returns 404 (endpoint deleted)
 *   6. Built JS contains no fetch() to the deleted endpoint
 *   7. JS-on: node-kind filter narrows visible SSR node items
 *   8. JS-on: edge-type filter narrows visible SSR edge items
 *   9. JS-on: search filter narrows both node and edge visibility
 *  10. SSR graph parity: node count in DOM == 10 node kinds represented
 *  11. SSR graph parity: 15 edge types represented in SSR
 */

test.describe("JS-off contract (SSR-only graph surface)", () => {
  test("SSR renders KPI counts, cards, coverage, and full node/edge lists without JS", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto("/tutkimus/tietograafi/");

    const kpiTexts = await page.locator("#yhteenveto .analysis-card .display-6").allTextContents();
    expect(kpiTexts.length, "four KPI cards render at build time").toBe(4);
    for (const t of kpiTexts) {
      expect(t.trim(), "each KPI must be a number, not '-'").toMatch(/^\d/);
    }

    const nodeKindCards = await page.locator("#solmut .knowledge-graph-kind-card").count();
    expect(nodeKindCards, "all node-kind cards render SSR").toBeGreaterThanOrEqual(10);

    const edgeTypeCards = await page.locator("#suhteet .knowledge-graph-edge-card").count();
    expect(edgeTypeCards, "all edge-type cards render SSR").toBeGreaterThanOrEqual(15);

    const coverage = await page.locator(".knowledge-graph-coverage-badge").count();
    expect(coverage, "coverage badge strip renders SSR").toBeGreaterThan(0);

    const nodeItems = await page.locator("[data-kg-node]").count();
    expect(nodeItems, "all node items render SSR").toBeGreaterThan(100);

    const edgeItems = await page.locator("[data-kg-edge]").count();
    expect(edgeItems, "all edge items render SSR").toBeGreaterThan(100);

    const html = await page.content();
    expect(html, "no 'Ladataan…' placeholders").not.toMatch(/Ladataan/);

    await ctx.close();
  });

  test("no 'Avaa JSON' affordance in built HTML (endpoint deleted)", async ({ page }) => {
    const html = await page.request.get("/tutkimus/tietograafi/").then((r) => r.text());
    expect(html, "no 'Avaa JSON' link in SSR").not.toMatch(/Avaa JSON/);
    expect(html, "no /data/knowledge-graph.json reference in SSR").not.toContain("/data/knowledge-graph.json");
  });
});

test.describe("Runtime transport eliminated", () => {
  test("/tutkimus/tietograafi/ makes 0 requests to /data/knowledge-graph.json", async ({ page }) => {
    const forbidden = [];
    page.on("request", (req) => {
      if (/\/data\/knowledge-graph\.json/.test(req.url())) forbidden.push(req.url());
    });
    await page.goto("/tutkimus/tietograafi/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    expect(forbidden, `no runtime graph JSON fetches expected: ${JSON.stringify(forbidden)}`).toEqual([]);
  });

  test("/data/knowledge-graph.json endpoint no longer exists", async ({ page }) => {
    const r = await page.request.get("/data/knowledge-graph.json");
    expect(r.ok(), `endpoint must be 404 (deleted); got ${r.status()}`).toBeFalsy();
  });

  test("knowledge-graph-page.js contains no fetch() to graph JSON", async ({ page }) => {
    const js = await page.request.get("/js/knowledge-graph-page.js").then((r) => r.text());
    expect(js, "no fetch of /data/knowledge-graph.json in shipped JS").not.toContain("/data/knowledge-graph.json");
    expect(js, "no fetch() call anywhere in shipped JS").not.toMatch(/\bfetch\s*\(/);
  });
});

test.describe("JS-on interaction (filter/search over SSR DOM)", () => {
  test("node-kind filter narrows visible node items", async ({ page }) => {
    await page.goto("/tutkimus/tietograafi/");
    await page.locator("[data-kg-node]").first().waitFor({ state: "attached" });
    const initial = await page.locator("[data-kg-node]:not([hidden])").count();
    await page.locator("#kg-node-kind-filter").selectOption("researchLine");
    await page.waitForTimeout(120);
    const visible = await page.locator("[data-kg-node]:not([hidden])").all();
    expect(visible.length, "filtering to researchLine must narrow the list").toBeLessThan(initial);
    expect(visible.length, "researchLine kind has at least one node").toBeGreaterThan(0);
    for (const el of visible) {
      const kind = await el.getAttribute("data-kg-kind");
      expect(kind, "every visible node item has kind researchLine").toBe("researchLine");
    }
  });

  test("edge-type filter narrows visible edge items", async ({ page }) => {
    await page.goto("/tutkimus/tietograafi/");
    await page.locator("[data-kg-edge]").first().waitFor({ state: "attached" });
    const initial = await page.locator("[data-kg-edge]:not([hidden])").count();
    await page.locator("#kg-edge-type-filter").selectOption("authorOf");
    await page.waitForTimeout(120);
    const visible = await page.locator("[data-kg-edge]:not([hidden])").all();
    expect(visible.length, "filtering to authorOf must narrow the list").toBeLessThan(initial);
    expect(visible.length, "authorOf edge type has multiple edges").toBeGreaterThan(0);
    for (const el of visible) {
      const type = await el.getAttribute("data-kg-edge-type");
      expect(type, "every visible edge item has type authorOf").toBe("authorOf");
    }
  });

  test("search input narrows both node and edge lists", async ({ page }) => {
    await page.goto("/tutkimus/tietograafi/");
    await page.locator("[data-kg-node]").first().waitFor({ state: "attached" });
    const initialNodes = await page.locator("[data-kg-node]:not([hidden])").count();
    await page.locator("#kg-search-filter").fill("laru");
    await page.waitForTimeout(200);
    const filteredNodes = await page.locator("[data-kg-node]:not([hidden])").count();
    expect(filteredNodes, "search 'laru' narrows node list").toBeLessThan(initialNodes);
    expect(filteredNodes, "search 'laru' matches at least one node").toBeGreaterThan(0);
  });

  test("empty-state placeholder appears when a filter combination matches nothing", async ({ page }) => {
    await page.goto("/tutkimus/tietograafi/");
    await page.locator("[data-kg-node]").first().waitFor({ state: "attached" });
    await page.locator("#kg-search-filter").fill("qqxxzz-nonsense-token");
    await page.waitForTimeout(200);
    await expect(page.locator("[data-kg-node-empty]")).toBeVisible();
    await expect(page.locator("[data-kg-edge-empty]")).toBeVisible();
  });
});

test.describe("SSR graph parity (10 node kinds, 15 edge types)", () => {
  test("all 10 canonical node kinds are represented in SSR node items", async ({ page }) => {
    const html = await page.request.get("/tutkimus/tietograafi/").then((r) => r.text());
    const kinds = new Set([...html.matchAll(/data-kg-kind="([^"]+)"/g)].map((m) => m[1]));
    const expectedKinds = [
      "course", "person", "presentation", "presentationContext", "project",
      "publication", "researchLine", "theme", "thesis", "topic"
    ];
    for (const k of expectedKinds) {
      expect(kinds.has(k), `SSR must contain at least one node of kind '${k}'`).toBeTruthy();
    }
    expect(kinds.size, "exactly 10 node kinds").toBe(10);
  });

  test("all 15 canonical edge types are represented in SSR edge items", async ({ page }) => {
    const html = await page.request.get("/tutkimus/tietograafi/").then((r) => r.text());
    const types = new Set([...html.matchAll(/data-kg-edge-type="([^"]+)"/g)].map((m) => m[1]));
    const expectedTypes = [
      "advised", "authorOf", "belongsToResearchLine", "coversTheme", "hasTheme",
      "hasTopic", "linkedPresentation", "linkedPresentationContext",
      "linkedPublication", "linkedThesis", "participatesIn", "presented",
      "presentedIn", "supportsResearchLine", "usedInCourse"
    ];
    for (const t of expectedTypes) {
      expect(types.has(t), `SSR must contain at least one edge of type '${t}'`).toBeTruthy();
    }
    expect(types.size, "exactly 15 edge types").toBe(15);
  });
});

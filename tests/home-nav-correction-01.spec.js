const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * HOME-NAV-CORRECTION-01 — two proven UX gaps from UX-CORNERS-01:
 *
 *   F3 (FI): homepage "Mitä etsit?" discovery area did not expose
 *   /opetus/ directly even though it is a real SSR landing since
 *   OPETUS-IA-01. Fix: add an "Opetus" tile pointing at /opetus/.
 *
 *   F4 (EN): the homepage button labelled "Teaching" pointed to
 *   /en/portfolio/ (which is the teaching portfolio, not a teaching
 *   landing). Fix: relabel to "Teaching portfolio" — no /en/opetus/
 *   or /en/teaching/ is synthesized (OPETUS-IA-01 kept the course
 *   surface FI-only by design).
 *
 * Do NOT force artificial FI/EN parity. FI has a full /opetus/
 * teaching landing; EN does not, and this correction preserves that
 * asymmetry.
 */

test.describe("F3 — FI homepage exposes /opetus/ as a primary discovery destination", () => {
  test("FI home contains an Opetus tile with href /opetus/", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    // Tile lives inside the "Mitä etsit?" section (id=home-paths-heading).
    const sectionMatch = html.match(/<section[^>]*aria-labelledby="home-paths-heading"[\s\S]*?<\/section>/);
    expect(sectionMatch, "Mitä etsit? section present").not.toBeNull();
    const section = sectionMatch[0];
    expect(section, "Opetus tile card link").toMatch(/<a[^>]*href="\/opetus\/"[^>]*class="home-path-card"/);
    expect(section, "tile title reads exactly 'Opetus'").toContain('<span class="home-path-title">Opetus</span>');
  });

  test("existing FI home tiles remain present (no regression, additive change)", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const sectionMatch = html.match(/<section[^>]*aria-labelledby="home-paths-heading"[\s\S]*?<\/section>/);
    const section = sectionMatch[0];
    for (const [label, href] of [
      ["Työ", "/tyoni-yliopistonlehtorina/"],
      ["Kynästä", "/kynasta/"],
      ["Mediassa", "/mediassa/"],
      ["Politiikka", "/politiikka/"]
    ]) {
      expect(section, `existing tile "${label}" retained`).toContain(`<span class="home-path-title">${label}</span>`);
      expect(section, `existing tile href ${href}`).toContain(`href="${href}"`);
    }
  });

  test("Opetus tile href resolves to the real SSR landing", async ({ page }) => {
    const res = await page.request.get("/opetus/");
    expect(res.status(), "/opetus/ returns 200").toBe(200);
    const html = await res.text();
    expect(html, "/opetus/ is not a redirect stub").not.toMatch(/http-equiv=["']refresh["']/i);
    expect(html, "/opetus/ landing carries expected h1").toMatch(/<h1[^>]*>[^<]*Opetus[^<]*<\/h1>/);
  });

  test("FI home discovery tiles now number exactly 5 (Työ + Opetus + Kynästä + Mediassa + Politiikka)", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const sectionMatch = html.match(/<section[^>]*aria-labelledby="home-paths-heading"[\s\S]*?<\/section>/);
    const cardCount = (sectionMatch[0].match(/class="home-path-card"/g) || []).length;
    expect(cardCount, "exactly 5 tiles").toBe(5);
  });
});

test.describe("F4 — EN homepage 'Teaching' button relabelled to match its destination", () => {
  test("EN home button labelled exactly 'Teaching portfolio' and points at /en/portfolio/", async ({ page }) => {
    const html = await page.request.get("/en/").then((r) => r.text());
    expect(html, "button relabelled").toMatch(
      /<a[^>]*href="\/en\/portfolio\/"[^>]*>Teaching portfolio<\/a>/
    );
    // Guardrail: the naked "Teaching" label MUST NOT still route to portfolio.
    expect(html, "old naked 'Teaching' label removed for this destination").not.toMatch(
      /<a[^>]*href="\/en\/portfolio\/"[^>]*>Teaching<\/a>/
    );
  });

  test("EN home does NOT synthesize an /en/opetus/ or /en/teaching/ route", async ({ page }) => {
    const html = await page.request.get("/en/").then((r) => r.text());
    expect(html, "no /en/opetus/ link on EN home").not.toContain('href="/en/opetus/"');
    expect(html, "no /en/teaching/ link on EN home").not.toContain('href="/en/teaching/"');
  });

  test("neither /en/opetus/ nor /en/teaching/ exists as a real route", async ({ page }) => {
    for (const url of ["/en/opetus/", "/en/teaching/"]) {
      const res = await page.request.get(url, { failOnStatusCode: false });
      expect(res.status(), `${url} does not exist as a route`).toBeGreaterThanOrEqual(400);
    }
  });

  test("existing EN home sibling buttons remain present (Research + Societal engagement)", async ({ page }) => {
    const html = await page.request.get("/en/").then((r) => r.text());
    expect(html, "Research button retained").toMatch(/<a[^>]*href="\/en\/research\/"[^>]*>Research<\/a>/);
    expect(html, "Societal engagement button retained").toMatch(
      /<a[^>]*href="\/en\/societal-engagement\/"[^>]*>Societal engagement<\/a>/
    );
  });
});

test.describe("Language-switch behavior unchanged", () => {
  test("FI home lang-switcher still targets EN root (no /en/opetus/ synthesis)", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    // FI/EN lang-alt: hreflang="en" href="/en/" (or absent). MUST NOT point at /en/opetus/.
    expect(html, "no /en/opetus/ in FI home hreflang or link").not.toContain('href="/en/opetus/"');
  });

  test("/opetus/ FI-only page does not gain an EN alternate route", async ({ page }) => {
    const html = await page.request.get("/opetus/").then((r) => r.text());
    expect(html, "no hreflang='en' alt href for /opetus/").not.toMatch(/hreflang="en"[^>]*href="[^"]*\/en\/opetus\/"/);
  });
});

test.describe("No new runtime JS introduced by this slice", () => {
  test("FI home does not fetch any new JSON at runtime for this tile", async ({ page }) => {
    const requests = [];
    page.on("request", (req) => {
      if (req.resourceType() === "fetch" || req.resourceType() === "xhr") {
        requests.push(req.url());
      }
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const opetusFetches = requests.filter((u) => /opetus/i.test(u));
    expect(opetusFetches, "no runtime fetch triggered by the Opetus tile").toEqual([]);
  });
});

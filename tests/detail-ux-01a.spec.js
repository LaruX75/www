const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * DETAIL-UX-01A — Content-first hierarchy + primary action clarity.
 *
 * Three UX shifts to verify per built page:
 *   A. Presentation thumbnail promoted to hero aside (when present)
 *   B. Thesis primary action promoted to hero row
 *   C. Destination-specific CTA labels where destination is
 *      derivable from canonical data (Publication DOI,
 *      Presentation source, Media outlet)
 *
 * Non-goals verified as *unchanged*:
 *   - Publication DOI identifier is protected metadata (visible
 *     sidebar row must remain)
 *   - content-context-sidebar semantic hierarchy preserved
 *   - JSON-LD identical vs. baseline (verified out-of-test)
 */

const PAGES = {
  publication: "/julkaisut/0669729323/",
  presentationWithThumbnail: "/presentations/kohti-kriittist-teko-lylukutaitoa-2026-finnoschool/",
  presentationWithoutThumbnail: "/presentations/405040y-luento-1-johdanto-2026-a/",
  media: "/mediassa/2026/03/29/tekoaly-tekee-petoksen-koulutehtavissa-helpoksi/",
  blog: "/2013/02/05/yhdistysaktivisti/",
  writing: "/2026/04/28/lausunto-uutta-suuntaa-suomen-digitaaliseen-kompassiin/",
  thesis: "/opinnaytteet/46895/"
};

test.describe("A. Presentation thumbnail in hero aside", () => {
  test("presentation WITH thumbnail renders it as hero aside .content-detail-visual", async ({ page }) => {
    const html = await page.request.get(PAGES.presentationWithThumbnail).then((r) => r.text());
    expect(html, "hero aside present").toContain("content-detail-visual");
    // Hero aside must appear inside the hero section (before body content)
    const heroIdx = html.indexOf("content-detail-hero--presentation");
    const asideIdx = html.indexOf("content-detail-visual");
    const bodyIdx = html.indexOf("content-detail-body-section--presentation");
    expect(heroIdx, "hero variant class exists").toBeGreaterThan(-1);
    expect(asideIdx, "hero aside exists").toBeGreaterThan(-1);
    expect(asideIdx, "hero aside comes BEFORE body section").toBeLessThan(bodyIdx);
  });

  test("body-inline thumbnail duplicate is removed", async ({ page }) => {
    const html = await page.request.get(PAGES.presentationWithThumbnail).then((r) => r.text());
    expect(html, "no body-inline thumbnail duplicate").not.toContain("content-detail-inline-visual");
  });

  test("presentation WITHOUT thumbnail falls back to single-column hero (no aside)", async ({ page }) => {
    const html = await page.request.get(PAGES.presentationWithoutThumbnail).then((r) => r.text());
    expect(html, "single-column hero grid class").toContain("content-detail-hero-grid--single");
    expect(html, "no aside markup present").not.toContain("content-detail-visual");
  });
});

test.describe("B. Thesis primary action in hero", () => {
  test("thesis hero contains a btn-primary OuluREPO link before body", async ({ page }) => {
    const html = await page.request.get(PAGES.thesis).then((r) => r.text());
    const heroCardIdx = html.indexOf('class="card shadow-sm mb-4"');
    const bodyRowIdx = html.indexOf('class="row g-4"');
    const primaryLinkIdx = html.indexOf('btn btn-primary rounded-pill');
    expect(primaryLinkIdx, "thesis hero has btn-primary link").toBeGreaterThan(-1);
    expect(primaryLinkIdx, "btn-primary appears inside the hero card").toBeLessThan(bodyRowIdx);
    expect(heroCardIdx, "hero card exists").toBeGreaterThan(-1);
  });

  test("thesis hero primary action opens the canonical OuluREPO handle", async ({ page }) => {
    await page.goto(PAGES.thesis);
    const heroLink = page.locator('.card.shadow-sm .content-detail-actions a.btn-primary').first();
    await expect(heroLink).toHaveAttribute("href", /oulurepo\.oulu\.fi\/handle\/10024\/46895/);
    await expect(heroLink).toHaveAttribute("target", "_blank");
  });

  test("secondary Original source card retains its own primary CTA (contextual explainer)", async ({ page }) => {
    const html = await page.request.get(PAGES.thesis).then((r) => r.text());
    expect(html, "Original source card heading present")
      .toMatch(/Alkuperäinen lähde|Original source/);
    expect(html, "Legacy card CTA text preserved")
      .toContain("Avaa alkuperäinen opinnäyte OuluREPOssa");
  });
});

test.describe("C. Destination-specific CTA labels", () => {
  test("publication with DOI uses 'Avaa DOI:ssa'", async ({ page }) => {
    const html = await page.request.get(PAGES.publication).then((r) => r.text());
    expect(html, "publication hero CTA is DOI-specific").toContain("Avaa DOI:ssa");
    expect(html, "no bare 'Avaa lähde' in publication hero").not.toContain(">\n            Avaa lähde\n");
  });

  test("presentation on Canva uses 'Avaa esitys Canvassa'", async ({ page }) => {
    const html = await page.request.get(PAGES.presentationWithThumbnail).then((r) => r.text());
    expect(html, "canva-specific CTA label").toContain("Avaa esitys Canvassa");
  });

  test("media with outlet uses outlet-suffixed label", async ({ page }) => {
    const html = await page.request.get(PAGES.media).then((r) => r.text());
    expect(html, "outlet-suffixed CTA (Kaleva)").toContain("Avaa alkuperäinen lähde — Kaleva");
  });
});

test.describe("D. Publication DOI is protected metadata", () => {
  test("visible DOI row persists in sidebar meta list", async ({ page }) => {
    const html = await page.request.get(PAGES.publication).then((r) => r.text());
    expect(html, "sidebar <dt>DOI</dt> present").toContain("<dt>DOI</dt>");
  });

  test("DOI URL text is still rendered (identifier semantics preserved)", async ({ page }) => {
    const html = await page.request.get(PAGES.publication).then((r) => r.text());
    const doiCount = (html.match(/doi\.org\/[^"<]+/g) || []).length;
    expect(doiCount, "DOI URL appears at least twice (sidebar + citation)").toBeGreaterThanOrEqual(2);
  });

  test("JSON-LD contains DOI destination", async ({ page }) => {
    const html = await page.request.get(PAGES.publication).then((r) => r.text());
    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    expect(ldMatch, "JSON-LD script present").not.toBeNull();
    expect(ldMatch[1], "JSON-LD contains DOI URL").toMatch(/doi\.org/);
  });
});

test.describe("E. Cross-domain invariants preserved", () => {
  for (const [name, url] of Object.entries(PAGES)) {
    test(`${name} — exactly one <h1>`, async ({ page }) => {
      const html = await page.request.get(url).then((r) => r.text());
      const h1Count = (html.match(/<h1\b/g) || []).length;
      expect(h1Count, `${name} (${url}) must have exactly one <h1>`).toBe(1);
    });
  }

  test("content-context-sidebar semantic hierarchy preserved on rich pages", async ({ page }) => {
    const html = await page.request.get(PAGES.publication).then((r) => r.text());
    for (const heading of ["Kokonaisuus", "Aihepolut", "Kontekstipolut", "Kategoriat", "Avainsanat", "Katso myös"]) {
      expect(html, `Publication sidebar shows "${heading}"`).toContain(heading);
    }
  });
});

test.describe("F. Meaningful without JavaScript", () => {
  for (const [name, url] of Object.entries(PAGES)) {
    test(`${name} — h1 visible without JS`, async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      await page.goto(url);
      const h1Text = await page.locator("h1").first().textContent();
      expect(h1Text && h1Text.trim().length, `${name} h1 visible without JS`).toBeGreaterThan(0);
      await ctx.close();
    });
  }
});

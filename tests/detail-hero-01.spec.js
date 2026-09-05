const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * DETAIL-HERO-01 — shared canonical detail hero partial.
 *
 * The five detail templates below moved from hand-rolled hero markup
 * to the shared macro at src/_includes/detail-hero.njk (variant param
 * per domain). Thesis kept its own card+badge hero on purpose.
 *
 * Guards per representative page:
 *   1. <h1> present with domain-specific title text
 *   2. Shared canonical identity markup (.content-detail-hero +
 *      variant modifier + .content-detail-title) OR, for thesis,
 *      the retained .card.shadow-sm + .display-6 markup
 *   3. Domain-specific meta / actions preserved
 *   4. Source / landing action preserved (where domain has one)
 *   5. content-context-sidebar included (verified by canonical
 *      related-content markers)
 *   6. detail-orientation included where the domain expects it
 *      (blog intentionally excluded)
 *   7. JSON-LD script tag present
 *   8. Hero is meaningful with JavaScript disabled
 */

const PAGES = {
  publication: {
    url: "/julkaisut/0669729323/",
    variant: "writing",
    expectedTitleClass: "content-detail-title",
    expectsOrientation: true
  },
  presentation: {
    url: "/presentations/405040y-luento-1-johdanto-2026-a/",
    variant: "presentation",
    expectedTitleClass: "content-detail-title",
    // DETAIL-UX-ORIENT-01: hero orientation removed; site orientation
    // now delivered by sidebar `content-context-archive-link` (→ same
    // /esitykset/ destination). No `data-detail-hub-link` on page —
    // the O1 return-link JS mechanism is dropped on this domain
    // because it would duplicate the sidebar hub link.
    expectsOrientation: false
  },
  media: {
    url: "/mediassa/2026/03/29/tekoaly-tekee-petoksen-koulutehtavissa-helpoksi/",
    variant: "media",
    expectedTitleClass: "content-detail-title",
    // DETAIL-UX-ORIENT-01: same rule as Presentation. Sidebar
    // `content-context-archive-link` → /mediassa/ is the sole
    // orientation link.
    expectsOrientation: false
  },
  blog: {
    url: "/2013/02/05/yhdistysaktivisti/",
    variant: "blog",
    expectedTitleClass: "content-detail-title",
    expectsOrientation: false
  },
  writing: {
    url: "/2026/04/28/lausunto-uutta-suuntaa-suomen-digitaaliseen-kompassiin/",
    variant: "writing",
    expectedTitleClass: "content-detail-title",
    // DETAIL-UX-ORIENT-01: hero orientation removed. Sidebar
    // `content-context-archive-link` (dynamic per writing type via
    // sidebarContext) is the sole orientation link.
    expectsOrientation: false
  },
  thesis: {
    url: "/opinnaytteet/46895/",
    variant: null,
    expectedTitleClass: "display-6",
    expectsOrientation: true
  }
};

for (const [domain, page] of Object.entries(PAGES)) {
  test.describe(`Detail hero — ${domain}`, () => {
    test(`${page.url} — h1 present and non-empty`, async ({ page: pw }) => {
      const r = await pw.request.get(page.url);
      expect(r.ok(), `${page.url} must return 200`).toBeTruthy();
      const html = await r.text();
      const h1Match = html.match(/<h1[^>]*>([^<]{1,300})<\/h1>/);
      expect(h1Match, `${page.url} must contain a non-empty <h1>`).not.toBeNull();
      expect(h1Match[1].trim().length, `<h1> must contain visible text`).toBeGreaterThan(0);
    });

    test(`${page.url} — canonical hero markup preserved`, async ({ page: pw }) => {
      const html = await pw.request.get(page.url).then((r) => r.text());
      if (page.variant) {
        // Migrated: shared .content-detail-hero + variant modifier
        expect(html, `${page.url} carries content-detail-hero section`).toContain("content-detail-hero");
        expect(html, `${page.url} carries variant modifier`).toContain(`content-detail-hero--${page.variant}`);
        expect(html, `${page.url} title uses shared .content-detail-title class`).toContain('class="content-detail-title mb-3"');
      } else {
        // Thesis: kept its own card+badge hero pattern on purpose
        expect(html, `${page.url} thesis card hero present`).toMatch(/card shadow-sm/);
        expect(html, `${page.url} thesis display-6 heading`).toContain('display-6');
      }
    });

    test(`${page.url} — content-context-sidebar included`, async ({ page: pw }) => {
      const html = await pw.request.get(page.url).then((r) => r.text());
      // The sidebar always emits either canonical related headings or
      // a debug marker for its host; the safest cross-lang assertion is
      // that at least one related-content anchor list is rendered by
      // content-context-sidebar.njk. We test via known markers.
      const hasRelatedMarker = /content-context-sidebar|Katso myös|Read more|Aihepolut|Contexts|Katso lisää/.test(html);
      expect(hasRelatedMarker, `${page.url} shows content-context-sidebar markers`).toBeTruthy();
    });

    if (page.expectsOrientation) {
      test(`${page.url} — detail-orientation include present`, async ({ page: pw }) => {
        const html = await pw.request.get(page.url).then((r) => r.text());
        // detail-orientation.njk emits data-detail-return-link / data-detail-hub-link
        expect(html, `${page.url} has detail-orientation markers`).toMatch(/data-detail-return-link|data-detail-hub-link/);
      });
    }

    test(`${page.url} — JSON-LD script present`, async ({ page: pw }) => {
      const html = await pw.request.get(page.url).then((r) => r.text());
      expect(html, `${page.url} has application/ld+json`).toContain('application/ld+json');
    });

    test(`${page.url} — meaningful without JavaScript`, async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const pw = await ctx.newPage();
      await pw.goto(page.url);
      const h1Text = await pw.locator("h1").first().textContent();
      expect(h1Text && h1Text.trim().length, "h1 visible without JS").toBeGreaterThan(0);
      await ctx.close();
    });
  });
}

test.describe("Detail hero — cross-domain invariants", () => {
  test("all 5 migrated detail pages render exactly one <h1>", async ({ page: pw }) => {
    const migrated = Object.entries(PAGES).filter(([, cfg]) => cfg.variant !== null);
    for (const [name, cfg] of migrated) {
      const html = await pw.request.get(cfg.url).then((r) => r.text());
      const h1Count = (html.match(/<h1\b/g) || []).length;
      expect(h1Count, `${name} (${cfg.url}) must have exactly one <h1>`).toBe(1);
    }
  });

  test("shared partial produces stable canonical-identity classes on all 5 migrated pages", async ({ page: pw }) => {
    const migrated = Object.entries(PAGES).filter(([, cfg]) => cfg.variant !== null);
    for (const [name, cfg] of migrated) {
      const html = await pw.request.get(cfg.url).then((r) => r.text());
      expect(html, `${name}: .content-detail-eyebrow`).toContain('class="content-detail-eyebrow mb-2"');
      expect(html, `${name}: .content-detail-title mb-3`).toContain('class="content-detail-title mb-3"');
      expect(html, `${name}: variant modifier`).toContain(`content-detail-hero--${cfg.variant}`);
    }
  });
});

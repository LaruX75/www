const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * OPETUS-IA-01 — SSR Opetus landing + navigation wiring.
 *
 * User rule enforced by this slice:
 *   `/opetus/` must be a real SSR teaching landing, not a redirect.
 *   It must expose the existing 405040Y course-implementation page
 *   through normal navigation, and it must not conflate teaching
 *   structure with `/portfolio/`, `/opiskelijoiden-antamaa-palautetta/`,
 *   or `/tyoni-yliopistonlehtorina/`.
 *
 * Verified course URL (from src/opetus/teknologiatuettu-oppiminen-2026-a.md
 * frontmatter permalink):
 *   /opetus/teknologiatuettu-oppiminen/2026-2027-a/
 *
 * Legacy alias /opetus/teknologiatuettu-oppiminen/2026-a/ remains as a
 * separate legacy redirect and is out of scope for this slice.
 *
 * Out of scope (do NOT test in this slice):
 *   - Canonical Content v1 changes
 *   - Presentation-side `periodId` extension
 *   - Sequence UX (DETAIL-UX-SEQUENCE-01 stays CLOSED / DEFERRED)
 *   - Archive of historical 410014Y / 410017Y content
 *   - EN /opetus/ counterpart (FI-only by design)
 */

const OPETUS = "/opetus/";
const COURSE = "/opetus/teknologiatuettu-oppiminen/2026-2027-a/";
const PORTFOLIO = "/portfolio/";
const STUDENT_FEEDBACK = "/opiskelijoiden-antamaa-palautetta/";
const TYONI = "/tyoni-yliopistonlehtorina/";

test.describe("A. /opetus/ is a real SSR landing (not a redirect)", () => {
  test("HTTP response is the landing HTML with a canonical <h1>", async ({ page }) => {
    const res = await page.request.get(OPETUS);
    expect(res.status(), "200 OK").toBe(200);
    const html = await res.text();
    expect(html, "not a client-side redirect stub").not.toMatch(/http-equiv="refresh"/i);
    expect(html, "contains landing h1 'Opetus'").toMatch(/<h1[^>]*>[^<]*Opetus[^<]*<\/h1>/);
    expect(html, "not the legacy redirect to /tyoni-yliopistonlehtorina/")
      .not.toContain('url=/tyoni-yliopistonlehtorina/');
  });

  test("landing renders meaningful content in SSR HTML with JavaScript disabled", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, "<h1>Opetus</h1> present in SSR").toMatch(/<h1[^>]*>[^<]*Opetus[^<]*<\/h1>/);
    expect(html, "course link present in SSR").toContain(`href="${COURSE}"`);
    await ctx.close();
  });
});

test.describe("B. Landing links to the verified 405040Y course page", () => {
  test("course link is present with correct href", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, `landing has link to ${COURSE}`).toContain(`href="${COURSE}"`);
    expect(html, "course name surfaces on landing")
      .toContain("Teknologiatuettu oppiminen ja työskentely");
    expect(html, "course code visible")
      .toContain("405040Y");
  });

  test("course link resolves to the real course page (200 OK, correct h1)", async ({ page }) => {
    const res = await page.request.get(COURSE);
    expect(res.status(), `${COURSE} returns 200`).toBe(200);
    const html = await res.text();
    expect(html, "course page h1 present")
      .toMatch(/<h1[^>]*>[^<]*Teknologiatuettu oppiminen ja työskentely[^<]*syyslukukausi 2026[^<]*<\/h1>/);
  });
});

test.describe("C. Landing exposes teaching-adjacent surfaces without conflating them", () => {
  test("portfolio link present but distinct from course listing", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, "portfolio link present").toContain(`href="${PORTFOLIO}"`);
    expect(html, "portfolio labelled as Opetusportfolio").toContain("Opetusportfolio");
  });

  test("student feedback link present", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, "student feedback link present").toContain(`href="${STUDENT_FEEDBACK}"`);
    expect(html, "labelled as Opiskelijapalaute").toContain("Opiskelijapalaute");
  });

  test("työprofiili link present", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, "työprofiili link present").toContain(`href="${TYONI}"`);
  });

  test("landing declares that adjacent pages are not course-structure substitutes", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    // Copy invariant: the landing tells the user portfolio / feedback /
    // työprofiili are NOT course-structure replacements. Explicit
    // clarity guards against future copy drift that would re-collapse
    // the IA distinction.
    expect(html, "explicit non-substitution copy")
      .toContain("eivät ole kurssirakenteen korvikkeita");
  });
});

test.describe("D. Legacy redirect is deleted", () => {
  test("no meta-refresh on /opetus/", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, "no client-side refresh").not.toMatch(/http-equiv=["']refresh["']/i);
  });

  test("landing is NOT the legacy stub that pointed at tyoni-yliopistonlehtorina", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, "no 'siirry sivulle' redirect body copy").not.toContain("Tämä sivu on siirtynyt");
  });
});

test.describe("E. FI global navigation exposes /opetus/", () => {
  test("home page nav includes /opetus/ link in the Työ mega-menu", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    // Nav is data-driven via headerNav.js megaMenuWork; the /opetus/
    // link ships as part of the "Yliopistotyö" mega-menu section.
    expect(html, "nav contains /opetus/ href").toContain('href="/opetus/"');
  });
});

test.describe("F. FI/EN asymmetry is intentional (no EN /opetus/)", () => {
  test("EN home does NOT synthesize an /en/opetus/ or /en/teaching/ link", async ({ page }) => {
    const html = await page.request.get("/en/").then((r) => r.text());
    expect(html, "no /en/opetus/ link").not.toContain('href="/en/opetus/"');
    expect(html, "no /en/teaching/ link").not.toContain('href="/en/teaching/"');
  });

  test("EN /opetus/ route does not exist as a real page", async ({ page }) => {
    const res = await page.request.get("/en/opetus/", { failOnStatusCode: false });
    // Either 404 or absent from routing — do NOT synthesize.
    expect(res.status(), "no /en/opetus/ route").toBeGreaterThanOrEqual(400);
  });
});

test.describe("G. No runtime JSON, no page-specific JS added by this slice", () => {
  test("landing does not fetch a course JSON at runtime", async ({ page }) => {
    const requests = [];
    page.on("request", (req) => {
      if (req.resourceType() === "fetch" || req.resourceType() === "xhr") {
        requests.push(req.url());
      }
    });
    await page.goto(OPETUS);
    await page.waitForLoadState("networkidle");
    const courseRelated = requests.filter((u) => /opetus|course|kurssi/i.test(u) && /\.json(\?|$)/i.test(u));
    expect(courseRelated, "no runtime course JSON fetch").toEqual([]);
  });
});

test.describe("H. Accessibility / semantics", () => {
  test("exactly one <h1> on landing", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    const h1Count = (html.match(/<h1\b/g) || []).length;
    expect(h1Count, "exactly one <h1>").toBe(1);
  });

  test("section headings use <h2> and are labeled", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, "nykyinen opetus h2 exists")
      .toMatch(/<h2[^>]*id="opetus-nykyiset-heading"[^>]*>[^<]*Nykyinen opetus[^<]*<\/h2>/);
    expect(html, "adjacent surfaces h2 exists")
      .toMatch(/<h2[^>]*id="opetus-liittyvat-heading"[^>]*>/);
  });

  test("primary CTA to course is a real SSR link with expected text", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    expect(html, "btn-primary CTA to course present in SSR").toMatch(
      new RegExp(`<a[^>]*class="btn btn-primary[^"]*"[^>]*href="${COURSE.replace(/\//g, "\\/")}"[^>]*>[^<]*Avaa kurssisivu[^<]*<\\/a>`)
    );
  });
});

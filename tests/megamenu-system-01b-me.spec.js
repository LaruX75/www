const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * MEGAMENU-SYSTEM-01B — Minä mega-menu IA.
 *
 * Applies the MEGAMENU-IA-01 pattern to Minä:
 *
 *   Overview strip (compact, above the grouped-route grid):
 *     FI:
 *       - Tietoa minusta → /tietoa/
 *       - Ansioluettelo → /cv/
 *       - Palkinnot → /palkinnot/
 *     EN:
 *       - About me → /en/about/
 *       - Curriculum Vitae → /en/cv/
 *       - Awards → /en/awards/
 *
 *   Grouped routes:
 *     FI: 2 sections (Vapaa-aika, Roolini)
 *     EN: 2 sections (Free Time, My Roles)
 *
 *   Showcase aside (portrait + title + description + CTA) preserved.
 *
 * Invariants preserved:
 *   - MEGAMENU-IA-01: Työ mega-menu (post macro extraction) is byte-identical
 *     in structure; overview strip renders the same three profile links and
 *     four sections in the same order.
 *   - HOME-NAV-CORRECTION-01 / OPETUS-IA-01: no /en/opetus/ or /en/teaching/.
 *   - Ansioluettelo and Palkinnot remain useful contextual duplicates
 *     (present in BOTH Minä overview strip and Työ overview strip).
 */

function fiMePanel(html) {
  const m = html.match(/<div id="megaMenuMeFi"[\s\S]*?<\/div>\s*<\/li>/);
  if (!m) throw new Error("FI Minä mega-menu panel not found");
  return m[0];
}

function enMePanel(html) {
  const m = html.match(/<div id="megaMenuMeEn"[\s\S]*?<\/div>\s*<\/li>/);
  if (!m) throw new Error("EN Me mega-menu panel not found");
  return m[0];
}

function fiWorkPanel(html) {
  const m = html.match(/<div id="megaMenuWorkFi"[\s\S]*?<\/div>\s*<\/li>/);
  if (!m) throw new Error("FI Työ mega-menu panel not found");
  return m[0];
}

test.describe("A. FI Minä mega-menu renders the overview strip", () => {
  test("overview strip is present with the three profile links", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiMePanel(html);
    expect(panel, "overview strip container").toMatch(/<nav class="mega-overview-strip"[^>]*aria-label="Profiilin yleiskatsaus"[^>]*>/);
    expect(panel, "Tietoa minusta overview link").toMatch(/mega-overview-link[^>]*href="\/tietoa\/"/);
    expect(panel, "Ansioluettelo overview link").toMatch(/mega-overview-link[^>]*href="\/cv\/"/);
    expect(panel, "Palkinnot overview link").toMatch(/mega-overview-link[^>]*href="\/palkinnot\/"/);
  });

  test("overview strip reading order precedes the section grid", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiMePanel(html);
    const stripIndex = panel.indexOf('class="mega-overview-strip"');
    const gridIndex = panel.indexOf('class="mega-left three-cols"');
    expect(stripIndex, "overview strip present").toBeGreaterThan(-1);
    expect(gridIndex, "three-cols grid present").toBeGreaterThan(-1);
    expect(stripIndex, "overview strip comes before section grid").toBeLessThan(gridIndex);
  });
});

test.describe("B. FI Minä sections reduced to two personal-dimension groups", () => {
  test("exactly two <section> blocks with target headings, in target order", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiMePanel(html);
    const gridMatch = panel.match(/<div class="mega-left three-cols">[\s\S]*?<\/div>/);
    expect(gridMatch, "three-cols grid present").not.toBeNull();
    const sections = gridMatch[0].match(/<section>[\s\S]*?<\/section>/g) || [];
    expect(sections.length, "exactly two Minä grouped-route sections").toBe(2);
    const headings = sections.map((s) => {
      const h = s.match(/<h5>([^<]+)<\/h5>/);
      return h ? h[1].trim() : null;
    });
    expect(headings, "target Minä heading order").toEqual(["Vapaa-aika", "Roolini"]);
  });

  test("the old 'Jari lyhyesti' column heading is gone", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiMePanel(html);
    expect(panel, "no legacy 'Jari lyhyesti' heading").not.toContain("Jari lyhyesti");
  });
});

test.describe("C. FI Minä showcase aside is preserved", () => {
  test("showcase card renders with image, title and CTA", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiMePanel(html);
    const aside = panel.match(/<aside class="mega-right showcase-card">[\s\S]*?<\/aside>/);
    expect(aside, "showcase aside present").not.toBeNull();
    expect(aside[0], "showcase image").toMatch(/<img[^>]*jari\.laru/i);
    expect(aside[0], "showcase title 'Jari Laru'").toContain("Jari Laru");
    expect(aside[0], "showcase CTA button").toMatch(/<a class="btn btn-accent[^"]*"[^>]*href="\/yhteystiedot\/"[^>]*>Ota yhteyttä<\/a>/);
  });
});

test.describe("D. EN Me mega-menu renders overview strip and reduced sections", () => {
  test("EN overview strip present with About me / CV / Awards", async ({ page }) => {
    const html = await page.request.get("/en/").then((r) => r.text());
    const panel = enMePanel(html);
    expect(panel).toMatch(/<nav class="mega-overview-strip"[^>]*aria-label="Profile overview"[^>]*>/);
    expect(panel).toMatch(/mega-overview-link[^>]*href="\/en\/about\/"/);
    expect(panel).toMatch(/mega-overview-link[^>]*href="\/en\/cv\/"/);
    expect(panel).toMatch(/mega-overview-link[^>]*href="\/en\/awards\/"/);
  });

  test("exactly two EN sections in target order (Free Time, My Roles)", async ({ page }) => {
    const html = await page.request.get("/en/").then((r) => r.text());
    const panel = enMePanel(html);
    const gridMatch = panel.match(/<div class="mega-left three-cols">[\s\S]*?<\/div>/);
    const sections = gridMatch[0].match(/<section>[\s\S]*?<\/section>/g) || [];
    expect(sections.length, "exactly two EN Me sections").toBe(2);
    const headings = sections.map((s) => {
      const h = s.match(/<h5>([^<]+)<\/h5>/);
      return h ? h[1].trim() : null;
    });
    expect(headings).toEqual(["Free Time", "My Roles"]);
  });

  test("EN 'About Jari' column heading is gone; EN showcase preserved", async ({ page }) => {
    const html = await page.request.get("/en/").then((r) => r.text());
    const panel = enMePanel(html);
    expect(panel).not.toContain("About Jari");
    const aside = panel.match(/<aside class="mega-right showcase-card">[\s\S]*?<\/aside>/);
    expect(aside).not.toBeNull();
    expect(aside[0]).toMatch(/<a class="btn btn-accent[^"]*"[^>]*href="\/en\/contact\/"[^>]*>Get in touch<\/a>/);
  });
});

test.describe("E. Contextual duplicates preserved", () => {
  test("Ansioluettelo appears in BOTH Minä overview strip AND Työ overview strip", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const mePanel = fiMePanel(html);
    const workPanel = fiWorkPanel(html);
    const meStrip = mePanel.match(/<nav class="mega-overview-strip"[\s\S]*?<\/nav>/)[0];
    const workStrip = workPanel.match(/<nav class="mega-overview-strip"[\s\S]*?<\/nav>/)[0];
    expect(meStrip).toContain('href="/cv/"');
    expect(workStrip).toContain('href="/cv/"');
  });

  test("Palkinnot appears in BOTH Minä overview strip AND Työ overview strip", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const mePanel = fiMePanel(html);
    const workPanel = fiWorkPanel(html);
    const meStrip = mePanel.match(/<nav class="mega-overview-strip"[\s\S]*?<\/nav>/)[0];
    const workStrip = workPanel.match(/<nav class="mega-overview-strip"[\s\S]*?<\/nav>/)[0];
    expect(meStrip).toContain('href="/palkinnot/"');
    expect(workStrip).toContain('href="/palkinnot/"');
  });
});

test.describe("F. MEGAMENU-IA-01 invariants preserved after macro extraction", () => {
  test("Työ overview strip still renders with Yliopistotyö / Ansioluettelo / Palkinnot", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    expect(panel).toMatch(/<nav class="mega-overview-strip"[^>]*aria-label="Työn yleiskatsaus"[^>]*>/);
    const strip = panel.match(/<nav class="mega-overview-strip"[\s\S]*?<\/nav>/)[0];
    expect(strip).toContain('href="/tyoni-yliopistonlehtorina/"');
    expect(strip).toContain('href="/cv/"');
    expect(strip).toContain('href="/palkinnot/"');
  });

  test("Työ still has exactly four columns in the target order", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    const sections = panel.match(/<section>[\s\S]*?<\/section>/g) || [];
    expect(sections.length).toBe(4);
    const headings = sections.map((s) => {
      const h = s.match(/<h5>(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/h5>/);
      return h ? h[1].trim() : null;
    });
    expect(headings).toEqual([
      "Opetus",
      "Tutkimus",
      "Yhteiskunnallinen vuorovaikutus",
      "Täydennyskoulutus",
    ]);
  });
});

test.describe("G. No new EN routes and no runtime JSON", () => {
  test("no synthesized /en/opetus/ or /en/teaching/ on EN home", async ({ page }) => {
    const html = await page.request.get("/en/").then((r) => r.text());
    expect(html).not.toContain('href="/en/opetus/"');
    expect(html).not.toContain('href="/en/teaching/"');
  });

  test("FI home does not trigger a runtime nav JSON request", async ({ page }) => {
    const requests = [];
    page.on("request", (req) => {
      if (req.resourceType() === "fetch" || req.resourceType() === "xhr") {
        requests.push(req.url());
      }
    });
    await page.goto("/", { waitUntil: "networkidle" });
    const navJson = requests.filter((u) => /nav|menu|megaMenuMe|profile/i.test(u) && /\.json(\?|$)/i.test(u));
    expect(navJson).toEqual([]);
  });
});

test.describe("H. Mobile Minä card renders overview strip and two section-cards", () => {
  test("mobile Minä details block contains overview strip and exactly two section cards", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const mobileMe = html.match(/<details class="mobile-nav-card">\s*<summary>\s*<span class="mobile-nav-card-title"><i[^>]*><\/i>Minä<\/span>[\s\S]*?<\/details>/);
    expect(mobileMe, "mobile Minä details block present").not.toBeNull();
    const block = mobileMe[0];
    expect(block).toMatch(/mobile-nav-overview-strip/);
    expect(block).toMatch(/mobile-nav-overview-link[^>]*href="\/tietoa\/"/);
    expect(block).toMatch(/mobile-nav-overview-link[^>]*href="\/cv\/"/);
    expect(block).toMatch(/mobile-nav-overview-link[^>]*href="\/palkinnot\/"/);
    const sectionCards = block.match(/<section class="mobile-nav-section-card">/g) || [];
    expect(sectionCards.length, "exactly two mobile Minä section cards").toBe(2);
  });
});

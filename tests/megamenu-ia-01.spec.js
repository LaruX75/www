const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * MEGAMENU-IA-01 — Työ mega-menu information architecture.
 *
 * Target FI structure (data-driven via headerNav.js megaMenuWork.fi):
 *
 *   Overview strip (compact, above the four columns):
 *     - Yliopistotyö → /tyoni-yliopistonlehtorina/
 *     - Ansioluettelo → /cv/
 *     - Palkinnot → /palkinnot/
 *
 *   Four parallel activity-domain columns:
 *     - Opetus                             → /opetus/
 *     - Tutkimus                           → /tutkimus/
 *     - Yhteiskunnallinen vuorovaikutus    → /yhteiskunnallinen-vuorovaikutus/
 *     - Täydennyskoulutus                  → /kouluttaja/
 *
 *   Each column's first link IS its domain landing.
 *   Esitykset (/esitykset/) appears as an intentional contextual duplicate
 *   in both the Opetus column and the Täydennyskoulutus column with
 *   different descriptions. The destination is the same canonical archive
 *   — this must NOT be modelled as a taxonomy split or a filtered subset.
 *
 * EN is deliberately three columns (not four). No /en/opetus/ or
 * /en/teaching/ is synthesized. Awards is added to the EN Work overview
 * strip since /en/awards/ already exists.
 *
 * Invariants preserved from earlier closures:
 *   - OPETUS-IA-01: /opetus/ link present in FI Työ mega-menu
 *   - HOME-NAV-CORRECTION-01: no synthesized /en/opetus/ or /en/teaching/
 *   - AC1: no runtime JSON, no browser-side nav content generation
 */

function fiWorkPanel(html) {
  const match = html.match(/<div id="megaMenuWorkFi"[\s\S]*?<\/div>\s*<\/li>/);
  if (!match) throw new Error("FI Työ mega-menu panel not found in home HTML");
  return match[0];
}

function enWorkPanel(html) {
  const match = html.match(/<div id="megaMenuWorkEn"[\s\S]*?<\/div>\s*<\/li>/);
  if (!match) throw new Error("EN Work mega-menu panel not found in home HTML");
  return match[0];
}

test.describe("A. FI Työ mega-menu renders the overview strip", () => {
  test("overview strip is present with the three profile links", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    expect(panel, "overview strip container").toMatch(/<nav class="mega-overview-strip"[^>]*aria-label="Työn yleiskatsaus"[^>]*>/);
    expect(panel, "Yliopistotyö overview link").toMatch(/mega-overview-link[^>]*href="\/tyoni-yliopistonlehtorina\/"/);
    expect(panel, "Ansioluettelo overview link").toMatch(/mega-overview-link[^>]*href="\/cv\/"/);
    expect(panel, "Palkinnot overview link").toMatch(/mega-overview-link[^>]*href="\/palkinnot\/"/);
  });

  test("overview strip reading order precedes the four-column grid", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    const stripIndex = panel.indexOf('class="mega-overview-strip"');
    const colsIndex = panel.indexOf('class="mega-left four-cols"');
    expect(stripIndex, "overview strip present").toBeGreaterThan(-1);
    expect(colsIndex, "four-cols grid present").toBeGreaterThan(-1);
    expect(stripIndex, "overview strip comes before four-cols").toBeLessThan(colsIndex);
  });
});

test.describe("B. FI Työ mega-menu renders the four target domain columns", () => {
  test("exactly four sections with target headings, in target order", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    const sections = panel.match(/<section>[\s\S]*?<\/section>/g) || [];
    expect(sections.length, "exactly four columns").toBe(4);

    const headings = sections.map((s) => {
      const h = s.match(/<h5>(?:<a[^>]*>)?([^<]+)(?:<\/a>)?<\/h5>/);
      return h ? h[1].trim() : null;
    });
    expect(headings, "target heading order").toEqual([
      "Opetus",
      "Tutkimus",
      "Yhteiskunnallinen vuorovaikutus",
      "Täydennyskoulutus",
    ]);
  });

  test("each column's first link is the domain landing", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    const sections = panel.match(/<section>[\s\S]*?<\/section>/g) || [];
    const firstLinks = sections.map((s) => {
      const m = s.match(/<a class="menu-link" href="([^"]+)"/);
      return m ? m[1] : null;
    });
    expect(firstLinks, "landing-first order").toEqual([
      "/opetus/",
      "/tutkimus/",
      "/yhteiskunnallinen-vuorovaikutus/",
      "/kouluttaja/",
    ]);
  });

  test("Opetus column contains portfolio, opiskelijapalaute and esitykset", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    const opetusSection = (panel.match(/<section>[\s\S]*?<\/section>/g) || [])[0];
    expect(opetusSection).toContain('href="/portfolio/"');
    expect(opetusSection).toContain('href="/opiskelijoiden-antamaa-palautetta/"');
    expect(opetusSection).toContain('href="/esitykset/"');
  });

  test("Tutkimus column contains julkaisut, vaitoskirja and opinnaytteet", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    const tutkimusSection = (panel.match(/<section>[\s\S]*?<\/section>/g) || [])[1];
    expect(tutkimusSection).toContain('href="/julkaisut/"');
    expect(tutkimusSection).toContain('href="/vaitoskirja/"');
    expect(tutkimusSection).toContain('href="/opinnaytteet/"');
  });

  test("Yhteiskunnallinen vuorovaikutus column contains lausunnot and mediassa", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    const yvSection = (panel.match(/<section>[\s\S]*?<\/section>/g) || [])[2];
    expect(yvSection).toContain('href="/lausunnot/#lausunnot"');
    expect(yvSection).toContain('href="/mediassa/"');
    expect(yvSection, "no legacy 'kannanotot' label").not.toContain("Lausunnot ja kannanotot");
  });

  test("Täydennyskoulutus column contains kouluttaja, koulutuspalaute and esitykset", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    const tkSection = (panel.match(/<section>[\s\S]*?<\/section>/g) || [])[3];
    expect(tkSection).toContain('href="/kouluttaja/"');
    expect(tkSection).toContain('href="/koulutuspalaute/"');
    expect(tkSection).toContain('href="/esitykset/"');
    expect(tkSection, "no legacy '(Larux t:mi)' in heading").not.toMatch(/<h5>[^<]*Larux t:mi/);
  });
});

test.describe("C. Presentations appear as an intentional contextual duplicate", () => {
  test("/esitykset/ appears in both Opetus and Täydennyskoulutus columns", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    const count = (panel.match(/href="\/esitykset\/"/g) || []).length;
    expect(count, "esitykset appears twice inside FI Työ panel").toBe(2);
  });

  test("the two Esitykset links use distinct labels or descriptions", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    const sections = panel.match(/<section>[\s\S]*?<\/section>/g) || [];
    const opetus = sections[0];
    const tk = sections[3];
    const opetusEsitykset = opetus.match(/<a class="menu-link" href="\/esitykset\/"[^>]*>[\s\S]*?<\/a>[\s\S]*?<small[^>]*>([^<]+)<\/small>/);
    const tkEsitykset = tk.match(/<a class="menu-link" href="\/esitykset\/"[^>]*>[\s\S]*?<\/a>[\s\S]*?<small[^>]*>([^<]+)<\/small>/);
    expect(opetusEsitykset, "Opetus context Esitykset has a description").not.toBeNull();
    expect(tkEsitykset, "Täydennyskoulutus context Esitykset has a description").not.toBeNull();
    expect(opetusEsitykset[1].trim(), "distinct contextual descriptions")
      .not.toEqual(tkEsitykset[1].trim());
  });
});

test.describe("D. CTA card removed from FI Työ mega-menu", () => {
  test("no btn-accent button and no 'Tutustu palveluihin' copy", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    expect(panel, "no accent CTA button inside panel").not.toMatch(/class="[^"]*btn-accent[^"]*"/);
    expect(panel, "no legacy Larux CTA label").not.toContain("Tutustu palveluihin");
  });
});

test.describe("E. Invariants preserved from earlier closures", () => {
  test("OPETUS-IA-01: /opetus/ link is still present in FI Työ mega-menu", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const panel = fiWorkPanel(html);
    expect(panel).toContain('href="/opetus/"');
  });

  test("HOME-NAV-CORRECTION-01: no synthesized /en/opetus/ or /en/teaching/", async ({ page }) => {
    const enHtml = await page.request.get("/en/").then((r) => r.text());
    expect(enHtml, "no /en/opetus/ link").not.toContain('href="/en/opetus/"');
    expect(enHtml, "no /en/teaching/ link").not.toContain('href="/en/teaching/"');
  });
});

test.describe("F. EN Work mega-menu keeps three columns; adds overview strip only", () => {
  test("EN Work has exactly three data-driven columns (Book me for a keynote is the aside CTA, not a column)", async ({ page }) => {
    const html = await page.request.get("/en/").then((r) => r.text());
    const panel = enWorkPanel(html);
    const left = panel.match(/<div class="mega-left three-cols">[\s\S]*?<\/div>/);
    expect(left, "EN uses three-cols left grid").not.toBeNull();
    const sections = (left[0].match(/<section>[\s\S]*?<\/section>/g) || []);
    expect(sections.length, "exactly three EN Work columns").toBe(3);

    const headings = sections.map((s) => {
      const h = s.match(/<h5>([^<]+)<\/h5>/);
      return h ? h[1].trim() : null;
    });
    expect(headings, "EN column headings unchanged").toEqual([
      "University Work",
      "Research",
      "Societal Engagement",
    ]);
  });

  test("EN Work renders overview strip with University Work, CV and Awards", async ({ page }) => {
    const html = await page.request.get("/en/").then((r) => r.text());
    const panel = enWorkPanel(html);
    expect(panel, "EN overview strip present").toMatch(/<nav class="mega-overview-strip"[^>]*aria-label="Work overview"[^>]*>/);
    expect(panel, "overview: University Work").toMatch(/mega-overview-link[^>]*href="\/en\/work\/"/);
    expect(panel, "overview: CV").toMatch(/mega-overview-link[^>]*href="\/en\/cv\/"/);
    expect(panel, "overview: Awards").toMatch(/mega-overview-link[^>]*href="\/en\/awards\/"/);
  });
});

test.describe("G. No runtime JSON is fetched for the new mega-menu content", () => {
  test("visiting FI home does not trigger a runtime nav JSON request", async ({ page }) => {
    const requests = [];
    page.on("request", (req) => {
      if (req.resourceType() === "fetch" || req.resourceType() === "xhr") {
        requests.push(req.url());
      }
    });
    await page.goto("/", { waitUntil: "networkidle" });
    const navJson = requests.filter((u) => /nav|menu|megaMenuWork|work/i.test(u) && /\.json(\?|$)/i.test(u));
    expect(navJson, "no runtime nav JSON fetched").toEqual([]);
  });
});

test.describe("H. Mobile Työ card renders the overview strip and the four columns", () => {
  test("mobile Työ details block contains overview-strip and four section-cards", async ({ page }) => {
    const html = await page.request.get("/").then((r) => r.text());
    const mobileTyo = html.match(/<details class="mobile-nav-card">\s*<summary>\s*<span class="mobile-nav-card-title"><i[^>]*><\/i>Työ<\/span>[\s\S]*?<\/details>/);
    expect(mobileTyo, "mobile Työ details block present").not.toBeNull();
    const block = mobileTyo[0];
    expect(block, "mobile overview strip present").toMatch(/mobile-nav-overview-strip/);
    expect(block).toMatch(/mobile-nav-overview-link[^>]*href="\/tyoni-yliopistonlehtorina\/"/);
    expect(block).toMatch(/mobile-nav-overview-link[^>]*href="\/cv\/"/);
    expect(block).toMatch(/mobile-nav-overview-link[^>]*href="\/palkinnot\/"/);
    const sectionCards = block.match(/<section class="mobile-nav-section-card">/g) || [];
    expect(sectionCards.length, "four mobile section cards").toBe(4);
  });
});

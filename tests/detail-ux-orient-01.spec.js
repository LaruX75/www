const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * DETAIL-UX-ORIENT-01 — site orientation moved out of hero action row,
 * plus contextual RETURN-TO-ORIGIN with label from URL state.
 *
 * Three UX roles kept strictly separate:
 *   PRIMARY ACTION    — hero-actions row, only when a real action exists
 *   SITE ORIENTATION  — sidebar `content-context-archive-link` (+
 *                       Publication/Thesis trailing footer domain hub)
 *   RETURN TO ORIGIN  — trailing `<footer class="content-detail-origin">`
 *                       on Media/Presentation/Writing (JS-revealed
 *                       when `?returnTo=` matches allowlist) and inside
 *                       Publication/Thesis trailing orientation footer.
 *
 * Return-to-origin URL contract (new):
 *   ?returnTo=<local-url>&returnLabel=<contextual label>
 *   - href sourced from `returnTo`
 *   - anchor textContent sourced from `returnLabel` (length-capped,
 *     whitespace-normalized, `textContent`-only)
 *   - falls back to the anchor's SSR default label when `returnLabel`
 *     is absent (backward compat with legacy links)
 */

const PAGES = {
  presentationCourse: "/presentations/405040y-luento-1-johdanto-2026-a/",
  presentationKempele: "/presentations/kempele-veso-2026/",
  presentationYoutube: "/presentations/larun-pikkuvinkit/",
  // 405040Y luentot ovat no-thumbnail (single-column hero fallback);
  // luento-1 kattaa siis molemmat "course peer" + "no-thumbnail" -tapaukset.
  publication: "/julkaisut/0669729323/",
  thesis: "/opinnaytteet/46895/",
  media: "/mediassa/2026/03/29/tekoaly-tekee-petoksen-koulutehtavissa-helpoksi/",
  writingNoSource: "/2026/04/28/lausunto-uutta-suuntaa-suomen-digitaaliseen-kompassiin/",
  blog: "/2013/02/05/yhdistysaktivisti/"
};

async function getHtml(request, url) {
  const res = await request.get(url);
  return res.text();
}

test.describe("A. Hero has no site-orientation and no return-link markers", () => {
  for (const [name, url] of Object.entries({
    presentationCourse: PAGES.presentationCourse,
    presentationKempele: PAGES.presentationKempele,
    presentationYoutube: PAGES.presentationYoutube,
    publication: PAGES.publication,
    media: PAGES.media,
    writingNoSource: PAGES.writingNoSource
  })) {
    test(`${name}: hero holds no orientation or return markers`, async ({ page }) => {
      const html = await getHtml(page.request, url);
      const heroMatch = html.match(/<section class="content-detail-hero[\s\S]*?<\/section>/);
      expect(heroMatch, "hero section present").not.toBeNull();
      expect(heroMatch[0], "no hub-link inside hero").not.toMatch(/data-detail-hub-link/);
      expect(heroMatch[0], "no return-link inside hero").not.toMatch(/data-detail-return-link/);
    });
  }
});

test.describe("B. SITE ORIENTATION placement", () => {
  // Sidebar `content-context-archive-link` is the always-visible SSR
  // site-orientation link for Media / Presentation / Writing / Blog.
  const sidebarOnlyDomains = {
    presentationCourse: { url: PAGES.presentationCourse, sidebarHref: "/esitykset/" },
    presentationKempele: { url: PAGES.presentationKempele, sidebarHref: "/esitykset/" },
    media: { url: PAGES.media, sidebarHref: "/mediassa/" },
    writingNoSource: { url: PAGES.writingNoSource, sidebarHref: "/lausunnot/#lausunnot" },
    blog: { url: PAGES.blog, sidebarHref: "/blogi/" }
  };
  for (const [name, cfg] of Object.entries(sidebarOnlyDomains)) {
    test(`${name}: sidebar content-context-archive-link → ${cfg.sidebarHref}`, async ({ page }) => {
      const html = await getHtml(page.request, cfg.url);
      const escaped = cfg.sidebarHref.replace(/[/#]/g, (c) => `\\${c}`);
      expect(html, "sidebar archive link present").toMatch(
        new RegExp(`content-context-archive-link" href="${escaped}"`)
      );
    });
  }

  // Publication + Thesis KEEP the trailing footer with the shared
  // `detail-orientation.njk` (hub-link + return-link) because their
  // sidebar link resolves to a DIFFERENT semantic destination
  // (`/kynasta/` topical umbrella).
  const trailingDomainHubDomains = {
    publication: { url: PAGES.publication, hubHref: "/julkaisut/", hubLabel: "Takaisin julkaisuihin" },
    thesis: { url: PAGES.thesis, hubHref: "/opinnaytteet/", hubLabel: "Takaisin opinnäytteisiin" }
  };
  for (const [name, cfg] of Object.entries(trailingDomainHubDomains)) {
    test(`${name}: trailing content-detail-orientation footer → ${cfg.hubHref}`, async ({ page }) => {
      const html = await getHtml(page.request, cfg.url);
      expect(html, "trailing footer wrapper").toContain('class="content-detail-orientation py-4 border-top"');
      const footerMatch = html.match(/<footer class="content-detail-orientation[\s\S]*?<\/footer>/);
      expect(footerMatch, "trailing footer block present").not.toBeNull();
      expect(footerMatch[0], "hub-link inside trailing footer").toMatch(/data-detail-hub-link/);
      expect(footerMatch[0], `href starts with ${cfg.hubHref}`).toMatch(
        new RegExp(`href="${cfg.hubHref.replace(/\//g, "\\/")}(?:#[^"]*)?"`)
      );
      expect(footerMatch[0], `label "${cfg.hubLabel}"`).toContain(cfg.hubLabel);
    });
  }
});

test.describe("C. RETURN-TO-ORIGIN trailing region on Media/Presentation/Writing (independent of hero-actions)", () => {
  const originDomains = {
    presentationCourse: { url: PAGES.presentationCourse, prefixes: /\/esitykset\/,\/en\/presentations\// },
    presentationKempele: { url: PAGES.presentationKempele, prefixes: /\/esitykset\/,\/en\/presentations\// },
    media: { url: PAGES.media, prefixes: /\/mediassa\/,\/en\/media\// },
    writingNoSource: { url: PAGES.writingNoSource, prefixes: /\/kirjoitukset\/,\/en\/writings\// }
  };
  for (const [name, cfg] of Object.entries(originDomains)) {
    test(`${name}: trailing content-detail-origin footer with return-link (default hidden)`, async ({ page }) => {
      const html = await getHtml(page.request, cfg.url);
      expect(html, "trailing origin footer wrapper").toContain('class="content-detail-origin py-4"');
      const footerMatch = html.match(/<footer class="content-detail-origin[\s\S]*?<\/footer>/);
      expect(footerMatch, "trailing origin footer block present").not.toBeNull();
      expect(footerMatch[0], "return-link inside trailing origin footer").toMatch(/data-detail-return-link/);
      expect(footerMatch[0], "return-link starts hidden via d-none").toMatch(/d-none[\s\S]+data-detail-return-link/);
      expect(footerMatch[0], "no hub-link duplicated in origin footer").not.toMatch(/data-detail-hub-link/);
      expect(footerMatch[0], "default label attribute present").toMatch(/data-detail-return-default-label/);
    });
  }

  test(`writing-no-source: return-link renders in trailing footer even without hero-actions row`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.writingNoSource);
    const heroMatch = html.match(/<section class="content-detail-hero[\s\S]*?<\/section>/);
    expect(heroMatch[0], "hero has no CTA row").not.toContain('class="content-detail-actions"');
    expect(html, "return-link still present in trailing region").toContain('class="content-detail-origin py-4"');
    expect(html, "return-link data attr").toMatch(/data-detail-return-link/);
  });
});

test.describe("D. Return label URL contract", () => {
  test(`site-ui.js renders returnLabel from URL when returnTo is valid`, async ({ page }) => {
    // Simulate arrival with explicit label — JS should reveal link and
    // set textContent to the sanitized returnLabel value.
    const url = `${PAGES.presentationCourse}?returnTo=${encodeURIComponent("/opetus/teknologiatuettu-oppiminen/2026-a/")}&returnLabel=${encodeURIComponent("Takaisin kurssille 405040Y")}`;
    await page.goto(url);
    const returnLink = page.locator('[data-detail-return-link]');
    await expect(returnLink).toBeVisible();
    await expect(returnLink).toHaveText("Takaisin kurssille 405040Y");
    await expect(returnLink).toHaveAttribute("href", /\/opetus\/teknologiatuettu-oppiminen\/2026-a\//);
  });

  test(`site-ui.js falls back to SSR default label when returnLabel is absent`, async ({ page }) => {
    const url = `${PAGES.presentationCourse}?returnTo=${encodeURIComponent("/etsi/?q=tekoaly")}`;
    await page.goto(url);
    const returnLink = page.locator('[data-detail-return-link]');
    await expect(returnLink).toBeVisible();
    // Default fallback = "Takaisin hakutuloksiin" (SSR default in the
    // partial). No override → default label surfaces.
    await expect(returnLink).toHaveText("Takaisin hakutuloksiin");
  });

  test(`site-ui.js sanitizes overlong returnLabel (length cap ~80)`, async ({ page }) => {
    const longLabel = "X".repeat(200);
    const url = `${PAGES.presentationCourse}?returnTo=${encodeURIComponent("/etsi/?q=x")}&returnLabel=${encodeURIComponent(longLabel)}`;
    await page.goto(url);
    const returnLink = page.locator('[data-detail-return-link]');
    await expect(returnLink).toBeVisible();
    const text = (await returnLink.textContent()) || "";
    expect(text.length, "label truncated to 80").toBeLessThanOrEqual(80);
  });

  test(`site-ui.js keeps return-link hidden when returnTo is cross-origin`, async ({ page }) => {
    await page.goto(`${PAGES.presentationCourse}?returnTo=https://example.com/&returnLabel=Evil`);
    await expect(page.locator('[data-detail-return-link]')).toBeHidden();
  });

  test(`Find & Explore search decorates result links with both returnTo AND returnLabel`, async ({ page }) => {
    await page.goto("/julkaisut/");
    await page.locator("[data-find-explore-query]").fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
    await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
    const resultLink = page.locator(".publication-archive-row .publication-archive-title-link").first();
    await expect(resultLink).toHaveAttribute("href", /returnTo=/);
    await expect(resultLink).toHaveAttribute("href", /returnLabel=Takaisin\+hakutuloksiin/);
  });
});

test.describe("E. Presentation archive card links carry returnTo AND returnLabel", () => {
  test(`/esitykset/ local cards include returnLabel=Takaisin+esityksiin`, async ({ page }) => {
    const html = await getHtml(page.request, "/esitykset/");
    expect(html, "presentation card returnTo").toContain("returnTo=%2Fesitykset%2F");
    expect(html, "presentation card returnLabel").toContain("returnLabel=Takaisin%20esityksiin");
  });
});

test.describe("F. Publication + Thesis: sidebar `/kynasta/` and trailing domain-hub co-exist (different semantics)", () => {
  test(`publication: sidebar → /kynasta/, trailing footer → /julkaisut/`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.publication);
    expect(html, "sidebar Kynästä link").toMatch(/content-context-archive-link" href="\/kynasta\/"/);
    const footerMatch = html.match(/<footer class="content-detail-orientation[\s\S]*?<\/footer>/);
    expect(footerMatch, "trailing footer present").not.toBeNull();
    expect(footerMatch[0], "trailing → /julkaisut/ (may include #anchor)").toMatch(/href="\/julkaisut\/(?:#[^"]*)?"/);
  });

  test(`thesis: sidebar → /kynasta/, trailing footer → /opinnaytteet/`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.thesis);
    expect(html, "sidebar Kynästä link").toMatch(/content-context-archive-link" href="\/kynasta\/"/);
    const footerMatch = html.match(/<footer class="content-detail-orientation[\s\S]*?<\/footer>/);
    expect(footerMatch, "trailing footer present").not.toBeNull();
    expect(footerMatch[0], "trailing → /opinnaytteet/").toContain('href="/opinnaytteet/"');
  });
});

test.describe("G. Primary actions preserved in hero (unchanged by orient move)", () => {
  test(`Presentation Canva CTA preserved`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.presentationCourse);
    expect(html, "Avaa esitys Canvassa in hero").toContain('Avaa esitys Canvassa');
  });

  test(`Presentation YouTube CTA preserved`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.presentationYoutube);
    expect(html, "Katso tallenne YouTubessa in hero").toContain('Katso tallenne YouTubessa');
  });

  test(`Publication DOI CTA preserved`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.publication);
    expect(html, "Avaa DOI:ssa in hero").toContain('Avaa DOI:ssa');
    expect(html, "sidebar DOI row (DETAIL-UX-01A protected)").toContain('<dt>DOI</dt>');
  });

  test(`Thesis OuluREPO CTA preserved`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.thesis);
    expect(html, "Avaa OuluREPOssa in hero").toContain('Avaa OuluREPOssa');
  });

  test(`Media outlet-suffixed CTA preserved`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.media);
    expect(html, "Avaa alkuperäinen lähde — Kaleva").toContain('Avaa alkuperäinen lähde — Kaleva');
  });
});

test.describe("H. DETAIL-UX-01C-B-COURSE invariants preserved", () => {
  test(`405040Y luento-1: Samalla kurssilla section preserved with 2 peers`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.presentationCourse);
    expect(html, "course-peers section").toContain('content-detail-course-peers');
    const peerCount = (html.match(/course-peer-item/g) || []).length;
    expect(peerCount, "2 peers on 405040Y").toBe(2);
  });

  test(`Kempele: no course-peers section (negative control)`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.presentationKempele);
    expect(html, "no course-peers section on Kempele").not.toContain('content-detail-course-peers');
  });

  test(`Kempele: Paikka + Käyttöyhteys + Järjestäjä three-way semantic split preserved`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.presentationKempele);
    expect(html, "Paikka row").toMatch(/<dt>Paikka<\/dt>\s*<dd>Kempele<\/dd>/);
    expect(html, "Käyttöyhteys row").toMatch(/<dt>Käyttöyhteys<\/dt>\s*<dd>Täydennyskoulutus<\/dd>/);
    expect(html, "Järjestäjä row").toMatch(/<dt>Järjestäjä<\/dt>\s*<dd>Kempeleen kunta \(VESO-koulutus\)<\/dd>/);
  });
});

test.describe("I. Meaningful without JavaScript", () => {
  // Publication + Thesis trailing footer renders SSR hub-link.
  for (const [name, url] of Object.entries({
    publication: PAGES.publication,
    thesis: PAGES.thesis
  })) {
    test(`${name}: trailing footer hub-link present in SSR HTML with JS disabled`, async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      const html = await getHtml(page.request, url);
      expect(html, "trailing footer present").toContain('class="content-detail-orientation py-4 border-top"');
      expect(html, "SSR data-detail-hub-link").toMatch(/data-detail-hub-link/);
      await ctx.close();
    });
  }

  // Media / Presentation / Writing: sidebar archive-link is SSR
  // orientation. Return-link SSRs as `d-none` so screen-reader users
  // don't hear a bogus "back" link when no valid returnTo exists.
  for (const [name, cfg] of Object.entries({
    presentationCourse: { url: PAGES.presentationCourse, sidebarHref: "/esitykset/" },
    media: { url: PAGES.media, sidebarHref: "/mediassa/" },
    writingNoSource: { url: PAGES.writingNoSource, sidebarHref: "/lausunnot/#lausunnot" }
  })) {
    test(`${name}: sidebar orientation + hidden trailing return-link in SSR HTML with JS disabled`, async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const page = await ctx.newPage();
      const html = await getHtml(page.request, cfg.url);
      const escaped = cfg.sidebarHref.replace(/[/#]/g, (c) => `\\${c}`);
      expect(html, "sidebar archive-link in SSR").toMatch(
        new RegExp(`content-context-archive-link" href="${escaped}"`)
      );
      // Trailing origin footer still renders (link is d-none so it
      // doesn't visually assert an unwanted "back" affordance).
      expect(html, "trailing origin footer SSR").toContain('class="content-detail-origin py-4"');
      expect(html, "return-link ships as d-none").toMatch(/d-none[\s\S]+data-detail-return-link/);
      await ctx.close();
    });
  }
});

test.describe("J. Blog: no card-footer back link (duplicate removed); sidebar orientation preserved", () => {
  test(`blog: 'Takaisin blogiin' card-footer removed`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.blog);
    expect(html, "card-footer back link removed").not.toContain("Takaisin blogiin");
  });

  test(`blog: sidebar content-context-archive-link → /blogi/`, async ({ page }) => {
    const html = await getHtml(page.request, PAGES.blog);
    expect(html, "sidebar archive link").toMatch(/content-context-archive-link" href="\/blogi\/"/);
  });
});

const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("FI publications discovery state keeps canonical hub return and explicit results return", async ({ page }) => {
  await page.goto("/julkaisut/");
  const initialHref = await page.locator(".publication-archive-row .publication-archive-title-link").first().getAttribute("href");
  expect(initialHref).not.toContain("returnTo=");
  await page.locator("[data-find-explore-query]").fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);

  const resultLink = page.locator(".publication-archive-row .publication-archive-title-link").first();
  await expect(resultLink).toHaveAttribute("href", /q%3DAssessing/);
  const resultHref = await resultLink.getAttribute("href");
  await page.goto(resultHref);

  await expect(page.locator("nav[aria-label='Murupolku'], nav[aria-label='Breadcrumb']")).toBeVisible();
  await expect(page.locator(".breadcrumb [aria-current='page']")).toHaveCount(1);
  await expect(page.locator("[data-detail-hub-link]")).toHaveAttribute("href", /^\/julkaisut\/(?:#.+)?$/);
  await expect(page.locator("[data-detail-return-link]")).toBeVisible();
  await expect(page.locator("[data-detail-return-link]")).toHaveAttribute("href", /\/julkaisut\/\?.*q=Assessing/);
});

test("EN thesis detail preserves English hub return and explicit results return", async ({ page }) => {
  // THESIS-HUB-02: FE moved from /en/theses/ (hub, no FE) to the
  // /en/theses/masters/ subarchive. Detail hub link still targets the
  // hub, while the detail-return-link targets the subarchive with the
  // preserved query string.
  await page.goto("/en/theses/masters/");
  const initialHref = await page.locator("[data-find-explore-results] .thesis-archive-title-link").first().getAttribute("href");
  expect(initialHref).not.toContain("returnTo=");
  await page.locator("[data-find-explore-query]").fill("Gill");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/result|results/, { timeout: 15000 });

  const resultLink = page.locator("[data-find-explore-results] .thesis-archive-title-link").first();
  await expect(resultLink).toHaveAttribute("href", /returnTo=/);
  await resultLink.click();

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("nav[aria-label='Breadcrumb']")).toBeVisible();
  await expect(page.locator("[data-detail-hub-link]")).toHaveAttribute("href", "/en/theses/");
  await expect(page.locator("[data-detail-return-link]")).toBeVisible();
  await expect(page.locator("[data-detail-return-link]")).toHaveAttribute("href", /\/en\/theses\/masters\/\?q=Gill/);
});

test("FI thesis detail keeps canonical no-JS hub navigation and hides duplicate results return on default archive state", async ({ browser, page }) => {
  const jsOffContext = await browser.newContext({ javaScriptEnabled: false });
  const jsOffPage = await jsOffContext.newPage();

  await jsOffPage.goto("/opinnaytteet/62699/");
  const jsOffHubLink = jsOffPage.locator("[data-detail-hub-link]");
  await expect(jsOffHubLink).toHaveAttribute("href", "/opinnaytteet/");
  const jsOffHubHref = await jsOffHubLink.getAttribute("href");
  await jsOffPage.goto(jsOffHubHref);
  await expect(jsOffPage).toHaveURL(/\/opinnaytteet\/$/);

  await jsOffContext.close();

  // THESIS-HUB-02: hub has no Find & Explore mount. Click a hub-section
  // title link (bare `/opinnaytteet/<id>/`, no returnTo) and confirm the
  // discovery-return link stays hidden because there is no discovery
  // context to return to.
  await page.goto("/opinnaytteet/");
  await page.locator("[data-thesis-hub-section] .thesis-archive-title-link").first().click();
  await expect(page.locator("[data-detail-return-link]")).toBeHidden();

  await page.goto("/opinnaytteet/62699/?returnTo=https://example.com/");
  await expect(page.locator("[data-detail-return-link]")).toBeHidden();
});

test("FI writings detail uses explicit hub navigation instead of browser-history back magic", async ({ page }) => {
  await page.goto("/kirjoitukset/");
  await page.locator("[data-find-explore-query]").fill("Kampuspohdintaa Oulun yliopiston hallitus valitsi Kontinkankaan jatkokehitettäväksi kampusvaihtoehdoksi");
  await page.locator("[data-find-explore-type]").selectOption("opinion");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });

  const resultLink = page.locator("[data-find-explore-results] .find-explore-result-title").first();
  await expect(resultLink).toHaveAttribute("href", /returnTo=/);
  await resultLink.click();

  // DETAIL-UX-ORIENT-01: `data-detail-hub-link` no longer emitted on
  // Writing detail (sidebar `content-context-archive-link` is the
  // sole always-visible site-orientation link). The O1 return-link
  // (`data-detail-return-link`) is preserved via the standalone
  // `detail-return-link.njk` partial and remains JS-revealed when
  // `?returnTo=` matches the allowlist.
  await expect(page.locator("[data-detail-hub-link]")).toHaveCount(0);
  await expect(page.locator("[data-detail-return-link]")).toBeVisible();
  await expect(page.locator("[data-detail-return-link]")).toHaveAttribute("href", /\/kirjoitukset\/\?q=Kampuspohdintaa/);
  await expect(page.locator("[data-history-back]")).toHaveCount(0);
});

test("FI presentation detail: sidebar archive-link is SSR site-orientation; return-link stays hidden without valid context", async ({ browser, page }) => {
  // DETAIL-UX-ORIENT-01: hero orientation removed on Presentation.
  // Sidebar `content-context-archive-link` → /esitykset/ is the sole
  // always-visible SSR orientation link. The O1 return-link partial
  // is retained in the hero-actions row (JS-revealed only).
  const jsOffContext = await browser.newContext({ javaScriptEnabled: false });
  const jsOffPage = await jsOffContext.newPage();

  await jsOffPage.goto("/presentations/arjen-tekoalyhaaste/");
  await expect(jsOffPage.locator("[data-detail-hub-link]")).toHaveCount(0);
  const sidebarLink = jsOffPage.locator(".content-context-archive-link");
  await expect(sidebarLink).toHaveAttribute("href", "/esitykset/");
  await expect(sidebarLink).toContainText("Kaikki esitykset");
  const sidebarHref = await sidebarLink.getAttribute("href");
  await jsOffPage.goto(sidebarHref);
  await expect(jsOffPage).toHaveURL(/\/esitykset\/$/);
  await jsOffContext.close();

  await page.goto("/presentations/arjen-tekoalyhaaste/");
  await expect(page.locator("[data-detail-return-link]")).toBeHidden();

  await page.goto("/presentations/arjen-tekoalyhaaste/?returnTo=https://example.com/");
  await expect(page.locator("[data-detail-return-link]")).toBeHidden();
});

test("FI presentation archive decorates local card links with returnTo and leaves external-first cards untouched", async ({ page }) => {
  await page.goto("/esitykset/");
  await expect(page.locator(".presentation-archive-card").first()).toBeVisible({ timeout: 15000 });

  const localLink = page.locator(".presentation-archive-card-title a[href^='/presentations/']").first();
  await expect(localLink).toHaveAttribute("href", /returnTo=%2Fesitykset%2F/);

  const externalLink = page.locator(".presentation-archive-card-title a").filter({ hasNot: page.locator("[href^='/presentations/']") }).first();
  const externalHref = await externalLink.getAttribute("href").catch(() => null);
  if (externalHref) {
    expect(externalHref).not.toContain("returnTo=");
  }
});

test("FI presentation detail reveals discovery return link when returnTo carries state that differs from hub", async ({ page }) => {
  // DETAIL-UX-ORIENT-01: hub-link no longer emitted here. Return-link
  // (via standalone `detail-return-link.njk`) still reveals correctly
  // when `?returnTo=` matches the /esitykset/ prefix allowlist.
  await page.goto("/presentations/arjen-tekoalyhaaste/?returnTo=%2Fesitykset%2F%23kaikki-esitykset");
  await expect(page.locator("[data-detail-hub-link]")).toHaveCount(0);
  await expect(page.locator("[data-detail-return-link]")).toBeVisible();
  await expect(page.locator("[data-detail-return-link]")).toHaveAttribute("href", /\/esitykset\/#kaikki-esitykset/);
});

test("FI media detail: sidebar archive-link is SSR site-orientation; source CTA preserved; return-link hidden without valid context", async ({ browser, page }) => {
  // DETAIL-UX-ORIENT-01: hero orientation removed on Media. Sidebar
  // `content-context-archive-link` → /mediassa/ is the sole
  // always-visible SSR orientation link.
  const jsOffContext = await browser.newContext({ javaScriptEnabled: false });
  const jsOffPage = await jsOffContext.newPage();

  await jsOffPage.goto("/mediassa/2025/12/24/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/");
  await expect(jsOffPage.locator("[data-detail-hub-link]")).toHaveCount(0);
  const sidebarLink = jsOffPage.locator(".content-context-archive-link");
  await expect(sidebarLink).toHaveAttribute("href", "/mediassa/");
  await expect(sidebarLink).toContainText("Kaikki mediaosumat");
  await expect(jsOffPage.locator("a[href*='youtube.com']")).not.toHaveCount(0);
  const sidebarHref = await sidebarLink.getAttribute("href");
  await jsOffPage.goto(sidebarHref);
  await expect(jsOffPage).toHaveURL(/\/mediassa\/$/);
  await jsOffContext.close();

  await page.goto("/mediassa/2025/12/24/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/");
  await expect(page.locator("[data-detail-return-link]")).toBeHidden();

  await page.goto("/mediassa/2025/12/24/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/?returnTo=https://example.com/");
  await expect(page.locator("[data-detail-return-link]")).toBeHidden();
});

test("FI media archive decorates Lisätiedot links with /mediassa/ returnTo (bare returnTo is intentionally suppressed on detail)", async ({ page }) => {
  await page.goto("/mediassa/");
  const detailsLink = page.locator("[data-media-card-grid] .media-archive-card .media-card-actions a.btn-outline-secondary").first();
  await expect(detailsLink).toHaveAttribute("href", /^\/mediassa\/.+returnTo=/);

  const href = await detailsLink.getAttribute("href");
  await page.goto(href);
  // DETAIL-UX-ORIENT-01: hub-link no longer emitted; sidebar-archive-link
  // carries the always-visible orientation. Return-link suppression
  // logic (site-ui.js) unaffected: returnTo == fallback → still hidden.
  await expect(page.locator("[data-detail-hub-link]")).toHaveCount(0);
  await expect(page.locator("[data-detail-return-link]")).toBeHidden();
});

test("FI media detail reveals discovery return link when returnTo carries filter state", async ({ page }) => {
  // Simulate a discovery-return context where filters differ from the plain hub URL.
  await page.goto("/mediassa/2025/12/24/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/?returnTo=%2Fmediassa%2F%3Ftype%3Dvideo");
  // DETAIL-UX-ORIENT-01: hub-link removed on Media detail. Return-link
  // still reveals correctly via `detail-return-link.njk` partial.
  await expect(page.locator("[data-detail-hub-link]")).toHaveCount(0);
  await expect(page.locator("[data-detail-return-link]")).toBeVisible();
  await expect(page.locator("[data-detail-return-link]")).toHaveAttribute("href", /\/mediassa\/\?type=video/);
});

test("EN media archive Details link uses /en/media/ returnTo and FI detail accepts it", async ({ page }) => {
  await page.goto("/en/media/");
  const detailsLink = page.locator("a.btn-outline-secondary[href*='/mediassa/']").first();
  await expect(detailsLink).toHaveAttribute("href", /returnTo=%2Fen%2Fmedia%2F/);

  const href = await detailsLink.getAttribute("href");
  await page.goto(href);
  // DETAIL-UX-ORIENT-01: hub-link no longer emitted on Media detail;
  // sidebar `content-context-archive-link` carries the SSR
  // site-orientation. Return-link reveals with returnTo → /en/media/.
  await expect(page.locator("[data-detail-hub-link]")).toHaveCount(0);
  await expect(page.locator("[data-detail-return-link]")).toBeVisible();
  await expect(page.locator("[data-detail-return-link]")).toHaveAttribute("href", /^\/en\/media\/?$/);
});

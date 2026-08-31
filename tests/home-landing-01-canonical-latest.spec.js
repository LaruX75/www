/**
 * HOME-LANDING-01 — FI homepage "Uusin julkaisu" and "Uusin esitys"
 * role cards must route through canonical local detail pages, not raw
 * source URLs (DOI / Canva / YouTube / Slideshare).
 *
 * Contract:
 * - "Uusin julkaisu" link: /julkaisut/{id}/ (canonical publication
 *   detail landing from publicationDetailPages.items[].pageUrl).
 * - "Uusin esitys" link: /presentations/{slug}/ (canonical Presentation
 *   collection item's .url — the Eleventy permalink).
 * - Both are SSR: rendered without any JavaScript.
 * - No external target (canva.com / youtube.com / slideshare.net / doi.org)
 *   is used as the primary title link.
 *
 * Ref: docs/home-landing-01-canonical-latest-2026-08-30.md
 */
const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

const HOME = "/";

async function latestHref(page, kicker) {
  return page
    .locator(".home-role-latest")
    .filter({ hasText: kicker })
    .first()
    .locator("a.home-role-latest-link")
    .getAttribute("href");
}

test("FI homepage 'Uusin julkaisu' role card links to canonical /julkaisut/ detail", async ({ page }) => {
  await page.goto(HOME);
  const card = page.locator(".home-role-latest").filter({ hasText: "Uusin julkaisu" }).first();
  await expect(card).toHaveCount(1);
  const href = await card.locator("a.home-role-latest-link").getAttribute("href");
  expect(href).not.toBeNull();
  expect(href.startsWith("/julkaisut/")).toBe(true);
  expect(href.startsWith("http")).toBe(false);
  expect(href).not.toContain("doi.org");
  expect(href).not.toContain("researchportal");
  // Landing exists as a real built page.
  const response = await page.request.get(href);
  expect(response.ok(), `${href} must resolve`).toBeTruthy();
});

test("FI homepage 'Uusin esitys' role card links to canonical /presentations/ detail", async ({ page }) => {
  await page.goto(HOME);
  const card = page.locator(".home-role-latest").filter({ hasText: "Uusin esitys" }).first();
  await expect(card).toHaveCount(1);
  const href = await card.locator("a.home-role-latest-link").getAttribute("href");
  expect(href).not.toBeNull();
  expect(href.startsWith("/presentations/")).toBe(true);
  expect(href.startsWith("http")).toBe(false);
  expect(href).not.toContain("canva.com");
  expect(href).not.toContain("canva.link");
  expect(href).not.toContain("youtube.com");
  expect(href).not.toContain("slideshare.net");
  const response = await page.request.get(href);
  expect(response.ok(), `${href} must resolve`).toBeTruthy();
});

test("FI homepage latest-content links have no target=_blank (internal navigation)", async ({ page }) => {
  await page.goto(HOME);
  const cards = page.locator(".home-role-latest");
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const kicker = await cards.nth(i).locator(".home-role-latest-kicker").innerText();
    if (kicker.includes("Uusin julkaisu") || kicker.includes("Uusin esitys")) {
      const link = cards.nth(i).locator("a.home-role-latest-link");
      const target = await link.getAttribute("target");
      expect(target).toBeNull();
    }
  }
});

test("FI homepage role-card latest content renders without JavaScript (SSR proof)", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(HOME);
    const julkaisu = page.locator(".home-role-latest").filter({ hasText: "Uusin julkaisu" }).first();
    await expect(julkaisu).toHaveCount(1);
    const julkaisuHref = await julkaisu.locator("a.home-role-latest-link").getAttribute("href");
    expect(julkaisuHref.startsWith("/julkaisut/")).toBe(true);

    const esitys = page.locator(".home-role-latest").filter({ hasText: "Uusin esitys" }).first();
    await expect(esitys).toHaveCount(1);
    const esitysHref = await esitys.locator("a.home-role-latest-link").getAttribute("href");
    expect(esitysHref.startsWith("/presentations/")).toBe(true);
  } finally {
    await context.close();
  }
});

test("canonical publication detail page reached from homepage retains source/DOI CTA", async ({ page }) => {
  await page.goto(HOME);
  const href = await latestHref(page, "Uusin julkaisu");
  await page.goto(href);
  // Detail page should link to at least one external source (DOI / archive / handle) somewhere.
  const externalLinks = await page.locator('a[target="_blank"]').count();
  expect(externalLinks).toBeGreaterThan(0);
});

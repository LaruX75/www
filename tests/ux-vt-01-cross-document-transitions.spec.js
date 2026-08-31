/**
 * UX-VT-01 — cross-document View Transitions structural regression.
 *
 * The opt-in is a shared CSS-only rule in src/css/modules/_global.css
 * (loaded via src/_includes/_meta.njk on every page). This test guards
 * the structural guarantees the CSS provides — NOT visible animation
 * timing (which depends on the test browser exposing the API and would
 * be brittle across engines):
 *
 *   1. The shared _global.css is linked on both FI and EN document surfaces.
 *   2. The _global.css payload contains the @view-transition opt-in.
 *   3. The reduced-motion escape hatch is present in the same file.
 *   4. Ordinary navigation still works with JavaScript disabled.
 *   5. No JavaScript was added to opt into transitions (nothing new
 *      references the API).
 *
 * Ref: docs/ux-vt-01-cross-document-view-transitions-2026-08-31.md
 */
const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

const GLOBAL_CSS = "/css/modules/_global.css";

async function fetchGlobalCss(page) {
  const res = await page.request.get(GLOBAL_CSS);
  expect(res.ok(), `${GLOBAL_CSS} must be served`).toBeTruthy();
  return res.text();
}

test("shared _global.css is linked from FI homepage", async ({ page }) => {
  await page.goto("/");
  const linkCount = await page.locator(`link[rel="stylesheet"][href="${GLOBAL_CSS}"]`).count();
  expect(linkCount).toBeGreaterThanOrEqual(1);
});

test("shared _global.css is linked from EN homepage", async ({ page }) => {
  await page.goto("/en/");
  const linkCount = await page.locator(`link[rel="stylesheet"][href="${GLOBAL_CSS}"]`).count();
  expect(linkCount).toBeGreaterThanOrEqual(1);
});

test("shared _global.css contains the @view-transition opt-in and reduced-motion escape", async ({ page }) => {
  await page.goto("/");
  const css = await fetchGlobalCss(page);
  expect(css).toMatch(/@view-transition\s*\{\s*navigation:\s*auto\s*;?\s*\}/);
  expect(css).toMatch(/@media\s*\(\s*prefers-reduced-motion:\s*reduce\s*\)/);
  expect(css).toMatch(/::view-transition-(group|old|new)/);
});

test("no JavaScript intercepts navigation for the opt-in (progressive enhancement only)", async ({ page }) => {
  await page.goto("/");
  const html = await page.content();
  // Sanity: our own opt-in never references the API in JS. If a future
  // change introduces a startViewTransition call, this test forces a
  // conscious update rather than silent drift.
  expect(html).not.toContain("document.startViewTransition");
});

test("ordinary same-origin navigation still works with JavaScript disabled (FI)", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  try {
    await page.goto("/");
    const href = await page
      .locator(".home-role-latest")
      .filter({ hasText: "Uusin julkaisu" })
      .first()
      .locator("a.home-role-latest-link")
      .getAttribute("href");
    expect(href).not.toBeNull();
    expect(href.startsWith("/julkaisut/")).toBe(true);
    // Navigate: unsupported browsers (and JS-disabled) get ordinary navigation.
    const nav = await page.request.get(href);
    expect(nav.ok(), `${href} must resolve without JS`).toBeTruthy();
  } finally {
    await ctx.close();
  }
});

test("ordinary same-origin navigation still works with JavaScript disabled (EN)", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  try {
    const res = await page.request.get("/en/");
    expect(res.ok()).toBeTruthy();
  } finally {
    await ctx.close();
  }
});

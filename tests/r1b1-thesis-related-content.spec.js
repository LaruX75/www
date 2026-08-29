/**
 * R1-B1 — Thesis detail related-content surface convergence.
 *
 * Asserts the shared content-context-sidebar renders on Thesis
 * detail pages after PR merging R1-B1. Reuses the existing
 * relatedContent Eleventy filter unchanged (per R1-ADR1); the
 * sidebar path is SSR-only and must produce related items without
 * any client-side JS card construction or runtime JSON fetch.
 *
 * Ref: docs/r1b1-thesis-related-content-surface-convergence-2026-08-29.md
 */
const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

const FI_RICH_THESIS = "/opinnaytteet/62699/"; // Riikonen 2026, categories + keywords + contexts
const EN_THESIS = "/opinnaytteet/48497/";      // known English thesis on main

test("FI thesis detail renders shared related-content sidebar with canonical destinations", async ({ page }) => {
  await page.goto(FI_RICH_THESIS);

  // Shared sidebar is present in the thesis aside.
  const sidebar = page.locator(".content-context-sidebar");
  await expect(sidebar).toHaveCount(1);

  // Related-content list surfaces at least one candidate.
  const relatedList = sidebar.locator(".content-context-related").first();
  await expect(relatedList).toBeVisible();
  const relatedLinks = relatedList.locator("li a");
  const relatedCount = await relatedLinks.count();
  expect(relatedCount).toBeGreaterThan(0);
  expect(relatedCount).toBeLessThanOrEqual(4);

  // No self-reference: none of the related links points back at the current thesis.
  const hrefs = await relatedLinks.evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href") || ""));
  for (const href of hrefs) {
    expect(href).not.toBe(FI_RICH_THESIS);
  }

  // Every related link resolves to a canonical destination: either a local
  // /opinnaytteet/ / /julkaisut/ / /mediassa/ / /YYYY/ path, or an OuluREPO
  // handle URL for cross-thesis picks. Never a semanticRelated.json-only URL.
  for (const href of hrefs) {
    const canonical =
      href.startsWith("/") ||
      href.startsWith("https://oulurepo.oulu.fi/handle/");
    expect(canonical, `unexpected related href: ${href}`).toBe(true);
  }
});

test("Thesis related-content sidebar is present in server-rendered HTML (no JS required)", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(FI_RICH_THESIS);
    // The sidebar must render at build time; the related list must exist
    // without any client-side JS having to construct it.
    const sidebar = page.locator(".content-context-sidebar");
    await expect(sidebar).toHaveCount(1);
    const relatedList = sidebar.locator(".content-context-related").first();
    await expect(relatedList).toHaveCount(1);
    const noJsHrefs = await sidebar
      .locator(".content-context-related li a")
      .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href") || ""));
    expect(noJsHrefs.length).toBeGreaterThan(0);
  } finally {
    await context.close();
  }
});

test("EN thesis detail also renders the shared related-content sidebar", async ({ page }) => {
  await page.goto(EN_THESIS);
  const sidebar = page.locator(".content-context-sidebar");
  await expect(sidebar).toHaveCount(1);
  // The shared include switches its own labels on locale via <html lang>;
  // do not duplicate translations here.
});

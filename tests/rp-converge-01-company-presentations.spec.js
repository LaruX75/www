/**
 * RP-CONVERGE-01 — Company / Kouluttaja page presentations strip.
 *
 * Asserts the FI /kouluttaja/ page renders a canonical
 * "Viimeisimpiä koulutusesityksiä" strip driven by the canonical
 * presentationContextGroups projection (id="veso-taydennyskoulutus"),
 * with local canonical destinations. Also asserts EN /en/company/ has
 * no equivalent dynamic strip (intentional asymmetry — see the
 * implementation record for justification).
 *
 * Ref: docs/rp-converge-01-company-presentations-convergence-2026-08-30.md
 */
const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

const FI_COMPANY = "/kouluttaja/";
const EN_COMPANY = "/en/company/";

test("FI /kouluttaja/ renders the canonical Viimeisimpiä koulutusesityksiä strip", async ({ page }) => {
  await page.goto(FI_COMPANY);

  const section = page.locator("section#viimeisimmat-esitykset");
  await expect(section).toHaveCount(1);

  await expect(section.locator(".larux-eyebrow")).toContainText("Viimeisimpiä koulutusesityksiä");

  const cards = section.locator("article.larux-example-card");
  await expect(cards).toHaveCount(3);

  const hrefs = await section
    .locator("article.larux-example-card a.larux-inline-link")
    .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href") || ""));
  expect(hrefs).toHaveLength(3);
  for (const href of hrefs) {
    expect(href.startsWith("/presentations/")).toBe(true);
    expect(href).toContain("returnTo=%2Fkouluttaja%2F");
  }

  const allTalksLink = section.locator('a[href="/esitykset/"]');
  await expect(allTalksLink).toBeVisible();
});

test("FI /kouluttaja/ presentations strip renders without JS (SSR proof)", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(FI_COMPANY);
    const section = page.locator("section#viimeisimmat-esitykset");
    await expect(section).toHaveCount(1);
    const cards = section.locator("article.larux-example-card");
    await expect(cards).toHaveCount(3);
  } finally {
    await context.close();
  }
});

test("EN /en/company/ intentionally has no dynamic Viimeisimpiä-koulutusesityksiä strip", async ({ page }) => {
  await page.goto(EN_COMPANY);
  const section = page.locator("section#viimeisimmat-esitykset");
  await expect(section).toHaveCount(0);
});

test("no template on the built site references the deleted related-presentations partial", async ({ page }) => {
  await page.goto(FI_COMPANY);
  const html = await page.content();
  expect(html).not.toContain("related-presentations-list");
  expect(html).not.toContain("related-presentations-item");
});

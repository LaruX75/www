/**
 * RP-CONVERGE-01 → RP-CONVERGE-01B — company Presentations strip on
 * /kouluttaja/ must project ONLY canonical Presentation MDs whose RAW
 * frontmatter explicitly declares contexts: - business. Inference-only
 * business items (from inferContexts()) must not be eligible.
 *
 * Post RP-CONVERGE-01B: the selection reads `declaredContexts` on each
 * item of `collections.presentations` (populated by the existing
 * canonical Presentation pipeline through presentationSources.js →
 * presentationsPage.js → presentations.11tydata.js). No parallel
 * Presentation reader/parser/URL resolver is involved. This test
 * remains a semantic-outcome guard against the built HTML and is
 * independent of which projection layer supplies the items — it
 * therefore also guards against reintroducing a parallel projection
 * whose semantics silently diverge from the canonical pipeline.
 *
 * Ref: docs/rp-converge-01-company-presentations-convergence-2026-08-30.md
 *      §"RP-CONVERGE-01B correction (2026-08-30)"
 */
const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

const FI_COMPANY = "/kouluttaja/";

// Snapshot of the 12 canonical Presentation MDs that carry explicit
// `contexts: - business` on main after PRES-CONTEXT1 (PR #170 merge 62327af0).
// The strip's rendered items must be a strict subset of these base-names.
// Extending the set requires adding explicit `contexts: - business` to a
// canonical MD (a canonical-metadata edit), never a code / regex change.
const EXPLICIT_BUSINESS_BASENAMES = new Set([
  "kohti-kriittist-teko-lylukutaitoa-2026-finnoschool",
  "riihim-ki-veso-2026",
  "kempele-veso-2026",
  "konen-k-vibe-robotiikka-riihim-ki-robokampus-2026",
  "opettaja-teko-lyn-ja-lytt-myyden-turbulenssissa-tampere-2025",
  "kokkola-2025-teko-ly-opettajan-yst-v-vai-viho",
  "digierko2024-risteilyesitys",
  "pori-kerava-millaisia-teko-lytaitoja-peruskoulussa-tulisi-opettaa-2020-luvulla",
  "tekoaly-opetuskaytto-avi-webinaari-2024",
  "monilukutaito-on-opettajan-supervoima-teko-lylukutaito-luento",
  "simo-veso-2024",
  "ss-osaava-veso-tieto-ja-viestintatekniikka-pedagogisena-tyovalineena-raahe-2015"
]);

// Basenames documented as inference-only business (REVIEW / not tagged in
// PRES-CONTEXT1). These match inferContexts() line 189-199 patterns
// (e.g., "workshop") and therefore resolve to `business` when
// resolveContexts() is used, but they are NOT in EXPLICIT_BUSINESS_BASENAMES.
// The strip must NEVER show these items — this proves the strip is not
// silently falling back to resolved (inferred) contexts.
const INFERENCE_ONLY_BUSINESS_BASENAMES = new Set([
  "ss-designing-and-supporting-use-of-emergent-technology-in-teacher-education-case-ic",
  "ss-lito2018-workshop-arviointi-suurilla-verkkokursseilla"
]);

async function stripBasenames(page) {
  const hrefs = await page
    .locator("section#viimeisimmat-esitykset article.larux-example-card a.larux-inline-link")
    .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href") || ""));
  return hrefs.map((h) => {
    const m = h.match(/^\/presentations\/([^/]+)\//);
    return m ? m[1] : "";
  });
}

test("FI /kouluttaja/ renders exactly 3 canonical business-tagged Presentation cards", async ({ page }) => {
  await page.goto(FI_COMPANY);
  const section = page.locator("section#viimeisimmat-esitykset");
  await expect(section).toHaveCount(1);
  const cards = section.locator("article.larux-example-card");
  await expect(cards).toHaveCount(3);
  await expect(section.locator(".larux-eyebrow")).toContainText("Viimeisimpiä koulutusesityksiä");
  const allTalksLink = section.locator('a[href="/esitykset/"]');
  await expect(allTalksLink).toBeVisible();
});

test("every rendered href is a canonical local /presentations/ landing with O1 returnTo decoration", async ({ page }) => {
  await page.goto(FI_COMPANY);
  const hrefs = await page
    .locator("section#viimeisimmat-esitykset article.larux-example-card a.larux-inline-link")
    .evaluateAll((anchors) => anchors.map((a) => a.getAttribute("href") || ""));
  expect(hrefs).toHaveLength(3);
  for (const href of hrefs) {
    expect(href.startsWith("/presentations/")).toBe(true);
    expect(href).toContain("returnTo=%2Fkouluttaja%2F");
    expect(href.startsWith("http")).toBe(false);
  }
});

test("strip renders without JS (SSR proof)", async ({ browser }) => {
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

test("INFERENCE GUARD: rendered items are all explicit-business, never inference-only", async ({ page }) => {
  await page.goto(FI_COMPANY);
  const basenames = await stripBasenames(page);
  expect(basenames).toHaveLength(3);
  for (const b of basenames) {
    expect(
      EXPLICIT_BUSINESS_BASENAMES.has(b),
      `strip item "${b}" must be a canonical MD with explicit contexts: - business`
    ).toBe(true);
    expect(
      INFERENCE_ONLY_BUSINESS_BASENAMES.has(b),
      `strip item "${b}" must NOT be an inference-only business item (regressing to resolved contexts)`
    ).toBe(false);
  }
});

test("no built page references the deleted related-presentations partial classes", async ({ page }) => {
  await page.goto(FI_COMPANY);
  const html = await page.content();
  expect(html).not.toContain("related-presentations-list");
  expect(html).not.toContain("related-presentations-item");
});

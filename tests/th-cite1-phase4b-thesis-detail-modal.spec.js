/**
 * TH-CITE1 Phase 4B — thesis detail page citation/export modal.
 *
 * Verifies the restored citation UI on canonical thesis detail
 * pages. The Phase 3 compact SSR archive has NO citation triggers;
 * only the detail page carries the "Vie viite" / "Export citation"
 * modal, and it renders bibliographic text through the shared
 * publicationCitation renderer (Phase 4A). Legacy browser composers
 * remain in the file but are unreachable for any Phase 4B trigger.
 */
const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

async function selectFormat(page, value) {
  await page.locator("#thesisCitationFormatSelect").selectOption(value);
}

async function openThesisCitationModal(page, url) {
  await page.goto(url);
  const trigger = page.locator("[data-thesis-citation-trigger]").first();
  await expect(trigger).toBeVisible();
  await trigger.click();
  const modal = page.locator("#thesisCitationModal");
  await expect(modal).toHaveClass(/show/, { timeout: 5000 });
  return modal;
}

test("FI thesis detail: trigger renders, opens modal, shared-renderer APA text visible", async ({ page }) => {
  const modal = await openThesisCitationModal(page, "/opinnaytteet/62699/");
  await expect(modal.locator("#thesisCitationModalLabel")).toHaveText(/Vie lähdeviite/);
  const output = page.locator("#thesisCitationOutput");
  await expect(output).not.toHaveValue("");
  const apa = await output.inputValue();
  // Phase 2 bracket format, FI display map preserved on FI detail
  // page. Real thesis is Riikonen 2026 6-luokkalaisten…
  expect(apa).toMatch(/Riikonen, H\. \(2026\)\. 6-luokkalaisten.*\[Pro gradu -tutkielma, Oulun yliopisto\]\. https:\/\/oulurepo\.oulu\.fi\/handle\//);
});

test("FI thesis detail: format switch cycles APA → MLA → Chicago → BibTeX and each preview updates", async ({ page }) => {
  await openThesisCitationModal(page, "/opinnaytteet/62699/");
  const output = page.locator("#thesisCitationOutput");
  await selectFormat(page, "mla");
  await expect(output).toHaveValue(/^Riikonen, Hanni\. "6-luokkalaisten.*" Pro gradu -tutkielma, Oulun yliopisto, 2026\./);
  await selectFormat(page, "chicago");
  await expect(output).toHaveValue(/^Riikonen, Hanni\. 2026\. "6-luokkalaisten.*" Pro gradu -tutkielma, Oulun yliopisto\./);
  await selectFormat(page, "bibtex");
  await expect(output).toHaveValue(/^@mastersthesis\{riikonen20266luokkalaisten,/);
  await selectFormat(page, "apa");
  await expect(output).toHaveValue(/\[Pro gradu -tutkielma, Oulun yliopisto\]\./);
});

test("FI thesis detail: Copy button copies preview to clipboard", async ({ page, browserName, context }) => {
  test.skip(browserName === "webkit", "clipboard permission model differs on webkit");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openThesisCitationModal(page, "/opinnaytteet/62699/");
  const preview = await page.locator("#thesisCitationOutput").inputValue();
  await page.locator("#thesisCitationCopyBtn").click();
  const clipped = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipped).toBe(preview);
});

test("FI thesis detail: Download button emits a .bib filename for BibTeX format", async ({ page }) => {
  await openThesisCitationModal(page, "/opinnaytteet/62699/");
  await selectFormat(page, "bibtex");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#thesisCitationDownloadBtn").click()
  ]);
  expect(download.suggestedFilename()).toMatch(/\.bib$/);
});

test("FI thesis detail: Zotero button downloads a .ris file", async ({ page }) => {
  await openThesisCitationModal(page, "/opinnaytteet/62699/");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#thesisCitationZoteroBtn").click()
  ]);
  expect(download.suggestedFilename()).toMatch(/-zotero\.ris$/);
});

test("FI thesis detail: Mendeley button downloads a .ris file", async ({ page }) => {
  await openThesisCitationModal(page, "/opinnaytteet/62699/");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.locator("#thesisCitationMendeleyBtn").click()
  ]);
  expect(download.suggestedFilename()).toMatch(/-mendeley\.ris$/);
});

test("EN thesis detail: display map translates genre + publisher via shared renderer", async ({ page }) => {
  // Thesis 18096 is an EN-source thesis (thesisDetail.lang="en"),
  // so the detail template uses lang="en" for the citation. Shared
  // renderer applies the Phase 2 display map on lang="en".
  await openThesisCitationModal(page, "/opinnaytteet/18096/");
  const modal = page.locator("#thesisCitationModal");
  await expect(modal.locator("#thesisCitationModalLabel")).toHaveText(/Export citation/);
  const output = page.locator("#thesisCitationOutput");
  await expect(output).toHaveValue(/\[Master's thesis, University of Oulu\]\./);
  await selectFormat(page, "mla");
  await expect(output).toHaveValue(/Master's thesis, University of Oulu, 2021\./);
  await selectFormat(page, "bibtex");
  await expect(output).toHaveValue(/^@mastersthesis\{mattila2021professional,[\s\S]*school = \{University of Oulu\}/);
});

test("Modal has accessible name, opens via keyboard, closes via X button returning focus to trigger", async ({ page }) => {
  await page.goto("/opinnaytteet/62699/");
  const trigger = page.locator("[data-thesis-citation-trigger]").first();
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await trigger.press("Enter");
  const modal = page.locator("#thesisCitationModal");
  await expect(modal).toHaveClass(/show/, { timeout: 5000 });
  await expect(modal).toHaveAttribute("aria-labelledby", "thesisCitationModalLabel");
  await expect(modal.locator("#thesisCitationModalLabel")).toBeVisible();
  // Bootstrap 5 Modal has aria-hidden managed automatically; the
  // labelling attribute confirms accessible-name wiring.
  await modal.locator(".btn-close").click();
  await expect(modal).not.toHaveClass(/show/, { timeout: 5000 });
  await expect(trigger).toBeFocused();
});

test("Phase 3 archive regression: /opinnaytteet/ has no citation trigger and no thesis-hub-actions.js", async ({ page }) => {
  const response = await page.request.get("/opinnaytteet/");
  const html = await response.text();
  expect(html).not.toMatch(/data-thesis-citation-trigger/);
  expect(html).not.toMatch(/thesisCitationModal/);
  expect(html).not.toMatch(/thesisAbstractModal/);
  expect(html).not.toMatch(/\/js\/thesis-hub-actions\.js/);
});

test("Phase 3 archive regression: /en/theses/ has no citation trigger and no thesis-hub-actions.js", async ({ page }) => {
  const response = await page.request.get("/en/theses/");
  const html = await response.text();
  expect(html).not.toMatch(/data-thesis-citation-trigger/);
  expect(html).not.toMatch(/thesisCitationModal/);
  expect(html).not.toMatch(/thesisAbstractModal/);
  expect(html).not.toMatch(/\/js\/thesis-hub-actions\.js/);
});

test("Phase 3 archive regression: still exactly 30 thesis rows on landing", async ({ page }) => {
  const response = await page.request.get("/opinnaytteet/");
  const html = await response.text();
  const matches = html.match(/thesis-archive-citation/g) || [];
  expect(matches.length).toBe(30);
});

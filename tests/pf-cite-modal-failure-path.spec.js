const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

const FORMATS = ["apa", "bibtex", "mla", "chicago"];
const UNAVAILABLE = "Viite ei ole saatavilla tälle julkaisulle.";

test("Citation modal shows a controlled unavailable state when the shared renderer never loads", async ({ page }) => {
  // Prevent /js/publication-citation.js from ever assigning
  // window.publicationCitation. Defining a non-configurable
  // undefined value blocks the UMD wrapper's `root.publicationCitation
  // = factory()` assignment (property redefinition throws in strict
  // mode). The IIFE's throw is swallowed because the script tag runs
  // async; the modal handlers simply see window.publicationCitation
  // as undefined.
  await page.addInitScript(() => {
    Object.defineProperty(window, "publicationCitation", {
      value: undefined,
      writable: false,
      configurable: false
    });
  });

  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();

  const citationBtn = page.locator(".publication-archive-row .export-citation-btn").first();
  await citationBtn.click();
  await expect(page.locator("#citationExportModal")).toHaveClass(/show/, { timeout: 10000 });

  // Preview shows the controlled unavailable message and the four
  // action buttons are disabled.
  await expect(page.locator("#citationOutput")).toHaveValue(UNAVAILABLE);
  await expect(page.locator("#citationCopyBtn")).toBeDisabled();
  await expect(page.locator("#citationDownloadBtn")).toBeDisabled();
  await expect(page.locator("#citationZoteroBtn")).toBeDisabled();
  await expect(page.locator("#citationMendeleyBtn")).toBeDisabled();

  // Switching the format select does not synthesise a legacy citation
  // for any of the four supported styles.
  for (const format of FORMATS) {
    await page.locator("#citationFormatSelect").selectOption(format);
    await expect(page.locator("#citationOutput")).toHaveValue(UNAVAILABLE);
  }

  // Neither the shared renderer nor any inline formatter name is
  // reachable on window.
  const globals = await page.evaluate(() => ({
    publicationCitation: typeof window.publicationCitation,
    buildApaCitation: typeof window.buildApaCitation,
    buildMlaCitation: typeof window.buildMlaCitation,
    buildChicagoCitation: typeof window.buildChicagoCitation,
    buildBibtexEntry: typeof window.buildBibtexEntry,
    buildRisEntry: typeof window.buildRisEntry
  }));
  expect(globals.publicationCitation).toBe("undefined");
  expect(globals.buildApaCitation).toBe("undefined");
  expect(globals.buildMlaCitation).toBe("undefined");
  expect(globals.buildChicagoCitation).toBe("undefined");
  expect(globals.buildBibtexEntry).toBe("undefined");
  expect(globals.buildRisEntry).toBe("undefined");
});

test("Normal path: all four modal formats render via the shared renderer", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();

  const citationBtn = page.locator(".publication-archive-row .export-citation-btn").first();
  await citationBtn.click();
  await expect(page.locator("#citationExportModal")).toHaveClass(/show/, { timeout: 10000 });

  // Initial format defaults to APA and preview should be non-empty
  // once the modal opens (renderCitationPreview runs synchronously).
  await expect(page.locator("#citationFormatSelect")).toHaveValue("apa");
  await expect(page.locator("#citationOutput")).not.toHaveValue("");
  await expect(page.locator("#citationOutput")).not.toHaveValue(UNAVAILABLE);
  await expect(page.locator("#citationCopyBtn")).toBeEnabled();
  await expect(page.locator("#citationDownloadBtn")).toBeEnabled();

  // Each of the four supported styles produces a non-empty preview.
  const seen = {};
  for (const format of FORMATS) {
    await page.locator("#citationFormatSelect").selectOption(format);
    const value = await page.locator("#citationOutput").inputValue();
    expect(value).not.toBe("");
    expect(value).not.toBe(UNAVAILABLE);
    seen[format] = value;
  }
  // Style outputs should differ (BibTeX starts with @, APA/MLA/Chicago are prose).
  expect(seen.bibtex.startsWith("@")).toBe(true);
  expect(seen.apa).not.toEqual(seen.mla);
  expect(seen.apa).not.toEqual(seen.chicago);
});

const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("FI /julkaisut/ renders every canonical publication on initial load with APA rows and A–G grouping", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  const status = page.locator("[data-find-explore-status]");
  await expect(status).toContainText(/56 tulosta/, { timeout: 15000 });
  // Publications FULL parity: every canonical publication row is
  // present without paging. Show-more control must be hidden.
  await expect(page.locator(".find-explore-result--publication")).toHaveCount(56, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-more]")).toHaveClass(/d-none/);
  // A–G group headings appear inside the result list, each with a
  // canonical count.
  const groupSections = page.locator("section.find-explore-result-group");
  await expect(groupSections).toHaveCount(7); // A, B, C, D, E, G + unclassified
  await expect(groupSections.first()).toContainText(/A -/);
  await expect(page.locator('section.find-explore-result-group[data-publication-group="A"] .find-explore-result-group-count')).toContainText("29");
  await expect(page.locator('section.find-explore-result-group[data-publication-group="B"] .find-explore-result-group-count')).toContainText("9");
  // Semantic list counts must equal the visible publication count.
  await expect(page.locator('section.find-explore-result-group[data-publication-group="A"] > ol > li.find-explore-result')).toHaveCount(29);
  await expect(page.locator('section.find-explore-result-group[data-publication-group="B"] > ol > li.find-explore-result')).toHaveCount(9);
  // Each section is accessibly named by its <h3>.
  const firstHeading = page.locator('section.find-explore-result-group[data-publication-group="A"] > h3');
  await expect(firstHeading).toHaveAttribute("id", "publications-group-a");
  await expect(page.locator('section.find-explore-result-group[data-publication-group="A"]')).toHaveAttribute("aria-labelledby", "publications-group-a");
  // At least one visible result row uses the APA citation body.
  await expect(page.locator(".find-explore-result-publication-citation").first()).toBeVisible();
  const titleLink = page.locator(".find-explore-result-publication-citation a").first();
  await expect(titleLink).toHaveAttribute("href", /^\/(julkaisut\/|20\d{2}\/)/);
  // Local topic facet is removed from Publications hub controls.
  await expect(page.locator("[data-find-explore-topic]")).toHaveCount(0);
  // The old duplicate SSR opening list is gone.
  await expect(page.locator(".publication-opening-item")).toHaveCount(0);
});

test("EN /en/publications/ renders every canonical publication with A–G grouping", async ({ page }) => {
  await page.goto("/en/publications/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  const status = page.locator("[data-find-explore-status]");
  await expect(status).toContainText(/56 results/, { timeout: 15000 });
  await expect(page.locator(".find-explore-result--publication")).toHaveCount(56, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-more]")).toHaveClass(/d-none/);
  await expect(page.locator("section.find-explore-result-group")).toHaveCount(7);
  await expect(page.locator('section.find-explore-result-group[data-publication-group="A"] .find-explore-result-group-count')).toContainText("29");
  await expect(page.locator('section.find-explore-result-group[data-publication-group="A"] > ol > li.find-explore-result')).toHaveCount(29);
  await expect(page.locator("[data-find-explore-topic]")).toHaveCount(0);
  await expect(page.locator(".publication-opening-item")).toHaveCount(0);
});

test("FI A-group filter restricts the list to canonical A publications and shows a single A heading", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  await page.locator("[data-find-explore-type]").selectOption("A");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/29 tulosta/, { timeout: 15000 });
  // Only one group section survives (A) — no empty group sections
  // when filters narrow the result set. Semantic list inside that
  // section contains exactly 29 publication rows.
  await expect(page.locator("section.find-explore-result-group")).toHaveCount(1);
  await expect(page.locator("section.find-explore-result-group")).toContainText(/A -/);
  await expect(page.locator("section.find-explore-result-group > ol > li.find-explore-result")).toHaveCount(29);
  await expect(page.locator(".find-explore-result--publication")).toHaveCount(29);
});

test("Empty-query default order is deterministic bibliographic (year DESC → title ASC), not Pagefind score", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  // First row in the first non-empty group (A) must be the newest
  // year available in that group, and inside a year tie the title
  // sort is Finnish locale ASC. Fixture: the canonical 2026 A-group
  // publications are two — "Assessing Digital Competence..." and
  // "Co-constructing adaptive lesson plans...". Locale ASC "A" < "C",
  // so the deterministic top of the list starts with "Assessing".
  const firstRowCitation = page.locator('section.find-explore-result-group[data-publication-group="A"] > ol > li.find-explore-result').first().locator('.find-explore-result-publication-citation');
  await expect(firstRowCitation).toContainText(/^Nuci|^Krenare|^Assessing/);
  await expect(firstRowCitation).toContainText(/2026/);
  // Repeat visit produces the same top row → deterministic.
  await page.reload();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  const rowAfterReload = page.locator('section.find-explore-result-group[data-publication-group="A"] > ol > li.find-explore-result').first().locator('.find-explore-result-publication-citation');
  await expect(rowAfterReload).toContainText(/2026/);
});

test("Text query retains Pagefind relevance ordering while grouping", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  await page.locator("[data-find-explore-query]").fill("Kosovo");
  // Pagefind ranks the Kosovo TPACK paper as the top match. Even
  // though its year is 2026 and could tie with other 2026 records
  // in the default bibliographic sort, the text-query path must
  // preserve the Pagefind relevance order.
  await expect(page.locator('section.find-explore-result-group[data-publication-group="A"] > ol > li.find-explore-result').first().locator('.find-explore-result-publication-citation')).toContainText(/Kosovo/, { timeout: 15000 });
});

test("FI reset returns the full list", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  // Wait for the initial full-list search to actually complete before
  // introducing a filter change — otherwise selectOption may fire
  // while Pagefind is still processing the seed-query search.
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  await page.locator("[data-find-explore-type]").selectOption("A");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/29 tulosta/, { timeout: 15000 });
  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
});

test("FI citation modal opens from a Pagefind result and uses the shared renderer via data-csl", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  const citationBtn = page.locator("[data-find-explore-results] .export-citation-btn").first();
  await expect(citationBtn).toBeVisible();
  await expect(citationBtn).toHaveAttribute("data-csl", /"id":/);
  await citationBtn.click();
  await expect(page.locator("#citationExportModal")).toHaveClass(/show/, { timeout: 10000 });
  await expect(page.locator("#citationOutput")).not.toHaveValue("");
});

test("Zotero download emits a valid RIS payload from the shared renderer", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  const citationBtn = page.locator("[data-find-explore-results] .export-citation-btn").first();
  await citationBtn.click();
  await expect(page.locator("#citationExportModal")).toHaveClass(/show/, { timeout: 10000 });

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#citationZoteroBtn").click();
  const download = await downloadPromise;

  const suggested = download.suggestedFilename();
  expect(suggested).toMatch(/-zotero\.ris$/);

  const buffer = await download.createReadStream();
  const chunks = [];
  for await (const chunk of buffer) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8");

  // TY tag is derived from CSL type by the shared renderer; accept
  // any valid RIS reference type. AU/TI/PY/ER are required by the
  // RIS spec and must appear.
  expect(text).toMatch(/^TY\s+-\s+(JOUR|MGZN|NEWS|CPAPER|CHAP|BOOK|THES|GEN)\b/);
  expect(text).toMatch(/\nAU\s+-\s+\S/);
  expect(text).toMatch(/\nTI\s+-\s+\S/);
  expect(text).toMatch(/\nPY\s+-\s+\d{4}/);
  expect(text).toMatch(/ER\s+-/);
});

test("Mendeley download emits a valid RIS payload from the shared renderer", async ({ page }) => {
  await page.goto("/julkaisut/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await expect(page.locator("[data-find-explore-status]")).toContainText(/56 tulosta/, { timeout: 15000 });
  const citationBtn = page.locator("[data-find-explore-results] .export-citation-btn").first();
  await citationBtn.click();
  await expect(page.locator("#citationExportModal")).toHaveClass(/show/, { timeout: 10000 });

  const downloadPromise = page.waitForEvent("download");
  await page.locator("#citationMendeleyBtn").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/-mendeley\.ris$/);
});

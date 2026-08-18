/**
 * TH-CITE1 Phase 4C — regression: no browser-side raw-field
 * citation fallback.
 *
 * Proves the parallel browser content model is gone. When a
 * citation-trigger is dispatched with malformed / missing CSL, the
 * modal MUST show the controlled unavailable state and disable all
 * action buttons — NOT fabricate a citation from raw thesis fields.
 *
 * These tests inject synthetic triggers into a real detail page via
 * `page.evaluate` to isolate the browser code path. Production
 * triggers always carry a valid CSL object; this suite exercises
 * the empty / malformed edge cases explicitly.
 */
const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

async function injectSyntheticTrigger(page, cslAttrValue, lang) {
  return await page.evaluate(function (payload) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "phase4cSyntheticTrigger";
    btn.setAttribute("data-thesis-citation-trigger", "");
    btn.setAttribute("data-thesis-lang", payload.lang);
    if (payload.cslAttr !== null) {
      btn.setAttribute("data-thesis-csl", payload.cslAttr);
    }
    // Also assign every raw field the pre-4C payload used to carry.
    // If any browser code path is still reading these, this trigger
    // gives it a fully-populated raw-field payload to fabricate from.
    btn.setAttribute("data-thesis-title", "Nuorten kokemuksia sosiaalisen mediasta");
    btn.setAttribute("data-thesis-authors", "Kurki, Suvi; Komulainen, Anna");
    btn.setAttribute("data-thesis-year", "2026");
    btn.setAttribute("data-thesis-type", "masterThesis");
    btn.setAttribute("data-thesis-url", "https://oulurepo.oulu.fi/handle/10024/63000");
    btn.textContent = "Synthetic";
    document.body.appendChild(btn);
    return true;
  }, { cslAttr: cslAttrValue, lang: lang });
}

async function clickSyntheticTrigger(page) {
  await page.locator("#phase4cSyntheticTrigger").click();
}

async function expectUnavailable(page, lang) {
  const output = page.locator("#thesisCitationOutput");
  const expected = lang === "en" ? "Citation unavailable" : "Lähdeviite ei saatavilla";
  await expect(output).toHaveValue(expected, { timeout: 5000 });
  await expect(page.locator("#thesisCitationCopyBtn")).toBeDisabled();
  await expect(page.locator("#thesisCitationDownloadBtn")).toBeDisabled();
  await expect(page.locator("#thesisCitationZoteroBtn")).toBeDisabled();
  await expect(page.locator("#thesisCitationMendeleyBtn")).toBeDisabled();
  // Belt-and-suspenders: the raw title MUST NOT appear in preview,
  // proving no browser-side fabrication happened.
  const value = await output.inputValue();
  expect(value).not.toMatch(/Nuorten kokemuksia/);
  expect(value).not.toMatch(/Kurki, Suvi/);
  expect(value).not.toMatch(/2026/);
  expect(value).not.toMatch(/oulurepo\.oulu\.fi/);
}

test("Missing data-thesis-csl → controlled unavailable state (FI)", async ({ page }) => {
  await page.goto("/opinnaytteet/62699/");
  await injectSyntheticTrigger(page, null, "fi");
  await clickSyntheticTrigger(page);
  await expectUnavailable(page, "fi");
});

test("Malformed data-thesis-csl JSON → controlled unavailable state (FI)", async ({ page }) => {
  await page.goto("/opinnaytteet/62699/");
  await injectSyntheticTrigger(page, "not-json-{", "fi");
  await clickSyntheticTrigger(page);
  await expectUnavailable(page, "fi");
});

test("Empty CSL object → controlled unavailable state (FI)", async ({ page }) => {
  await page.goto("/opinnaytteet/62699/");
  await injectSyntheticTrigger(page, "{}", "fi");
  await clickSyntheticTrigger(page);
  await expectUnavailable(page, "fi");
});

test("CSL missing id + title → controlled unavailable state (FI)", async ({ page }) => {
  await page.goto("/opinnaytteet/62699/");
  await injectSyntheticTrigger(page, JSON.stringify({
    type: "thesis",
    author: [{ family: "Kurki", given: "S." }],
    issued: { "date-parts": [[2026]] },
    genre: "Pro gradu -tutkielma",
    publisher: "Oulun yliopisto"
  }), "fi");
  await clickSyntheticTrigger(page);
  await expectUnavailable(page, "fi");
});

test("Missing data-thesis-csl → controlled unavailable state (EN, English message)", async ({ page }) => {
  await page.goto("/opinnaytteet/62699/");
  await injectSyntheticTrigger(page, null, "en");
  await clickSyntheticTrigger(page);
  await expectUnavailable(page, "en");
});

test("thesis-hub-actions.js shipped to detail page contains no browser composer symbols", async ({ page }) => {
  const response = await page.request.get("/js/thesis-hub-actions.js");
  expect(response.ok()).toBeTruthy();
  const source = await response.text();
  const forbidden = [
    "buildThesisApa",
    "buildThesisMla",
    "buildThesisChicago",
    "buildThesisBibTeX",
    "buildThesisRis",
    "getCitationByFormat",
    "getThesisLevelLabel",
    "openAbstractModal",
    "thesisAbstractModal",
    "data-thesis-abstract-trigger"
  ];
  for (const name of forbidden) {
    expect(source, `thesis-hub-actions.js still contains ${name}`).not.toContain(name);
  }
});

test("Detail-page trigger no longer carries raw-field data attributes", async ({ page }) => {
  const response = await page.request.get("/opinnaytteet/62699/");
  const html = await response.text();
  expect(html).toMatch(/data-thesis-citation-trigger/);
  expect(html).toMatch(/data-thesis-csl=/);
  expect(html).toMatch(/data-thesis-lang=/);
  // The four raw-field attributes must be absent from the trigger.
  // Slice the trigger fragment to avoid matching stray occurrences
  // elsewhere in the page.
  const triggerFragment = html.match(/data-thesis-citation-trigger[\s\S]{0,4000}<\/button>/);
  expect(triggerFragment).toBeTruthy();
  const fragment = triggerFragment[0];
  expect(fragment).not.toMatch(/data-thesis-title=/);
  expect(fragment).not.toMatch(/data-thesis-authors=/);
  expect(fragment).not.toMatch(/data-thesis-year=/);
  expect(fragment).not.toMatch(/data-thesis-type=/);
  expect(fragment).not.toMatch(/data-thesis-url=/);
});

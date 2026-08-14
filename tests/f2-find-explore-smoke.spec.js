const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("FI writings Find & Explore search, filter, reset and canonical links", async ({ page }) => {
  await page.goto("/kirjoitukset/");
  await page.locator("[data-find-explore-query]").fill("Kampuspohdintaa Oulun yliopiston hallitus valitsi Kontinkankaan jatkokehitettäväksi kampusvaihtoehdoksi");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", /^\/20/);

  await page.locator("[data-find-explore-type]").selectOption("opinion");
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", /^\/20/, { timeout: 15000 });

  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("[data-find-explore-query]")).toBeFocused();
  await expect(page.locator("[data-find-explore-status]")).toContainText("Kirjoita hakusana");
});

test("EN writings Find & Explore search and canonical publication link", async ({ page }) => {
  await page.goto("/en/writings/");
  await expect(page.locator("[data-find-explore][data-find-explore-ready='true']")).toBeVisible();
  await page.locator("[data-find-explore-query]").fill("Co constructing adaptive lesson plans with GenAI Pre service teachers Intelligent TPACK and prompt engineering strategies");
  await page.locator("[data-find-explore-type]").selectOption("scientificPublication");
  await expect
    .poll(async () => page.locator("[data-find-explore-results] a").count(), { timeout: 30000 })
    .toBeGreaterThan(0);
  await expect(page.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", /^\/julkaisut\//, { timeout: 30000 });
});

const { test, expect } = require("@playwright/test");

test.describe("HOME-COMPOSITION-UX-01 EN hierarchy", () => {
  test("EN route choices follow the hero without the redundant intro layer", async ({ page }) => {
    await page.goto("/en/");

    const hero = page.locator("#heroSection");
    const paths = page.locator("#start");

    await expect(hero).toHaveCount(1);
    await expect(paths).toHaveCount(1);
    await expect(page.locator(".home-intro-section")).toHaveCount(0);
    await expect(paths.getByRole("heading", { level: 2, name: "Four ways into the site" })).toHaveCount(1);
    await expect(paths.locator(".home-path-card")).toHaveCount(4);

    const heroBottom = await hero.evaluate((node) => node.getBoundingClientRect().bottom);
    const pathsTop = await paths.evaluate((node) => node.getBoundingClientRect().top);
    expect(pathsTop).toBeGreaterThanOrEqual(heroBottom - 1);
  });

  test("EN retains its real routes and does not synthesize a teaching landing", async ({ page }) => {
    await page.goto("/en/");

    await expect(page.locator('#start a[href="/en/work/"]')).toHaveCount(1);
    await expect(page.locator('#start a[href="/en/writings/"]')).toHaveCount(1);
    await expect(page.locator('#start a[href="/en/media/"]')).toHaveCount(1);
    await expect(page.locator('#start a[href="/en/politics/"]')).toHaveCount(1);
    await expect(page.locator('a[href="/en/opetus/"]')).toHaveCount(0);
    await expect(page.locator('a[href="/en/teaching/"]')).toHaveCount(0);
  });

  test("EN home remains SSR-first without homepage JSON requests", async ({ page }) => {
    const requests = [];
    page.on("request", (request) => {
      if (["fetch", "xhr"].includes(request.resourceType())) requests.push(request.url());
    });

    await page.goto("/en/");
    await page.waitForLoadState("networkidle");
    expect(requests.filter((url) => /home|start|path/i.test(url))).toEqual([]);
  });
});

const { test, expect } = require("@playwright/test");

async function openMobileNav(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('[data-bs-target="#mobileNavFi"]').click();
  await expect(page.locator('#mobileNavFi [data-mobile-panel="root"]')).toBeVisible();
}

test.describe("MOBILE-NAV-PANEL-SYSTEM-01 audit prototype", () => {
  test("renders prototype destinations in SSR without a navigation JSON request", async ({ page }) => {
    const requests = [];
    page.on("request", (request) => {
      if (request.resourceType() === "fetch" || request.resourceType() === "xhr") requests.push(request.url());
    });
    const html = await page.request.get("/").then((response) => response.text());
    expect(html).toContain('data-mobile-panel-system');
    expect(html).toContain('data-mobile-panel="work"');
    expect(html).toContain('href="/opetus/"');
    expect(html).toContain('href="/mediassa/#media-arkisto"');
    expect(html).toContain('href="/yhteystiedot/"');
    await page.goto("/", { waitUntil: "networkidle" });
    expect(requests.filter((url) => /(?:nav|menu).*\.json/i.test(url))).toEqual([]);
  });

  test("supports deep Työ navigation with exact Back focus restoration", async ({ page }) => {
    await openMobileNav(page);
    const workTrigger = page.locator('[data-mobile-panel-open="work"]');
    await workTrigger.click();
    await expect(page.locator('[data-mobile-panel="work"]')).toBeVisible();
    await expect(page.getByRole("link", { name: "Avaa Työ-sivu" })).toHaveAttribute("href", "/tyoni-yliopistonlehtorina/");

    const opetusTrigger = page.locator('[data-mobile-panel-open="work-1"]');
    await opetusTrigger.click();
    await expect(page.locator('[data-mobile-panel="work-1"]')).toBeVisible();
    await expect(page.getByRole("link", { name: "Avaa Opetus-sivu" })).toHaveAttribute("href", "/opetus/");
    await page.locator('[data-mobile-panel="work-1"] [data-mobile-panel-back="work"]').click();
    await expect(opetusTrigger).toBeFocused();
    await page.locator('[data-mobile-panel="work"] [data-mobile-panel-back="root"]').click();
    await expect(workTrigger).toBeFocused();
  });

  test("uses the same area shell for shallow Media and action-oriented Contact panels", async ({ page }) => {
    await openMobileNav(page);
    await page.locator('[data-mobile-panel-open="media"]').click();
    await expect(page.locator('[data-mobile-panel="media"]')).toBeVisible();
    await expect(page.locator('[data-mobile-panel="media"] a[href="/mediassa/#media-arkisto"]')).toBeVisible();
    await page.locator('[data-mobile-panel="media"] [data-mobile-panel-back="root"]').click();

    await page.locator('[data-mobile-panel-open="contact"]').click();
    await expect(page.locator('[data-mobile-panel="contact"]')).toBeVisible();
    await expect(page.locator('[data-mobile-panel="contact"] a[href^="mailto:"]').first()).toBeVisible();
  });

  test("resets to root when the offcanvas closes", async ({ page }) => {
    await openMobileNav(page);
    await page.locator('[data-mobile-panel-open="work"]').click();
    await page.locator('#mobileNavFi [data-bs-dismiss="offcanvas"]').click();
    await expect(page.locator('#mobileNavFi')).toBeHidden();
    await page.locator('[data-bs-target="#mobileNavFi"]').click();
    await expect(page.locator('[data-mobile-panel="root"]')).toBeVisible();
    await expect(page.locator('[data-mobile-panel="work"]')).toBeHidden();
  });

  test("keeps the shared root usable at 320px without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");
    await page.locator('[data-bs-target="#mobileNavFi"]').click();
    await expect(page.locator('[data-mobile-panel="root"]')).toBeVisible();
    const metrics = await page.locator('#mobileNavFi').evaluate((panel) => ({
      clientWidth: panel.clientWidth,
      scrollWidth: panel.scrollWidth
    }));
    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  });
});

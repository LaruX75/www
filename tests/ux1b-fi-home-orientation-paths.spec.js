const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

const HOME = "/";
const EN_HOME = "/en/";
const PATHS = [
  { title: "Työ", href: "/tyoni-yliopistonlehtorina/" },
  { title: "Kynästä", href: "/kynasta/" },
  { title: "Mediassa", href: "/mediassa/" },
  { title: "Politiikka", href: "/politiikka/" }
];

function orientationSection(page) {
  return page.locator('[data-home-orientation-paths]').first();
}

test("FI homepage renders the orientation paths section from initial HTML", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto(HOME);
    await expect(page.locator("#home-paths-heading")).toHaveText("Mitä etsit?");
    await expect(page.locator("#aloita .home-section-kicker")).toHaveText("Aloita tästä");

    const section = orientationSection(page);
    await expect(section).toHaveCount(1);
    await expect(section.locator(".home-path-card")).toHaveCount(4);

    for (const item of PATHS) {
      const link = section.locator(`a.home-path-card[href="${item.href}"]`);
      await expect(link).toHaveCount(1);
      await expect(link).toContainText(item.title);
    }
  } finally {
    await context.close();
  }
});

test("FI homepage places orientation paths after hero and before role cards", async ({ page }) => {
  await page.goto(HOME);
  const hero = page.locator("#heroSection");
  const paths = page.locator("#aloita");
  const roles = page.locator("#roolit");

  await expect(hero).toHaveCount(1);
  await expect(paths).toHaveCount(1);
  await expect(roles).toHaveCount(1);

  const heroBottom = await hero.evaluate((node) => node.getBoundingClientRect().bottom);
  const pathsTop = await paths.evaluate((node) => node.getBoundingClientRect().top);
  const pathsBottom = await paths.evaluate((node) => node.getBoundingClientRect().bottom);
  const rolesTop = await roles.evaluate((node) => node.getBoundingClientRect().top);

  expect(pathsTop).toBeGreaterThanOrEqual(heroBottom - 1);
  expect(rolesTop).toBeGreaterThanOrEqual(pathsBottom - 1);
});

for (const width of [375, 390, 430]) {
  test(`FI homepage keeps all four orientation paths visible at ${width}px without overflow`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1400 });
    await page.goto(HOME);

    const section = orientationSection(page);
    await expect(section).toHaveCount(1);

    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const metrics = await section.locator(".home-path-card").evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          visibleText: (node.textContent || "").replace(/\s+/g, " ").trim()
        };
      })
    );

    expect(metrics).toHaveLength(4);
    for (const metric of metrics) {
      expect(metric.left).toBeGreaterThanOrEqual(0);
      expect(metric.right).toBeLessThanOrEqual(viewportWidth + 1);
    }

    for (const item of PATHS) {
      await expect(section.locator(`a.home-path-card[href="${item.href}"] .home-path-title`)).toHaveText(item.title);
    }
  });
}

for (const width of [1280, 1440]) {
  test(`FI homepage shows orientation paths as a desktop grid at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1200 });
    await page.goto(HOME);

    const section = orientationSection(page);
    const cards = section.locator(".home-path-card");
    await expect(cards).toHaveCount(4);

    const tops = await cards.evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().top))
    );
    const uniqueRows = new Set(tops);

    expect(uniqueRows.size).toBeLessThanOrEqual(2);
    expect(uniqueRows.size).toBeGreaterThanOrEqual(1);
  });
}

test("EN homepage still exposes its existing orientation layer", async ({ page }) => {
  await page.goto(EN_HOME);
  await expect(page.getByRole("heading", { level: 2, name: "Four ways into the site" })).toHaveCount(1);
  await expect(page.locator("#start .home-path-card")).toHaveCount(4);
});

const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

const EXPECTED_YEARS = [
  "1989",
  "2000",
  "2002",
  "2003",
  "2003",
  "2004",
  "2005",
  "2005",
  "2006",
  "2008",
  "2010",
  "2010",
  "2011",
  "2012",
  "2012",
  "2012",
  "2013",
  "2017",
  "2018",
  "2020",
  "2020",
  "2021",
  "2022",
  "2023",
  "2025",
  "2026"
];

test("homepage timeline stays visible with JavaScript and preserves counts", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Merkkitapahtumia tutkimuksen, opetuksen ja politiikan varrelta"
    })
  ).toBeVisible();

  await expect(page.locator(".home-milestone")).toHaveCount(26);
  await expect(page.locator(".home-milestone-phase")).toHaveCount(4);

  const years = await page.locator(".home-milestone-year").allTextContents();
  expect(years).toEqual(EXPECTED_YEARS);

  const hrefs = await page.locator(".home-milestone-card").evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("href"))
  );
  expect(hrefs.every((href) => typeof href === "string" && href.startsWith("/"))).toBe(true);
});

test("homepage timeline stays visible without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  await page.goto("/");

  await expect(page.locator(".home-milestone")).toHaveCount(26);
  await expect(page.locator(".home-milestone-phase")).toHaveCount(4);
  await expect(page.locator(".home-milestone-card").first()).toHaveAttribute("href", /^\/.+/);
  await expect(page.locator(".home-milestones-hint")).toContainText("Vieritä sivusuuntaan");

  await context.close();
});

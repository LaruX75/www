import { test, expect } from "@playwright/test";

const BLOG_QUERY = "Kandao";
const BLOG_TITLE_FRAGMENT = "Larun laitenurkka testaa: Kandao 360 kokouskamerat";

function visibleRows(page) {
  return page.locator('#blog-tbody tr[data-blog-row]:not([hidden])');
}

function allRows(page) {
  return page.locator("#blog-tbody tr[data-blog-row]");
}

async function archiveCountFromBadge(page) {
  const badgeText = await page.locator("#blog-table-section .card-header .badge").textContent();
  return Number.parseInt(String(badgeText || "").trim(), 10);
}

test.describe("pagefind blog list convergence", () => {
  test("FI archive stays fully SSR without JS", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    await page.goto("/blogi/");

    const expectedCount = await archiveCountFromBadge(page);
    expect(expectedCount).toBeGreaterThan(50);
    await expect(allRows(page)).toHaveCount(expectedCount);
    await expect(page.locator('#blog-tbody tr[data-blog-row]:not([hidden])')).toHaveCount(expectedCount);
    await expect(page.locator("section.blog-routes[data-pagefind-ignore]")).toHaveCount(1);
    await expect(page.locator("[data-blog-list][data-pagefind-ignore]")).toHaveCount(1);

    await context.close();
  });

  test("FI archive paginates SSR rows and searches via Pagefind without runtime JSON", async ({ page }) => {
    const requests = [];
    page.on("request", (request) => {
      if (request.url().includes("/data/content.json") || request.url().includes("/data/taxonomy-index.json")) {
        requests.push(request.url());
      }
    });

    await page.goto("/blogi/");

    const totalRows = await allRows(page).count();
    expect(totalRows).toBeGreaterThan(50);
    await expect(visibleRows(page)).toHaveCount(10);
    const initialFirstHref = await visibleRows(page).locator("a.text-decoration-none").first().getAttribute("href");

    await page.locator('[data-blog-page="2"]').click();
    await expect(visibleRows(page)).toHaveCount(10);
    const pageTwoFirstHref = await visibleRows(page).locator("a.text-decoration-none").first().getAttribute("href");
    expect(pageTwoFirstHref).not.toBe(initialFirstHref);

    await page.locator("#blog-search").fill(BLOG_QUERY);
    await expect
      .poll(() => visibleRows(page).count(), { timeout: 15000 })
      .toBeGreaterThan(0);
    await expect(visibleRows(page).filter({ hasText: BLOG_TITLE_FRAGMENT })).toHaveCount(1);
    expect(await allRows(page).count()).toBe(totalRows);
    expect(requests).toEqual([]);

    await page.locator("#blog-reset").click();
    await expect(visibleRows(page)).toHaveCount(10);
    await expect(visibleRows(page).locator("a.text-decoration-none").first()).toHaveAttribute("href", String(initialFirstHref));

    await page.locator('[data-blog-sort="title"]').click();
    const sortedTitles = await visibleRows(page).locator(".col-title a").allTextContents();
    const expectedTitles = [...sortedTitles].sort((left, right) => left.localeCompare(right, "fi"));
    expect(sortedTitles).toEqual(expectedTitles);
  });

  test("EN archive keeps the same SSR row set and Pagefind-backed search", async ({ page }) => {
    await page.goto("/en/blog/");

    const expectedCount = await archiveCountFromBadge(page);
    expect(expectedCount).toBeGreaterThan(50);
    await expect(allRows(page)).toHaveCount(expectedCount);
    await expect(visibleRows(page)).toHaveCount(10);

    await page.locator("#blog-search").fill(BLOG_QUERY);
    await expect
      .poll(() => visibleRows(page).count(), { timeout: 15000 })
      .toBeGreaterThan(0);
    await expect(visibleRows(page).filter({ hasText: BLOG_TITLE_FRAGMENT })).toHaveCount(1);
  });
});

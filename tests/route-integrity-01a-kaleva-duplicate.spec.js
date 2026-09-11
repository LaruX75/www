import { test, expect } from "@playwright/test";

const canonical = "/2018/11/29/kaleva-mielipide-digitaaliset-valineet-kouluissa/";
const legacy = "/2018/11/29/digitaaliset-valineet-kouluissa-%e2%80%89joko-olisi-aika-tarjota-opettajille-riittavat-tiedot-ja-taidot-uusien-me/";

test("Kaleva legacy route is a noindex redirect to the single canonical record", async ({ page }) => {
  const canonicalResponse = await page.request.get(canonical);
  expect(canonicalResponse.ok()).toBeTruthy();
  const legacyHtml = await page.request.get(legacy).then((response) => response.text());
  expect(legacyHtml).toContain('content="noindex, follow"');
  expect(legacyHtml).toContain(`url=${canonical}`);
  expect(legacyHtml).toContain(`<link rel="canonical" href="${canonical}">`);
  expect(legacyHtml).not.toContain('"@type":"Article"');
});

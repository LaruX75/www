const { test, expect } = require("@playwright/test");

const PAGES = {
  kaleva: "/2026/09/11/kaleva-mielipide-suomen-on-rakennettava-omaa-tekoalykyvykkyytta/",
  legacyExpert: "/2018/11/29/kaleva-mielipide-digitaaliset-valineet-kouluissa/",
  noThumbnail: "/2017/03/14/14-3-rantapohja-uuden-oulun-kasvaneet-voimavarat-ovat-olleet-hyodyksi-alueellemme/",
  statement: "/2026/04/28/lausunto-uutta-suuntaa-suomen-digitaaliseen-kompassiin/",
  presentation: "/presentations/405040y-luento-1-johdanto-2026-a/",
  publication: "/julkaisut/0669729323/",
  blog: "/2013/02/05/yhdistysaktivisti/"
};

async function htmlFor(page, url) {
  const response = await page.request.get(url);
  expect(response.ok(), url).toBeTruthy();
  return response.text();
}

test.describe("DETAIL-HERO-UX-03 opinion composition", () => {
  test("new Kaleva opinion promotes qualified provenance into its hero", async ({ page }) => {
    const html = await htmlFor(page, PAGES.kaleva);
    const hero = html.match(/<section class="content-detail-hero[\s\S]*?<\/section>/)?.[0] || "";
    const bodyMeta = html.match(/<dl class="writing-post-meta">[\s\S]*?<\/dl>/)?.[0] || "";

    expect((hero.match(/<h1\b/g) || []).length).toBe(1);
    expect(hero).toContain("Asiantuntijamielipide");
    expect(hero).toContain("Mielipidekirjoitus Kalevassa Oulun AI Gigafactorysta");
    expect(hero).toContain("Kaleva");
    expect(hero).toContain("11. syyskuuta 2026");
    expect(hero).toContain("Lue alkuperäinen kirjoitus — Kaleva");
    expect(hero).toContain("content-detail-title--compact");
    expect(hero).toMatch(/<img[^>]*alt="Palvelinkeskuksen palvelinkaappeja ja verkkolaitteita\."/);
    expect(hero).not.toMatch(/<a[^>]*>\s*<img/);
    expect(bodyMeta).not.toContain("Päiväys");
    expect(bodyMeta).not.toContain("Julkaisupaikka");
    expect(bodyMeta).not.toContain("Alkuperäinen julkaisu");
  });

  test("political no-thumbnail opinion preserves its role and rejects a truncated description", async ({ page }) => {
    const html = await htmlFor(page, PAGES.noThumbnail);
    const hero = html.match(/<section class="content-detail-hero[\s\S]*?<\/section>/)?.[0] || "";

    expect(hero).toContain("Poliittinen mielipide");
    expect(hero).not.toContain("content-detail-lead");
    expect(hero).toContain("Rantapohja");
    expect(hero).toContain("14. maaliskuuta 2017");
    expect(hero).toContain("content-detail-hero-grid--single");
    expect(hero).not.toContain("content-detail-title--compact");
    expect(hero).not.toContain("content-detail-actions");
  });

  test("older expert opinion promotes its clean description without changing its title", async ({ page }) => {
    const html = await htmlFor(page, PAGES.legacyExpert);
    const hero = html.match(/<section class="content-detail-hero[\s\S]*?<\/section>/)?.[0] || "";

    expect(hero).toContain("Asiantuntijamielipide");
    expect(hero).toContain("Laru vastaa digitaalisten välineiden kritiikkiin");
    expect(hero).toContain("Lue alkuperäinen kirjoitus — Kaleva");
    expect(hero).not.toContain("content-detail-title--compact");
  });

  test("Kaleva opinion remains meaningful without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(PAGES.kaleva);
    await expect(page.locator("h1")).toContainText("Suomen on rakennettava omaa tekoälykyvykkyyttä");
    await expect(page.locator(".content-detail-lead")).toContainText("Mielipidekirjoitus Kalevassa Oulun AI Gigafactorysta");
    await context.close();
  });

  test("non-opinion detail heroes retain their current structure", async ({ page }) => {
    for (const url of [PAGES.statement, PAGES.presentation, PAGES.publication, PAGES.blog]) {
      const html = await htmlFor(page, url);
      expect(html).not.toContain('aria-label="Mielipidekirjoituksen tiedot"');
    }
    const statement = await htmlFor(page, PAGES.statement);
    expect(statement).toContain("<dt>Päiväys</dt>");
  });
});

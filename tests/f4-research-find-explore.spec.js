const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

test("homepage routes to Research contextual Find & Explore without embedding runtime", async ({ page }) => {
  await page.goto("/");

  const link = page.getByRole("link", { name: "Tutki tutkimusnäyttöä" });
  await expect(link).toHaveAttribute("href", "/tutkimus/#tutkimusnaytto");
  await expect(page.locator("[data-find-explore]")).toHaveCount(0);
});

test("Research contextual Find & Explore searches publications, theses and writings", async ({ page }) => {
  await page.goto("/tutkimus/");
  const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");

  await expect(mount).toBeVisible();
  await expect(mount).toHaveAttribute("data-find-explore-kinds", "publications,theses,writings");
  await expect(mount).toHaveAttribute("data-find-explore-ready", "true", { timeout: 15000 });

  await mount.locator("[data-find-explore-query]").fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
  await expect(mount.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", "/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/");

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("theses");
  await mount.locator("[data-find-explore-query]").fill("Riikonen");
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", "/opinnaytteet/62699/", { timeout: 15000 });

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("writings");
  await mount.locator("[data-find-explore-query]").fill("Kampuspohdintaa Oulun yliopiston hallitus valitsi Kontinkankaan jatkokehitettäväksi kampusvaihtoehdoksi");
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", /^\/20/, { timeout: 15000 });
});

test("Research contextual writings search keeps existing blog eligibility and multi-context items", async ({ page }) => {
  await page.goto("/tutkimus/");
  const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");

  await expect(mount).toHaveAttribute("data-find-explore-ready", "true", { timeout: 15000 });

  await mount.locator("[data-find-explore-type]").selectOption("writings");
  await mount.locator("[data-find-explore-query]").fill("Punaisenladonkankaan kompostialue vs. tutkimus jonka mukaan mädätys on kompostointia ympäristöystävällisempää");
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute(
    "href",
    "/2008/10/08/punaisenladonkankaan-kompostialue-vs-tutkimus-jonka-mukaan-madatys-on-kompostointia-ymparistoystavallisempaa/",
    { timeout: 15000 }
  );

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("publications");
  await mount.locator("[data-find-explore-query]").fill("Co-constructing adaptive lesson plans with GenAI");
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute(
    "href",
    "/julkaisut/02254916YJ/",
    { timeout: 15000 }
  );
});

const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

const ELIGIBLE_MAPPED_PRESENTATION = {
  title: "Professional use of social media (web2.0)",
  href: "/presentations/ss-professional-use-of-social-media-web2-0/"
};

const ELIGIBLE_UNMAPPED_PRESENTATION = {
  query: "Quali lecture 1: Understanding the research process",
  href: "/presentations/ss-quali-lecture-1-understanding-the-research-process/"
};

const ELIGIBLE_EN_PRESENTATION = {
  query: "The role and importance of social media in science",
  href: "/presentations/ss-the-role-and-importance-of-social-media-in-science/"
};

const SAFE_MAPPED_NON_RESEARCH_PRESENTATION = {
  query: "3. luento tieto- ja viestintätekniikan pedagogiset perusteet: tietokoneavusteinen yhteisöllinen oppiminen (CSCL)",
  href: "/presentations/ss-3-luento-tieto-ja-viestintatekniikan-pedagogiset-perusteet-tietokoneavusteinen-y/"
};

const NON_RESEARCH_WRITING = {
  query: "Jari Laru: Tekoäly on työkaverini! – Havaintoja teknologiasta innostuvan yliopistonlehtorin arjesta",
  href: "/2024/10/21/sivista-blogi-tekoaly-on-tyokaverini/"
};

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hrefWithOptionalQuery(pathname) {
  return new RegExp(`^${escapeRegExp(pathname)}(\\?|$)`);
}

function hrefPrefixSelector(pathname) {
  return `[data-find-explore-results] a[href^="${pathname}"]`;
}

test("homepage routes to Research contextual Find & Explore without embedding runtime", async ({ page }) => {
  await page.goto("/");

  const link = page.getByRole("link", { name: "Tutki tutkimusnäyttöä" });
  await expect(link).toHaveAttribute("href", "/tutkimus/#tutkimusnaytto");
  await expect(page.locator("[data-find-explore]")).toHaveCount(0);
});

test("Research contextual Find & Explore searches publications, theses, writings and presentations", async ({ page }) => {
  await page.goto("/tutkimus/");
  const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");

  await expect(mount).toBeVisible();
  await expect(mount).toHaveAttribute("data-find-explore-kinds", "publications,theses,writings,presentations");
  await expect(mount).toHaveAttribute("data-find-explore-ready", "true", { timeout: 15000 });

  await mount.locator("[data-find-explore-query]").fill("Assessing Digital Competence of K1-12 Teachers in Kosovo");
  await expect(mount.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  // O1 detail-orientation decorates result links with ?returnTo=... when
  // discovery is active. Allow the suffix but assert the canonical detail
  // pathname prefix.
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute(
    "href",
    hrefWithOptionalQuery("/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/")
  );

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("theses");
  await mount.locator("[data-find-explore-query]").fill("Riikonen");
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute(
    "href",
    hrefWithOptionalQuery("/opinnaytteet/62699/"),
    { timeout: 15000 }
  );

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("writings");
  await mount.locator("[data-find-explore-query]").fill("Kampuspohdintaa Oulun yliopiston hallitus valitsi Kontinkankaan jatkokehitettäväksi kampusvaihtoehdoksi");
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute("href", /^\/20/, { timeout: 15000 });
});

test("Research contextual search preserves writings eligibility and adds only authoritative presentations", async ({ page }) => {
  await page.goto("/tutkimus/");
  const mount = page.locator("[data-find-explore][data-find-explore-kind='researchContext']");

  await expect(mount).toHaveAttribute("data-find-explore-ready", "true", { timeout: 15000 });

  await mount.locator("[data-find-explore-type]").selectOption("writings");
  await mount.locator("[data-find-explore-query]").fill("Punaisenladonkankaan kompostialue vs. tutkimus jonka mukaan mädätys on kompostointia ympäristöystävällisempää");
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute(
    "href",
    hrefWithOptionalQuery("/2008/10/08/punaisenladonkankaan-kompostialue-vs-tutkimus-jonka-mukaan-madatys-on-kompostointia-ymparistoystavallisempaa/"),
    { timeout: 15000 }
  );

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("writings");
  await mount.locator("[data-find-explore-query]").fill(NON_RESEARCH_WRITING.query);
  await expect(mount.locator(hrefPrefixSelector(NON_RESEARCH_WRITING.href))).toHaveCount(0);

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("publications");
  await mount.locator("[data-find-explore-query]").fill("Co-constructing adaptive lesson plans with GenAI");
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute(
    "href",
    hrefWithOptionalQuery("/julkaisut/02254916YJ/"),
    { timeout: 15000 }
  );

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("presentations");
  await mount.locator("[data-find-explore-query]").fill(ELIGIBLE_MAPPED_PRESENTATION.title);
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute(
    "href",
    hrefWithOptionalQuery(ELIGIBLE_MAPPED_PRESENTATION.href),
    { timeout: 15000 }
  );
  await expect(mount.locator(hrefPrefixSelector(ELIGIBLE_MAPPED_PRESENTATION.href))).toHaveCount(1);

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("presentations");
  await mount.locator("[data-find-explore-topic]").selectOption("koulutusteknologia");
  await mount.locator("[data-find-explore-query]").fill(ELIGIBLE_MAPPED_PRESENTATION.title);
  await expect(mount.locator(hrefPrefixSelector(ELIGIBLE_MAPPED_PRESENTATION.href)).first()).toBeVisible({ timeout: 15000 });
  await expect(mount.locator(hrefPrefixSelector(SAFE_MAPPED_NON_RESEARCH_PRESENTATION.href))).toHaveCount(0);
  await expect(mount.locator(hrefPrefixSelector(ELIGIBLE_UNMAPPED_PRESENTATION.href))).toHaveCount(0);

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("presentations");
  await mount.locator("[data-find-explore-query]").fill(ELIGIBLE_EN_PRESENTATION.query);
  await expect(mount.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(mount.locator(hrefPrefixSelector(ELIGIBLE_EN_PRESENTATION.href))).toHaveCount(1);

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-query]").fill(ELIGIBLE_UNMAPPED_PRESENTATION.query);
  await expect(mount.locator("[data-find-explore-results] a").first()).toHaveAttribute(
    "href",
    hrefWithOptionalQuery(ELIGIBLE_UNMAPPED_PRESENTATION.href),
    { timeout: 15000 }
  );

  await mount.locator("[data-find-explore-reset]").click();
  await mount.locator("[data-find-explore-type]").selectOption("presentations");
  await mount.locator("[data-find-explore-query]").fill(SAFE_MAPPED_NON_RESEARCH_PRESENTATION.query);
  await expect(mount.locator(hrefPrefixSelector(SAFE_MAPPED_NON_RESEARCH_PRESENTATION.href))).toHaveCount(0);
});

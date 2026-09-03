const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * THESIS-HUB-02 — hub landing + three scoped subarchives contract.
 *
 * Replaces the pre-THESIS-HUB-02 monolithic thesis-pagination spec.
 * Coverage checklist (user-supplied, spec locked):
 *   1. hub has no full archive pagination
 *   2. hub renders exactly 5-per-group
 *   3. latest-five ordering uses canonical issued date (proxy: SSR order stable)
 *   4. each CTA reaches its correct archive
 *   5. each subarchive has SSR pagination
 *   6. each subarchive Find & Explore is correctly scoped (pinned type/role)
 *   7. reset restores that archive's SSR rows
 *   8. searches cannot leak records from another thesis group
 *   9. exact thesis search results still navigate to canonical detail pages
 *  10. FI/EN parity holds
 *  11. legacy pagination URLs have the approved redirect/removal behavior
 *  12. no runtime JSON -> HTML archive path has been introduced
 */

const HUB_SECTIONS = [
  { url: "/opinnaytteet/", expectedSectionCount: 3, ctaSelectors: [
    'a[href="/opinnaytteet/gradut/"]',
    'a[href="/opinnaytteet/kandit/"]',
    'a[href="/opinnaytteet/tarkastetut/"]'
  ]},
  { url: "/en/theses/", expectedSectionCount: 3, ctaSelectors: [
    'a[href="/en/theses/masters/"]',
    'a[href="/en/theses/bachelors/"]',
    'a[href="/en/theses/reviewed/"]'
  ]}
];

const SUBARCHIVES_FI = [
  {
    landing: "/opinnaytteet/gradut/",
    pagerBase: "/opinnaytteet/gradut/sivu/",
    tbody: "thesesArchiveTbodyGradutFi",
    pinnedType: "masterThesis",
    pinnedRole: "advised"
  },
  {
    landing: "/opinnaytteet/kandit/",
    pagerBase: "/opinnaytteet/kandit/sivu/",
    tbody: "thesesArchiveTbodyKanditFi",
    pinnedType: "bachelorThesis",
    pinnedRole: "advised"
  },
  {
    landing: "/opinnaytteet/tarkastetut/",
    pagerBase: "/opinnaytteet/tarkastetut/sivu/",
    tbody: "thesesArchiveTbodyTarkastetutFi",
    pinnedType: "",
    pinnedRole: "reviewed"
  }
];

const SUBARCHIVES_EN = [
  {
    landing: "/en/theses/masters/",
    pagerBase: "/en/theses/masters/page/",
    tbody: "thesesArchiveTbodyMastersEn",
    pinnedType: "masterThesis",
    pinnedRole: "advised"
  },
  {
    landing: "/en/theses/bachelors/",
    pagerBase: "/en/theses/bachelors/page/",
    tbody: "thesesArchiveTbodyBachelorsEn",
    pinnedType: "bachelorThesis",
    pinnedRole: "advised"
  },
  {
    landing: "/en/theses/reviewed/",
    pagerBase: "/en/theses/reviewed/page/",
    tbody: "thesesArchiveTbodyReviewedEn",
    pinnedType: "",
    pinnedRole: "reviewed"
  }
];

// (1) + (2) + (4)
test.describe("hub landing contract (FI+EN)", () => {
  for (const hub of HUB_SECTIONS) {
    test(`${hub.url} has no full-archive pagination and renders 3 sections x 5 items`, async ({ page }) => {
      const response = await page.request.get(hub.url);
      expect(response.ok(), `${hub.url} must exist`).toBeTruthy();
      const html = await response.text();

      // (1) no monolithic pagination markers
      expect(html, "hub must not carry the paginated archive shell").not.toMatch(/data-thesis-archive-current-page/);
      expect(html, "hub must not embed the paginated pager").not.toMatch(/data-thesis-archive-pager-position/);
      // (1) hub HAS a Find & Explore mount — thesis-kind, no pinned type/role
      expect(html, "hub must mount thesis Find & Explore").toMatch(/data-find-explore-kind="theses"/);
      expect(html, "hub FE must not pin a type").not.toMatch(/data-find-explore-pinned-type=/);
      expect(html, "hub FE must not pin a role").not.toMatch(/data-find-explore-pinned-role=/);

      // (2) exactly 3 hub sections
      const hubSections = (html.match(/data-thesis-hub-section/g) || []).length;
      expect(hubSections).toBe(hub.expectedSectionCount);

      await page.goto(hub.url);
      // Total title links across all hub sections = 3 * 5 = 15 (assumes each group has >= 5 items)
      const titleLinkCount = await page.locator("[data-thesis-hub-section] .thesis-archive-title-link").count();
      expect(titleLinkCount, `${hub.url} must render exactly 15 total (3 sections x 5)`).toBe(15);

      // (4) all CTA anchors present and hit expected subarchive URLs
      for (const cta of hub.ctaSelectors) {
        await expect(page.locator(`[data-thesis-hub-section] ${cta}`)).toBeVisible();
      }
    });
  }
});

// Hub FE contract (per user-locked spec)
test.describe("hub Find & Explore is thesis-scoped without type/role pinning", () => {
  test("FI hub FE mount has label 'Hae opinnäytteistä' and scope=fi, no pinned type/role", async ({ page }) => {
    const html = await page.request.get("/opinnaytteet/").then((r) => r.text());
    expect(html).toContain("Hae opinnäytteistä");
    expect(html).toMatch(/data-find-explore-kind="theses"/);
    expect(html).toMatch(/data-find-explore-scope="fi"/);
    expect(html).not.toMatch(/data-find-explore-pinned-type=/);
    expect(html).not.toMatch(/data-find-explore-pinned-role=/);
  });

  test("EN hub FE mount has label 'Search theses' and scope=en, no pinned type/role", async ({ page }) => {
    const html = await page.request.get("/en/theses/").then((r) => r.text());
    expect(html).toContain("Search theses");
    expect(html).toMatch(/data-find-explore-kind="theses"/);
    expect(html).toMatch(/data-find-explore-scope="en"/);
    expect(html).not.toMatch(/data-find-explore-pinned-type=/);
    expect(html).not.toMatch(/data-find-explore-pinned-role=/);
  });

  test("FI hub search returns thesis-only results (no publications/writings/media leakage)", async ({ page }) => {
    await page.goto("/opinnaytteet/");
    // Search a term that also matches publications titles — leakage would
    // surface a /julkaisut/ or /mediassa/ result. A thesis-scoped FE
    // must never return non-thesis records.
    await page.locator("[data-find-explore-query]").fill("tekoäly");
    await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
    const anchors = await page.locator("[data-find-explore] [data-find-explore-results] a").allInnerTexts();
    const hrefs = await page.locator("[data-find-explore] [data-find-explore-results] a").evaluateAll((els) => els.map((el) => el.getAttribute("href") || ""));
    for (const href of hrefs) {
      if (!href) continue;
      // Accept /opinnaytteet/<id>/ (canonical thesis detail) or oulurepo external.
      const ok = /^\/opinnaytteet\/\d+\//.test(href)
        || href.startsWith("https://oulurepo.oulu.fi/")
        || href.startsWith("#");
      expect(ok, `hub search must not surface non-thesis href "${href}" (${anchors.length} anchors)`).toBeTruthy();
    }
    // Must have at least one canonical thesis detail result.
    const detailResults = hrefs.filter((h) => /^\/opinnaytteet\/\d+\//.test(h));
    expect(detailResults.length, "hub search must return at least one thesis detail result").toBeGreaterThan(0);
  });

  test("FI hub search across ALL thesis groups: known reviewer-only record IS reachable", async ({ page }) => {
    // "Riikonen" record is reviewerOnly (10024/62699). The pre-hub
    // scoped subarchive gradut FE cannot see it. The hub FE has no
    // pinned type/role, so it MUST surface this record.
    await page.goto("/opinnaytteet/");
    await page.locator("[data-find-explore-query]").fill("Riikonen");
    await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
    const hrefs = await page.locator("[data-find-explore] [data-find-explore-results] a").evaluateAll((els) => els.map((el) => el.getAttribute("href") || ""));
    const hits = hrefs.filter((h) => h.startsWith("/opinnaytteet/62699/"));
    expect(hits.length, "hub search must reach the reviewer-only Riikonen record").toBeGreaterThan(0);
  });

  test("FI hub reset restores the resting-state 3x5 SSR hub sections", async ({ page }) => {
    await page.goto("/opinnaytteet/");
    // Precondition: 3x5 = 15 SSR title links visible
    const preCount = await page.locator("[data-thesis-hub-section] .thesis-archive-title-link").count();
    expect(preCount).toBe(15);
    await page.locator("[data-find-explore-query]").fill("tekoäly");
    await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
    // Reset: FE clears results; the SSR hub sections were never removed.
    await page.locator("[data-find-explore-reset]").click();
    await expect(page.locator("[data-find-explore-query]")).toBeFocused();
    const postCount = await page.locator("[data-thesis-hub-section] .thesis-archive-title-link").count();
    expect(postCount, "SSR hub sections must remain intact after reset").toBe(15);
  });
});

// (3) latest-five ordering uses canonical projection — invariant assertion
test("hub first-5 per section matches subarchive first-5 rows (SSR canonical)", async ({ page }) => {
  const hubFi = await page.request.get("/opinnaytteet/").then((r) => r.text());
  const hubFirst = extractTitleLinks(hubFi);
  const gradutFirst = extractTitleLinks(await page.request.get("/opinnaytteet/gradut/").then((r) => r.text())).slice(0, 5);
  const kanditFirst = extractTitleLinks(await page.request.get("/opinnaytteet/kandit/").then((r) => r.text())).slice(0, 5);
  const tarkFirst = extractTitleLinks(await page.request.get("/opinnaytteet/tarkastetut/").then((r) => r.text())).slice(0, 5);
  expect(hubFirst.slice(0, 5), "hub gradut section == gradut archive first 5").toEqual(gradutFirst);
  expect(hubFirst.slice(5, 10), "hub kandit section == kandit archive first 5").toEqual(kanditFirst);
  expect(hubFirst.slice(10, 15), "hub tarkastetut section == tarkastetut archive first 5").toEqual(tarkFirst);
});

// (5) subarchive SSR pagination
test.describe("subarchive SSR pagination (FI+EN)", () => {
  for (const sub of [...SUBARCHIVES_FI, ...SUBARCHIVES_EN]) {
    test(`${sub.landing} landing has table + top+bottom pagers`, async ({ page }) => {
      const response = await page.request.get(sub.landing);
      expect(response.ok(), `${sub.landing} must exist`).toBeTruthy();
      const html = await response.text();
      expect(html).toMatch(/data-thesis-archive/);
      expect((html.match(/data-thesis-archive-pager-position="top"/g) || []).length).toBe(1);
      expect((html.match(/data-thesis-archive-pager-position="bottom"/g) || []).length).toBe(1);
      const rows = (html.match(/class="thesis-archive-title-link/g) || []).length;
      expect(rows, `${sub.landing} first page must have <=20 rows`).toBeLessThanOrEqual(20);
    });
  }

  test("/opinnaytteet/gradut/sivu/2/ exists and shows page 2", async ({ page }) => {
    const response = await page.request.get("/opinnaytteet/gradut/sivu/2/");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toMatch(/data-thesis-archive-current-page="2"/);
  });

  test("/en/theses/masters/page/2/ exists and shows page 2", async ({ page }) => {
    const response = await page.request.get("/en/theses/masters/page/2/");
    expect(response.ok()).toBeTruthy();
    const html = await response.text();
    expect(html).toMatch(/data-thesis-archive-current-page="2"/);
  });
});

// (6) subarchive FE scoped via pinned filters
test.describe("subarchive Find & Explore is scoped via pinned filters", () => {
  for (const sub of [...SUBARCHIVES_FI, ...SUBARCHIVES_EN]) {
    test(`${sub.landing} FE mount carries expected pinned filter attributes`, async ({ page }) => {
      const html = await page.request.get(sub.landing).then((r) => r.text());
      expect(html, `${sub.landing} must mount FE`).toMatch(/data-find-explore-kind="theses"/);
      if (sub.pinnedType) {
        expect(html).toContain(`data-find-explore-pinned-type="${sub.pinnedType}"`);
      } else {
        expect(html, `${sub.landing} must NOT emit pinned-type when scope is role-only`).not.toMatch(/data-find-explore-pinned-type=/);
      }
      if (sub.pinnedRole) {
        expect(html).toContain(`data-find-explore-pinned-role="${sub.pinnedRole}"`);
      }
      // Hidden dropdowns: type + role controls are removed from FE UI on
      // subarchives (scope is single-group; user has no legitimate
      // widening path from within the subarchive).
      expect(html, `${sub.landing} must not expose type dropdown`).not.toMatch(/data-find-explore-type[^-]/);
      expect(html, `${sub.landing} must not expose role dropdown`).not.toMatch(/data-find-explore-role[^-]/);
    });
  }
});

// (7) reset restores archive's SSR rows
test("gradut subarchive: search then reset restores initial SSR tbody", async ({ page }) => {
  await page.goto("/opinnaytteet/gradut/");
  const initialFirst = await page.locator("[data-find-explore-results] .thesis-archive-title-link").first().getAttribute("href");
  expect(initialFirst).not.toContain("returnTo=");

  await page.locator("[data-find-explore-query]").fill("tekoäly");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  await expect(page.locator("body")).toHaveClass(/find-explore-active/);

  await page.locator("[data-find-explore-reset]").click();
  await expect(page.locator("body")).not.toHaveClass(/find-explore-active/);
  await expect(page.locator("[data-find-explore-results] .thesis-archive-title-link").first())
    .toHaveAttribute("href", initialFirst);
});

// (8) cross-group leakage prevented — search a known bachelor's-only-title on gradut returns none
test("gradut FE scope cannot leak kandi-only records", async ({ page }) => {
  // Establish a control: a known bachelor's thesis (kandi) title.
  await page.goto("/opinnaytteet/kandit/");
  const anyKandiRow = page.locator("[data-find-explore-results] .thesis-archive-title-link").first();
  await expect(anyKandiRow).toBeVisible();
  const kandiTitle = (await anyKandiRow.innerText()).trim();
  expect(kandiTitle.length, "control: kandi list must produce a title").toBeGreaterThan(0);

  // Now search that title on the gradut subarchive.
  await page.goto("/opinnaytteet/gradut/");
  await page.locator("[data-find-explore-query]").fill(kandiTitle);
  // Wait for either a result-count status or the no-results status.
  // After THESIS-SEARCH-UX-01 eliminated sidebar chrome pollution, a
  // kandi title on the master's-scoped archive legitimately returns
  // zero results (Tuloksia ei löytynyt) instead of leaked matches.
  await expect(page.locator("[data-find-explore-status]"))
    .toContainText(/tulos|tulosta|löytynyt/i, { timeout: 15000 });

  // Any row surfaced in the shared tbody must be a master's thesis
  // ("Gradu"), never a "Kandi". Zero rows is also acceptable — the goal
  // is guaranteed absence of kandi rows.
  const typeCells = await page.locator("[data-find-explore-results] .thesis-archive-col-type").allTextContents();
  for (const cell of typeCells) {
    expect(cell, `gradut subarchive must never expose Kandi-typed rows (got "${cell.trim()}")`)
      .not.toMatch(/Kandi/);
  }
});

// (9) result links navigate to canonical detail pages
test("subarchive FE search result links resolve to /opinnaytteet/<id>/", async ({ page }) => {
  // Use a term that occurs in an advised master's thesis title
  // (Teknologiakasvattajan → 10024/63433, advisedMasters). "Riikonen"
  // would fail here because that record is reviewerOnly, not advised.
  await page.goto("/opinnaytteet/gradut/");
  await page.locator("[data-find-explore-query]").fill("Teknologiakasvattajan");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  const first = page.locator("[data-find-explore-results] .thesis-archive-title-link").first();
  const href = await first.getAttribute("href");
  const url = new URL(href, "http://localhost");
  expect(url.pathname).toMatch(/^\/opinnaytteet\/\d+\/$/);
});

// (11) legacy pagination URLs removed
test("legacy /opinnaytteet/sivu/N/ + /en/theses/page/N/ pagination is removed", async ({ page }) => {
  const legacy = ["/opinnaytteet/sivu/2/", "/opinnaytteet/sivu/3/", "/en/theses/page/2/", "/en/theses/page/3/"];
  for (const url of legacy) {
    const response = await page.request.get(url);
    // Under the static SSR build these URLs no longer resolve — either
    // 404 from the platform, or _redirects-driven 301/302. Both are
    // acceptable "removed" states; the fatal failure would be 200 which
    // would mean the old paginated shell resurrected.
    expect(response.status(), `${url} must be gone (404 or redirect), never 200`).not.toBe(200);
  }
});

// (12) no runtime JSON -> HTML archive path
test("subarchive FE search does not fetch /data/theses.json to hydrate rows", async ({ page }) => {
  const jsonRequests = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/\/data\/theses(?:\.json)?/i.test(url)) jsonRequests.push(url);
  });
  await page.goto("/opinnaytteet/gradut/");
  await page.locator("[data-find-explore-query]").fill("tekoäly");
  await expect(page.locator("[data-find-explore-status]")).toContainText(/tulos|tulosta/, { timeout: 15000 });
  expect(jsonRequests, `no /data/theses* fetch should happen: ${JSON.stringify(jsonRequests)}`).toEqual([]);
});

// (10) FI/EN parity smoke: same pinned attributes on the mirror subarchive
test("EN masters subarchive mirrors FI gradut pinning + tbody target", async ({ page }) => {
  const fiHtml = await page.request.get("/opinnaytteet/gradut/").then((r) => r.text());
  const enHtml = await page.request.get("/en/theses/masters/").then((r) => r.text());
  expect(fiHtml).toContain(`data-find-explore-pinned-type="masterThesis"`);
  expect(fiHtml).toContain(`data-find-explore-pinned-role="advised"`);
  expect(enHtml).toContain(`data-find-explore-pinned-type="masterThesis"`);
  expect(enHtml).toContain(`data-find-explore-pinned-role="advised"`);
  expect(fiHtml).toMatch(/thesesArchiveTbodyGradutFi/);
  expect(enHtml).toMatch(/thesesArchiveTbodyMastersEn/);
});

function extractTitleLinks(html) {
  const re = /<a class="thesis-archive-title-link[^"]*" href="([^"]+)">([^<]+)<\/a>/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push([m[1], m[2]]);
  return out;
}

const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");
const coursePages = require("../src/_data/coursePages");

const OPETUS = "/opetus/";
const COURSE = "/opetus/tieto-ja-viestintatekniikka-pedagogisena-tyovalineena/2014-2015-a/";
const ROOT = path.resolve(__dirname, "..");
const COURSE_PAGE_MD = path.join(ROOT, "src", "opetus", "tieto-ja-viestintatekniikka-pedagogisena-tyovalineena-2014-2015-a.md");

const TARGETS = [
  "ss-410014y-johdantoluento-tieto-ja-viestintatekniikka-pedagogisena-tyovalineena-201",
  "ss-410014y-luento-2-taman-vuosisadan-ydintaidot-21th-skills-ja-koulun-muutospaineet",
  "ss-410014y-luento-4-sopimukset-ja-tekijanoikeudet"
];

test.describe.configure({ mode: "serial" });

test.describe("A. Canonical historical course page (410014Y / 2014-2015-a)", () => {
  test("route resolves and page is FI-only SSR", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const p = await ctx.newPage();
    const res = await p.request.get(COURSE);
    expect(res.status()).toBe(200);
    const html = await res.text();
    expect(html).toContain(`<html lang="fi"`);
    await ctx.close();
  });

  test("frontmatter carries the exact target identity fields", () => {
    const raw = fs.readFileSync(COURSE_PAGE_MD, "utf8");
    expect(raw).toContain("courseId: 410014Y");
    expect(raw).toContain("courseName: Tieto- ja viestintätekniikka pedagogisena työvälineenä");
    expect(raw).toContain('academicYear: "2014–2015"');
    expect(raw).toContain("semesterLabel: Syksy 2014");
    expect(raw).toContain('periodId: "2014-2015-a"');
    expect(raw).toContain("lang: fi");
  });

  test("coursePages projects the new implementation into the derived catalog", () => {
    const course = coursePages.catalog.find((c) => c.courseId === "410014Y");
    expect(course, "410014Y course group exists").toBeDefined();
    const impl2014 = course.implementations.find((i) => i.periodId === "2014-2015-a");
    expect(impl2014).toMatchObject({
      periodId: "2014-2015-a",
      academicYear: "2014–2015",
      semesterLabel: "Syksy 2014",
      pageUrl: COURSE,
      lang: "fi"
    });
    // AND both 2014 + 2013 must remain grouped under the same 410014Y card
    const periodIds = course.implementations.map((i) => i.periodId);
    expect(periodIds).toContain("2014-2015-a");
    expect(periodIds).toContain("2013-2014-a");
  });
});

test.describe("B. Exact Presentation membership", () => {
  test("all three target Presentations gain periodId 2014-2015-a on their 410014Y context", () => {
    for (const slug of TARGETS) {
      const raw = fs.readFileSync(path.join(ROOT, "src", "presentations", `${slug}.md`), "utf8");
      // periodId must be in the 410014Y block, not elsewhere
      const fmMatch = raw.match(/^---[\s\S]*?^---/m);
      expect(fmMatch, `${slug} has frontmatter`).not.toBeNull();
      expect(fmMatch[0], `${slug} keeps courseId 410014Y`).toMatch(/courseId:\s*410014Y/);
      expect(fmMatch[0], `${slug} adds periodId 2014-2015-a`).toMatch(/periodId:\s*"2014-2015-a"/);
    }
  });

  test("no fourth Presentation carries periodId 2014-2015-a", () => {
    const dir = path.join(ROOT, "src", "presentations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
    const carriers = files.filter((f) => {
      const raw = fs.readFileSync(path.join(dir, f), "utf8");
      return /periodId:\s*"?2014-2015-a"?/.test(raw);
    });
    const expected = TARGETS.map((s) => `${s}.md`).sort();
    expect(carriers.sort()).toEqual(expected);
  });

  test("no 2013-2014-a periodId leaked into the 2014 targets", () => {
    for (const slug of TARGETS) {
      const raw = fs.readFileSync(path.join(ROOT, "src", "presentations", `${slug}.md`), "utf8");
      expect(raw, `${slug} must NOT carry 2013-2014-a`).not.toMatch(/periodId:\s*"?2013-2014-a"?/);
    }
  });
});

test.describe("C. Incomplete material set is honestly communicated", () => {
  test("page uses 'Säilyneet luentomateriaalit' heading and explains incompleteness", async ({ page }) => {
    const html = await page.request.get(COURSE).then((r) => r.text());
    expect(html).toContain("Säilyneet luentomateriaalit");
    expect(html, "explicit incompleteness note").toMatch(/ei ole julkisesti saatavilla/);
    expect(html, "explicit surviving parts 1, 2, 4").toContain("1, 2 ja 4");
  });

  test("page does not claim a complete series or reconstructed sequence", async ({ page }) => {
    const html = await page.request.get(COURSE).then((r) => r.text());
    // No positive completeness claim. Note: the page IS allowed to state
    // that the complete series is NOT publicly available — that is the
    // whole point of the "Säilyneet luentomateriaalit" framing — so we
    // only reject positive assertions of full availability, not negations.
    expect(html).not.toMatch(/(kaikki|koko).{0,20}luennot?.{0,40}saatavilla/i);
    expect(html).not.toMatch(/rekonstruoi[a-zäö]*.{0,40}(luento|sarja|opetussuunnitelma)/i);
    // No invented Luento 3 or Luento 5 entries (either as titles or link labels)
    expect(html).not.toMatch(/Luento\s*3\b/);
    expect(html).not.toMatch(/Luento\s*5\b/);
  });

  test("no sequence / sessionIndex / prev-next metadata is introduced", () => {
    const raw = fs.readFileSync(COURSE_PAGE_MD, "utf8");
    expect(raw).not.toMatch(/sessionIndex/);
    expect(raw).not.toMatch(/sequence/);
    expect(raw).not.toMatch(/lectureOrder/);
    expect(raw).not.toMatch(/(prev|next)Presentation/);
  });
});

test.describe("D. Relationship UX works generically for the new implementation", () => {
  test("each target Presentation exposes the course-implementation backlink to /opetus/…/2014-2015-a/", async ({ page }) => {
    for (const slug of TARGETS) {
      const html = await page.request.get(`/presentations/${slug}/`).then((r) => r.text());
      expect(html, `${slug} backlink`).toContain(`href="${COURSE}"`);
    }
  });

  test("each target Presentation gets exactly two same-implementation peers (excludes unrelated 410014Y records)", async ({ page }) => {
    for (const slug of TARGETS) {
      const html = await page.request.get(`/presentations/${slug}/`).then((r) => r.text());
      const peersBlock = html.match(/content-detail-course-peers--implementation[\s\S]*?<\/section>/);
      expect(peersBlock, `${slug} implementation-peer section`).not.toBeNull();
      const peerLinks = peersBlock[0].match(/href="\/presentations\/[^"]+"/g) || [];
      // Two peers: the other two targets (never itself)
      expect(peerLinks.length, `${slug} peer count`).toBe(2);
      for (const link of peerLinks) {
        const href = link.match(/href="([^"]+)"/)[1];
        expect(TARGETS.some((t) => href.includes(t)), `${slug} peer must be a target: ${href}`).toBe(true);
        expect(href.includes(slug), `${slug} peer must not be self`).toBe(false);
      }
    }
  });
});

test.describe("E. /opetus/ catalog auto-discovers the new implementation", () => {
  test("both 410014Y implementations render inside the same course card, newest first", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    const cardMatch = html.match(/data-opetus-course[^>]*data-course-id="410014Y"[\s\S]*?<\/article>/);
    expect(cardMatch, "410014Y course card").not.toBeNull();
    const periods = Array.from(cardMatch[0].matchAll(/data-period-id="([^"]+)"/g)).map((m) => m[1]);
    expect(periods).toEqual(["2014-2015-a", "2013-2014-a"]);
  });

  test("catalog remains derived from src/opetus/*.md (no handwritten catalog entry)", () => {
    const landing = fs.readFileSync(path.join(ROOT, "src", "fi", "opetus.md"), "utf8");
    expect(landing).toContain("{% for course in coursePages.catalog %}");
    // No handwritten reference to the new 2014 implementation URL
    expect(landing).not.toContain('href="/opetus/tieto-ja-viestintatekniikka-pedagogisena-tyovalineena/2014-2015-a/"');
    // Nor to the 2013 implementation URL
    expect(landing).not.toContain('href="/opetus/tieto-ja-viestintatekniikka-pedagogisena-tyovalineena/2013-2014-a/"');
  });

  test("OPETUS-CATALOG-UX-01 full-row implementation link markup remains intact", async ({ page }) => {
    const html = await page.request.get(OPETUS).then((r) => r.text());
    const catalog = html.match(/<div class="vstack gap-3" data-opetus-catalog>[\s\S]*?<\/section>/)[0];
    // Full-row interactive anchor
    expect(catalog).toMatch(/<a[^>]*class="list-group-item list-group-item-action[^"]*"[^>]*data-opetus-implementation/);
    // No pill CTA per implementation
    expect(catalog).not.toMatch(/btn btn-primary rounded-pill[\s\S]*?Avaa kurssisivu/);
    // No oversized padding on catalog cards
    expect(catalog).not.toMatch(/data-opetus-course[\s\S]*?p-4 p-lg-5/);
  });
});

test.describe("F. Architecture boundaries preserved", () => {
  test("no runtime JSON fetch introduced", async ({ page }) => {
    const requests = [];
    page.on("request", (req) => {
      if (req.resourceType() === "fetch" || req.resourceType() === "xhr") requests.push(req.url());
    });
    await page.goto(COURSE, { waitUntil: "networkidle" });
    const suspicious = requests.filter((u) => /\/(opetus|course|coursePages|catalog)\b/i.test(u) && /\.json(\?|$)/i.test(u));
    expect(suspicious).toEqual([]);
  });

  test("no synthesized EN teaching route surfaces", async ({ page }) => {
    for (const url of ["/en/opetus/", "/en/teaching/", "/en/opetus/tieto-ja-viestintatekniikka-pedagogisena-tyovalineena/2014-2015-a/"]) {
      const res = await page.request.get(url, { failOnStatusCode: false });
      expect(res.status(), `${url}`).toBeGreaterThanOrEqual(400);
    }
  });
});

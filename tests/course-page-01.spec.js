const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * COURSE-PAGE-01 — 405040Y Teknologiatuettu oppiminen ja työskentely
 * (periodi A, lukuvuosi 2026–2027).
 *
 * Guards:
 *   1. Route /opetus/teknologiatuettu-oppiminen/2026-2027-a/ returns SSR content
 *   2. Course code 405040Y appears
 *   3. Five lecture rows render
 *   4. Known lecture dates + times are present
 *   5. Peppi URL is correct
 *   6. Lecture 1-4 materials link to canonical local /presentations/… landings
 *   7. Canva source URLs are NOT duplicated on the course page as substitutes
 *      for canonical landings (canonical landings must be used when they exist)
 *   8. Kopiosto lecture does NOT appear as a canonical Presentation in the archive
 *   9. Page remains meaningful with JavaScript disabled
 *  10. No runtime JSON fetches introduced
 */

const COURSE_URL = "/opetus/teknologiatuettu-oppiminen/2026-2027-a/";
const CANVA_URLS = [
  "https://canva.link/rd3kruke4i7fzns",
  "https://canva.link/vmsct2fivgoxykk",
  "https://canva.link/666rwb1kr9owlhh",
  "https://canva.link/yrtz7vbd2ofhlwk"
];
const LOCAL_LANDINGS = [
  "/presentations/405040y-luento-1-johdanto-2026-a/",
  "/presentations/405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a/",
  "/presentations/405040y-luento-3-tekoalylukutaito-2026-a/",
  "/presentations/405040y-luento-4-media-ja-informaatiolukutaito-2026-a/"
];

test.describe("Page renders with course identity", () => {
  test("route resolves and contains 405040Y", async ({ page }) => {
    const r = await page.request.get(COURSE_URL);
    expect(r.ok(), `${COURSE_URL} must return 200`).toBeTruthy();
    const html = await r.text();
    expect(html, "course code 405040Y must appear").toContain("405040Y");
    expect(html, "course title must appear").toContain("Teknologiatuettu oppiminen ja työskentely");
    expect(html, "credits must appear").toContain("4 op");
    expect(html, "period + academic year must appear").toContain("periodi A");
    expect(html, "academic year must appear").toMatch(/2026[–-]2027/);
  });

  test("Peppi URL is exactly the supplied Peppi opas URL", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    expect(html, "exact Peppi URL must be linked").toContain(
      "https://opas.peppi.oulu.fi/fi/opintojakso/405040Y/28004?period=2026-2027"
    );
  });
});

test.describe("Lecture schedule (5 lectures)", () => {
  test("five lecture rows render", async ({ page }) => {
    await page.goto(COURSE_URL);
    const rows = await page.locator("[data-course-lecture]").count();
    expect(rows, "exactly 5 lecture rows").toBe(5);
  });

  test("lecture 1 date + time + room are present", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    expect(html).toContain("08:15–10:00");
    expect(html).toContain("L2 Martti Ahtisaari");
    expect(html).toContain("Johdanto");
  });

  test("lecture 3 date/time (12:15) + tekoälylukutaito appear", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    expect(html).toContain("12:15–14:00");
    expect(html).toMatch(/Tekoälylukutaito/);
  });

  test("lecture 5 room IT115 Wetteri + Kopiosto label appear", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    expect(html).toContain("IT115 Wetteri");
    expect(html).toContain("Kopiosto");
  });
});

test.describe("Canonical Presentation integration", () => {
  test("lecture 1-4 materials link to local canonical /presentations/… landings", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    for (const landing of LOCAL_LANDINGS) {
      expect(html, `course page must link to canonical landing ${landing}`).toContain(landing);
    }
  });

  test("canonical landings resolve (return 200)", async ({ page }) => {
    for (const landing of LOCAL_LANDINGS) {
      const r = await page.request.get(landing);
      expect(r.ok(), `canonical Presentation landing ${landing} must resolve`).toBeTruthy();
    }
  });

  test("canva.link source URLs are NOT the material links on the course page", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    for (const canva of CANVA_URLS) {
      expect(html, `course page must NOT expose ${canva} directly`).not.toContain(canva);
    }
  });

  test("canonical Presentation landings expose the Canva source URL (canonical semantics preserved)", async ({ page }) => {
    for (let i = 0; i < LOCAL_LANDINGS.length; i += 1) {
      const html = await page.request.get(LOCAL_LANDINGS[i]).then((r) => r.text());
      expect(html, `landing ${LOCAL_LANDINGS[i]} carries canva URL ${CANVA_URLS[i]}`).toContain(CANVA_URLS[i]);
    }
  });
});

test.describe("Panopto recording links (student-only)", () => {
  const RECORDING_URLS = [
    "https://oulu.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=3c21fa8e-3e26-4ce6-8c7e-b4b10072fab9&start=501.570238",
    "https://oulu.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=b1f5fb3f-0322-4fa9-81b0-b4b80073be05",
    "https://oulu.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=3661d140-99c4-4dda-89cd-b4bb006934a7&start=15.108464",
    "https://oulu.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=849dfd2f-fa80-40d3-82fe-b4bf00790cef",
    "https://oulu.cloud.panopto.eu/Panopto/Pages/Viewer.aspx?id=dde89e81-12d8-4038-b9f2-b4c00071ce5e"
  ];

  test("all five exact Panopto URLs are present on the course page", async ({ page }) => {
    await page.goto(COURSE_URL);
    for (const url of RECORDING_URLS) {
      const link = page.locator(`a[href="${url}"]`);
      await expect(link, `exact Panopto URL must be present: ${url}`).toHaveCount(1);
    }
  });

  test("exactly five recording links rendered", async ({ page }) => {
    await page.goto(COURSE_URL);
    const recordingLinks = await page.locator('a[href*="oulu.cloud.panopto.eu"]').count();
    expect(recordingLinks, "exactly 5 Panopto recording links expected").toBe(5);
  });

  test("recording links are external (target=_blank, rel noopener)", async ({ page }) => {
    await page.goto(COURSE_URL);
    const links = await page.locator('a[href*="oulu.cloud.panopto.eu"]').all();
    for (const link of links) {
      expect(await link.getAttribute("target"), "recording links must open in new tab").toBe("_blank");
      const rel = (await link.getAttribute("rel")) || "";
      expect(rel, "recording links must carry noopener").toContain("noopener");
      expect(rel, "recording links must carry noreferrer").toContain("noreferrer");
    }
  });

  test("recording copy communicates student-only + Oulu login requirement", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    expect(html, "recording note must say student-only").toMatch(/Kurssin opiskelijoille tarkoitettu tallenne/);
    expect(html, "recording note must say Oulu login required").toMatch(/Vaatii Oulun yliopiston kirjautumisen/);
  });

  test("lectures 4 and 5 each expose exactly one Panopto recording", async ({ page }) => {
    await page.goto(COURSE_URL);
    for (const n of [4, 5]) {
      const row = page.locator(`[data-course-lecture][data-lecture-number="${n}"]`);
      const rowRecordingLinks = await row.locator('a[href*="oulu.cloud.panopto.eu"]').count();
      expect(rowRecordingLinks, `lecture ${n} must have exactly one recording link`).toBe(1);
    }
  });
});

test.describe("Lecture 4 and 5 published materials", () => {
  test("lecture 4 routes through its canonical Presentation detail", async ({ page }) => {
    await page.goto(COURSE_URL);
    const row = page.locator('[data-course-lecture][data-lecture-number="4"]');
    // OPETUS-CANVA-THUMBNAILS-01A: two links to the canonical landing per row —
    // one wrapping the preview thumbnail, one the "Avaa esitys" text link.
    await expect(row.locator('a[href="/presentations/405040y-luento-4-media-ja-informaatiolukutaito-2026-a/"]')).toHaveCount(2);
    await expect(row.locator('a[href="https://canva.link/yrtz7vbd2ofhlwk"]')).toHaveCount(0);
  });

  test("lecture 5 notes cover later slides and the recording screen-sharing issue", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    const lecture5 = html.match(/<tr[^>]*data-lecture-number="5"[\s\S]*?<\/tr>/i);
    expect(lecture5, "lecture 5 row must render").not.toBeNull();
    expect(lecture5[0], "lecture 5 must say the guest slides will be published later").toMatch(/diasetti julkaistaan.*saatavilla/i);
    expect(lecture5[0], "lecture 5 must document the initial screen-sharing issue").toMatch(/alkuosassa.*ruudunjaon/i);
  });
});

test.describe("Kopiosto exclusion", () => {
  test("Kopiosto lecture is NOT a canonical Presentation", async ({ page }) => {
    const probe = await page.request.get("/presentations/405040y-luento-5-kopiosto-2026-a/");
    expect(probe.ok(), "Kopiosto lecture must NOT have a canonical Presentation landing").toBeFalsy();
  });

  test("Kopiosto not present in /esitykset/ archive listing", async ({ page }) => {
    const html = await page.request.get("/esitykset/").then((r) => r.text());
    expect(html, "presentation archive must not list a Kopiosto canonical Presentation").not.toMatch(/Kopioston asiantuntijaluento/);
  });
});

test.describe("JS-off and runtime discipline", () => {
  test("page is meaningful with JavaScript disabled", async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(COURSE_URL);
    expect(await page.locator("h1").first().textContent()).toMatch(/Teknologiatuettu oppiminen/);
    const rows = await page.locator("[data-course-lecture]").count();
    expect(rows, "all 5 lecture rows visible without JS").toBe(5);
    const html = await page.content();
    expect(html, "Peppi link present without JS").toContain("opas.peppi.oulu.fi");
    expect(html, "thesis teaser heading present without JS").toContain("Tule tekemään opinnäytteitä näistä aiheista");
    await ctx.close();
  });

  test("no runtime JSON fetches introduced by the course page", async ({ page }) => {
    const jsonRequests = [];
    page.on("request", (req) => {
      const url = req.url();
      if (/\/(data|api)\/.*\.json/.test(url)) jsonRequests.push(url);
    });
    await page.goto(COURSE_URL, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    expect(jsonRequests, `no runtime JSON fetches expected on course page: ${JSON.stringify(jsonRequests)}`).toEqual([]);
  });
});

test.describe("Thesis teaser", () => {
  test("required heading + at least 3 destination links", async ({ page }) => {
    const html = await page.request.get(COURSE_URL).then((r) => r.text());
    expect(html).toContain("Tule tekemään opinnäytteitä näistä aiheista");
    expect(html).toContain("/avainsanat/tekoalylukutaito/");
    expect(html).toContain("/avainsanat/opettajankoulutus/");
    expect(html).toContain("/opinnaytteet/gradut/");
  });
});
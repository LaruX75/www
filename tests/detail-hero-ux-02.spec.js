const { test, expect } = require("@playwright/test");

test.describe.configure({ mode: "serial" });

/*
 * DETAIL-HERO-UX-02 + PRESENTATION-COMPOSITION-01 regressions.
 *
 * Fixes covered:
 *   1. Dirty hero lead root cause. The previous fallback chain in
 *      deriveSlideshareDescription() surfaced first-slide transcript
 *      excerpts as the hero lead when both frontmatter and remote
 *      SlideShare descriptions were generic. On
 *      ss-luento-3-suunnittelu-ja-pedagogiset-mallit-410014y-* the
 *      transcript began with a raw URL list (edu.fi / oph.fi / wordpress),
 *      so the rendered hero lead was a URL dump. The fallback is removed
 *      from BOTH module-local copies (src/_utils/presentationDerivedMetadata.js
 *      and src/_data/presentationsPage.js) and eleventyComputed
 *      description folds "SlideShare-esitys" and empty strings to
 *      undefined so downstream consumers omit the surface rather than
 *      fabricate one from raw transcript.
 *   2. Presentation composition consolidation. The former separate
 *      "Samassa kurssitoteutuksessa" peer section and the
 *      courseImplementationBacklink aside are unified into one
 *      Kurssitoteutus section that carries the course identity via
 *      user-safe labels (courseName + semesterLabel) — never opaque
 *      periodId.
 *   3. Käyttöyhteys card: presentationContextSummary is suppressed
 *      when a verified courseImplementationBacklink exists, so the
 *      same "belongs to course X" fact does not repeat twice.
 *   4. Shared hero opt-in variant `titleMode="compact"` is passed by
 *      Presentation hero to allow smaller responsive typography for
 *      the frequently long imported SlideShare titles. Default
 *      unchanged for every other consumer.
 */

const DIRTY_LUENTO_3 = "/presentations/ss-luento-3-suunnittelu-ja-pedagogiset-mallit-410014y-tieto-ja-viestintatekniikka-p/";
const DIRTY_LUENTO_2 = "/presentations/ss-410014y-luento-2-taman-vuosisadan-ydintaidot-21th-skills-ja-koulun-muutospaineet/";
const GENUINE_LUENTO_1_2013 = "/presentations/ss-luento1-johdanto-410014y-tvt-pedagogiset-perusteet/";
const CURRENT_405040Y = "/presentations/405040y-luento-1-johdanto-2026-a/";

async function fetchHtml(page, url) {
  return page.request.get(url).then((r) => r.text());
}

function heroBlock(html) {
  const m = html.match(/<section class="content-detail-hero[\s\S]*?<\/section>/);
  return m ? m[0] : null;
}

test.describe("A. Dirty hero lead root cause removed", () => {
  test("luento-3 hero no longer renders raw URL-heavy transcript excerpt as lead", async ({ page }) => {
    const html = await fetchHtml(page, DIRTY_LUENTO_3);
    const hero = heroBlock(html);
    expect(hero, "hero section present").not.toBeNull();
    // The specific URL fragments that surfaced from the transcript
    // fallback must not appear in the hero anymore.
    for (const dirtyFragment of [
      "edu.fi/opetustilan_tieto_ja_",
      "oph.fi/download/139848_",
      "oulunopetussuunnitelma.wordpress",
      "liveohje.files.wordpress.com"
    ]) {
      expect(hero, `hero no longer contains "${dirtyFragment}"`).not.toContain(dirtyFragment);
    }
    // The whole content-detail-lead paragraph is omitted when no
    // genuine description exists (rather than filled with fake content).
    expect(hero, "no content-detail-lead paragraph on luento-3").not.toMatch(/<p class="content-detail-lead\b/);
  });

  test("luento-2 hero no longer renders a transcript-derived lead", async ({ page }) => {
    const html = await fetchHtml(page, DIRTY_LUENTO_2);
    const hero = heroBlock(html);
    expect(hero).not.toBeNull();
    expect(hero, "no content-detail-lead on luento-2").not.toMatch(/<p class="content-detail-lead\b/);
  });

  test("genuine curated description (luento 1 johdanto, 2013) is still rendered as hero lead", async ({ page }) => {
    const html = await fetchHtml(page, GENUINE_LUENTO_1_2013);
    const hero = heroBlock(html);
    expect(hero, "hero section present").not.toBeNull();
    expect(hero, "curated lead present").toMatch(/<p class="content-detail-lead\b[\s\S]*?johdantoluento/i);
  });

  test("current 405040Y curated description is preserved as hero lead", async ({ page }) => {
    const html = await fetchHtml(page, CURRENT_405040Y);
    const hero = heroBlock(html);
    expect(hero, "hero section present").not.toBeNull();
    expect(hero, "curated lead present").toMatch(/<p class="content-detail-lead\b[\s\S]*?Opintojakson Teknologiatuettu oppiminen/);
  });
});

test.describe("B. Shared hero opt-in variant `titleMode='compact'`", () => {
  test("Presentation h1 carries content-detail-title--compact scoped class", async ({ page }) => {
    const html = await fetchHtml(page, DIRTY_LUENTO_3);
    expect(html).toMatch(/<h1[^>]*class="content-detail-title content-detail-title--compact mb-3"/);
  });

  test("Media/Blog/Writing/Publication h1 do NOT get the compact class (default preserved)", async ({ page }) => {
    // Spot-check one non-Presentation consumer. If the shared hero
    // accidentally started applying the compact class everywhere, every
    // domain's title would shrink.
    // Use a Publication as the representative other consumer.
    const html = await fetchHtml(page, "/julkaisut/0669729323/");
    if (html.includes("content-detail-title")) {
      expect(html, "Publication title uses default base class only").not.toContain("content-detail-title--compact");
    }
  });
});

test.describe("C. Kurssitoteutus is one coherent section", () => {
  test("current 405040Y renders unified Kurssitoteutus heading + peers + user-safe labels", async ({ page }) => {
    const html = await fetchHtml(page, CURRENT_405040Y);
    // One h2 with id=kurssitoteutus-heading and text "Kurssitoteutus"
    expect(html).toMatch(/<h2[^>]*id="kurssitoteutus-heading"[^>]*>[^<]*Kurssitoteutus[^<]*<\/h2>/);
    // Course identity via user-safe labels
    expect(html).toContain("Teknologiatuettu oppiminen ja työskentely");
    expect(html).toContain("Syyslukukausi 2026");
    // Course backlink CTA
    expect(html).toMatch(/href="\/opetus\/teknologiatuettu-oppiminen\/2026-2027-a\/"[^>]*>[^<]*Avaa kurssisivu/);
    // Peer sub-heading and non-empty peer list
    expect(html).toContain("Muut tämän toteutuksen materiaalit");
    const peerCount = (html.match(/course-peer-item/g) || []).length;
    expect(peerCount, "exactly 3 peers").toBe(3);
    // Never surfaces raw periodId
    expect(html).not.toContain("2026-2027-a</");
    // Section still carries the implementation-mode CSS modifier for
    // downstream style consumers.
    expect(html).toContain("content-detail-course-peers--implementation");
  });

  test("previous separate peer section is gone (only one course-relationship section per page)", async ({ page }) => {
    const html = await fetchHtml(page, CURRENT_405040Y);
    // Only one h2 with id=kurssitoteutus-heading
    const kurssiHeadings = html.match(/id="kurssitoteutus-heading"/g) || [];
    expect(kurssiHeadings.length, "exactly one Kurssitoteutus heading").toBe(1);
    // No leftover "Samassa kurssitoteutuksessa" heading (the old peer
    // section had its own h2 with this text).
    const samassaHeadings = (html.match(/<h2[^>]*>[^<]*Samassa kurssitoteutuksessa[^<]*<\/h2>/g) || []).length;
    expect(samassaHeadings, "no separate Samassa kurssitoteutuksessa heading remains").toBe(0);
  });
});

test.describe("D. Käyttöyhteys does not repeat the course relationship", () => {
  test("presentationContextSummary is suppressed when a verified course implementation backlink exists", async ({ page }) => {
    const html = await fetchHtml(page, CURRENT_405040Y);
    // The Käyttöyhteys support card, if rendered, must not carry an
    // "Opetuskonteksti" dt — that content now lives inside the unified
    // Kurssitoteutus section as courseName + semesterLabel.
    const kayttoCard = html.match(/<p class="content-detail-card-kicker">Käyttöyhteys<\/p>[\s\S]*?<\/div>/);
    if (kayttoCard) {
      expect(kayttoCard[0], "no Opetuskonteksti dt in Käyttöyhteys card").not.toContain("Opetuskonteksti");
    }
  });
});

test.describe("E. Architecture boundaries", () => {
  test("no runtime JSON fetch introduced by the Presentation composition slice", async ({ page }) => {
    const requests = [];
    page.on("request", (req) => {
      if (req.resourceType() === "fetch" || req.resourceType() === "xhr") requests.push(req.url());
    });
    await page.goto(DIRTY_LUENTO_3, { waitUntil: "networkidle" });
    const suspicious = requests.filter((u) => /\/(presentations|course|coursePeer)\b/i.test(u) && /\.json(\?|$)/i.test(u));
    expect(suspicious).toEqual([]);
  });

  test("canonical title text is unchanged on the historical Presentation", async ({ page }) => {
    const html = await fetchHtml(page, DIRTY_LUENTO_3);
    // The full canonical title (from frontmatter) must still appear as
    // the h1 text. We do not shorten or restyle canonical strings.
    expect(html).toMatch(/<h1[^>]*>[^<]*Luento 3\. Suunnittelu ja pedagogiset mallit \(410014Y\)[^<]*<\/h1>/);
  });

  test("no synthesized EN teaching route surfaces", async ({ page }) => {
    for (const url of ["/en/opetus/", "/en/teaching/"]) {
      const res = await page.request.get(url, { failOnStatusCode: false });
      expect(res.status(), `${url}`).toBeGreaterThanOrEqual(400);
    }
  });
});

const { test, expect } = require("@playwright/test");

/*
 * ESITYKSET-DUPLICATES-01 — the FI presentation archive (/esitykset/)
 * must not render two `.presentation-archive-card` articles for the
 * same canonical presentation URL (path-only comparison; query strings
 * are ignored, since cards attach returnTo/returnLabel query params).
 *
 * A known-failure allowlist captures presentation URLs whose root
 * causes are outside this workstream's scope. The list is
 * BIDIRECTIONAL:
 *
 *  - Fails if a NEW duplicate URL appears that is not on the list.
 *  - Fails if a listed URL is NO LONGER duplicated (entry has become
 *    stale — must be removed once the follow-up fixes the underlying
 *    data). This prevents the allowlist from silently outliving its
 *    reason to exist.
 *
 * Each entry: { url, reason, followupDoc, addedAt }.
 */

const KNOWN_FAILURES = [
  {
    url: "/presentations/simo-veso-2024/",
    reason: "Two different Canva designs (i5qAHZkGYqjOGZV + H8tSyhG_9jcwRpr) both project to the same local pageUrl; P2-17 ALTERNATE_REPRESENTATION labels the second as an alternate representation but does not merge the two canonical items.",
    followupDoc: "docs/esitykset-dup-simo-veso-2024-followup-2026-09-12.md",
    addedAt: "2026-09-12"
  },
  {
    url: "/presentations/ss-teknologia-oppiminen-ja-osaaminen-yhteiskunnassa-uudet-teknologiat-isannan-vai-r/",
    reason: "Two different sourceKeys (slideshare + curatedVideos) both project to the same local pageUrl. No curation decision covers this; two canonical items reach the archive.",
    followupDoc: "docs/esitykset-dup-ss-teknologia-followup-2026-09-12.md",
    addedAt: "2026-09-12"
  }
];

test.describe("ESITYKSET-DUPLICATES-01 — no duplicate cards on /esitykset/", () => {
  test("main archive area renders exactly one card per canonical URL (with a bidirectional known-failure list)", async ({ page }) => {
    const html = await page.request.get("/esitykset/").then((r) => r.text());

    // Isolate the main archive from the source-archive (`presentation-service-archive`) blocks.
    const serviceStarts = [];
    const svcRe = /<details[^>]*class="[^"]*presentation-service-archive[^"]*"/g;
    let match;
    while ((match = svcRe.exec(html)) !== null) serviceStarts.push(match.index);

    function findDetailsEnd(source, start) {
      let depth = 0;
      let i = start;
      while (i < source.length) {
        if (source.startsWith("<details", i)) { depth += 1; i += 8; }
        else if (source.startsWith("</details>", i)) {
          depth -= 1; i += 10;
          if (depth === 0) return i;
        } else {
          i += 1;
        }
      }
      return source.length;
    }

    const inside = new Uint8Array(html.length);
    for (const s of serviceStarts) {
      const e = findDetailsEnd(html, s);
      for (let i = s; i < e; i += 1) inside[i] = 1;
    }

    // Extract every archive-card URL from the MAIN archive area.
    const cardRe = /<article class="presentation-archive-card"[^>]*data-presentation-card-url="([^"]*)"/g;
    const seen = [];
    while ((match = cardRe.exec(html)) !== null) {
      if (inside[match.index]) continue;
      const url = match[1];
      if (!url.startsWith("/presentations/")) continue; // ignore external cards
      // Normalise to pathname (strip query string / hash) to compare canonical identity.
      const path = url.split("?")[0].split("#")[0];
      seen.push(path);
    }

    const counts = new Map();
    for (const url of seen) counts.set(url, (counts.get(url) || 0) + 1);

    const duplicates = new Set(
      [...counts.entries()].filter(([, n]) => n > 1).map(([url]) => url)
    );
    const allowlist = new Set(KNOWN_FAILURES.map((f) => f.url));

    const newDuplicates = [...duplicates].filter((u) => !allowlist.has(u)).sort();
    const staleAllowlistEntries = [...allowlist].filter((u) => !duplicates.has(u)).sort();

    expect(
      newDuplicates,
      `New duplicate archive cards on /esitykset/: ${newDuplicates.join(", ")}. Investigate root cause; do NOT add to KNOWN_FAILURES without a follow-up doc.`
    ).toEqual([]);

    expect(
      staleAllowlistEntries,
      `KNOWN_FAILURES entries no longer duplicated on /esitykset/: ${staleAllowlistEntries.join(", ")}. Remove them from KNOWN_FAILURES (their follow-up doc reason is stale).`
    ).toEqual([]);
  });
});

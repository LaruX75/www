/**
 * PRES-YT-DATE-01 — canonical chronology guard for YouTube-backed
 * Presentation MDs.
 *
 * Root defect this test guards against:
 *   `src/presentations/larun-pikkuvinkit.md` shipped without an
 *   explicit frontmatter `date:` field. Eleventy fell back to the
 *   file's mtime when populating the item's canonical date, which
 *   surfaced a Koronakevät-2020 videosarja at the top of any
 *   date-descending Presentation sort as if it were 2026 content.
 *
 * This regression test:
 *   1. asserts every YouTube-backed Presentation MD carries an
 *      explicit YAML `date:` (no mtime fallback allowed),
 *   2. asserts `larun-pikkuvinkit.md` in particular resolves to
 *      calendar-year 2020 chronology (not 2026),
 *   3. does not rely on filesystem timestamps for any assertion.
 *
 * Ref: docs/pres-yt-date-01-youtube-date-reconciliation-2026-08-31.md
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const PRESENTATIONS_DIR = path.join(__dirname, "..", "..", "src", "presentations");

function loadFrontmatter(basename) {
  const filePath = path.join(PRESENTATIONS_DIR, basename);
  const raw = fs.readFileSync(filePath, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---([\s\S]*)$/);
  if (!m) throw new Error(`missing frontmatter in ${basename}`);
  return yaml.load(m[1]) || {};
}

function toIsoDate(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function isYoutubeBacked(fm) {
  const src = String(fm.source || "").toLowerCase();
  const url = String(fm.url || "");
  const sourceUrl = String(fm.sourceUrl || fm.publicUrl || "");
  const rx = /(youtube\.com|youtu\.be)/i;
  return src === "youtube" || rx.test(url) || rx.test(sourceUrl);
}

test("PRES-YT-DATE-01: every YouTube-backed Presentation MD declares an explicit frontmatter date", () => {
  const files = fs.readdirSync(PRESENTATIONS_DIR).filter((f) => f.endsWith(".md"));
  const offenders = [];
  for (const basename of files) {
    const fm = loadFrontmatter(basename);
    if (!isYoutubeBacked(fm)) continue;
    if (!fm.date) {
      offenders.push(basename);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `YouTube-backed Presentation MD(s) missing explicit date: ${offenders.join(", ")}\n` +
      "Missing frontmatter date causes Eleventy to fall back to file mtime as the item's canonical date, " +
      "which can surface old content at the top of date-descending sorts."
  );
});

test("PRES-YT-DATE-01: larun-pikkuvinkit resolves to 2020 chronology, not filesystem year", () => {
  const fm = loadFrontmatter("larun-pikkuvinkit.md");
  const iso = toIsoDate(fm.date);
  assert.equal(iso.length >= 10, true, `date should be a full YYYY-MM-DD, got ${iso}`);
  assert.equal(iso.slice(0, 4), "2020", `larun-pikkuvinkit canonical date must be 2020, got ${iso}`);
  assert.equal(iso, "2020-03-23", `larun-pikkuvinkit canonical date must be 2020-03-23, got ${iso}`);
  assert.equal(fm.source, "youtube", "source must remain YouTube");
  assert.equal(
    fm.url,
    "https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY",
    "sourceUrl must remain the authoritative YouTube playlist entry"
  );
  assert.equal(fm.type, "videosarja");
});

test("PRES-YT-DATE-01: chronology repair does not silently overwrite existing YouTube-backed dates", () => {
  // Any YouTube-backed MD that already had a frontmatter date on 2026-08-30 (before this repair)
  // must still resolve to that same date. This ensures the repair is additive, not mutating.
  const expectations = {
    "avoin-tiede-2021-avoimeen-oppimiseen-ja-opetukseen.md": "2021-04-14",
    "eduxr-2020-suunnanmuutos-digiopettajasta-etaopettajaksi.md": "2020-01-01",
    "lea-hanke-visioita-sahkoisista-oppimisymparistoista.md": "2018-11-19",
    "teknologia-opetuksen-tukena-video-1-keskustelemme-suhteestamme.md": "2020-01-01",
    "tsl-tekoaly-demokratian-ja-sivistyksen-tukena-paneelikeskustelu-2024.md": "2024-11-07"
  };
  for (const [basename, expectedIso] of Object.entries(expectations)) {
    const fm = loadFrontmatter(basename);
    const iso = toIsoDate(fm.date);
    assert.equal(iso, expectedIso, `${basename}: expected date ${expectedIso}, got ${iso}`);
  }
});

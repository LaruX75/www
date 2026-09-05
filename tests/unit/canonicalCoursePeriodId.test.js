const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const REPO = path.resolve(__dirname, "..", "..");
const PRESENTATIONS_DIR = path.join(REPO, "src/presentations");
const OPETUS_DIR = path.join(REPO, "src/opetus");

const {
  parseCoursePagePeriodIds,
  parsePresentationCourseContexts,
  readFrontmatter
} = require(path.join(REPO, "scripts/validate-course-period-id.js"));

/*
 * CANONICAL-COURSE-PERIODID-01 regression tests.
 *
 * Verify the additive canonical extension:
 *   `courseContexts[].periodId` is OPTIONAL.
 *   Absence is meaningful ("course-level membership only; specific
 *   implementation not known canonically").
 *   The 3 verified 405040Y luento files carry exactly periodId
 *   "2026-2027-a". No other Presentation carries a periodId.
 *   No inference from date, title, URL slug, topic, category,
 *   Pagefind, Content Graph, or filename.
 */

function readAllPresentationContexts() {
  const files = fs.readdirSync(PRESENTATIONS_DIR).filter((f) => f.endsWith(".md"));
  return files.map((file) => {
    const fm = readFrontmatter(path.join(PRESENTATIONS_DIR, file));
    if (!fm) return { file, contexts: [] };
    return { file, contexts: parsePresentationCourseContexts(fm) };
  });
}

describe("CANONICAL-COURSE-PERIODID-01: 405040Y frontmatter carries periodId", () => {
  const expectedFiles = new Set([
    "405040y-luento-1-johdanto-2026-a.md",
    "405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.md",
    "405040y-luento-3-tekoalylukutaito-2026-a.md"
  ]);

  for (const filename of expectedFiles) {
    test(`${filename} carries courseId=405040Y AND periodId="2026-2027-a"`, () => {
      const fm = readFrontmatter(path.join(PRESENTATIONS_DIR, filename));
      assert.ok(fm, `frontmatter present in ${filename}`);
      const contexts = parsePresentationCourseContexts(fm);
      const has405040Y = contexts.find((c) => c.courseId === "405040Y");
      assert.ok(has405040Y, `courseContexts contains courseId=405040Y in ${filename}`);
      assert.equal(
        has405040Y.periodId,
        "2026-2027-a",
        `${filename} carries periodId="2026-2027-a" on the 405040Y context`
      );
    });
  }
});

describe("CANONICAL-COURSE-PERIODID-01: absence is meaningful (no inference)", () => {
  test("only the three 405040Y luento files carry periodId; all other Presentations have periodId absent (null)", () => {
    const all = readAllPresentationContexts();
    const withPeriodId = [];
    const withoutPeriodId = [];
    for (const { file, contexts } of all) {
      for (const ctx of contexts) {
        if (ctx.periodId) withPeriodId.push({ file, courseId: ctx.courseId, periodId: ctx.periodId });
        else withoutPeriodId.push({ file, courseId: ctx.courseId });
      }
    }
    // Exactly three periodId-carrying entries expected (405040Y luento 1–3).
    assert.equal(withPeriodId.length, 3, "exactly 3 presentation courseContexts entries carry periodId");
    const filesWithPeriodId = new Set(withPeriodId.map((e) => e.file));
    assert.deepEqual(
      Array.from(filesWithPeriodId).sort(),
      [
        "405040y-luento-1-johdanto-2026-a.md",
        "405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.md",
        "405040y-luento-3-tekoalylukutaito-2026-a.md"
      ]
    );
    // Every periodId-carrying entry uses "2026-2027-a" (single implementation).
    for (const e of withPeriodId) {
      assert.equal(e.periodId, "2026-2027-a", `periodId is 2026-2027-a for ${e.file}`);
    }
    // Legacy courseContexts (410014Y / 410017Y / others) MUST remain periodId-less.
    // At least a few well-known legacy entries confirmed:
    const legacyCourseIds = new Set(["410014Y", "410017Y"]);
    let legacyChecked = 0;
    for (const e of withoutPeriodId) {
      if (legacyCourseIds.has(e.courseId)) legacyChecked++;
    }
    assert.ok(
      legacyChecked > 10,
      `sanity: many legacy 410014Y/410017Y contexts remain periodId-less (got ${legacyChecked})`
    );
  });

  test("410014Y receives no inferred periodId", () => {
    const all = readAllPresentationContexts();
    for (const { file, contexts } of all) {
      for (const ctx of contexts) {
        if (ctx.courseId === "410014Y") {
          assert.equal(
            ctx.periodId,
            null,
            `410014Y in ${file} must NOT have periodId inferred`
          );
        }
      }
    }
  });

  test("410017Y receives no inferred periodId", () => {
    const all = readAllPresentationContexts();
    for (const { file, contexts } of all) {
      for (const ctx of contexts) {
        if (ctx.courseId === "410017Y") {
          assert.equal(
            ctx.periodId,
            null,
            `410017Y in ${file} must NOT have periodId inferred`
          );
        }
      }
    }
  });
});

describe("CANONICAL-COURSE-PERIODID-01: Kempele exclusion invariant preserved", () => {
  test("kempele-veso-2026.md has NO courseContexts (unchanged by this workstream)", () => {
    const fm = readFrontmatter(path.join(PRESENTATIONS_DIR, "kempele-veso-2026.md"));
    assert.ok(fm, "kempele frontmatter present");
    const contexts = parsePresentationCourseContexts(fm);
    assert.equal(contexts.length, 0, "Kempele carries no courseContexts");
  });
});

describe("CANONICAL-COURSE-PERIODID-01: public JSON / JSON-LD / Pagefind projections stay unchanged", () => {
  const SITE_ROOT = path.join(REPO, "_site");

  test("Public JSON /data/presentations-page.json does NOT expose periodId", () => {
    const jsonPath = path.join(SITE_ROOT, "data/presentations-page.json");
    if (!fs.existsSync(jsonPath)) {
      // If the site hasn't been built, skip — build+unit are separate pipelines.
      // This assertion is meaningful only after a full build.
      return;
    }
    const raw = fs.readFileSync(jsonPath, "utf8");
    assert.ok(
      !/\"periodId\"/.test(raw),
      "public /data/presentations-page.json MUST NOT include periodId (internal-only canonical field)"
    );
    // Sanity: courseContexts is still projected (unchanged behavior).
    assert.ok(
      /\"courseContexts\"/.test(raw),
      "public JSON continues to project courseContexts array (unchanged shape)"
    );
  });

  test("Rendered 405040Y presentation HTML does NOT include periodId in the DOM (no unintended public exposure)", () => {
    const htmlPath = path.join(SITE_ROOT, "presentations/405040y-luento-1-johdanto-2026-a/index.html");
    if (!fs.existsSync(htmlPath)) return; // requires prior build
    const html = fs.readFileSync(htmlPath, "utf8");
    assert.ok(
      !/periodId/.test(html),
      "Presentation detail HTML MUST NOT surface periodId (not projected to Pagefind meta, JSON-LD, or visible copy)"
    );
    // Sanity: the presentation still declares its 405040Y course context in the DOM
    // (through Käyttöyhteys card rendering — courseName reaches the user).
    assert.ok(
      /Teknologiatuettu oppiminen ja työskentely/.test(html),
      "course context still surfaces through existing rendering (courseName)"
    );
  });
});

describe("CANONICAL-COURSE-PERIODID-01: validator cross-check matches course-page authority", () => {
  test("405040Y course page frontmatter defines the periodId that Presentation frontmatters reference", () => {
    const coursePagePeriods = parseCoursePagePeriodIds();
    const knownForCourse = coursePagePeriods.get("405040Y");
    assert.ok(knownForCourse, "course page(s) exist for courseId=405040Y under src/opetus/");
    assert.ok(
      knownForCourse.has("2026-2027-a"),
      `course page(s) declare periodId="2026-2027-a" for 405040Y; presentations must match`
    );
  });

  test("validator reports zero cross-check warnings for the current repo state", () => {
    // Reuses the same logic as scripts/validate-course-period-id.js CLI.
    // If a presentation ships with periodId and no course page confirms it,
    // this test fails — protects against silent unverifiable additions.
    const coursePagePeriods = parseCoursePagePeriodIds();
    const all = readAllPresentationContexts();
    const warnings = [];
    for (const { file, contexts } of all) {
      for (const ctx of contexts) {
        if (!ctx.periodId) continue;
        const known = coursePagePeriods.get(ctx.courseId);
        if (!known) {
          warnings.push(`${file}: courseId=${ctx.courseId} periodId=${ctx.periodId} has no course page for cross-check`);
        } else if (!known.has(ctx.periodId)) {
          warnings.push(`${file}: courseId=${ctx.courseId} periodId=${ctx.periodId} does not match any course page (known: ${Array.from(known).join(", ")})`);
        }
      }
    }
    assert.equal(warnings.length, 0, `expected zero validator warnings, got:\n${warnings.join("\n")}`);
  });
});

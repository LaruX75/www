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
 *   A periodId is valid only when its (courseId, periodId) tuple is
 *   confirmed by canonical course-page frontmatter.
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

describe("CANONICAL-COURSE-PERIODID-01: verified 405040Y implementations carry exact periodIds", () => {
  const expectedFiles = new Map([
    ["405040y-luento-1-johdanto-2026-a.md", "2026-2027-a"],
    ["405040y-luento-2-digitaalinen-osaaminen-digcomp-2026-a.md", "2026-2027-a"],
    ["405040y-luento-3-tekoalylukutaito-2026-a.md", "2026-2027-a"],
    ["405040y-luento-4-media-ja-informaatiolukutaito-2026-a.md", "2026-2027-a"],
    ["405040y-luento-1-johdanto-2026-b.md", "2025-2026-b"],
    ["405040y-luento-2-digitaalinen-osaaminen-2026-b.md", "2025-2026-b"],
    ["405040y-luento-3-ohjelmointiosaaminen-2026-b.md", "2025-2026-b"],
    ["405040y-luento-4-medialukutaito-2026-b.md", "2025-2026-b"]
  ]);

  for (const [filename, periodId] of expectedFiles) {
    test(`${filename} carries courseId=405040Y AND periodId="${periodId}"`, () => {
      const fm = readFrontmatter(path.join(PRESENTATIONS_DIR, filename));
      assert.ok(fm, `frontmatter present in ${filename}`);
      const contexts = parsePresentationCourseContexts(fm);
      const has405040Y = contexts.find((c) => c.courseId === "405040Y");
      assert.ok(has405040Y, `courseContexts contains courseId=405040Y in ${filename}`);
      assert.equal(
        has405040Y.periodId,
        periodId,
        `${filename} carries periodId="${periodId}" on the 405040Y context`
      );
    });
  }
});

describe("CANONICAL-COURSE-PERIODID-01: absence is meaningful (no inference)", () => {
  test("legacy contexts can remain periodId-less without inference", () => {
    const all = readAllPresentationContexts();
    const withoutPeriodId = [];
    for (const { file, contexts } of all) {
      for (const ctx of contexts) {
        if (!ctx.periodId) withoutPeriodId.push({ file, courseId: ctx.courseId });
      }
    }
    assert.ok(
      withoutPeriodId.some((entry) => entry.courseId === "410017Y"),
      "legacy 410017Y contexts remain periodId-less when exact implementation evidence is absent"
    );
  });

  test("410014Y allows curated implementation contexts and period-less legacy contexts", () => {
    const all = readAllPresentationContexts();
    let curated = 0;
    let legacy = 0;
    for (const { file, contexts } of all) {
      for (const ctx of contexts) {
        if (ctx.courseId === "410014Y") {
          if (ctx.periodId) curated++;
          else legacy++;
        }
      }
    }
    assert.ok(curated > 0, "explicitly curated 410014Y implementation contexts are allowed");
    assert.ok(legacy > 0, "period-less 410014Y legacy contexts remain meaningful");
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
  test("405040Y course pages define both verified implementation periodIds", () => {
    const coursePagePeriods = parseCoursePagePeriodIds();
    const knownForCourse = coursePagePeriods.get("405040Y");
    assert.ok(knownForCourse, "course page(s) exist for courseId=405040Y under src/opetus/");
    assert.ok(knownForCourse.has("2026-2027-a"), "405040Y autumn implementation is canonical");
    assert.ok(knownForCourse.has("2025-2026-b"), "405040Y spring implementation is canonical");
  });

  test("every explicit periodId references an authoritative course implementation", () => {
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

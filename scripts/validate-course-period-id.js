#!/usr/bin/env node
/*
 * CANONICAL-COURSE-PERIODID-01 validation helper.
 *
 * Cross-checks Presentation `courseContexts[].periodId` against the
 * corresponding course-page frontmatter `course.periodId`. Warning-only:
 * exit code is always 0. Never mutates data. Never infers periodId.
 *
 * Rule:
 *   For each Presentation courseContexts[] entry that carries `periodId`,
 *   if a course page (src/opetus/*.md) exists with the same `courseId`,
 *   the Presentation's `periodId` MUST match one of the course-page
 *   frontmatters' `course.periodId` for that courseId.
 *
 * Records without periodId are always valid (absence is meaningful).
 *
 * Usage:
 *   node scripts/validate-course-period-id.js
 */

const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const PRESENTATIONS_DIR = path.join(REPO, "src/presentations");
const OPETUS_DIR = path.join(REPO, "src/opetus");

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return null;
  return raw.slice(3, end);
}

function parseCoursePagePeriodIds() {
  // Map<courseId, Set<periodId>>
  const byCourse = new Map();
  if (!fs.existsSync(OPETUS_DIR)) return byCourse;
  const files = fs.readdirSync(OPETUS_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const fm = readFrontmatter(path.join(OPETUS_DIR, file));
    if (!fm) continue;
    // Extract course.courseId + course.periodId from YAML (regex-based; the
    // course page frontmatter uses the flat "course:\n  courseId: X\n  periodId: Y"
    // convention).
    const courseIdMatch = fm.match(/^\s{2}courseId:\s*([^\s]+)/m);
    const periodIdMatch = fm.match(/^\s{2}periodId:\s*"?([^\s"]+)"?/m);
    if (!courseIdMatch || !periodIdMatch) continue;
    const cid = courseIdMatch[1].trim();
    const pid = periodIdMatch[1].trim();
    if (!byCourse.has(cid)) byCourse.set(cid, new Set());
    byCourse.get(cid).add(pid);
  }
  return byCourse;
}

function parsePresentationCourseContexts(fm) {
  // Return array of { courseId, periodId | null }
  const contexts = [];
  const ccStart = fm.indexOf("\ncourseContexts:");
  if (ccStart < 0) return contexts;
  // Take the block until next top-level key or end of frontmatter
  const tail = fm.slice(ccStart + 1);
  const nextTopKeyMatch = tail.slice("courseContexts:".length).match(/^\S/m);
  const block = nextTopKeyMatch
    ? tail.slice(0, "courseContexts:".length + nextTopKeyMatch.index)
    : tail;
  // Each list item starts with "  - "; split
  const items = block.split(/^\s{2}-\s+/m).slice(1);
  for (const item of items) {
    const courseIdMatch = item.match(/^\s*courseId:\s*"?([^\s"]+)"?/m);
    const periodIdMatch = item.match(/^\s{4}periodId:\s*"?([^\s"]+)"?/m);
    if (!courseIdMatch) continue;
    contexts.push({
      courseId: courseIdMatch[1].trim(),
      periodId: periodIdMatch ? periodIdMatch[1].trim() : null
    });
  }
  return contexts;
}

function main() {
  const coursePagePeriods = parseCoursePagePeriodIds();
  let warnings = 0;
  let checked = 0;
  const files = fs.readdirSync(PRESENTATIONS_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const fm = readFrontmatter(path.join(PRESENTATIONS_DIR, file));
    if (!fm) continue;
    const contexts = parsePresentationCourseContexts(fm);
    for (const ctx of contexts) {
      if (!ctx.periodId) continue; // absence is valid
      checked++;
      const knownPeriodsForCourse = coursePagePeriods.get(ctx.courseId);
      if (!knownPeriodsForCourse) {
        console.warn(
          `[periodId] ${file}: courseId="${ctx.courseId}" periodId="${ctx.periodId}" — no course page found under src/opetus/ for this courseId. Cannot verify.`
        );
        warnings++;
        continue;
      }
      if (!knownPeriodsForCourse.has(ctx.periodId)) {
        const knownList = Array.from(knownPeriodsForCourse).join(", ") || "(none)";
        console.warn(
          `[periodId] ${file}: courseId="${ctx.courseId}" periodId="${ctx.periodId}" does not match any course-page periodId for this courseId. Known: ${knownList}`
        );
        warnings++;
      }
    }
  }
  console.log(
    `[periodId] Checked ${checked} presentation courseContexts entries with periodId. Warnings: ${warnings}. Exit code: 0 (warning-only).`
  );
  // Always exit 0 — this is a validator, not a gate.
  process.exit(0);
}

if (require.main === module) main();

module.exports = {
  parseCoursePagePeriodIds,
  parsePresentationCourseContexts,
  readFrontmatter
};

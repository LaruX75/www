/**
 * COURSE-RELATION-UX-01: build-time reverse-lookup for course-implementation
 * pages. Indexes `src/opetus/<slug>-<periodId>.md` frontmatters by
 * `(courseId, periodId)` so a Presentation carrying canonical
 * `courseContexts[].periodId` can resolve its direct course-implementation
 * relationship without runtime JSON, Pagefind, browser inference, or a
 * new canonical Course entity. Frontmatter is the authoritative source.
 *
 * Emits build-time console warnings for:
 *   - duplicate (courseId, periodId) → multiple course pages claim the
 *     same implementation identity. Uniqueness is expected.
 *   - malformed frontmatter (missing courseId or periodId inside `course:`).
 *
 * No hard failure: warnings only, mirroring
 * scripts/validate-course-period-id.js convention.
 */

const fs = require("fs");
const path = require("path");

const OPETUS_DIR = path.resolve(__dirname, "..", "opetus");

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return null;
  return raw.slice(3, end);
}

// Minimal YAML value readers scoped to the `course:` block shape used by
// existing course-implementation pages. Not a general YAML parser.
function extractCourseField(fm, fieldName) {
  const match = fm.match(new RegExp(`^\\s{2}${fieldName}:\\s*"?([^\\s"]+)"?\\s*$`, "m"));
  return match ? match[1].trim() : "";
}

function extractCourseStringField(fm, fieldName) {
  const match = fm.match(new RegExp(`^\\s{2}${fieldName}:\\s*(.+?)\\s*$`, "m"));
  if (!match) return "";
  const raw = match[1].trim();
  return raw.replace(/^"(.*)"$/, "$1").trim();
}

function extractTopLevelPermalink(fm) {
  const match = fm.match(/^permalink:\s*(.+?)\s*$/m);
  return match ? match[1].trim() : "";
}

function parseCoursePage(filePath) {
  const fm = readFrontmatter(filePath);
  if (!fm) return null;
  const courseId = extractCourseField(fm, "courseId");
  const periodId = extractCourseField(fm, "periodId");
  const pageUrl = extractTopLevelPermalink(fm);
  if (!courseId || !periodId || !pageUrl) return null;
  return {
    courseId,
    periodId,
    pageUrl,
    courseName: extractCourseStringField(fm, "courseName") || courseId,
    semesterLabel: extractCourseStringField(fm, "semesterLabel") || "",
    period: extractCourseField(fm, "period") || "",
    lang: extractCourseStringField(fm, "lang") || "fi"
  };
}

function buildCoursePagesIndex() {
  const entries = [];
  if (!fs.existsSync(OPETUS_DIR)) {
    return { byCourseAndPeriod: {}, all: [] };
  }
  const files = fs.readdirSync(OPETUS_DIR).filter((f) => f.endsWith(".md"));
  for (const file of files) {
    const parsed = parseCoursePage(path.join(OPETUS_DIR, file));
    if (!parsed) continue;
    entries.push({ file, ...parsed });
  }

  // Uniqueness invariant: one (courseId, periodId) → one course page.
  const byKey = Object.create(null);
  for (const entry of entries) {
    const key = `${entry.courseId}::${entry.periodId}`;
    if (byKey[key]) {
      console.warn(
        `[coursePages] duplicate (courseId, periodId) identity: "${entry.courseId} / ${entry.periodId}" claimed by both "${byKey[key].file}" and "${entry.file}". Uniqueness expected; using first occurrence.`
      );
      continue;
    }
    byKey[key] = entry;
  }

  return {
    // Serializable shape — Eleventy _data files are JSON-serialised into
    // the data cascade. Cannot expose a live Map here.
    byCourseAndPeriod: byKey,
    all: Object.values(byKey)
  };
}

module.exports = buildCoursePagesIndex();
module.exports.buildCoursePagesIndex = buildCoursePagesIndex;

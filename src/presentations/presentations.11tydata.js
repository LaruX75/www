const { resolveContexts } = require("../_data/contentContext");
const teachingUnits = require("../_data/teachingUnits");
const { buildCanonicalPresentationPageLookup } = require("../_data/presentationsPage");

let presentationLookup = null;

const EVIDENCE_PRIORITY = {
  strong: 4,
  contextual: 2
};

const LINK_TYPE_PRIORITY = {
  explicit_course_code: 4,
  explicit_course_name: 3,
  probable_legacy_course_material: 2,
  possible_reuse_of_course_material: 1,
  contextual_topic_or_pathway: 0
};

function getPresentationRecord(data) {
  const pageUrl = data?.page?.url;
  if (!pageUrl) return null;
  if (!presentationLookup) {
    presentationLookup = buildCanonicalPresentationPageLookup(data);
  }
  return presentationLookup.get(pageUrl) || null;
}

function getPresentationCourseContexts(data) {
  const recordContexts = getPresentationRecord(data)?.courseContexts;
  if (Array.isArray(recordContexts)) return recordContexts;
  return Array.isArray(data?.courseContexts) ? data.courseContexts : [];
}

function getPrimaryCourseContext(courseContexts = []) {
  if (!Array.isArray(courseContexts) || !courseContexts.length) return null;

  return [...courseContexts].sort((a, b) => {
    const evidenceDiff =
      (EVIDENCE_PRIORITY[b?.evidenceLevel] || 0) - (EVIDENCE_PRIORITY[a?.evidenceLevel] || 0);
    if (evidenceDiff !== 0) return evidenceDiff;

    const linkTypeDiff =
      (LINK_TYPE_PRIORITY[b?.linkType] || 0) - (LINK_TYPE_PRIORITY[a?.linkType] || 0);
    if (linkTypeDiff !== 0) return linkTypeDiff;

    return String(a?.courseName || "").localeCompare(String(b?.courseName || ""));
  })[0];
}

function formatCourseContextSummary(courseContext) {
  if (!courseContext) return undefined;

  const label = [courseContext.courseId, courseContext.courseName].filter(Boolean).join(" ");
  if (!label) return undefined;

  if (
    courseContext.linkType === "explicit_course_code"
    || courseContext.linkType === "explicit_course_name"
  ) {
    return `Liittyy opintojaksoon ${label}`;
  }

  if (courseContext.linkType === "probable_legacy_course_material") {
    return `Todennäköisesti vanhaa kurssimateriaalia: ${label}`;
  }

  if (courseContext.linkType === "possible_reuse_of_course_material") {
    return `Mahdollisesti uudelleenkäytettyä kurssimateriaalia: ${label}`;
  }

  if (courseContext.linkType === "contextual_topic_or_pathway") {
    return `Kytkeytyy opetuskontekstiin: ${label}`;
  }

  return `Opintojaksokonteksti: ${label}`;
}

function teachingUnitLabelFor(value) {
  if (value === teachingUnits.OK) return "Opettajankoulutus";
  if (value === teachingUnits.LET) return "Learning and Educational Technology (LET)";
  return undefined;
}

module.exports = {
    tags: "presentations",
    lang: "fi",
    eleventyComputed: {
        layout: () => "presentation-item.njk",
        description: (data) => getPresentationRecord(data)?.description,
        categories: (data) => getPresentationRecord(data)?.categories,
        keywords: (data) => getPresentationRecord(data)?.keywords,
        source: (data) => getPresentationRecord(data)?.source || data.source,
        // DETAIL-UX-01C: route thumbnail through the canonical projection
        // so the detail page picks up locally-hosted Canva thumbnails
        // (/images/canva-thumbnails/…) instead of the raw stale
        // `design.canva.ai/*` URLs some frontmatter still carries.
        // Falls back to frontmatter thumbnail when the projection has none.
        thumbnail: (data) => getPresentationRecord(data)?.thumbnail || data.thumbnail,
        courseContexts: (data) => getPresentationCourseContexts(data),
        sourceLanguage: (data) => getPresentationRecord(data)?.sourceLanguage,
        slideCount: (data) => getPresentationRecord(data)?.slideCount,
        viewCount: (data) => getPresentationRecord(data)?.viewCount,
        contexts: (data) => resolveContexts(data),
        declaredContexts: (data) => getPresentationRecord(data)?.declaredContexts || [],
        primaryCourseContext: (data) => getPrimaryCourseContext(getPresentationCourseContexts(data)) || undefined,
        presentationContextSummary: (data) =>
          formatCourseContextSummary(getPrimaryCourseContext(getPresentationCourseContexts(data))),
        // Yksikko-mappaus: courseContexts.courseId -> "opettajankoulutus" | "let"
        // Nayttaa nollaksi jos courseId:ta ei ole tunnistettu (esim. konferenssi,
        // vierailuluento). Ei aseteta arvoa jos ei mappausta, jotta
        // toPublicContentRecord ei sisallyta kenttaa JSON:iin.
        teachingUnit: (data) => teachingUnits.fromCourseContexts(getPresentationCourseContexts(data)) || undefined,
        teachingUnitLabel: (data) =>
          teachingUnitLabelFor(teachingUnits.fromCourseContexts(getPresentationCourseContexts(data)))
    }
};

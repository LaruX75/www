const { resolveContexts } = require("../_data/contentContext");
const teachingUnits = require("../_data/teachingUnits");
const { buildCanonicalPresentationPageLookup } = require("../_data/presentationsPage");
const coursePagesIndex = require("../_data/coursePages");

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

// DETAIL-UX-01C-B-COURSE: build-time canonical selector for peer
// presentations that share at least one courseId with the current
// presentation via canonical `courseContexts[].courseId`. Deterministic:
// same-course peers sorted by date DESC (newer lectures first), then
// title ASC for stability. Excludes the current URL. Caller-side hard
// cap. Returns [] when the current presentation has no courseContexts
// or no other presentation shares its courseId.
const PEER_LIMIT = 6;

function collectCourseIds(courseContexts = []) {
  return Array.from(new Set(
    (Array.isArray(courseContexts) ? courseContexts : [])
      .map((c) => c && c.courseId)
      .filter(Boolean)
  ));
}

// COURSE-RELATION-UX-01: adaptive peer selection.
//
//   If current Presentation has a courseContexts item carrying BOTH
//   courseId + periodId, peers MUST share BOTH the same courseId AND the
//   same periodId (implementation-scoped). Peers where the matching
//   courseId is missing a periodId — or carries a different periodId —
//   are excluded. Rationale: canonical `periodId` identifies a specific
//   course implementation; mixing periodId-less or foreign-period peers
//   under an implementation-scoped heading would misattribute material.
//
//   If current Presentation only carries courseId (no periodId), peers
//   fall back to courseId-only matching — the DETAIL-UX-01C-B-COURSE
//   behavior. Copy is dispatched by the returned `mode` so the template
//   can render cautious cross-implementation phrasing.
//
//   periodId is NEVER inferred from date, title, URL slug, filename,
//   topic, category, Pagefind, or Content Graph. Frontmatter is the
//   only authority (per CANONICAL-COURSE-PERIODID-01).
//
// Returns:
//   {
//     mode: "implementation" | "course-fallback",
//     courseId: string | null,
//     periodId: string | null,        // null in fallback mode
//     courseName: string,
//     peers: [{ url, title, date, courseId, courseName, periodId }]
//   }
function selectCoursePeerRelation(data) {
  const empty = { mode: "course-fallback", courseId: null, periodId: null, courseName: "", peers: [] };
  const currentUrl = data?.page?.url;
  if (!currentUrl) return empty;
  const currentContexts = getPresentationCourseContexts(data);
  if (!currentContexts.length) return empty;

  // Prefer the primary course-context (evidence + linkType priority) as
  // the anchor for peer scope. If it carries periodId, we run in
  // implementation-scoped mode; otherwise fallback to courseId-only.
  const primary = getPrimaryCourseContext(currentContexts) || currentContexts[0];
  const anchorCourseId = primary?.courseId || null;
  const anchorPeriodId = primary?.periodId || null;
  if (!anchorCourseId) return empty;

  const mode = anchorPeriodId ? "implementation" : "course-fallback";

  if (!presentationLookup) {
    presentationLookup = buildCanonicalPresentationPageLookup(data);
  }

  const peers = [];
  presentationLookup.forEach((record, pageUrl) => {
    if (!record || pageUrl === currentUrl) return;
    const peerContexts = Array.isArray(record.courseContexts) ? record.courseContexts : [];
    let match = null;
    if (mode === "implementation") {
      // Strict: same courseId AND same periodId (both known).
      match = peerContexts.find((c) => c && c.courseId === anchorCourseId && c.periodId === anchorPeriodId) || null;
    } else {
      // Fallback: courseId only. Accepts peers with or without periodId.
      match = peerContexts.find((c) => c && c.courseId === anchorCourseId) || null;
    }
    if (!match) return;
    peers.push({
      url: pageUrl,
      title: record.title || "",
      date: record.date || "",
      courseId: match.courseId,
      courseName: match.courseName || "",
      periodId: match.periodId || null
    });
  });

  peers.sort((a, b) => {
    const dateDiff = String(b.date).localeCompare(String(a.date));
    if (dateDiff !== 0) return dateDiff;
    return String(a.title).localeCompare(String(b.title), "fi");
  });

  return {
    mode,
    courseId: anchorCourseId,
    periodId: anchorPeriodId,
    courseName: primary.courseName || "",
    peers: peers.slice(0, PEER_LIMIT)
  };
}

// Backwards-compatible shim: existing DETAIL-UX-01C-B-COURSE test
// (`tests/detail-ux-01c-b-course.spec.js`) reads
// `peerPresentationsByCourse` as a flat array. Keep the flat array
// available as before; expose the full relation object separately.
function selectPeerPresentationsByCourse(data) {
  return selectCoursePeerRelation(data).peers;
}

// COURSE-RELATION-UX-01: direct canonical relationship — Presentation →
// its local course-implementation page. Only rendered when BOTH
// canonical anchors are present on the current item AND the coursePages
// build-time index has an entry for exactly that (courseId, periodId).
// Never inferred. Never derived from date/title/URL. Language-switch
// trap avoidance: the returned entry carries `lang`; the template MAY
// suppress rendering when locales do not agree.
function resolveCourseImplementationBacklink(data) {
  const contexts = getPresentationCourseContexts(data);
  if (!contexts.length) return null;
  const primary = getPrimaryCourseContext(contexts) || contexts[0];
  const courseId = primary?.courseId;
  const periodId = primary?.periodId;
  if (!courseId || !periodId) return null;
  const key = `${courseId}::${periodId}`;
  const entry = coursePagesIndex.byCourseAndPeriod && coursePagesIndex.byCourseAndPeriod[key];
  if (!entry) return null;
  return {
    pageUrl: entry.pageUrl,
    courseId: entry.courseId,
    periodId: entry.periodId,
    courseName: entry.courseName,
    semesterLabel: entry.semesterLabel,
    period: entry.period,
    lang: entry.lang || "fi"
  };
}

module.exports = {
    tags: "presentations",
    lang: "fi",
    eleventyComputed: {
        layout: () => "presentation-item.njk",
        // PRESENTATION-COMPOSITION-01: fold the "no genuine description
        // available" case (empty or placeholder "SlideShare-esitys") to
        // null so downstream consumers omit their description surface
        // rather than render placeholder text. This complements the
        // getSlideshareDescription() change in presentationsPage.js
        // that stopped falling back to raw transcript excerpts.
        //   • Presentation hero lead is skipped (detail-hero.njk :78)
        //   • `<meta name="description">` and OG/Twitter description in
        //     _meta.njk fall back to the site description
        //   • JSON-LD description falls back to the site description
        //   • Pagefind indexing remains unchanged: it reads the
        //     rendered HTML, not this eleventyComputed value.
        description: (data) => {
          const raw = String(getPresentationRecord(data)?.description || "").trim();
          if (!raw) return undefined;
          const normalized = raw.toLowerCase();
          if (normalized === "slideshare-esitys" || normalized === "slideshare presentation" || normalized === "." || normalized === "-") {
            return undefined;
          }
          return raw;
        },
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
          teachingUnitLabelFor(teachingUnits.fromCourseContexts(getPresentationCourseContexts(data))),
        // DETAIL-UX-01C-B-COURSE: build-time peer list for the
        // "Samalla kurssilla" SSR section on presentation-item.njk.
        // Uses canonical courseContexts[].courseId directly — no
        // Content Graph traversal, no browser JS, no similarity
        // heuristics. Empty array when no peers exist.
        peerPresentationsByCourse: (data) => selectPeerPresentationsByCourse(data),
        // COURSE-RELATION-UX-01: adaptive peer relation object.
        // Returns { mode, courseId, periodId, courseName, peers } so
        // the template can dispatch implementation-scoped heading/copy
        // vs. course-level fallback copy. `mode` is one of
        // "implementation" (peers share courseId + periodId) or
        // "course-fallback" (current item lacks periodId; peers match
        // courseId only, template must render cross-implementation
        // ambiguity copy).
        coursePeerRelation: (data) => selectCoursePeerRelation(data),
        // COURSE-RELATION-UX-01: direct canonical relationship
        // backlink to the local course-implementation page. Resolved
        // only when current item has BOTH courseId + periodId AND a
        // course page exists for that exact (courseId, periodId) key
        // in the coursePagesIndex build-time lookup. Never inferred.
        // Returns null when no verifiable local course page matches.
        courseImplementationBacklink: (data) => resolveCourseImplementationBacklink(data),
        // Kempele semantic verification: route three independent
        // Canonical Content v1 §3 type-specific fields from the
        // canonical Canva projection to the detail template so the
        // three semantics never conflate.
        //   Paikka        = geographic place        (`location`)
        //   Käyttöyhteys  = usage-context type      (`kategoria`)
        //   Järjestäjä    = organiser entity        (`jarjestaja`)
        // All three are existing canonical fields; no new field or
        // taxonomy introduced.
        location: (data) => getPresentationRecord(data)?.location || undefined,
        kategoria: (data) => getPresentationRecord(data)?.kategoria || undefined,
        jarjestaja: (data) => getPresentationRecord(data)?.jarjestaja || undefined
    }
};

const { resolveContexts } = require("../_data/contentContext");
const teachingUnits = require("../_data/teachingUnits");
const { readLocalPresentationSources } = require("../_data/presentationSources");

const PRESENTATION_LOOKUP = new Map(
  readLocalPresentationSources().map((item) => [item.pageUrl, item])
);

function getPresentationRecord(data) {
  const pageUrl = data?.page?.url;
  if (!pageUrl) return null;
  return PRESENTATION_LOOKUP.get(pageUrl) || null;
}

module.exports = {
    tags: "presentations",
    lang: "fi",
    eleventyComputed: {
        layout: () => "presentation-item.njk",
        description: (data) => getPresentationRecord(data)?.description,
        categories: (data) => getPresentationRecord(data)?.categories,
        keywords: (data) => getPresentationRecord(data)?.keywords,
        sourceLanguage: (data) => getPresentationRecord(data)?.sourceLanguage,
        slideCount: (data) => getPresentationRecord(data)?.slideCount,
        viewCount: (data) => getPresentationRecord(data)?.viewCount,
        contexts: (data) => resolveContexts(data),
        // Yksikko-mappaus: courseContexts.courseId -> "opettajankoulutus" | "let"
        // Nayttaa nollaksi jos courseId:ta ei ole tunnistettu (esim. konferenssi,
        // vierailuluento). Ei aseteta arvoa jos ei mappausta, jotta
        // toPublicContentRecord ei sisallyta kenttaa JSON:iin.
        teachingUnit: (data) => teachingUnits.fromCourseContexts(data.courseContexts) || undefined
    }
};

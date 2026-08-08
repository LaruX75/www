const { resolveContexts } = require("../_data/contentContext");
const teachingUnits = require("../_data/teachingUnits");

module.exports = {
    tags: "presentations",
    lang: "fi",
    eleventyComputed: {
        layout: () => "presentation-item.njk",
        contexts: (data) => resolveContexts(data),
        // Yksikko-mappaus: courseContexts.courseId -> "opettajankoulutus" | "let"
        // Nayttaa nollaksi jos courseId:ta ei ole tunnistettu (esim. konferenssi,
        // vierailuluento). Ei aseteta arvoa jos ei mappausta, jotta
        // toPublicContentRecord ei sisallyta kenttaa JSON:iin.
        teachingUnit: (data) => teachingUnits.fromCourseContexts(data.courseContexts) || undefined
    }
};

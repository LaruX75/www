const { buildCanonicalPresentationPageLookup } = require("../_data/presentationsPage");

// COURSE-PAGE-01: resolves lecture presentation URLs into the canonical
// Presentation records emitted by src/presentations/. The page template
// never duplicates Presentation metadata (title, source URL, date) —
// those come from the canonical record. If a lecture has no matching
// canonical Presentation (e.g. missing source URL, external speaker),
// the resolved value is null and the template renders provisional copy.

function hydrateLectures(lectures, lookup) {
  if (!Array.isArray(lectures)) return [];
  return lectures.map((lecture) => {
    const canonical = lecture.presentationPageUrl
      ? lookup.get(lecture.presentationPageUrl) || null
      : null;
    return {
      ...lecture,
      presentation: canonical
    };
  });
}

module.exports = {
  eleventyComputed: {
    course: (data) => {
      const course = data.course || {};
      const lookup = buildCanonicalPresentationPageLookup(data);
      return {
        ...course,
        lectures: hydrateLectures(course.lectures, lookup)
      };
    }
  }
};

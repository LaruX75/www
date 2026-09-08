const { buildCanonicalPresentationPageLookup } = require("../_data/presentationsPage");

function hydrateLectures(lectures, lookup) {
  if (!Array.isArray(lectures)) return [];
  return lectures.map((lecture) => ({
    ...lecture,
    presentation: lecture.presentationPageUrl
      ? lookup.get(lecture.presentationPageUrl) || null
      : null
  }));
}

module.exports = {
  eleventyComputed: {
    course: (data) => ({
      ...(data.course || {}),
      lectures: hydrateLectures(data.course?.lectures, buildCanonicalPresentationPageLookup(data))
    })
  }
};

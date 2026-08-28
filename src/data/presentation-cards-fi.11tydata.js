const { buildPresentationsPageModel } = require("../_data/presentationsPage");

module.exports = {
  layout: false,
  eleventyExcludeFromCollections: true,
  permalink: "/data/presentation-cards-fi.html",
  eleventyComputed: {
    presentationsPage: (data) => buildPresentationsPageModel(data)
  }
};

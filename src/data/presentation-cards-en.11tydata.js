const { buildPresentationsPageModel } = require("../_data/presentationsPage");

module.exports = {
  layout: false,
  eleventyExcludeFromCollections: true,
  permalink: "/en/data/presentation-cards-en.html",
  eleventyComputed: {
    presentationsPage: (data) => buildPresentationsPageModel(data)
  }
};

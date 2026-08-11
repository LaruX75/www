const { buildPresentationsPageModel } = require("../_data/presentationsPage");

module.exports = {
  eleventyComputed: {
    presentationsPage: (data) => buildPresentationsPageModel(data)
  }
};

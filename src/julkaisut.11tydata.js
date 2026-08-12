const { buildPublicationsPageModel } = require("./_data/publicationsPage");

module.exports = {
  eleventyComputed: {
    publicationsPage: (data) => buildPublicationsPageModel(data)
  }
};

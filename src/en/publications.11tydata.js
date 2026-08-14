const { buildPublicationsPageModel } = require("../_data/publicationsPage");
const { buildPublicationsFindExplorePageModel } = require("../_utils/publicationsFindExplore");

module.exports = {
  eleventyComputed: {
    publicationsPage: (data) => buildPublicationsPageModel(data),
    publicationsFindExplorePage: (data) => buildPublicationsFindExplorePageModel(buildPublicationsPageModel(data))
  }
};

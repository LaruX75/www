const { buildPublicationsPageModel } = require("../_data/publicationsPage");
const { buildPublicationsFindExplorePageModel } = require("../_utils/publicationsFindExplore");

module.exports = {
  eleventyComputed: {
    researchFindExplorePage: (data) => {
      const publications = buildPublicationsFindExplorePageModel(buildPublicationsPageModel(data));
      return {
        publicationRecords: publications.records || []
      };
    }
  }
};

const { buildPublicationsPageModel } = require("./_data/publicationsPage");
const { buildPublicationsArchiveGroups } = require("./_utils/publicationsArchiveGroups");
const { buildPublicationsFindExplorePageModel } = require("./_utils/publicationsFindExplore");

module.exports = {
  eleventyComputed: {
    publicationsPage: (data) => buildPublicationsPageModel(data),
    publicationsFindExplorePage: (data) => buildPublicationsFindExplorePageModel(buildPublicationsPageModel(data)),
    publicationsArchive: (data) => buildPublicationsArchiveGroups(buildPublicationsPageModel(data).items, { lang: "fi" })
  }
};

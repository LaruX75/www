/**
 * thesesArchivePagesMastersEn — SSR pagination for the EN supervised
 * master-theses subarchive at `/en/theses/masters/`.
 */

const thesisDetails = require("./thesisDetails");
const { buildThesesArchivePages, PAGE_SIZE } = require("../_utils/thesesArchivePages");

module.exports = async function loadThesesArchivePagesMastersEn() {
  const model = await thesisDetails();
  const items = Array.isArray(model?.advisedMasters) ? model.advisedMasters : [];
  return buildThesesArchivePages(items, {
    scope: "en-masters",
    lang: "en",
    landingPermalink: "/en/theses/masters/",
    paginatedBasePermalink: "/en/theses/masters/page/"
  });
};

module.exports.PAGE_SIZE = PAGE_SIZE;

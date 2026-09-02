/**
 * thesesArchivePagesBachelorsEn — SSR pagination for the EN supervised
 * bachelor-theses subarchive at `/en/theses/bachelors/`.
 */

const thesisDetails = require("./thesisDetails");
const { buildThesesArchivePages, PAGE_SIZE } = require("../_utils/thesesArchivePages");

module.exports = async function loadThesesArchivePagesBachelorsEn() {
  const model = await thesisDetails();
  const items = Array.isArray(model?.advisedBachelors) ? model.advisedBachelors : [];
  return buildThesesArchivePages(items, {
    scope: "en-bachelors",
    lang: "en",
    landingPermalink: "/en/theses/bachelors/",
    paginatedBasePermalink: "/en/theses/bachelors/page/"
  });
};

module.exports.PAGE_SIZE = PAGE_SIZE;

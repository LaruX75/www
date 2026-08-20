/**
 * thesesArchivePagesEn — single-table SSR pagination descriptor for the
 * English thesis archive at `/en/theses/`.
 */

const thesisDetails = require("./thesisDetails");
const { buildThesesArchivePages, PAGE_SIZE } = require("../_utils/thesesArchivePages");

module.exports = async function loadThesesArchivePagesEn() {
  const model = await thesisDetails();
  const items = Array.isArray(model?.items) ? model.items : [];
  return buildThesesArchivePages(items, {
    scope: "en",
    lang: "en",
    landingPermalink: "/en/theses/",
    paginatedBasePermalink: "/en/theses/page/"
  });
};

module.exports.PAGE_SIZE = PAGE_SIZE;

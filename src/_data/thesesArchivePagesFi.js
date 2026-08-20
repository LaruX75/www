/**
 * thesesArchivePagesFi — single-table SSR pagination descriptor for the
 * Finnish thesis archive at `/opinnaytteet/`.
 */

const thesisDetails = require("./thesisDetails");
const { buildThesesArchivePages, PAGE_SIZE } = require("../_utils/thesesArchivePages");

module.exports = async function loadThesesArchivePagesFi() {
  const model = await thesisDetails();
  const items = Array.isArray(model?.items) ? model.items : [];
  return buildThesesArchivePages(items, {
    scope: "fi",
    lang: "fi",
    landingPermalink: "/opinnaytteet/",
    paginatedBasePermalink: "/opinnaytteet/sivu/"
  });
};

module.exports.PAGE_SIZE = PAGE_SIZE;

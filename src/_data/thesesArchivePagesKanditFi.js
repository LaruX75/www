/**
 * thesesArchivePagesKanditFi — SSR pagination for the FI supervised
 * bachelor-theses subarchive at `/opinnaytteet/kandit/`.
 */

const thesisDetails = require("./thesisDetails");
const { buildThesesArchivePages, PAGE_SIZE } = require("../_utils/thesesArchivePages");

module.exports = async function loadThesesArchivePagesKanditFi() {
  const model = await thesisDetails();
  const items = Array.isArray(model?.advisedBachelors) ? model.advisedBachelors : [];
  return buildThesesArchivePages(items, {
    scope: "fi-kandit",
    lang: "fi",
    landingPermalink: "/opinnaytteet/kandit/",
    paginatedBasePermalink: "/opinnaytteet/kandit/sivu/"
  });
};

module.exports.PAGE_SIZE = PAGE_SIZE;

/**
 * thesesArchivePagesGradutFi — SSR pagination for the FI supervised
 * master-theses subarchive at `/opinnaytteet/gradut/`.
 *
 * Group source: canonical `advisedMasters` (masterThesis + advised),
 * chronologically sorted by the shared thesis detail comparator so the
 * hub-first-5 invariant holds against `/opinnaytteet/` section 1.
 */

const thesisDetails = require("./thesisDetails");
const { buildThesesArchivePages, PAGE_SIZE } = require("../_utils/thesesArchivePages");

module.exports = async function loadThesesArchivePagesGradutFi() {
  const model = await thesisDetails();
  const items = Array.isArray(model?.advisedMasters) ? model.advisedMasters : [];
  return buildThesesArchivePages(items, {
    scope: "fi-gradut",
    lang: "fi",
    landingPermalink: "/opinnaytteet/gradut/",
    paginatedBasePermalink: "/opinnaytteet/gradut/sivu/"
  });
};

module.exports.PAGE_SIZE = PAGE_SIZE;

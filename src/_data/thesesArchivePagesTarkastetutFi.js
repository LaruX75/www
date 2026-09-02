/**
 * thesesArchivePagesTarkastetutFi — SSR pagination for the FI reviewer-only
 * subarchive at `/opinnaytteet/tarkastetut/`.
 *
 * Scope semantics: `reviewerOnly` per canonical thesis grouping — reviewed
 * MINUS also-advised. Do not broaden.
 */

const thesisDetails = require("./thesisDetails");
const { buildThesesArchivePages, PAGE_SIZE } = require("../_utils/thesesArchivePages");

module.exports = async function loadThesesArchivePagesTarkastetutFi() {
  const model = await thesisDetails();
  const items = Array.isArray(model?.reviewed) ? model.reviewed : [];
  return buildThesesArchivePages(items, {
    scope: "fi-tarkastetut",
    lang: "fi",
    landingPermalink: "/opinnaytteet/tarkastetut/",
    paginatedBasePermalink: "/opinnaytteet/tarkastetut/sivu/"
  });
};

module.exports.PAGE_SIZE = PAGE_SIZE;

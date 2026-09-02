/**
 * thesesArchivePagesReviewedEn — SSR pagination for the EN reviewer-only
 * subarchive at `/en/theses/reviewed/`.
 *
 * Scope semantics: `reviewerOnly` per canonical thesis grouping — reviewed
 * MINUS also-advised. Do not broaden.
 */

const thesisDetails = require("./thesisDetails");
const { buildThesesArchivePages, PAGE_SIZE } = require("../_utils/thesesArchivePages");

module.exports = async function loadThesesArchivePagesReviewedEn() {
  const model = await thesisDetails();
  const items = Array.isArray(model?.reviewed) ? model.reviewed : [];
  return buildThesesArchivePages(items, {
    scope: "en-reviewed",
    lang: "en",
    landingPermalink: "/en/theses/reviewed/",
    paginatedBasePermalink: "/en/theses/reviewed/page/"
  });
};

module.exports.PAGE_SIZE = PAGE_SIZE;

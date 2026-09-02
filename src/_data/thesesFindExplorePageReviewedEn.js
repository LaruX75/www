const thesisDetails = require("./thesisDetails");
const { buildScopedFindExploreModel } = require("../_utils/thesesFindExplore");

module.exports = async function loadThesesFindExplorePageReviewedEn() {
  const model = await thesisDetails();
  return buildScopedFindExploreModel(model.reviewed, {
    scopeKey: "en-reviewed",
    pinnedRole: "reviewed"
  });
};

const thesisDetails = require("./thesisDetails");
const { buildScopedFindExploreModel } = require("../_utils/thesesFindExplore");

module.exports = async function loadThesesFindExplorePageBachelorsEn() {
  const model = await thesisDetails();
  return buildScopedFindExploreModel(model.advisedBachelors, {
    scopeKey: "en-bachelors",
    pinnedType: "bachelorThesis",
    pinnedRole: "advised"
  });
};

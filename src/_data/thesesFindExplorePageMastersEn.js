const thesisDetails = require("./thesisDetails");
const { buildScopedFindExploreModel } = require("../_utils/thesesFindExplore");

module.exports = async function loadThesesFindExplorePageMastersEn() {
  const model = await thesisDetails();
  return buildScopedFindExploreModel(model.advisedMasters, {
    scopeKey: "en-masters",
    pinnedType: "masterThesis",
    pinnedRole: "advised"
  });
};

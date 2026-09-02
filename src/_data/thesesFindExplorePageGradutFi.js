const thesisDetails = require("./thesisDetails");
const { buildScopedFindExploreModel } = require("../_utils/thesesFindExplore");

module.exports = async function loadThesesFindExplorePageGradutFi() {
  const model = await thesisDetails();
  return buildScopedFindExploreModel(model.advisedMasters, {
    scopeKey: "fi-gradut",
    pinnedType: "masterThesis",
    pinnedRole: "advised"
  });
};

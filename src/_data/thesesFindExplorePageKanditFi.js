const thesisDetails = require("./thesisDetails");
const { buildScopedFindExploreModel } = require("../_utils/thesesFindExplore");

module.exports = async function loadThesesFindExplorePageKanditFi() {
  const model = await thesisDetails();
  return buildScopedFindExploreModel(model.advisedBachelors, {
    scopeKey: "fi-kandit",
    pinnedType: "bachelorThesis",
    pinnedRole: "advised"
  });
};

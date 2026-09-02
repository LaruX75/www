const thesisDetails = require("./thesisDetails");
const { buildScopedFindExploreModel } = require("../_utils/thesesFindExplore");

module.exports = async function loadThesesFindExplorePageTarkastetutFi() {
  const model = await thesisDetails();
  // Scope is by role only — reviewed items may be either masterThesis or
  // bachelorThesis (though canonical data currently has only masters here).
  return buildScopedFindExploreModel(model.reviewed, {
    scopeKey: "fi-tarkastetut",
    pinnedRole: "reviewed"
  });
};

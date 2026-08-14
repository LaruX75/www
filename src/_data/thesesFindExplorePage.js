const thesisDetails = require("./thesisDetails");
const { buildThesesFindExplorePageModel } = require("../_utils/thesesFindExplore");

module.exports = async function loadThesesFindExplorePage() {
  const model = await thesisDetails();
  return buildThesesFindExplorePageModel(model);
};

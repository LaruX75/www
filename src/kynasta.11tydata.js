const { buildKynastaHubModel } = require("./_utils/kynastaHubPage");

module.exports = {
  eleventyComputed: {
    kynastaHubPage: (data) => buildKynastaHubModel({ collections: data.collections, lang: "fi" })
  }
};

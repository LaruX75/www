const { buildKynastaHubModel } = require("../_utils/kynastaHubPage");

module.exports = {
  eleventyComputed: {
    // EN hub renders only the Writings section from EN-scoped items.
    // Council + expert domains have no EN content today; those sections
    // fall back to a "Available only in Finnish" note (see src/en/kynasta.njk).
    // The EN model still returns the council + expert counts for context.
    kynastaHubPage: (data) => buildKynastaHubModel({ collections: data.collections, lang: "en" })
  }
};

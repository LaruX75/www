const { JSON_SCHEMA_VERSION } = require("./_shared");
const { buildWritingsPageModel } = require("../_data/writingsPage");

module.exports = class {
  data() {
    return {
      permalink: "/data/writings-page.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    const pageModel = buildWritingsPageModel(data);
    return JSON.stringify({
      version: JSON_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      count: Array.isArray(pageModel.items) ? pageModel.items.length : 0,
      items: pageModel.items || []
    }, null, 2);
  }
};

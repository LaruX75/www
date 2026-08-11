const { JSON_SCHEMA_VERSION } = require("./_shared");
const { buildPublicationsPageModel } = require("../_data/publicationsPage");

module.exports = class {
  data() {
    return {
      permalink: "/data/publications-page.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    const pageModel = buildPublicationsPageModel(data);
    return JSON.stringify({
      version: JSON_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      count: Array.isArray(pageModel.items) ? pageModel.items.length : 0,
      items: pageModel.items || [],
      archiveFilters: pageModel.archiveFilters || { lines: [], themes: [], audiences: [] }
    }, null, 2);
  }
};

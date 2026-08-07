/**
 * /data/presentations.json — vain esitykset (src/presentations/*.md).
 */

const { serializeItems, jsonWrap } = require("./_shared");

module.exports = class {
  data() {
    return {
      permalink: "/data/presentations.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    return jsonWrap(serializeItems(data.collections.presentations || []));
  }
};

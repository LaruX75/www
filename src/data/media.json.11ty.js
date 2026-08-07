/**
 * /data/media.json — vain mediaosumat (src/media/*.md).
 */

const { serializeItems, jsonWrap } = require("./_shared");

module.exports = class {
  data() {
    return {
      permalink: "/data/media.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    return jsonWrap(serializeItems(data.collections.media || []));
  }
};

/**
 * /data/publications.json — vain julkisen sisallon publications-tiedostot
 * (src/publications/*.md, mihin kuuluvat puheet, mielipiteet, kolumnit,
 * lausunnot, tieteelliset yms.).
 */

const { serializeItems, jsonWrap } = require("./_shared");

module.exports = class {
  data() {
    return {
      permalink: "/data/publications.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    return jsonWrap(serializeItems(data.collections.publications || []));
  }
};

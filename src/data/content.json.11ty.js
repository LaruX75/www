/**
 * /data/content.json — kaikki julkiset varsinaiset sisaltosivut.
 *
 * Sisaltaa unionin seuraavista collectioneista:
 *   publications, presentations, media, blog, politics
 *
 * EI sisalla:
 *   - taxonomy-/tagi-/keyword-arkistosivuja (nama eivat ole missaan
 *     nayissa collectioneissa)
 *   - utility-sivuja (404, robots, sitemap, feed)
 *   - redirect-sivuja
 *   - drafteja (eleventyExcludeFromCollections)
 *   - theses (async data, oma endpoint /data/theses.json)
 */

const { serializeItems, jsonWrap } = require("./_shared");

module.exports = class {
  data() {
    return {
      permalink: "/data/content.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    const c = data.collections || {};
    const union = [
      ...(c.publications || []),
      ...(c.presentations || []),
      ...(c.media || []),
      ...(c.blog || []),
      ...(c.politics || [])
    ];
    return jsonWrap(serializeItems(union));
  }
};

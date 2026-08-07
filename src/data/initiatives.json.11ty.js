/**
 * /data/initiatives.json — valtuustoaloitteet, kuntalaisaloitteet ja
 * politiikan aineisto (src/politics/*.md).
 *
 * Sisaltaa initiativeType-, meetingDate- ja meeting-kentat jotka
 * ovat aloitteille tarkeita frontmatter-tietoja.
 */

const { serializeItems, jsonWrap } = require("./_shared");

module.exports = class {
  data() {
    return {
      permalink: "/data/initiatives.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    return jsonWrap(serializeItems(data.collections.politics || []));
  }
};

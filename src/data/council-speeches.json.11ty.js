/**
 * /data/council-speeches.json — valtuustopuheenvuorot.
 *
 * Kayttaa olemassa olevaa collections.pub_puhe_valtuusto -collectionia
 * jotta ei rakenneta uutta luokittelua. Sama data mika nakyy
 * /valtuustotyo/#puheet ja /kirjoitukset/-suodattimissa.
 */

const { serializeItems, jsonWrap } = require("./_shared");

module.exports = class {
  data() {
    return {
      permalink: "/data/council-speeches.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    return jsonWrap(serializeItems(data.collections.pub_puhe_valtuusto || []));
  }
};

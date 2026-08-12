/**
 * /data/presentations-page.json — /esitykset/-sivun build-time compiled data.
 *
 * Tämä endpoint toimii canonical public projectionina /esitykset/-sivulle.
 *
 * Data-lahteet: src/_data/presentationsPage.js (aggregoitu SlideShare,
 * Canva, kuratoidut esitykset, video-sarjat).
 */

const { JSON_SCHEMA_VERSION } = require("./_shared");
const { buildPresentationsPageModel } = require("../_data/presentationsPage");

module.exports = class {
  data() {
    return {
      permalink: "/data/presentations-page.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    // buildPresentationsPageModel ajetaan tässä eksplisiittisesti, koska
    // src/esitykset.11tydata.js määrittelee `presentationsPage`-globaalin
    // vain /esitykset/-sivulle. Tämä .11ty.js on eri sivu (permalink
    // /data/presentations-page.json), joten data.presentationsPage ei ole
    // täällä populated ilman eksplisiittistä buildiä.
    const pageModel = buildPresentationsPageModel(data);
    return JSON.stringify({
      version: JSON_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      count: Array.isArray(pageModel.items) ? pageModel.items.length : 0,
      items: pageModel.items || [],
      contexts: pageModel.presentationContextItems || [],
      canvaPageUrls: pageModel.canvaPageUrls || []
    }, null, 2);
  }
};

/**
 * /data/presentations-page.json — /esitykset/-sivun build-time compiled data.
 *
 * HUOM: Toisin kuin muut /data/*.json:it, tama endpoint EI ole
 * puhdas "julkinen sisaltoindeksi" vaan tekninen data-taulu jota
 * /esitykset/-sivun client-side JS (src/js/presentations-page.js)
 * kayttaa esitysten aggregointiin, suodatukseen ja visualisointiin.
 *
 * Aiemmin sama data lataantui embedded scripti-lohkoina (172 KB HTML).
 * Nyt data siirtyi async fetch:in taakse, joten HTML on kevyempi ja
 * data selain-cache:ttaa muille sivuille.
 *
 * Data-lahteet: src/_data/presentationsPage.js (aggregoitu SlideShare,
 * Canva, kuratoidut esitykset, video-sarjat).
 */

const { JSON_SCHEMA_VERSION } = require("./_shared");

module.exports = class {
  data() {
    return {
      permalink: "/data/presentations-page.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    const pageModel = data.presentationsPage || {};
    return JSON.stringify({
      version: JSON_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      rawData: pageModel.rawData || {},
      contexts: pageModel.presentationContextItems || [],
      canvaPageUrls: pageModel.canvaPageUrls || []
    });
  }
};

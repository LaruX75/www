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
    const publicItems = (pageModel.items || []).map(stripInternalOnlyFields);
    return JSON.stringify({
      version: JSON_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      count: publicItems.length,
      items: publicItems,
      contexts: pageModel.presentationContextItems || [],
      canvaPageUrls: pageModel.canvaPageUrls || []
    }, null, 2);
  }
};

// CANONICAL-COURSE-PERIODID-01: honour the "Public JSON unchanged"
// invariant. `periodId` is an internal-only canonical extension inside
// `courseContexts[]`; it is passed through the internal projection for
// future SSR/build consumers but is stripped from the public JSON
// endpoint. Adding it to /data/presentations-page.json would expand the
// public surface without a documented public-consumer need.
function stripInternalOnlyFields(item) {
  if (!item || typeof item !== "object") return item;
  const cloned = { ...item };
  if (Array.isArray(cloned.courseContexts)) {
    cloned.courseContexts = cloned.courseContexts.map((ctx) => {
      if (!ctx || typeof ctx !== "object") return ctx;
      // eslint-disable-next-line no-unused-vars
      const { periodId, ...publicCtx } = ctx;
      return publicCtx;
    });
  }
  return cloned;
}

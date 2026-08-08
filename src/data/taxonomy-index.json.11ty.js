/**
 * /data/taxonomy-index.json — indexed-taxonomy-slugit ja niiden URL:t.
 *
 * Sisältää kategoriat (count >= 2) ja avainsanat (count >= 3) jotka
 * on renderöity omiksi HTML-sivuiksi. Client-side-rendered listaukset
 * (esim. /blogi/, /mediassa/, /kirjoitukset/) kayttavat tata tietoa
 * ehdollisen linkityksen rakentamiseen: <a> jos slug on indexed,
 * muuten <span>.
 *
 * Tama on sama check kuin Nunjucks-templaateissa `taxonomyIndexed`-
 * filtteri (eleventy.filters.js). JS-toteutuksia varten.
 *
 * Koko: ~200 uniikkia slug-arvoa ~10-15 KB.
 */

const { JSON_SCHEMA_VERSION } = require("./_shared");

module.exports = class {
  data() {
    return {
      permalink: "/data/taxonomy-index.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    const categoryList = data.collections.categoryList || [];
    const keywordList = data.collections.keywordList || [];

    const mapEntry = (t, kind) => ({
      name: t.name,
      slug: t.slug,
      count: t.count,
      href: `/${kind}/${t.slug}/`
    });

    return JSON.stringify({
      version: JSON_SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      categories: categoryList.map(t => mapEntry(t, "kategoriat")),
      keywords: keywordList.map(t => mapEntry(t, "avainsanat"))
    }, null, 2);
  }
};

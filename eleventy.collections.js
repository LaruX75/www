const { normalizeKeywordList } = require("./src/_data/metadata-normalization");

module.exports = function registerCollections(eleventyConfig) {
  const ACADEMIC_TERMS = [
    "koulutusteknologia", "teknologiatuettu", "mobiilioppiminen", "etäopetus",
    "oppiminen", "oppimisympäristö", "opetuksen suunnittelu",
    "digitalisaatio", "digiluokka", "digifinland", "sotedigi",
    "avoin tiede", "avoimet oppimateriaalit", "cscl",
    "luennot", "luento", "täydennyskoulutus",
    "tietotekniikka", "av-tekniikka", "web2.0",
    "larun laitenurkka", "oulun yliopisto", "tekoäly"
  ];

  function buildTermList(items, key) {
    const map = new Map();
    items.forEach(item => {
      const sourceTerms = item.data && item.data[key];
      const terms = key === "keywords" ? normalizeKeywordList(sourceTerms) : sourceTerms;
      if (!Array.isArray(terms)) return;
      terms.forEach(term => {
        if (!term) return;
        const name = String(term).trim();
        if (!name) return;
        if (!map.has(name)) map.set(name, []);
        map.get(name).push(item);
      });
    });
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      slug: eleventyConfig.getFilter("slugify")(name),
      items,
      count: items.length
    })).sort((a, b) => a.name.localeCompare(b.name, "fi"));
  }

  eleventyConfig.addCollection("blog", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/blog/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("blogAcademic", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/blog/*.md")
      .filter(item => {
        const cats = (item.data.categories || []).map(c => c.toLowerCase());
        return cats.some(c => ACADEMIC_TERMS.some(term => c.includes(term)));
      })
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("blogEn", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/blog/*.md")
      .filter(item => item.data.lang === "en")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("publications", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/publications/*.md")
      .sort((a, b) => b.date - a.date);
  });

  ["mielipide", "kolumni", "puhe", "tieteellinen", "esitelma", "lausunto"].forEach(type => {
    eleventyConfig.addCollection(`pub_${type}`, function (collectionApi) {
      return collectionApi
        .getFilteredByGlob("src/publications/*.md")
        .filter(item => item.data.type === type)
        .sort((a, b) => b.date - a.date);
    });
  });

  eleventyConfig.addCollection("politics", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/politics/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("training", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/training/*.md")
      .sort((a, b) => {
        const orderA = a.data.order || 999;
        const orderB = b.data.order || 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.data.title.localeCompare(b.data.title, "fi");
      });
  });

  eleventyConfig.addCollection("portfolio", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/portfolio/*.md")
      .sort((a, b) => (b.data.year || 0) - (a.data.year || 0));
  });

  eleventyConfig.addCollection("politicsAndOpinions", function (collectionApi) {
    const items = [
      ...collectionApi.getFilteredByGlob("src/politics/*.md"),
      ...collectionApi.getFilteredByGlob("src/publications/*.md").filter(item => item.data.type === "mielipide")
    ];
    return items.sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("presentations", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/presentations/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("categoryList", function (collectionApi) {
    const items = [
      ...collectionApi.getFilteredByGlob("src/blog/*.md"),
      ...collectionApi.getFilteredByGlob("src/publications/*.md"),
      ...collectionApi.getFilteredByGlob("src/politics/*.md")
    ];
    return buildTermList(items, "categories");
  });

  eleventyConfig.addCollection("keywordList", function (collectionApi) {
    const items = [
      ...collectionApi.getFilteredByGlob("src/blog/*.md"),
      ...collectionApi.getFilteredByGlob("src/publications/*.md"),
      ...collectionApi.getFilteredByGlob("src/politics/*.md")
    ];
    return buildTermList(items, "keywords");
  });
};

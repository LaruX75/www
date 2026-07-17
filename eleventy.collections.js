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

  function hasExplicitDate(item) {
    return Boolean(item?.data && Object.prototype.hasOwnProperty.call(item.data, "date") && item.data.date);
  }

  function sortByExplicitDateThenOrder(a, b, orderKey = "order") {
    const aHasDate = hasExplicitDate(a);
    const bHasDate = hasExplicitDate(b);

    if (aHasDate && bHasDate) {
      const dateDiff = new Date(b.data.date) - new Date(a.data.date);
      if (dateDiff !== 0) return dateDiff;
    } else if (aHasDate !== bHasDate) {
      return aHasDate ? -1 : 1;
    }

    const orderA = Number(a?.data?.[orderKey] || 0);
    const orderB = Number(b?.data?.[orderKey] || 0);
    if (orderA !== orderB) return orderB - orderA;

    return String(a?.data?.title || "").localeCompare(String(b?.data?.title || ""), "fi");
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

  eleventyConfig.addCollection("pub_mielipide_political", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/publications/*.md")
      .filter(item => {
        if (item.data.type !== "mielipide") return false;
        const roles = item.data.opinionRoles || item.data.writingRoles || [];
        return roles.includes("political");
      })
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("pub_mielipide_expert", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/publications/*.md")
      .filter(item => {
        if (item.data.type !== "mielipide") return false;
        const roles = item.data.opinionRoles || item.data.writingRoles || [];
        return roles.includes("expert");
      })
      .sort((a, b) => b.date - a.date);
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

  eleventyConfig.addCollection("media", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/media/*.md")
      .sort((a, b) => sortByExplicitDateThenOrder(a, b, "mediaOrder"));
  });

  ["about", "guest", "interviewer"].forEach((role) => {
    eleventyConfig.addCollection(`media_${role}`, function (collectionApi) {
      return collectionApi
        .getFilteredByGlob("src/media/*.md")
        .filter((item) => item.data.mediaRole === role)
        .sort((a, b) => sortByExplicitDateThenOrder(a, b, "mediaOrder"));
    });
  });

  eleventyConfig.addCollection("categoryList", function (collectionApi) {
    const items = [
      ...collectionApi.getFilteredByGlob("src/blog/*.md"),
      ...collectionApi.getFilteredByGlob("src/publications/*.md"),
      ...collectionApi.getFilteredByGlob("src/politics/*.md"),
      ...collectionApi.getFilteredByGlob("src/media/*.md")
    ];
    return buildTermList(items, "categories");
  });

  eleventyConfig.addCollection("keywordList", function (collectionApi) {
    const items = [
      ...collectionApi.getFilteredByGlob("src/blog/*.md"),
      ...collectionApi.getFilteredByGlob("src/publications/*.md"),
      ...collectionApi.getFilteredByGlob("src/politics/*.md"),
      ...collectionApi.getFilteredByGlob("src/media/*.md")
    ];
    return buildTermList(items, "keywords");
  });
};

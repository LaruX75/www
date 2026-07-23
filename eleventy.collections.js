const {
  normalizeCategoryList,
  normalizeKeywordList
} = require("./src/_data/metadata-normalization");
const {
  CONTEXT_ORDER,
  getContextMeta,
  resolveContexts
} = require("./src/_data/contentContext");

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

  function getItemDate(item) {
    const date = item?.date || item?.data?.date || 0;
    const timestamp = new Date(date).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function getTaxonomyType(item) {
    const data = item?.data || {};
    const inputPath = item?.inputPath || "";
    const type = data.type || "";
    const speechContext = String(data.speechContext || "").trim();

    if (inputPath.includes("/media/")) {
      return { key: "media", label: "Mediassa" };
    }

    if (inputPath.includes("/presentations/")) {
      return { key: "presentations", label: "Esitykset ja videot" };
    }

    if (type === "lausunto") return { key: "statements", label: "Lausunnot" };
    if (type === "puhe") {
      if (speechContext === "kyselytunti") return { key: "council-question-hours", label: "Valtuuston kyselytunnit" };
      if (speechContext === "valtuusto") return { key: "council-speeches", label: "Valtuustopuheenvuorot" };
      if (speechContext === "akateeminen-puhe") return { key: "academic-speeches", label: "Akateemiset puheet" };
      if (speechContext === "juhlapuhe") return { key: "ceremonial-speeches", label: "Juhlapuheet" };
      if (speechContext === "julkinen-tilaisuus") return { key: "public-speeches", label: "Julkiset puheet" };
      return { key: "speeches", label: "Puheet" };
    }
    if (type === "mielipide") return { key: "opinions", label: "Mielipiteet" };
    if (type === "kolumni") return { key: "columns", label: "Kolumnit" };

    if (inputPath.includes("/politics/")) {
      return { key: "initiatives", label: "Aloitteet ja asiat" };
    }

    if (inputPath.includes("/blog/")) {
      return { key: "blog", label: "Blogikirjoitukset" };
    }

    return { key: "other", label: "Muut sisällöt" };
  }

  function summarizeTermItems(items, key) {
    const typeMap = new Map();
    const yearMap = new Map();
    const relatedTermMap = new Map();

    items.forEach((item) => {
      const type = item.taxonomyType || getTaxonomyType(item);
      if (!typeMap.has(type.key)) {
        typeMap.set(type.key, { key: type.key, label: type.label, count: 0 });
      }
      typeMap.get(type.key).count += 1;

      const year = new Date(item.date || item.data?.date || 0).getFullYear();
      if (Number.isFinite(year) && year > 1900) {
        yearMap.set(year, (yearMap.get(year) || 0) + 1);
      }

      const sourceTerms = key === "categories" ? item.data?.keywords : item.data?.categories;
      const terms = key === "categories"
        ? normalizeKeywordList(sourceTerms)
        : normalizeCategoryList(sourceTerms);
      terms.forEach((term) => {
        const slug = eleventyConfig.getFilter("slugify")(term);
        if (!slug) return;
        if (!relatedTermMap.has(slug)) {
          relatedTermMap.set(slug, {
            name: term,
            slug,
            count: 0,
            href: key === "categories" ? `/avainsanat/${slug}/` : `/kategoriat/${slug}/`
          });
        }
        relatedTermMap.get(slug).count += 1;
      });
    });

    const years = Array.from(yearMap.keys()).sort((a, b) => a - b);

    return {
      typeSummaries: Array.from(typeMap.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fi")),
      yearRange: years.length ? `${years[0]}-${years[years.length - 1]}` : "",
      relatedTerms: Array.from(relatedTermMap.values())
        .filter(term => term.count > 1)
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fi"))
        .slice(0, 14)
    };
  }

  function buildTermList(items, key) {
    const map = new Map(); // keyed by slug to prevent duplicate permalinks
    items.forEach(item => {
      const sourceTerms = item.data && item.data[key];
      const terms = key === "keywords"
        ? normalizeKeywordList(sourceTerms)
        : normalizeCategoryList(sourceTerms);
      if (!Array.isArray(terms)) return;
      terms.forEach(term => {
        if (!term) return;
        const name = String(term).trim();
        if (!name) return;
        const slug = eleventyConfig.getFilter("slugify")(name);
        if (!slug) return;
        if (!map.has(slug)) map.set(slug, { name, items: [] });
        const taxonomyType = getTaxonomyType(item);
        map.get(slug).items.push({
          url: item.url,
          inputPath: item.inputPath,
          date: item.date,
          data: item.data,
          taxonomyType,
          taxonomyTypeKey: taxonomyType.key,
          taxonomyTypeLabel: taxonomyType.label
        });
      });
    });
    return Array.from(map.entries()).map(([slug, { name, items }]) => {
      const sortedItems = items.sort((a, b) => getItemDate(b) - getItemDate(a) || String(a.data?.title || "").localeCompare(String(b.data?.title || ""), "fi"));
      return {
        name,
        slug,
        items: sortedItems,
        count: sortedItems.length,
        ...summarizeTermItems(sortedItems, key)
      };
    }).sort((a, b) => a.name.localeCompare(b.name, "fi"));
  }

  function buildContextList(items) {
    const map = new Map();

    items.forEach(item => {
      const contexts = resolveContexts(item.data || {}, item.inputPath || "");
      contexts.forEach(context => {
        const meta = getContextMeta(context, "fi");
        if (!map.has(context)) {
          map.set(context, {
            key: context,
            name: meta.label,
            slug: context,
            href: meta.href,
            items: []
          });
        }
        map.get(context).items.push(item);
      });
    });

    return CONTEXT_ORDER
      .filter(context => map.has(context))
      .map(context => {
        const group = map.get(context);
        const sortedItems = group.items.sort((a, b) => getItemDate(b) - getItemDate(a));
        return {
          ...group,
          items: sortedItems,
          count: sortedItems.length
        };
      });
  }

  function hasExplicitDate(item) {
    return Boolean(item?.data && Object.prototype.hasOwnProperty.call(item.data, "date") && item.data.date);
  }

  function isCouncilSpeech(item) {
    const data = item?.data || {};
    if (data.type !== "puhe") return false;

    const speechContext = String(data.speechContext || "").trim();
    const forums = Array.isArray(data.forum) ? data.forum : (data.forum ? [data.forum] : []);

    if (speechContext) {
      return speechContext === "valtuusto" || speechContext === "kyselytunti";
    }

    return (
      data.event === "Oulun kaupunginvaltuusto" ||
      forums.includes("Kaupunginvaltuusto")
    );
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

  eleventyConfig.addCollection("pub_puhe_valtuusto", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/publications/*.md")
      .filter(item => isCouncilSpeech(item))
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("pub_puhe_julkinen", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/publications/*.md")
      .filter(item => item.data.type === "puhe" && !isCouncilSpeech(item))
      .sort((a, b) => b.date - a.date);
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

  function getTaxonomySourceItems(collectionApi) {
    return [
      ...collectionApi.getFilteredByGlob("src/blog/*.md"),
      ...collectionApi.getFilteredByGlob("src/publications/*.md"),
      ...collectionApi.getFilteredByGlob("src/politics/*.md"),
      ...collectionApi.getFilteredByGlob("src/media/*.md"),
      ...collectionApi.getFilteredByGlob("src/presentations/*.md")
    ];
  }

  eleventyConfig.addCollection("categoryList", function (collectionApi) {
    const items = getTaxonomySourceItems(collectionApi);
    return buildTermList(items, "categories");
  });

  eleventyConfig.addCollection("keywordList", function (collectionApi) {
    const items = getTaxonomySourceItems(collectionApi);
    return buildTermList(items, "keywords");
  });

  eleventyConfig.addCollection("keywordListByCount", function (collectionApi) {
    const items = getTaxonomySourceItems(collectionApi);
    return buildTermList(items, "keywords")
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "fi"));
  });

  eleventyConfig.addCollection("contextList", function (collectionApi) {
    const items = getTaxonomySourceItems(collectionApi);
    return buildContextList(items);
  });
};

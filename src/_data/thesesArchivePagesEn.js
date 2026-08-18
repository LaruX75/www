/**
 * thesesArchivePagesEn — bounded SSR pagination descriptor for the
 * English thesis archive at `/en/theses/`. Mirrors
 * `thesesArchivePagesFi` (same canonical thesis set, same page size,
 * same section semantics) with EN-side slugs.
 */

const thesisDetails = require("./thesisDetails");

const PAGE_SIZE = 10;

const SECTIONS = [
  {
    key: "advisedMasters",
    slug: "masters",
    permalinkBase: "/en/theses/masters/",
    anchor: "masters",
    filter: (item) => item.thesisRole !== "reviewed" && item.thesisType === "masterThesis"
  },
  {
    key: "advisedBachelors",
    slug: "bachelors",
    permalinkBase: "/en/theses/bachelors/",
    anchor: "bachelors",
    filter: (item) => item.thesisRole !== "reviewed" && item.thesisType === "bachelorThesis"
  },
  {
    key: "reviewed",
    slug: "reviewed",
    permalinkBase: "/en/theses/reviewed/",
    anchor: "reviewed",
    filter: (item) => item.thesisRole === "reviewed"
  }
];

module.exports = async function loadThesesArchivePagesEn() {
  const model = await thesisDetails();
  const items = Array.isArray(model?.items) ? model.items : [];
  const grouped = {};
  const pageCounts = {};
  for (const section of SECTIONS) {
    const sectionItems = items.filter(section.filter);
    grouped[section.key] = sectionItems;
    pageCounts[section.key] = Math.max(1, Math.ceil(sectionItems.length / PAGE_SIZE));
  }
  const pages = [];
  pages.push({
    pageKind: "landing",
    scope: "en",
    activeSectionKey: null,
    permalink: "/en/theses/",
    pageState: { advisedMasters: 1, advisedBachelors: 1, reviewed: 1 },
    grouped,
    pageCounts,
    sections: SECTIONS,
    pageSize: PAGE_SIZE
  });
  for (const section of SECTIONS) {
    const total = pageCounts[section.key];
    for (let n = 2; n <= total; n++) {
      const state = { advisedMasters: 1, advisedBachelors: 1, reviewed: 1 };
      state[section.key] = n;
      pages.push({
        pageKind: "section",
        scope: "en",
        activeSectionKey: section.key,
        activeSectionSlug: section.slug,
        activePage: n,
        permalink: `${section.permalinkBase}page/${n}/`,
        pageState: state,
        grouped,
        pageCounts,
        sections: SECTIONS,
        pageSize: PAGE_SIZE
      });
    }
  }
  return { pages, pageSize: PAGE_SIZE, sections: SECTIONS };
};

module.exports.PAGE_SIZE = PAGE_SIZE;
module.exports.SECTIONS = SECTIONS;

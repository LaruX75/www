/**
 * thesesArchivePagesFi — bounded SSR pagination descriptor for the
 * Finnish thesis archive at `/opinnaytteet/`.
 *
 * TH-CITE1 Phase 3 SSR-first architecture. Emits one landing page plus
 * one paginated page per (section, page) combination. NOT cartesian:
 *
 *   /opinnaytteet/                              → landing (ma=1, ba=1, re=1)
 *   /opinnaytteet/ohjatut-gradut/page/2..N/     → gradut at N, others at 1
 *   /opinnaytteet/kandityot/page/2..N/          → kandit at N, others at 1
 *   /opinnaytteet/tarkastetut/page/2..N/        → tarkastetut at N, others at 1
 *
 * Progressive-enhancement JS may swap one section's fragment while
 * leaving the other two untouched to achieve full state independence
 * during interactive use. Without JS, following any per-section link
 * navigates to that section's URL and resets the other two to page 1.
 * That degradation is intentional per the Phase 3 architecture.
 *
 * `grouped` and `pageCounts` are shared references across every page
 * descriptor so downstream includes can render all three sections'
 * pagination controls consistently regardless of which section is
 * "active" for the current URL.
 */

const thesisDetails = require("./thesisDetails");

const PAGE_SIZE = 10;

const SECTIONS = [
  {
    key: "advisedMasters",
    slug: "ohjatut-gradut",
    permalinkBase: "/opinnaytteet/ohjatut-gradut/",
    anchor: "ohjatut-gradut",
    filter: (item) => item.thesisRole !== "reviewed" && item.thesisType === "masterThesis"
  },
  {
    key: "advisedBachelors",
    slug: "kandityot",
    permalinkBase: "/opinnaytteet/kandityot/",
    anchor: "kandityot",
    filter: (item) => item.thesisRole !== "reviewed" && item.thesisType === "bachelorThesis"
  },
  {
    key: "reviewed",
    slug: "tarkastetut",
    permalinkBase: "/opinnaytteet/tarkastetut/",
    anchor: "tarkastetut",
    filter: (item) => item.thesisRole === "reviewed"
  }
];

module.exports = async function loadThesesArchivePagesFi() {
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
    scope: "fi",
    activeSectionKey: null,
    permalink: "/opinnaytteet/",
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
        scope: "fi",
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

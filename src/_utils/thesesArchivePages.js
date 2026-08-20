"use strict";

const { buildArchiveRow } = require("./thesisArchiveRow");

const PAGE_SIZE = 20;

function buildPermalink(landingPermalink, paginatedBasePermalink, pageNumber) {
  return pageNumber === 1 ? landingPermalink : `${paginatedBasePermalink}${pageNumber}/`;
}

function buildThesesArchivePages(items = [], options = {}) {
  const scope = String(options.scope || "fi");
  const lang = String(options.lang || scope || "fi");
  const landingPermalink = String(options.landingPermalink || "/opinnaytteet/");
  const paginatedBasePermalink = String(options.paginatedBasePermalink || `${landingPermalink}page/`);

  const rows = (Array.isArray(items) ? items : [])
    .map((item) => buildArchiveRow(item, lang))
    .filter((row) => row.pageUrl && row.title);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const start = (pageNumber - 1) * PAGE_SIZE;
    pages.push({
      pageKind: pageNumber === 1 ? "landing" : "page",
      scope,
      lang,
      currentPage: pageNumber,
      pageCount,
      pageSize: PAGE_SIZE,
      totalCount: rows.length,
      visibleRows: rows.slice(start, start + PAGE_SIZE),
      permalink: buildPermalink(landingPermalink, paginatedBasePermalink, pageNumber)
    });
  }

  return {
    pages,
    pageSize: PAGE_SIZE
  };
}

module.exports = {
  PAGE_SIZE,
  buildThesesArchivePages
};

(function (global) {
  "use strict";

  const ARCHIVE_PAGE_SIZE = 12;

  const UI = {
    fi: {
      archiveItemSingular: "esitys",
      archiveItemPlural: "esitystä",
      resultsPrefix: "Näytetään",
      ofLabel: "/",
      empty: "Hakuehdoilla ei löytynyt esityksiä.",
      paginationLabel: "Sivu"
    },
    en: {
      archiveItemSingular: "presentation",
      archiveItemPlural: "presentations",
      resultsPrefix: "Showing",
      ofLabel: "of",
      empty: "No presentations matched the current filters.",
      paginationLabel: "Page"
    }
  };

  // Card identity: URL + KEY_SEP + title. Two data-* attributes carry the
  // parts separately (attribute-safe, no Nunjucks concat edge cases); the
  // client joins them into a single lookup key. KEY_SEP is a control
  // character that will never appear in a real URL or title.
  const KEY_SEP = "";

  function ensureDeps() {
    if (!global.ContentEngine || typeof global.ContentEngine.prefetch !== "function") {
      console.error("presentations-page: /js/content-engine.js puuttuu");
      return false;
    }
    if (!global.ContentPresets || typeof global.ContentPresets.queryPreset !== "function") {
      console.error("presentations-page: /js/content-presets.js puuttuu");
      return false;
    }
    return true;
  }

  function localeFor(value) {
    return value === "en" ? "en" : "fi";
  }

  function labelsFor(locale) {
    return UI[localeFor(locale)];
  }

  function normalizeForMatch(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function exactTopicMap(items) {
    const map = new Map();
    items.forEach((item) => {
      const topics = Array.isArray(item && item.topics) ? item.topics : [];
      topics.forEach((topic) => {
        const normalized = normalizeForMatch(topic);
        if (normalized && !map.has(normalized)) map.set(normalized, topic);
      });
    });
    return map;
  }

  function cardKeyForItem(item) {
    if (!item) return "";
    const url = item.landingUrl
      || item.localPageUrl
      || item.pageUrl
      || item.url
      || item.externalUrl
      || item.sourceUrl
      || "";
    return url + KEY_SEP + (item.title || "");
  }

  function cardKeyForNode(node) {
    const url = node.getAttribute("data-presentation-card-url") || "";
    const title = node.getAttribute("data-presentation-card-title") || "";
    return url + KEY_SEP + title;
  }

  function collectCards(root) {
    return Array.from(
      root.querySelectorAll("[data-presentation-results] > [data-presentation-card-url]")
    );
  }

  function renderPagination(listEl, totalPages, currentPage, onPageChange, locale) {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (totalPages <= 1) return;

    const labels = labelsFor(locale);
    for (let page = 1; page <= totalPages; page += 1) {
      const li = document.createElement("li");
      li.className = `page-item${page === currentPage ? " active" : ""}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "page-link";
      button.setAttribute("aria-label", `${labels.paginationLabel} ${page}`);
      button.textContent = String(page);
      button.addEventListener("click", () => onPageChange(page));
      li.appendChild(button);
      listEl.appendChild(li);
    }
  }

  function updateArchiveStatus(el, total, shownFrom, shownTo, locale) {
    if (!el) return;
    const labels = labelsFor(locale);
    if (total === 0) {
      el.textContent = labels.empty;
      return;
    }
    el.textContent = `${labels.resultsPrefix} ${shownFrom}-${shownTo} ${labels.ofLabel} ${total} ${total === 1 ? labels.archiveItemSingular : labels.archiveItemPlural}.`;
  }

  function archiveItemsForState(items, state) {
    const filters = {};
    if (state.year) filters.year = Number(state.year);
    if (state.topic) filters.topics = state.topic;

    return global.ContentPresets.queryPreset(items, "FindExplore:presentations", {
      search: state.search,
      filters
    }).items;
  }

  // SSR renders every canonical card visible. As soon as JS runs, hide
  // cards past the first page-size so hydration lands on the same
  // opening subset the old client-render path used to produce. This
  // pre-render sync step minimizes flash between paint and the async
  // ContentEngine.prefetch that follows.
  function applyInitialPagination(root) {
    const cards = collectCards(root);
    cards.forEach((card, index) => {
      card.hidden = index >= ARCHIVE_PAGE_SIZE;
    });
  }

  function showAllCards(root) {
    collectCards(root).forEach((card) => {
      card.hidden = false;
    });
  }

  function wireArchive(root, items) {
    const locale = localeFor(root.dataset.locale);
    const searchInput = root.querySelector('[data-presentation-control="search"]');
    const yearSelect = root.querySelector('[data-presentation-control="year"]');
    const topicInput = root.querySelector('[data-presentation-control="topic"]');
    const resetButton = root.querySelector("[data-presentation-reset]");
    const statusEl = root.querySelector("[data-presentation-status]");
    const paginationNav = root.querySelector("[data-presentation-pagination-nav]");
    const paginationEl = root.querySelector("[data-presentation-pagination]");
    const cards = collectCards(root);
    const topicMap = exactTopicMap(items);
    const state = { search: "", year: "", topic: "", page: 1 };

    function renderVisibility() {
      const filteredItems = archiveItemsForState(items, state);
      const total = filteredItems.length;
      const totalPages = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
      if (state.page > totalPages) state.page = totalPages;
      const start = (state.page - 1) * ARCHIVE_PAGE_SIZE;
      const pageItems = filteredItems.slice(start, start + ARCHIVE_PAGE_SIZE);
      const visibleKeys = new Set(pageItems.map(cardKeyForItem));

      cards.forEach((card) => {
        const key = cardKeyForNode(card);
        card.hidden = !visibleKeys.has(key);
      });

      updateArchiveStatus(statusEl, total, total === 0 ? 0 : start + 1, Math.min(start + ARCHIVE_PAGE_SIZE, total), locale);
      paginationNav.hidden = totalPages <= 1;
      renderPagination(paginationEl, totalPages, state.page, (page) => {
        state.page = page;
        renderVisibility();
      }, locale);
    }

    function syncTopicValue() {
      const normalized = normalizeForMatch(topicInput.value);
      state.topic = topicMap.get(normalized) || "";
    }

    searchInput.addEventListener("input", () => {
      state.search = searchInput.value.trim();
      state.page = 1;
      renderVisibility();
    });

    yearSelect.addEventListener("change", () => {
      state.year = yearSelect.value;
      state.page = 1;
      renderVisibility();
    });

    topicInput.addEventListener("change", () => {
      syncTopicValue();
      state.page = 1;
      renderVisibility();
    });

    topicInput.addEventListener("blur", () => {
      syncTopicValue();
      if (state.topic) topicInput.value = state.topic;
      state.page = 1;
      renderVisibility();
    });

    resetButton.addEventListener("click", () => {
      state.search = "";
      state.year = "";
      state.topic = "";
      state.page = 1;
      searchInput.value = "";
      yearSelect.value = "";
      topicInput.value = "";
      renderVisibility();
    });

    renderVisibility();
  }

  async function init() {
    if (!ensureDeps()) return;

    const archiveRoots = Array.from(document.querySelectorAll("[data-presentation-find-explore]"));
    if (!archiveRoots.length) return;

    // Synchronous, pre-fetch: hide cards past the first page immediately so
    // hydration matches the interactive default. Runs before the async
    // ContentEngine.prefetch below.
    archiveRoots.forEach(applyInitialPagination);

    let items = [];
    try {
      const fetched = await global.ContentEngine.prefetch("presentationsPage");
      if (Array.isArray(fetched)) items = fetched;
    } catch (error) {
      console.error("presentations-page: filter data fetch failed", error);
    }

    if (!items.length) {
      // Filter data unavailable — restore the complete SSR archive so
      // the canonical archive remains usable, and leave filter controls
      // in place but functionally inert (they will not throw; state
      // just never reaches renderVisibility).
      archiveRoots.forEach(showAllCards);
      return;
    }

    archiveRoots.forEach((root) => wireArchive(root, items));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);

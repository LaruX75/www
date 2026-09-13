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

  function cardKeyForNode(node) {
    const url = node.getAttribute("data-presentation-card-url") || "";
    const title = node.getAttribute("data-presentation-card-title") || "";
    return url + KEY_SEP + title;
  }

  function readSearchRecord(node) {
    try {
      const record = JSON.parse(node.getAttribute("data-presentation-search-record") || "");
      if (!record || typeof record !== "object" || Array.isArray(record)) return null;
      return record;
    } catch (_) {
      return null;
    }
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

    // SSR already supplies date-desc card order. Query without a sort rule so
    // filtering retains that DOM order without sending the date again.
    return global.ContentPresets.queryPreset(items, {
      source: "presentationsPage",
      search: state.search,
      filters
    }).items;
  }

  // SSR renders every canonical card visible. As soon as JS runs, hide cards
  // past the first page-size so hydration lands on the interactive default
  // without a separate data request.
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
      const visibleKeys = new Set(pageItems.map((item) => item.cardKey));

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

  function recordsFromCards(root) {
    const cards = collectCards(root);
    const records = cards.map((card) => {
      const record = readSearchRecord(card);
      if (!record) return null;
      return { ...record, cardKey: cardKeyForNode(card) };
    });
    return records.every(Boolean) ? records : null;
  }

  function init() {
    if (!ensureDeps()) return;

    const archiveRoots = Array.from(document.querySelectorAll("[data-presentation-find-explore]"));
    if (!archiveRoots.length) return;

    archiveRoots.forEach((root) => {
      const items = recordsFromCards(root);
      if (!items || !items.length) {
        // A malformed SSR record must not hide canonical cards.
        showAllCards(root);
        return;
      }
      applyInitialPagination(root);
      wireArchive(root, items);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);

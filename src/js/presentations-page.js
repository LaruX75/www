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

  // Card HTML is pre-rendered per canonical item at build time into
  // language-specific files so the archive page itself stays lean.
  // Client fetches the appropriate file, parses <template> nodes, and
  // clones matching content into the archive results grid on filter
  // interaction. EN cards live under `/en/data/` so the dateFormat filter
  // (which detects locale from `this.page.url`) renders EN dates.
  const CARD_ENDPOINTS = {
    fi: "/data/presentation-cards-fi.html",
    en: "/en/data/presentation-cards-en.html"
  };

  // KEY_SEP is a control character guaranteed not to appear in any real
  // URL or title. Used to join (url, title) into a single template lookup
  // key on both the build side (template data-* attributes are read raw
  // and joined by JS) and the item side.
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

  function cardKeyFor(item) {
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

  async function loadTemplateMap(locale) {
    const endpoint = CARD_ENDPOINTS[locale] || CARD_ENDPOINTS.fi;
    try {
      const response = await fetch(endpoint, { credentials: "same-origin" });
      if (!response.ok) return new Map();
      const text = await response.text();
      const doc = new DOMParser().parseFromString(text, "text/html");
      const map = new Map();
      doc.querySelectorAll("template[data-presentation-card-url]").forEach((template) => {
        const url = template.getAttribute("data-presentation-card-url") || "";
        const title = template.getAttribute("data-presentation-card-title") || "";
        const key = url + KEY_SEP + title;
        if (!map.has(key)) map.set(key, template);
      });
      return map;
    } catch (error) {
      console.error("presentations-page: failed to load card templates", error);
      return new Map();
    }
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

  async function wireArchive(root, items) {
    const locale = localeFor(root.dataset.locale);
    const searchInput = root.querySelector('[data-presentation-control="search"]');
    const yearSelect = root.querySelector('[data-presentation-control="year"]');
    const topicInput = root.querySelector('[data-presentation-control="topic"]');
    const resetButton = root.querySelector("[data-presentation-reset]");
    const resultsEl = root.querySelector("[data-presentation-results]");
    const statusEl = root.querySelector("[data-presentation-status]");
    const paginationNav = root.querySelector("[data-presentation-pagination-nav]");
    const paginationEl = root.querySelector("[data-presentation-pagination]");
    const topicMap = exactTopicMap(items);
    const templateMap = await loadTemplateMap(locale);
    const state = { search: "", year: "", topic: "", page: 1 };

    function renderCards(pageItems) {
      resultsEl.innerHTML = "";
      if (pageItems.length === 0) {
        const empty = document.createElement("div");
        empty.className = "text-muted text-center py-4";
        empty.textContent = labelsFor(locale).empty;
        resultsEl.appendChild(empty);
        return;
      }
      const fragment = document.createDocumentFragment();
      pageItems.forEach((item) => {
        const template = templateMap.get(cardKeyFor(item));
        if (template) {
          fragment.appendChild(template.content.cloneNode(true));
        }
      });
      resultsEl.appendChild(fragment);
    }

    // First render just wires status + pagination against the SSR opening
    // 12 cards; subsequent renders (on filter/search/pagination change)
    // rebuild the grid from templates. This preserves the initial DOM,
    // avoiding layout shift and focus loss when JS hydrates.
    let hasRendered = false;

    function render() {
      const filteredItems = archiveItemsForState(items, state);
      const total = filteredItems.length;
      const totalPages = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
      if (state.page > totalPages) state.page = totalPages;
      const start = (state.page - 1) * ARCHIVE_PAGE_SIZE;
      const pageItems = filteredItems.slice(start, start + ARCHIVE_PAGE_SIZE);

      if (hasRendered) {
        renderCards(pageItems);
      }
      hasRendered = true;

      updateArchiveStatus(statusEl, total, total === 0 ? 0 : start + 1, Math.min(start + ARCHIVE_PAGE_SIZE, total), locale);
      paginationNav.hidden = totalPages <= 1;
      renderPagination(paginationEl, totalPages, state.page, (page) => {
        state.page = page;
        render();
      }, locale);
    }

    function syncTopicValue() {
      const normalized = normalizeForMatch(topicInput.value);
      state.topic = topicMap.get(normalized) || "";
    }

    searchInput.addEventListener("input", () => {
      state.search = searchInput.value.trim();
      state.page = 1;
      render();
    });

    yearSelect.addEventListener("change", () => {
      state.year = yearSelect.value;
      state.page = 1;
      render();
    });

    topicInput.addEventListener("change", () => {
      syncTopicValue();
      state.page = 1;
      render();
    });

    topicInput.addEventListener("blur", () => {
      syncTopicValue();
      if (state.topic) topicInput.value = state.topic;
      state.page = 1;
      render();
    });

    resetButton.addEventListener("click", () => {
      state.search = "";
      state.year = "";
      state.topic = "";
      state.page = 1;
      searchInput.value = "";
      yearSelect.value = "";
      topicInput.value = "";
      render();
    });

    render();
  }

  async function init() {
    if (!ensureDeps()) return;

    const archiveRoots = Array.from(document.querySelectorAll("[data-presentation-find-explore]"));
    if (!archiveRoots.length) return;

    const items = await global.ContentEngine.prefetch("presentationsPage");
    if (!Array.isArray(items) || !items.length) return;

    await Promise.all(archiveRoots.map((root) => wireArchive(root, items)));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);

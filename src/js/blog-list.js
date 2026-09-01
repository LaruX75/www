(function () {
  "use strict";

  const PAGE_SIZE = 10;
  const SEARCH_DEBOUNCE_MS = 220;
  const BLOG_FILTERS = { "Writings content type": ["blogPost"] };
  const searchCache = new Map();

  function normalizeUrl(value) {
    if (!value) return "";
    try {
      return new URL(value, window.location.origin).pathname;
    } catch {
      return String(value || "");
    }
  }

  const tbody = document.getElementById("blog-tbody");
  if (!tbody) return;

  const rows = Array.from(tbody.querySelectorAll("[data-blog-row]"));
  if (!rows.length) return;

  const rowByUrl = new Map(rows.map((row) => [normalizeUrl(row.dataset.blogUrl), row]));
  const searchInput = document.getElementById("blog-search");
  const info = document.getElementById("blog-info");
  const pagination = document.getElementById("blog-pagination");
  const resetButton = document.getElementById("blog-reset");
  const noResultsRow = document.getElementById("blog-no-results");
  const tableSection = document.getElementById("blog-table-section");
  const sortableHeaders = Array.from(document.querySelectorAll(".blog-table th.sortable"));
  const sortButtons = Array.from(document.querySelectorAll("[data-blog-sort]"));
  const locale = document.documentElement.lang === "en" ? "en" : "fi";
  const searchLanguages = ["fi"];
  const showingLabel = info?.dataset.showing || "Näytetään";
  const ofLabel = info?.dataset.of || "/";
  const loadingLabel = info?.dataset.loading || "Haetaan blogikirjoituksia…";
  const searchUnavailableLabel = info?.dataset.searchUnavailable || "Haku ei ole tilapäisesti käytettävissä. Näytetään arkistorivit.";

  const state = {
    query: "",
    currentPage: 1,
    sort: {
      col: "date",
      dir: "desc",
      explicit: false
    },
    matchedUrls: null,
    pagefindOrder: null
  };

  let pagefindPromise = null;
  let activeSearchRunId = 0;

  function normalizeSearchLanguage(language) {
    return String(language || "fi").slice(0, 2).toLowerCase() || "fi";
  }

  function compareRowsByTitle(left, right) {
    return String(left.dataset.blogTitle || "").localeCompare(
      String(right.dataset.blogTitle || ""),
      locale
    );
  }

  function compareRowsByDate(left, right) {
    const leftDate = String(left.dataset.blogDate || "");
    const rightDate = String(right.dataset.blogDate || "");
    if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
    return compareRowsByTitle(left, right);
  }

  function compareRows(left, right, col, dir) {
    const direction = dir === "asc" ? 1 : -1;
    const base = col === "title"
      ? compareRowsByTitle(left, right)
      : compareRowsByDate(left, right);
    return base * direction;
  }

  async function createSearch(language) {
    const searchLanguage = normalizeSearchLanguage(language);
    if (searchCache.has(searchLanguage)) {
      return searchCache.get(searchLanguage);
    }

    const promise = (async () => {
      const root = document.documentElement;
      const previousLang = root.getAttribute("lang");
      root.setAttribute("lang", searchLanguage);

      try {
        const pagefindModule = await import(`/pagefind/pagefind.js?blogList=${encodeURIComponent(searchLanguage)}`);
        if (typeof pagefindModule.options === "function") {
          await pagefindModule.options({ baseUrl: "/" });
        }
        if (typeof pagefindModule.init === "function") {
          await pagefindModule.init();
        }
        return pagefindModule;
      } finally {
        if (previousLang) root.setAttribute("lang", previousLang);
        else root.removeAttribute("lang");
      }
    })();

    searchCache.set(searchLanguage, promise);
    try {
      return await promise;
    } catch (error) {
      searchCache.delete(searchLanguage);
      throw error;
    }
  }

  function loadPagefind() {
    if (pagefindPromise) return pagefindPromise;

    pagefindPromise = Promise.all(searchLanguages.map((language) => createSearch(language)))
      .then((pagefindModules) => pagefindModules.filter(Boolean));

    return pagefindPromise.catch((error) => {
      pagefindPromise = null;
      throw error;
    });
  }

  function debounce(fn, delay) {
    let timer = 0;
    return (...args) => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }

  function orderedMatchedRows() {
    const activeRows = state.matchedUrls
      ? rows.filter((row) => state.matchedUrls.has(normalizeUrl(row.dataset.blogUrl)))
      : [...rows];

    if (state.query && state.pagefindOrder && !state.sort.explicit) {
      return activeRows.sort((left, right) => {
        const leftRank = state.pagefindOrder.get(normalizeUrl(left.dataset.blogUrl)) ?? Number.MAX_SAFE_INTEGER;
        const rightRank = state.pagefindOrder.get(normalizeUrl(right.dataset.blogUrl)) ?? Number.MAX_SAFE_INTEGER;
        if (leftRank !== rightRank) return leftRank - rightRank;
        return compareRows(left, right, "date", "desc");
      });
    }

    return activeRows.sort((left, right) => compareRows(left, right, state.sort.col, state.sort.dir));
  }

  function updateSortState() {
    const queryUsesRelevance = Boolean(state.query && state.pagefindOrder && !state.sort.explicit);
    sortableHeaders.forEach((header) => {
      const col = header.dataset.col || "";
      header.classList.remove("sort-asc", "sort-desc");

      if (queryUsesRelevance) {
        header.setAttribute("aria-sort", "none");
        return;
      }

      if (state.sort.col !== col) {
        header.setAttribute("aria-sort", "none");
        return;
      }

      header.setAttribute("aria-sort", state.sort.dir === "asc" ? "ascending" : "descending");
      header.classList.add(state.sort.dir === "asc" ? "sort-asc" : "sort-desc");
    });
  }

  function renderPagination(totalPages) {
    if (!pagination) return;
    pagination.innerHTML = "";
    if (totalPages <= 1) return;

    for (let page = 1; page <= totalPages; page += 1) {
      const li = document.createElement("li");
      li.className = "page-item" + (page === state.currentPage ? " active" : "");

      const button = document.createElement("button");
      button.type = "button";
      button.className = "page-link";
      button.dataset.blogPage = String(page);
      button.textContent = String(page);
      if (page === state.currentPage) {
        button.setAttribute("aria-current", "page");
      }

      li.appendChild(button);
      pagination.appendChild(li);
    }
  }

  function renderInfo(total, start) {
    if (!info) return;
    const from = total === 0 ? 0 : start + 1;
    const to = Math.min(start + PAGE_SIZE, total);
    info.textContent = `${showingLabel} ${from}–${to} ${ofLabel} ${total}`;
  }

  function render() {
    const orderedRows = orderedMatchedRows();
    const orderedSet = new Set(orderedRows);
    const total = orderedRows.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    if (state.currentPage > totalPages) state.currentPage = totalPages;

    const start = (state.currentPage - 1) * PAGE_SIZE;
    const pageRows = new Set(orderedRows.slice(start, start + PAGE_SIZE));
    const fragment = document.createDocumentFragment();

    orderedRows.forEach((row) => {
      row.hidden = !pageRows.has(row);
      fragment.appendChild(row);
    });

    rows.forEach((row) => {
      if (orderedSet.has(row)) return;
      row.hidden = true;
      fragment.appendChild(row);
    });

    if (noResultsRow) {
      noResultsRow.hidden = total > 0;
      fragment.appendChild(noResultsRow);
    }

    tbody.appendChild(fragment);
    tbody.removeAttribute("aria-busy");
    renderInfo(total, start);
    renderPagination(totalPages);
    updateSortState();
  }

  async function runSearch(rawQuery) {
    const query = String(rawQuery || "").trim();
    const runId = ++activeSearchRunId;

    if (!query) {
      state.query = "";
      state.currentPage = 1;
      state.matchedUrls = null;
      state.pagefindOrder = null;
      render();
      return;
    }

    if (info) info.textContent = loadingLabel;
    tbody.setAttribute("aria-busy", "true");

    try {
      const pagefindModules = await loadPagefind();
      if (runId !== activeSearchRunId) return;
      const searchResults = [];

      for (const pagefind of pagefindModules) {
        const search = await pagefind.search(query, { filters: BLOG_FILTERS });
        if (runId !== activeSearchRunId) return;
        (search.results || []).forEach((result) => {
          searchResults.push(result);
        });
      }

      const enrichedResults = await Promise.all(searchResults.map(async (result) => ({
        score: Number(result?.score) || 0,
        data: await result.data()
      })));
      if (runId !== activeSearchRunId) return;

      enrichedResults.sort((left, right) => right.score - left.score);

      const seen = new Set();
      const urls = [];
      enrichedResults.forEach((result) => {
        const url = normalizeUrl(result.data?.url);
        if (!url || seen.has(url) || !rowByUrl.has(url)) return;
        seen.add(url);
        urls.push(url);
      });

      state.query = query;
      state.currentPage = 1;
      state.matchedUrls = new Set(urls);
      state.pagefindOrder = new Map(urls.map((url, index) => [url, index]));
      render();
    } catch (error) {
      if (runId !== activeSearchRunId) return;
      console.error("blog-list: Pagefind search failed:", error);
      tbody.removeAttribute("aria-busy");
      if (info) info.textContent = searchUnavailableLabel;
    }
  }

  function toggleSort(col) {
    if (state.sort.col === col) {
      state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
      state.sort.explicit = true;
    } else {
      state.sort.col = col;
      state.sort.dir = col === "date" ? "desc" : "asc";
      state.sort.explicit = true;
    }
    state.currentPage = 1;
    render();
  }

  const debouncedSearch = debounce((event) => {
    void runSearch(event.target.value);
  }, SEARCH_DEBOUNCE_MS);

  searchInput?.addEventListener("input", debouncedSearch);
  resetButton?.addEventListener("click", () => {
    activeSearchRunId += 1;
    if (searchInput) searchInput.value = "";
    state.query = "";
    state.currentPage = 1;
    state.sort = { col: "date", dir: "desc", explicit: false };
    state.matchedUrls = null;
    state.pagefindOrder = null;
    render();
  });
  sortButtons.forEach((button) => {
    button.addEventListener("click", () => toggleSort(button.dataset.blogSort || "date"));
  });
  pagination?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-blog-page]");
    if (!button) return;
    const nextPage = Number(button.dataset.blogPage);
    if (!Number.isFinite(nextPage) || nextPage === state.currentPage) return;
    state.currentPage = nextPage;
    render();
    tableSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  render();
})();

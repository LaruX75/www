(function () {
  "use strict";

  const PAGE_SIZE = 10;
  const mounts = Array.from(document.querySelectorAll("[data-find-explore]"));
  if (!mounts.length) return;

  const text = {
    fi: {
      idle: "Kirjoita hakusana tai rajaa tuloksia. Avausosiot toimivat myös ilman hakua.",
      loading: "Haetaan tuloksia...",
      noResults: "Tuloksia ei löytynyt.",
      count: (count) => `${count} ${count === 1 ? "tulos" : "tulosta"}`,
      error: "Hakemisto ei ole käytettävissä tässä buildissä.",
      open: "Avaa"
    },
    en: {
      idle: "Type a search term or narrow the result set. The curated opening sections work without search.",
      loading: "Searching...",
      noResults: "No results found.",
      count: (count) => `${count} ${count === 1 ? "result" : "results"}`,
      error: "The search index is not available in this build.",
      open: "Open"
    }
  };

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function debounce(fn, delay = 220) {
    let timer = null;
    return (...args) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }

  function normalizeUrl(url) {
    if (!url) return "";
    try {
      return new URL(url, window.location.origin).pathname;
    } catch {
      return String(url);
    }
  }

  function resultTitle(data) {
    return data?.meta?.title || data?.title || data?.url || "";
  }

  function normalizeSearchLanguage(language) {
    return String(language || "fi").slice(0, 2).toLowerCase() || "fi";
  }

  const searchCache = new Map();

  async function createSearch(language) {
    const searchLanguage = normalizeSearchLanguage(language);
    if (searchCache.has(searchLanguage)) return searchCache.get(searchLanguage);

    const promise = (async () => {
      const root = document.documentElement;
      const previousLang = root.getAttribute("lang");
      root.setAttribute("lang", searchLanguage);

      try {
        const pagefind = await import(`/pagefind/pagefind.js?findExploreLang=${searchLanguage}`);
        if (typeof pagefind.init === "function") {
          await pagefind.init();
        }
        return pagefind;
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

  function normalizeSearchLanguages(value, fallback) {
    const parts = String(value || fallback || "fi")
      .split(",")
      .map((item) => normalizeSearchLanguage(item))
      .filter(Boolean);
    return [...new Set(parts)];
  }

  const kindConfig = {
    writings: {
      filterPrefix: "Writings",
      typeFilterKey: "Writings content type",
      resultMeta(entry, state) {
        return [state.typeLabel, state.year].filter(Boolean);
      },
      excerpt(data) {
        return data?.excerpt || "";
      },
      requiresQueryForSearch: true
    },
    theses: {
      filterPrefix: "Theses",
      typeFilterKey: "Theses type",
      resultMeta(entry, state) {
        return [entry.authorLine, entry.typeLabel, entry.year].filter(Boolean);
      },
      excerpt(data) {
        return data?.meta?.thesesDescription || data?.excerpt || "";
      },
      requiresQueryForSearch: false
    }
  };

  function filtersFor(mount, state) {
    const kind = mount.dataset.findExploreKind || "writings";
    const config = kindConfig[kind] || kindConfig.writings;
    const prefix = config.filterPrefix || "FindExplore";
    const filters = {
      FindExplore: kind
    };

    const scope = mount.dataset.findExploreScope;
    if (scope) filters[`${prefix} scope`] = scope;

    const languageFilter = mount.dataset.findExploreLanguageFilter;
    if (languageFilter) filters.Kieli = languageFilter;

    if (state.type) filters[config.typeFilterKey || `${prefix} type`] = state.type;
    if (state.year) filters[`${prefix} year`] = state.year;
    if (state.topic) filters[`${prefix} topic`] = state.topic;
    return filters;
  }

  function readInitialState(mount) {
    const params = new URLSearchParams(window.location.search);
    return {
      q: params.get("q") || "",
      type: params.get("type") || "",
      year: params.get("year") || "",
      topic: params.get("topic") || ""
    };
  }

  function updateUrl(state) {
    const next = new URLSearchParams(window.location.search);
    Object.entries(state).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    const query = next.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }

  function createResultEntry(kind, data, state) {
    const title = resultTitle(data);
    const normalizedUrl = normalizeUrl(data?.url);
    const typeLabel = state.typeLabel || data?.meta?.thesesType || "";
    const year = state.year || data?.meta?.writingsYear || data?.meta?.thesesYear || "";
    const authorLine = data?.meta?.thesesAuthorLine || "";
    const meta = kindConfig[kind].resultMeta({
      authorLine,
      typeLabel,
      year
    }, {
      ...state,
      typeLabel,
      year
    });

    return {
      url: normalizedUrl,
      title,
      excerpt: kindConfig[kind].excerpt(data),
      meta
    };
  }

  function initMount(mount) {
    const kind = mount.dataset.findExploreKind || "writings";
    const config = kindConfig[kind] || kindConfig.writings;
    const lang = (mount.dataset.findExploreLang || document.documentElement.lang || "fi").slice(0, 2);
    const labels = text[lang] || text.fi;
    const searchLanguages = normalizeSearchLanguages(mount.dataset.findExploreSearchLanguage, lang);
    const pagefindPromises = searchLanguages.map((language) => createSearch(language));
    const queryInput = mount.querySelector("[data-find-explore-query]");
    const typeSelect = mount.querySelector("[data-find-explore-type]");
    const yearSelect = mount.querySelector("[data-find-explore-year]");
    const topicSelect = mount.querySelector("[data-find-explore-topic]");
    const resetButton = mount.querySelector("[data-find-explore-reset]");
    const status = mount.querySelector("[data-find-explore-status]");
    const resultsList = mount.querySelector("[data-find-explore-results]");
    const moreButton = mount.querySelector("[data-find-explore-more]");
    const seedQuery = mount.dataset.findExploreSeedQuery || "";

    mount.dataset.findExploreReady = "false";

    let latestResults = [];
    let visibleCount = PAGE_SIZE;

    function readState() {
      return {
        q: queryInput?.value.trim() || "",
        type: typeSelect?.value || "",
        year: yearSelect?.value || "",
        topic: topicSelect?.value || ""
      };
    }

    function writeState(state) {
      if (queryInput) queryInput.value = state.q || "";
      if (typeSelect) typeSelect.value = state.type || "";
      if (yearSelect) yearSelect.value = state.year || "";
      if (topicSelect) topicSelect.value = state.topic || "";
    }

    writeState(readInitialState(mount));

    function renderResults() {
      const slice = latestResults.slice(0, visibleCount);
      resultsList.innerHTML = slice.map((entry) => {
        const title = escapeHtml(entry.title);
        const url = escapeHtml(entry.url);
        const excerpt = entry.excerpt ? escapeHtml(entry.excerpt) : "";
        return `<li class="find-explore-result">
          <a class="find-explore-result-title" href="${url}">${title}</a>
          ${entry.meta.length ? `<div class="find-explore-result-meta">${entry.meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
          ${excerpt ? `<p class="find-explore-result-excerpt">${excerpt}</p>` : ""}
        </li>`;
      }).join("");
      moreButton?.classList.toggle("d-none", visibleCount >= latestResults.length);
    }

    async function runSearch() {
      const state = readState();
      const hasQuery = Boolean(state.q);
      const hasFilters = Boolean(state.type || state.year || state.topic);
      const effectiveQuery = hasQuery ? state.q : ((hasFilters && seedQuery) ? seedQuery : "");

      updateUrl(state);
      visibleCount = PAGE_SIZE;

      if (!effectiveQuery && config.requiresQueryForSearch) {
        latestResults = [];
        resultsList.innerHTML = "";
        moreButton?.classList.add("d-none");
        status.textContent = labels.idle;
        return;
      }

      if (!effectiveQuery) {
        latestResults = [];
        resultsList.innerHTML = "";
        moreButton?.classList.add("d-none");
        status.textContent = labels.idle;
        return;
      }

      status.textContent = labels.loading;

      try {
        const filterSet = filtersFor(mount, state);
        const searchResults = await Promise.all(pagefindPromises.map(async (pagefindPromise) => {
          const pagefind = await pagefindPromise;
          return pagefind.search(effectiveQuery, {
            filters: filterSet
          });
        }));

        const typeLabel = typeSelect?.selectedOptions?.[0]?.textContent?.replace(/\s+\(\d+\)$/, "") || "";
        const merged = [];
        for (const searchResult of searchResults) {
          merged.push(...searchResult.results.slice(0, 50));
        }
        merged.sort((left, right) => (right.score || 0) - (left.score || 0));

        const seen = new Set();
        const entries = [];
        for (const result of merged) {
          const data = await result.data();
          const entry = createResultEntry(kind, data, {
            ...state,
            typeLabel
          });
          if (!entry.url || seen.has(entry.url)) continue;
          seen.add(entry.url);
          entries.push(entry);
          if (entries.length >= 50) break;
        }

        latestResults = entries;

        status.textContent = latestResults.length ? labels.count(latestResults.length) : labels.noResults;
        renderResults();
      } catch (error) {
        latestResults = [];
        resultsList.innerHTML = "";
        moreButton?.classList.add("d-none");
        status.textContent = labels.error;
        console.warn("FindExplore search failed", error);
      }
    }

    const debouncedSearch = debounce(runSearch);
    queryInput?.addEventListener("input", debouncedSearch);
    typeSelect?.addEventListener("change", runSearch);
    yearSelect?.addEventListener("change", runSearch);
    topicSelect?.addEventListener("change", runSearch);
    resetButton?.addEventListener("click", () => {
      writeState({ q: "", type: "", year: "", topic: "" });
      queryInput?.focus();
      runSearch();
    });
    moreButton?.addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      renderResults();
    });
    window.addEventListener("popstate", () => {
      writeState(readInitialState(mount));
      runSearch();
    });

    mount.dataset.findExploreReady = "true";
    runSearch();
  }

  mounts.forEach((mount) => initMount(mount));
})();

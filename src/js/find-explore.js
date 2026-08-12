(function () {
  "use strict";

  const PAGE_SIZE = 10;
  const mounts = Array.from(document.querySelectorAll("[data-find-explore]"));
  if (!mounts.length) return;

  const text = {
    fi: {
      idle: "Kirjoita hakusana tai rajaa tuloksia. Avausosiot toimivat myös ilman hakua.",
      loading: "Haetaan kirjoituksia...",
      noResults: "Tuloksia ei löytynyt.",
      count: (count) => `${count} ${count === 1 ? "tulos" : "tulosta"}`,
      error: "Hakemisto ei ole käytettävissä tässä buildissä.",
      open: "Avaa"
    },
    en: {
      idle: "Type a search term or narrow the result set. The curated opening sections work without search.",
      loading: "Searching writings...",
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

  function resultTitle(data) {
    return data?.meta?.title || data?.title || data?.url || "";
  }

  function normalizeUrl(url) {
    if (!url) return "";
    try {
      return new URL(url, window.location.origin).pathname;
    } catch {
      return String(url);
    }
  }

  function filtersFor(mount, type, year) {
    const filters = {
      Kieli: mount.dataset.findExploreLanguageFilter || "Suomi",
      FindExplore: "writings",
      "Writings scope": mount.dataset.findExploreScope || "fi"
    };
    if (type) filters["Writings content type"] = type;
    if (year) filters["Writings year"] = year;
    return filters;
  }

  const searchCache = new Map();

  function normalizeSearchLanguage(language) {
    return String(language || "fi").slice(0, 2).toLowerCase() || "fi";
  }

  async function createSearch(language) {
    const searchLanguage = normalizeSearchLanguage(language);
    if (searchCache.has(searchLanguage)) return searchCache.get(searchLanguage);

    const promise = (async () => {
      const root = document.documentElement;
      const previousLang = root.getAttribute("lang");
      root.setAttribute("lang", searchLanguage);

      try {
        const pagefind = await import("/pagefind/pagefind.js");
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

  function initMount(mount) {
    const lang = (mount.dataset.findExploreLang || document.documentElement.lang || "fi").slice(0, 2);
    const pagefindPromise = createSearch(mount.dataset.findExploreSearchLanguage || lang);
    const labels = text[lang] || text.fi;
    const queryInput = mount.querySelector("[data-find-explore-query]");
    const typeSelect = mount.querySelector("[data-find-explore-type]");
    const yearSelect = mount.querySelector("[data-find-explore-year]");
    const resetButton = mount.querySelector("[data-find-explore-reset]");
    const status = mount.querySelector("[data-find-explore-status]");
    const resultsList = mount.querySelector("[data-find-explore-results]");
    const moreButton = mount.querySelector("[data-find-explore-more]");

    let latestResults = [];
    let visibleCount = PAGE_SIZE;

    const params = new URLSearchParams(window.location.search);
    queryInput.value = params.get("q") || "";
    typeSelect.value = params.get("type") || "";
    yearSelect.value = params.get("year") || "";

    function updateUrl() {
      const next = new URLSearchParams(window.location.search);
      const values = {
        q: queryInput.value.trim(),
        type: typeSelect.value,
        year: yearSelect.value
      };
      Object.entries(values).forEach(([key, value]) => {
        if (value) next.set(key, value);
        else next.delete(key);
      });
      const query = next.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
    }

    function renderResults() {
      const slice = latestResults.slice(0, visibleCount);
      resultsList.innerHTML = slice.map((entry) => {
        const title = escapeHtml(entry.title);
        const url = escapeHtml(entry.url);
        const excerpt = entry.excerpt || "";
        const meta = [entry.typeLabel, entry.year].filter(Boolean);
        return `<li class="find-explore-result">
          <a class="find-explore-result-title" href="${url}">${title}</a>
          ${meta.length ? `<div class="find-explore-result-meta">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
          ${excerpt ? `<p class="find-explore-result-excerpt">${excerpt}</p>` : ""}
        </li>`;
      }).join("");
      moreButton.classList.toggle("d-none", visibleCount >= latestResults.length);
    }

    async function runSearch() {
      const query = queryInput.value.trim();
      const type = typeSelect.value;
      const year = yearSelect.value;

      updateUrl();
      visibleCount = PAGE_SIZE;

      if (!query) {
        latestResults = [];
        resultsList.innerHTML = "";
        moreButton.classList.add("d-none");
        status.textContent = labels.idle;
        return;
      }

      status.textContent = labels.loading;

      try {
        const pagefind = await pagefindPromise;
        const searchResult = await pagefind.search(query, {
          filters: filtersFor(mount, type, year)
        });
        const typeLabel = typeSelect.selectedOptions[0]?.textContent?.replace(/\s+\(\d+\)$/, "") || "";
        latestResults = await Promise.all(searchResult.results.slice(0, 50).map(async (result) => {
          const data = await result.data();
          return {
            url: normalizeUrl(data?.url),
            title: resultTitle(data),
            excerpt: data?.excerpt || "",
            typeLabel: type ? typeLabel : "",
            year
          };
        }));
        status.textContent = latestResults.length ? labels.count(latestResults.length) : labels.noResults;
        renderResults();
      } catch (error) {
        latestResults = [];
        resultsList.innerHTML = "";
        moreButton.classList.add("d-none");
        status.textContent = labels.error;
        console.warn("FindExplore search failed", error);
      }
    }

    const debouncedSearch = debounce(runSearch);
    queryInput.addEventListener("input", debouncedSearch);
    typeSelect.addEventListener("change", runSearch);
    yearSelect.addEventListener("change", runSearch);
    resetButton.addEventListener("click", () => {
      queryInput.value = "";
      typeSelect.value = "";
      yearSelect.value = "";
      queryInput.focus();
      runSearch();
    });
    moreButton.addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      renderResults();
    });
    window.addEventListener("popstate", () => {
      const next = new URLSearchParams(window.location.search);
      queryInput.value = next.get("q") || "";
      typeSelect.value = next.get("type") || "";
      yearSelect.value = next.get("year") || "";
      runSearch();
    });

    runSearch();
  }

  mounts.forEach((mount) => initMount(mount));
})();

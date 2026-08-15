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
      open: "Avaa",
      source: "Lähde",
      exportCitation: "Vie viite",
      peerReviewed: "Vertaisarvioitu",
      openAccess: "Open access",
      citations: (count) => `${count} viittausta`,
      kindLabels: {
        writings: "Kirjoitus",
        theses: "Opinnäyte",
        publications: "Julkaisu"
      }
    },
    en: {
      idle: "Type a search term or narrow the result set. The curated opening sections work without search.",
      loading: "Searching...",
      noResults: "No results found.",
      count: (count) => `${count} ${count === 1 ? "result" : "results"}`,
      error: "The search index is not available in this build.",
      open: "Open",
      source: "Source",
      exportCitation: "Export citation",
      peerReviewed: "Peer-reviewed",
      openAccess: "Open access",
      citations: (count) => `${count} citations`,
      kindLabels: {
        writings: "Writing",
        theses: "Thesis",
        publications: "Publication"
      }
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
    },
    publications: {
      filterPrefix: "Publications",
      typeFilterKey: "Publications group",
      resultMeta(entry, state) {
        return [entry.authors, entry.typeLabel, entry.year, entry.venue].filter(Boolean);
      },
      excerpt(data, record) {
        return record?.description || data?.meta?.publicationDescription || data?.excerpt || "";
      },
      requiresQueryForSearch: false
    },
    researchContext: {
      filterPrefix: "Research",
      resultMeta(entry) {
        return [entry.kindLabel, ...entry.meta].filter(Boolean);
      },
      excerpt(data, record) {
        if (record?.description) return record.description;
        return data?.meta?.publicationDescription || data?.meta?.thesesDescription || data?.excerpt || "";
      },
      requiresQueryForSearch: false,
      contextual: true
    }
  };

  function parseList(value, fallback = []) {
    const items = String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : fallback;
  }

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
    if (state.quality) filters[`${prefix} quality`] = state.quality;
    return filters;
  }

  function filtersForKind(mount, state, kind) {
    const config = kindConfig[kind] || kindConfig.writings;
    const prefix = config.filterPrefix || "FindExplore";
    const filters = {
      FindExplore: kind
    };

    const scope = mount.dataset.findExploreScope;
    if (scope) filters[`${prefix} scope`] = scope;

    const languageFilter = mount.dataset.findExploreLanguageFilter;
    if (languageFilter) filters.Kieli = languageFilter;

    if ((mount.dataset.findExploreKind || "") === "researchContext") {
      filters["Research context"] = "research";
    }

    if (state.year) filters[`${prefix} year`] = state.year;
    if (state.topic) filters[`${prefix} topic`] = state.topic;
    if (state.quality && kind === "publications") filters[`${prefix} quality`] = state.quality;
    return filters;
  }

  function readInitialState(mount) {
    const params = new URLSearchParams(window.location.search);
    return {
      q: params.get("q") || "",
      type: params.get("type") || "",
      year: params.get("year") || "",
      topic: params.get("topic") || "",
      quality: params.get("quality") || ""
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

  function readRecords(mount) {
    const holder = mount.dataset.findExploreRecordsId
      ? mount
      : mount.closest("[data-find-explore-records-id]");
    const id = holder?.dataset.findExploreRecordsId;
    if (!id) return new Map();
    const source = document.getElementById(id);
    if (!source) return new Map();
    try {
      const records = JSON.parse(source.textContent || "[]");
      return new Map(records.map((record) => [normalizeUrl(record.pageUrl), record]));
    } catch (error) {
      console.warn("FindExplore record data parse failed", error);
      return new Map();
    }
  }

  function createResultEntry(kind, data, state, recordsByUrl, labels) {
    const title = resultTitle(data);
    const normalizedUrl = normalizeUrl(data?.url);
    const record = recordsByUrl.get(normalizedUrl) || null;
    const typeLabel = state.typeLabel || data?.meta?.thesesType || "";
    const year = state.year || data?.meta?.writingsYear || data?.meta?.thesesYear || "";
    const authorLine = data?.meta?.thesesAuthorLine || "";
    const publicationMeta = record ? {
      authors: record.authors || "",
      typeLabel: record.typeCode || record.group || "",
      year: record.year || "",
      venue: record.venue || "",
      citationCount: record.citationCount || 0,
      jufoLevel: record.jufoLevel || "",
      peerReviewed: record.peerReviewed,
      openAccess: record.openAccess
    } : {
      authors: data?.meta?.publicationAuthors || "",
      typeLabel: data?.meta?.publicationType || data?.meta?.publicationGroup || "",
      year: data?.meta?.publicationYear || "",
      venue: data?.meta?.publicationVenue || ""
    };
    const resolvedTypeLabel = publicationMeta.typeLabel || typeLabel;
    const resolvedYear = publicationMeta.year || year;
    const effectiveConfig = kindConfig[kind] || kindConfig.writings;
    const meta = effectiveConfig.resultMeta({
      authorLine,
      ...publicationMeta,
      kindLabel: labels?.kindLabels?.[kind] || kind,
      typeLabel: resolvedTypeLabel,
      year: resolvedYear
    }, {
      ...state,
      typeLabel: resolvedTypeLabel,
      year: resolvedYear
    });

    return {
      kind,
      url: normalizedUrl,
      title: record?.title || title,
      excerpt: effectiveConfig.excerpt(data, record),
      meta,
      record
    };
  }

  function initMount(mount) {
    const kind = mount.dataset.findExploreKind || "writings";
    const config = kindConfig[kind] || kindConfig.writings;
    const contextualKinds = parseList(mount.dataset.findExploreKinds, ["publications", "theses", "writings"])
      .filter((value) => kindConfig[value]);
    const lang = (mount.dataset.findExploreLang || document.documentElement.lang || "fi").slice(0, 2);
    const labels = text[lang] || text.fi;
    const searchLanguages = normalizeSearchLanguages(mount.dataset.findExploreSearchLanguage, lang);
    const queryInput = mount.querySelector("[data-find-explore-query]");
    const typeSelect = mount.querySelector("[data-find-explore-type]");
    const yearSelect = mount.querySelector("[data-find-explore-year]");
    const topicSelect = mount.querySelector("[data-find-explore-topic]");
    const qualitySelect = mount.querySelector("[data-find-explore-quality]");
    const resetButton = mount.querySelector("[data-find-explore-reset]");
    const status = mount.querySelector("[data-find-explore-status]");
    const resultsList = mount.querySelector("[data-find-explore-results]");
    const moreButton = mount.querySelector("[data-find-explore-more]");
    const seedQuery = mount.dataset.findExploreSeedQuery || "";
    const recordsByUrl = readRecords(mount);

    mount.dataset.findExploreReady = "false";

    let latestResults = [];
    let visibleCount = PAGE_SIZE;

    function readState() {
      return {
        q: queryInput?.value.trim() || "",
        type: typeSelect?.value || "",
        year: yearSelect?.value || "",
        topic: topicSelect?.value || "",
        quality: qualitySelect?.value || ""
      };
    }

    function writeState(state) {
      if (queryInput) queryInput.value = state.q || "";
      if (typeSelect) typeSelect.value = state.type || "";
      if (yearSelect) yearSelect.value = state.year || "";
      if (topicSelect) topicSelect.value = state.topic || "";
      if (qualitySelect) qualitySelect.value = state.quality || "";
    }

    writeState(readInitialState(mount));

    function citationButton(record) {
      if (!record) return "";
      if (!document.getElementById("citationExportModal")) return "";
      return `<button type="button" class="btn btn-sm btn-outline-secondary rounded-pill export-citation-btn"`
        + ` data-title="${escapeHtml(record.title || "")}" data-authors="${escapeHtml(record.authors || "")}"`
        + ` data-year="${escapeHtml(record.year || "")}" data-journal="${escapeHtml(record.journal || "")}"`
        + ` data-doi="${escapeHtml(record.doi || "")}" data-url="${escapeHtml(record.sourceUrl || record.doiUrl || "")}"`
        + ` data-volume="${escapeHtml(record.volume || "")}" data-issue="${escapeHtml(record.issue || "")}"`
        + ` data-pages="${escapeHtml(record.pages || "")}" data-publisher="${escapeHtml(record.publisher || "")}"`
        + ` data-isbn="${escapeHtml(record.isbn || "")}" title="${escapeHtml(labels.exportCitation)}">`
        + `<i class="bi bi-download me-1" aria-hidden="true"></i>${escapeHtml(labels.exportCitation)}</button>`;
    }

    function publicationBadges(record) {
      if (!record) return "";
      const badges = [];
      if (record.peerReviewed) badges.push(`<span class="badge text-bg-primary">${escapeHtml(labels.peerReviewed)}</span>`);
      if (record.openAccess) badges.push(`<span class="badge text-bg-success">${escapeHtml(labels.openAccess)}</span>`);
      if (record.jufoLevel !== "" && record.jufoLevel != null) badges.push(`<span class="badge text-bg-light text-dark border">JUFO ${escapeHtml(record.jufoLevel)}</span>`);
      if (record.citationCount) badges.push(`<span class="badge text-bg-warning text-dark">${escapeHtml(labels.citations(record.citationCount))}</span>`);
      return badges.join("");
    }

    function sourceLink(record) {
      const href = record?.sourceUrl || record?.doiUrl || "";
      if (!href) return "";
      return `<a class="btn btn-sm btn-outline-primary rounded-pill" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(labels.source)} <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i></a>`;
    }

    function renderPublicationResult(entry) {
      const record = entry.record;
      const title = escapeHtml(entry.title);
      const url = escapeHtml(entry.url);
      const excerpt = entry.excerpt ? escapeHtml(entry.excerpt) : "";
      const meta = entry.meta.length
        ? `<div class="find-explore-result-meta">${entry.meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`
        : "";
      return `<li class="find-explore-result find-explore-result--publication">
        <a class="find-explore-result-title" href="${url}">${title}</a>
        ${meta}
        ${publicationBadges(record) ? `<div class="d-flex flex-wrap gap-2 mt-2">${publicationBadges(record)}</div>` : ""}
        ${excerpt ? `<p class="find-explore-result-excerpt">${excerpt}</p>` : ""}
        <div class="d-flex flex-wrap gap-2 mt-2">
          <a class="btn btn-sm btn-primary rounded-pill" href="${url}">${escapeHtml(labels.open)}</a>
          ${sourceLink(record)}
          ${citationButton(record)}
        </div>
      </li>`;
    }

    function renderResults() {
      const slice = latestResults.slice(0, visibleCount);
      resultsList.innerHTML = slice.map((entry) => {
        if (entry.kind === "publications" && entry.record) return renderPublicationResult(entry);
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
      const hasFilters = Boolean(state.type || state.year || state.topic || state.quality);
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
        const searchResults = [];
        const searchKinds = config.contextual
          ? (state.type ? [state.type] : contextualKinds)
          : [kind];
        for (const searchKind of searchKinds) {
          const filterSet = config.contextual
            ? filtersForKind(mount, state, searchKind)
            : filtersFor(mount, state);
          for (const language of searchLanguages) {
            const pagefind = await createSearch(language);
            const result = await pagefind.search(effectiveQuery, {
              filters: filterSet
            });
            searchResults.push({ kind: searchKind, result });
          }
        }

        const typeLabel = typeSelect?.selectedOptions?.[0]?.textContent?.replace(/\s+\(\d+\)$/, "") || "";
        const merged = [];
        for (const searchResult of searchResults) {
          searchResult.result.results.slice(0, 50).forEach((result) => {
            merged.push({ kind: searchResult.kind, result });
          });
        }
        merged.sort((left, right) => (right.result.score || 0) - (left.result.score || 0));

        const seen = new Set();
        const entries = [];
        for (const item of merged) {
          const data = await item.result.data();
          const entry = createResultEntry(item.kind, data, {
            ...state,
            typeLabel
          }, recordsByUrl, labels);
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
    qualitySelect?.addEventListener("change", runSearch);
    resetButton?.addEventListener("click", () => {
      writeState({ q: "", type: "", year: "", topic: "", quality: "" });
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

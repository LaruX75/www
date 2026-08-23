/**
 * Global search page (Modular UI) — locale-agnostic controller
 * shared by /haku/ (FI) and /en/search/ (EN).
 *
 * Uses Pagefind 1.5.2 Modular UI (Instance + Input + FilterPills)
 * plus a small site-owned layer for:
 *   - eager paginated result rendering (bypasses Modular UI's
 *     ResultList to avoid its below-fold IntersectionObserver
 *     lazy-hydration regression documented in the PF5-G1 /haku/
 *     pilot);
 *   - localised summary text (Modular UI's Summary component
 *     hard-codes English in 1.5.2);
 *   - post-render aria-label decoration of FilterPills wrappers
 *     (Pagefind 1.5.2 has no FilterPills translation surface —
 *     tracked as CONTINGENT DELETION).
 *
 * All locale-specific strings + facet labels are supplied via an
 * inline `<script type="application/json" id="siteSearchPageConfig">`
 * emitted by src/_includes/_search-page-config.njk. This module
 * therefore ships zero user-facing strings.
 *
 * If Modular UI fails to load, the SSR fallback form remains
 * visible and submits ?q= via a server-side round-trip.
 */
(function () {
  "use strict";

  const mount = document.getElementById("siteSearchPageUi");
  if (!mount) return;

  const PAGE_SIZE = 10;

  function readConfig() {
    const script = document.getElementById("siteSearchPageConfig");
    if (!script) {
      throw new Error("siteSearchPageConfig JSON is missing on this page.");
    }
    try {
      return JSON.parse(script.textContent || "{}");
    } catch (error) {
      throw new Error("siteSearchPageConfig JSON failed to parse: " + error.message);
    }
  }

  const config = readConfig();
  const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
  const languageFilter = config.languageFilter || mount.dataset.pagefindLang || "Suomi";
  const placeholder = config.placeholder || mount.dataset.pagefindPlaceholder || "";
  const regionLabel = config.regionLabel || "";
  const fallbackMessage = config.fallbackMessage || "";
  const translations = config.translations || {};
  const FACET_GROUPS = Array.isArray(config.facetGroups) ? config.facetGroups : [];
  const fallbackForm = document.querySelector("[data-search-page-fallback]");
  const fallbackInput = fallbackForm?.querySelector("[data-search-page-fallback-input]");

  if (fallbackInput && initialQuery) {
    fallbackInput.value = initialQuery;
  }

  let instance = null;
  let inputElement = null;
  let urlSyncDebounce = null;

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function renderShell() {
    // Idempotent shell: keep DOM stable so the pilot spec can assert
    // the absence of `.pagefind-ui__*` classes on this surface.
    mount.innerHTML = `
      <div class="site-search-page-modular" data-search-modular-ui>
        <label for="siteSearchPageInput" class="form-label fw-semibold visually-hidden">${escapeHtml(translations.search_label || "")}</label>
        <div class="input-group input-group-lg mb-3" data-search-modular-input-container>
          <input
            id="siteSearchPageInput"
            class="form-control"
            type="search"
            autocomplete="off"
            placeholder="${escapeHtml(placeholder)}"
            aria-label="${escapeHtml(translations.search_label || "")}"
            data-search-modular-input
          />
        </div>
        <div class="site-search-page-filters mb-3" data-search-modular-filters role="region" aria-label="${escapeHtml(regionLabel)}">
          ${FACET_GROUPS.map((group) => `
            <div
              data-search-modular-filter-slot
              data-search-modular-filter-name="${escapeHtml(group.filter)}"
              data-search-modular-filter-label="${escapeHtml(group.label)}"
            ></div>`).join("")}
        </div>
        <div class="site-search-page-summary text-body-secondary small mb-3" data-search-modular-summary aria-live="polite" aria-atomic="true"></div>
        <div class="site-search-page-results" data-search-modular-results></div>
      </div>
    `;
  }

  function loadModularUi() {
    return new Promise((resolve, reject) => {
      if (window.PagefindModularUI) {
        resolve(window.PagefindModularUI);
        return;
      }
      const script = document.createElement("script");
      script.src = "/pagefind/pagefind-modular-ui.js";
      script.defer = false;
      script.async = true;
      script.onload = () => {
        if (window.PagefindModularUI) {
          resolve(window.PagefindModularUI);
        } else {
          reject(new Error("PagefindModularUI not registered after script load"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load /pagefind/pagefind-modular-ui.js"));
      document.head.appendChild(script);
    });
  }

  // Probe Pagefind's supported Search API to discover which filter
  // names actually exist in the current language partition. This
  // lets us mount FilterPills only for filters Pagefind knows
  // about; Pagefind still owns filter values and filter state.
  // Falls back to accepting every configured facet if the probe
  // fails, in which case FilterPills' own alwaysShow:false hides
  // wrappers that never receive data.
  async function discoverAvailableFilterNames() {
    try {
      const pagefindModule = await import("/pagefind/pagefind.js");
      const filters = await pagefindModule.filters();
      return new Set(Object.keys(filters || {}));
    } catch (_) {
      return null;
    }
  }

  function ensurePresenter() {
    if (window.SearchResultPresenter && typeof window.SearchResultPresenter.renderSharedCard === "function") {
      return window.SearchResultPresenter;
    }
    throw new Error("SearchResultPresenter is not available. Load /js/search-result-presenter.js before this script.");
  }

  async function initModular(PagefindModularUI) {
    const presenter = ensurePresenter();

    // Probe Pagefind's supported filters() API before creating the
    // Instance so we know which filters actually exist in the
    // current language partition. This is Pagefind's public Search
    // API, not an internal — see docs.
    const availableFilterNames = await discoverAvailableFilterNames();

    instance = new PagefindModularUI.Instance({
      bundlePath: "/pagefind/",
      translations
    });

    inputElement = mount.querySelector("[data-search-modular-input]");
    const summaryEl = mount.querySelector("[data-search-modular-summary]");
    const resultsEl = mount.querySelector("[data-search-modular-results]");

    // Modular UI's Input takes a SELECTOR STRING, not an element
    // reference. querySelector inside the component wires it up.
    instance.add(new PagefindModularUI.Input({ inputElement: "#siteSearchPageInput" }));

    // Facet parity with PF5-G1 pilot: one Modular UI FilterPills per
    // user-meaningful group defined in FACET_GROUPS. Empty groups
    // auto-hide (alwaysShow: false). Pagefind owns filter values,
    // hit counts, filter application, and state; the site only
    // decides which UI components to mount + owns per-slot
    // container placement + locale-aware accessible-name
    // decoration.
    //
    // Registration is gated by Pagefind's own filters() probe
    // (availableFilterNames). Filters absent from the current
    // language partition are not mounted at all. This is a Pagefind-
    // supported condition — not a workaround over an internal error.
    // If the probe failed (availableFilterNames === null), fall back
    // to mounting every configured slot; FilterPills' alwaysShow:false
    // hides wrappers that never receive data.
    const slots = Array.from(mount.querySelectorAll("[data-search-modular-filter-slot]"));
    for (const slot of slots) {
      const filterName = slot.dataset.searchModularFilterName;
      if (!filterName) continue;
      if (availableFilterNames && !availableFilterNames.has(filterName)) {
        // Filter is not indexed in this language partition — do not
        // mount a FilterPills for it. The slot stays present in the
        // DOM (empty), so downstream tests can distinguish
        // "configured but not present in partition" from "not
        // configured at all".
        continue;
      }
      slot.setAttribute("id", "search-modular-filter-" + slots.indexOf(slot));
      instance.add(new PagefindModularUI.FilterPills({
        containerElement: "#" + slot.id,
        filter: filterName,
        selectMultiple: true,
        alwaysShow: false
      }));
    }

    // Post-render locale-aware aria decoration — CONTINGENT DELETION.
    // Compatibility workaround for Pagefind 1.5.2's lack of a
    // FilterPills translation/accessibility-label API. This observer:
    //   - does NOT own filter state
    //   - does NOT modify filter values or hit counts
    //   - does NOT alter Pagefind ranking or search semantics
    //   - does NOT patch Modular UI's rendering logic
    // It only replaces each rendered wrapper's English aria-labelledby
    // with the site-owned locale label. Idempotent via
    // data-search-modular-i18n. Remove when a supported Pagefind
    // FilterPills translation surface becomes available.
    const localiseFacet = (slot) => {
      const wrapper = slot.querySelector(".pagefind-modular-filter-pills-wrapper");
      if (!wrapper || wrapper.dataset.searchModularI18n === "done") return;
      const label = slot.dataset.searchModularFilterLabel;
      if (!label) return;
      wrapper.setAttribute("aria-label", label);
      wrapper.removeAttribute("aria-labelledby");
      wrapper.dataset.searchModularI18n = "done";
    };
    const facetObserver = new MutationObserver(() => {
      for (const slot of slots) localiseFacet(slot);
    });
    facetObserver.observe(mount.querySelector("[data-search-modular-filters]"), {
      childList: true,
      subtree: true
    });
    for (const slot of slots) localiseFacet(slot);

    // Result rendering — we do NOT use Modular UI's ResultList; see
    // module header comment. Pagefind's Instance keeps state and
    // ranking; we render results eagerly in paginated batches.
    let currentResults = [];
    let currentTerm = "";
    let renderedCount = 0;
    let renderVersion = 0;

    const renderBatch = async (upTo) => {
      const target = Math.min(upTo, currentResults.length);
      if (target <= renderedCount) return;
      const batch = currentResults.slice(renderedCount, target);
      const version = renderVersion;
      renderedCount = target;
      const html = await Promise.all(batch.map(async (raw) => {
        try {
          const data = await raw.data();
          return presenter.renderSharedCard(data);
        } catch (_) {
          return "";
        }
      }));
      if (version !== renderVersion) return;
      resultsEl.insertAdjacentHTML("beforeend", html.join(""));
      updateLoadMore();
    };

    const ensureLoadMore = () => {
      let btn = mount.querySelector("[data-search-modular-load-more]");
      if (btn) return btn;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-outline-secondary rounded-pill mt-3";
      btn.setAttribute("data-search-modular-load-more", "");
      btn.addEventListener("click", () => renderBatch(renderedCount + PAGE_SIZE));
      resultsEl.after(btn);
      return btn;
    };

    const updateLoadMore = () => {
      const btn = ensureLoadMore();
      if (renderedCount >= currentResults.length) {
        btn.hidden = true;
        return;
      }
      btn.hidden = false;
      btn.textContent = translations.load_more || "";
    };

    const clearResults = () => {
      resultsEl.innerHTML = "";
      renderedCount = 0;
      const btn = mount.querySelector("[data-search-modular-load-more]");
      if (btn) btn.hidden = true;
    };

    instance.on("search", (term) => {
      renderVersion += 1;
      currentTerm = String(term || "").trim();
      clearResults();
      if (!currentTerm) {
        summaryEl.textContent = "";
        return;
      }
      const t = translations.searching || "";
      summaryEl.textContent = t.replace("[SEARCH_TERM]", currentTerm);
    });

    instance.on("results", (payload) => {
      renderVersion += 1;
      currentResults = Array.isArray(payload?.results) ? payload.results : [];
      const count = currentResults.length;
      renderedCount = 0;
      resultsEl.innerHTML = "";
      const template = count === 0
        ? (translations.zero_results || "")
        : count === 1
          ? (translations.one_result || "")
          : (translations.many_results || "");
      summaryEl.textContent = template
        .replace("[COUNT]", String(count))
        .replace("[SEARCH_TERM]", currentTerm);
      if (count > 0) {
        renderBatch(PAGE_SIZE);
      } else {
        updateLoadMore();
      }
    });

    // Pin the language filter so this surface returns only its own
    // language's results, matching pre-G1 Default UI behaviour. When
    // ?q= is present, we combine the language pin + initial query
    // into a single atomic `triggerSearchWithFilters` dispatch so
    // Instance runs exactly one search with both applied. Two
    // separate calls (triggerFilters + triggerSearch) can race and
    // drop the filter on the second dispatch.
    const pinnedFilters = { Kieli: [languageFilter] };
    if (initialQuery && inputElement) {
      inputElement.value = initialQuery;
      if (typeof instance.triggerSearchWithFilters === "function") {
        instance.triggerSearchWithFilters(initialQuery, pinnedFilters);
      } else if (typeof instance.triggerFilters === "function") {
        instance.triggerFilters(pinnedFilters);
      }
    } else if (typeof instance.triggerFilters === "function") {
      instance.triggerFilters(pinnedFilters);
    }

    // Debounced URL sync so a query is shareable via ?q=.
    if (inputElement) {
      inputElement.addEventListener("input", () => {
        if (urlSyncDebounce) window.clearTimeout(urlSyncDebounce);
        urlSyncDebounce = window.setTimeout(() => {
          const value = String(inputElement.value || "").trim();
          const params = new URLSearchParams(window.location.search);
          if (value) params.set("q", value);
          else params.delete("q");
          const next = window.location.pathname
            + (params.toString() ? "?" + params.toString() : "")
            + window.location.hash;
          window.history.replaceState({}, "", next);
        }, 400);
      });
    }

    if (fallbackForm) {
      fallbackForm.hidden = true;
    }

    // Ready marker: tests wait on this so they never race the
    // component registration. Real users don't observe it.
    mount.dataset.searchModularReady = "true";
  }

  function bootstrap() {
    renderShell();
    loadModularUi()
      .then(initModular)
      .catch((error) => {
        console.warn("[global search Modular UI] init failed:", error);
        mount.innerHTML = `<p class="alert alert-info mb-0">${escapeHtml(fallbackMessage)}</p>`;
        if (fallbackForm) {
          fallbackForm.hidden = false;
        }
      });
  }

  if (fallbackForm) {
    fallbackForm.addEventListener("submit", (event) => {
      const query = String(fallbackInput?.value || "").trim();
      if (!instance || !query) return;
      event.preventDefault();
      const params = new URLSearchParams(window.location.search);
      params.set("q", query);
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
      if (inputElement) {
        inputElement.value = query;
      }
      if (typeof instance.triggerSearch === "function") {
        instance.triggerSearch(query);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap);
  } else {
    bootstrap();
  }
})();

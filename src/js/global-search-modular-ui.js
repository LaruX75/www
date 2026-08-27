/**
 * Shared modular-search factory + page bootstrapper.
 *
 * Owns the reusable Pagefind Modular UI engine used by BOTH:
 *   - /haku/ (FI) and /en/search/ (EN) — via the default page
 *     bootstrapper at the bottom of this file (looks for
 *     #siteSearchPageUi + #siteSearchPageConfig, all filters on,
 *     URL sync on, SSR fallback wired);
 *   - the navbar <dialog id="searchOverlay"> — via a thin adapter in
 *     src/js/site-ui.js that calls window.createModularSearchUI(...)
 *     with navbar-scoped options on first dialog open.
 *
 * Factory reuses Pagefind 1.5.2 Modular UI (Instance + Input +
 * optional FilterPills) plus a small site-owned layer for:
 *   - eager paginated result rendering (bypasses Modular UI's
 *     ResultList to avoid its below-fold IntersectionObserver
 *     lazy-hydration regression documented in the /haku/ pilot);
 *   - localised summary text (Modular UI's Summary component
 *     hard-codes English in 1.5.2);
 *   - post-render aria-label decoration of FilterPills wrappers
 *     (Pagefind 1.5.2 has no FilterPills translation surface —
 *     tracked as CONTINGENT DELETION).
 *
 * All locale-specific strings + facet labels come from an inline
 * <script type="application/json"> config the caller passes in.
 * This module therefore ships zero user-facing strings.
 *
 * The factory returns an API object:
 *   {
 *     ready:               Promise<null | {…}> resolves after mount
 *     getInput():          HTMLInputElement | null
 *     focusInput(query?):  focuses input, optionally dispatches
 *                          atomic triggerSearchWithFilters query
 *     triggerSearchWithPin(query): pinned-Kieli query dispatch
 *   }
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------
  // Factory — window.createModularSearchUI(options)
  // ---------------------------------------------------------------

  function createModularSearchUI(options) {
    const opts = options || {};
    const mount = opts.mountEl;
    const configEl = opts.configEl;
    const inputId = opts.inputId || "siteSearchPageInput";
    const pageSize = Number.isFinite(opts.pageSize) ? opts.pageSize : 10;
    const enableFilters = opts.enableFilters !== false;
    const enableUrlSync = opts.enableUrlSync !== false;
    const fallbackFormEl = opts.fallbackFormEl || null;
    const getInitialQuery = typeof opts.getInitialQuery === "function"
      ? opts.getInitialQuery
      : () => (new URLSearchParams(window.location.search).get("q") || "");

    if (!(mount instanceof HTMLElement)) {
      return {
        ready: Promise.resolve(null),
        getInput: () => null,
        focusInput: () => Promise.resolve(false),
        triggerSearchWithPin: () => {}
      };
    }

    let config;
    if (configEl && configEl.textContent) {
      try {
        config = JSON.parse(configEl.textContent || "{}");
      } catch (error) {
        console.warn("[modular search factory] config JSON failed to parse:", error);
        config = {};
      }
    } else {
      config = {};
    }

    const initialQuery = getInitialQuery();
    const languageFilter = config.languageFilter || mount.dataset.pagefindLang || "Suomi";
    const placeholder = config.placeholder || mount.dataset.pagefindPlaceholder || "";
    const regionLabel = config.regionLabel || "";
    const fallbackMessage = config.fallbackMessage || "";
    const translations = config.translations || {};
    const FACET_GROUPS = enableFilters && Array.isArray(config.facetGroups) ? config.facetGroups : [];
    // PF5-H1B — flat list of {filter, label, contentType} pairs
    // derived from config.secondaryFacetsByContentType. Each entry is
    // one FilterPills slot whose DOM visibility is toggled by the
    // current Sisältö selection. contentType is the Pagefind Sisältö
    // filter VALUE (e.g. "Julkaisut") this facet belongs to.
    const SECONDARY_FACETS = (() => {
      if (!enableFilters) return [];
      const map = config.secondaryFacetsByContentType || {};
      const out = [];
      for (const [contentType, groups] of Object.entries(map)) {
        if (!Array.isArray(groups)) continue;
        for (const g of groups) {
          if (g && g.filter) out.push({ filter: g.filter, label: g.label || g.filter, contentType });
        }
      }
      return out;
    })();
    const fallbackInput = fallbackFormEl?.querySelector("[data-search-page-fallback-input]");

    if (fallbackInput && initialQuery) {
      fallbackInput.value = initialQuery;
    }

    let instance = null;
    let inputElement = null;
    let urlSyncDebounce = null;
    const pinnedFilters = { Kieli: [languageFilter] };
    let pagefindSearchApiPromise = null;

    function escapeHtml(value) {
      return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    function renderShell() {
      // Idempotent shell. Kept DOM-stable so tests can assert the
      // absence of `.pagefind-ui__*` classes on this surface.
      //
      // PF5-H1A: if the caller has already SSR-rendered an input with
      // the target ID (page search surfaces do — /haku/ + /en/search/
      // ship <form data-search-page-fallback> containing the input
      // with data-search-modular-input), we DO NOT inject a duplicate
      // input. Modular UI's Input component wires up against the
      // existing element by selector, so we only need to inject
      // filters + summary + results into the mount.
      //
      // If no existing input is found (navbar case: <div id="siteSearchUi">
      // has no input in SSR), the factory falls back to the pre-H1A
      // behaviour and injects the whole shell — including its own
      // input inside the mount.
      const primarySlots = FACET_GROUPS.map((group) => `
        <div
          data-search-modular-filter-slot
          data-search-modular-filter-name="${escapeHtml(group.filter)}"
          data-search-modular-filter-label="${escapeHtml(group.label)}"
        ></div>`).join("");
      // PF5-A3B: secondary groups now render through a site-owned
      // presenter while hidden Pagefind FilterPills continue to own
      // the actual filter application/state under the hood.
      const secondarySlots = SECONDARY_FACETS.map((group, index) => `
        <div
          data-search-modular-filter-slot
          data-search-modular-secondary-for="${escapeHtml(group.contentType)}"
          data-search-modular-filter-name="${escapeHtml(group.filter)}"
          data-search-modular-filter-label="${escapeHtml(group.label)}"
          data-search-modular-filter-source-id="search-modular-filter-source-${index}"
          hidden
        >
          <div class="site-search-page-secondary-facet" data-search-modular-facet-presenter></div>
        </div>`).join("");
      const secondarySources = SECONDARY_FACETS.map((group, index) => `
        <div
          id="search-modular-filter-source-${index}"
          data-search-modular-filter-source
          data-search-modular-secondary-for="${escapeHtml(group.contentType)}"
          data-search-modular-filter-name="${escapeHtml(group.filter)}"
          data-search-modular-filter-label="${escapeHtml(group.label)}"
          hidden
        ></div>`).join("");
      const filtersMarkup = (FACET_GROUPS.length || SECONDARY_FACETS.length)
        ? `<div class="site-search-page-filters mb-3" data-search-modular-filters role="region" aria-label="${escapeHtml(regionLabel)}">${primarySlots}${secondarySlots}${secondarySources}</div>`
        : "";
      const existingInput = document.getElementById(inputId);
      if (existingInput && existingInput.matches("input[type='search']")) {
        // Enhance in place. Input stays where SSR placed it (inside
        // the SSR fallback form on the search page); factory injects
        // only the filters/summary/results below.
        mount.innerHTML = `
          <div class="site-search-page-modular" data-search-modular-ui>
            ${filtersMarkup}
            <div class="site-search-page-summary text-body-secondary small mb-3" data-search-modular-summary aria-live="polite" aria-atomic="true"></div>
            <ul class="site-search-page-results" data-search-modular-results></ul>
          </div>
        `;
        return;
      }
      mount.innerHTML = `
        <div class="site-search-page-modular" data-search-modular-ui>
          <label for="${escapeHtml(inputId)}" class="form-label fw-semibold visually-hidden">${escapeHtml(translations.search_label || "")}</label>
          <div class="input-group input-group-lg mb-3" data-search-modular-input-container>
            <input
              id="${escapeHtml(inputId)}"
              class="form-control"
              type="search"
              autocomplete="off"
              placeholder="${escapeHtml(placeholder)}"
              aria-label="${escapeHtml(translations.search_label || "")}"
              data-search-modular-input
            />
          </div>
          ${filtersMarkup}
          <div class="site-search-page-summary text-body-secondary small mb-3" data-search-modular-summary aria-live="polite" aria-atomic="true"></div>
          <ul class="site-search-page-results" data-search-modular-results></ul>
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
    async function loadPagefindSearchApi() {
      if (!pagefindSearchApiPromise) {
        // Keep the presenter Search API isolated from the live
        // Modular UI runtime so explicit availability probes do not
        // inherit the page's currently active FilterPills state.
        const isolatedModulePath = `/pagefind/pagefind.js?site-search-api=${encodeURIComponent(inputId)}`;
        pagefindSearchApiPromise = import(isolatedModulePath)
          .then(async (pagefindModule) => {
            if (typeof pagefindModule.options === "function") {
              await pagefindModule.options({ baseUrl: "/" });
            }
            return pagefindModule;
          })
          .catch((error) => {
            pagefindSearchApiPromise = null;
            throw error;
          });
      }
      return pagefindSearchApiPromise;
    }

    async function discoverAvailableFilterNames() {
      try {
        const pagefindModule = await loadPagefindSearchApi();
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

    function ensureFacetAvailability() {
      if (window.SearchFacetAvailability
        && typeof window.SearchFacetAvailability.buildPresenterOptions === "function"
        && typeof window.SearchFacetAvailability.buildSearchFilters === "function") {
        return window.SearchFacetAvailability;
      }
      throw new Error("SearchFacetAvailability is not available. Load /js/search-facet-availability.js before this script.");
    }

    async function initModular(PagefindModularUI) {
      const presenter = ensurePresenter();

      // Probe Pagefind's supported filters() API before creating the
      // Instance so we know which filters actually exist in the
      // current language partition. This is Pagefind's public Search
      // API, not an internal — see docs.
      const availableFilterNames = enableFilters ? await discoverAvailableFilterNames() : null;

      instance = new PagefindModularUI.Instance({
        bundlePath: "/pagefind/",
        translations
      });

      // Input lookup: prefer the exact ID (the enhancement target), then
      // fall back to the mount's own injected input (navbar case).
      inputElement = document.getElementById(inputId)
        || mount.querySelector("[data-search-modular-input]");
      const summaryEl = mount.querySelector("[data-search-modular-summary]");
      const resultsEl = mount.querySelector("[data-search-modular-results]");
      let currentResults = [];
      let currentTerm = "";
      let renderedCount = 0;
      let renderVersion = 0;
      let scheduleFacetRefresh = null;

      // Modular UI's Input takes a SELECTOR STRING, not an element
      // reference. querySelector inside the component wires it up.
      instance.add(new PagefindModularUI.Input({ inputElement: "#" + inputId }));

      if (enableFilters && (FACET_GROUPS.length || SECONDARY_FACETS.length)) {
        const facetAvailability = ensureFacetAvailability();

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
        const primaryFilterSlots = slots.filter((slot) => !slot.hasAttribute("data-search-modular-secondary-for"));
        const secondaryFilterSlots = slots
          .filter((slot) => slot.hasAttribute("data-search-modular-secondary-for"))
          .map((slot) => ({
            slot,
            source: document.getElementById(slot.dataset.searchModularFilterSourceId || ""),
            filterName: slot.dataset.searchModularFilterName || "",
            label: slot.dataset.searchModularFilterLabel || "",
            contentType: slot.dataset.searchModularSecondaryFor || "",
            knownValues: []
          }))
          .filter((group) => group.source && group.filterName);
        const filterContainers = [
          ...primaryFilterSlots,
          ...secondaryFilterSlots.map((group) => group.source)
        ];
        for (const container of filterContainers) {
          const filterName = container.dataset.searchModularFilterName;
          if (!filterName) continue;
          if (availableFilterNames && !availableFilterNames.has(filterName)) {
            continue;
          }
          container.setAttribute("id", "search-modular-filter-" + filterContainers.indexOf(container));
          instance.add(new PagefindModularUI.FilterPills({
            containerElement: "#" + container.id,
            filter: filterName,
            selectMultiple: false,
            alwaysShow: false
          }));
        }

        // Post-render locale-aware aria decoration — CONTINGENT DELETION.
        // Compatibility workaround for Pagefind 1.5.2's lack of a
        // FilterPills translation/accessibility-label API. Idempotent
        // via data-search-modular-i18n. Remove when a supported
        // Pagefind FilterPills translation surface becomes available.
        const localiseFacet = (container) => {
          const wrapper = container.querySelector(".pagefind-modular-filter-pills-wrapper");
          if (!wrapper || wrapper.dataset.searchModularI18n === "done") return;
          const label = container.dataset.searchModularFilterLabel;
          if (!label) return;
          wrapper.setAttribute("aria-label", label);
          wrapper.removeAttribute("aria-labelledby");
          wrapper.dataset.searchModularI18n = "done";
        };
        // Hotfix (post-H1B): the top-level Sisältö pills carry
        // Pagefind-generated numeric counts. Those counts are
        // computed within the currently-filtered result set, so
        // clicking one domain collapses every other domain to
        // "(0)" even though the underlying corpus still contains
        // many results in those categories. Sum-of-domain-pills
        // also does not equal the "All" pill because some hits
        // have no `Sisältö` facet value at all (e.g. taxonomy /
        // index pages). The numbers therefore mislead users into
        // reading them as "how many results would this category
        // have" — they are not disjunctive facet counts and
        // Pagefind Modular UI 1.5.2 does not expose a supported
        // way to compute those without duplicating the whole
        // search state. Rather than fake numbers or build a
        // parallel counting engine, strip the "(N)" suffix from
        // the visible pill text on the Sisältö slot only. The
        // authoritative overall result count remains in the
        // summary line. Also localise Pagefind's hard-coded
        // English "All" reset pill to the config-supplied token
        // (Kaikki / All). Both changes are DOM-only post-render
        // decoration — no parallel state, no Pagefind API misuse.
        const allLabel = translations.all_label || "";
        const isResetLabel = (value) => value === "All" || (allLabel && value === allLabel);
        const getPillLabel = (btn) => (
          btn.querySelector("span[aria-label]")?.getAttribute("aria-label") || ""
        ).trim();
        const stripSisaltoCountsAndLocaliseAll = (container) => {
          const wrapper = container.querySelector(".pagefind-modular-filter-pills-wrapper");
          if (!wrapper) return;
          const spans = wrapper.querySelectorAll(".pagefind-modular-filter-pill > span[aria-label]");
          for (const span of spans) {
            const rawLabel = (span.getAttribute("aria-label") || "").trim();
            const visibleLabel = (rawLabel === "All" && allLabel) ? allLabel : rawLabel;
            if (span.textContent !== visibleLabel) {
              span.textContent = visibleLabel;
            }
            if (rawLabel === "All" && allLabel) {
              span.setAttribute("aria-label", allLabel);
            }
          }
        };
        const filtersRegion = mount.querySelector("[data-search-modular-filters]");
        const sisaltoSlot = primaryFilterSlots.find((slot) => slot.dataset.searchModularFilterName === "Sisältö");
        const secondaryState = Object.create(null);
        const domainDataCache = new Map();
        let facetRefreshVersion = 0;
        let facetRefreshRaf = 0;
        let pendingFacetFocus = null;

        const findConcretePill = (container, value) => {
          const target = String(value || "").trim();
          if (!container || !target) return null;
          return Array.from(container.querySelectorAll(".pagefind-modular-filter-pill"))
            .find((btn) => getPillLabel(btn) === target);
        };
        const findResetPill = (container) => {
          if (!container) return null;
          return Array.from(container.querySelectorAll(".pagefind-modular-filter-pill"))
            .find((btn) => isResetLabel(getPillLabel(btn)));
        };
        const syncConcretePillState = (container, activeValue = "") => {
          const active = String(activeValue || "").trim();
          for (const button of Array.from(container?.querySelectorAll(".pagefind-modular-filter-pill") || [])) {
            const value = getPillLabel(button);
            if (!value || isResetLabel(value)) continue;
            button.setAttribute("aria-pressed", value === active ? "true" : "false");
          }
        };
        const concreteValuesInOrder = (container) => (
          Array.from(container?.querySelectorAll(".pagefind-modular-filter-pill") || [])
            .map((btn) => getPillLabel(btn))
            .filter((value) => value && !isResetLabel(value))
        );
        const rememberKnownValues = (group) => {
          for (const value of concreteValuesInOrder(group.source)) {
            if (!group.knownValues.includes(value)) {
              group.knownValues.push(value);
            }
          }
        };
        const getActiveDomain = () => {
          if (!sisaltoSlot) return null;
          const selected = Array.from(sisaltoSlot.querySelectorAll(".pagefind-modular-filter-pill[aria-pressed='true']"))
            .map((btn) => getPillLabel(btn))
            .filter((value) => value && !isResetLabel(value));
          return selected[0] || null;
        };
        const clearSecondaryGroup = (group) => {
          const activeValue = secondaryState[group.filterName];
          if (!activeValue) return;
          const reset = findResetPill(group.source);
          if (reset) {
            reset.click();
          } else {
            const active = findConcretePill(group.source, activeValue);
            if (active) active.click();
          }
          syncConcretePillState(group.source, "");
          secondaryState[group.filterName] = "";
        };
        const activeValuesForDomain = (activeDomain) => {
          const values = {};
          for (const group of secondaryFilterSlots) {
            if (group.contentType !== activeDomain) continue;
            const activeValue = String(secondaryState[group.filterName] || "").trim();
            if (activeValue) values[group.filterName] = activeValue;
          }
          return values;
        };
        const hideAllSecondaryPresenters = () => {
          for (const group of secondaryFilterSlots) {
            group.slot.hidden = true;
            const presenterEl = group.slot.querySelector("[data-search-modular-facet-presenter]");
            if (presenterEl) presenterEl.innerHTML = "";
            if (group.source) group.source.hidden = true;
          }
        };
        const renderFacetPresenter = (group, options, activeValue) => {
          const presenterEl = group.slot.querySelector("[data-search-modular-facet-presenter]");
          if (!presenterEl) return;
          const clearMarkup = activeValue
            ? `<button type="button" class="pagefind-modular-filter-pill" data-search-modular-facet-clear="true"><span aria-label="${escapeHtml(allLabel)}">${escapeHtml(allLabel)}</span></button>`
            : "";
          const optionMarkup = options.map((option) => `
            <button
              type="button"
              class="pagefind-modular-filter-pill"
              aria-pressed="${option.active ? "true" : "false"}"
              data-search-modular-facet-value="${escapeHtml(option.value)}"
            ><span aria-label="${escapeHtml(option.value)}">${escapeHtml(option.value)} (${escapeHtml(String(option.count))})</span></button>
          `).join("");
          presenterEl.innerHTML = `
            <div class="mb-2 small fw-semibold text-body-secondary">${escapeHtml(group.label)}</div>
            <div class="pagefind-modular-filter-pills-wrapper" role="group" aria-label="${escapeHtml(group.label)}">
              ${clearMarkup}${optionMarkup}
            </div>
          `;
          presenterEl.onclick = (event) => {
            const button = event.target.closest("button");
            if (!button) return;
            if (button.hasAttribute("data-search-modular-facet-clear")) {
              pendingFacetFocus = { filterName: group.filterName, clear: true };
              clearSecondaryGroup(group);
              return;
            }
            const nextValue = String(button.dataset.searchModularFacetValue || "").trim();
            if (!nextValue) return;
            const currentValue = String(secondaryState[group.filterName] || "").trim();
            pendingFacetFocus = { filterName: group.filterName, value: nextValue };
            if (currentValue && currentValue === nextValue) {
              clearSecondaryGroup(group);
              return;
            }
            const hiddenButton = findConcretePill(group.source, nextValue);
            if (hiddenButton) {
              hiddenButton.click();
              syncConcretePillState(group.source, nextValue);
              secondaryState[group.filterName] = nextValue;
            }
          };
          if (pendingFacetFocus && pendingFacetFocus.filterName === group.filterName) {
            const selector = pendingFacetFocus.clear
              ? "button[data-search-modular-facet-clear]"
              : `button[data-search-modular-facet-value="${CSS.escape(pendingFacetFocus.value || "")}"]`;
            presenterEl.querySelector(selector)?.focus({ preventScroll: true });
            pendingFacetFocus = null;
          }
        };
        const syncSecondaryVisibility = () => {
          const activeDomain = getActiveDomain();
          if (!activeDomain) {
            for (const group of secondaryFilterSlots) {
              clearSecondaryGroup(group);
            }
            hideAllSecondaryPresenters();
            return null;
          }
          for (const group of secondaryFilterSlots) {
            const shouldShow = group.contentType === activeDomain;
            if (!shouldShow) {
              clearSecondaryGroup(group);
              const presenterEl = group.slot.querySelector("[data-search-modular-facet-presenter]");
              if (presenterEl) presenterEl.innerHTML = "";
            }
            group.slot.hidden = !shouldShow;
            if (group.source) group.source.hidden = true;
          }
          return activeDomain;
        };
        scheduleFacetRefresh = () => {
          if (facetRefreshRaf) return;
          facetRefreshRaf = window.requestAnimationFrame(() => {
            facetRefreshRaf = 0;
            void refreshSecondaryPresenters();
          });
        };
        const refreshSecondaryPresenters = async () => {
          const activeDomain = syncSecondaryVisibility();
          if (!activeDomain || !currentTerm) return;
          const activeValues = activeValuesForDomain(activeDomain);
          const refreshVersion = ++facetRefreshVersion;
          try {
            const domainDataKey = JSON.stringify({
              term: currentTerm,
              language: languageFilter,
              activeDomain
            });
            if (!domainDataCache.has(domainDataKey)) {
              domainDataCache.set(domainDataKey, (async () => {
                const domainFilters = facetAvailability.buildSearchFilters({
                  pinnedFilters,
                  activeDomain,
                  activeValues: {}
                });
                const pagefindModule = await loadPagefindSearchApi();
                const domainSearch = await pagefindModule.search(currentTerm, { filters: domainFilters });
                const records = await Promise.all((domainSearch.results || []).map(async (raw) => {
                  try {
                    return await raw.data();
                  } catch (_) {
                    return null;
                  }
                }));
                return records.filter(Boolean);
              })());
            }
            const domainRecords = await domainDataCache.get(domainDataKey);
            if (refreshVersion !== facetRefreshVersion) return;
            for (const group of secondaryFilterSlots) {
              if (group.contentType !== activeDomain) continue;
              rememberKnownValues(group);
              const activeValue = String(activeValues[group.filterName] || "").trim();
              const currentCounts = facetAvailability.collectFilterCounts({
                records: domainRecords,
                targetFilter: group.filterName,
                activeValues
              });
              const replacementCounts = activeValue
                ? facetAvailability.collectFilterCounts({
                  records: domainRecords,
                  targetFilter: group.filterName,
                  activeValues,
                  omitFilter: group.filterName
                })
                : currentCounts;
              const orderedValues = facetAvailability.buildOrderedValues({
                knownValues: group.knownValues,
                activeValue,
                currentCounts,
                replacementCounts
              });
              const options = facetAvailability.buildPresenterOptions({
                values: orderedValues,
                activeValue,
                currentCounts,
                replacementCounts
              });
              if (!options.length && !activeValue) {
                group.slot.hidden = true;
                const presenterEl = group.slot.querySelector("[data-search-modular-facet-presenter]");
                if (presenterEl) presenterEl.innerHTML = "";
                continue;
              }
              group.slot.hidden = false;
              renderFacetPresenter(group, options, activeValue);
            }
          } catch (_) {
            for (const group of secondaryFilterSlots) {
              if (group.contentType !== activeDomain) continue;
              const presenterEl = group.slot.querySelector("[data-search-modular-facet-presenter]");
              if (presenterEl) presenterEl.innerHTML = "";
              if (group.source) group.source.hidden = false;
            }
          }
        };
        if (filtersRegion) {
          const facetObserver = new MutationObserver(() => {
            for (const container of filterContainers) localiseFacet(container);
            if (sisaltoSlot) stripSisaltoCountsAndLocaliseAll(sisaltoSlot);
          });
          facetObserver.observe(filtersRegion, {
            childList: true,
            subtree: true
          });
          for (const container of filterContainers) localiseFacet(container);
          if (sisaltoSlot) stripSisaltoCountsAndLocaliseAll(sisaltoSlot);
        }

        if (secondaryFilterSlots.length) {
          syncSecondaryVisibility();
          if (sisaltoSlot) {
            const sisaltoObserver = new MutationObserver(scheduleFacetRefresh);
            sisaltoObserver.observe(sisaltoSlot, {
              attributes: true,
              attributeFilter: ["aria-pressed"],
              subtree: true,
              childList: true
            });
          }
        }
      }

      // Result rendering — we do NOT use Modular UI's ResultList; see
      // module header comment. Pagefind's Instance keeps state and
      // ranking; we render results eagerly in paginated batches.
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
        btn.addEventListener("click", () => renderBatch(renderedCount + pageSize));
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

      // Hotfix (post-H1B): keep the navbar dialog's "full search
      // page" link (`[data-search-page-link]`) in sync with the
      // current query so clicking it lands on `/haku/?q=<query>`
      // (or `/en/search/?q=<query>`) with the query already
      // hydrated. No parallel state store, no localStorage — the
      // link href IS the transfer channel. Only runs on surfaces
      // that ship such a link (navbar). Both FI and EN dialogs
      // ship the same [data-search-page-link] hook.
      const fullSearchPageUrl = String(config.fullSearchPageUrl || "").trim();
      const searchPageLinks = fullSearchPageUrl
        ? Array.from(document.querySelectorAll(`a[data-search-page-link][href^="${fullSearchPageUrl}"]`))
        : [];
      const syncFullSearchLinks = (term) => {
        if (!searchPageLinks.length) return;
        const q = String(term || "").trim();
        const href = q
          ? `${fullSearchPageUrl}?q=${encodeURIComponent(q)}`
          : fullSearchPageUrl;
        for (const link of searchPageLinks) {
          if (link.getAttribute("href") !== href) {
            link.setAttribute("href", href);
          }
        }
      };

      instance.on("search", (term) => {
        renderVersion += 1;
        currentTerm = String(term || "").trim();
        clearResults();
        syncFullSearchLinks(currentTerm);
        if (!currentTerm) {
          summaryEl.textContent = "";
          return;
        }
        const t = translations.searching || "";
        summaryEl.textContent = t.replace("[SEARCH_TERM]", currentTerm);
        if (typeof scheduleFacetRefresh === "function") {
          scheduleFacetRefresh();
        }
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
          renderBatch(pageSize);
        } else {
          updateLoadMore();
        }
        if (typeof scheduleFacetRefresh === "function") {
          scheduleFacetRefresh();
        }
      });

      // Pin the language filter so this surface returns only its own
      // language's results. When there is an initial query, combine
      // the language pin + query into a single atomic
      // `triggerSearchWithFilters` dispatch so Instance runs exactly
      // one search with both applied. Two separate calls
      // (triggerFilters + triggerSearch) can race and drop the
      // filter on the second dispatch — proven necessary during the
      // /en/search/ rollout AND re-confirmed during the navbar audit
      // experiment.
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

      // Debounced URL sync so a query is shareable via ?q=. Off for
      // surfaces (like navbar) where the URL is not this surface's
      // to own.
      if (enableUrlSync && inputElement) {
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

      // PF5-H1A: the SSR fallback form is now the enhancement target
      // itself (it contains the primary input Modular UI wires up).
      // Hide it ONLY when its input is NOT the enhancement target —
      // i.e. when a separate injected input inside the mount is used
      // (pre-H1A layout). Under the H1A layout the fallback form IS
      // the single visible search shell and must remain visible.
      if (fallbackFormEl && inputElement && !fallbackFormEl.contains(inputElement)) {
        fallbackFormEl.hidden = true;
      }

      // Ready marker: tests wait on this so they never race the
      // component registration. Real users don't observe it.
      mount.dataset.searchModularReady = "true";

      return {
        instance,
        input: inputElement
      };
    }

    // Bootstrap
    renderShell();
    const readyPromise = loadModularUi()
      .then(initModular)
      .catch((error) => {
        console.warn("[modular search factory] init failed:", error);
        mount.innerHTML = `<p class="alert alert-info mb-0">${escapeHtml(fallbackMessage)}</p>`;
        if (fallbackFormEl) {
          fallbackFormEl.hidden = false;
        }
        return null;
      });

    if (fallbackFormEl) {
      fallbackFormEl.addEventListener("submit", (event) => {
        const query = String(fallbackInput?.value || "").trim();
        if (!instance || !query) return;
        event.preventDefault();
        if (enableUrlSync) {
          const params = new URLSearchParams(window.location.search);
          params.set("q", query);
          window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`);
        }
        if (inputElement) {
          inputElement.value = query;
        }
        if (typeof instance.triggerSearchWithFilters === "function") {
          instance.triggerSearchWithFilters(query, pinnedFilters);
        } else if (typeof instance.triggerSearch === "function") {
          instance.triggerSearch(query);
        }
      });
    }

    // Public API surface used by the navbar adapter in site-ui.js.
    const api = {
      ready: readyPromise,
      getInput: () => inputElement,
      focusInput(prefillQuery) {
        return readyPromise.then((ok) => {
          if (!ok || !inputElement) return false;
          inputElement.focus({ preventScroll: true });
          const q = String(prefillQuery || "").trim();
          if (q) {
            inputElement.value = q;
            if (typeof instance.triggerSearchWithFilters === "function") {
              instance.triggerSearchWithFilters(q, pinnedFilters);
            } else if (typeof instance.triggerSearch === "function") {
              instance.triggerSearch(q);
            }
          }
          return document.activeElement === inputElement;
        });
      },
      triggerSearchWithPin(query) {
        const q = String(query || "").trim();
        if (!instance || !q) return;
        if (typeof instance.triggerSearchWithFilters === "function") {
          instance.triggerSearchWithFilters(q, pinnedFilters);
        } else if (typeof instance.triggerSearch === "function") {
          instance.triggerSearch(q);
        }
      }
    };

    if (typeof opts.onReady === "function") {
      readyPromise.then(() => opts.onReady(api)).catch(() => {});
    }

    return api;
  }

  // Expose factory globally.
  window.createModularSearchUI = createModularSearchUI;

  // ---------------------------------------------------------------
  // Default page bootstrapper — /haku/ + /en/search/
  // Guarded: only runs when the page provides #siteSearchPageUi.
  // ---------------------------------------------------------------

  function pageBootstrap() {
    const mount = document.getElementById("siteSearchPageUi");
    if (!mount) return;
    const configEl = document.getElementById("siteSearchPageConfig");
    const fallbackFormEl = document.querySelector("[data-search-page-fallback]");
    createModularSearchUI({
      mountEl: mount,
      configEl,
      inputId: "siteSearchPageInput",
      pageSize: 10,
      enableFilters: true,
      enableUrlSync: true,
      fallbackFormEl
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", pageBootstrap);
  } else {
    pageBootstrap();
  }
})();

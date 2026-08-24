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
      // PF5-H1B: secondary slots stay in the DOM (so FilterPills can
      // mount + Pagefind can maintain hit counts) but are hidden until
      // the matching Sisältö value is selected.
      const secondarySlots = SECONDARY_FACETS.map((group) => `
        <div
          data-search-modular-filter-slot
          data-search-modular-secondary-for="${escapeHtml(group.contentType)}"
          data-search-modular-filter-name="${escapeHtml(group.filter)}"
          data-search-modular-filter-label="${escapeHtml(group.label)}"
          hidden
        ></div>`).join("");
      const filtersMarkup = (FACET_GROUPS.length || SECONDARY_FACETS.length)
        ? `<div class="site-search-page-filters mb-3" data-search-modular-filters role="region" aria-label="${escapeHtml(regionLabel)}">${primarySlots}${secondarySlots}</div>`
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
            <div class="site-search-page-results" data-search-modular-results></div>
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

      // Modular UI's Input takes a SELECTOR STRING, not an element
      // reference. querySelector inside the component wires it up.
      instance.add(new PagefindModularUI.Input({ inputElement: "#" + inputId }));

      if (enableFilters && (FACET_GROUPS.length || SECONDARY_FACETS.length)) {
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
        // FilterPills translation/accessibility-label API. Idempotent
        // via data-search-modular-i18n. Remove when a supported
        // Pagefind FilterPills translation surface becomes available.
        const localiseFacet = (slot) => {
          const wrapper = slot.querySelector(".pagefind-modular-filter-pills-wrapper");
          if (!wrapper || wrapper.dataset.searchModularI18n === "done") return;
          const label = slot.dataset.searchModularFilterLabel;
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
        const stripSisaltoCountsAndLocaliseAll = (slot) => {
          const wrapper = slot.querySelector(".pagefind-modular-filter-pills-wrapper");
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
        const sisaltoDecorationSlot = slots.find((s) => s.dataset.searchModularFilterName === "Sisältö");
        if (filtersRegion) {
          const facetObserver = new MutationObserver(() => {
            for (const slot of slots) localiseFacet(slot);
            if (sisaltoDecorationSlot) stripSisaltoCountsAndLocaliseAll(sisaltoDecorationSlot);
          });
          facetObserver.observe(filtersRegion, {
            childList: true,
            subtree: true
          });
          for (const slot of slots) localiseFacet(slot);
          if (sisaltoDecorationSlot) stripSisaltoCountsAndLocaliseAll(sisaltoDecorationSlot);
        }

        // PF5-H1B — Progressive facet disclosure.
        //
        // Pagefind remains the sole owner of filter state; this layer
        // only toggles DOM VISIBILITY of secondary facet slots based
        // on which values are currently selected in the Sisältö
        // FilterPills. The signal is Pagefind's own `aria-pressed`
        // attribute on each pill (Modular UI 1.5.2), read via a
        // MutationObserver — no parallel selection state, no Pagefind
        // API misuse.
        //
        // Multi-select: FilterPills is mounted with selectMultiple:true,
        // so the user can select more than one Sisältö value. When
        // that happens we show the UNION of the selected domains'
        // secondary facets. Selecting "All" (or clearing everything)
        // hides all secondary slots.
        const secondarySlots = slots.filter((s) => s.hasAttribute("data-search-modular-secondary-for"));
        if (secondarySlots.length) {
          const sisaltoSlot = slots.find((s) => s.dataset.searchModularFilterName === "Sisältö");
          const applyVisibility = () => {
            const selected = sisaltoSlot
              ? Array.from(sisaltoSlot.querySelectorAll(".pagefind-modular-filter-pill[aria-pressed='true']"))
                  .map((btn) => (btn.querySelector("span[aria-label]")?.getAttribute("aria-label") || "").trim())
                  // Pagefind Modular UI includes an "All" reset pill that
                  // corresponds to "no filter selected"; treat it as no
                  // domain selection.
                  .filter((v) => v && v !== "All" && v !== "Kaikki")
              : [];
            const activeDomains = new Set(selected);
            for (const slot of secondarySlots) {
              const contentType = slot.dataset.searchModularSecondaryFor;
              const shouldShow = activeDomains.has(contentType);
              if (shouldShow) {
                slot.hidden = false;
              } else {
                slot.hidden = true;
              }
            }
          };
          applyVisibility();
          if (sisaltoSlot) {
            const sisaltoObserver = new MutationObserver(applyVisibility);
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

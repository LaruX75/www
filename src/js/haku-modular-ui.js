/**
 * PF5-G1 /haku/ pilot — Finnish global search page using Pagefind
 * 1.5.2 Modular UI (Instance + Input + Summary + ResultList) with
 * a resultTemplate bound to the shared PF4/PF5 result presenter.
 *
 * Scope (pilot):
 *   - Only /haku/. /en/search/, navbar FI, navbar EN are unchanged.
 *   - Language filter (Kieli:Suomi) is pinned via triggerFilters().
 *   - Ranking is Pagefind's; no grouping by kind on this surface.
 *   - Canonical/Pagefind metadata unchanged.
 *
 * If Modular UI fails to load, the SSR fallback form remains visible
 * so the surface still submits ?q= to /haku/ (server-side round-trip).
 */
(function () {
  "use strict";

  const mount = document.getElementById("siteSearchPageUi");
  if (!mount) return;

  const PAGE_SIZE = 10;

  // Pre-G1 /haku/ stock PagefindUI Default auto-populated a
  // multi-facet panel: the 34-group list captured during pilot
  // baseline probing. FACET_GROUPS is the *user-meaningful* subset
  // that this pilot re-exposes via one Modular UI FilterPills per
  // group. Values not indexed in Pagefind are hidden by
  // FilterPills' own `alwaysShow: false` (default) — no empty
  // groups render. All Finnish labels are site-owned so screen
  // readers on the FI page announce a Finnish accessible name.
  // Facet names ("Sisältö", "Publications group", …) must match the
  // canonical `data-pagefind-filter` names on-page verbatim.
  const FACET_GROUPS = [
    { filter: "Sisältö",             label: "Sisältötyyppi" },
    { filter: "Publications group",  label: "Julkaisutyyppi (OKM)" },
    { filter: "Publications quality", label: "Julkaisun laatu" },
    { filter: "Writings content type", label: "Kirjoituksen tyyppi" },
    { filter: "Writings topic",      label: "Kirjoituksen aihe" },
    { filter: "Theses type",         label: "Opinnäytteen tyyppi" },
    { filter: "Theses role",         label: "Rooli opinnäytteessä" },
    { filter: "Mediatyyppi",         label: "Mediatyyppi" },
    { filter: "Rooli",               label: "Rooli mediassa" },
    { filter: "Vuosi",               label: "Media: vuosi" },
    { filter: "PresentationYear",    label: "Esityksen vuosi" },
    { filter: "PresentationTopic",   label: "Esityksen aihe" }
  ];

  const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
  const languageFilter = mount.dataset.pagefindLang || "Suomi";
  const placeholder = mount.dataset.pagefindPlaceholder || "Kirjoita hakusana...";
  const fallbackForm = document.querySelector("[data-search-page-fallback]");
  const fallbackInput = fallbackForm?.querySelector("[data-search-page-fallback-input]");

  const translations = {
    placeholder,
    clear_search: "Tyhjennä",
    load_more: "Lataa lisää tuloksia",
    search_label: "Hae sivustolta",
    filters_label: "Suodattimet",
    zero_results: "Ei tuloksia haulla [SEARCH_TERM]",
    many_results: "[COUNT] tulosta haulla [SEARCH_TERM]",
    one_result: "[COUNT] tulos haulla [SEARCH_TERM]",
    alt_search: "Ei tuloksia haulla [SEARCH_TERM]. Näytetään tulokset haulla [DIFFERENT_TERM].",
    search_suggestion: "Ei tuloksia haulla [SEARCH_TERM]. Kokeile jotain seuraavista:",
    searching: "Haetaan hakusanalla [SEARCH_TERM]..."
  };

  if (fallbackInput && initialQuery) {
    fallbackInput.value = initialQuery;
  }

  let instance = null;
  let inputElement = null;
  let urlSyncDebounce = null;

  function renderShell() {
    // Idempotent shell: keep DOM stable so the pilot spec can assert
    // the absence of `.pagefind-ui__*` classes on this surface.
    mount.innerHTML = `
      <div class="site-search-page-modular" data-haku-modular-ui>
        <label for="siteSearchPageInput" class="form-label fw-semibold visually-hidden">${escapeHtml(translations.search_label)}</label>
        <div class="input-group input-group-lg mb-3" data-haku-modular-input-container>
          <input
            id="siteSearchPageInput"
            class="form-control"
            type="search"
            autocomplete="off"
            placeholder="${escapeHtml(placeholder)}"
            aria-label="${escapeHtml(translations.search_label)}"
            data-haku-modular-input
          />
        </div>
        <div class="site-search-page-filters mb-3" data-haku-modular-filters role="region" aria-label="Rajaa hakua">
          ${FACET_GROUPS.map((group) => `
            <div
              data-haku-modular-filter-slot
              data-haku-modular-filter-name="${escapeHtml(group.filter)}"
              data-haku-modular-filter-label="${escapeHtml(group.label)}"
            ></div>`).join("")}
        </div>
        <div class="site-search-page-summary text-body-secondary small mb-3" data-haku-modular-summary aria-live="polite" aria-atomic="true"></div>
        <div class="site-search-page-results" data-haku-modular-results></div>
      </div>
    `;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
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

  function ensurePresenter() {
    if (window.SearchResultPresenter && typeof window.SearchResultPresenter.renderSharedCard === "function") {
      return window.SearchResultPresenter;
    }
    throw new Error("SearchResultPresenter is not available. Load /js/search-result-presenter.js before this script.");
  }

  function initModular(PagefindModularUI) {
    const presenter = ensurePresenter();

    instance = new PagefindModularUI.Instance({
      bundlePath: "/pagefind/",
      translations
    });

    inputElement = mount.querySelector("[data-haku-modular-input]");
    const summaryEl = mount.querySelector("[data-haku-modular-summary]");
    const resultsEl = mount.querySelector("[data-haku-modular-results]");

    // Modular UI's Input takes a SELECTOR STRING, not an element
    // reference. querySelector inside the component is what wires
    // it to the DOM.
    instance.add(new PagefindModularUI.Input({ inputElement: "#siteSearchPageInput" }));

    // Facet parity with pre-G1 stock PagefindUI Default: one
    // Modular UI FilterPills per user-meaningful group defined in
    // FACET_GROUPS above. Empty groups auto-hide (alwaysShow:
    // false). Pagefind owns filter state via triggerFilter; the
    // site only owns per-slot container placement + Finnish
    // accessible-name decoration.
    const slots = Array.from(mount.querySelectorAll("[data-haku-modular-filter-slot]"));
    for (const slot of slots) {
      const filterName = slot.dataset.hakuModularFilterName;
      if (!filterName) continue;
      // Each FilterPills needs a unique container selector; slots
      // are already unique by index inside the filters region.
      slot.setAttribute("id", "haku-modular-filter-" + slots.indexOf(slot));
      instance.add(new PagefindModularUI.FilterPills({
        containerElement: "#" + slot.id,
        filter: filterName,
        selectMultiple: true,
        alwaysShow: false
      }));
    }

    // Post-render localisation: Modular UI's FilterPills hard-codes
    // "Filter results by <name>" as the wrapper's aria-labelledby
    // target. There is no supported translations knob on FilterPills
    // in Pagefind 1.5.2 (Instance.translations only affects Instance
    // itself). The label is behind clip-path (visually hidden but
    // still read by screen readers via aria-labelledby). We do NOT
    // patch Modular UI's rendering logic; we adjust the ARIA on the
    // rendered wrapper once, replacing aria-labelledby with a
    // Finnish aria-label. Idempotent via data-haku-modular-i18n.
    const localiseFacet = (slot) => {
      const wrapper = slot.querySelector(".pagefind-modular-filter-pills-wrapper");
      if (!wrapper || wrapper.dataset.hakuModularI18n === "done") return;
      const label = slot.dataset.hakuModularFilterLabel;
      if (!label) return;
      wrapper.setAttribute("aria-label", label);
      wrapper.removeAttribute("aria-labelledby");
      wrapper.dataset.hakuModularI18n = "done";
    };
    const facetObserver = new MutationObserver(() => {
      for (const slot of slots) localiseFacet(slot);
    });
    facetObserver.observe(mount.querySelector("[data-haku-modular-filters]"), {
      childList: true,
      subtree: true
    });
    // Also run once synchronously in case FilterPills already rendered
    // by the time this hook attaches.
    for (const slot of slots) localiseFacet(slot);

    // Result rendering: we do NOT use Modular UI's ResultList
    // because its per-result IntersectionObserver lazy-hydration
    // leaves below-fold cards as skeletons until the user scrolls,
    // regressing the perceived UX vs Default UI's paginated list.
    // Instead we own the DOM: Pagefind's Instance keeps state and
    // ranking, and we render results eagerly with paginated
    // load-more. The shared presenter still produces every card.
    let currentResults = [];
    let currentTerm = "";
    let renderedCount = 0;
    // Monotonic version counter incremented on every search/results
    // event. Guards async batch rendering: if the version at
    // Promise.all resolution differs from the version when the batch
    // started, a newer search/filter fired in between and this
    // batch's HTML must be discarded to avoid stale rows overwriting
    // (or appending after) the newer result set. Cheaper and more
    // correct than the previous term-only guard.
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
      let btn = mount.querySelector("[data-haku-modular-load-more]");
      if (btn) return btn;
      btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-outline-secondary rounded-pill mt-3";
      btn.setAttribute("data-haku-modular-load-more", "");
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
      btn.textContent = translations.load_more;
    };

    const clearResults = () => {
      resultsEl.innerHTML = "";
      renderedCount = 0;
      const btn = mount.querySelector("[data-haku-modular-load-more]");
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
      summaryEl.textContent = translations.searching.replace("[SEARCH_TERM]", currentTerm);
    });

    instance.on("results", (payload) => {
      renderVersion += 1;
      currentResults = Array.isArray(payload?.results) ? payload.results : [];
      const count = currentResults.length;
      renderedCount = 0;
      resultsEl.innerHTML = "";
      const template = count === 0
        ? translations.zero_results
        : count === 1
          ? translations.one_result
          : translations.many_results;
      summaryEl.textContent = template
        .replace("[COUNT]", String(count))
        .replace("[SEARCH_TERM]", currentTerm);
      if (count > 0) {
        renderBatch(PAGE_SIZE);
      } else {
        updateLoadMore();
      }
    });

    // Pin the language filter so /haku/ returns only Finnish-language
    // results, matching the current PagefindUI Default behaviour.
    if (typeof instance.triggerFilters === "function") {
      instance.triggerFilters({ Kieli: [languageFilter] });
    }

    // Prefill query from ?q= parameter. Setting inputElement.value
    // populates the DOM; triggerSearch fires an immediate query.
    // We deliberately do NOT dispatch an `input` event here — that
    // would race Modular UI's debounced Input listener against the
    // direct triggerSearch call and can cancel results in flight.
    //
    // We ALSO wait for Pagefind's initial filters() to resolve
    // before calling triggerSearch: Modular UI's Instance fires the
    // 'filters' event only after its WASM + index bootstrap
    // (`__pagefind__` is assigned). Calling triggerSearch before
    // that can silently no-op on the initial query.
    if (initialQuery && inputElement) {
      inputElement.value = initialQuery;
      instance.on("filters", () => {
        if (typeof instance.triggerSearch === "function") {
          instance.triggerSearch(initialQuery);
        }
      });
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
    mount.dataset.hakuModularReady = "true";
  }

  function bootstrap() {
    renderShell();
    loadModularUi()
      .then(initModular)
      .catch((error) => {
        console.warn("[/haku/ Modular UI] init failed:", error);
        mount.innerHTML = `<p class="alert alert-info mb-0">Hakemisto ei ole käytettävissä tässä buildissä. Hakukenttä näkyy silti yllä, ja varsinaiset tulokset toimivat, kun Pagefind-indeksi on generoitu.</p>`;
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
      // Same race-avoidance as the ?q= prefill path: only triggerSearch,
      // no input-event dispatch.
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

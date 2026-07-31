/**
 * Site search page — initialises PagefindUI on /haku/ and /en/search/
 * and prefills the query from ?q= URL parameter.
 */
(function () {
  "use strict";

  const mount = document.getElementById("siteSearchPageUi");
  if (!mount) return;

  const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
  const isEn = (document.documentElement.lang || "").toLowerCase().startsWith("en");
  const languageFilter = mount.dataset.pagefindLang || (isEn ? "English" : "Suomi");
  const placeholder = mount.dataset.pagefindPlaceholder || (isEn ? "Type a search term..." : "Kirjoita hakusana...");

  let pagefindUi = null;

  function initUi() {
    if (!window.PagefindUI) return false;

    pagefindUi = new window.PagefindUI({
      element: mount,
      showImages: false,
      showEmptyFilters: false,
      resetStyles: false,
      excerptLength: 24,
      autofocus: true,
      translations: isEn
        ? {
            placeholder,
            clear_search: "Clear",
            load_more: "Load more results",
            search_label: "Search the site",
            filters_label: "Filters",
            zero_results: "No results for [SEARCH_TERM]",
            many_results: "[COUNT] results for [SEARCH_TERM]",
            one_result: "[COUNT] result for [SEARCH_TERM]",
            alt_search: "No results for [SEARCH_TERM]. Showing results for [DIFFERENT_TERM] instead.",
            search_suggestion: "No results for [SEARCH_TERM]. Try one of the following searches:",
            searching: "Searching for [SEARCH_TERM]..."
          }
        : {
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
          }
    });

    if (typeof pagefindUi.filters === "function") {
      pagefindUi.filters({ Kieli: languageFilter });
    }

    if (initialQuery) {
      applyQuery(initialQuery);
    }

    // Update URL when the user types (debounced) so results are shareable
    const input = mount.querySelector(".pagefind-ui__search-input");
    if (input) {
      let debounce = null;
      input.addEventListener("input", () => {
        if (debounce) window.clearTimeout(debounce);
        debounce = window.setTimeout(() => {
          const value = String(input.value || "").trim();
          const params = new URLSearchParams(window.location.search);
          if (value) params.set("q", value);
          else params.delete("q");
          const next = window.location.pathname + (params.toString() ? "?" + params.toString() : "") + window.location.hash;
          window.history.replaceState({}, "", next);
        }, 400);
      });
    }

    return true;
  }

  function applyQuery(query) {
    if (!pagefindUi) return;
    if (typeof pagefindUi.triggerSearch === "function") {
      pagefindUi.triggerSearch(query);
      return;
    }
    const input = mount.querySelector(".pagefind-ui__search-input");
    if (input) {
      input.value = query;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  function waitForPagefind(attempt = 0) {
    if (initUi()) return;
    if (attempt < 60) {
      window.setTimeout(() => waitForPagefind(attempt + 1), 50);
    } else {
      console.warn("PagefindUI ei latautunut hakusivulle.");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => waitForPagefind(0));
  } else {
    waitForPagefind(0);
  }
})();

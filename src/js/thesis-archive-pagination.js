/**
 * thesis-archive-pagination.js — progressive enhancement for the SSR
 * three-table thesis archive.
 *
 * Architecture (TH-CITE1 Phase 3):
 *   - Server renders each per-section pagination URL as a real HTML
 *     document with all three sections present (target section at its
 *     requested page, other two at page 1).
 *   - JS-off: pagination links do a normal navigation → full page
 *     load. The other two sections reset to page 1 in the URL bar.
 *     Acceptable degradation.
 *   - JS-on: this script intercepts the click, fetches the target
 *     SSR URL, extracts the matching `[data-thesis-section]` fragment
 *     from the response, and replaces the local section's fragment in
 *     place. The other two sections' DOM stays untouched → true
 *     independent state during the current visit.
 *
 * Intentionally does NOT call history.pushState / replaceState. The
 * URL bar continues to reflect the last real navigation because the
 * enhanced multi-section state cannot be represented truthfully by a
 * single-section SSR URL without generating the full cartesian
 * permalink space.
 *
 * No DOM hide/show pagination. No client-side slicing of the 169-item
 * canonical set. The complete swap unit is one section fragment
 * (top pager + table + bottom pager) rendered by Eleventy at build
 * time, so top and bottom paginators are automatically synchronised.
 */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  const SELECTOR_LINK = "a[data-thesis-pager-link]";
  const SELECTOR_SECTION = "[data-thesis-section]";
  const SELECTOR_CONTAINER = "[data-thesis-archive-sections]";

  function findAncestor(el, selector) {
    let node = el;
    while (node && node.nodeType === 1) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  async function fetchDocument(url) {
    const response = await fetch(url, {
      credentials: "same-origin",
      headers: { Accept: "text/html" }
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const html = await response.text();
    return new DOMParser().parseFromString(html, "text/html");
  }

  async function swapSection(link) {
    const targetSection = link.getAttribute("data-thesis-pager-target-section");
    if (!targetSection) return;
    const container = document.querySelector(SELECTOR_CONTAINER);
    if (!container) return;
    const currentFragment = container.querySelector(
      SELECTOR_SECTION + '[data-thesis-section="' + targetSection + '"]'
    );
    if (!currentFragment) return;
    const url = link.href;
    currentFragment.setAttribute("aria-busy", "true");
    try {
      const doc = await fetchDocument(url);
      const nextFragment = doc.querySelector(
        SELECTOR_SECTION + '[data-thesis-section="' + targetSection + '"]'
      );
      if (!nextFragment) throw new Error("target section fragment missing in fetched HTML");
      currentFragment.replaceWith(nextFragment);
      const focusTarget = nextFragment.querySelector(
        '[data-thesis-pager-position="top"] .page-item.active .page-link'
      );
      if (focusTarget) focusTarget.setAttribute("tabindex", "-1");
    } catch (err) {
      currentFragment.removeAttribute("aria-busy");
      window.location.href = url;
    }
  }

  document.addEventListener("click", function (event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = findAncestor(event.target, SELECTOR_LINK);
    if (!link) return;
    if (!document.querySelector(SELECTOR_CONTAINER)) return;
    event.preventDefault();
    swapSection(link);
  });
}());

/**
 * PF-STARTER-CHIPS — user-triggered discovery shortcuts.
 *
 * Small, page-agnostic runtime that binds click handlers to any
 * element carrying `data-starter-chip`. A chip does one of two
 * things when clicked:
 *
 * 1. `data-starter-chip-target="<css-selector>"` — set the target
 *    field's `value` to `data-starter-chip-value` and dispatch an
 *    `input` / `change` event so the existing page runtime picks
 *    it up. Never triggers a fresh search pipeline of its own.
 *
 * 2. `data-starter-chip-click="<css-selector>"` — proxy a click to
 *    an already-existing filter button, useful for pages (like
 *    `/mediassa/`) whose filter API is already button-based.
 *
 * Optional attributes:
 * - `data-starter-chip-event="input|change|blur"` — override the
 *   inferred event for target-mode chips.
 * - `data-starter-chip-focus="<css-selector>"` — focus this
 *   element after applying the chip (usually the target input).
 *
 * Chip group ARIA behavior:
 * - Chips inside a `[data-starter-chips]` container become a
 *   single-select group: the last clicked chip gets
 *   `aria-pressed="true"`, siblings reset to `"false"`.
 * - No chip is pre-selected on page load.
 *
 * The runtime does NOT:
 * - trigger any search on page load
 * - introduce a second query model
 * - add or read any Pagefind filter / meta / sort
 * - talk to `data-pagefind-body`
 * - manage archive state beyond dispatching one DOM event
 */
(function () {
  "use strict";

  function inferEvent(target) {
    if (!target) return "input";
    if (target.tagName === "SELECT") return "change";
    return "input";
  }

  function applyTargetChip(chip) {
    const targetSelector = chip.dataset.starterChipTarget;
    if (!targetSelector) return;
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const value = chip.dataset.starterChipValue || "";
    target.value = value;
    const eventName = chip.dataset.starterChipEvent || inferEvent(target);
    target.dispatchEvent(new Event(eventName, { bubbles: true }));
    const focusSelector = chip.dataset.starterChipFocus;
    if (focusSelector) {
      const focusTarget = document.querySelector(focusSelector);
      if (focusTarget && typeof focusTarget.focus === "function") focusTarget.focus();
    }
  }

  function applyClickChip(chip) {
    const clickSelector = chip.dataset.starterChipClick;
    if (!clickSelector) return;
    const target = document.querySelector(clickSelector);
    if (target && typeof target.click === "function") target.click();
  }

  function markPressed(chip) {
    const group = chip.closest("[data-starter-chips]");
    if (!group) return;
    const siblings = group.querySelectorAll("[data-starter-chip]");
    siblings.forEach((sibling) => {
      sibling.setAttribute("aria-pressed", sibling === chip ? "true" : "false");
    });
  }

  function handleChip(event) {
    const chip = event.currentTarget;
    if (!chip) return;
    if (chip.dataset.starterChipClick) {
      applyClickChip(chip);
    } else {
      applyTargetChip(chip);
    }
    markPressed(chip);
  }

  function init() {
    const chips = document.querySelectorAll("[data-starter-chip]");
    chips.forEach((chip) => {
      if (chip.dataset.starterChipReady === "true") return;
      chip.dataset.starterChipReady = "true";
      if (!chip.hasAttribute("aria-pressed")) chip.setAttribute("aria-pressed", "false");
      chip.addEventListener("click", handleChip);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

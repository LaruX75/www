# Search state + facet count hotfix — post search-UI-hotfix closure

## Status

READY FOR MERGE. Follow-up hotfix on top of `origin/main = b0b5912b26e60f73cd9d1e37831b3a1d339994e9`. Small scope: one JS change, two config-partial edits, one regression spec, plus two small existing-spec updates for the intentional behavior change.

## Two user-reported bugs (both PROVEN via headless Chrome on baseline)

### Bug 1 — Navbar dialog "Näytä koko sivulla" / "Open full search page" loses the query

**Reproduction on baseline `b0b5912b`:**
1. Open `/`, type `tekoäly` in navbar inline form, submit.
2. Dialog opens with prefilled input and results.
3. Click the "Näytä koko sivulla" link inside the dialog.
4. Land on `/haku/` with EMPTY input; user must retype.

**Root cause:** the SSR link in both `_nav-fi.njk:703` and `_nav-en.njk:672` is a static `<a href="/haku/" data-search-page-link>`. Nothing in the factory or `site-ui.js` updates its `href` when the dialog's Modular UI Input dispatches a search. The query lives only inside the Pagefind Instance state; there was no channel between the dialog and the link.

### Bug 2 — Sisältö FilterPills numeric counts are misleading

**Reproduction on baseline `/haku/?q=tekoäly`:**

BEFORE any selection:
- `All (356)`, `Esitykset (111)`, `Julkaisut (57)`, `Kirjoitukset ja puheenvuorot (13)`, `Mediassa (70)`, `Opinnäytteet (15)`
- Sum of domain pills = **266** ≠ All = **356** → 90 hits have no `Sisältö` facet at all (e.g. taxonomy/index pages).

AFTER clicking Julkaisut:
- `All (356)`, `Esitykset (0)`, `Julkaisut (57)`, `Kirjoitukset ja puheenvuorot (0)`, `Mediassa (0)`, `Opinnäytteet (0)`
- Non-selected domains all collapse to `(0)`. "All" pill still shows 356 (unfiltered).
- Summary text: `57 tulosta haulla tekoäly` (correct).

**Root cause + investigation (per audit §4-6):**

- Pagefind Modular UI 1.5.2 FilterPills reports **hit counts within the currently-filtered result set**, not disjunctive facet counts.
- The `All` pill is Pagefind's "no filter selected" reset marker and is not filtered by any selection.
- With `selectMultiple: true` (H1B multi-select union), non-selected domains show `(0)` because they are excluded from the current filter — technically correct within Pagefind's semantic model, but semantically misleading to users who read `(0)` as "there are no Esitykset for tekoäly" when in reality there are 111.
- **Pagefind 1.5.2 does not expose a supported API to compute disjunctive counts** without either duplicating the entire search state or running parallel searches. Per audit §6 case C ("TOTAL vs SUM is invalid by design") + §7 acceptable fallback: **hide the misleading counts from top-level Sisältö pills**.

## Fixes

### Fix 1 — Sync full-results link href on every search dispatch

In `src/js/global-search-modular-ui.js`:

```js
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
    if (link.getAttribute("href") !== href) link.setAttribute("href", href);
  }
};
// Hook: instance.on("search", (term) => { …; syncFullSearchLinks(currentTerm); … })
```

The link `href` IS the transfer channel. No `localStorage`, no `sessionStorage`, no new global query-state object, no serialised result payload. `fullSearchPageUrl` comes from `_search-nav-config.njk` (`"/haku/"` or `"/en/search/"`).

Verified on merged tree:
- Type `tekoäly` in navbar → dialog link href becomes `/haku/?q=teko%C3%A4ly`
- Click → land on `/haku/`, input value = `"tekoäly"`, 10 results render immediately
- EN: type `learning` → dialog link href = `/en/search/?q=learning`
- Empty query: link stays plain `/haku/` (no dangling `?q=`)

### Fix 2 — Strip misleading counts, localise "All" reset pill

In `src/js/global-search-modular-ui.js` — extend the existing `localiseFacet` observer to also visit the Sisältö slot and replace each pill span's `textContent` with just its `aria-label`, plus swap Pagefind's hardcoded English "All" for `translations.all_label` (Kaikki / All):

```js
const stripSisaltoCountsAndLocaliseAll = (slot) => {
  const wrapper = slot.querySelector(".pagefind-modular-filter-pills-wrapper");
  if (!wrapper) return;
  const spans = wrapper.querySelectorAll(".pagefind-modular-filter-pill > span[aria-label]");
  for (const span of spans) {
    const rawLabel = (span.getAttribute("aria-label") || "").trim();
    const visibleLabel = (rawLabel === "All" && allLabel) ? allLabel : rawLabel;
    if (span.textContent !== visibleLabel) span.textContent = visibleLabel;
    if (rawLabel === "All" && allLabel) span.setAttribute("aria-label", allLabel);
  }
};
```

In `src/_includes/_search-page-config.njk` and `src/_includes/_search-nav-config.njk`, `translations` gains one key:

```
"all_label": "All" if isEn else "Kaikki"
```

**No parallel state, no Pagefind API misuse.** Pagefind still tracks the counts on `data-pfmod-pill-count` (verified by updated pilot spec). We only decorate visible text + `aria-label` for the reset pill.

Semantics preserved:
- Summary line still shows Pagefind's authoritative filtered result count (e.g. `57 tulosta haulla tekoäly` after selecting Julkaisut).
- Selection semantics unchanged (aria-pressed toggles work the same way).
- H1B progressive facet disclosure unchanged (secondary facet reveal keyed on the same `aria-pressed` signal).

## What the numbers mean now (documented for future readers)

- **Summary line (`[data-search-modular-summary]`):** authoritative total hits in the current filtered result set. Owned by Pagefind's `results` event.
- **Sisältö pill visible text:** label only (`Kaikki`, `Julkaisut`, `Esitykset`, `Kirjoitukset ja puheenvuorot`, `Opinnäytteet`, `Mediassa`).
- **Sisältö pill `data-pfmod-pill-count`:** Pagefind's raw hit count within the currently-filtered set. Kept intact — no consumer changed.
- **`TOTAL = SUM(domain pill counts)` is mathematically FALSE** for `Sisältö` because 90+ hits (query-dependent) have no facet value at all. Any UI presenting them as summing children would lie to the user.

## Files changed

| File | Change | LOC |
|---|---|---|
| `src/js/global-search-modular-ui.js` | +full-search-link sync hook, +Sisältö count-strip + `all_label` localise decoration | +45 / −2 |
| `src/_includes/_search-page-config.njk` | +`"all_label"` in `translations` | +1 |
| `src/_includes/_search-nav-config.njk` | +`"all_label"` in `translations` | +1 |
| `tests/pf5-hotfix-search-state-facet-counts.spec.js` | new — 9 regression cases | +173 |
| `tests/pf5-h1b-progressive-facets.spec.js` | helper `clickSisaltoValue` accepts both `All` and `Kaikki` for the reset pill | +5 / −4 |
| `tests/search-modular-ui-pilot.spec.js` | reset-pill matcher accepts both labels; count-visibility test rewritten to lock the hotfix contract (no `(N)` in visible text; `data-pfmod-pill-count` still present) | +21 / −13 |

## Tests

| Check | Result |
|---|---|
| `git diff --check` | clean |
| `npm run test:unit` | 612 pass / 0 fail |
| `npm run build:no-og` | PASS |
| New hotfix spec (9 cases: 4 full-results link + 5 Sisältö pill hotfix) | **9/9 PASS** |
| Full browser regression (11 spec files) | **151 pass / 6 documented-skip / 1 pre-existing baseline flake** (`pf5-g1-navbar-modular-ui.spec.js` FI `no-results state emits` — cleared 2/2 isolated re-run; same Modular UI Input dispatch timing baseline flake documented across G1/G2/H1A/H1B) |

## Preserved invariants (verified)

- **H1A:** `/haku/` still ships one authoritative SSR input; no injected duplicate.
- **H1B:** default state still shows only `Sisältö` facet; 11 secondary slots hidden; multi-select union still works; secondary reveal keyed on the same `aria-pressed` signal.
- **PF5-G1 navbar Modular UI:** dialog lifecycle intact (Escape closes, focus returns, dialog reopens cleanly).
- **Search UI hotfix (previous):** dark theme pill contrast still ≥ AA (theme-adaptive tokens unchanged), result list bullet+gap unchanged, navbar submit still opens dialog (unchanged from previous hotfix).
- **Fallback contract:** navbar `<form action="/haku/">` / `<form action="/en/search/">` preserved verbatim — JS-disabled path still navigates natively to full search page.
- **Pagefind ranking / metadata / filters / taxonomy / canonical semantics:** all unchanged.
- **`SearchResultPresenter`** / renderSharedCard DOM: unchanged.

## Accessibility

- Full-results link accessible name preserved (Nunjucks text content untouched).
- Updated href works keyboard-only (native `<a>`).
- Sisältö pill `aria-label` matches visible text (`Kaikki` / `All` / `Julkaisut` / …). No stale hidden count announcements — the numeric text was inside the same span so replacing `textContent` clears it from the accessibility tree.
- Selected pill state still announced via native `aria-pressed`.
- Secondary facets remain out of accessibility tree until revealed (H1B `hidden` attribute unchanged).

## Not started

- ❌ PF5-H1C — result-content hierarchy refinement.
- ❌ PF5-G3 — media Pagefind projection.
- ❌ PF5-G4 — writings meta widening.
- ❌ BBS / Gopher / theme.
- ❌ Any broader architecture change.
- ❌ Custom facet-count engine (audit §14 preferred simplification).
- ❌ URL sync for H1B `Sisältö` selection (audit §11 explicitly out of scope).

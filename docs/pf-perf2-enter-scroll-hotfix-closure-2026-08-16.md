# PF-PERF2 Enter-Scroll Hotfix — Closure

Date: 2026-08-16
Status: **PF-PERF2 ENTER-SCROLL HOTFIX = CLOSED / GREEN**

## 1. Merge

- PR: [#96 fix: preserve Find & Explore scroll position on enter search](https://github.com/LaruX75/www/pull/96) — merged 2026-08-16T14:26:20Z by LaruX75.
- Merge commit: `6ba3c9b7a006c979ae5083c4635506c2803a85f3`.
- Merge method: merge commit (repo convention).
- Head SHA at merge time: `ff2425a414be9e24329f99ffe9623393fb687ac5` — protected via `gh pr merge --match-head-commit`.
- No conflicts at merge.

## 2. Bug summary

After PR #95 (PF-PERF2 first-search perceived latency) merged, users
reported that pressing Enter in the Find & Explore search input
caused the viewport to jump to the top of the page and moved
focus out of the results region.

## 3. Root cause

Native GET form submit on Enter.

The Find & Explore controls live inside
`<form class="find-explore-controls" role="search" data-find-explore-form>`
(from `src/_includes/find-explore-writings.njk` line 13). Every
input carries a `name` attribute (`q`, `type`, `year`, `topic`,
`quality`). Without an explicit `submit` handler, pressing Enter
inside an input inside the form triggers native GET form submission,
which reloads the current URL with the form values as a query
string. The reload lands at `scrollY = 0` with focus lost.

The bug pre-dated PF-PERF2, but PF-PERF2's warmup made the perceived
latency shorter — the user's finger was still on Enter when the page
snapped back to the top, so it felt like a new regression.

## 4. Fix

JS-only, one file. In `src/js/find-explore.js`, capture the form
during `initMount` and intercept native submission, routing Enter
into the same runtime path every other filter change uses:

```js
const controlsForm = mount.querySelector("[data-find-explore-form]");
// ...
controlsForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});
```

No template change. No CSS change. No new attribute or aria role.
The pre-existing debounced `input` handler still runs as the user
types. Warmup, `aria-busy` toggling, and every other filter
behavior remain untouched.

Built asset grew from 26 209 B (PF-PERF2 baseline) to 26 938 B
(+729 B / +2.8 %).

## 5. Tests

`tests/pf-perf2-first-search-latency.spec.js` gained a fifth
Playwright case:

- Load `/tutkimus/`.
- `scrollIntoViewIfNeeded()` the Research contextual mount so the
  viewport is verifiably below the fold (asserts `scrollY > 50`
  at test setup).
- Focus the query input, fill an existing publication title,
  press Enter.
- Wait for the status text to change from idle.
- Assert `scrollY > 50` after Enter (no jump to top).
- Assert `document.activeElement` remains inside the Find &
  Explore mount.

`DISABLE_OG_IMAGES=true npx playwright test tests/pf-perf2-first-search-latency.spec.js --workers=1`:
**5 / 5 pass** (four original PF-PERF2 cases + the new Enter-scroll
case).

## 6. Boundaries preserved

- **No Research semantic change** — Research population unchanged
  from the F4 closure baseline.
- **Research population 317** — publications 53 + theses 169 +
  writings 62 + presentations 33; verified via
  `scripts/audit-f4-research-built-output.js` pre-merge.
- **No media in Research** — browser smoke asserts no media hits
  inside the Research contextual mount even after a chip click.
- **No Pagefind metadata change** — no `data-pagefind-filter`,
  `-meta`, `-sort`, or `-body` emission touched.
- **No `data-pagefind-body`** — M2 + PF2 + PF3 + PF4 + PF-PERF1
  reverse gates all still green.
- **No starter-chip change** — PF-STARTER's
  `runtimeDoesNotAutoSearch` audit gate still green;
  `src/js/starter-chips.js` and `src/css/starter-chips.css`
  untouched.
- **No result-card change** — PF3 badge, PF4 four-line hierarchy,
  publication quality micro-copy line, Open / Source /
  Citation-export actions all unchanged.

## 7. Post-merge workflow statuses

All three post-merge workflows on merge commit `6ba3c9b7` completed
`success`:

- `Build and Deploy` — completed / success (run `31952703787`).
- `Generate OG Images` — completed / success (run `31952703780`).
- `Accessibility and navigation tests` — completed / success
  (run `31952703804`).

## 8. Next recommendation

**PF-UI-L10N1 — Finnish search UI label localization fix.**

Do not start it in this closure step.

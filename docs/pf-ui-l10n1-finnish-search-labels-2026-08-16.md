# PF-UI-L10N1 — Finnish Search UI Label Localization Fix

Date: 2026-08-16
Status: **PF-UI-L10N1 FINNISH SEARCH LABELS = GREEN / READY FOR REVIEW**
Basis:
- `docs/pf-perf1-pagefind-startup-performance-audit-2026-08-16.md`
- `docs/pf-perf2-first-search-latency-2026-08-16.md`
- `docs/pf-perf2-enter-scroll-hotfix-closure-2026-08-16.md`
Machine data: `docs/data/pf-ui-l10n1-finnish-search-labels-audit-2026-08-16.json`
Audit script: `scripts/audit-pf-ui-l10n1-finnish-search-labels.js`

## 1. Status

Fix landed on `codex/pf-ui-l10n1-finnish-search-labels`, PR #TBD.
The nav-bar Pagefind UI overlay that opens from the site header on
every Finnish page now ships the **full** Finnish translation
bundle (matching the /haku/ full-page UI). English pages remain
English. No Pagefind index / metadata / research / result-card
change.

## 2. Repository state

- Branch created from `main` @ `76e6ac88a07ff8973121498424104c493c9d7a03`
  (`docs: close PF-PERF2 enter-scroll hotfix`)
- Prior PF closures all present on main; no unrelated source
  modifications
- Worktree clean for the PF-UI-L10N1 scope

## 3. User-observed issue

> Pagefindin kentät sisältöineen vasemmassa reunassa ovat englanniksi.

Translation: "The Pagefind fields with their content in the left
side are in English."

The affected surface is the nav-bar search overlay (the search
dialog that opens from the site header). Its PagefindUI instance
was shipping only a partial Finnish translations bundle, so
PagefindUI's own defaults leaked English for the strings the
bundle omitted — most visibly the left-side **"Filters"** label
above the filter facet panel, plus the "no results" / suggestion
alternate-search messages.

## 4. Surfaces inspected

- `/haku/` — full-page PagefindUI, initialized by
  `src/js/site-search-page.js`. Already shipped the complete
  Finnish translation bundle. No change needed.
- `/tutkimus/`, `/kirjoitukset/`, `/opinnaytteet/`, `/julkaisut/` —
  Find & Explore custom UI (not PagefindUI), initialized by
  `src/js/find-explore.js` with Finnish labels from
  `src/_includes/find-explore-writings.njk` template variables.
  Already Finnish. No change needed.
- `/en/search/` — English PagefindUI variant in
  `src/js/site-search-page.js`. Already English. No change needed.
- `/en/research/`, `/en/writings/`, `/en/theses/`,
  `/en/publications/` — English Find & Explore mounts. Already
  English. No change needed.
- **Nav-bar search overlay on every Finnish page** — this is the
  buggy surface. Initialized by `src/js/site-ui.js` at
  `pagefindUi = new window.PagefindUI({ element: mount, ... })`.
  Its `translations` object shipped only 8 strings; PagefindUI has
  11 translatable strings. The missing three (`filters_label`,
  `alt_search`, `search_suggestion`) fell back to English defaults.

## 5. Root cause

`src/js/site-ui.js` initialized the nav-bar PagefindUI overlay
with a **partial** translations bundle:

```js
translations: {
  placeholder,
  search_label: isEn ? '...' : 'Hae sivustolta',
  zero_results: ...,
  many_results: ...,
  one_result: ...,
  load_more: ...,
  clear_search: ...,
  searching: ...
}
```

PagefindUI's translation contract includes these additional
strings:

- `filters_label` — visible above the left-side filter panel
  ("Filters" by default).
- `alt_search` — visible when a spell-corrected alternate search
  runs after zero results.
- `search_suggestion` — visible above the "try one of these"
  suggestion list.

The nav-bar bundle omitted all three. Whenever a Finnish user
opened the nav search overlay and PagefindUI showed the filter
panel or a zero-results state, the missing strings fell back to
PagefindUI's built-in English defaults.

The `/haku/` full-page PagefindUI (initialized separately in
`src/js/site-search-page.js`) shipped all 11 strings correctly, so
the bug was invisible on `/haku/` and visible only via the
nav-bar overlay.

## 6. Localization strategy

Extend the nav-bar bundle to match the `/haku/` bundle — same
strings, same shape, same FI/EN split via `isEn`. Concretely:

- Complete Finnish + English translation objects with all 11
  PagefindUI strings.
- Preserve the `isEn` ternary so English pages continue to see
  English defaults.
- Reuse the exact Finnish wording from `src/js/site-search-page.js`
  where possible so the two surfaces feel identical.
- Do NOT change any Pagefind index facet values (`Sisältö:*`,
  `Kieli:*`, `Mediatyyppi:*`, etc. remain the site's already-Finnish
  facet vocabulary).
- Do NOT add `Sisältö:Tutkimus`.
- Do NOT expose any `FindExplore:*` token as a visible label.

## 7. Finnish /haku/ behavior

Unchanged. `src/js/site-search-page.js` already carried the
complete Finnish translation bundle before PF-UI-L10N1. The
audit gate `hakuKeepsFinnishTranslations` verifies the expected
Finnish strings still appear in the shipped script.

## 8. Finnish Find & Explore behavior

Unchanged. `/tutkimus/`, `/kirjoitukset/`, `/opinnaytteet/`,
`/julkaisut/` use the custom Find & Explore UI initialized by
`src/js/find-explore.js`. Its visible labels come from the
Nunjucks template `src/_includes/find-explore-writings.njk` and
per-page data variables (e.g. `findExploreSearchLabel`,
`findExploreYearLabel`, `findExploreResetLabel`) — all already
Finnish on Finnish pages, English on English pages. Verified by
the browser smoke asserting `Tutkimusteema`, `Vuosi`, `Tyhjennä`
labels on `/tutkimus/`.

## 9. English parity behavior

Unchanged. `/en/search/` continues to receive the English
PagefindUI bundle from `src/js/site-search-page.js`. English pages
opening the nav-bar overlay now receive the full English
translation bundle (previously they too had the partial bundle,
but the English defaults matched the omitted strings so the bug
was invisible on English pages). PF-UI-L10N1 makes the English
bundle explicit, which is safer for future PagefindUI defaults
that could drift.

The audit gate `navBarKeepsEnglishTranslations` verifies the
required English strings are still present in `site-ui.js`.

## 10. PF-PERF2 warmup boundary

Untouched. `src/js/find-explore.js` was not modified by
PF-UI-L10N1. The audit gate `findExploreWarmupIntact` verifies
the `warmSearchLanguages` helper is still shipped. The browser
smoke re-runs the PF-PERF2 warmup + search invariants
(no automatic results on load, warmup requests Pagefind, first
explicit query renders results, chip runtime doesn't call
Pagefind directly, no `data-pagefind-body` on detail pages) and
all pass.

## 11. Enter-scroll hotfix boundary

Untouched. `find-explore.js` still carries the
`controlsForm.addEventListener("submit", ...)` handler introduced
by PR #96. Audit gate `findExploreEnterHandlerIntact` verifies
the form-submit interception is still present. The browser smoke
re-runs the Enter-scroll assertion (scroll below fold → fill
query → press Enter → `scrollY > 50` after → focus inside mount)
and it still passes.

## 12. Files changed

- `src/js/site-ui.js` — nav-bar PagefindUI init: replaced the
  partial translations object with a complete `isEn ? {...} : {...}`
  split matching the `/haku/` bundle. Net +28 lines, no logic
  removed.
- `scripts/audit-pf-ui-l10n1-finnish-search-labels.js` (new) —
  10-gate deterministic audit inspecting `_site/js/site-ui.js`,
  `_site/js/site-search-page.js`, `_site/js/find-explore.js`,
  `_site/haku/index.html`, and `_site/en/search/index.html`.
- `tests/pf-ui-l10n1-finnish-search-labels.spec.js` (new) — 6
  Playwright smokes covering the Finnish bundle presence,
  `/haku/` unchanged, `/tutkimus/` Finnish F&E controls, English
  parity, PF-PERF2 warmup + Enter-scroll invariants, and the
  media/data-pagefind-body reverse guard.
- `docs/pf-ui-l10n1-finnish-search-labels-2026-08-16.md` (new) —
  this report.
- `docs/data/pf-ui-l10n1-finnish-search-labels-audit-2026-08-16.json`
  (new) — machine-readable audit output.

No template touched. No CSS touched. No Pagefind metadata,
`find-explore.js`, `starter-chips.js`, `presentations-page.js`,
`site-search-page.js`, or any archive card modified.

## 13. Tests / audit added

- `tests/pf-ui-l10n1-finnish-search-labels.spec.js` — 6 cases,
  all green.
- `scripts/audit-pf-ui-l10n1-finnish-search-labels.js` — 10 gates,
  all green (nav-bar Finnish bundle complete, English fallback
  preserved, `/haku/` Finnish bundle unchanged, no
  `Sisältö:Tutkimus`, PF-PERF2 warmup intact, Enter-scroll
  handler intact, no `data-pagefind-body` in site-ui / find-explore
  / haku HTML, `/en/search/` template present).

## 14. Verification

Local gates on the PF-UI-L10N1 branch build:

- `npm run build:no-og` — green (Pagefind entry `fi:1163 / en:346`,
  no index collapse).
- `npm run test:unit` — **401 / 401 pass**.
- `node scripts/audit-pf-ui-l10n1-finnish-search-labels.js` —
  all 10 gates green.
- `node scripts/audit-pf-perf1-pagefind-startup.js` — all 8 gates
  green.
- `node scripts/audit-pf4-result-card-hierarchy.js` — all 19 gates
  green.
- `node scripts/audit-pf-starter-chips.js` — all 11 gates green.
- `node scripts/audit-pf3-result-card-consistency.js` — all 9
  gates green.
- `node scripts/audit-pf2-sisalto-facet.js` — all 9 gates green
  (750 detail records).
- `node scripts/audit-media-pagefind-m2.js` — all gates green
  including reverse `noDetailUsesPagefindBody`.
- `node scripts/audit-f4-research-built-output.js` —
  `totalResearchPopulation: 317`; media not enumerated.
- `node scripts/audit-presentation-pagefind.js` — `ok: true`.
- `DISABLE_OG_IMAGES=true npx playwright test tests/pf-ui-l10n1-finnish-search-labels.spec.js
  --workers=1` — **6 / 6 pass**.
- `DISABLE_OG_IMAGES=true npx playwright test tests/pf-perf2-first-search-latency.spec.js
  --workers=1` — **5 / 5 pass** (regression check).

## 15. Boundaries preserved

- Pagefind index / metadata / facet values unchanged.
- `Sisältö:*` vocabulary unchanged.
- No `Sisältö:Tutkimus` introduced.
- No `FindExplore:*` visible.
- Research population 317 unchanged.
- Media not in Research.
- Starter chips runtime + CSS unchanged.
- Result-card renderer + hierarchy unchanged.
- PF-PERF2 warmup helpers intact.
- Enter-scroll form-submit interception intact.
- No `data-pagefind-body` reintroduced anywhere.

## 16. Risks and rollback notes

**Risks**:

- **Future PagefindUI version bumps** may add new translation
  strings. If any new default is English, we'd have the same
  bug for that string on Finnish pages. Mitigation: re-run
  `scripts/audit-pf-ui-l10n1-finnish-search-labels.js` after any
  Pagefind minor/major upgrade; add missing strings to the
  bundle. The audit's `REQUIRED_FI_STRINGS` list can be
  extended in one place.
- **Nav-bar overlay double-init**: `pagefind-ui.js` (loaded
  with `defer` in `_meta.njk`) has auto-init behavior for
  `[data-pagefind-ui]` elements. `site-ui.js` also does a manual
  `new PagefindUI({element: mount})` on the same mount. The
  existing pre-PF-UI-L10N1 code did the same and worked
  (partial translations applied), so no regression risk from
  PF-UI-L10N1's fix.
- **Non-breaking space differences**: the browser smoke uses
  tolerant regexes (`Hae\s+sivustolta`) rather than exact
  string matching, so any whitespace-escape variants from the
  build pipeline still pass.

**Rollback**:

Revert `src/js/site-ui.js` to the pre-fix partial translations
object. No other file needs reverting; the audit script and
browser smoke can stay as reverse gates (they would fail loudly
on the rollback, which is the correct signal). No template, no
CSS, no Pagefind metadata change — rollback is one-file and
mechanical.

## 17. Recommended next step

**No further Pagefind PF workstream is queued** after this fix. The
PF chain (F4 → M2 → PF1 → PF2 → PF3 → PF-STARTER → PF4 → PF-PERF1
→ PF-PERF2 → PF-PERF2 Enter-scroll hotfix → PF-UI-L10N1) is
complete for the Pagefind / Find & Explore surface.

Optional follow-ups worth watching for signal, not scheduled here:

- **PagefindUI translation completeness audit** on the next
  Pagefind version bump (add missing strings before shipping).
- **Nav-bar overlay double-init cleanup** — remove the
  `data-pagefind-ui` attribute from the nav template and rely
  solely on the JS init in `site-ui.js`. Requires care so the
  auto-init doesn't run first.
- **English content-family badges** (`Sisältö:Julkaisut` etc. as
  displayed labels on `/en/*` result cards) — currently Finnish
  across FI and EN mounts by design (matches the Pagefind filter
  value). If English display becomes a priority, a bilingual
  badge-label pattern is a separate UX decision.

SEO / social sharing / scroll-hint work in the Codex UXSEO line
remains a separate track outside PF.

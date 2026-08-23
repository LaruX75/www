# PF5 search production regression hotfix

## Status

**CLOSED / GREEN / MAIN.** Merged 2026-08-23 as PR [#132](https://github.com/LaruX75/www/pull/132); merge commit `69cf113cc793e0b57828fef34109a6fb166464f1` is the current `origin/main`. Post-merge Actions run [32651329956](https://github.com/LaruX75/www/actions/runs/32651329956) — build / deploy / smoke all success.

Scope was: **only** deployment restoration + Modular UI stylesheet loading. Presenter convergence, navbar migration, G2/G3/G4 remain deferred and untouched.

## Closure / merged state (2026-08-23)

| | |
|---|---|
| PR | [#132](https://github.com/LaruX75/www/pull/132) — MERGED |
| mergedAt | 2026-08-23T16:19:56Z |
| mergedBy | LaruX75 (via `gh pr merge --match-head-commit`) |
| Merged head SHA | `c2c1190b19f97ba1c7f352208ac23a96ef79cb80` |
| Merge commit SHA | `69cf113cc793e0b57828fef34109a6fb166464f1` |
| Resulting `origin/main` | `69cf113cc793e0b57828fef34109a6fb166464f1` |
| Previous `origin/main` | `3f56c52e4aa9fae22f940ebb223e229b7babfbba` |
| Post-merge Actions run | [32651329956](https://github.com/LaruX75/www/actions/runs/32651329956) — build ✓ / deploy ✓ / smoke ✓ |
| Production `/haku/` | HTTP/2 200, SSR HTML contains `pagefind-modular-ui.css` `<link>` (PROVEN) |
| Production `/en/search/` | HTTP/2 200, SSR HTML contains `pagefind-modular-ui.css` `<link>` (PROVEN) |
| Production `/pagefind/pagefind-modular-ui.css` | HTTP/2 200 (PROVEN) |
| Navbar Default UI CSS in production HTML | 3 occurrences on `/haku/` (preload + non-blocking + noscript) — retained as intended (PROVEN) |
| Hotfix worktree `/private/tmp/www-pf5-search-hotfix` | removed at closure |
| Local branch `pf5/search-production-hotfix` | deleted (`git branch -d`, was `c2c1190b`) |
| Remote branch `origin/pf5/search-production-hotfix` | deleted (`git push origin --delete`) |
| Presenter-convergence worktree `/private/tmp/www-pf5-g1-presenter` | **preserved untouched** — HEAD `3f56c52e`, uncommitted state byte-identical to pre-hotfix inventory |

## Pre-merge implementation state (historical)

- **Branch (during implementation):** `pf5/search-production-hotfix` (deleted at closure)
- **Worktree (during implementation):** `/private/tmp/www-pf5-search-hotfix` (removed at closure)
- **Base / HEAD at review checkpoint:** `3f56c52e4aa9fae22f940ebb223e229b7babfbba`
- **`origin/main` at review checkpoint:** `3f56c52e4aa9fae22f940ebb223e229b7babfbba`
- **Hotfix commit created after review approval:** `c2c1190b19f97ba1c7f352208ac23a96ef79cb80` — later fast-forward-merged into `main` as part of merge commit `69cf113c` (PR #132).
- Verified separately during implementation: `/private/tmp/www-pf5-g1-presenter` (branch `pf5/g1-presenter-convergence`) also at `3f56c52e`, holds an independent uncommitted presenter-convergence slice — **not touched** by this hotfix, still preserved at closure.

## GitHub Actions failure that triggered this hotfix

Run [32631445914](https://github.com/LaruX75/www/actions/runs/32631445914) on `main` at `3f56c52e`:

- `npm run build` — PASS
- `npm run check:i18n-seo` — PASS
- `npm run check:seo-health` — PASS
- **`Security – ei | dump | safe -kuvioita templeteissä` — FAIL** → `smoke` and `deploy` jobs skipped.

Guard shell (`.github/workflows/build.yml:50`):
```
! grep -rn "| dump | safe" src/ --include="*.njk"
```

## Root cause 1 — deployment security blocker

**PROVEN.** `src/_includes/_search-page-config.njk:46` used:

```njk
<script type="application/json" id="siteSearchPageConfig">{{ searchPageConfig | dump | safe }}</script>
```

`| dump | safe` matches the CI security guard grep verbatim, so every push after the `pf5/g1-en-search` merge blocked its own deploy.

### Fix

Replace `dump | safe` with the repo's sanctioned `jsonSafe | safe` filter:

```njk
<script type="application/json" id="siteSearchPageConfig">{{ searchPageConfig | jsonSafe | safe }}</script>
```

`jsonSafe` (defined in `eleventy.filters.js:1039`):

```js
eleventyConfig.addFilter("jsonSafe", function (value) {
  return JSON.stringify(value)
    .replace(/<\/script/gi, "<\\/script")
    .replace(/<!--/g, "<\\!--");
});
```

Why this is safe **and** compatible with the CI guard:

- `JSON.stringify` produces valid JSON (`type="application/json"` script parses successfully in the browser).
- `</script` and `<!--` are the two script-context breakouts an attacker could smuggle into a JSON string; `jsonSafe` neutralises both.
- The transformation is a **whitelist replacement**, not a hide-behind-helper: the string `| dump | safe` no longer appears in the template.
- Already used at 25+ call sites (`avainsanat-index.njk`, `teemat.njk`, `kategoriat-index.njk`, `teemat-index.njk`, `kategoriat.njk`, …) — this hotfix reuses a well-established repo pattern.
- CI security guard is **unchanged** (`.github/workflows/build.yml:50`).

### Verification

```
$ grep -rn "| dump | safe" src/ --include="*.njk"
$ echo $?
1        # zero matches (grep exits 1) → `! grep` passes
```

Built HTML sanity check (both locales):

```
FI JSON OK facetGroups: 12 lang: Suomi
EN JSON OK facetGroups: 12 lang: English
```

12 facet groups + FI/EN config semantics preserved verbatim.

## Root cause 2 — missing Modular UI stylesheet

**PROVEN.** Pagefind 1.5.2 Modular UI ships its own stylesheet `pagefind/pagefind-modular-ui.css`, distinct from the Default UI stylesheet `pagefind/pagefind-ui.css`. `_site/pagefind/pagefind-modular-ui.css` is generated by every build.

The `/haku/` and `/en/search/` pages migrated to the Modular UI controller in the previous merged slices, but neither page nor `_includes/_meta.njk` requested the Modular UI stylesheet. Only `pagefind-ui.css` (Default UI, needed by the navbar mount) was loaded.

Consequence in production: Modular UI DOM was rendered without its own CSS. In particular, Pagefind's `[data-pfmod-sr-hidden]` rule was missing (see below), so FilterPills accessible helper labels ("Filter results by …") rendered as **visible page text** instead of being visually clipped to a 1×1 sr-only box.

### The sr-hidden rule (from `_site/pagefind/pagefind-modular-ui.css`)

```css
[data-pfmod-sr-hidden] {
    -webkit-clip: rect(0 0 0 0) !important;
    clip: rect(0 0 0 0) !important;
    -webkit-clip-path: inset(100%) !important;
    clip-path: inset(100%) !important;
    height: 1px !important;
    overflow: hidden !important;
    overflow: clip !important;
    position: absolute !important;
    white-space: nowrap !important;
    width: 1px !important;
}
```

Without this rule, every `[data-pfmod-sr-hidden]` element (which the Modular UI uses for the FilterPills group's accessible label) renders inline in the normal document flow.

### Fix

Add `pageStyles:` front-matter to both search pages so `base.njk:50-52` emits the Modular UI stylesheet `<link>`:

```yaml
# src/fi/haku.njk + src/en/search.njk
pageStyles:
  - /pagefind/pagefind-modular-ui.css
```

This uses the existing template mechanism — no `_meta.njk` change, no new machinery, no runtime JS injection.

**Explicitly retained:** `_meta.njk` still preloads and loads `/pagefind/pagefind-ui.css` and defers `/pagefind/pagefind-ui.js` for the Default UI navbar mount on every page. Both `<link>` lines coexist on `/haku/` and `/en/search/`:

```
FI /haku/ <head>:
  <link rel="preload" href="/pagefind/pagefind-ui.css" as="style">
  <link href="/pagefind/pagefind-ui.css" rel="stylesheet" ...>       ← Default UI (navbar)
  <link rel="stylesheet" href="/pagefind/pagefind-modular-ui.css">    ← NEW (search page Modular UI)
```

Same on `/en/search/`.

## Browser evidence

Playwright `chromium` on the built `_site/` (`PLAYWRIGHT_USE_STATIC_SERVER=true`):

### FI `/haku/`

- New regression test **passes** on the FI locale:
  - `link[rel=stylesheet][href="/pagefind/pagefind-modular-ui.css"]` count = **1**
  - Modular UI mounted (`#siteSearchPageUi[data-search-modular-ready="true"]`)
  - Query `tekoäly` returns results with family badge + primary-meta
  - `#siteSearchPageUi [data-pfmod-sr-hidden]` count > 0 (accessible helper labels PRESENT for AT)
  - Every helper element has `textContent.length > 0` AND `boundingClientRect.width <= 1` AND `boundingClientRect.height <= 1` AND `getComputedStyle().position === 'absolute'` → visually clipped, out of flow
- Full existing FI pilot suite (17 scenarios) — **PASS**

### EN `/en/search/`

- Same regression test **passes** on the EN locale (probe query `learning`).
- Full existing EN pilot suite (17 scenarios, 1 documented publications-only-facet skip) — **PASS**

### Combined pilot spec result

```
40 passed, 2 skipped (24.0s)
```

Both documented skips are the same publications-only-facet EN skips carried unchanged from the `/en/search/` rollout (publications are FI-canonical only).

### `pf-ui-l10n1-finnish-search-labels.spec.js` — PASS

Included in the same 40-pass run above. Confirms the inline JSON config still emits the FI/EN Finnish label strings verbatim (i.e. `jsonSafe` did not alter the config semantics).

### Helper-label root cause outcome

**PROVEN:** loading `/pagefind/pagefind-modular-ui.css` alone visually hides the previously exposed "Filter results by …" text. No CSS override, no additional JS hack, no site stylesheet change was required. The regression test locks both (a) the asset link presence and (b) the semantic effect (nodes clipped) so this cannot silently recur.

## Regression test added

`tests/search-modular-ui-pilot.spec.js` — 1 new parameterised test (runs on both FI and EN, +2 test cases total):

> loads /pagefind/pagefind-modular-ui.css and clips Modular UI sr-only helper text (regression: production launch 2026-08-23)

Asserts:

1. Build-level: `<link rel="stylesheet" href="/pagefind/pagefind-modular-ui.css">` present on the page.
2. Semantic: every `[data-pfmod-sr-hidden]` node under the mount is clipped to `<=1px × <=1px` with `position: absolute`, and still carries text (accessible name preserved for assistive tech).

Deliberately **not** asserted: exact pixel dimensions, exact CSS `clip` string, exact node count. Kept semantic to avoid brittleness against Pagefind CSS revisions.

## Files changed

| File | Change | +/- |
|---|---|---|
| `src/_includes/_search-page-config.njk` | `dump \| safe` → `jsonSafe \| safe` on line 46 | +1 / −1 |
| `src/fi/haku.njk` | adds `pageStyles: [/pagefind/pagefind-modular-ui.css]` to front-matter | +2 |
| `src/en/search.njk` | adds `pageStyles: [/pagefind/pagefind-modular-ui.css]` to front-matter | +2 |
| `tests/search-modular-ui-pilot.spec.js` | 1 new parameterised regression test (FI + EN) | +47 |
| `docs/pf5-search-production-regression-fix-2026-08-23.md` | this evidence doc | new |

Total production diff: **+5 / −1** across 3 template files.

## Test / build / security summary

| Check | Command | Result |
|---|---|---|
| Diff hygiene | `git diff --check` | clean |
| Unit | `npm run test:unit` | **602 pass / 0 fail** |
| Full production build | `npm run build:no-og` | **PASS** — `Copied 273 Wrote 1472 files in 30.05 seconds` + postbuild (Pagefind, SEO dashboard, research.fi integrity) all OK |
| i18n / SEO parity | `npm run check:i18n-seo` | **OK — 1459 HTML files** |
| SEO health | `npm run check:seo-health` | **OK — urls=561 lastmod=561 missingFiles=0** |
| Deployment-blocking security | `! grep -rn "\| dump \| safe" src/ --include="*.njk"` | **PASS — zero matches** (previously 1) |
| Global search browser suite | `search-modular-ui-pilot.spec.js` | **40 pass / 2 documented-skip / 0 fail** |
| Finnish label parity | `pf-ui-l10n1-finnish-search-labels.spec.js` | **PASS** (in the same 40-pass run) |
| Navbar / navigation | `navigation.spec.js` | **PASS** — navbar Default UI unaffected |
| Accessibility | `accessibility.spec.js` | **PASS** (18-pass combined a11y + navigation run) |

## Scope guardrails (all PROVEN by diff)

- **Presenter convergence worktree untouched.** `/private/tmp/www-pf5-g1-presenter` unchanged; no file in this hotfix worktree overlaps with the presenter-convergence uncommitted set.
- **Navbar untouched.** Default UI navbar mount unchanged; `pagefind-ui.css` + `pagefind-ui.js` still loaded on every page from `_includes/_meta.njk`.
- **No `_meta.njk` change.** The Modular UI stylesheet is opt-in per page via `pageStyles:` — no global asset change that could bleed into pages using Default UI.
- **No Pagefind metadata / taxonomy / contexts / filter change.**
- **No canonical content change.**
- **No Pagefind upgrade.**
- **No CI security guard change.**
- **No F&E script loader change.**
- **No G2/G3/G4 work started.**

## Evidence classification

**PROVEN (implementation, pre-merge):**
- both root causes reproduce on `3f56c52e` (unchanged offending line + missing `<link>`)
- both fixes proven by direct source + built HTML + Playwright execution on both locales
- security guard passes zero-match verbatim
- navbar unaffected
- pre-merge Playwright regression test asserted `[data-pfmod-sr-hidden]` nodes clipped to `<=1px × <=1px`, `position: absolute`, with `textContent.length > 0` — semantic sr-only clipping observed in a real browser on both FI and EN

**PROVEN (closure, post-merge):**
- merged head `c2c1190b` landed on `main` via merge commit `69cf113c`
- Actions run 32651329956 on `69cf113c`: `build`, `deploy`, `smoke` all success
- the CI security step `Security – ei | dump | safe -kuvioita templeteissä` (`.github/workflows/build.yml:50`) — which had failed on the previous main `3f56c52e` — passes on the merged tree
- production HTTP evidence: `/haku/` = HTTP/2 200, `/en/search/` = HTTP/2 200, `/pagefind/pagefind-modular-ui.css` = HTTP/2 200
- production SSR HTML: `pagefind-modular-ui.css` `<link>` present on both `/haku/` and `/en/search/` (1 occurrence each); Default UI `pagefind-ui.css` still referenced 3× on `/haku/` (preload + non-blocking + noscript) → navbar assets retained as intended
- new regression test locked into main and runs on every future push (asserts both the `<link>` presence AND the sr-only semantic clip)

**Deliberately NOT promoted from curl to browser evidence:**
- production HTTP evidence proves the stylesheet is *served* and *linked*, not that the browser applied the `[data-pfmod-sr-hidden]` clip rule in a live production render. That semantic is asserted only by (a) the pre-merge Playwright regression run + (b) the same regression test now embedded in CI. It has not been re-observed in a live production browser session post-deploy.

**INFERENCE now PROVEN:**
- the pre-merge inference "deployment on GitHub Actions will succeed after merge" is now PROVEN by the post-merge Actions run.

**NEEDS FOLLOW-UP:** none for this hotfix.

## Remaining blockers

None specific to this hotfix.

Baseline pre-existing failures documented in the presenter-convergence slice (`tests/f4-research-find-explore.spec.js:38`, `tests/pf-perf2-first-search-latency.spec.js:49`, `tests/pf5-impl-apa-full-list.spec.js:67`) are unchanged by this hotfix and remain out of PF5-G1 scope.

## Decision

**CLOSED / GREEN / MAIN.**

Merged, deployed, production-verified, and hotfix branches/worktree cleaned up. Presenter-convergence work in `/private/tmp/www-pf5-g1-presenter` remains preserved and untouched — it resumes as its own review after this hotfix's closure documentation lands.

# O1 — Detail Orientation Closure

Date: 2026-08-21

Status: CLOSED / GREEN / MAIN

Base `origin/main` SHA: `b685a146428d41c920a848dbc975e9343a5b6753`

O1 detail orientation is closed on `main`. This document is the closure record for the whole workstream — both the core primitive (Publications, Theses, Writings) and the Presentations + Media widening.

## 1. Scope Achieved

O1 delivers a shared, SSR-first detail-orientation contract covering the mature canonical detail surfaces of the site:

- Publications
- Theses
- Writings
- Presentations
- Media

Closure does not mean every domain has identical routes, UI, or landing rules. It means the shared orientation contract is now applied wherever suitable, while domain landing/source semantics remain authoritative.

## 2. Final Model

```text
canonical hub return
  -> SSR / no-JS

active discovery context
  -> explicit same-origin returnTo
  -> prefix allowlist
  -> progressive enhancement
```

Shared primitive: [src/_includes/detail-orientation.njk](../src/_includes/detail-orientation.njk).

Client validator: `src/js/site-ui.js` `[data-detail-return-link]` resolver — same-origin check, prefix allowlist, hub-fallback deduplication, self-target deduplication.

## 3. Domain Outcomes

### Publications / Theses / Writings — O1 core

- Applied via detail bodies: `src/_includes/publication-item-body.njk`, `src/_includes/thesis-detail-body.njk`, `src/_includes/writing-post.njk`
- Discovery return plumbed via `src/js/find-explore.js` (decorated local card links with `?returnTo=<current URL>`)
- History-back magic removed for writings

Reference: [o1-orientation-implementation-2026-08-20.md](./o1-orientation-implementation-2026-08-20.md).

### Presentations — Widening (PR #122)

- Shared primitive on local detail pages (`src/_includes/presentation-item.njk`) with `orientationHubHref = /esitykset/`, `orientationReturnPrefixes = ["/esitykset/", "/en/presentations/"]`
- External-first canonical presentations continue to bypass the local detail template — the primitive is never rendered for them, and their identity remains external
- Local detail card links carry `?returnTo=<current URL>` only when the target begins with `/presentations/` and the item is not external-first (`src/js/presentations-page.js` `archiveCardHtml`)

### Media — Widening (PR #122)

- Shared primitive on all local detail pages (`src/_includes/media-item.njk`) with `orientationHubHref = /mediassa/`, `orientationReturnPrefixes = ["/mediassa/", "/en/media/"]`
- Original-source CTA (`Avaa alkuperäinen lähde`) remains the visually primary action above the orientation nav
- Local detail links (`Lisätiedot`) carry `?returnTo=<current URL>` via a small `detailUrlWithReturn` helper in the existing inline archive script (`src/fi/mediassa.njk`); SSR opening cards and main highlight carry hardcoded `?returnTo=%2Fmediassa%2F`; EN archive `Details (FI)` link carries `?returnTo=%2Fen%2Fmedia%2F`

References: [o1-widening-presentations-media-suitability-audit-2026-08-21.md](./o1-widening-presentations-media-suitability-audit-2026-08-21.md), [o1-widening-presentations-media-implementation-2026-08-21.md](./o1-widening-presentations-media-implementation-2026-08-21.md).

## 4. Deletion / Convergence

O1 closure landed concrete C1-style deletions alongside the work, not as a separate cleanup pass:

- Writings `history.back()` dependency removed in O1 core (footer back control that read `data-history-back`, plus the global `history.back()` enhancer in `site-ui.js`)
- Presentation hardcoded `<a href="/esitykset/">Kaikki esitykset</a>` in `presentation-item.njk` removed and replaced by the shared primitive
- Media hardcoded `<a href="/mediassa/">Kaikki mediaosumat</a>` in `media-item.njk` removed and replaced by the shared primitive
- No duplicate domain-specific orientation layer remains anywhere in the tree

## 5. Boundaries Preserved

- Canonical Content v1 unchanged
- Pagefind remains discovery only — no orientation state migrated into Pagefind
- No `contexts` changes
- No Research inference introduced for any domain
- No preferred presentation landing semantics changed (landing = local if `hasLocalDetail`, else external — unchanged)
- No media canonical / source semantics changed
- No new EN detail routes created (no `/en/presentations/{slug}/` or `/en/media/{slug}/` invented)
- No public JSON contract changes
- No `history.back()` re-introduced

## 6. Validation Evidence (PR #122)

Verified locally in the widening audit worktree and confirmed via CI on the merged PR:

- `build-and-verify` (Staging checks) — PASS (1m39s)
- `playwright` (Accessibility and navigation tests) — PASS (4m23s)
- `npm run test:unit` — 602 / 602 PASS
- `npx playwright test tests/o1-orientation.spec.js` — 11 / 11 PASS (4 pre-existing + 7 new)
- `npx playwright test tests/presentations-archive.spec.js` — 2 / 2 PASS (2 exact-href assertions widened to prefix-match)
- `npx playwright test tests/media-archive.spec.js` — 3 / 3 PASS
- `npx playwright test tests/presentations-research-smoke.spec.js` — 1 / 1 PASS
- Canonical presentation invariants unchanged in build output: 218 canonical / 138 local-first / 80 external-first / 139 local detail pages

Merge commit: `b685a146428d41c920a848dbc975e9343a5b6753` (PR #122).

## 7. Reopen Criteria

O1 reopens only on:

- a new repo-evidenced orientation regression, or
- a new domain requiring explicit suitability review (with a per-domain GO / REDUCE / NO-GO verdict against the shared primitive — Presentations and Media may have different verdicts and future domains may too)

Presentations and Media are FI-only for detail pages today. If EN detail routes are ever introduced for either, the existing `orientationReturnPrefixes` already accommodates the cross-locale case, but the introduction of the EN detail route itself is a separate content decision that this closure does not authorize.

## 8. Final Closure Statement

O1 has no remaining active implementation lane.

**N1 is the next Architecture Closure workstream.** Baseline focus-trap regression in `tests/navigation.spec.js` remains the known starting point per the roadmap.

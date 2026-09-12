# EMBEDDED-VIDEO-PRESENTATION-COMPLETENESS-02

Status: VERIFIED / GREEN / PENDING PR

Baseline: `0ab88f28303f97db2292c3f34ea3492215fb8a2c`

## Full-pipeline verification

- `0cJ0Ed3Scs4` is already the `curatedVideos` canonical presentation
  *ITK-avauksen tallenne: Työkalu? Taikakalu?*, with external-source landing,
  date 2026-04-26, thumbnail and ITK context. No local duplicate was created.
- `7LPyHCnuYJE` had no presentation, curated-video, media or diagnostic owner.
  Direct YouTube page metadata confirms the title *Millainen on nykyaikainen
  oppimisympäristö*, uploader `Jari Laru`, availability, thumbnail and the
  exact publication/upload timestamp `2017-01-25T06:51:47-08:00`. The related
  2017 column identifies it as a standalone expert contribution for an Oulu
  learning-environment planning workshop. The YouTube description separately
  contains `L2. 26.1.2017`; that workshop marker is preserved as context and
  not silently treated as the upload date.
- `xTpiDVWSguc` is already associated with the canonical SlideShare detail
  `/presentations/ss-mobiililaitteiden-mahdollisuudet-oppimisen-tukena/`.
  That presentation's canonical source description explicitly identifies the
  same YouTube recording. No duplicate local record is safe.

## Outcome

- One external-source presentation record was added:
  `src/presentations/millainen-on-nykyaikainen-oppimisymparisto.md`.
  Its matching `CURATED_VIDEO_ITEMS` source row owns the canonical YouTube
  identity and binds the item to the local detail route. It uses canonical date
  `2017-01-25`, the source-verified YouTube publication/upload date, and
  preserves the workshop wording as event context. The original column remains
  a column and is unchanged in semantic role.

## Final verification

- Production `npm run build`: PASS.
- Generated JSON: exactly one `7LPyHCnuYJE` canonical item, with local landing
  `/presentations/millainen-on-nykyaikainen-oppimisymparisto/` and the YouTube
  URL preserved as both source and external URL.
- Generated detail HTML: PASS for title, canonical date, workshop event and
  source URL.
- Focused presentation projection test: PASS.
- Research.fi integrity: PASS.
- The record declares no `contexts` or `courseContexts`; existing derived
  discovery contexts remain governed by the unchanged shared resolver.

## Baseline test reconciliation

- Full `tests/unit/presentationsPage.test.js` is `6/8` on this branch and
  `5/7` on a clean `origin/main` worktree at
  `e83df62e5bc3e5224df4bbea6f9109c94c39722b`. Both runs have the same two
  failures: the local-detail fallback expectation predates PR #250's canonical
  thumbnail precedence, and both exact-object expectations predate the added
  `location`, `kategoria` and `jarjestaja` fields.
- The 7LPyHCnuYJE focused projection test is the additional passing test on
  this branch. It does not alter either baseline assertion.
- Baseline expectation reconciliation is deliberately deferred to a separate
  focused follow-up PR.

Canonical Content v1: unchanged.
Public JSON schema: unchanged.
Pagefind architecture: unchanged.
AC1: CLOSED / GREEN.

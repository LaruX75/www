# Content Role Projection 01

Baseline: `1fe6bbafb54a8fbbec0c7620140a90c37948d09c`.

## Root Cause

Canonical thesis and media records were correct, but their generic display
projection was not. `contentTypeLabel` fell through to `Kirjoitus` for thesis
roles and allowed the `pressRelease` source format to override an
`expertAssignment` role.

The thesis virtual-collection adapter had a separate landing regression:
`toThesesCollectionItems` projected the external OuluREPO `link` as `item.url`
and omitted `data.pageUrl` and `data.sourceUrl`. `computeRelatedContent` then
preserved that value unchanged, and the shared related-content include rendered
it as the primary title link. This was the first stage where the canonical
`/opinnaytteet/{id}/` landing was lost.

## Resolution

- Thesis roles precede generic type fallbacks: `advised` renders as `Ohjattu
  opinnäyte`; `reviewed` renders as `Tarkastettu opinnäyte`.
- The canonical thesis-role vocabulary is only `advised` and `reviewed`; no
  unused `examined` pseudo-enum was introduced.
- Expert assignments render as `Asiantuntijarooli` before their source format.
- Virtual thesis items now set `url` and `data.pageUrl` to the canonical local
  thesis page and retain OuluREPO separately as `data.sourceUrl`.
- Media cards prefer their internal `item.url`; `sourceUrl` remains the source
  action fallback.

## Verification

Fresh local build: PASS, 1,493 generated files. Research.fi integrity: PASS
(57 archive publications, 57 metadata records, 55 research lines, 54 curated
themes).

The same title-link audit was run against a clean baseline snapshot and this
branch. The canonical thesis collection has 169 unique records: 116 `advised`
and 53 `reviewed`.

| Measure | Baseline | Fixed build |
| --- | ---: | ---: |
| Thesis records with an external primary title link | 129 | 0 |
| External OuluREPO primary title links | 847 | 0 |
| Thesis archive/detail occurrences | 631 | 0 |
| Discovery occurrences | 15 | 0 |
| Other related-content occurrences | 201 | 0 |

Known fixture 63041, `Opettajaopiskelijoiden ajatuksia tekoälystä`, now renders
as `Ohjattu opinnäyte` with `/opinnaytteet/63041/` as its primary destination;
its OuluREPO handle remains a separate source action. The OKM item renders as
`Asiantuntijarooli` and links first to its internal media detail page while
retaining `mediaType: pressRelease` in canonical data.

Focused unit coverage passed 79/79, including new advised/reviewed collection
adapter invariants. Related-content, thesis detail, archive-row, and thesis
metadata tests passed 61/61. `git diff --check` passed.

The full unit suite was also reconciled against a clean worktree at the
baseline SHA. With the same isolated baseline cache root, both main and this
branch have eight unrelated failures: two Presentation expectation drifts and
six tests that require a generated Pagefind index. The current dirty worktree's
fresh Research.fi cache can additionally make the memoization test observe zero
network starts; that environment-only failure disappears with the isolated
baseline cache and is not caused by this change.

## Boundaries

This is a narrow R1 projection regression, not a Canonical Content v1 failure:
the canonical thesis detail records and external source semantics were already
correct. Canonical Content v1, Pagefind, public JSON, source/landing semantics,
and AC1 remain unchanged.

Merge commit: `0cf2a72be909aefd57c1318dccbf9f8b160f51e0`

CONTENT-ROLE-PROJECTION-01 = CLOSED / GREEN / MAIN
AC1 = CLOSED / GREEN

# presentations-local-detail-curation — schema (2026-09-12)

Documents the shape of
`docs/data/presentations-local-detail-curation-f3c-p2-accepted-decisions.json`
after the OPETUS-ESITYKSET-DUPLICATES-01 workstream introduced supersede
metadata. Consumed by `applyAcceptedPresentationCuration` in
`src/_data/presentationsPage.js`.

## File shape

Top-level object keyed by `caseId` (e.g. `"P2-01"`, `"P2-22"`). Each value
is one curation decision record.

```json
{
  "P2-22": {
    "detailUrl": "/presentations/…/",
    "humanDecision": "IS_DISTINCT_LOCAL_PRESENTATION",
    "humanCanonicalId": "",
    "humanNotes": "…",
    "supersededBy": "MATCHES_EXISTING_CANONICAL",
    "supersededByCanonicalId": "DAG29zybS5g",
    "supersededAt": "2026-09-12",
    "supersededReason": "…"
  }
}
```

## Fields

### Original decision (audit-frozen)

| Field | Required | Purpose |
| --- | :---: | --- |
| `detailUrl` | yes | Local `/presentations/{slug}/` this decision applies to. Must resolve to a `src/presentations/*.md` file. |
| `humanDecision` | yes | Original human verdict. One of `VALID_HUMAN_DECISIONS` (see below). **Never overwrite in place.** Prefer supersede fields when the verdict changes. |
| `humanCanonicalId` | yes for MATCHES/ALTERNATE | Original target canonical identifier. Empty string when not applicable. |
| `humanNotes` | recommended | Free-form audit trail from the reviewer. |

### Supersede metadata (added when a decision becomes stale)

The supersede fields form one audit-trail set. If ANY of them is
present, `supersededBy`, `supersededAt` and `supersededReason` are
required — `resolveEffectiveDecision` throws in the build when any of
those three is missing. `supersededByCanonicalId` is required only
when the resulting effective decision is `MATCHES_EXISTING_CANONICAL`
or `ALTERNATE_REPRESENTATION` (those branches look up a target
canonical by that id); when omitted for those decisions, it falls back
to `humanCanonicalId`, and if that is also empty the branch throws at
match time.

| Field | Required (when supersede is used) | Purpose |
| --- | :---: | --- |
| `supersededBy` | yes | New effective humanDecision value. Must be one of `VALID_HUMAN_DECISIONS` (silent fallback to the original `humanDecision` is intentionally NOT provided — an unknown supersede tag must fail the build). |
| `supersededAt` | yes | ISO date of the supersede action. |
| `supersededReason` | yes | Free-form explanation. Should reference the PR / workstream that made the original decision stale. |
| `supersededByCanonicalId` | only for MATCHES/ALTERNATE effective decisions | New target canonical identifier. Not validated by `resolveEffectiveDecision`; the MATCHES/ALTERNATE branches in `applyAcceptedPresentationCuration` require it to resolve to a real canonical item (falling back through `humanCanonicalId`). |

### Resolution semantics

`resolveEffectiveDecision(caseId, decision)` returns
`{ effectiveDecision, effectiveCanonicalId }` used by
`applyAcceptedPresentationCuration`:

1. If none of the supersede-* fields is present → the original
   `humanDecision` / `humanCanonicalId` are effective.
2. If any supersede-* field is present:
   - `supersededBy`, `supersededAt`, `supersededReason` must all be
     non-empty. Otherwise the build fails.
   - `supersededBy` must be in `VALID_HUMAN_DECISIONS`. Otherwise the
     build fails.
   - `effectiveDecision = decision.supersededBy`.
   - `effectiveCanonicalId = decision.supersededByCanonicalId || decision.humanCanonicalId || ""`.

Partial audit trail is treated as WORSE than no supersede — the build
must halt so the reviewer notices the incomplete change.

## `VALID_HUMAN_DECISIONS`

Defined in `src/_data/presentationsPage.js` as the single source of
truth. Add new values there first, then reference them in this
document.

```text
MATCHES_EXISTING_CANONICAL       — local .md becomes the local landing of an existing canonical item
ALTERNATE_REPRESENTATION         — local .md is a related but distinct rendering; adds a representation to an existing canonical
IS_DISTINCT_LOCAL_PRESENTATION   — local .md is its own canonical (pushes a new item)
CANNOT_DETERMINE                 — reviewer unable to decide; no-op
UNDECIDED                        — placeholder; no-op
```

## Change protocol

When you need to change the effective verdict for an existing decision:

1. Do NOT edit `humanDecision` / `humanCanonicalId` / `humanNotes`.
   Those record what a human decided at a specific point in time.
2. Add `supersededBy`, `supersededAt` and `supersededReason` to the
   same record. Add `supersededByCanonicalId` too when the new
   effective decision is `MATCHES_EXISTING_CANONICAL` or
   `ALTERNATE_REPRESENTATION`; otherwise it can be omitted.
3. `supersededReason` must state (a) what changed in the repo, (b)
   when (PR # + merge date preferred), (c) why the previous verdict is
   no longer correct.
4. Run the build. `resolveEffectiveDecision` will validate the audit
   trail. If it throws, complete the set before commit.

Never delete a supersede-* field once added: chaining a superseded
decision itself is out of scope for the current schema (would need
`supersededBy` → array-of-history migration).

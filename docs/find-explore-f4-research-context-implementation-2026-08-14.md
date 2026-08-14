# F4 Research Contextual Find & Explore

Date: 2026-08-14

## Summary

F4 starts with the Research page only. The implementation adds one contextual Find & Explore surface to `/tutkimus/` and one homepage entry link to that surface.

This is intentionally a partial F4 implementation:

- Research uses publications, theses, and writings only.
- Homepage remains an orientation page and does not embed Find & Explore.
- Presentations and media remain out of scope.
- No new canonical master dataset or JSON endpoint was created.
- Existing writings, theses, and publications archive Find & Explore paths remain in place.

## Architecture

```text
Pagefind documents
  FindExplore:publications
  FindExplore:theses
  FindExplore:writings
        ↓
shared find-explore.js
        ↓
researchContext mount
        ↓
/tutkimus/#tutkimusnaytto
```

The shared runtime now supports a contextual mount that searches multiple existing `FindExplore` scopes. Scope-specific Pagefind filters are still used per content type, so F4 does not invent a parallel data model.

## User-Facing Behavior

- `/tutkimus/` gains a compact contextual discovery section for research evidence.
- Users can search across publications, theses, and writings from one research page surface.
- Users can narrow by content type, year, and a small set of research topic presets.
- `/` gains a single route button to `/tutkimus/#tutkimusnaytto`.

## Out Of Scope

- No F3C presentations migration.
- No F3D media migration.
- No politics discovery.
- No taxonomy redesign.
- No Pagefind metadata rewrite.
- No new JSON-first endpoint.
- No homepage global search.

## Validation

- `npm run build:no-og` passed.
- `npm run test:unit` passed: 389/389.
- `node scripts/audit-writings-built-output.js` passed.
- `node scripts/audit-theses-built-output.js` passed.
- `node scripts/audit-publications-f3b-built-output.js` passed.
- `PLAYWRIGHT_USE_STATIC_SERVER=true DISABLE_OG_IMAGES=true npx playwright test tests/f4-research-find-explore.spec.js` passed: 2/2.

## Notes

The first sandboxed build attempt failed with `ENOTFOUND registry.npmjs.org`; rerunning with network access exposed missing worktree dependencies, which were resolved with `npm ci`.

`npm ci` reported four high-severity dependency audit findings. They are pre-existing dependency-maintenance work and were not changed in this F4 checkpoint.

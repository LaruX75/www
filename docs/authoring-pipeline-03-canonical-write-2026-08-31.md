# AUTHORING-PIPELINE-03 — Safe Canonical Write

Date: 2026-08-31
Status: `PROTOTYPE PROVEN / AUTHOR-TIME ONLY / TESTS GREEN`

Adds only the write boundary. Reuses AP-01 + AP-02 infrastructure
end-to-end. No SvelteKit, no HTTP server, no database, no Git
automation, no parallel content model, no second renderer.

## Repository baseline

- Base SHA: `29fb07c5afa63815ded2c0badb89974d76e0b8b5` (post AP-01 PR #178 + AP-02 PR #179 merges).
- Branch: `prototype/authoring-pipeline-03-canonical-write`.
- HEAD after AP-03 implementation (pre-commit): tracked mods to `scripts/author-preview.js` + `scripts/_lib/authoring/eleventyPreview.js`; new files `scripts/_lib/authoring/canonicalWriter.js`, `tests/unit/authoringPipelineCanonicalWrite.test.js`, this doc.
- `.cache/api-fallback/*` preserved (per project convention).

## Presentations write authority

- **Canonical source of truth**: Markdown files in `src/presentations/*.md` with YAML frontmatter.
- **Identity / URL authority**: existing `src/_data/presentationSources.js` convention — `pageUrl = /presentations/{slug}/` where `slug = path.basename(filePath, ".md")`. The writer does NOT re-implement this.
- **Serializer**: **existing** `toFrontMatterMarkdown(frontMatter, body)` in `scripts/_lib/authoring/eleventyPreview.js` (added export in AP-03). This is the SAME serializer that feeds the preview → serialize-once parity by construction. AP-03 did not write a second serializer.
- **Destination**: `src/presentations/{slug}.md`, resolved through `resolvePresentationDestination({ slug, root })` which asserts the resolved path stays inside the approved Presentations root.
- **Duplicate/overwrite detection**: reuses AP-01's `findExistingPresentationBySourceUrl()` (checks canonical `sourceUrl` / `url` for a matching Presentation) *before* the writer is invoked; writer additionally refuses to overwrite an existing destination file as a defense-in-depth guarantee.
- **Validation**: reuses `validateCollectionItem({ collectionName: "presentations", strictSemanticChecks: true })` from `src/_utils/canonicalContentValidation.js` — same rules production enforces.

## Publications write decision

**`NOT SUPPORTED`**

Evidence: `docs/authoring-pipeline-02-doi-publications-2026-08-31.md` documents the Publication data flow as:

```
Research.fi + researchfiContent
  → buildCanonicalPublicationCandidates()
  → buildCanonicalPublicationDetailsModel()
  → src/julkaisut/researchfi-details.njk
```

Publications on this site have no local Markdown authority for the scientific-publication class. AP-03 respects that boundary: `assertPublicationWriteUnsupported({ domain })` throws with an explicit reason, and the CLI's DOI path prints the message and exits non-zero when `--write` is combined with a DOI/Publication draft. AP-03 does not:

- create a parallel Publication Markdown store,
- generate DOI-derived canonical IDs,
- persist Crossref responses as canonical data,
- add an authoring JSON store for scientific Publications.

`src/publications/*.md` contains puhe / mielipide / kolumni / lausunto content that is authored manually; it is out of scope for AP-03's write path (AP-03 only covers the AP-01 Presentation path).

## Pipeline

```
YouTube URL
  ↓                          (AP-01: youtubeMetadata.js)
metadata proposal
  ↓                          (AP-01: presentationDraft.js)
canonical Presentation draft (title / date / sourceUrl / thumbnail /
                              source / type / permalink / layout / body)
  ↓                          (editorial input required)
--type esitys --contexts business,teaching --slug ...
  ↓                          (AP-01: canonicalContentValidation)
canonical validation
  ↓                          (AP-01: eleventyPreview.renderPresentationPreview)
Eleventy programmatic preview
  ↓                          (human review of preview HTML)
--write given?
  ├── NO  → dry-run message. No canonical file modified. Exit 0.
  └── YES → AP-03 write path (below)

AP-03 write path (Presentation only):
  ↓                          (AP-03: assertSafeSlug + resolvePresentationDestination)
destination resolved inside src/presentations/
  ↓
duplicate check                (AP-01 duplicate check ran upstream; writer
                                double-checks destination existence)
  ↓
pickCanonicalFrontMatter       (drops any authoring-diagnostic fields)
  ↓
serializePresentationDraft     (toFrontMatterMarkdown — same as preview)
  ↓
pre-write validation           (validateCollectionItem strict = true)
  ↓
explicit-contexts guard        (defense in depth — validator already blocks
                                inference-only contexts via
                                validateStrictPresentationSemantics)
  ↓
writeAtomic                    (write to `.${basename}.tmp-{pid}-{ts}`,
                                second-chance existence check, rename)
  ↓
roundTripValidatePresentation  (re-read from disk, gray-matter parse,
                                validateCollectionItem strict = true)
  ↓
canonical file exists           (round-trip PASS = serializer parity proven)
```

## Reuse

**Existing repo components reused (nothing duplicated)**:

| Component | Source (AP-01/AP-02) | Reused for AP-03 |
| --- | --- | --- |
| Draft shape `{ slug, pageUrl, frontMatter, body }` | `scripts/_lib/authoring/presentationDraft.js` — `buildPresentationDraft()` | Fed directly to writer. |
| Frontmatter serializer | `scripts/_lib/authoring/eleventyPreview.js` — `toFrontMatterMarkdown()` | AP-03 exports it; writer imports it. Same bytes preview validated. |
| Duplicate detection by source URL | `scripts/_lib/authoring/presentationDraft.js` — `findExistingPresentationBySourceUrl()` | CLI runs it upstream; writer double-checks destination file existence. |
| Canonical validation | `src/_utils/canonicalContentValidation.js` — `validateCollectionItem()` | AP-03 runs it pre-write on the serialized payload AND post-write on the on-disk file. |
| Strict presentation semantics | `validateStrictPresentationSemantics()` — same file | Fires the `kontekstia ei saa arvata` check via `strictSemanticChecks: true`. |
| Slug utility | `src/_data/metadata-normalization.js` — `slugifyTerm()` | Draft builder uses it; writer does NOT re-slugify (avoids double-transform). |
| Presentations root | `src/presentations/` (constant `PRESENTATIONS_DIR` in AP-01 module + repeated in writer with `path.resolve` for defense in depth) | Destination anchor. |
| CLI arg parser + reporting | `scripts/author-preview.js` | Extended with `--write` flag and BLOCKED-reason output. |
| Authoring temp filename pattern `zz-authoring-preview-*` recognition | `scripts/_lib/authoring/presentationDraft.js` — `AUTHORING_TEMP_PATTERN` | Not touched — writer produces real canonical filenames, not temp-prefixed ones. |

**New components added by AP-03**:

- `scripts/_lib/authoring/canonicalWriter.js` (~230 LOC): `assertPublicationWriteUnsupported`, `assertSafeSlug`, `resolvePresentationDestination`, `pickCanonicalFrontMatter`, `serializePresentationDraft`, `writeAtomic`, `roundTripValidatePresentation`, `writePresentationCanonical`, `PRESENTATION_CANONICAL_FIELDS` allowlist.
- `tests/unit/authoringPipelineCanonicalWrite.test.js` (~220 LOC, 12 cases).
- One-line export addition in `scripts/_lib/authoring/eleventyPreview.js` (`toFrontMatterMarkdown` added to `module.exports`).
- CLI extensions in `scripts/author-preview.js` (`--write` flag; canonical-write output block for Presentations; NOT-SUPPORTED output block for Publications).

## Dry-run contract

- **Default is dry-run.** Without `--write`, the CLI emits a final line:
  ```
  Canonical write: DRY RUN (no --write given). No canonical file modified.
  ```
- No canonical file changes without an explicit `--write` flag.
- No commit. No PR. No push. No branch creation from the CLI. (Explicitly out of scope for AP-03 per §22.)

## Overwrite protection

- If AP-01's upstream duplicate detection finds an existing canonical Presentation by source URL, the CLI blocks the write with:
  ```
  Canonical write:
  BLOCKED
  Reason: destination already exists (src/presentations/xxx.md).
  AP-03 does not overwrite existing canonical content.
  ```
- The writer's `writeAtomic` performs a second-chance existence check between temp write and rename (narrows TOCTOU window).
- No `--force` flag in AP-03. Editing existing canonical content belongs to a later slice.

## Path safety

`assertSafeSlug` rejects: empty slug, path separators (`/`, `\`), traversal segments (`..`), leading `.` or `-`, control characters, reserved characters (`< > : " | ? *`), and any slug not matching `^[a-z0-9][a-z0-9-]*$`.

`resolvePresentationDestination` uses `path.resolve` and asserts `path.dirname(destination) === presentationsRoot` — even a slug that slipped past the regex would fail this containment check.

## Atomicity

Sequence:

1. Serialize draft to bytes with `toFrontMatterMarkdown`.
2. Pre-write validation on the serialized payload (strict semantic checks + explicit-contexts guard).
3. `fs.mkdirSync(dirname, { recursive: true })`.
4. `fs.writeFileSync(tempPath, bytes, "utf8")` where `tempPath = .${basename}.tmp-{pid}-{ts}`.
5. Second-chance destination existence check.
6. `fs.renameSync(tempPath, destination)` — atomic on the same filesystem.
7. On any error: `fs.unlinkSync(tempPath)` (best-effort cleanup); destination untouched.

## Round-trip evidence

**The critical AP-03 correctness contract:** after atomic write, the on-disk file is re-read via `fs.readFileSync`, re-parsed via `gray-matter`, and re-validated via the shared `validateCollectionItem` with `strictSemanticChecks: true`. If serialization produced a byte shape that no longer round-trips through the canonical parser, this call throws and the write is reported as failure — the file remains on disk for inspection (test cleanup handles removal).

Test evidence:

- `round-trip: written file re-parses cleanly and passes shared validation` — PASS (12/12 AP-03 tests).
- `serializer produces stable bytes for a stable draft (parity anchor)` — PASS (deterministic serializer).

The written bytes come from the same `toFrontMatterMarkdown` the preview already exercised, so the on-disk representation is bit-for-bit compatible with the canonical parser used by production.

## Duplication / deletion audit

Before implementing, greped for every capability the writer needs. Every existing implementation was reused; nothing was duplicated:

- **Slug/path resolution**: reused `src/_data/presentationSources.js` convention + AP-01 draft builder's slug. No parallel slug logic.
- **Frontmatter serialization**: reused `toFrontMatterMarkdown` — added one line to export it. No parallel serializer.
- **Markdown reading/parsing**: reused `gray-matter` (already in AP-01). No parallel reader.
- **Duplicate detection**: reused AP-01's `findExistingPresentationBySourceUrl`. Writer only performs destination file-existence check as defense in depth (single `fs.existsSync`; not a duplicate scanner).
- **Canonical validation**: reused `validateCollectionItem` — no parallel schema.
- **Temp-file/atomic-write utility**: no existing helper found; implemented the smallest deterministic pattern (temp + rename + cleanup). Not a generic utility.

Deletion opportunity check: nothing existing became obsolete. AP-03 is purely additive.

## Tests

- **`tests/unit/authoringPipelineCanonicalWrite.test.js`** — **12 pass / 0 fail** on branch head:
  - `assertSafeSlug` rejects traversal + separators.
  - `assertSafeSlug` accepts realistic canonical slugs.
  - `resolvePresentationDestination` stays inside root.
  - `assertPublicationWriteUnsupported` rejects `publications` / `doi` domains.
  - `pickCanonicalFrontMatter` drops non-canonical / diagnostic fields.
  - Valid Presentation write produces expected canonical shape.
  - Reviewed values preserved verbatim.
  - Provider / diagnostic leakage absent from written file.
  - Existing destination BLOCKED (no overwrite).
  - Missing required title BLOCKED (pre-write).
  - Missing explicit contexts BLOCKED (via shared strict semantic check).
  - Path traversal in slug BLOCKED (nothing lands anywhere).
  - Round-trip: written file re-parses + re-validates cleanly.
  - Serializer produces stable, diagnostic-leak-free bytes.
- **`npm run test:unit`**: 675 pass / 1 fail. The one failing case is `researchfi loader shares one Promise across concurrent callers` in `tests/unit/buildDataLoaderMemoization.test.js` — a pre-existing timing-sensitive flake identified during HOME-LANDING-01 (see `docs/home-landing-01-canonical-latest-2026-08-30.md`) and independent of AP-03. Confirmed by inspection: AP-03 does not touch `src/_data/researchfi.js`, `publicationDetailPages.js`, or the memoization test.
- **AP-01 regression** (`tests/unit/authoringPipeline.test.js`): still passing in the aggregated suite.
- **AP-02 regression** (`tests/unit/authoringPipelinePublications.test.js`): still passing in the aggregated suite.
- **`git diff --check`**: clean (verified pre-commit).

## Safety live proof

- No permanent test content was added to the canonical `src/presentations/` tree.
- Every write test uses `fs.mkdtempSync(path.join(os.tmpdir(), "ap03-write-"))` and passes that as the writer's `root` argument. Deterministic `fs.rmSync(root, { recursive: true, force: true })` in `finally` blocks.
- No `_preview` output is committed; existing `.gitignore` already excludes `.tmp/authoring-preview/` (AP-01 baseline).
- `.cache/api-fallback/*` preserved throughout.

## UI-readiness conclusion

The write engine (`canonicalWriter.js`) is deliberately UI-agnostic:

- Pure functions, no CLI dependencies inside the writer module.
- Draft input matches the shape `presentationDraft.js` already returns.
- Test-injection via `root` argument means any UI (future Sveltia extension, future SvelteKit local admin per capability-audit roadmap item #8) can call `writePresentationCanonical(draft)` without change.

**No UI framework was added.** No SvelteKit. No Sveltia modification. No HTTP server. No API endpoint. No browser editor. Per §23.

## Relationship to Sveltia

Sveltia currently handles form-driven editing of *existing* MDs. Sveltia does NOT create-new-from-URL, does NOT validate against `strictSemanticChecks: true`, and does NOT invoke the canonical writer's contexts-required guard. AP-03 fills that gap for CLI users; a future Sveltia integration slice could optionally call the writer via a compatibility shim. That is NOT part of AP-03.

## SvelteKit boundary

SvelteKit remains **LATER (requires ADR)** per the capability audit. AP-03 explicitly does not introduce it. The writer being UI-agnostic keeps the SvelteKit option open without forcing it.

## Known limitations (bounded to this slice)

1. **No `--force`.** Editing existing canonical Presentations is out of scope.
2. **No Publication write path.** By design — Publication authority is Research.fi.
3. **No Git integration.** Committing / branching / opening a PR are out of scope.
4. **No batch import.** One URL at a time. Batch is not needed for the prototype.
5. **No `--interactive` mode.** Missing values must be supplied on the command line (`--slug`, `--contexts`, `--type`).
6. **No rollback across multiple writes.** Each write is independently atomic; there's no multi-file transaction.

None of these are blockers for the prototype outcome; each is a well-scoped future increment.

## Architecture

- **`AUTHORING-PIPELINE-01 is PROVEN / MERGED / MAINTENANCE.`**
- **`AUTHORING-PIPELINE-02 is PROVEN / MERGED / MAINTENANCE.`**
- **`AUTHORING-PIPELINE-03 adds only bounded canonical write capability.`**
- **`Canonical content remains the source of truth.`**
- **`External metadata remains proposal/evidence.`**
- **`Eleventy/Nunjucks remains the rendering authority.`**
- **`No shadow content store was introduced.`**
- **`No parallel schema, identity model, or renderer was introduced.`**
- **`Scientific Publication write semantics were not invented.`**
- **`Pagefind remains untouched.`**
- **`SvelteKit was not introduced.`**
- **`Architecture Closure 1.0 remains CLOSED / GREEN / MAIN.`**

## Recommendation

**`AUTHORING-PIPELINE-03 PROVEN — ready for PR/CI`**

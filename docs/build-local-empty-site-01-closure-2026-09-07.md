# BUILD-LOCAL-EMPTY-SITE-01 closure

## Baseline

- Baseline `main`: `a2a7301ebd0cefc061d4b4dcd011ed38f9e74473`
- Audit branch: `fix/build-local-empty-site-01`
- Scope: local build-output integrity only. No production architecture or content changes.

## Reproduction and root cause

The reported symptom was an apparently successful `npm run build:local` followed by
an empty `_site/` directory and static-server 404 responses.

Two clean attempts initially showed an empty `_site/` when inspected while the
Eleventy subprocess was still running. A directly observed clean Eleventy run then
completed with exit code 0 after 251.69 seconds and wrote 1,481 files. A second
full `npm run build:local` run completed with exit code 0 after 234.80 seconds for
Eleventy, followed by a successful Research.fi integrity check.

The cause is therefore verification timing, not output deletion: this repository's
offline local build has a long quiet render phase. Checking `_site/` before the
build command has actually exited can observe an empty or incomplete output tree.
There was no evidence that a lifecycle hook, postbuild action, concurrent process,
or Playwright static-server configuration deletes `_site/`.

## Build evidence

After the completed full local build:

- `_site/` contained 1,756 files and was 185 MB.
- `_site/index.html` existed.
- `_site/esitykset/index.html` existed.
- `_site/presentations/opettaja-teko-lyn-ja-lytt-myyden-turbulenssissa-tampere-2025/index.html` existed.
- `_site/opetus/index.html` existed.
- `check:researchfi-integrity` passed.

`PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/presentations-source-ssr.spec.js tests/detail-hero-ux-02.spec.js --reporter=list` passed 17/17 tests. The static server returned 200 for the requested SSR routes. Local `build:local` deliberately does not run Pagefind, so Pagefind asset 404s in that smoke log are expected and unrelated to SSR output integrity.

## Decision

No build-code change or output-integrity guard was added. A guard would run only
after Eleventy exits and would not prevent a caller from inspecting output before
the long-running build has finished. The safe operating rule is to wait for the
actual command exit code before reading `_site/` or starting static-server tests.

No redundant cleanup step was removed because the audit found no duplicate output
cleanup or deletion race. Production is unaffected: production builds run their
normal lifecycle independently, and this issue was limited to local verification
being observed before completion.

## Architecture status

- Canonical Content v1: unchanged.
- Pagefind architecture: unchanged.
- Public JSON, SSR ownership, runtime JS, routes, and content semantics: unchanged.
- AC1: CLOSED.

# PAGEFIND-BLOG-LIST-01 — convergence report

Date: 2026-09-01
Branch: `cleanup/pagefind-blog-list-01`
Base / origin: `ef401d3d0f6b6d2216094640f63d154675e3515c`

## Before

```text
canonical blog content
→ Nunjucks renders 15 opening rows
→ browser fetches /data/content.json
→ browser fetches /data/taxonomy-index.json
→ browser filters / sorts / paginates
→ browser rebuilds archive row HTML
```

Baseline evidence from `origin/main`:

- `collections.blog | sort(...) | take(15)`
- inline runtime `loadJson('/data/content.json')`
- inline runtime `loadJson('/data/taxonomy-index.json')`
- `renderRow(post)` + `tbody.innerHTML = slice.map(renderRow).join('')`

## After

```text
canonical blog content
→ Nunjucks renders all canonical blog rows
→ Pagefind provides lazy blog discovery
→ browser JS controls only query / sort / pagination / visibility
→ browser does not rebuild canonical row HTML
```

- `src/_includes/blog-list.njk` now renders all `collections.blog` rows server-side.
- `src/js/blog-list.js` owns progressive enhancement only.
- `/data/content.json` and `/data/taxonomy-index.json` remain built and public, but the blog archive no longer consumes them at runtime.

## SSR completeness

- Canonical blog count: `80`
- FI archive SSR rows: `80`
- EN archive SSR rows: `80`
- Canonical href parity: `80/80` `data-blog-url` rows on both pages
- No-JS behavior now exposes the full archive instead of only the newest 15 rows.

## Pagefind role

- Blog scope filter: `Writings content type = blogPost`
- Startup remains lazy: no Pagefind requests before interaction
- First real search loads `/pagefind/*` assets only
- Result-to-row identity uses canonical URL projection (`data-blog-url`)
- Archive list/latest sections are wrapped with `data-pagefind-ignore` to avoid self-index duplication

## EN / FI

- `src/blog/blog.11tydata.js` keeps canonical blog detail pages in the Finnish blog collection
- `/en/blog/` is a structured English archive projection over the same canonical blog rows
- Blog archive Pagefind search therefore targets the canonical Finnish blog partition so EN and FI archive rows stay in parity

## Legacy writings metadata fix

Some blog detail pages still carry legacy frontmatter such as `type: artikkeli`, which previously prevented them from receiving the current writings/blog Pagefind projection. `src/src.11tydata.js` now adds a narrow fallback Pagefind writings record for canonical `src/blog/*` pages so blog archive discovery matches the rendered row set without changing public JSON or canonical content semantics.

## Deleted runtime

- blog-list runtime fetch of `/data/content.json`
- blog-list runtime fetch of `/data/taxonomy-index.json`
- client-side canonical record normalization for blog rows
- client-side taxonomy badge formatter
- client-side row HTML string builder
- `tbody.innerHTML`-based canonical row reconstruction
- large inline script from `blog-list.njk`

## Network / HTML tradeoff

- Removed runtime JSON payload from this surface: `655236` bytes total
  - `/data/content.json`: `622720` bytes
  - `/data/taxonomy-index.json`: `32516` bytes
- Current FI archive HTML: `341742` bytes
- Current EN archive HTML: `334424` bytes
- Current enhancement JS: `10967` bytes (`340` LOC)

Tradeoff:

- More SSR HTML and DOM up front
- No duplicate browser content model
- No runtime JSON fetches for archive rendering
- Better no-JS completeness
- Taxonomy linking stays server-owned in Nunjucks

## Tests

- `git diff --check` PASS
- `npm run test:unit` PASS (`688` tests)
- `npm run build:local:full` PASS
- `npm run check:i18n-seo` PASS
- `npm run check:researchfi-integrity` PASS during build
- `PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/pagefind-blog-list.spec.js` PASS (`3/3`)
- `PLAYWRIGHT_USE_STATIC_SERVER=true PLAYWRIGHT_A11Y_OFFLINE=true DISABLE_OG_IMAGES=true npx playwright test tests/accessibility.spec.js tests/navigation.spec.js tests/contrast.spec.js`
  - full run: `31/32` pass, one known navbar search dialog failure under parallel local load
  - isolated rerun of `Search dialog returns Pagefind results for a known Finnish term`: PASS
- `npm run check:jsonld`
  - unchanged pre-existing failure: `html-entity-leak` in `presentations/ss-koe-oppimisymparistona-osa-i/index.html`

## Architecture

Canonical blog content remains authoritative.

Nunjucks is the sole canonical archive-row renderer.

Pagefind provides discovery only.

JavaScript no longer constructs a parallel blog content model.

Public JSON projections remain intact.

PF5 remains `CLOSED / MAINTENANCE`.

Architecture Closure 1.0 remains `CLOSED / GREEN / MAIN`.

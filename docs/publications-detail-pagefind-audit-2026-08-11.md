## Publications P4c Audit - Detail Pages and Pagefind

Date: 2026-08-11

## Scope

This checkpoint audits what changed in Pagefind after Research.fi publications gained canonical HTML detail pages.

The goal was to answer four questions before changing any indexing behavior:

1. Does a Research.fi publication now exist as its own Pagefind document?
2. Does search resolve to the canonical detail URL?
3. How much do archive, category, keyword, and theme pages still compete with the same publication?
4. Is any `data-pagefind-ignore` change actually needed?

No UI or Pagefind template behavior was changed in this checkpoint.

## Commands run

```bash
CACHE_ONLY=true DISABLE_OG_IMAGES=true npx @11ty/eleventy --quiet
DISABLE_OG_IMAGES=true node scripts/run-pagefind.js
node scripts/audit-publication-pagefind.js
```

Build + index status:

- Eleventy build succeeded: `Copied 266 Wrote 1285 files in 10.63 seconds`
- Pagefind indexing succeeded:
  - `Indexed 1266 pages`
  - `Indexed 42597 words`
  - `Indexed 2 languages`

## Audit method

The new audit script [scripts/audit-publication-pagefind.js](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/scripts/audit-publication-pagefind.js) evaluates 8 Research.fi publications from [_site/data/publications-page.json](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/_site/data/publications-page.json).

Each publication is tested with two query modes:

1. `exactTitleQuery`
   - quoted full title, e.g. `"Computational thinking in collaborative programming discourse: an epistemic network analysis"`
2. `plainTitleQuery`
   - normalized full-title text without punctuation weighting

For each query, the audit records:

- whether the detail page is found
- the detail page rank
- whether the detail page is rank 1
- how many aggregate pages appear in top results
- whether aggregate pages appear ahead of the detail page

Aggregate result classes used in the audit:

- `/julkaisut/`
- `/kategoriat/...`
- `/avainsanat/...`
- `/teemat/...`
- English archive/legacy routes when present

## Findings

### 1. Research.fi publications are now real Pagefind documents

This is green.

Sample detail URLs found by the audit include:

- [/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/_site/julkaisut/rf-a1-10-1016-j-caeo-2026-100396/index.html)
- [/julkaisut/02254916YJ/](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/_site/julkaisut/02254916YJ/index.html)
- [/julkaisut/0707476326/](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/_site/julkaisut/0707476326/index.html)
- [/julkaisut/0699440925/](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/_site/julkaisut/0699440925/index.html)

This means the P4b detail architecture is genuinely visible to Pagefind.

### 2. Plain full-title searches already prefer the detail page

This is the strongest result of the audit.

`plainTitleAudit` summary:

- sample size: 8
- detail found: 8/8
- detail rank 1: 8/8
- detail top 3: 8/8
- aggregate pages still present in results: 8/8
- aggregate pages ahead of detail: 0/8

Meaning:

- for realistic full-title searches without quote-sensitive punctuation behavior,
  the canonical detail page already acts as the primary search document
- aggregate pages still exist in the result set, but they no longer outrank the publication page

### 3. Exact quoted title searches are still aggregate-heavy

`exactTitleAudit` summary:

- sample size: 8
- detail found: 6/8
- detail rank 1: 1/8
- detail top 3: 1/8
- aggregate competition in top results: 7/8
- aggregate pages ahead of detail: 7/8

Examples:

- `Assessing Digital Competence of K1-12 Teachers in Kosovo...`
  - detail page exists
  - detail rank: 7
  - FI categories, keywords, and `/julkaisut/` all appear ahead of it
- `Computational thinking in collaborative programming discourse...`
  - detail page exists
  - detail rank: 8
  - categories, keywords, and `/julkaisut/` all appear ahead
- `Co-constructing adaptive lesson plans with GenAI...`
  - detail page did not appear in top 10 quoted results
  - plain full-title search still returned the correct detail page at rank 1
- `The antecedents of pre-service teachers' AI literacy...`
  - detail page did not appear in top 10 quoted results
  - plain full-title search still returned the correct detail page at rank 1

Meaning:

- exact phrase matching is still sensitive to duplicated long citation text across aggregate pages
- this is a search-quality issue, not a missing-detail-page issue

### 4. The current competition comes mostly from FI taxonomy and archive pages

The dominant competing documents were:

- `/kategoriat/...`
- `/avainsanat/...`
- `/teemat/...`
- `/julkaisut/`

Notably:

- `/en/scientific-publications/` did not appear in this FI audit sample
- EN legacy competition count in the sample was `0`

So the immediate competition problem is not primarily the EN legacy route in actual FI search results. It is repeated publication text in Finnish aggregate/discovery pages.

### 5. A `/julkaisut/`-only ignore would be too narrow

The audit makes this clear.

If Pagefind tuning is needed later, the target should not only be the main archive page, because many searches are dominated by:

- category pages
- keyword pages
- theme pages

Those pages repeat publication citations and titles extensively, which is exactly what competes with the detail page.

## Interpretation

P4c produced a more nuanced result than "detail pages good" or "Pagefind broken".

What is already true:

- one publication now has one canonical HTML detail page
- Pagefind indexes those detail pages correctly
- normal full-title searches already resolve to the detail page first

What is not yet ideal:

- quoted exact-title searches still surface duplicated aggregate documents first
- repeated citation-heavy taxonomy/archive content still competes heavily in the result set

## Recommended next step

No urgent Pagefind change is required if the acceptance rule is:

`one publication = one primary result for normal publication-title searches`

That condition is already met in the audit sample.

If you want stricter search quality for exact phrase searches, the smallest sensible next move would be:

1. identify the shared repeated publication-citation blocks on aggregate pages
2. add the narrowest possible `data-pagefind-ignore` around repeated row/citation text
3. keep archive intros, KPI text, and navigation indexable
4. rerun `scripts/audit-publication-pagefind.js`

I would not start by fully hiding `/julkaisut/` from Pagefind, because the real duplication source is wider than that one page.

## P4c gate status

P4c audit result: mostly green, with one optional hardening follow-up.

Green:

- detail pages exist as first-class Pagefind documents
- canonical detail URLs are discoverable
- plain publication-title searches prefer the detail page

Still open if stricter search tuning is desired:

- reduce duplicated publication text weight on aggregate/taxonomy pages for quoted exact-title searches

## Bottom line

The new publication detail architecture already solved the main structural Pagefind problem.

The remaining issue is no longer "Research.fi publications lack their own search document."

It is now:

`Should duplicated publication text on archive/taxonomy pages be de-weighted for stricter exact-title search behavior?`

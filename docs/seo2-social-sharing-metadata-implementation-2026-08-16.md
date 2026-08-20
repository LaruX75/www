SEO2 SOCIAL SHARING METADATA = GREEN / READY FOR REVIEW

# 1. Status

SEO2 was implemented as a focused metadata-layer improvement for social sharing previews. The change stays inside the existing Eleventy metadata architecture and does not alter Pagefind, Find & Explore, starter chips, Research semantics, contexts, or result presentation logic.

# 2. Repository state

Worktree: `/private/tmp/www-seo2-social-sharing-metadata`

Branch: `codex/seo2-social-sharing-metadata`

Base before implementation: `origin/main` at `d2b8d8e94ac8ab25b21255f4798f72c5bb0070dd`

Implementation scope was kept source-only. Unrelated cache churn and prior F3C artifacts were excluded from the intended commit scope.

# 3. UXSEO1 basis

SEO2 follows the UXSEO1 conclusion that the site already had a functioning centralized metadata layer and did not need a rewrite.

UXSEO1 issues addressed here:

- existing content thumbnails were underused for social sharing
- `og:image:alt` and `twitter:image:alt` were too generic
- social title length was tied too tightly to strict HTML SEO truncation
- some descriptions were valid but not optimally shareable
- `twitter:site` and `twitter:creator` required an explicit decision

Before:

- centralized metadata existed
- generated branded OG images covered the site safely
- social image alt was effectively constant and too generic
- OG/Twitter titles reused the stricter HTML title truncation path
- social descriptions did not always prefer the richest authoritative summary field
- Twitter attribution handles were absent

After:

- trustworthy existing thumbnails are used where safe
- fallback branded OG generation remains intact
- social image alt is contextual and language-aware
- social title handling is separated from strict HTML title truncation
- social descriptions prefer authoritative summary fields when present
- Twitter attribution remains intentionally absent because no authoritative handle is defined in repository data

# 4. Scope

Implemented files:

- `eleventy.filters.js`
- `src/_includes/base.njk`
- `src/_includes/_meta.njk`
- `scripts/audit-seo2-social-sharing-metadata.js`

Added outputs:

- `docs/data/seo2-social-sharing-metadata-audit-2026-08-16.json`
- this implementation report

# 5. Explicit Pagefind boundary

SEO2 does not modify Pagefind code, Pagefind metadata emission, Find & Explore behavior, starter chips, Research scopes, content contexts, `Sisältö:*` facets, result cards, or archive card layout.

Shared verification scripts were run only as regression gates. Their green status is evidence that SEO2 did not introduce discovery regressions.

# 6. Metadata architecture preserved

The existing architecture remains intact:

- `base.njk` computes metadata inputs
- `_meta.njk` emits HTML title, description, canonical, hreflang, Open Graph, and Twitter tags
- generated branded OG cards remain the fallback path

SEO2 improves selection and formatting inside this structure rather than introducing a new metadata model.

# 7. Image selection strategy

Implemented priority order:

1. explicit `og_image`, `ogImage`, or `ogImageOverride`
2. trustworthy existing page thumbnail where already present
3. generated branded OG image fallback

Trustworthy thumbnail use is intentionally limited to content types that already expose meaningful visuals:

- presentations
- media
- writings with existing safe image-bearing subtypes such as blog posts, opinions, columns, speeches, statements, and initiatives

Publications and theses continue to use generated OG cards unless an explicit authoritative override exists.

# 8. Image alt strategy

`og:image:alt` and `twitter:image:alt` are now generated through a dedicated filter.

Behavior:

- explicit image alt fields are used when present
- page-specific images receive page-title-based alt text
- Finnish pages use Finnish wording
- English pages use English wording
- generated fallback uses a clearer site-level description than just `Jari Laru`

Examples:

- Finnish page-specific: `<Page title> - sivun jakokuva`
- English page-specific: `<Page title> - social sharing image`
- Finnish fallback: `Jari Laru - sivun jakokuva`
- English fallback: `Jari Laru - social sharing image`

# 9. Social title strategy

HTML `<title>` keeps the stricter existing SEO-oriented truncation path.

OG/Twitter titles now use a separate social-title filter with a looser budget and cleaner punctuation-aware trimming. This keeps browser/search title handling stable while producing more readable social previews on long content pages.

# 10. Social description strategy

Meta description handling remains intact for HTML SEO.

Social descriptions now prefer richer authoritative content when present, using this order:

- `socialDescription`
- `researchSummary`
- `richSummary`
- `abstract`
- existing description/source fallback path

Descriptions are then normalized and trimmed through a dedicated social-description filter with a larger budget than the strict SEO meta description path.

# 11. Twitter attribution decision

`twitter:site` and `twitter:creator` were reviewed and intentionally left unset.

Reason:

- no authoritative repository-level handle source was identified for safe emission
- adding guessed or inconsistent attribution would be worse than leaving the fields absent

# 12. Structured data notes

Structured data was not changed.

`src/_includes/_ldschema.njk` was reviewed, but SEO2 does not alter schema output. This keeps the change set focused on social sharing metadata only.

# 13. Representative rendered output checks

Representative built pages were audited across home, research, publication, thesis, writing, presentation, media, and English research pages.

Observed outcomes:

- home keeps branded fallback behavior with improved social alt
- research pages keep branded fallback and shorter social title than HTML title where useful
- publication pages keep generated OG fallback while gaining a less aggressively truncated social title
- thesis pages keep generated OG fallback while gaining richer social metadata
- writing/blog pages use safe page-specific thumbnails where available
- presentation pages use existing authoritative presentation thumbnails
- media pages use existing authoritative media thumbnails
- English pages emit English-language social alt text

# 14. Verification

Completed successfully:

- `npm run build:no-og`
- `npm run build`
- `npm run test:unit`
- `node scripts/audit-seo2-social-sharing-metadata.js`
- `node scripts/audit-pf-perf1-pagefind-startup.js`
- `node scripts/audit-pf4-result-card-hierarchy.js`
- `node scripts/audit-pf-starter-chips.js`
- `node scripts/audit-pf3-result-card-consistency.js`
- `node scripts/audit-pf2-sisalto-facet.js`
- `node scripts/audit-media-pagefind-m2.js`
- `node scripts/audit-f4-research-built-output.js`
- `node scripts/audit-presentation-pagefind.js`

Key results:

- SEO2 audit passed and wrote `docs/data/seo2-social-sharing-metadata-audit-2026-08-16.json`
- representative pages verified across Finnish and English output
- generated OG images remained available
- safe-topic metadata and Research discovery behavior were unchanged
- Research population remained `317`
- presentations in Research remained `33`
- media remained excluded from Research
- shared Pagefind audits remained green, indicating no discovery regression

# 15. Risks and rollback notes

Risk profile is low because the implementation:

- stays inside centralized metadata templates and filters
- preserves generated OG fallback behavior
- uses only already-available thumbnail data
- does not alter indexing, contexts, or search logic

Rollback is straightforward:

- revert the SEO2 source files
- rebuild the site

# 16. Explicitly out of scope

Out of scope for SEO2:

- Pagefind or Find & Explore behavior changes
- starter chip changes
- Research membership or context changes
- new thumbnail crawling or remote enrichment
- new image processing pipeline
- structured data redesign
- scroll-hint implementation
- UX2 work
- media-in-Research work

# 17. Recommended next step

After PR review, validate a few production URLs with platform preview debuggers such as LinkedIn Post Inspector and Facebook Sharing Debugger to confirm live card rendering matches the built output.

# Route Integrity 01B - taxonomy route lookup contract

Taxonomy metadata was able to construct category and keyword URLs from arbitrary
terms even when no archive page was rendered for that term. The rendered route
collections are now the authority: categories require `categoryList` and
keywords require `keywordList`. SSR preserves unavailable terms as text.

Progressively enhanced taxonomy archives fetch `/data/taxonomy-index.json` and
use its supplied `href` values only. If that index is unavailable, terms remain
plain text and no guessed route is emitted. The same contract now covers topic,
thesis and council-work surfaces. This does not change taxonomy thresholds,
content ownership, Pagefind, or AC1.

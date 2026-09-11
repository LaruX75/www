# Route Integrity 01B - taxonomy route lookup contract

Baseline: `ee4fb75c7ed80a8806e2fb74c8ab47794aea5e81`.

The root cause was taxonomy metadata constructing archive URLs for terms without
rendered archive routes. The existing `taxonomy-index.json` projection and the
same collection thresholds now govern SSR and enhanced archive views: indexed
terms use the projection's href; other terms remain visible plain text.

The original ROUTE-INTEGRITY-01 crawler implementation was not preserved, so
its historical 1,073 / 7,111 counts cannot be reproduced exactly. A new,
identical static crawler was run against clean main and this branch. It scans
generated HTML hrefs and checks local route or file existence; runtime DOM is
verified separately by Playwright.

Static comparison: main had 268,892 internal href occurrences, 1,072 unique
missing targets and 7,144 missing references. This branch has 268,382, 850 and
6,423 respectively: -222 targets and -721 references. Missing categories fell
from 23 / 82 references to zero; missing keywords from 224 / 450 to 27 / 41;
literal `_slugify` targets from 2 / 232 to zero. The remaining 27 FI keyword
targets are legacy alias/name forms whose rendered routes use distinct canonical
slugs, such as `microsoft-365` -> `microsoft-o365`; they are outside the changed
renderers. Unrelated remaining classes include the Pagefind stylesheet, seven
publication/detail routes and EN keyword-route projection.

The Tekoälylukutaito profile no longer links its four known absent category
routes and preserves those labels as text. Runtime renderers use the existing
taxonomy-index href map and degrade missing index entries to spans, rather than
guessing category or keyword URLs. Literal `_slugify` href leaks are zero in the
fresh build. This changes neither canonical content, Pagefind, public JSON
shape, contexts, thresholds, FI/EN semantics, nor AC1; AC1 remains CLOSED /
GREEN.

# Route Integrity 01A - Kaleva duplicate reconciliation

Baseline: `98b29380`. The 2018 Kaleva opinion had two active manual records. The curated Kaleva record remains the sole canonical owner. The old WordPress identity is now a redirect-only route with an explicit `legacyRedirectTo` target and a Unicode thin-space permalink, so percent-encoded browser requests decode to a generated static path. Redirects are `noindex, follow` with the canonical target and do not enter collections, sitemap, Pagefind, taxonomy, or JSON-LD as content. This narrowly restores the AC1 one-owner invariant.

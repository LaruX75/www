---
layout: page.njk
templateEngineOverride: md
title: Accessibility Statement
permalink: /en/accessibility/
translationKey: accessibility_statement
lang: en
---

# Accessibility Statement

**Website:** [www.jarilaru.fi](https://www.jarilaru.fi)
**Last tested:** 9 March 2026
**Conformance level:** WCAG 2.1 Level AA
**Status:** Conformant

---

## Summary

The website www.jarilaru.fi has been tested against the WCAG 2.1 AA criteria using automated tools. Testing covers all key pages. Based on the results, the site meets WCAG 2.1 Level AA requirements on all tested pages.

---

## Testing Methodology

Automated testing was performed using the following tools:

- **[axe-core](https://github.com/dequelabs/axe-core)** (Deque Systems) — WCAG 2.1 A and AA criteria checks
- **[Playwright](https://playwright.dev/)** — Headless Chromium browser environment for real rendering
- **[Pa11y](https://pa11y.org/)** (HTML_CodeSniffer) — Supplementary verification

Testing was run against a locally built static version served at `localhost`. JavaScript was executed fully before evaluation (`waitForTimeout: 1500ms`) to capture dynamically rendered content.

---

## Pages Tested

| Page | URL | Result |
|------|-----|--------|
| Home | `/` | ✓ Pass |
| Theses | `/opinnaytteet/` | ✓ Pass |
| Publications | `/julkaisut/` | ✓ Pass |
| CV | `/cv/` | ✓ Pass |
| Teaching Portfolio | `/portfolio/` | ✓ Pass |
| Presentations | `/esitykset/` | ✓ Pass |
| Politics | `/politiikka/` | ✓ Pass |
| Blog | `/blogi/` | ✓ Pass |
| Privacy Notice | `/tietosuojaseloste/` | ✓ Pass |
| CV (EN) | `/en/cv/` | ✓ Pass |
| Publications (EN) | `/en/publications/` | ✓ Pass |
| Presentations (EN) | `/en/presentations/` | ✓ Pass |

---

## Issues Found and Fixed

The following WCAG 2.1 AA issues were found and corrected during the audit:

| Criterion | Issue | Fix |
|-----------|-------|-----|
| 1.4.3 Contrast | `<code>` element contrast 4.47:1 (required 4.5:1) | Darkened code colour to `#b91c5e` (~6.6:1) |
| 1.4.3 Contrast | `.text-danger` colour contrast 4.18:1 | Darkened to `#b02a37` (~6.4:1) |
| 1.4.3 Contrast | Hero section button contrast insufficient | Switched to `btn-light`/`btn-outline-light` with explicit hex colours |
| 1.4.3 Contrast | Decorative numbers 01/02/03 at 15% opacity | Moved to CSS `::before` pseudo-element (`aria-hidden`) |
| 4.1.1 Parsing | Duplicate ID in privacy notice | Removed redundant `<a id>` anchor |
| 4.1.3 Status Messages | Thesis filter results not announced | Added `aria-live` region |
| 4.1.2 Name, Role, Value | Keyword filter buttons missing state | Added `aria-pressed` |
| 4.1.2 Name, Role, Value | Icon-only button in blog table | Added `aria-label` |
| 1.3.1 Info and Relationships | `aria-hidden` ticker clones contained focusable elements | Added `inert` attribute to clones |
| 2.1.1 Keyboard | Scrollable presentation slider not keyboard-accessible | Added `tabindex="0"` |
| 1.4.3 Contrast | Hero text with rgba opacity values | Replaced with solid opaque colour values |
| 1.1.1 Non-text Content | Decorative icons missing `aria-hidden` | Added `aria-hidden="true"` |

---

## Known Limitations

Automated testing covers approximately 30–40% of WCAG criteria. The following areas have **not been manually tested**:

- Screen reader testing (e.g. NVDA, VoiceOver, JAWS)
- Cognitive accessibility
- Full keyboard navigation flow
- Individual blog posts and other content pages

---

## Feedback

If you encounter an accessibility issue on this website, please contact:

**Jari Laru**
Email: <jari.laru@oulu.fi>

---

## References

- [WCAG 2.1 Guidelines (W3C)](https://www.w3.org/TR/WCAG21/)
- [Understanding WCAG 2.1 (W3C)](https://www.w3.org/WAI/WCAG21/Understanding/)

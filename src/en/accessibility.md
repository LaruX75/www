---
layout: page.njk
templateEngineOverride: md
title: Accessibility Statement
permalink: /en/accessibility/
translationKey: accessibility_statement
lang: en
---

**Website:** [www.jarilaru.fi](https://www.jarilaru.fi)
**Last reviewed:** 21 March 2026
**Target level:** WCAG 2.1 Level AA
**Status:** Partially conformant

---

## Summary

The site is being improved toward WCAG 2.1 Level AA. Based on the internal accessibility audit completed in March 2026, the website does not yet meet all WCAG 2.1 AA requirements across all pages and use cases.

The main remaining risks are related to older content, third-party embeds, and the fact that not all pages have yet been verified manually with assistive technologies.

---

## Assessment Methodology

The assessment is based on:

- source code and template review
- generated HTML inspection
- automated testing with **[axe-core](https://github.com/dequelabs/axe-core)** and **[Playwright](https://playwright.dev/)**
- heuristic review of keyboard access and usability

Automated checks are run against the project's own dedicated local Playwright server to ensure the tests are evaluating this website.

---

## Scope of Review

The review focuses especially on:

- home page
- publications
- theses
- navigation and search
- Finnish and English main sections

---

## Issues Found and Fixed

The audit has already led to fixes in areas such as:

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
| 2.1.1 Keyboard | Desktop mega menu was not operable by keyboard | Split top-level page link and submenu toggle, added keyboard support |
| 4.1.2 Name, Role, Value | Search overlay was not exposed as a dialog | Added dialog semantics and focus handling |
| 3.3.2 Labels or Instructions | Contact form fields lacked visible labels | Added visible `<label>` elements |
| 4.1.2 Name, Role, Value | Several iframe embeds lacked accessible names | Added descriptive `title` attributes |
| 1.4.3 Contrast | Hero text with rgba opacity values | Replaced with solid opaque colour values |
| 1.1.1 Non-text Content | Decorative icons missing `aria-hidden` | Added `aria-hidden="true"` |
| 1.4.1 Use of Color | Some text links were distinguished mainly by colour | Restored persistent underline styling for content links |
| 4.1.3 Status Messages | Publication filtering changes were not announced to screen readers | Added `role="status"` and `aria-live` |

---

## Known Limitations and Remaining Work

Automated testing covers only part of WCAG. The following areas still need more work or verification:

- manual screen reader testing (for example NVDA, VoiceOver, JAWS)
- manual review of cognitive accessibility
- full review of individual blog posts and archive pages
- legacy third-party embeds and their alternative access paths

---

## Feedback

If you encounter an accessibility issue on this website, please contact:

**Jari Laru**
Email: <jari.laru@oulu.fi>

---

## References

- [WCAG 2.1 Guidelines (W3C)](https://www.w3.org/TR/WCAG21/)
- [Understanding WCAG 2.1 (W3C)](https://www.w3.org/WAI/WCAG21/Understanding/)

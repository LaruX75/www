# IMPACT-RECOGNITION-01 — Awards parity reconciliation

## Authority

- Primary editorial authority: `src/fi/palkinnot.md`
- Corroborating sources: `src/_data/cv.json`, `src/_data/milestones.js`, `src/media/oulun-yliopiston-tutkijoita-mukana-palkitussa-tekoalylukutaidon-oppimisratkaisussa.md`, `src/fi/vanha-opetusportfolio-wiki-oulu-fi.md`

`src/_data/milestones.js` was used only as corroboration for selective homepage projection, not as a complete awards authority.

Correction to the earlier audit: the 2014 English award entry was already present on current `main`; the real gaps had to be determined from current repo state, not from the stale handoff assumption.

## Before parity

| Type | Year | FI | EN | Finding |
| ---- | ---: | -- | -- | ------- |
| Award | 2026 | yes | no | EN missing EU Digital Skills Award project recognition |
| Award | 2025 | yes | yes | Same recognition existed, but EN lacked FI-level verification links and fuller attribution detail |
| Award | 2020 | yes | yes | Same recognition existed, but EN was terser and omitted the personal-award framing present in FI |
| Award | 2014 | yes | yes | Entry already existed in EN; parity gap was missing verification link and fuller description, not missing existence |
| Grant | 2010 | yes | yes | Present in both |
| Grant | 2009 | yes | no | EN missing University of Oulu travel grant |
| Grant | 2005 | yes | no | EN missing Finnish Cultural Foundation / Urpo and Maija-Liisa Harva Fund grant |
| Grant | 2008 | no | yes | Erroneous EN-only grant entry |
| Student recognition | 2012 | yes | no | EN missing counterpart despite `translationKey: awards` and counterpart routing |

## Source verification

- `src/fi/palkinnot.md` is the authoritative current FI awards surface and contains the 2026, 2025, 2020, 2014, 2010, 2009, 2005, and 2012 entries.
- `src/_data/cv.json` corroborates grant parity in both languages and confirms the correct grant set as 2010, 2009, and 2005, not 2008.
- `src/fi/vanha-opetusportfolio-wiki-oulu-fi.md` independently corroborates the same 2005 / 2009 / 2010 grant years and identities.
- `src/_data/milestones.js` remains intentionally selective: it projects 2005 and 2010 grants plus selected recognition items for homepage use, but is not the awards authority.
- The EN page shares `translationKey: awards` with the FI page and is classified to the same work surface, so the omissions were treated as drift rather than an intentionally separate selection model.

## Corrections

### Awards

- Added the 2026 EU Digital Skills Award entry to `src/en/awards.md` as project recognition for the Generation AI learning solution.
- Preserved truthful attribution: the 2026 and 2025 recognitions remain project/team recognitions; the 2020 and 2014 recognitions remain personal awards.
- Expanded the 2025, 2020, and 2014 EN entries with the same factual identity and clearer attribution already supported by the FI authority.
- Preserved the already-existing 2014 EN entry and did not duplicate it.

### Grants

- Removed the erroneous 2008 EN grant row.
- Added the missing 2009 University of Oulu travel grant.
- Added the missing 2005 Finnish Cultural Foundation / Urpo and Maija-Liisa Harva Fund grant.
- Preserved the 2010 Finnish Cultural Foundation / Xerox Oy Fund grant.

### Student recognition

- Added the 2012 student-recognition counterpart to the EN page because the FI and EN pages are linked as direct translation counterparts rather than separate curated selections.

## External verification

| Entry | Official source URL | FI exposed | EN exposed after fix |
| ----- | ------------------- | ---------- | -------------------- |
| 2026 EU Digital Skills Award | `https://generation-ai-stn.fi/ajankohtaista/oulun-yliopiston-tutkijoita-mukana-palkitussa-tekoaelylukutaidon-oppimisratkaisussa/` | yes | yes |
| 2025 Open Learning Award | `https://avointiede.fi/fi/ajankohtaista/kyberturvallisuus-ja-tekoaly-aiheena-avoimen-oppimisen-palkinnoissa` | yes | yes |
| 2025 supporting University of Oulu news | `https://www.oulu.fi/fi/uutiset/lasten-ja-nuorten-tekoalylukutaitoa-edistava-hanke-voitti-vuoden-avoin-oppimateriaali-palkinnon` | yes | yes |
| 2020 National Open Science Award | `https://avointiede.fi/fi/ajankohtaista/vuotuiset-avoimen-tieteen-palkinnot-2020-jaettu` | yes | yes |
| 2014 Teacher of the Year in Educational Technology | `https://itko.tivia.fi/vuoden-tieto-ja-viestintatekniikkaopettaja/` | yes | yes |

## After parity

| Type | Year | FI | EN | Result |
| ---- | ---: | -- | -- | ------ |
| Award | 2026 | yes | yes | Parity restored |
| Award | 2025 | yes | yes | Parity restored with links and attribution |
| Award | 2020 | yes | yes | Parity restored with personal-award framing |
| Award | 2014 | yes | yes | Parity restored without duplication |
| Grant | 2010 | yes | yes | Parity preserved |
| Grant | 2009 | yes | yes | Parity restored |
| Grant | 2005 | yes | yes | Parity restored |
| Student recognition | 2012 | yes | yes | Counterpart added |

## Intentional asymmetry

`src/_data/milestones.js` remains selective by design. It projects only a small curated subset of recognition evidence for the homepage timeline and does not need one-to-one parity with the awards pages.

## Tests

- Added `tests/unit/awardsParity.test.js` to lock the English page to the verified award years, grant years, student-recognition counterpart, and official verification links.
- `git diff --check` passed.
- `npm run test:unit` passed: 691/691.
- `npm run build:local:full` passed. Eleventy wrote 1471 files in 223.00 seconds.
- `npm run check:i18n-seo` passed for 1458 HTML files.
- Built-page inspection confirmed `/en/awards/` now contains 2026, 2025, 2020, 2014, 2010, 2009, 2005, and 2012, and no `2008` grant row remains.
- `npm run check:jsonld` still reports one unrelated pre-existing `html-entity-leak` error on `presentations/ss-koe-oppimisymparistona-osa-i/index.html`. That error is outside this recognition-parity diff.

## Architecture

Existing Markdown remains the recognition content authority.

No new content model was introduced.

Milestones remains a curated projection.

Nunjucks remains the renderer.

No JavaScript or Pagefind change was made.

No homepage impact UX was introduced.

Architecture Closure 1.0 remains CLOSED / GREEN / MAIN.

## Verdict

IMPACT-RECOGNITION-01 PROVEN — FI/EN recognition facts are reconciled and homepage impact evidence can be reassessed

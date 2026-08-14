# F3C-P5 Presentation Topic Mapping Review

Date: 2026-08-14

## 1. Scope

- P5 reviews deterministic presentation-topic mapping needed for future archive filtering and future Research fourth-scope work.
- This checkpoint does not migrate `/esitykset/`, does not add presentations to `/tutkimus/`, and does not introduce a new taxonomy.

## 2. P4 baseline

- canonical presentations: 218
- built local details: 139
- local-first: 138
- external-first: 80
- duplicate discovery identities: 0
- title Pagefind gate remains a separate regression check in this checkpoint.

## 3. Current Research topic model

- Current visible FI research line labels come from `src/curated/research-program.json` and `src/fi/tutkimus.md`.
- The cross-scope research presets are still three curated lines, not the older wider six-item idea.
- Thesis archive filter label is already `Aihe`, while thesis detail metadata still says `Tutkimusteemat`.

- `ai-literacy` — Tekoälylukutaito ja tekoälykasvatus
  publications: `researchThemes` anyOf [Tekoälylukutaito `tekoalylukutaito`, Selitettävä tekoäly `selitettava-tekoaly`, Koneoppiminen `koneoppiminen`]
  theses: `researchThemes` anyOf [Tekoälylukutaito `tekoalylukutaito`, Selitettävä tekoäly `selitettava-tekoaly`, Koneoppiminen `koneoppiminen`]
  writings: topic profile `tekoalylukutaito` -> [Tekoälylukutaito](/teemat/tekoalylukutaito/)
- `teacher-education` — Opettajankoulutus ja pedagoginen muutos
  publications: `researchThemes` anyOf [Opettajankoulutus `opettajankoulutus`, Digipedagogiikka `digipedagogiikka`, Teknologiakasvatus `teknologiakasvatus`, Ohjelmoinnillinen ajattelu `ohjelmoinnillinen-ajattelu`]
  theses: `researchThemes` anyOf [Opettajankoulutus `opettajankoulutus`, Digipedagogiikka `digipedagogiikka`, Teknologiakasvatus `teknologiakasvatus`, Ohjelmoinnillinen ajattelu `ohjelmoinnillinen-ajattelu`]
  writings: topic profile `opettajankoulutus` -> [Opettajankoulutus ja opetuksen kehittäminen](/teemat/opettajankoulutus/)
- `long-term-learning` — Mobiilioppiminen ja yhteisöllinen tiedonrakentelu
  publications: `researchThemes` anyOf [Mobiilioppiminen `mobiilioppiminen`, Yhteisöllinen oppiminen `yhteisollinen-oppiminen`, CSCL `cscl`, Oppimisympäristöt `oppimisymparistot`]
  theses: `researchThemes` anyOf [Mobiilioppiminen `mobiilioppiminen`, Yhteisöllinen oppiminen `yhteisollinen-oppiminen`, CSCL `cscl`, Oppimisympäristöt `oppimisymparistot`]
  writings: topic profile `koulutusteknologia-ja-oppimisymparistot` -> [Koulutusteknologia ja oppimisympäristöt](/teemat/koulutusteknologia-ja-oppimisymparistot/)

## 4. Presentation topic inventory

- total presentations: 218
- presentations with topics: 198
- presentations with no topic: 20
- unique raw topics: 406
- multi-topic presentations: 192
- long-tail topics (count = 1): 278

| Topic | Count | Mapping | Research target |
| --- | ---: | --- | --- |
| Koulutusteknologia | 96 | ALIAS | Mobiilioppiminen ja yhteisöllinen tiedonrakentelu `long-term-learning` |
| koulutusteknologia | 56 | ALIAS | Mobiilioppiminen ja yhteisöllinen tiedonrakentelu `long-term-learning` |
| Opettajankoulutus | 41 | EXACT | Opettajankoulutus ja pedagoginen muutos `teacher-education` |
| Generation AI | 27 | ALIAS | Tekoälylukutaito ja tekoälykasvatus `ai-literacy` |
| TVT | 27 | BROADER-NO | Mobiilioppiminen ja yhteisöllinen tiedonrakentelu `long-term-learning` |
| tekoälylukutaito | 25 | EXACT | Tekoälylukutaito ja tekoälykasvatus `ai-literacy` |
| sosiaalinen media | 16 | UNMAPPED | — |
| generatiivinen tekoäly | 15 | RELATED-NOT-EQUIVALENT | Tekoälylukutaito ja tekoälykasvatus `ai-literacy` |
| tekoäly | 15 | BROADER-NO | Tekoälylukutaito ja tekoälykasvatus `ai-literacy` |
| opettajankoulutus | 14 | EXACT | Opettajankoulutus ja pedagoginen muutos `teacher-education` |
| AI literacy | 12 | ALIAS | Tekoälylukutaito ja tekoälykasvatus `ai-literacy` |
| digitaalinen media | 12 | UNMAPPED | — |
| Somekone | 12 | NARROWER | Tekoälylukutaito ja tekoälykasvatus `ai-literacy` |
| multimedia | 11 | UNMAPPED | — |
| EU AI Act | 10 | RELATED-NOT-EQUIVALENT | Tekoälylukutaito ja tekoälykasvatus `ai-literacy` |

## 5. Topic coverage

- presentations: 168 / 218 (77.1%)
- topic assignments: 352 / 1034 (34.0%)
- mapped local-first: 121
- mapped external-first: 47
- presets with presentation coverage: 3
- presets without presentation coverage: 0

## 6. Research preset inventory

- Publications and theses use shared `researchThemes` values underneath.
- Writings do not expose the same structured `researchThemes` selector; they connect through curated topic-profile pages under `/teemat/`.
- P5 therefore maps presentations to the three current research presets, not directly to every individual research-theme slug.

## 7. Mapping methodology

- SAFE mappings were limited to three classes: `EXACT`, `ALIAS`, and `NARROWER`.
- Safe evidence had to come from current repository assets such as `seoTopics`, `research-program.json`, or curated presentation/research records.
- Broad umbrella topics such as `tekoäly`, `TVT`, and `opetus` were intentionally not forced into narrower research presets.

## 8. Exact mappings

- exact topic rows: 3
- current exact set is intentionally small and centers on preset/topic names such as `tekoälylukutaito` and `opettajankoulutus`.

## 9. Alias mappings

- alias topic rows: 7
- safe aliases come from current curated keywords and explicit bilingual/project-name evidence such as `Generation AI`, `AI literacy`, `teacher education`, and `koulutusteknologia`.

## 10. Narrower-topic mappings

- narrower topic rows: 17
- these rows map explicit child themes or tools upward into the current preset layer, for example `Somekone`, `Teachable Machine`, `XAI`, `mobiilioppiminen`, `CSCL`, and `digipedagogiikka`.

## 11. Unmapped topics

- broader-no rows: 5
- related-not-equivalent rows: 6
- fully unmapped rows: 368
- unmapped topics remain available for archive-side filtering; they are only withheld from the smaller research-context abstraction.

## 12. Archive vs Research mapping distinction

- Archive filtering can keep the raw presentation topic vocabulary.
- Research contextual filtering must stay narrower and deterministic.
- A presentation can therefore be archive-topic-ready while remaining intentionally outside current Research presets.

## 13. Research mapping coverage

- presentations: 168 / 218 (77.1%)
- topic assignments: 352 / 1034 (34.0%)
- mapped local-first: 121
- mapped external-first: 47
- presets with presentation coverage: 3
- presets without presentation coverage: 0

## 14. Structured Pagefind verification

- preset metadata gate: PASS
- every preset comparison checks expected canonical IDs against actual `PresentationResearchPreset` filter membership.
- no preset produced duplicate canonical IDs in structured membership.

| Preset | Expected | Missing | Unexpected | Local-first | External-first | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Tekoälylukutaito ja tekoälykasvatus | 54 | 0 | 0 | 11 | 43 | PASS |
| Opettajankoulutus ja pedagoginen muutos | 52 | 0 | 0 | 46 | 6 | PASS |
| Mobiilioppiminen ja yhteisöllinen tiedonrakentelu | 97 | 0 | 0 | 97 | 0 | PASS |

## 15. Representative Research-topic tests

| Research preset | Query | Expected | Found | Missing | Unexpected | Landing |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| Tekoälylukutaito ja tekoälykasvatus | `tekoälylukutaito` | 54 | 44 | 10 | 0 | OK |
| Opettajankoulutus ja pedagoginen muutos | `opettajankoulutus` | 52 | 46 | 6 | 0 | OK |
| Mobiilioppiminen ja yhteisöllinen tiedonrakentelu | `mobiilioppiminen` | 97 | 87 | 10 | 0 | OK |

## 16. Presentation Pagefind regression

- PASS (20/20 found, 19/20 top1, 20/20 top3, 20/20 landing)

## 17. Existing scope regressions

- writings: PASS
- theses: PASS
- publications: PASS
- research smoke: PASS (Playwright smoke 1/1)

## 18. Presentation canonical regressions

- PASS (218 canonical, 139/139 local details, 0 duplicate ids, landing green)

## 19. "Tutkimusteema" vs "Aihe" terminology assessment

- Current visible cross-item selector wording is already `Aihe` on the thesis archive page.
- `Tutkimusteemat` still appears on thesis detail pages, where it names thesis metadata rather than a multi-scope discovery control.
- Recommendation: use neutral `Aihe` for any future cross-scope Research selector that spans publications, theses, writings, and later presentations.

## 20. Presentation archive topic readiness

- classification: PARTIAL
- reasoning: archive-side topics are rich enough to expose, but the vocabulary is still fragmented (406 raw labels, 11 topicless presentations, and a large long tail).

## 21. Research fourth-scope readiness

- classification: YES WITH LIMITED TOPIC PRESETS
- reasoning: the current three presets can already accept a deterministic subset of presentation topics, but only as a deliberately limited abstraction.

## 22. F3C migration recommendation

- decision: PARTIAL
- reasoning: title discovery and landing semantics remain strong, but topic UX should still enter the archive migration as a constrained first release rather than as a finished taxonomy.

## 23. Recommended first archive filters

| Filter | Recommendation | Reason |
| --- | --- | --- |
| free-text | INCLUDE | Title search quality is already green from P4 and remains the primary entry point. |
| year | INCLUDE | Canonical year metadata is already stable and deterministic. |
| topic | INCLUDE | Archive-side topic vocabulary already exists even though research-side mapping stays intentionally partial. |
| event | OPTIONAL | Useful but still more heterogeneous than topic/year. |
| presentationType | OPTIONAL | Structured and present for all canonical items, but not yet proven as first-pass UX priority. |
| role | DEFER | Coverage remains partial and should not lead the first archive UI. |
| language | OPTIONAL | Language metadata is useful and deterministic where present. |
| mediaType | OPTIONAL | Well-structured and low-risk for advanced narrowing. |
| sourceType | DO NOT EXPOSE | Implementation detail that is useful for audits but weak for end-user filtering. |

## 24. F4 follow-up recommendation

- Add presentations as a fourth scope: yes, but only through the three current presets and the adapter introduced in P5.
- Presets to include first: `ai-literacy`, `teacher-education`, `long-term-learning`.
- Visible selector label: prefer `Aihe` for the future shared control.
- Topic-control behavior: keep one stable contextual `Aihe` abstraction and let each scope map underneath to its own deterministic data model.

## 25. Remaining limitations

- 11 canonical presentations still have no topic metadata.
- 406 raw topic labels include many one-off strings and mixed Finnish/English variants.
- P5 intentionally does not collapse the archive vocabulary or redesign topic taxonomy.

## 26. Closure readiness

- build: PASS (npm run build:no-og)
- unit tests: PASS (400/400)
- structured mapping quality: PASS
- report artifact: [presentations-topic-mapping-f3c-p5-report-2026-08-14.md](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/docs/presentations-topic-mapping-f3c-p5-report-2026-08-14.md)
- csv artifact: [presentation-research-topic-mapping-f3c-p5.csv](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/docs/data/presentation-research-topic-mapping-f3c-p5.csv)
- mapping artifact: [presentation-research-topic-mapping.json](/Users/jlaru/Documents/www/jarilaru-eleventy-final-v2/src/curated/presentation-research-topic-mapping.json)

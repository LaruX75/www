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

- canonical presentations: 218
- with canonical topics: 198 / 218 (90.8%)
- topicless: 20 / 218 (9.2%)
- with safe Research mapping: 168 / 218 (77.1%)
- with canonical topics but no safe Research mapping: 30 / 218 (13.8%)
- topic assignments: 352 / 1034 (34.0%)
- mapped local-first: 121
- mapped external-first: 47
- presets with presentation coverage: 3
- presets without presentation coverage: 0

### Count invariants

- with canonical topics + topicless = 198 + 20 = 218 (PASS)
- with safe Research mapping + topic-present-but-Research-unmapped + topicless = 168 + 30 + 20 = 218 (PASS)

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

- canonical presentations: 218
- with canonical topics: 198 / 218 (90.8%)
- topicless: 20 / 218 (9.2%)
- with safe Research mapping: 168 / 218 (77.1%)
- with canonical topics but no safe Research mapping: 30 / 218 (13.8%)
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

- Verified separately in checkpoint run

## 17. Existing scope regressions

- writings: Verified separately in checkpoint run
- theses: Verified separately in checkpoint run
- publications: Verified separately in checkpoint run
- research smoke: Verified separately in checkpoint run

## 18. Presentation canonical regressions

- Verified separately in checkpoint run

## 19. "Tutkimusteema" vs "Aihe" terminology assessment

- Current visible cross-item selector wording is already `Aihe` on the thesis archive page.
- `Tutkimusteemat` still appears on thesis detail pages, where it names thesis metadata rather than a multi-scope discovery control.
- Recommendation: use neutral `Aihe` for any future cross-scope Research selector that spans publications, theses, writings, and later presentations.

## 20. Presentation archive topic readiness

- classification: PARTIAL
- reasoning: archive-side topics are rich enough to expose, but the vocabulary is still fragmented (406 raw labels, 20 topicless presentations, and a large long tail).

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

- 20 canonical presentations still have no topic metadata.
- 406 raw topic labels include many one-off strings and mixed Finnish/English variants.
- P5 intentionally does not collapse the archive vocabulary or redesign topic taxonomy.

## 26. Closure readiness

- build: Verified separately in checkpoint run
- unit tests: Verified separately in checkpoint run
- structured mapping quality: PASS
- report artifact: [presentations-topic-mapping-f3c-p5-report-2026-08-14.md](./presentations-topic-mapping-f3c-p5-report-2026-08-14.md)
- csv artifact: [presentation-research-topic-mapping-f3c-p5.csv](./data/presentation-research-topic-mapping-f3c-p5.csv)
- mapping artifact: [presentation-research-topic-mapping.json](../src/curated/presentation-research-topic-mapping.json)
- diagnostics artifact: [presentation-topic-coverage-diagnostics-f3c-p5.json](./data/presentation-topic-coverage-diagnostics-f3c-p5.json)

## 27. Closure note

- contradictory values observed before closure: `20` and `11` topicless presentations.
- authoritative current canonical value: `20` topicless presentations from `_site/data/presentations-page.json` canonical items.
- exact reason for the discrepancy: stale hardcoded prose in this audit generator's sections 20 and 25 still said `11`, while the canonical inventory section already computed `20`.
- corrected source: `scripts/audit-presentation-topic-mapping.js`.
- canonical topic semantics and safe Research mapping semantics were unchanged by this closure fix.

## 28. Diagnostic list: topicless canonical presentations

| Canonical ID | Title | Topics | Landing |
| --- | --- | --- | --- |
| customMaterials\|https://www.ouka.fi/lukevinkaupunni/arjen-tekoalyhaaste\|Arjen tekoälyhaaste | Arjen tekoälyhaaste | — | localDetail |
| curatedVideos\|https://www.youtube.com/watch?v=0cJ0Ed3Scs4&t=5s\|ITK-avauksen tallenne: Työkalu? Taikakalu? | ITK-avauksen tallenne: Työkalu? Taikakalu? | — | externalSource |
| curatedVideos\|https://www.youtube.com/watch?v=7EXB54VvlsU&t=2s\|Oululaisia lapsia ja nuoria koskevien tilastotietojen tarkastelua | Oululaisia lapsia ja nuoria koskevien tilastotietojen tarkastelua | — | externalSource |
| aoe\|https://www.finna.fi/Record/aoe.5456\|Ai ai, kieliä ja AI -koulutuspaketti | Ai ai, kieliä ja AI -koulutuspaketti | — | externalSource |
| curatedVideos\|https://www.youtube.com/watch?v=RyItZto47t8\|Kuinka Generatiivinen tekoäly toimii? Pieni kielikone on vastaus tähän kysymykseen! | Kuinka Generatiivinen tekoäly toimii? Pieni kielikone on vastaus tähän kysymykseen! | — | externalSource |
| curatedVideos\|https://www.youtube.com/watch?v=q2K04VmN3sQ\|Generation AI: Selitettävä tekoäly, mitä se on ja miksi se on tärkeä huomioida opetuksessa? | Generation AI: Selitettävä tekoäly, mitä se on ja miksi se on tärkeä huomioida opetuksessa? | — | externalSource |
| curatedVideos\|https://www.youtube.com/watch?v=U4iFFFY3rhM\|ITK-webinaari: Miten opetan tekoälyä oppilaille? Generation AI | ITK-webinaari: Miten opetan tekoälyä oppilaille? Generation AI | — | externalSource |
| curatedVideos\|https://www.youtube.com/watch?v=fcDjAZZZs4U\|ITK-webinaari: Generation AI - kyberturvallisen ajattelutavan opettaminen tekoälysukupolvelle | ITK-webinaari: Generation AI - kyberturvallisen ajattelutavan opettaminen tekoälysukupolvelle | — | externalSource |
| aoe\|https://www.finna.fi/Record/aoe.2047\|Esitykseni STEAM (k)Oulussa –etäseminaarissa 21.4.2022 | Esitykseni STEAM (k)Oulussa –etäseminaarissa 21.4.2022 | — | externalSource |
| aoe\|https://www.finna.fi/Record/aoe.2409\|ITK2022: | ITK2022: | — | externalSource |
| aoe\|https://www.finna.fi/Record/aoe.2370\|Teknologiatuettu oppiminen ja työskentely luentodiat syksy 2022 | Teknologiatuettu oppiminen ja työskentely luentodiat syksy 2022 | — | externalSource |
| aoe\|https://www.finna.fi/Record/aoe.1501\|Etäopetuksen hyvät käytännöt - mitä ovat opetus ja oppiminen digitaalisuuden puristuksessa? | Etäopetuksen hyvät käytännöt - mitä ovat opetus ja oppiminen digitaalisuuden puristuksessa? | — | externalSource |
| aoe\|https://www.finna.fi/Record/aoe.1518\|History of Technology Enhanced Learning | History of Technology Enhanced Learning | — | externalSource |
| aoe\|https://www.finna.fi/Record/aoe.1813\|Hybridiopetus on täällä, oletko valmis? Näkemysten ja kokemusten jakamista kokeilevalla otteella! | Hybridiopetus on täällä, oletko valmis? Näkemysten ja kokemusten jakamista kokeilevalla otteella! | — | externalSource |
| aoe\|https://www.finna.fi/Record/aoe.1698\|Joko vihdoin tästä tulee valtavirtaa - Teknologiatuettu oppiminen ja opetus post-korona maailmassa. | Joko vihdoin tästä tulee valtavirtaa - Teknologiatuettu oppiminen ja opetus post-korona maailmassa. | — | externalSource |
| aoe\|https://www.finna.fi/Record/aoe.1789\|Ohjelmointi perusopetuksessa kurssin projektityön lopputuotos 2021 | Ohjelmointi perusopetuksessa kurssin projektityön lopputuotos 2021 | — | externalSource |
| videoSeries\|https://www.youtube.com/playlist?list=PLDG0jxUrk8z19_ThqBiynpYG4g-mjwgpt\|Jari Larun verkkolive | Jari Larun verkkolive | — | externalSource |
| videoSeries\|https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY\|Larun pikkuvinkit | Larun pikkuvinkit | — | localDetail |
| curatedVideos\|https://www.youtube.com/watch?v=SoeW6zexrWQ\|Teknologia, oppiminen ja osaaminen yhteiskunnassa - videotallenne | Teknologia, oppiminen ja osaaminen yhteiskunnassa - videotallenne | — | localDetail |
| videoSeries\|https://www.youtube.com/playlist?list=PLDG0jxUrk8z2E7S2ggyzt0bIBXiDEgXob\|Larun laitenurkka: opetusteknologia läpivalaisussa | Larun laitenurkka: opetusteknologia läpivalaisussa | — | externalSource |

## 29. Diagnostic list: canonical topics present but no safe Research mapping

| Canonical ID | Title | Topics | Landing |
| --- | --- | --- | --- |
| slideshare\|https://www.slideshare.net/slideshow/my-life-9-months-before-the-defence/13140146\|My life 9 months before the defence | My life 9 months before the defence | Yliopisto ja korkeakoulut, väitöskirja | localDetail |
| /presentations/teknologia-opetuksen-tukena-video-1-keskustelemme-suhteestamme/ | Keskustelemme suhteestamme teknologian hyödyntämisestä opetuksen ja oppimisen tukena | Teknologia, Opetus, Oppiminen | localDetail |
| /presentations/eduxr-2020-suunnanmuutos-digiopettajasta-etaopettajaksi/ | Suunnanmuutos 360° digiopettajasta etäopettajaksi | Etäopetus, Digiopetus, XR, Konferenssi | localDetail |
| /presentations/avoin-tiede-2021-avoimeen-oppimiseen-ja-opetukseen/ | Avoimeen oppimiseen ja opetukseen | Avoin tiede, Avoin oppiminen, Palkinto | localDetail |
| slideshare\|https://www.slideshare.net/slideshow/tekn-sovellukset-javalineetao/21158606\|Tekn sovellukset ja_valineet_ao | Tekn sovellukset ja_valineet_ao | TVT | localDetail |
| slideshare\|https://www.slideshare.net/slideshow/lhidemokratiatoimikunta-oulun-kaupungissa/41789438\|Lähidemokratiatoimikunnan toiminta Oulussa | Lähidemokratiatoimikunnan toiminta Oulussa | Demokratia ja sivistys, lähidemokratia, demokratia | localDetail |
| /presentations/syntyvyys-ja-kouluik-luokat-oulussa-2026/ | Syntyvyys ja kouluikäluokat Oulussa 2026 | Koulutuspolitiikka, Oulu, Väestötieto, koulutuspolitiikka, väestöennuste | localDetail |
| slideshare\|https://www.slideshare.net/slideshow/405514y-multimedia-as-a-learning-project-3-c/6958208\|405514Y Multimedia as a Learning Project, 3 c | 405514Y Multimedia as a Learning Project, 3 c | multimedia, digitarinankerronta | localDetail |
| slideshare\|https://www.slideshare.net/slideshow/lito2018-workshop-arviointi-suurilla-verkkokursseilla/99171640\|Lito2018 workshop arviointi suurilla verkkokursseilla | Lito2018 workshop arviointi suurilla verkkokursseilla | verkkokurssit, arviointi | localDetail |
| slideshare\|https://www.slideshare.net/slideshow/quali-lecture-1-17116725/17116725\|Quali lecture 1: Understanding the research process | Quali lecture 1: Understanding the research process | Yliopisto ja korkeakoulut, laadullinen tutkimus, mixed methods, tutkimusprosessi | localDetail |
| slideshare\|https://www.slideshare.net/slideshow/alustus-digitaalisuus-koulutuksessa/51713522\|Alustus: Digitaalisuus koulutuksessa | Alustus: Digitaalisuus koulutuksessa | digitalisaatio | localDetail |
| slideshare\|https://www.slideshare.net/slideshow/mummo-nkkulma-sukupuun-juurelta-tai-ainakin-melkein-sukujuhla-2014/37584942\|MUMMO Näkökulma sukupuun juurelta.. Tai ainakin melkein.. Sukujuhla 2014 | MUMMO Näkökulma sukupuun juurelta.. Tai ainakin melkein.. Sukujuhla 2014 | sukujuhla | localDetail |
| kJtKo_ZUxCFEOTn | Sivistysverkosto 4.5. | koulutus, kuntatalous, opetussuunnitelma, palveluverkko, sivistyslautakunta, sivistysverkosto, tekoäly | externalSource |
| 2d_GA4aAEX9qmRs | ITK2026 millaisia ovat tekoälyaikakauden opettajaprofiilit | ITK, iTPACK, opettajaprofiili, opettajaprofiilit, opettajuus, opetusalan tekoäly, tekoäly, tekoälyaika, tekoälykysely, toimijuus | externalSource |
| 2PrBoY6M2CTg60F | OPH esitys 18.3. | OPH, Opetushallitus, iTPACK, opettajaprofiilit, opetus, tekoäly, tekoälykysely, verkostojen verkosto | externalSource |
| 9vbIlfCJtVMnz0L | Konenäkö, vibe coding ja robotiikka – Robokampus 2026 | Robokampus, konenäkö, robotiikka, tekoäly, vibe coding | localDetail |
| EAMOOLnvrmnE_0g | Tekoälyagentit | OKF, agenttipohjaisuus, koulutus, tekoälyagentit, tulevaisuus | externalSource |
| NwJZ8FVrbTIF80L | Tekoäly opettajan työkaluna | käytännön vinkit, opettajan työkalu, opetuskäyttö, tekoäly | externalSource |
| 7IyyLkfG4NvVNFy | Kuinka tekoäly toimii? – Webinaari | opettajat, tekoälyn perusteet, toimintaperiaatteet, webinaari | externalSource |
| IMm6-JD8PRTBK2F | Tekoäly yhdistystoiminnassa | OK Opintokeskus, järjestöt, tekoälytyökalut, yhdistystoiminta | externalSource |
| aDY3w1A8bLJm0kr | Tekoäly, opettajan työ ja arvioinnin muutos | ChatGPT, arviointi, generatiivinen tekoäly, muutos, opettajan työ, promptaus | externalSource |
| I-r13uz6Wiip2cC | Generatiivinen tekoäly – Tekoäly työkaluna III | HeyGen, NotebookLM, generatiivinen tekoäly, kieltenopetus, koulutussarja, kriittinen lukutaito, opettajat, promptaus | externalSource |
| 4zq6qy9B3GX9FQK | Tekoäly osana arkisia sovelluksia | Microsoft Translator, S2-opetus, arkiset sovellukset, integraatio, konekääntäminen, saavutettavuus, tekoäly arjessa, tekstittäminen, tietoisuus | externalSource |
| uZIb__sx1r4EAqT | Tekoälyosaamista kieltenopetukseen | GDPR, generatiivinen tekoäly, hybridiälykkyys, kieltenopetus, luento, opetus, shadow AI, tekoälyosaaminen | externalSource |
| y4oM9QaEQrxs2Lq | Annie Advisor – Generative AI as a Tool to Adapt Teaching | AIED, Annie Advisor, MagicSchool, adaptive teaching, differentiation, eriyttäminen, generatiivinen tekoäly, generative AI, learning support, ohjaus, oppimisen tuki | externalSource |
| H13QgkxVZpEyel5 | Tekoälyluento – OSYK | EU AI Act, OSYK, opetushenkilöstö, oppimisen arviointi, perusteet, sosiaalinen media, tekoäly, tekoälyluento | externalSource |
| H8tSyhG_9jcwRpr | VESO elokuu 2024 – Tekoäly koulussa | DALL-E promptit, PowerPoint-tekstitys, Simo, VESO, dyslexia-tuki, elokuu, lukituki, lukuvuoden alku, syventävä lukuohjelma, tekoäly koulussa, tekoälytyökalut | localDetail |
| tjjrZpkP2brKCKh | Fedutalk – Generative AI in Education | Fedutalk, Finland, Kosovo, education, generatiivinen tekoäly, generative AI, kansainvälisyys, koulutus | externalSource |
| S9UhE1RwcwtuNMz | Tekoäly opettajan työkaluna – Inspiraatiosessio | Azure AI, LUTK, Microsoft AI, inspiraatio, motivointi, opettajan työkalut, sanelu, tdk-luento, tekoäly arjessa, tekoälyinspis, tekstitys, tietoisuus | externalSource |
| ULcBKqsIIMap4cc | Oppiva verkosto – Analytiikkaesitys | ChatGPT, Oppiva verkosto, analytiikka, data, dataslip, digijalki, hybridi-intelligenssi, kehittäminen, oppimisanalytiikka, tutkimus | externalSource |

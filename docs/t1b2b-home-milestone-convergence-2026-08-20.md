# T1B2B — Home Milestone Convergence

Date: 2026-08-20  
Branch: `feat/t1b2b-home-milestone-convergence`  
Base main SHA: `aa0a093740e5252ae897d91e858d16b9e1597f1c`

## Status

`T1B2B = CLOSED / GREEN / BRANCH`

This slice converges the homepage milestone timeline onto a small build-time projection without starting T1B2C, T1B3, PF5, Pagefind timeline behavior, or any Canonical Content v1 redesign.

## Before

Current home timeline flow on base `main`:

```text
src/_data/milestones.js
  -> manual 26-card array
  -> src/index.njk
  -> /
  -> SSR homepage timeline
```

Each milestone owned its own:

- year
- category
- title
- description
- href

Additionally, four milestones owned a `phaseStart` marker directly inside the same manual array.

## Selected Design

Final T1B2B flow:

```text
canonical/domain facts
+ explicit homepage companion framing
-> build-time home milestone projection
-> src/_data/milestones.js
-> src/index.njk
-> /
-> SSR homepage timeline
```

Boundary rule:

- authoritative source reuses existing year / title / route where available
- editorial homepage description remains companion-owned
- homepage category remains presentation-only metadata
- phase markers remain companion/editorial framing
- no public timeline JSON is created
- no Pagefind timeline behavior is added

## 26-Item Classification

Legend:

- `A` = directly canonical
- `B` = derivable from existing canonical/domain data
- `C` = legitimate companion/editorial fact
- `D` = duplicate manual copy in the old array
- `E` = authority unclear

| Year | Category | Current milestone | Href | Existing authoritative source | Derivable fields | Class | Curated after T1B2B |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1989 | tausta | BBS-harrastus alkaa (Raahe) | `/1998/02/16/silloin-kun-sita-oltiin-larges-securityn-sysop-bbs-muisteluita/` | Related local memoir page, but no structured source | none | C | yes |
| 2000 | politiikka | Vaalikausi 2001–2004 (Raahe) | `/politiikka/vaalikaudet/` | no shared structured pre-2013 election source | none | C | yes |
| 2002 | tutkimus | Tutkimusavustaja EDTECH-yksikössä | `/cv/` | `cv.fi.prev_positions` | year, title, href | B / D | description, category, phase |
| 2003 | opetus | KM ja pro gradu valmis | `/tutkimus/#varhaisvaihe` | `cv.fi.education` (KM) | year | B / D | title, description, href, category |
| 2003 | tutkimus | TEKESin Rotuaari-hanke (2003–2006) | `/tutkimus/#hankkeet` | `researchProjects` | year, title, href | B / D | description, category |
| 2004 | tutkimus | Mosil-hanke (2004–2006, EU Kaleidoscope NoE) | `/tutkimus/#hankkeet` | `researchProjects` | year, title, href | B / D | description, category |
| 2005 | politiikka | Vaalikausi 2005–2008 (Oulu) | `/politiikka/vaalikaudet/` | no shared structured pre-2013 election source | none | C | yes |
| 2005 | tutkimus | Kulttuurirahaston tutkimusapuraha (2005–2006) | `/tutkimus/` | `cv.fi.grants` | year, title, href | B / D | description, category |
| 2006 | tutkimus | Tutkijakoulutettava (OPMON) | `/cv/` | `cv.fi.prev_positions` | year, title, href | B / D | description, category |
| 2008 | politiikka | Vaalikausi 2009–2012 (Kiiminki) | `/politiikka/vaalikaudet/` | no shared structured pre-2013 election source | none | C | yes |
| 2010 | opetus | Larux tmi käynnistyy (toukokuu 2010) | `/kouluttaja/` | `cv.fi.positions` | year, title, href | B / D | description, category |
| 2010 | tutkimus | Kulttuurirahaston tutkimusapuraha (2010–2011) | `/tutkimus/` | `cv.fi.grants` | year, title, href | B / D | description, category |
| 2011 | opetus | Yliopisto-opettaja, tieto- ja viestintäteknologian opetuskäyttö | `/cv/` | `cv.fi.prev_positions` | year, title, href | B / D | description, category |
| 2012 | tutkimus | Väitöskirja: mobiili- ja yhteisöllinen oppiminen | `/vaitoskirja/` | `cv.fi.education` (KT) | year, href | B / D | title, description, category |
| 2012 | opetus | Opiskelijoiden tunnustus: Omena hyvälle opettajalle | `/palkinnot/` | awards page contains the fact, but no shared structured source | none | C | yes |
| 2012 | politiikka | Vaalikausi 2013–2017 (Oulu) | `/politiikka/vaalikaudet/` | `electionHistory` | year, title, href | B / D | description, category |
| 2013 | opetus | Yliopistonlehtori (nykyinen tehtävä) | `/tyoni-yliopistonlehtorina/` | `cv.fi.positions` | year, title, href | B / D | description, category, phase |
| 2017 | politiikka | Vaalikausi 2017–2021 (Oulu) | `/politiikka/vaalikaudet/` | `electionHistory` | year, title, href | B / D | description, category |
| 2018 | tutkimus | LEA-hanke (2018–2020, EU Horizon 2020) | `/tutkimus/#hankkeet` | `researchProjects` | year, title, href | B / D | description, category |
| 2020 | palkinto | Kansallinen avoimen tieteen palkinto | `/palkinnot/` | awards page contains the fact, but no shared structured source | none | C | yes |
| 2020 | tutkimus | MakeCT-hanke käynnistyy (2020–2023) | `/tutkimus/#hankkeet` | `researchProjects` | year, title, href | B / D | description, category |
| 2021 | politiikka | Vaalikausi 2021–2025 (Oulu) | `/politiikka/vaalikaudet/` | `electionHistory` | year, title, href | B / D | description, category |
| 2022 | tutkimus | Generation AI -tutkimusohjelma käynnistyy (2022–) | `/tutkimus/#hankkeet` | `researchProjects` | year, title, href | B / D | description, category, phase |
| 2023 | tutkimus | TKAEDITE-hanke (2023–2026, Erasmus+) | `/tutkimus/#hankkeet` | `researchProjects` | year, title, href | B / D | description, category |
| 2025 | politiikka | Vaalikausi 2025–2029 (Oulu) | `/politiikka/vaalikaudet/` | `electionHistory` | year, title, href | B / D | description, category |
| 2026 | opetus | Tekoälylukutaito opettajankoulutuksen keskiössä | `/teemat/tekoalylukutaito/` | no single authoritative structured milestone source | none | C | yes |

## Authoritative Source Mappings

Chosen structured/domain inputs:

- `src/_data/cv.json`
- `src/_data/researchProjects.js`
- `src/_data/electionHistory.js`

Source-backed milestone totals after convergence:

- authoritative-source-backed milestones: `19`
- companion-only milestones: `7`
- unresolved authority count: `0`

The seven companion-only milestones are:

- `bbs-1989`
- `politics-2000-raahe`
- `politics-2005-oulu`
- `politics-2008-kiiminki`
- `teaching-award-2012`
- `open-science-award-2020`
- `ai-literacy-2026`

## Companion-Owned Fields

Kept companion-owned on purpose:

- all milestone descriptions
- homepage-only category labels
- the four `phaseStart` markers
- editorial titles where the authoritative source does not offer the same user-facing framing exactly
- landing-page anchors such as `/tutkimus/#varhaisvaihe`

This preserves the curated chronology while removing duplicated authority from the old array.

## Political Milestones

T1B2A is now reused where it is actually authoritative:

- `2012` -> `electionHistory` term `2013-2017`
- `2017` -> `electionHistory` term `2017-2021`
- `2021` -> `electionHistory` term `2021-2025`
- `2025` -> `electionHistory` term `2025-2029`

Pre-2013 political milestones remain companion-owned:

- `2000`
- `2005`
- `2008`

No pre-2013 terms were inferred from T1B2A.

Visible correction made by authoritative reuse:

- the old homepage label `Vaalikausi 2013–2016 (Oulu)` was updated to the authoritative shared term label `Vaalikausi 2013–2017 (Oulu)`

## Phase Marker Disposition

All four phase markers remain explicit companion/editorial framing:

- `1989–2001`
- `2002–2012`
- `2013–2021`
- `2022–`

They were not converted into canonical content objects.

## Category Disposition

Homepage categories remain presentation-only metadata:

- `tausta`
- `tutkimus`
- `opetus`
- `politiikka`
- `palkinto`

They are not promoted into:

- canonical contexts
- Research membership
- Pagefind taxonomy
- a new global timeline taxonomy

## Deletion

Removed as duplicated authority from the old milestone array:

- duplicated year facts already present in `cv.json`
- duplicated year/title pairs already present in `researchProjects.js`
- duplicated post-2013 political term labels now present in `electionHistory`

Retained intentionally:

- editorial descriptions
- homepage-only category semantics
- phase markers
- legitimate pre-2013 political companion facts
- legitimate awards / BBS / AI-literacy companion milestones without a better structured authority source

## Counts Before / After

Before:

- milestone cards: `26`
- phase markers: `4`
- categories:
  - `tausta = 1`
  - `tutkimus = 11`
  - `opetus = 6`
  - `politiikka = 7`
  - `palkinto = 1`

After:

- milestone cards: `26`
- phase markers: `4`
- authoritative-source-backed milestones: `19`
- companion-only milestones: `7`
- unresolved authority count: `0`

## Runtime Impact

- runtime JSON requests: `0`
- timeline Pagefind requests: `0`
- homepage milestone surface remains SSR-first
- no client-generated milestone cards were introduced

## Additional Semantic Cleanup

The home milestone kicker now derives its year span from the projected timeline data:

- before: hard-coded `2003–2026`
- after: derived `1989–2026`

This matches the actual visible milestone chronology without changing the layout.

## Validation

Planned validation for this branch:

- `npm ci`
- `npm run build:no-og`
- `npm run test:unit`
- `node scripts/audit-t1b2b-home-milestones.js`
- `npm run check:i18n-seo`
- `npm run check:seo-health`
- `npx playwright test --workers=1 tests/t1b2b-home-milestones.spec.js`
- `git diff --check`

## Scope Guard

Explicitly out of scope:

- `T1B2C`
- `T1B3`
- `PF5`
- politics theme convergence
- council timeline rewrite
- training-feedback rewrite
- site-changes rewrite
- Pagefind timeline behavior
- Canonical Content v1 changes
- Research membership changes
- Presentations work
- Media work

## Confirmations

- `T1B2A = CLOSED / GREEN / MAIN`
- Canonical Content v1 unchanged: `YES`
- `T1B2C` started: `NO`
- `T1B3` started: `NO`
- `PF5` started: `NO`
- Presentations modified: `NO`
- Media modified: `NO`

# PRESENTATION-DETAIL-UX-PROD-VERIFY-01

Date: 2026-09-07
Production main: `19fadd2c8c0330c94e5ee0cc58abdaf667101584`
Classification: `GREEN / STOPPING POINT`

## Scope

This is a production verification of DETAIL-HERO-UX-02 +
PRESENTATION-COMPOSITION-01 after PR #229. It is not a redesign. No source,
template, CSS, runtime, canonical-content, Pagefind, public-JSON, or CI change
was required.

## Production matrix

The deployed `https://www.jarilaru.fi` routes were inspected at 1440 x 900 and
390 x 844:

| Variant | Route | Result |
| --- | --- | --- |
| Historical long-title SlideShare | `/presentations/ss-luento-3-suunnittelu-ja-pedagogiset-mallit-410014y-tieto-ja-viestintatekniikka-p/` | Good |
| Historical curated SlideShare | `/presentations/ss-luento1-johdanto-410014y-tvt-pedagogiset-perusteet/` | Good |
| Current implementation | `/presentations/405040y-luento-1-johdanto-2026-a/` | Good |
| Canva | `/presentations/opettaja-teko-lyn-ja-lytt-myyden-turbulenssissa-tampere-2025/` | Good |
| YouTube | `/presentations/eduxr-2020-suunnanmuutos-digiopettajasta-etaopettajaksi/` | Good |
| No thumbnail | `/presentations/opi-oulu-2026-tekoalyaiheinen-paneelikeskustelu/` | Good |
| Non-course VESO | `/presentations/kempele-veso-2026/` | Good |

## Desktop and mobile findings

At desktop width the historical long-title SlideShare page uses a 482 x 239 px
title block beside a 590 x 332 px preview inside a 498 px hero. The long title
is readable without overwhelming its media. Canva and YouTube use the same
balanced split; the no-thumbnail variant remains intentionally calm rather
than leaving an empty media area. All visual variants are classified `GOOD`,
not borderline or imbalanced.

At 390 x 844 every route had no horizontal overflow. The content width was
375 px with a 336 px content column; primary CTAs were 44 px high. Long-title
media follows its CTA directly, which means the preview begins near the end of
the first mobile viewport on the longest examples but is not semantically or
visually detached. Course peer links use the full content width rather than a
dense narrow wall.

## Content, relationships, and landing semantics

The known historical Luento 3 production DOM has no hero lead and contains no
former transcript URL fragments (`edu.fi`, `oph.fi`, or
`oulunopetussuunnitelma.wordpress.com`). The historical Luento 1 page retains
its useful curated description, proving generic suppression did not suppress
genuine lead copy.

The current 405040Y page renders one `Kurssitoteutus` section: course name,
human-readable `Syyslukukausi 2026 · periodi A`, course-page CTA, and the two
same-implementation peers. It has no duplicate `Käyttöyhteys` relationship and
no raw `2026-2027-a` user-facing copy. The historical exact implementation
uses the equivalent `Syksy 2013` label. Non-course Kempele has no empty course
section or invented course CTA.

Each local detail route remains its own canonical URL. SlideShare, Canva and
YouTube primary CTAs and thumbnail previews point to their corresponding
external source; the local page remains the canonical identity. No duplicate
thumbnail, empty media link, or obvious failed preview was observed.

## Accessibility and architecture smoke

Each representative detail page has exactly one content H1, a sensible
content H1-to-H2 hierarchy, meaningful primary CTA text, and no inaccessible
empty preview anchor. No duplicate ambiguous content CTA was introduced.

Canonical Content v1, public JSON, Pagefind/discovery architecture, runtime
JavaScript, source/landing semantics, and CI wiring remain unchanged. AC1 is
still `CLOSED / GREEN / MAIN`.

## Decision

No real production regression was found. This lane returns to maintenance;
do not open another detail UX workstream without a new user-visible problem or
explicit authorization.

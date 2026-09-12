# EMBEDDED-VIDEO-PRESENTATION-AUDIT-01

Status: VERIFIED / IMPLEMENTED / PENDING PR

Baseline: `origin/main = 0ab88f28303f97db2292c3f34ea3492215fb8a2c`

## Method and scope

Scanned `src/blog/`, `src/publications/`, `src/media/`, `src/fi/`, `src/en/`, and `src/presentations/` for YouTube (watch, short, embed and nocookie), Vimeo, Twitch and Facebook video URLs. YouTube host variants were normalized to a video ID; query parameters and duplicate embed/watch links were collapsed. `src/blog/_drafts/` was inspected but excluded from production counts because it is unpublished imported social-source material.

Published content contains 71 raw video URL occurrences and 50 normalized video/playlist identities. The raw all-source grep has 64 direct URL matches; the larger published occurrence count includes repeated links and recognised nocookie/Facebook/Twitch forms. Malformed legacy Markdown and playlist URLs are retained as evidence but are not promoted based on a guessed title.

## Classification

Primary, mutually-exclusive classification of the 50 normalized published identities:

| Class | Count | Reading |
| --- | ---: | --- |
| A. Presentation / lecture | 1 | Candidate verified from YouTube metadata and implemented below. |
| B. Media appearance | 15 | Interviews, webinar/media coverage and political/social video appearances. |
| C. Teaching / demo material | 7 | WordPress, Kandao and other instructional/demo clips. |
| D. Supporting media | 13 | Illustrative, archival, personal-history or speech-recording support. |
| E. Existing canonical record | 7 | Exact video-ID match to `src/presentations/`. |
| F. Ambiguous | 5 | Playlist, malformed legacy URL or insufficient context. |

Class E is also a relationship flag: exact IDs `nqHkzaIvYq8`, `t1ZWC3JiTdE`, `hCZ9lgODkes`, `tuYyBHPJybg`, `SoeW6zexrWQ`, `p1K6zoXdMs8`, and `GBdd45pn40g` are already owned by a presentation source record. `0cJ0Ed3Scs4` is an existing `curatedVideos` canonical presentation with external-source landing and an ITK context. `xTpiDVWSguc` is already referenced by the canonical SlideShare detail `/presentations/ss-mobiililaitteiden-mahdollisuudet-oppimisen-tukena/`, whose source description identifies that YouTube recording. Major media/interview IDs also already have `src/media/` ownership, including `OZTLGozgGl4`, `Am33gABJ540`, `q2K04VmN3sQ`, `76650uoBPL4`, `aBv_gCtrV2M`, `fcDjAZZZs4U`, `U4iFFFY3rhM` and `RyItZto47t8`.

## Missing presentation candidates

| Video | Source page | Evidence and probable metadata | Confidence | Metadata readiness |
| --- | --- | --- | --- | --- |
| `https://youtu.be/7LPyHCnuYJE` | `src/publications/matalan-kynnyksen-videot-osa-nykyaikaista-oppimisymparistoa.md` | Jari's recorded expert contribution for an Oulu learning-environment planning workshop. YouTube metadata confirms title, uploader and `2017-01-25` upload/publication date. | High | Implemented as a local presentation after direct source verification. |

No missing media candidate was established: candidates described as interview, media appearance, webinar coverage or social/political video are already media records or supporting media for a canonical writing/political page.

## Known video: 7LPyHCnuYJE

`7LPyHCnuYJE` is class **A: presentation / lecture**, not a reclassification of the containing column. Direct YouTube metadata identifies the video as *Millainen on nykyaikainen oppimisympäristö*, uploaded and published by Jari Laru on `2017-01-25T06:51:47-08:00`; the video is available and has the standard YouTube thumbnail. Its description says `Oppimisympäristön kehittäminen/workshop. Oulun yliopisto. L2. 26.1.2017`.

The canonical presentation uses `2017-01-25` as the source-verified publication/upload date, permitted by the Canonical Content v1 rule of using the most precise date the canonical layer can justify. The `26.1.2017` description marker is retained as workshop context rather than silently substituted as the source date: the source does not establish whether it is an event date, course label or scheduled session, and it follows the upload timestamp. The containing column remains a column and is not duplicated into the presentation.

## Recommendation

Smallest completed slice: one canonical curated-video source row with one local
presentation detail for `7LPyHCnuYJE`. The source row owns the YouTube identity
and links to the local detail route; it does not create a second source owner.
Do not create new records for `0cJ0Ed3Scs4` or `xTpiDVWSguc`.

## Verification

- Production `npm run build` completed on the updated main base.
- The generated `/data/presentations-page.json` has exactly one source item for
  `7LPyHCnuYJE`, with `landingType: localDetail`, local landing
  `/presentations/millainen-on-nykyaikainen-oppimisymparisto/`, and the same
  YouTube URL retained as `sourceUrl` and `externalUrl`.
- The generated detail HTML contains the verified title, `25.1.2017`, workshop
  event label and YouTube source URL.
- The local source declares no `contexts` or `courseContexts`. The existing
  shared resolver derives discovery contexts from every presentation's type and
  text signals; those derived values are not authored context membership and no
  resolver behavior was changed for this record.
- Focused canonical-projection test: PASS. Research.fi integrity: PASS.

Canonical Content v1 change required: **NO**. Existing presentation source, external-first landing and relation semantics are sufficient.

AC1 reopen evidence: **NO**. This is incomplete projection coverage, not duplicate canonical ownership or a contract violation.

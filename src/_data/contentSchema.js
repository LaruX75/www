const contentSchema = {
  version: "2026-07-18",
  description:
    "Controlled metadata layers for public content, roles, topics, contexts, and evidence links.",

  fieldGroups: {
    identity: [
      "title",
      "subtitle",
      "description",
      "date",
      "permalink",
      "canonical",
      "translationKey"
    ],
    kind: [
      "type",
      "contentType",
      "mediaType",
      "source",
      "sourceLabel"
    ],
    role: [
      "writingRoles",
      "opinionRoles",
      "mediaRole",
      "politicalProfiles"
    ],
    topics: [
      "categories",
      "keywords"
    ],
    context: [
      "contexts",
      "audience",
      "event",
      "venue",
      "organizer",
      "series"
    ],
    evidence: [
      "sourceUrl",
      "externalUrl",
      "agenda_item",
      "agenda_title",
      "agenda_url",
      "meeting",
      "bid",
      "youtubeId",
      "youtubeUrl",
      "playlistId",
      "relatedItems",
      "relatedEvent",
      "feedbackRefs"
    ]
  },

  vocabularies: {
    legacyTypes: [
      "artikkeli",
      "blogikirjoitus",
      "esitys",
      "kolumni",
      "lausunto",
      "mielipide",
      "puhe",
      "tieteellinen"
    ],
    contentTypes: [
      "article",
      "blogPost",
      "column",
      "initiative",
      "mediaItem",
      "opinion",
      "presentation",
      "scientificPublication",
      "speech",
      "statement",
      "thesis",
      "video"
    ],
    writingRoles: [
      "expert",
      "personal",
      "political"
    ],
    mediaRoles: [
      "about",
      "guest",
      "interviewer"
    ],
    mediaTypes: [
      "article",
      "podcast",
      "radio",
      "tv",
      "video"
    ],
    contexts: [
      "business",
      "education",
      "media",
      "open-science",
      "personal",
      "politics",
      "research",
      "teaching"
    ],
    politicalProfiles: [
      "avoinhallinto",
      "hyvinvointi",
      "kaupunkikehitys",
      "lahipalvelut",
      "sivistys",
      "yhteistyo"
    ],
    sources: [
      "aoe",
      "canva",
      "finna",
      "lausuntopalvelu",
      "local",
      "media",
      "ouka",
      "researchfi",
      "slideshare",
      "youtube"
    ]
  },

  collectionRules: {
    blog: {
      glob: "src/blog/*.md",
      required: ["title", "date"],
      recommended: ["categories", "keywords", "writingRoles"],
      arrayFields: ["categories", "keywords", "writingRoles", "politicalProfiles", "contexts"],
      controlled: {
        writingRoles: "writingRoles",
        politicalProfiles: "politicalProfiles",
        contexts: "contexts"
      }
    },
    publications: {
      glob: "src/publications/*.md",
      required: ["title", "date", "type"],
      recommended: ["categories", "keywords", "writingRoles"],
      arrayFields: ["categories", "keywords", "writingRoles", "opinionRoles", "politicalProfiles", "contexts"],
      controlled: {
        type: "legacyTypes",
        writingRoles: "writingRoles",
        opinionRoles: "writingRoles",
        politicalProfiles: "politicalProfiles",
        contexts: "contexts"
      },
      typeRecommendations: {
        lausunto: ["writingRoles", "sourceUrl"],
        mielipide: ["opinionRoles"],
        puhe: ["event"],
        tieteellinen: ["citation"]
      }
    },
    politics: {
      glob: "src/politics/*.md",
      required: ["title", "date"],
      recommended: ["categories", "keywords", "politicalProfiles"],
      arrayFields: ["categories", "keywords", "politicalProfiles", "contexts"],
      controlled: {
        politicalProfiles: "politicalProfiles",
        contexts: "contexts"
      }
    },
    media: {
      glob: "src/media/*.md",
      required: ["title", "mediaRole", "mediaType"],
      recommended: ["date", "mediaOutlet", "sourceUrl", "categories", "keywords", "contexts"],
      arrayFields: ["categories", "keywords", "contexts"],
      controlled: {
        mediaRole: "mediaRoles",
        mediaType: "mediaTypes",
        contexts: "contexts"
      }
    },
    presentations: {
      glob: "src/presentations/*.md",
      required: ["title", "date", "type"],
      recommended: ["source", "categories", "keywords", "contexts", "event", "audience"],
      arrayFields: ["categories", "keywords", "contexts", "audience", "relatedItems", "feedbackRefs"],
      controlled: {
        type: "legacyTypes",
        source: "sources",
        contexts: "contexts"
      }
    }
  }
};

module.exports = contentSchema;

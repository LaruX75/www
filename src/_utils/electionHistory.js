const { readCouncilMeetingCollections } = require("../_data/councilMeetings");
const toPublicContentRecord = require("./toPublicContentRecord");
const {
  compareTimelineItems,
  collectDuplicateFieldValues,
  projectCanonicalTimelineItem
} = require("./timelineProjection");

const POLITICAL_SPEECH_EVENTS = Object.freeze([
  "Oulun kaupunginvaltuusto",
  "Oulun kaupunginvaltuuston vierailu Oulun yliopistolla",
  "Oulun raati -yleisötilaisuus",
  "Uuden Oulun kuulemistilaisuus",
  "Kempeleen kunnan tilaisuus",
  "Porisuta porvaria koulutuksesta",
  "OSYK-lukion valtaus"
]);

const FAMILY_DEFINITIONS = Object.freeze([
  {
    key: "speeches",
    title: {
      fi: "Puheenvuorot",
      en: "Speeches"
    },
    emptyText: {
      fi: "Tälle kaudelle ei ole vielä koottu puheenvuoroja.",
      en: "No speeches have been grouped for this term yet."
    }
  },
  {
    key: "initiatives",
    title: {
      fi: "Valtuustoaloitteet ja vastaukset",
      en: "Council initiatives and responses"
    },
    emptyText: {
      fi: "Tälle kaudelle ei ole vielä koottu aloitteita.",
      en: "No council initiatives have been grouped for this term yet."
    }
  },
  {
    key: "opinions",
    title: {
      fi: "Mielipidekirjoitukset ja kolumnit",
      en: "Opinion pieces and columns"
    },
    emptyText: {
      fi: "Tälle kaudelle ei ole vielä koottu mielipidetekstejä.",
      en: "No opinion pieces or columns have been grouped for this term yet."
    }
  },
  {
    key: "otherPoliticalItems",
    title: {
      fi: "Muut relevantit sisällöt",
      en: "Other relevant political content"
    },
    emptyText: {
      fi: "Tälle kaudelle ei ole vielä koottu muita politiikkasisältöjä.",
      en: "No other political content has been grouped for this term yet."
    }
  }
]);

const EVENT_LABELS = Object.freeze({
  "Oulun kaupunginvaltuusto": { fi: "Oulun kaupunginvaltuusto", en: "Oulu City Council" },
  "Oulun kaupunginvaltuuston vierailu Oulun yliopistolla": {
    fi: "Oulun kaupunginvaltuuston vierailu Oulun yliopistolla",
    en: "Oulu City Council visit to the University of Oulu"
  },
  "Oulun raati -yleisötilaisuus": { fi: "Oulun raati -yleisötilaisuus", en: "Oulu public forum" },
  "Uuden Oulun kuulemistilaisuus": { fi: "Uuden Oulun kuulemistilaisuus", en: "Public hearing on new Oulu" },
  "Kempeleen kunnan tilaisuus": { fi: "Kempeleen kunnan tilaisuus", en: "Municipality of Kempele event" },
  "Porisuta porvaria koulutuksesta": { fi: "Porisuta porvaria koulutuksesta", en: "Porisuta porvaria koulutuksesta" },
  "OSYK-lukion valtaus": { fi: "OSYK-lukion valtaus", en: "OSYK upper secondary school occupation" }
});

const TYPE_LABELS = Object.freeze({
  puhe: { fi: "Puhe", en: "Speech" },
  mielipide: { fi: "Mielipidekirjoitus", en: "Opinion piece" },
  kolumni: { fi: "Kolumni", en: "Column" },
  tieteellinen: { fi: "Tieteellinen julkaisu", en: "Scholarly publication" },
  esitelma: { fi: "Esitelmä", en: "Presentation" },
  lausunto: { fi: "Lausunto", en: "Statement" },
  valtuustoaloite: { fi: "Valtuustoaloite", en: "Council initiative" },
  blog: { fi: "Blogikirjoitus", en: "Blog post" },
  publication: { fi: "Julkaisu", en: "Publication" }
});

const PAGE_VIEWS = Object.freeze({
  fi: {
    eyebrow: "Politiikka",
    title: "Vaalikaudet",
    lead: "Vaalikaudet kokoavat poliittisen työn monikuntaliitoksesta alkaen, jolloin minusta tuli taas oululainen. Puheenvuorot, valtuustoaloitteet, kyselytunnit ja kirjoitukset asettuvat kausien mukaan samaan ajalliseen yhteyteen.",
    heroList: [
      "vaalitulokset ja luottamustoimet kausittain",
      "valtuustopuheenvuorot, valtuustoaloitteet ja kyselytunnit omissa ryhmissään",
      "mielipidekirjoitukset ja muut relevantit politiikkasisällöt",
      "linkit kokouksiin, pöytäkirjoihin ja vanhoihin vaalisivuihin"
    ],
    heroCardTitle: "Mitä täältä löytyy",
    jumpAriaLabel: "Siirry vaalikauteen",
    currentBadge: "Kuluva vaalikausi",
    metaDisclosureTitle: "Vaalitulokset, luottamustoimet ja arkisto",
    contentDisclosureTitle: "Puheenvuorot, valtuustoaloitteet ja kirjoitukset",
    metaTitles: {
      results: "Vaalitulokset",
      roles: "Luottamustoimet",
      archives: "Arkisto ja kampanjasivut",
      council: "Kaupunginvaltuusto"
    },
    councilText: {
      countPrefix: "kokousta, joissa tällä vaalikaudella näkyy omaa valtuustotyötä.",
      empty: "Tälle vaalikaudelle ei ole vielä kytketty kaupunginvaltuuston kokouksia."
    },
    pageInfoTemplate: "Näytetään %FIRST%-%LAST% / %TOTAL%",
    pageButtonLabel: "Sivu",
    footerLinks: [
      { href: "/politiikka/", label: "Politiikka-sivulle", variant: "primary" },
      { href: "/poliittinen-avoimuus/", label: "Sidonnaisuudet ja vaalirahoitus", variant: "outline-primary" }
    ],
    otherCivicRolesTitle: "Muut yhteiskunnalliset roolit",
    showOtherCivicRoles: false
  },
  en: {
    eyebrow: "Politics",
    title: "Election History",
    lead: "This page groups the same election terms, campaign facts, council work, initiatives, speeches and other political writings into one shared chronology. It uses the same structural term model as the Finnish page, while preserving legitimate editorial companion facts.",
    heroList: [
      "election results and positions of trust by term",
      "council speeches, initiatives and responses in their own groups",
      "opinion pieces and other relevant political content",
      "links to campaigns, archives and council context"
    ],
    heroCardTitle: "What this page contains",
    jumpAriaLabel: "Jump to term",
    currentBadge: "Current term",
    metaDisclosureTitle: "Election results, positions of trust and archives",
    contentDisclosureTitle: "Speeches, initiatives and writings",
    metaTitles: {
      results: "Election results",
      roles: "Positions of trust",
      archives: "Archives and campaign pages",
      council: "City Council"
    },
    councilText: {
      countPrefix: "meetings in this term include visible council work on the site.",
      empty: "No City Council meetings have been linked to this term yet."
    },
    pageInfoTemplate: "Showing %FIRST%-%LAST% / %TOTAL%",
    pageButtonLabel: "Page",
    footerLinks: [
      { href: "/en/politics/", label: "Politics", variant: "primary" },
      { href: "/en/affiliations/", label: "Affiliations & disclosures", variant: "outline-primary" }
    ],
    otherCivicRolesTitle: "Other Civic Roles",
    showOtherCivicRoles: true
  }
});

const TERM_DEFINITIONS = Object.freeze([
  {
    id: "2025-2029",
    current: true,
    startDate: "2025-04-14",
    endDate: "",
    localized: {
      fi: {
        period: "2025–2029",
        title: "2. varavaltuutettu, sivistyslautakunnan jäsen sekä aluevaltuuston varajäsen",
        summary: "Kuluvalla vaalikaudella korostuvat maankäytön ja palveluverkon yhteys, alueellinen yhdenvertaisuus, valmistelun avoimuus sekä kaupungin ja yliopiston suhde. Esillä ovat yhtä aikaa Haukiputaan ja lähijunaliikenteen kaltaiset aluekysymykset, tietoon perustuva päätöksenteko ja opetuksen kehittäminen."
      },
      en: {
        period: "2025–2029",
        title: "2nd Deputy City Councillor, member of the Education Committee, and deputy member of the Wellbeing Area Council",
        summary: "The current term links land use, service-network decisions, regional equality, transparent preparation and the relationship between the city and the university. The grouped material ranges from local transport and district questions to evidence-based decision-making and the development of education."
      }
    },
    companion: {
      results: [
        {
          label: { fi: "Kuntavaalit 2025", en: "Municipal elections 2025" },
          detail: { fi: "Oulu, ehdokas 439", en: "Oulu, candidate 439" },
          result: { fi: "289 ääntä, valittu 2. varavaltuutetuksi", en: "289 votes, elected 2nd deputy city councillor" }
        },
        {
          label: { fi: "Aluevaalit 2025", en: "Wellbeing area elections 2025" },
          detail: { fi: "Pohjois-Pohjanmaa", en: "North Ostrobothnia" },
          result: { fi: "395 ääntä, valittu aluevaltuuston varajäseneksi", en: "395 votes, elected deputy member of the Wellbeing Area Council" }
        }
      ],
      roles: [
        {
          fi: "2. varavaltuutettu, Oulun kaupunginvaltuusto",
          en: "2nd Deputy City Councillor, Oulu City Council"
        },
        {
          fi: "Sivistyslautakunnan jäsen, Oulun kaupunki",
          en: "Member, Education Committee, City of Oulu"
        },
        {
          fi: "Aluevaltuuston varajäsen, Pohjois-Pohjanmaan hyvinvointialue",
          en: "Deputy member, North Ostrobothnia Wellbeing Area Council"
        }
      ],
      archives: [
        {
          href: { fi: "/kunta-ja-aluevaalit-2025/", en: "/en/municipal-and-wellbeing-elections-2025/" },
          label: { fi: "Vaalisivusto 2025", en: "Campaign archive 2025" }
        }
      ]
    }
  },
  {
    id: "2021-2025",
    current: false,
    startDate: "2021-06-14",
    endDate: "2025-04-13",
    localized: {
      fi: {
        period: "2021–2025",
        title: "Kaupunginvaltuutettu, sivistys- ja kulttuurilautakunnan jäsen sekä maakuntavaltuuston jäsen",
        summary: "Toinen valtuustokausi laajeni myös alueelliseen vaikuttamiseen, ja aineistossa painottuvat kaupungin suuret rakennekysymykset. Esillä ovat erityisesti palveluverkko, kampus- ja kaavaratkaisut, kulttuuri- ja hyvinvointipalvelut sekä avoimuus, tiedolla johtaminen ja aloitteiden seuranta."
      },
      en: {
        period: "2021–2025",
        title: "City Councillor, member of the Education & Culture Committee, and member of the Regional Council",
        summary: "The second council term extended into regional influence. The grouped material focuses on the city’s major structural questions: service networks, campus and zoning decisions, culture and wellbeing services, transparency, data-informed leadership and follow-up on initiatives."
      }
    },
    companion: {
      results: [
        {
          label: { fi: "Kuntavaalit 2021", en: "Municipal elections 2021" },
          detail: { fi: "Oulu, ehdokas 372", en: "Oulu, candidate 372" },
          result: { fi: "354 ääntä, valittu kaupunginvaltuutetuksi", en: "354 votes, elected City Councillor" }
        },
        {
          label: { fi: "Aluevaalit 2022", en: "Wellbeing area elections 2022" },
          detail: { fi: "Pohjois-Pohjanmaa, ehdokas 253", en: "North Ostrobothnia, candidate 253" },
          result: { fi: "436 ääntä, valittu aluevaltuuston varajäseneksi", en: "436 votes, elected deputy member of the Wellbeing Area Council" }
        }
      ],
      roles: [
        {
          fi: "Kaupunginvaltuutettu, Oulun kaupunki",
          en: "City Councillor, City of Oulu"
        },
        {
          fi: "Sivistys- ja kulttuurilautakunnan jäsen, Oulun kaupunki",
          en: "Member, Education & Culture Committee, City of Oulu"
        },
        {
          fi: "Maakuntavaltuuston jäsen, Pohjois-Pohjanmaan liitto",
          en: "Member, Regional Council of North Ostrobothnia"
        },
        {
          fi: "Aluevaltuuston varajäsen, Pohjois-Pohjanmaan hyvinvointialue",
          en: "Deputy member, North Ostrobothnia Wellbeing Area Council"
        }
      ],
      archives: [
        {
          href: { fi: "/kuntavaalit-2021/", en: "/kuntavaalit-2021/" },
          label: { fi: "Kuntavaalit 2021", en: "Campaign archive 2021" }
        },
        {
          href: { fi: "/jari-laru-aluevaltuustoon/", en: "/jari-laru-aluevaltuustoon/" },
          label: { fi: "Aluevaalit 2022", en: "Campaign archive 2022" }
        }
      ]
    }
  },
  {
    id: "2017-2021",
    current: false,
    startDate: "2017-04-10",
    endDate: "2021-06-13",
    localized: {
      fi: {
        period: "2017–2021",
        title: "Kaupunginvaltuutettu, sivistys- ja kulttuurilautakunnan jäsen sekä maakuntavaltuuston varavaltuutettu",
        summary: "Ensimmäinen valtuustokausi rakensi profiilia sivistyksen, alueellisen yhdenvertaisuuden ja valmistelun kriittisen tarkastelun varaan. Aineistossa toistuvat kouluverkko, kampusratkaisut, kaupunginosien tasapuolinen kehittäminen sekä kysymys siitä, miten päätöksiä perustellaan ja valmistellaan avoimesti."
      },
      en: {
        period: "2017–2021",
        title: "City Councillor, member of the Education & Culture Committee, and deputy member of the Regional Council",
        summary: "The first full council term built a profile around education, regional equality and critical scrutiny of preparation. School networks, campus decisions, balanced district development and transparent justification of decisions recur throughout the grouped material."
      }
    },
    companion: {
      results: [
        {
          label: { fi: "Kuntavaalit 2017", en: "Municipal elections 2017" },
          detail: { fi: "Oulu, ehdokas 36", en: "Oulu, candidate 36" },
          result: { fi: "168 ääntä, valittu kaupunginvaltuutetuksi", en: "168 votes, elected City Councillor" }
        }
      ],
      roles: [
        {
          fi: "Kaupunginvaltuutettu, Oulun kaupunki",
          en: "City Councillor, City of Oulu"
        },
        {
          fi: "Sivistys- ja kulttuurilautakunnan jäsen, Oulun kaupunki",
          en: "Member, Education & Culture Committee, City of Oulu"
        },
        {
          fi: "Maakuntavaltuuston varavaltuutettu, Pohjois-Pohjanmaan liitto",
          en: "Deputy member, Regional Council of North Ostrobothnia"
        },
        {
          fi: "Lähidemokratiatoimikunnan puheenjohtaja",
          en: "Chair, Local Democracy Committee"
        }
      ],
      archives: [
        {
          href: { fi: "/jari-laru-kaupunginvaltuutettu/", en: "/jari-laru-kaupunginvaltuutettu/" },
          label: { fi: "Arkistosivu 2017–2021", en: "Archive 2017–2021" }
        }
      ]
    }
  },
  {
    id: "2013-2017",
    current: false,
    startDate: "2013-01-01",
    endDate: "2017-04-09",
    localized: {
      fi: {
        period: "2013–2017",
        title: "Varavaltuutettu sekä lähidemokratiatoimikunnan puheenjohtaja",
        summary: "Monikuntaliitoksen jälkeinen ensimmäinen kausi painottui lähidemokratiaan, asukasvaikuttamiseen ja siihen, miten paikallinen ääni kuuluu suuressa Oulussa. Esillä ovat erityisesti Jäälin ja muiden alueiden palvelut, alueellinen osallisuus sekä uuden kaupungin tapa rakentaa luottamusta kuntalaisten suuntaan."
      },
      en: {
        period: "2013–2017",
        title: "Deputy City Councillor and chair of the Local Democracy Committee",
        summary: "The first post-merger term focused on local democracy, resident participation and how local voices are heard in a larger Oulu. The grouped material highlights services in Jääli and other districts, regional participation and the city’s effort to build trust after the merger."
      }
    },
    companion: {
      results: [
        {
          label: { fi: "Kunnallisvaalit 2012", en: "Municipal elections 2012" },
          detail: { fi: "Oulu, ehdokas 367", en: "Oulu, candidate 367" },
          result: { fi: "Valittu varavaltuutetuksi", en: "Elected deputy city councillor" }
        }
      ],
      roles: [
        {
          fi: "Varavaltuutettu, Oulun kaupunginvaltuusto",
          en: "Deputy City Councillor, Oulu City Council"
        },
        {
          fi: "Lähidemokratiatoimikunnan puheenjohtaja",
          en: "Chair, Local Democracy Committee"
        }
      ],
      archives: [
        {
          href: { fi: "/kunnallisvaalit-2012/", en: "/kunnallisvaalit-2012/" },
          label: { fi: "Kunnallisvaalit 2012", en: "Campaign archive 2012" }
        }
      ]
    }
  }
]);

const OTHER_CIVIC_ROLES = Object.freeze([
  {
    fi: "Oulun yliopiston kollegion jäsen (vuoden 2025 loppuun)",
    en: "Member, University Collegium, University of Oulu (until the end of 2025)"
  },
  {
    fi: "Jäälin asukasyhdistyksen puheenjohtaja (2000-luku)",
    en: "Chair, residents' association, Jääli district, Oulu (2000s)"
  },
  {
    fi: "Oulun yliopiston ylioppilaskunnan hallituksen jäsen (OYY), 2000",
    en: "Member, Student Union Board, University of Oulu Students' Union (OYY), 2000"
  }
]);

const SOURCE_COLLECTIONS = Object.freeze(["blog", "publications", "politics"]);

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function localizedText(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return pickString(value[lang]) || pickString(value.fi) || pickString(value.en);
}

function localizedLinkHref(value, lang) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return pickString(value[lang]) || pickString(value.fi) || pickString(value.en);
}

function itemInTermRange(item, term) {
  if (!item?.date) return false;
  if (String(item.date) < term.startDate) return false;
  if (term.endDate && String(item.date) > term.endDate) return false;
  return true;
}

function familyMetaSegments(item, familyKey) {
  switch (familyKey) {
    case "speeches":
      return {
        fi: [localizedText(EVENT_LABELS[item.event], "fi") || item.event],
        en: [localizedText(EVENT_LABELS[item.event], "en") || item.event]
      };
    case "initiatives": {
      const initiativeLabel = localizedText(TYPE_LABELS[item.initiativeType || "valtuustoaloite"], "fi")
        || localizedText(TYPE_LABELS.valtuustoaloite, "fi");
      const initiativeLabelEn = localizedText(TYPE_LABELS[item.initiativeType || "valtuustoaloite"], "en")
        || localizedText(TYPE_LABELS.valtuustoaloite, "en");
      return {
        fi: [initiativeLabel, item.meeting].filter(Boolean),
        en: [initiativeLabelEn, item.meeting].filter(Boolean)
      };
    }
    case "opinions":
      return {
        fi: [localizedText(TYPE_LABELS[item.sourceType], "fi") || item.sourceType],
        en: [localizedText(TYPE_LABELS[item.sourceType], "en") || item.sourceType]
      };
    case "otherPoliticalItems":
    default: {
      const labelKey = item.sourceType || (item.sourceCollection === "blog" ? "blog" : "publication");
      return {
        fi: [localizedText(TYPE_LABELS[labelKey], "fi") || item.sourceType || ""].filter(Boolean),
        en: [localizedText(TYPE_LABELS[labelKey], "en") || item.sourceType || ""].filter(Boolean)
      };
    }
  }
}

function localizeArchiveLink(link) {
  return {
    href: {
      fi: localizedLinkHref(link.href, "fi"),
      en: localizedLinkHref(link.href, "en")
    },
    label: {
      fi: localizedText(link.label, "fi"),
      en: localizedText(link.label, "en")
    }
  };
}

function localizeCompanion(term) {
  return {
    fi: {
      period: term.localized.fi.period,
      title: term.localized.fi.title,
      summary: term.localized.fi.summary,
      results: toArray(term.companion.results).map((result) => ({
        label: localizedText(result.label, "fi"),
        detail: localizedText(result.detail, "fi"),
        result: localizedText(result.result, "fi")
      })),
      roles: toArray(term.companion.roles).map((role) => localizedText(role, "fi")),
      archives: toArray(term.companion.archives).map((link) => ({
        href: localizedLinkHref(link.href, "fi"),
        label: localizedText(link.label, "fi")
      }))
    },
    en: {
      period: term.localized.en.period,
      title: term.localized.en.title,
      summary: term.localized.en.summary,
      results: toArray(term.companion.results).map((result) => ({
        label: localizedText(result.label, "en"),
        detail: localizedText(result.detail, "en"),
        result: localizedText(result.result, "en")
      })),
      roles: toArray(term.companion.roles).map((role) => localizedText(role, "en")),
      archives: toArray(term.companion.archives).map((link) => {
        const href = localizedLinkHref(link.href, "en");
        const label = localizedText(link.label, "en");
        return {
          href,
          label: href.startsWith("/en/") ? label : `${label} (Finnish)`
        };
      })
    }
  };
}

function sortItems(items = []) {
  return [...toArray(items)].sort(compareTimelineItems);
}

function projectElectionHistoryCanonicalItem(item = {}, sourceCollection = "") {
  const publicRecord = toPublicContentRecord(item);
  if (!publicRecord) {
    return {
      ok: false,
      sourceCollection,
      reason: "missing-public-record",
      input: {
        title: pickString(item?.data?.title),
        pageUrl: pickString(item?.url)
      }
    };
  }

  const projected = projectCanonicalTimelineItem(publicRecord, { sourceCollection });
  if (!projected.ok) return projected;

  return {
    ok: true,
    item: {
      ...projected.item,
      sourceCollection,
      sourceType: pickString(item?.data?.type),
      event: pickString(item?.data?.event),
      meeting: pickString(item?.data?.meeting),
      initiativeType: pickString(item?.data?.initiative_type),
      politicalProfiles: toArray(publicRecord.politicalProfiles)
    }
  };
}

function buildCanonicalCorpus(rawCollections = {}) {
  const items = [];
  const excluded = [];

  SOURCE_COLLECTIONS.forEach((sourceCollection) => {
    toArray(rawCollections[sourceCollection]).forEach((item) => {
      const projected = projectElectionHistoryCanonicalItem(item, sourceCollection);
      if (projected.ok) {
        items.push(projected.item);
        return;
      }
      excluded.push(projected);
    });
  });

  const duplicateIds = collectDuplicateFieldValues(items, "id");
  const duplicatePageUrls = collectDuplicateFieldValues(items, "pageUrl");
  if (duplicateIds.length) {
    const error = new Error("duplicate canonical ids detected in election history corpus");
    error.code = "duplicate-identity";
    error.values = duplicateIds;
    throw error;
  }
  if (duplicatePageUrls.length) {
    const error = new Error("duplicate canonical pageUrls detected in election history corpus");
    error.code = "duplicate-pageUrl";
    error.values = duplicatePageUrls;
    throw error;
  }

  return {
    items: sortItems(items),
    excluded,
    duplicateIds,
    duplicatePageUrls
  };
}

function assertNoDuplicateFamilyItems(items = [], termId = "", familyKey = "") {
  const duplicateIds = collectDuplicateFieldValues(items, "id");
  const duplicatePageUrls = collectDuplicateFieldValues(items, "pageUrl");
  if (!duplicateIds.length && !duplicatePageUrls.length) return;

  const error = new Error(`duplicate canonical item detected in election history term=${termId} family=${familyKey}`);
  error.code = "duplicate-election-history-family-items";
  error.termId = termId;
  error.familyKey = familyKey;
  error.duplicateIds = duplicateIds;
  error.duplicatePageUrls = duplicatePageUrls;
  throw error;
}

function isSpeechItem(item) {
  return item.sourceCollection === "publications"
    && item.sourceType === "puhe"
    && POLITICAL_SPEECH_EVENTS.includes(item.event);
}

function isInitiativeItem(item) {
  return item.sourceCollection === "politics";
}

function isOpinionItem(item) {
  return item.sourceCollection === "publications"
    && ["mielipide", "kolumni"].includes(item.sourceType);
}

function isOtherPoliticalItem(item) {
  if (!item.politicalProfiles.length) return false;
  if (item.sourceCollection === "blog") return true;
  return item.sourceCollection === "publications"
    && !["puhe", "mielipide", "kolumni"].includes(item.sourceType);
}

function buildRenderableItems(items = [], familyKey = "") {
  return sortItems(items).map((item) => ({
    id: item.id,
    pageUrl: item.pageUrl,
    title: item.title,
    date: item.date,
    year: item.year,
    contentType: item.contentType,
    contexts: item.contexts,
    metaSegments: familyMetaSegments(item, familyKey)
  }));
}

function buildElectionHistoryProjection({
  canonicalItems = [],
  councilMeetings = [],
  termDefinitions = TERM_DEFINITIONS
} = {}) {
  const terms = termDefinitions.map((term) => {
    const speeches = canonicalItems.filter((item) => itemInTermRange(item, term) && isSpeechItem(item));
    const initiatives = canonicalItems.filter((item) => itemInTermRange(item, term) && isInitiativeItem(item));
    const opinions = canonicalItems.filter((item) => itemInTermRange(item, term) && isOpinionItem(item));
    const otherPoliticalItems = canonicalItems.filter((item) => itemInTermRange(item, term) && isOtherPoliticalItem(item));
    const termCouncilMeetings = sortItems(
      toArray(councilMeetings).filter((meeting) => itemInTermRange({ date: meeting.date }, term)).map((meeting) => ({
        ...meeting,
        pageUrl: "/politiikka/kaupunginvaltuusto/"
      }))
    );

    assertNoDuplicateFamilyItems(speeches, term.id, "speeches");
    assertNoDuplicateFamilyItems(initiatives, term.id, "initiatives");
    assertNoDuplicateFamilyItems(opinions, term.id, "opinions");
    assertNoDuplicateFamilyItems(otherPoliticalItems, term.id, "otherPoliticalItems");

    return {
      id: term.id,
      current: Boolean(term.current),
      startDate: term.startDate,
      endDate: term.endDate,
      localized: localizeCompanion(term),
      counts: {
        results: toArray(term.companion.results).length,
        roles: toArray(term.companion.roles).length,
        archives: toArray(term.companion.archives).length,
        councilMeetings: termCouncilMeetings.length,
        speeches: speeches.length,
        initiatives: initiatives.length,
        opinions: opinions.length,
        otherPoliticalItems: otherPoliticalItems.length
      },
      canonicalFamilies: {
        speeches: buildRenderableItems(speeches, "speeches"),
        initiatives: buildRenderableItems(initiatives, "initiatives"),
        opinions: buildRenderableItems(opinions, "opinions"),
        otherPoliticalItems: buildRenderableItems(otherPoliticalItems, "otherPoliticalItems")
      },
      councilMeetings: termCouncilMeetings
    };
  });

  return {
    termIds: terms.map((term) => term.id),
    termCount: terms.length,
    familyDefinitions: FAMILY_DEFINITIONS,
    terms,
    familyTotals: terms.reduce((totals, term) => ({
      speeches: totals.speeches + term.counts.speeches,
      initiatives: totals.initiatives + term.counts.initiatives,
      opinions: totals.opinions + term.counts.opinions,
      otherPoliticalItems: totals.otherPoliticalItems + term.counts.otherPoliticalItems,
      councilMeetings: totals.councilMeetings + term.counts.councilMeetings
    }), {
      speeches: 0,
      initiatives: 0,
      opinions: 0,
      otherPoliticalItems: 0,
      councilMeetings: 0
    })
  };
}

function buildElectionHistoryData({
  rawCollections = readCouncilMeetingCollections(),
  councilMeetings = null
} = {}) {
  const resolvedCouncilMeetings = Array.isArray(councilMeetings)
    ? councilMeetings
    : require("../_data/councilMeetings")();
  const corpus = buildCanonicalCorpus(rawCollections);
  const projection = buildElectionHistoryProjection({
    canonicalItems: corpus.items,
    councilMeetings: resolvedCouncilMeetings
  });

  return {
    views: PAGE_VIEWS,
    familyDefinitions: FAMILY_DEFINITIONS,
    pagination: {
      pageSize: 3,
      enabled: true
    },
    termCount: projection.termCount,
    termIds: projection.termIds,
    terms: projection.terms,
    familyTotals: projection.familyTotals,
    otherCivicRoles: {
      fi: OTHER_CIVIC_ROLES.map((item) => item.fi),
      en: OTHER_CIVIC_ROLES.map((item) => item.en)
    },
    canonicalCorpus: {
      sourceCollections: SOURCE_COLLECTIONS,
      projectedCount: corpus.items.length,
      excludedCount: corpus.excluded.length,
      duplicateIds: corpus.duplicateIds,
      duplicatePageUrls: corpus.duplicatePageUrls
    },
    routeParity: {
      fi: "/politiikka/vaalikaudet/",
      en: "/en/election-history/",
      legacyFi: "/vaalihistoria/"
    }
  };
}

module.exports = {
  POLITICAL_SPEECH_EVENTS,
  FAMILY_DEFINITIONS,
  TERM_DEFINITIONS,
  OTHER_CIVIC_ROLES,
  PAGE_VIEWS,
  itemInTermRange,
  familyMetaSegments,
  projectElectionHistoryCanonicalItem,
  buildCanonicalCorpus,
  buildElectionHistoryProjection,
  buildElectionHistoryData
};

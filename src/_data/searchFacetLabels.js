"use strict";

const contentTypeLabel = require("../_utils/contentTypeLabel");
const { publicationGroupLabel } = require("../_utils/publicationsFindExplore");

const CONTENT_TYPE_VALUE_LABELS = {
  fi: {
    "Julkaisut": "Julkaisut",
    "Kirjoitukset ja puheenvuorot": "Kirjoitukset ja puheenvuorot",
    "Opinnäytteet": "Opinnäytteet",
    "Mediassa": "Mediassa",
    "Esitykset": "Esitykset"
  },
  en: {
    "Julkaisut": "Publications",
    "Kirjoitukset ja puheenvuorot": "Writings and speeches",
    "Opinnäytteet": "Theses",
    "Mediassa": "Media",
    "Esitykset": "Presentations"
  }
};

const PUBLICATION_QUALITY_LABELS = {
  fi: {
    "peer-reviewed": "Vertaisarvioitu",
    "open-access": "Open access"
  },
  en: {
    "peer-reviewed": "Peer-reviewed",
    "open-access": "Open access"
  }
};

const WRITINGS_CONTENT_TYPE_LABELS = {
  fi: {
    opinion: "Mielipiteet",
    column: "Kolumnit",
    blogPost: "Blogi",
    speech: "Puheenvuorot",
    statement: "Lausunnot",
    initiative: "Valtuustoaloitteet",
    scientificPublication: "Julkaisut"
  },
  en: {
    opinion: "Opinions",
    column: "Columns",
    blogPost: "Blog",
    speech: "Speeches",
    statement: "Statements",
    initiative: "Initiatives",
    scientificPublication: "Publications"
  }
};

const THESES_TYPE_LABELS = {
  fi: {
    masterThesis: "Pro gradu -tutkielmat",
    bachelorThesis: "Kandidaatintyöt",
    doctoralThesis: "Väitöskirjat",
    licentiateThesis: "Lisensiaatintutkielmat"
  },
  en: {
    masterThesis: "Master's theses",
    bachelorThesis: "Bachelor's theses",
    doctoralThesis: "Doctoral dissertations",
    licentiateThesis: "Licentiate theses"
  }
};

const THESES_ROLE_LABELS = {
  fi: {
    advised: "Ohjatut",
    reviewed: "Tarkastetut"
  },
  en: {
    advised: "Supervised",
    reviewed: "Reviewed"
  }
};

function buildPresentationDefaults(lang) {
  return {
    statement: contentTypeLabel({ type: "lausunto" }, [], lang),
    column: contentTypeLabel({ type: "kolumni" }, [], lang),
    speech: contentTypeLabel({ type: "puhe" }, [], lang),
    blogPost: contentTypeLabel({ type: "blogikirjoitus" }, [], lang)
  };
}

function buildLocaleLabels(lang) {
  const locale = lang === "en" ? "en" : "fi";
  return {
    "Sisältö": { ...CONTENT_TYPE_VALUE_LABELS[locale] },
    "Publications group": {
      A: publicationGroupLabel("A", locale),
      B: publicationGroupLabel("B", locale),
      C: publicationGroupLabel("C", locale),
      D: publicationGroupLabel("D", locale),
      E: publicationGroupLabel("E", locale),
      G: publicationGroupLabel("G", locale)
    },
    "Publications quality": { ...PUBLICATION_QUALITY_LABELS[locale] },
    "Writings content type": {
      ...buildPresentationDefaults(locale),
      ...WRITINGS_CONTENT_TYPE_LABELS[locale]
    },
    "Theses type": { ...THESES_TYPE_LABELS[locale] },
    "Theses role": { ...THESES_ROLE_LABELS[locale] }
  };
}

module.exports = {
  fi: buildLocaleLabels("fi"),
  en: buildLocaleLabels("en")
};

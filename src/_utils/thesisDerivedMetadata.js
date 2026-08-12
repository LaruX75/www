const { resolveContexts } = require("../_data/contentContext");
const { normalizeCategoryList } = require("../_data/metadata-normalization");

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function addMappedValues(target, values, mapping) {
  toArray(values).forEach((value) => {
    toArray(mapping[value]).forEach((mapped) => target.add(mapped));
  });
}

function buildSignalText(thesis = {}) {
  return [
    thesis.title,
    thesis.abstract,
    ...toArray(thesis.keywords),
    ...toArray(thesis.subjects)
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function hasAnySignal(text, terms) {
  return terms.some((term) => text.includes(term));
}

function hasAnyPatternSignal(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function hasTeachingCategorySignal(categories = []) {
  return categories.includes("Opettajankoulutus");
}

const TEACHING_SIGNAL_PATTERNS = [
  /\bopetta[a-z]*/,
  /\bopettami[a-z]*/,
  /\bopetusty[a-z]*/,
  /\bopetustilan[a-z]*/,
  /\bpedagogiik[a-z]*/,
  /\blesson\b/,
  /\bteaching\b/,
  /\bcurriculum\b/,
  /\bdidakti[a-z]*/,
  /\boppitunti[a-z]*/,
  /\binstruction\b/,
  /teacher education/,
  /\bopettajankoulut[a-z]*/
];

const CATEGORY_SEEDS_BY_RESEARCH_LINE = {
  "ai-literacy": ["Tekoäly"],
  "teacher-education": ["Opettajankoulutus"],
  "long-term-learning": ["Koulutusteknologia"]
};

const CATEGORY_SEEDS_BY_THEME = {
  "tekoalylukutaito": ["Tekoäly"],
  "tekoaly-opetuksessa": ["Tekoäly"],
  "selitettava-tekoaly": ["Tekoäly"],
  "koneoppiminen": ["Tekoäly"],
  "opettajankoulutus": ["Opettajankoulutus"],
  "digipedagogiikka": ["Koulutusteknologia"],
  "yhteisollinen-oppiminen": ["Koulutusteknologia"],
  "cscl": ["Koulutusteknologia"],
  "mobiilioppiminen": ["Koulutusteknologia"],
  "oppimisymparistot": ["Koulutusteknologia"],
  "steam": ["STEAM"],
  "teknologiakasvatus": ["Teknologia ja digitaalisuus"],
  "ohjelmoinnillinen-ajattelu": ["Teknologia ja digitaalisuus"],
  "ohjelmointi": ["Teknologia ja digitaalisuus"],
  "tietosuoja": ["Teknologia ja digitaalisuus"]
};

const CATEGORY_SEEDS_BY_AUDIENCE = {
  "varhaiskasvatus": ["Varhaiskasvatus"],
  "esi-ja-alkuopetus": ["Perusopetus"],
  "esi-ja-perusopetus": ["Perusopetus"],
  "perusopetus": ["Perusopetus"],
  "opettajankoulutus": ["Opettajankoulutus", "Yliopisto ja korkeakoulut"],
  "korkeakoulutus": ["Yliopisto ja korkeakoulut"]
};

const CATEGORY_SIGNAL_RULES = [
  {
    terms: ["tekoaly", "tekoalylyukutaito", "artificial intelligence", "machine learning", "generative ai", "generatiivinen tekoaly"],
    categories: ["Tekoäly"]
  },
  {
    terms: ["steam"],
    categories: ["STEAM"]
  },
  {
    terms: ["varhaiskasvat", "paivakot", "lastentarhan"],
    categories: ["Varhaiskasvatus"]
  },
  {
    terms: ["perusopet", "peruskoulu", "ylakoulu", "alakoulu", "6-luok", "k-12", "k12", "k-9"],
    categories: ["Perusopetus"]
  },
  {
    terms: ["opettajankoulut", "opettajaopiskel", "teacher education", "preservice teacher", "student teacher"],
    categories: ["Opettajankoulutus", "Yliopisto ja korkeakoulut"]
  },
  {
    terms: [
      "monilukutaito",
      "lukutaito",
      "media literacy",
      "mediakasvatus",
      "opetussuunnitelm",
      "curriculum",
      "media education"
    ],
    categories: ["Sivistys ja koulutus"]
  },
  {
    terms: ["higher education", "korkeakoulu", "university", "master's degree", "masters degree", "college student", "college students"],
    categories: ["Yliopisto ja korkeakoulut"]
  },
  {
    terms: [
      "oppimisymparist",
      "learning environment",
      "luokkahuone",
      "classroom",
      "kouluymparisto",
      "oppimisalusta",
      "learning management system",
      "lms",
      "mooc",
      "museo",
      "museum",
      "nayttely"
    ],
    categories: ["Oppimisympäristöt ja tilat"]
  },
  {
    terms: ["digita", "mobiili", "ict", "verkko", "online", "virtual", "teknolog", "sovellus", "app", "social media", "sosiaalinen media", "peli", "game", "ohjelm", "algoritm", "roboti"],
    categories: ["Koulutusteknologia"]
  },
  {
    terms: ["ict", "teknolog", "digita", "ohjelm", "algoritm", "roboti", "tietosuoja"],
    categories: ["Teknologia ja digitaalisuus"]
  }
];

function deriveThesisCategories(thesis = {}) {
  const categories = new Set();
  const signalText = buildSignalText(thesis);

  addMappedValues(categories, [thesis.researchLine], CATEGORY_SEEDS_BY_RESEARCH_LINE);
  addMappedValues(categories, thesis.researchThemes, CATEGORY_SEEDS_BY_THEME);
  addMappedValues(categories, thesis.researchAudience, CATEGORY_SEEDS_BY_AUDIENCE);
  CATEGORY_SIGNAL_RULES.forEach((rule) => {
    if (hasAnySignal(signalText, rule.terms)) {
      rule.categories.forEach((category) => categories.add(category));
    }
  });

  return normalizeCategoryList(Array.from(categories));
}

function deriveThesisContexts(thesis = {}, categories = deriveThesisCategories(thesis)) {
  const signalText = buildSignalText(thesis);
  const contexts = new Set(["research"]);

  if (categories.some((category) => [
    "Perusopetus",
    "Varhaiskasvatus",
    "Opettajankoulutus",
    "Yliopisto ja korkeakoulut"
  ].includes(category))) {
    contexts.add("education");
  }

  if (
    hasTeachingCategorySignal(categories) ||
    hasAnyPatternSignal(signalText, TEACHING_SIGNAL_PATTERNS)
  ) {
    contexts.add("teaching");
  }

  return resolveContexts({
    contexts: Array.from(contexts)
  }, `/virtual/theses/${thesis.link || "unknown"}.json`);
}

function deriveThesisMetadata(thesis = {}) {
  const categories = deriveThesisCategories(thesis);
  const contexts = deriveThesisContexts(thesis, categories);
  return { categories, contexts };
}

module.exports = {
  deriveThesisCategories,
  deriveThesisContexts,
  deriveThesisMetadata
};

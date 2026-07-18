const contentSchema = require("./contentSchema");

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function normalizePlain(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const CONTEXT_ALIASES = {
  asiantuntija: "education",
  business: "business",
  education: "education",
  koulutus: "education",
  media: "media",
  mediassa: "media",
  open: "open-science",
  "open-science": "open-science",
  opetus: "teaching",
  personal: "personal",
  politics: "politics",
  poliittinen: "politics",
  politiikka: "politics",
  research: "research",
  tutkimus: "research",
  teaching: "teaching",
  tyo: "business",
  yritys: "business"
};

const CONTEXT_META = {
  business: {
    label: { fi: "Koulutus ja puhetyö", en: "Training and speaking" },
    href: { fi: "/kouluttaja/", en: "/en/company/" }
  },
  education: {
    label: { fi: "Kasvatus ja koulutus", en: "Education" },
    href: { fi: "/tyoni-yliopistonlehtorina/", en: "/en/research/" }
  },
  media: {
    label: { fi: "Mediassa", en: "Media" },
    href: { fi: "/mediassa/", en: "/en/" }
  },
  "open-science": {
    label: { fi: "Avoin tiede", en: "Open science" },
    href: { fi: "/tutkimus/", en: "/en/research/" }
  },
  personal: {
    label: { fi: "Henkilökohtainen", en: "Personal" },
    href: { fi: "/tietoa/", en: "/en/about/" }
  },
  politics: {
    label: { fi: "Politiikka", en: "Politics" },
    href: { fi: "/politiikka/", en: "/en/politics/" }
  },
  research: {
    label: { fi: "Tutkimus", en: "Research" },
    href: { fi: "/tutkimus/", en: "/en/research/" }
  },
  teaching: {
    label: { fi: "Opetus", en: "Teaching" },
    href: { fi: "/tyoni-yliopistonlehtorina/", en: "/en/research/" }
  }
};

const CONTEXT_ORDER = contentSchema.vocabularies.contexts;

function normalizeContext(value) {
  const normalized = normalizePlain(value);
  const context = CONTEXT_ALIASES[normalized] || normalized;
  return CONTEXT_ORDER.includes(context) ? context : "";
}

function normalizeContextList(values) {
  const seen = new Set();
  const contexts = [];

  toArray(values).forEach((value) => {
    const context = normalizeContext(value);
    if (!context || seen.has(context)) return;
    seen.add(context);
    contexts.push(context);
  });

  return contexts;
}

function includesAny(values, terms) {
  const haystack = toArray(values).map(normalizePlain);
  return terms.some((term) => haystack.includes(normalizePlain(term)));
}

function containsAnyText(values, terms) {
  const haystack = toArray(values).join(" ").toLowerCase();
  return terms.some((term) => haystack.includes(term.toLowerCase()));
}

function addContext(set, value) {
  const context = normalizeContext(value);
  if (context) set.add(context);
}

function inferContexts(data = {}, inputPath = "") {
  const contexts = new Set();
  const categories = toArray(data.categories);
  const keywords = toArray(data.keywords);
  const roles = [...toArray(data.writingRoles), ...toArray(data.opinionRoles)];
  const textSignals = [
    data.title,
    data.description,
    data.event,
    data.venue,
    data.source,
    data.sourceLabel,
    ...categories,
    ...keywords
  ];

  if (inputPath.includes("/media/") || data.mediaRole || data.mediaType) {
    addContext(contexts, "media");
  }

  if (inputPath.includes("/presentations/") || data.type === "esitys") {
    addContext(contexts, "teaching");
  }

  if (inputPath.includes("/politics/") || toArray(data.politicalProfiles).length) {
    addContext(contexts, "politics");
  }

  if (roles.includes("political")) {
    addContext(contexts, "politics");
  }
  if (roles.includes("expert") || data.type === "lausunto") {
    addContext(contexts, "education");
  }
  if (roles.includes("personal")) {
    addContext(contexts, "personal");
  }

  if (data.type === "tieteellinen" || containsAnyText(textSignals, [
    "tutkimus",
    "research",
    "vertaisarvioitu",
    "journal",
    "conference"
  ])) {
    addContext(contexts, "research");
  }

  if (containsAnyText(textSignals, [
    "avoin tiede",
    "avoin oppiminen",
    "avoimet oppimateriaalit",
    "open science",
    "creative commons"
  ])) {
    addContext(contexts, "open-science");
  }

  if (containsAnyText(textSignals, [
    "opettajankoulutus",
    "opetus",
    "oppiminen",
    "tekoälylukutaito",
    "tekoalylukutaito",
    "koulutusteknologia",
    "digipedagogiikka",
    "luento",
    "harjoitus"
  ])) {
    addContext(contexts, "teaching");
  }

  if (containsAnyText(textSignals, [
    "veso",
    "täydennyskoulutus",
    "taydennyskoulutus",
    "kouluttaja",
    "keynote",
    "webinaari",
    "workshop"
  ])) {
    addContext(contexts, "business");
  }

  if (includesAny(categories, [
    "Politiikka ja päätöksenteko",
    "Vaalit",
    "Kaupunkikehitys ja palveluverkko"
  ])) {
    addContext(contexts, "politics");
  }

  if (includesAny(categories, [
    "Koulutusteknologia",
    "Yliopisto ja korkeakoulut",
    "Sivistys ja koulutus"
  ])) {
    addContext(contexts, "education");
  }

  if (includesAny(categories, ["Matkat ja henkilökohtaiset"])) {
    addContext(contexts, "personal");
  }

  return CONTEXT_ORDER.filter((context) => contexts.has(context));
}

function resolveContexts(data = {}, inputPath = "") {
  const contexts = new Set([
    ...normalizeContextList(data.contexts),
    ...inferContexts(data, inputPath || data.page?.inputPath || data.inputPath || "")
  ]);

  return CONTEXT_ORDER.filter((context) => contexts.has(context));
}

function getContextMeta(context, lang = "fi") {
  const key = normalizeContext(context);
  const meta = CONTEXT_META[key] || CONTEXT_META.education;
  return {
    key,
    label: meta.label[lang] || meta.label.fi,
    href: meta.href[lang] || meta.href.fi
  };
}

module.exports = {
  CONTEXT_META,
  CONTEXT_ORDER,
  getContextMeta,
  inferContexts,
  normalizeContext,
  normalizeContextList,
  resolveContexts
};

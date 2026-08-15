/**
 * contentPresets.js — isomorfinen headless content/filter engine.
 *
 * Yksi tiedosto, kaksi käyttötapaa:
 *   1. Node.js (Eleventy build): `.eleventy.js` requireaa tämän ja rekisteröi
 *      Nunjucks-filtterin `preset`. SSR-avausjoukko käyttää PRESETS-määrittelyä
 *      Eleventy-collection-itemejä vastaan.
 *   2. Selain: `.eleventy.js` addPassthroughCopy-kaudella tämä tiedosto
 *      kopioituu `_site/js/content-presets.js`:iin, josta sivut lataavat sen
 *      <script>-tagilla. window.ContentPresets tarjoaa saman API:n
 *      normalisoituja /data/*.json-recordeja vastaan.
 *
 * Yhteinen määrittely:
 *   - FIELD_RULES: sallitut suodatinkentät ja niiden semantiikka
 *   - PRESETS: nimetyt query-konfiguraatiot
 *   - KIND_MATCHERS: 4 suodatustyyppiä (eq, oneOf, anyOf, yearRange)
 *
 * Suoritus (kaksi käynnistintä, sama ydin):
 *   - applyPresetToCollection(collections, presetName, overrides) — Node
 *   - queryPreset(items, presetName, overrides) — Selain
 *   - queryItems(items, spec, options) — molemmilla puolilla käytetty core
 *
 * search-parametri on selain-only (Nunjucks ei osaa vapaatekstihakua).
 */

// -----------------------------------------------------------------------------
// LEGACY_TYPE_MAP — sama kuin src/_utils/resolveContentMeta.js:n
// LEGACY_TYPE_TO_CONTENT_TYPE. Duplikoidaan tähän jotta moduli on
// browser-yhteensopiva (ei require-kutsuja).
// -----------------------------------------------------------------------------
const LEGACY_TYPE_MAP = {
  artikkeli: "article",
  blogikirjoitus: "blogPost",
  esitys: "presentation",
  kolumni: "column",
  lausunto: "statement",
  mielipide: "opinion",
  puhe: "speech",
  tieteellinen: "scientificPublication"
};

// -----------------------------------------------------------------------------
// ENDPOINTS — /data/*.json -endpointtien nimet ja URL:t. Selainpuolen
// content-engine.js käyttää tätä fetch-kohteen resolvointiin.
// -----------------------------------------------------------------------------
const ENDPOINTS = {
  content: "/data/content.json",
  publications: "/data/publications.json",
  presentations: "/data/presentations.json",
  presentationsPage: "/data/presentations-page.json",
  media: "/data/media.json",
  theses: "/data/theses.json",
  initiatives: "/data/initiatives.json",
  councilSpeeches: "/data/council-speeches.json",
  researchfi: "/data/researchfi.json",
  taxonomyIndex: "/data/taxonomy-index.json"
};

// -----------------------------------------------------------------------------
// SOURCE_TO_COLLECTION — Node-puolella source-avain resolvoidaan
// Eleventy-collectionista. Vain ne source-nimet, joilla on suora
// collection-vastine, ovat käytettävissä Nunjucks-filtterissä.
// -----------------------------------------------------------------------------
const SOURCE_TO_COLLECTION = {
  publications: "publications",
  presentations: "presentations",
  media: "media",
  blog: "blog",
  politics: "politics",
  councilSpeeches: "pub_puhe_valtuusto"
};

// -----------------------------------------------------------------------------
// FIELD_RULES — sallitut suodatinkentät. Jokainen määrittelee kind:in
// (matcher) sekä kaksi getteriä: normalisoidusta recordista (browser) ja
// Eleventy-itemistä (Node).
// -----------------------------------------------------------------------------
const FIELD_RULES = {
  contentType: {
    kind: "oneOf",
    getFromRecord: (r) => r.contentType || null,
    getFromEleventy: (item) => {
      const d = item.data || {};
      if (d.contentType) return d.contentType;
      if (d.type && LEGACY_TYPE_MAP[d.type]) return LEGACY_TYPE_MAP[d.type];
      const p = String(item.inputPath || "");
      if (p.includes("/blog/")) return "blogPost";
      if (p.includes("/politics/")) return "initiative";
      if (p.includes("/media/")) return "mediaItem";
      if (p.includes("/presentations/")) return "presentation";
      return null;
    }
  },
  year: {
    kind: "yearRange",
    getFromRecord: (r) => {
      if (typeof r.year === "number") return r.year;
      if (typeof r.year === "string" && /^\d{4}$/.test(r.year.trim())) {
        return Number(r.year.trim());
      }
      return null;
    },
    getFromEleventy: (item) => {
      const src = item.date || (item.data && item.data.date);
      if (!src) return null;
      const d = src instanceof Date ? src : new Date(src);
      const y = d.getFullYear();
      return Number.isFinite(y) ? y : null;
    }
  },
  lang: {
    kind: "eq",
    getFromRecord: (r) => r.lang || "fi",
    getFromEleventy: (item) => (item.data && item.data.lang === "en" ? "en" : "fi")
  },
  categories: {
    kind: "anyOf",
    getFromRecord: (r) => normalizeStringArray(r.categories),
    getFromEleventy: (item) => normalizeStringArray(item.data && item.data.categories)
  },
  keywords: {
    kind: "anyOf",
    getFromRecord: (r) => normalizeStringArray(r.keywords),
    getFromEleventy: (item) => normalizeStringArray(item.data && item.data.keywords)
  },
  topics: {
    kind: "anyOf",
    getFromRecord: (r) => normalizeStringArray(r.topics),
    getFromEleventy: () => []
  },
  contexts: {
    kind: "anyOf",
    getFromRecord: (r) => normalizeStringArray(r.contexts),
    getFromEleventy: (item) => normalizeStringArray(item.data && item.data.contexts)
  },
  writingRoles: {
    kind: "anyOf",
    getFromRecord: (r) => normalizeStringArray(r.writingRoles || r.opinionRoles),
    getFromEleventy: (item) => {
      const d = (item && item.data) || {};
      return normalizeStringArray(d.writingRoles || d.opinionRoles);
    }
  },
  publication: {
    kind: "eq",
    getFromRecord: (r) => r.publication || null,
    getFromEleventy: (item) => (item.data && item.data.publication) || null
  },
  speechContext: {
    kind: "eq",
    getFromRecord: (r) => r.speechContext || null,
    getFromEleventy: (item) => (item.data && item.data.speechContext) || null
  },
  initiativeType: {
    kind: "eq",
    getFromRecord: (r) => r.initiativeType || null,
    getFromEleventy: (item) => (item.data && item.data.initiative_type) || null
  },
  presentationType: {
    kind: "oneOf",
    getFromRecord: (r) => r.presentationType || null,
    getFromEleventy: () => null
  },
  mediaType: {
    kind: "oneOf",
    getFromRecord: (r) => r.mediaType || null,
    getFromEleventy: () => null
  },
  event: {
    kind: "eq",
    getFromRecord: (r) => r.event || null,
    getFromEleventy: () => null
  },
  // Thesis-kentat: kaytossa vain /data/theses.json-recordeille (async data,
  // ei Eleventy-collection). getFromEleventy palauttaa null jotta Node-
  // puolen SSR-preset-kutsu ei kaada — mutta thesis-preset olisi
  // kaytannossa aina browser-puolella.
  thesisRole: {
    kind: "oneOf",
    getFromRecord: (r) => r.thesisRole || null,
    getFromEleventy: () => null
  },
  thesisType: {
    kind: "oneOf",
    getFromRecord: (r) => r.thesisType || null,
    getFromEleventy: () => null
  },
  researchLine: {
    kind: "oneOf",
    getFromRecord: (r) => r.researchLine || null,
    getFromEleventy: () => null
  },
  researchThemes: {
    kind: "anyOf",
    getFromRecord: (r) => normalizeStringArray(r.researchThemes),
    getFromEleventy: () => []
  },
  researchAudience: {
    kind: "anyOf",
    getFromRecord: (r) => normalizeStringArray(r.researchAudience),
    getFromEleventy: () => []
  }
};

// -----------------------------------------------------------------------------
// KIND_MATCHERS — jokaisen kind:in vastaavuustesti.
// -----------------------------------------------------------------------------
const KIND_MATCHERS = {
  eq: function (value, filterValue) {
    if (Array.isArray(filterValue)) return filterValue.includes(value);
    return value === filterValue;
  },
  oneOf: function (value, filterValue) {
    if (value == null) return false;
    const list = Array.isArray(filterValue) ? filterValue : [filterValue];
    return list.includes(value);
  },
  anyOf: function (values, filterValue) {
    const list = Array.isArray(filterValue) ? filterValue : [filterValue];
    if (!Array.isArray(values) || values.length === 0) return false;
    return values.some((v) => list.includes(v));
  },
  yearRange: function (value, filterValue) {
    if (value == null) return false;
    if (typeof filterValue === "number") return value === filterValue;
    if (Array.isArray(filterValue)) return filterValue.includes(value);
    if (filterValue && typeof filterValue === "object") {
      if (filterValue.min != null && value < filterValue.min) return false;
      if (filterValue.max != null && value > filterValue.max) return false;
      return true;
    }
    return false;
  }
};

// -----------------------------------------------------------------------------
// SORT_FUNCTIONS — vain vakiot. Custom-funktioita ei sallita presetissä
// (ne kuuluvat UI-tasolle).
// -----------------------------------------------------------------------------
const SORT_FUNCTIONS = {
  "date-desc": function (getDate) {
    return function (a, b) {
      const av = getDate(a) || "";
      const bv = getDate(b) || "";
      if (av === bv) return 0;
      return av < bv ? 1 : -1;
    };
  },
  "date-asc": function (getDate) {
    return function (a, b) {
      const av = getDate(a) || "";
      const bv = getDate(b) || "";
      if (av === bv) return 0;
      return av < bv ? -1 : 1;
    };
  },
  "title-asc": function (getTitle) {
    return function (a, b) {
      return String(getTitle(a) || "").localeCompare(String(getTitle(b) || ""), "fi");
    };
  },
  "title-desc": function (getTitle) {
    return function (a, b) {
      return String(getTitle(b) || "").localeCompare(String(getTitle(a) || ""), "fi");
    };
  }
};

// -----------------------------------------------------------------------------
// PRESETS — nimetyt query-konfiguraatiot. Aluksi tyhjä: sivut voivat käyttää
// enginen kutsuja ilman presettejä (raw spec) tai lisätä tähän omat presetit
// myöhemmin.
// -----------------------------------------------------------------------------
const PRESETS = {
  "FindExplore:presentations": {
    source: "presentationsPage",
    sort: "date-desc"
  }
};

// -----------------------------------------------------------------------------
// Sisäiset apufunktiot
// -----------------------------------------------------------------------------

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value.filter(function (v) { return v != null && v !== ""; }).map(String);
  }
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function validateSpec(spec) {
  if (!isPlainObject(spec)) {
    throw new Error("contentPresets: spec must be an object");
  }
  if (!spec.source || typeof spec.source !== "string") {
    throw new Error("contentPresets: spec.source is required (string)");
  }
  if (spec.filters != null && !isPlainObject(spec.filters)) {
    throw new Error("contentPresets: spec.filters must be an object");
  }
  if (spec.filters) {
    for (const key of Object.keys(spec.filters)) {
      if (!FIELD_RULES[key]) {
        throw new Error(
          "contentPresets: unknown filter field '" + key +
          "'. Allowed: " + Object.keys(FIELD_RULES).join(", ")
        );
      }
    }
  }
  if (spec.sort != null && !SORT_FUNCTIONS[spec.sort]) {
    throw new Error(
      "contentPresets: unknown sort '" + spec.sort +
      "'. Allowed: " + Object.keys(SORT_FUNCTIONS).join(", ")
    );
  }
  if (spec.limit != null && (!Number.isFinite(spec.limit) || spec.limit < 0)) {
    throw new Error("contentPresets: spec.limit must be a non-negative number");
  }
  if (spec.offset != null && (!Number.isFinite(spec.offset) || spec.offset < 0)) {
    throw new Error("contentPresets: spec.offset must be a non-negative number");
  }
}

function itemMatchesFilters(item, filters, getter) {
  for (const key of Object.keys(filters)) {
    const rule = FIELD_RULES[key];
    if (!rule) continue; // Jo validoitu validateSpec:issä
    const value = rule[getter](item);
    const matcher = KIND_MATCHERS[rule.kind];
    if (!matcher(value, filters[key])) return false;
  }
  return true;
}

function tokenizeSearch(query) {
  if (!query || typeof query !== "string") return [];
  return query
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function itemMatchesSearch(record, tokens) {
  if (tokens.length === 0) return true;
  const parts = [
    record.title,
    record.description,
    record.publication,
    record.event,
    record.presentationType,
    record.mediaType
  ];
  const cats = Array.isArray(record.categories) ? record.categories : [];
  const kws = Array.isArray(record.keywords) ? record.keywords : [];
  const topics = Array.isArray(record.topics) ? record.topics : [];
  const hay = parts.concat(cats, kws, topics)
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return tokens.every(function (t) { return hay.indexOf(t) !== -1; });
}

function mergeSpec(baseSpec, overrides) {
  if (!overrides) return baseSpec;
  const merged = Object.assign({}, baseSpec, overrides);
  if (baseSpec.filters || overrides.filters) {
    merged.filters = Object.assign({}, baseSpec.filters || {}, overrides.filters || {});
  }
  return merged;
}

function resolvePresetName(presetName) {
  if (!PRESETS[presetName]) {
    throw new Error(
      "contentPresets: unknown preset '" + presetName +
      "'. Available: " + (Object.keys(PRESETS).join(", ") || "(none)")
    );
  }
  return PRESETS[presetName];
}

// -----------------------------------------------------------------------------
// Yhteinen ydinsuoritus (käytetään sekä Node- että selainpuolella)
// -----------------------------------------------------------------------------

/**
 * queryItems(items, spec, options)
 *
 * options.getter: "getFromRecord" | "getFromEleventy" — mistä kentät poimitaan
 * options.getDate: (item) => ISO-string-tyylinen datestring
 * options.getTitle: (item) => string
 * options.enableSearch: boolean — Node-puolella false, selain true
 *
 * Palauttaa: { items, total, offset, limit, source }
 */
function queryItems(items, spec, options) {
  validateSpec(spec);
  const filters = spec.filters || {};
  const getter = options.getter;
  const getDate = options.getDate;
  const getTitle = options.getTitle;
  const enableSearch = !!options.enableSearch;

  let filtered = items;
  if (Object.keys(filters).length > 0) {
    filtered = filtered.filter(function (item) {
      return itemMatchesFilters(item, filters, getter);
    });
  }

  if (enableSearch && spec.search) {
    const tokens = tokenizeSearch(spec.search);
    if (tokens.length > 0) {
      filtered = filtered.filter(function (item) {
        return itemMatchesSearch(item, tokens);
      });
    }
  }

  if (spec.sort) {
    const sortFactory = SORT_FUNCTIONS[spec.sort];
    const isDateSort = spec.sort === "date-desc" || spec.sort === "date-asc";
    const comparator = isDateSort ? sortFactory(getDate) : sortFactory(getTitle);
    filtered = filtered.slice().sort(comparator);
  }

  const total = filtered.length;
  const offset = spec.offset || 0;
  const limit = spec.limit != null ? spec.limit : total;
  const sliced = filtered.slice(offset, offset + limit);

  return {
    items: sliced,
    total: total,
    offset: offset,
    limit: limit,
    source: spec.source
  };
}

// -----------------------------------------------------------------------------
// Node-puolen käynnistin (Eleventy build → Nunjucks-filter)
// -----------------------------------------------------------------------------

/**
 * applyPresetToCollection(collections, presetNameOrSpec, overrides)
 *
 * Käytetään .eleventy.js:in Nunjucks-filtterissä. Poimii Eleventy-collectionista
 * itemit, suodattaa presetin mukaan ja palauttaa slicen. search-parametri
 * ohitetaan (Nunjucks ei osaa vapaatekstihakua).
 *
 * Palauttaa taulukon itemejä (ei { items, total }-wrapperia), koska Nunjucks
 * odottaa iteroitavan arvoa.
 */
function applyPresetToCollection(collections, presetNameOrSpec, overrides) {
  const baseSpec = typeof presetNameOrSpec === "string"
    ? resolvePresetName(presetNameOrSpec)
    : presetNameOrSpec;
  const spec = mergeSpec(baseSpec, overrides);

  const collectionName = SOURCE_TO_COLLECTION[spec.source];
  if (!collectionName) {
    throw new Error(
      "contentPresets: source '" + spec.source +
      "' has no Eleventy-collection binding (SSR ei tue tätä sourcea)"
    );
  }
  const items = (collections && collections[collectionName]) || [];

  const result = queryItems(items, spec, {
    getter: "getFromEleventy",
    getDate: function (item) {
      const src = item.date || (item.data && item.data.date);
      if (!src) return "";
      const d = src instanceof Date ? src : new Date(src);
      return isNaN(d.getTime()) ? "" : d.toISOString();
    },
    getTitle: function (item) { return (item.data && item.data.title) || ""; },
    enableSearch: false
  });
  return result.items;
}

// -----------------------------------------------------------------------------
// Selain-puolen käynnistin (content-engine.js kutsuu tätä)
// -----------------------------------------------------------------------------

/**
 * queryPreset(items, presetNameOrSpec, overrides)
 *
 * Käytetään selain-puolen ContentEngine.query:ssä. Suorittaa suodatuksen
 * normalisoituja /data/*.json-recordeja vastaan. search-parametri toimii.
 *
 * Palauttaa: { items, total, offset, limit, source }
 */
function queryPreset(items, presetNameOrSpec, overrides) {
  const baseSpec = typeof presetNameOrSpec === "string"
    ? resolvePresetName(presetNameOrSpec)
    : presetNameOrSpec;
  const spec = mergeSpec(baseSpec, overrides);

  return queryItems(items, spec, {
    getter: "getFromRecord",
    getDate: function (r) { return r.date || ""; },
    getTitle: function (r) { return r.title || ""; },
    enableSearch: true
  });
}

// -----------------------------------------------------------------------------
// Isomorfinen export
// -----------------------------------------------------------------------------

const EXPORTS = {
  PRESETS: PRESETS,
  FIELD_RULES: FIELD_RULES,
  KIND_MATCHERS: KIND_MATCHERS,
  SORT_FUNCTIONS: SORT_FUNCTIONS,
  ENDPOINTS: ENDPOINTS,
  SOURCE_TO_COLLECTION: SOURCE_TO_COLLECTION,
  LEGACY_TYPE_MAP: LEGACY_TYPE_MAP,
  applyPresetToCollection: applyPresetToCollection,
  queryPreset: queryPreset,
  queryItems: queryItems,
  tokenizeSearch: tokenizeSearch
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = EXPORTS;
}
if (typeof window !== "undefined") {
  window.ContentPresets = EXPORTS;
}

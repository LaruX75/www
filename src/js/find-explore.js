(function () {
  "use strict";

  const PAGE_SIZE = 10;
  const mounts = Array.from(document.querySelectorAll("[data-find-explore]"));
  if (!mounts.length) return;

  // PF5-G1 shared-presenter convergence (2026-08-23): the identical
  // helper copies previously duplicated in this file
  // (escapeHtml, resultTitle, SISALTO_LABELS, contentFamilyLabelFromData,
  //  renderFamilyHeader, renderPrimaryMetaLine)
  // are now owned by src/js/search-result-presenter.js exposed as
  // `window.SearchResultPresenter`. Every page that loads
  // find-explore.js MUST also load search-result-presenter.js first
  // (see F&E pageScripts on /kirjoitukset/, /opinnaytteet/,
  // /julkaisut/, /en/writings/, /en/publications/, /en/theses/,
  // /fi/tutkimus.md).
  const presenter = window.SearchResultPresenter;
  if (!presenter || typeof presenter.escapeHtml !== "function") {
    console.warn("[find-explore] SearchResultPresenter missing — load /js/search-result-presenter.js before /js/find-explore.js.");
    return;
  }
  const escapeHtml = presenter.escapeHtml;
  const resultTitle = presenter.resultTitle;
  const SISALTO_LABELS = presenter.SISALTO_LABELS;
  const contentFamilyLabelFromData = presenter.contentFamilyLabelFromData;
  const renderFamilyHeader = presenter.renderFamilyHeader;
  const renderPrimaryMetaLine = presenter.renderPrimaryMetaLine;

  const text = {
    fi: {
      idle: "Kirjoita hakusana tai rajaa tuloksia. Avausosiot toimivat myös ilman hakua.",
      loading: "Haetaan tuloksia...",
      noResults: "Tuloksia ei löytynyt.",
      count: (count) => `${count} ${count === 1 ? "tulos" : "tulosta"}`,
      error: "Hakemisto ei ole käytettävissä tässä buildissä.",
      open: "Avaa",
      source: "Lähde",
      exportCitation: "Vie viite",
      peerReviewed: "Vertaisarvioitu",
      openAccess: "Open access",
      citations: (count) => `${count} viittausta`,
      kindLabels: {
        writings: "Kirjoitus",
        theses: "Opinnäyte",
        publications: "Julkaisu",
        presentations: "Esitys"
      }
    },
    en: {
      idle: "Type a search term or narrow the result set. The curated opening sections work without search.",
      loading: "Searching...",
      noResults: "No results found.",
      count: (count) => `${count} ${count === 1 ? "result" : "results"}`,
      error: "The search index is not available in this build.",
      open: "Open",
      source: "Source",
      exportCitation: "Export citation",
      peerReviewed: "Peer-reviewed",
      openAccess: "Open access",
      citations: (count) => `${count} citations`,
      kindLabels: {
        writings: "Writing",
        theses: "Thesis",
        publications: "Publication",
        presentations: "Presentation"
      }
    }
  };

  function debounce(fn, delay = 220) {
    let timer = null;
    return (...args) => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => fn(...args), delay);
    };
  }

  function normalizeUrl(url) {
    if (!url) return "";
    try {
      return new URL(url, window.location.origin).pathname;
    } catch {
      return String(url);
    }
  }

  function normalizeSearchLanguage(language) {
    return String(language || "fi").slice(0, 2).toLowerCase() || "fi";
  }

  const searchCache = new Map();

  // PF-PERF2 — schedule a fire-and-forget callback during the browser's
  // next idle window so the Pagefind wasm import can start before the
  // user's first search. Falls back to a short setTimeout for
  // browsers without requestIdleCallback.
  function scheduleIdle(fn) {
    if (typeof window === "undefined") return;
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(fn, { timeout: 2500 });
    } else {
      window.setTimeout(fn, 1200);
    }
  }

  // PF-PERF2 — warm the per-language Pagefind cache without running a
  // search. `createSearch(language)` already imports the Pagefind
  // module and calls pagefind.init(), and caches the resolved
  // promise. Calling it during idle / on focus / on pointerenter
  // means the module is ready by the time the user submits their
  // first query, so the query→result path skips the import cost.
  // NEVER calls pagefind.search — no automatic results.
  function warmSearchLanguages(languages) {
    if (!Array.isArray(languages) || languages.length === 0) return;
    languages.forEach((language) => {
      Promise.resolve()
        .then(() => createSearch(language))
        .catch(() => { /* silent: warmup failures fall back to the on-demand path */ });
    });
  }

  async function createSearch(language) {
    const searchLanguage = normalizeSearchLanguage(language);
    if (searchCache.has(searchLanguage)) return searchCache.get(searchLanguage);

    const promise = (async () => {
      const root = document.documentElement;
      const previousLang = root.getAttribute("lang");
      root.setAttribute("lang", searchLanguage);

      try {
        const pagefind = await import(`/pagefind/pagefind.js?findExploreLang=${searchLanguage}`);
        if (typeof pagefind.init === "function") {
          await pagefind.init();
        }
        return pagefind;
      } finally {
        if (previousLang) root.setAttribute("lang", previousLang);
        else root.removeAttribute("lang");
      }
    })();

    searchCache.set(searchLanguage, promise);
    try {
      return await promise;
    } catch (error) {
      searchCache.delete(searchLanguage);
      throw error;
    }
  }

  function normalizeSearchLanguages(value, fallback) {
    const parts = String(value || fallback || "fi")
      .split(",")
      .map((item) => normalizeSearchLanguage(item))
      .filter(Boolean);
    return [...new Set(parts)];
  }

  function thesisTypeRoleLabel(type, role, langKey) {
    const lang = String(langKey || "fi").toLowerCase() === "en" ? "en" : "fi";
    const labels = {
      fi: {
        masterThesis: { advised: "Gradu · ohjattu", reviewed: "Gradu · tarkastettu" },
        bachelorThesis: { advised: "Kandi · ohjattu", reviewed: "Kandi · tarkastettu" },
        doctoralThesis: "Väitöskirja",
        licentiateThesis: "Lisensiaatintutkielma",
        generic: "Opinnäyte",
        advised: "ohjattu",
        reviewed: "tarkastettu"
      },
      en: {
        masterThesis: { advised: "Master's · advised", reviewed: "Master's · reviewed" },
        bachelorThesis: { advised: "Bachelor's · advised", reviewed: "Bachelor's · reviewed" },
        doctoralThesis: "Doctoral dissertation",
        licentiateThesis: "Licentiate thesis",
        generic: "Thesis",
        advised: "advised",
        reviewed: "reviewed"
      }
    }[lang];
    const typeKey = String(type || "").trim();
    const roleKey = String(role || "").trim();
    const exact = labels[typeKey];
    if (exact && typeof exact === "object" && exact[roleKey]) return exact[roleKey];
    const typeOnly = typeof exact === "string" ? exact : "";
    const roleOnly = labels[roleKey] || "";
    if (typeOnly && roleOnly) return `${typeOnly} · ${roleOnly}`;
    if (typeOnly) return typeOnly;
    if (roleOnly) return `${labels.generic} · ${roleOnly}`;
    return labels.generic;
  }

  function composeThesisTypeRoleValue(type, role) {
    const normalizedType = String(type || "").trim();
    const normalizedRole = String(role || "").trim();
    if (!normalizedType || !normalizedRole) return "";
    return `${normalizedType}::${normalizedRole}`;
  }

  function parseThesisTypeRoleValue(value) {
    const [thesisType = "", thesisRole = ""] = String(value || "").split("::");
    return {
      thesisType: thesisType.trim(),
      thesisRole: thesisRole.trim()
    };
  }

  function isDefaultThesisSortState(state) {
    return (state?.yearOrder || "year-desc") === "year-desc"
      && (state?.authorSort || "use-year") === "use-year";
  }

  function isDefaultPublicationSortState(state) {
    return (state?.yearOrder || "year-desc") === "year-desc"
      && (state?.authorSort || "use-year") === "use-year";
  }

  function compareStrings(left, right, locale) {
    return String(left || "").localeCompare(String(right || ""), locale);
  }

  function compareThesisYear(left, right, direction, locale) {
    const leftYear = Number.parseInt(left?.year || "0", 10) || 0;
    const rightYear = Number.parseInt(right?.year || "0", 10) || 0;
    if (leftYear !== rightYear) {
      return direction === "asc" ? leftYear - rightYear : rightYear - leftYear;
    }
    return compareStrings(left?.title, right?.title, locale);
  }

  function sortThesisEntries(entries, state, locale) {
    const authorSort = state?.authorSort || "use-year";
    const yearOrder = state?.yearOrder || "year-desc";
    const normalizedLocale = String(locale || "fi").toLowerCase() === "en" ? "en" : "fi";
    return [...entries].sort((left, right) => {
      if (authorSort === "author-asc" || authorSort === "author-desc") {
        const authorDiff = compareStrings(left?.authorLine, right?.authorLine, normalizedLocale);
        if (authorDiff !== 0) return authorSort === "author-asc" ? authorDiff : -authorDiff;
        return compareThesisYear(left, right, "desc", normalizedLocale);
      }
      return compareThesisYear(left, right, yearOrder === "year-asc" ? "asc" : "desc", normalizedLocale);
    });
  }

  function parseBooleanMeta(value) {
    return value === true || value === "true" || value === 1 || value === "1";
  }

  function parseCslMeta(value) {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(String(value));
    } catch {
      return null;
    }
  }

  function publicationRecordFromMeta(data) {
    const meta = data?.meta || {};
    const group = meta.publicationGroup || "";
    return {
      title: resultTitle(data),
      year: meta.publicationYear || "",
      date: meta.publicationDate || "",
      authors: meta.publicationAuthors || "",
      journal: meta.publicationJournal || "",
      publisher: meta.publicationPublisher || "",
      volume: meta.publicationVolume || "",
      issue: meta.publicationIssue || "",
      pages: meta.publicationPages || "",
      isbn: meta.publicationIsbn || "",
      doi: meta.publicationDoi || "",
      doiUrl: meta.publicationDoiUrl || "",
      sourceUrl: meta.publicationSourceUrl || "",
      sourceLabel: meta.publicationSourceLabel || "",
      type: meta.publicationTypeLabel || meta.publicationType || "",
      typeCode: meta.publicationTypeCode || meta.publicationType || "",
      group,
      groupLabelFi: group ? publicationGroupLabel(group, "fi") : "",
      groupLabelEn: group ? publicationGroupLabel(group, "en") : "",
      peerReviewed: parseBooleanMeta(meta.publicationPeerReviewed),
      openAccess: parseBooleanMeta(meta.publicationOpenAccess),
      citationCount: Number.parseInt(meta.publicationCitationCount || "0", 10) || 0,
      jufoLevel: meta.publicationJufoLevel || "",
      csl: parseCslMeta(meta.publicationCsl)
    };
  }

  const PUBLICATION_GROUP_LABELS = {
    A: { fi: "A - Vertaisarvioidut tieteelliset artikkelit", en: "A - Peer-reviewed scientific articles" },
    B: { fi: "B - Vertaisarvioimattomat tieteelliset kirjoitukset", en: "B - Non-peer-reviewed scientific writings" },
    C: { fi: "C - Tieteelliset kirjat", en: "C - Scientific books" },
    D: { fi: "D - Ammattiyhteisölle suunnatut julkaisut", en: "D - Professional publications" },
    E: { fi: "E - Suurelle yleisölle suunnatut julkaisut", en: "E - General audience publications" },
    G: { fi: "G - Opinnäytteet", en: "G - Theses" }
  };

  function publicationGroupLabel(group, lang) {
    return PUBLICATION_GROUP_LABELS[group]?.[lang === "en" ? "en" : "fi"] || group || "";
  }

  const kindConfig = {
    writings: {
      filterPrefix: "Writings",
      typeFilterKey: "Writings content type",
      // PF4: single primary metadata line — writing type only. Year
      // moved to the family-header row via renderFamilyHeader.
      resultMeta(entry, state) {
        return [state.typeLabel].filter(Boolean);
      },
      excerpt(data) {
        return data?.excerpt || "";
      },
      requiresQueryForSearch: true
    },
    theses: {
      filterPrefix: "Theses",
      typeFilterKey: "Theses type",
      roleFilterKey: "Theses role",
      // PF4: single primary metadata line — author line + thesis type,
      // joined by the shared renderer. Year moved to family header.
      resultMeta(entry) {
        return [entry.authorLine, entry.typeLabel].filter(Boolean);
      },
      excerpt(data) {
        return data?.meta?.thesesDescription || data?.excerpt || "";
      },
      requiresQueryForSearch: false,
      maxResults: 250
    },
    publications: {
      filterPrefix: "Publications",
      typeFilterKey: "Publications group",
      topicFilterKey: "Publications topic",
      qualityFilterKey: "Publications quality",
      // PF5-IMPL-APA: publication rows lead with a shared-renderer APA
      // sentence (see renderPublicationResult below). Keeping meta
      // returns empty so PF4's primary-meta line does not duplicate
      // the APA sentence.
      resultMeta() { return []; },
      excerpt(data, record) {
        return record?.description || data?.meta?.publicationDescription || data?.excerpt || "";
      },
      requiresQueryForSearch: false,
      // Per-search result ceiling for the publications kind — high
      // enough that the canonical 56 publications (and comfortable
      // growth headroom) never get truncated. Other kinds keep the
      // classic 50-result cap.
      maxResults: 200,
      // Publications archive convergence: active interaction still
      // renders the whole matching grouped corpus at once.
      renderAllResults: true,
      groupedArchiveTables: true
    },
    presentations: {
      yearFilterKey: "PresentationYear",
      topicFilterKey: "PresentationTopic",
      researchTopicPresetMap: {
        "tekoäly": "ai-literacy",
        "opettajankoulutus": "teacher-education",
        "koulutusteknologia": "long-term-learning",
        "yhteisöllinen oppiminen": "long-term-learning",
        "ohjelmoinnillinen ajattelu": "teacher-education"
      },
      // PF4: presentation type + event/venue, whichever is safely
      // available from Pagefind meta. Year moved to family header.
      resultMeta(entry) {
        return [entry.presentationType, entry.presentationEvent].filter(Boolean);
      },
      excerpt(data, record) {
        return record?.description || data?.excerpt || "";
      },
      requiresQueryForSearch: false
    },
    researchContext: {
      filterPrefix: "Research",
      resultMeta(entry) {
        return [entry.kindLabel, ...entry.meta].filter(Boolean);
      },
      excerpt(data, record) {
        if (record?.description) return record.description;
        return data?.meta?.publicationDescription || data?.meta?.thesesDescription || data?.excerpt || "";
      },
      requiresQueryForSearch: false,
      contextual: true
    }
  };

  function parseList(value, fallback = []) {
    const items = String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : fallback;
  }

  function filtersFor(mount, state) {
    const kind = mount.dataset.findExploreKind || "writings";
    const config = kindConfig[kind] || kindConfig.writings;
    const prefix = config.filterPrefix || "FindExplore";
    const filters = {
      FindExplore: kind
    };

    const scope = mount.dataset.findExploreScope;
    if (scope) filters[`${prefix} scope`] = scope;

    const languageFilter = mount.dataset.findExploreLanguageFilter;
    if (languageFilter) filters.Kieli = languageFilter;

    // THESIS-HUB-02: pinned filters. Subarchive pages (e.g.
    // /opinnaytteet/gradut/) mount FE with data-find-explore-pinned-type
    // and/or data-find-explore-pinned-role. Those act as hard scope
    // guarantees so the search cannot leak results from a sibling group
    // even when the corresponding user-facing dropdown is hidden. A
    // matching state.<field> selection always wins over the pinned
    // default (used when the caller keeps the dropdown visible).
    const pinnedType = mount.dataset.findExplorePinnedType;
    const pinnedRole = mount.dataset.findExplorePinnedRole;
    const typeValue = state.type || pinnedType;
    const roleValue = state.role || pinnedRole;
    if (typeValue) filters[config.typeFilterKey || `${prefix} type`] = typeValue;
    if (roleValue) filters[config.roleFilterKey || `${prefix} role`] = roleValue;
    if (state.year) filters[config.yearFilterKey || `${prefix} year`] = state.year;
    if (state.topic) {
      const topicPreset = config.researchTopicPresetMap?.[state.topic];
      if ((mount.dataset.findExploreKind || "") === "researchContext" && topicPreset) {
        filters.PresentationResearchPreset = topicPreset;
      } else {
        filters[config.topicFilterKey || `${prefix} topic`] = state.topic;
      }
    }
    if (state.quality) filters[config.qualityFilterKey || `${prefix} quality`] = state.quality;
    return filters;
  }

  function filtersForKind(mount, state, kind) {
    const config = kindConfig[kind] || kindConfig.writings;
    const prefix = config.filterPrefix || "FindExplore";
    const filters = {
      FindExplore: kind
    };

    const scope = mount.dataset.findExploreScope;
    if (scope) filters[`${prefix} scope`] = scope;

    const languageFilter = mount.dataset.findExploreLanguageFilter;
    if (languageFilter) filters.Kieli = languageFilter;

    if ((mount.dataset.findExploreKind || "") === "researchContext") {
      filters["Research context"] = "research";
    }

    // THESIS-HUB-02: mirror pinned role/type from the mount into the
    // per-kind filter set used by cross-kind searches.
    //
    // THESIS-SEARCH-UX-01: only pinned attributes are safe to apply
    // here. `state.type` in cross-kind mounts (e.g. researchContext)
    // is the KIND selector ("publications", "theses", "writings"),
    // NOT a Pagefind subtype value like "masterThesis". Applying it
    // as `Theses type` would zero out results because no thesis
    // record has `Theses type=theses`. `state.role` behaves the same
    // way in cross-kind mounts (the role dropdown is not exposed).
    const pinnedRoleKind = mount.dataset.findExplorePinnedRole;
    const pinnedTypeKind = mount.dataset.findExplorePinnedType;
    if (pinnedRoleKind && kind === "theses") {
      filters[config.roleFilterKey || `${prefix} role`] = pinnedRoleKind;
    }
    if (pinnedTypeKind && kind === "theses") {
      filters[config.typeFilterKey || `${prefix} type`] = pinnedTypeKind;
    }
    if (state.year) filters[config.yearFilterKey || `${prefix} year`] = state.year;
    if (state.topic) filters[config.topicFilterKey || `${prefix} topic`] = state.topic;
    if (state.quality && kind === "publications") {
      filters[config.qualityFilterKey || `${prefix} quality`] = state.quality;
    }
    return filters;
  }

  function readInitialState(mount) {
    const params = new URLSearchParams(window.location.search);
    const legacyType = params.get("type") || "";
    const legacyRole = params.get("role") || "";
    return {
      q: params.get("q") || "",
      type: legacyType,
      role: legacyRole,
      year: params.get("year") || "",
      topic: params.get("topic") || "",
      quality: params.get("quality") || "",
      typeRole: params.get("typeRole") || composeThesisTypeRoleValue(legacyType, legacyRole),
      yearOrder: params.get("yearOrder") || "year-desc",
      authorSort: params.get("authorSort") || "use-year"
    };
  }

  function updateUrl(state, kind) {
    const next = new URLSearchParams(window.location.search);
    const nextState = { ...state };
    if (kind === "theses") {
      delete nextState.type;
      delete nextState.role;
      delete nextState.year;
    } else if (kind !== "publications") {
      delete nextState.typeRole;
      delete nextState.yearOrder;
      delete nextState.authorSort;
    }
    Object.entries(nextState).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (kind === "theses") {
      if ((state.yearOrder || "year-desc") === "year-desc") next.delete("yearOrder");
      if ((state.authorSort || "use-year") === "use-year") next.delete("authorSort");
      next.delete("type");
      next.delete("role");
      next.delete("year");
    } else if (kind !== "publications") {
      next.delete("typeRole");
      next.delete("yearOrder");
      next.delete("authorSort");
    }
    const query = next.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }

  function readRecords(mount) {
    const holder = mount.dataset.findExploreRecordsId
      ? mount
      : mount.closest("[data-find-explore-records-id]");
    const id = holder?.dataset.findExploreRecordsId;
    if (!id) return new Map();
    const source = document.getElementById(id);
    if (!source) return new Map();
    try {
      const records = JSON.parse(source.textContent || "[]");
      return new Map(records.map((record) => [normalizeUrl(record.pageUrl), record]));
    } catch (error) {
      console.warn("FindExplore record data parse failed", error);
      return new Map();
    }
  }

  function createResultEntry(kind, data, state, recordsByUrl, labels) {
    const title = resultTitle(data);
    const normalizedUrl = normalizeUrl(data?.url);
    const record = recordsByUrl.get(normalizedUrl) || null;
    const rawThesisType = data?.meta?.thesesType || "";
    const rawThesisRole = data?.meta?.thesesRole || "";
    const typeLabel = kind === "theses"
      ? thesisTypeRoleLabel(rawThesisType, rawThesisRole, labels.langKey)
      : (state.typeLabel || rawThesisType || "");
    const year = state.year || data?.meta?.writingsYear || data?.meta?.thesesYear || data?.meta?.PresentationYear || "";
    const authorLine = data?.meta?.thesesAuthorLine || "";
    const publicationRecord = kind === "publications"
      ? Object.assign({}, publicationRecordFromMeta(data), record || {})
      : record;
    const publicationMeta = publicationRecord ? {
      authors: publicationRecord.authors || "",
      typeLabel: publicationRecord.typeCode || publicationRecord.group || "",
      year: publicationRecord.year || "",
      date: publicationRecord.date || "",
      venue: publicationRecord.venue || publicationRecord.journal || publicationRecord.publisher || "",
      citationCount: publicationRecord.citationCount || 0,
      jufoLevel: publicationRecord.jufoLevel || "",
      peerReviewed: publicationRecord.peerReviewed,
      openAccess: publicationRecord.openAccess
    } : {
      authors: data?.meta?.publicationAuthors || "",
      typeLabel: data?.meta?.publicationType || data?.meta?.publicationGroup || "",
      year: data?.meta?.publicationYear || "",
      venue: data?.meta?.publicationVenue || ""
    };
    const resolvedTypeLabel = publicationMeta.typeLabel || typeLabel;
    const resolvedYear = publicationMeta.year || year;
    const effectiveConfig = kindConfig[kind] || kindConfig.writings;
    const meta = effectiveConfig.resultMeta({
      authorLine,
      ...publicationMeta,
      kindLabel: labels?.kindLabels?.[kind] || kind,
      typeLabel: resolvedTypeLabel,
      year: resolvedYear
    }, {
      ...state,
      typeLabel: resolvedTypeLabel,
      year: resolvedYear
    });

    return {
      kind,
      url: normalizedUrl,
      title: record?.title || title,
      excerpt: effectiveConfig.excerpt(data, record),
      meta,
      record: publicationRecord,
      // PF4: year lives on line 1 (family header) rather than the
      // primary-meta line. Presentation type/event surface directly
      // on the entry so the presentations resultMeta can compose a
      // single sentence without another indirection.
      year: resolvedYear,
      presentationType: data?.meta?.PresentationType || "",
      presentationEvent: data?.meta?.PresentationEvent || "",
      contentFamilyLabel: contentFamilyLabelFromData(kind, data),
      authorLine,
      thesisTypeRoleLabel: thesisTypeRoleLabel(rawThesisType, rawThesisRole, labels.langKey),
      thesisSourceUrl: data?.meta?.thesesSourceUrl || ""
    };
  }

  function initMount(mount) {
    const kind = mount.dataset.findExploreKind || "writings";
    const config = kindConfig[kind] || kindConfig.writings;
    const contextualKinds = parseList(mount.dataset.findExploreKinds, ["publications", "theses", "writings"])
      .filter((value) => kindConfig[value]);
    const lang = (mount.dataset.findExploreLang || document.documentElement.lang || "fi").slice(0, 2);
    const labels = Object.assign({ langKey: lang }, text[lang] || text.fi);
    const searchLanguages = normalizeSearchLanguages(mount.dataset.findExploreSearchLanguage, lang);
    const queryInput = mount.querySelector("[data-find-explore-query]");
    const typeSelect = mount.querySelector("[data-find-explore-type]");
    const yearSelect = mount.querySelector("[data-find-explore-year]");
    const topicSelect = mount.querySelector("[data-find-explore-topic]");
    const qualitySelect = mount.querySelector("[data-find-explore-quality]");
    const resetButton = mount.querySelector("[data-find-explore-reset]");
    const status = mount.querySelector("[data-find-explore-status]");
    const resultsList = mount.querySelector("[data-find-explore-results]")
      || (mount.dataset.findExploreResultsId ? document.getElementById(mount.dataset.findExploreResultsId) : null);
    const moreButton = mount.querySelector("[data-find-explore-more]");
    const controlsForm = mount.querySelector("[data-find-explore-form]");
    const recordsByUrl = readRecords(mount);
    const roleSelect = mount.querySelector("[data-find-explore-role]");
    const yearOrderSelect = mount.querySelector("[data-find-explore-year-order]")
      || (mount.dataset.findExploreYearOrderId ? document.getElementById(mount.dataset.findExploreYearOrderId) : null);
    const authorSortSelect = mount.querySelector("[data-find-explore-author-sort]")
      || (mount.dataset.findExploreAuthorSortId ? document.getElementById(mount.dataset.findExploreAuthorSortId) : null);
    const typeRoleSelect = mount.querySelector("[data-find-explore-type-role]")
      || (mount.dataset.findExploreTypeRoleId ? document.getElementById(mount.dataset.findExploreTypeRoleId) : null);
    const initialResultsHtml = resultsList?.innerHTML || "";

    mount.dataset.findExploreReady = "false";

    let latestResults = [];
    let visibleCount = PAGE_SIZE;
    let activeSearchRunId = 0;

    function currentReturnTo() {
      if (typeof window === "undefined" || !window.location) return "";
      return `${window.location.pathname}${window.location.search}${window.location.hash}`;
    }

    // DETAIL-UX-ORIENT-01: Find & Explore is the search-return origin.
    // Language derives from <html lang>; falls back to fi.
    function currentReturnLabel() {
      if (typeof document === "undefined") return "Takaisin hakutuloksiin";
      const lang = (document.documentElement.getAttribute("lang") || "fi").toLowerCase();
      return lang.startsWith("en") ? "Back to results" : "Takaisin hakutuloksiin";
    }

    function withReturnTo(href) {
      if (typeof window === "undefined" || !href) return href;
      try {
        const targetUrl = new URL(href, window.location.origin);
        if (targetUrl.origin !== window.location.origin) return href;
        targetUrl.searchParams.set("returnTo", currentReturnTo());
        targetUrl.searchParams.set("returnLabel", currentReturnLabel());
        return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`;
      } catch (_) {
        return href;
      }
    }

    function decorateResultLinks(activeDiscoveryState = false) {
      if (!resultsList || !activeDiscoveryState) return;
      const selectors = [
        ".publication-archive-title-link",
        ".thesis-archive-title-link",
        ".find-explore-result-title",
        ".find-explore-result .btn.btn-sm.btn-primary"
      ];
      resultsList.querySelectorAll(selectors.join(",")).forEach((link) => {
        const href = link.getAttribute("href") || "";
        if (!href || href.startsWith("#")) return;
        link.setAttribute("href", withReturnTo(href));
      });
    }

    function readState() {
      const combinedTypeRole = typeRoleSelect?.value || "";
      const parsedTypeRole = kind === "theses"
        ? parseThesisTypeRoleValue(combinedTypeRole)
        : { thesisType: "", thesisRole: "" };
      return {
        q: queryInput?.value.trim() || "",
        type: parsedTypeRole.thesisType || typeSelect?.value || "",
        role: parsedTypeRole.thesisRole || roleSelect?.value || "",
        year: yearSelect?.value || "",
        topic: topicSelect?.value || "",
        quality: qualitySelect?.value || "",
        typeRole: combinedTypeRole,
        yearOrder: yearOrderSelect?.value || "year-desc",
        authorSort: authorSortSelect?.value || "use-year"
      };
    }

    function writeState(state) {
      if (queryInput) queryInput.value = state.q || "";
      if (typeSelect) typeSelect.value = state.type || "";
      if (roleSelect) roleSelect.value = state.role || "";
      if (yearSelect) yearSelect.value = state.year || "";
      if (topicSelect) topicSelect.value = state.topic || "";
      if (qualitySelect) qualitySelect.value = state.quality || "";
      if (typeRoleSelect) typeRoleSelect.value = state.typeRole || composeThesisTypeRoleValue(state.type, state.role);
      if (yearOrderSelect) yearOrderSelect.value = state.yearOrder || "year-desc";
      if (authorSortSelect) authorSortSelect.value = state.authorSort || "use-year";
    }

    writeState(readInitialState(mount));

    function citationButton(record) {
      if (!record) return "";
      if (!document.getElementById("citationExportModal")) return "";
      const cslAttr = record.csl
        ? ` data-csl="${escapeHtml(JSON.stringify(record.csl))}"`
        : "";
      return `<button type="button" class="btn btn-sm btn-outline-secondary rounded-pill export-citation-btn"`
        + ` data-title="${escapeHtml(record.title || "")}" data-authors="${escapeHtml(record.authors || "")}"`
        + ` data-year="${escapeHtml(record.year || "")}" data-journal="${escapeHtml(record.journal || "")}"`
        + ` data-doi="${escapeHtml(record.doi || "")}" data-url="${escapeHtml(record.sourceUrl || record.doiUrl || "")}"`
        + ` data-volume="${escapeHtml(record.volume || "")}" data-issue="${escapeHtml(record.issue || "")}"`
        + ` data-pages="${escapeHtml(record.pages || "")}" data-publisher="${escapeHtml(record.publisher || "")}"`
        + ` data-isbn="${escapeHtml(record.isbn || "")}"${cslAttr} title="${escapeHtml(labels.exportCitation)}">`
        + `<i class="bi bi-download me-1" aria-hidden="true"></i>${escapeHtml(labels.exportCitation)}</button>`;
    }

    // PF5-IMPL-APA: reach for the shared CSL renderer (loaded via
    // /js/publication-citation.js on publication hub pages). When the
    // renderer is unavailable, fall back to the record's plain
    // title/authors so no publication row degrades to an unlabeled tile.
    function publicationCitationBody(entry) {
      const record = entry?.record;
      if (!record) return `<a class="find-explore-result-title" href="${escapeHtml(entry.url)}">${escapeHtml(entry.title)}</a>`;
      const renderer = typeof window !== "undefined" ? window.publicationCitation : null;
      if (record.csl && renderer && typeof renderer.buildCitation === "function") {
        const rendered = renderer.buildCitation({ csl: record.csl, style: "apa" });
        if (rendered && rendered.text) {
          return `<p class="find-explore-result-publication-citation" data-find-explore-card-line="primary-meta">`
            + `<a class="find-explore-result-title find-explore-result-publication-citation-link" href="${escapeHtml(entry.url)}">`
            + escapeHtml(rendered.text)
            + `</a></p>`;
        }
      }
      const authorLine = record.authors
        ? `<p class="find-explore-result-publication-fallback-authors" data-find-explore-card-line="primary-meta">${escapeHtml(record.authors)}${record.year ? ` (${escapeHtml(String(record.year))})` : ""}</p>`
        : "";
      return `<a class="find-explore-result-title" href="${escapeHtml(entry.url)}">${escapeHtml(entry.title)}</a>${authorLine}`;
    }

    // PF4: replace the four colored publication quality badges with a
    // single subdued micro-copy line. Same data (peer-reviewed / open
    // access / JUFO / citations), lower visual weight — CSS applies
    // uppercase + secondary text color via .find-explore-result-publication-quality.
    function publicationQualityLine(record) {
      if (!record) return "";
      const parts = [];
      if (record.peerReviewed) parts.push(labels.peerReviewed);
      if (record.openAccess) parts.push(labels.openAccess);
      if (record.jufoLevel !== "" && record.jufoLevel != null) parts.push(`JUFO ${record.jufoLevel}`);
      if (record.citationCount) parts.push(labels.citations(record.citationCount));
      if (parts.length === 0) return "";
      return `<p class="find-explore-result-publication-quality" data-find-explore-card-line="quality">${parts.map((p) => escapeHtml(String(p))).join(" · ")}</p>`;
    }

    function sourceLink(record) {
      const href = record?.sourceUrl || record?.doiUrl || "";
      if (!href) return "";
      return `<a class="btn btn-sm btn-outline-primary rounded-pill" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(labels.source)} <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i></a>`;
    }

    function renderPublicationCardResult(entry) {
      const record = entry.record;
      const url = escapeHtml(entry.url);
      const excerpt = entry.excerpt
        ? `<p class="find-explore-result-excerpt" data-find-explore-card-line="excerpt">${escapeHtml(entry.excerpt)}</p>`
        : "";
      return `<li class="find-explore-result find-explore-result--publication">
        ${renderFamilyHeader(entry)}
        ${publicationCitationBody(entry)}
        ${publicationQualityLine(record)}
        ${excerpt}
        <div class="d-flex flex-wrap gap-2 mt-2" data-find-explore-card-line="actions">
          <a class="btn btn-sm btn-primary rounded-pill" href="${url}">${escapeHtml(labels.open)}</a>
          ${sourceLink(record)}
          ${citationButton(record)}
        </div>
      </li>`;
    }

    function publicationSourceCell(record, title) {
      const href = record?.doiUrl || record?.sourceUrl || "";
      const sameAsLocal = href && href === (record?.pageUrl || "");
      const externalHref = sameAsLocal ? "" : href;
      const sourceLabel = record?.doiUrl
        ? "DOI"
        : (record?.sourceLabel === "Research.fi" ? "Research.fi" : labels.source);
      const sourceButton = externalHref
        ? `<a class="btn btn-sm btn-outline-primary rounded-pill" href="${escapeHtml(externalHref)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(sourceLabel)}: ${escapeHtml(title)}">${escapeHtml(sourceLabel)} <i class="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i></a>`
        : "";
      const citation = citationButton(record);
      return [sourceButton, citation].filter(Boolean).join("");
    }

    function renderPublicationArchiveRow(entry) {
      const record = entry.record || {};
      const title = escapeHtml(entry.title);
      const url = escapeHtml(entry.url);
      const authors = escapeHtml(record.authors || "");
      const year = escapeHtml(record.year || "");
      const typeDisplay = escapeHtml(record.typeCode || record.group || record.type || "");
      const typeTitle = escapeHtml(record.type || record.typeCode || record.group || "");
      const sourceActions = publicationSourceCell({ ...record, pageUrl: entry.url }, entry.title);
      return `<tr class="publication-archive-row publication-archive-row--search">
        <td class="publication-archive-col-year small text-muted">${year}</td>
        <td class="publication-archive-col-authors small text-muted">${authors}</td>
        <th scope="row" class="publication-archive-col-title"><a class="publication-archive-title-link fw-semibold text-decoration-none d-block" href="${url}">${title}</a></th>
        <td class="publication-archive-col-type small"${typeTitle ? ` title="${typeTitle}"` : ""}>${typeDisplay}</td>
        <td class="publication-archive-col-source text-end"><div class="publication-archive-source-actions">${sourceActions}</div></td>
      </tr>`;
    }

    // Publications FULL parity: canonical OKM publication group
    // ordering. Unclassified records fall to the tail under an
    // explicit "other" heading so the group set is never silently
    // reordered.
    const PUBLICATION_GROUP_ORDER = ["A", "B", "C", "D", "E", "F", "G"];
    const UNCLASSIFIED_KEY = "__unclassified__";
    const UNCLASSIFIED_LABEL = {
      fi: "Muut julkaisut (luokittelematon)",
      en: "Other publications (unclassified)"
    };

    function publicationGroupKey(entry) {
      const raw = String(entry?.record?.group || "").trim().toUpperCase();
      return PUBLICATION_GROUP_ORDER.indexOf(raw) >= 0 ? raw : UNCLASSIFIED_KEY;
    }

    function publicationGroupLabel(key) {
      if (key === UNCLASSIFIED_KEY) {
        return UNCLASSIFIED_LABEL[labels.langKey] || UNCLASSIFIED_LABEL.fi;
      }
      // Prefer the localized label projected on the record; fall
      // back to the bare group letter.
      const sample = latestResults.find((entry) => publicationGroupKey(entry) === key);
      if (labels.langKey === "en" && sample?.record?.groupLabelEn) return sample.record.groupLabelEn;
      if (sample?.record?.groupLabelFi) return sample.record.groupLabelFi;
      return key;
    }

    function groupPublicationEntries(entries) {
      const buckets = new Map();
      for (const entry of entries) {
        const key = publicationGroupKey(entry);
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(entry);
      }
      const orderedKeys = PUBLICATION_GROUP_ORDER.filter((k) => buckets.has(k));
      if (buckets.has(UNCLASSIFIED_KEY)) orderedKeys.push(UNCLASSIFIED_KEY);
      return orderedKeys.map((key) => ({ key, entries: buckets.get(key) }));
    }

    // Publications FULL closure: deterministic bibliographic order
    // for the default view (no free-text query). Sort key matches
    // src/_data/publicationsPage.js#sortCanonicalItems:
    //   year DESC → title ASC (fi locale).
    // publicationGroup is not folded into the sort — grouping runs
    // separately below.
    function sortResultsForBibliographicOrder(entries) {
      return [...entries].sort((left, right) => {
        const leftYear = Number(left?.record?.year) || 0;
        const rightYear = Number(right?.record?.year) || 0;
        if (leftYear !== rightYear) return rightYear - leftYear;
        const leftDate = String(left?.record?.date || "");
        const rightDate = String(right?.record?.date || "");
        const dateDiff = rightDate.localeCompare(leftDate);
        if (dateDiff !== 0) return dateDiff;
        const leftGroupIndex = PUBLICATION_GROUP_ORDER.indexOf(String(left?.record?.group || "").trim().toUpperCase());
        const rightGroupIndex = PUBLICATION_GROUP_ORDER.indexOf(String(right?.record?.group || "").trim().toUpperCase());
        if (leftGroupIndex !== rightGroupIndex) return leftGroupIndex - rightGroupIndex;
        return String(left?.title || "").localeCompare(String(right?.title || ""), "fi");
      });
    }

    function sortPublicationEntries(entries, state, locale) {
      const authorSort = state?.authorSort || "use-year";
      const yearOrder = state?.yearOrder || "year-desc";
      const normalizedLocale = String(locale || "fi").toLowerCase() === "en" ? "en" : "fi";
      const byCanonical = sortResultsForBibliographicOrder(entries);
      const canonicalIndex = new Map(byCanonical.map((entry, index) => [entry.url, index]));
      return [...entries].sort((left, right) => {
        if (authorSort === "author-asc" || authorSort === "author-desc") {
          const leftAuthors = String(left?.record?.authors || "");
          const rightAuthors = String(right?.record?.authors || "");
          const authorDiff = leftAuthors.localeCompare(rightAuthors, normalizedLocale);
          if (authorDiff !== 0) return authorSort === "author-asc" ? authorDiff : -authorDiff;
        } else {
          const leftYear = Number(left?.record?.year) || 0;
          const rightYear = Number(right?.record?.year) || 0;
          if (leftYear !== rightYear) {
            return yearOrder === "year-asc" ? leftYear - rightYear : rightYear - leftYear;
          }
          const leftDate = String(left?.record?.date || "");
          const rightDate = String(right?.record?.date || "");
          const dateDiff = yearOrder === "year-asc"
            ? leftDate.localeCompare(rightDate)
            : rightDate.localeCompare(leftDate);
          if (dateDiff !== 0) return dateDiff;
        }
        return (canonicalIndex.get(left.url) || 0) - (canonicalIndex.get(right.url) || 0);
      });
    }

    function renderResultEntry(entry) {
      if (kind === "publications" && entry.kind === "publications" && entry.record) return renderPublicationArchiveRow(entry);
      if (entry.kind === "publications" && entry.record) return renderPublicationCardResult(entry);
      if (entry.kind === "theses") {
        const title = escapeHtml(entry.title);
        const url = escapeHtml(entry.url);
        const authorLine = entry.authorLine ? escapeHtml(entry.authorLine) : "";
        const sourceUrl = entry.thesisSourceUrl ? escapeHtml(entry.thesisSourceUrl) : "";
        const typeRoleLabel = escapeHtml(entry.thesisTypeRoleLabel || "");
        const year = escapeHtml(entry.year || "");
        const sourceLink = sourceUrl
          ? `<a class="btn btn-sm btn-outline-secondary" href="${sourceUrl}" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right" aria-hidden="true"></i><span class="ms-1">OuluREPO</span></a>`
          : "";
        return `<tr class="thesis-archive-row thesis-archive-row--search">
          <td class="thesis-archive-col-year small text-muted">${year}</td>
          <td class="thesis-archive-col-author small text-muted">${authorLine}</td>
          <th scope="row" class="thesis-archive-col-title"><a class="thesis-archive-title-link fw-semibold text-decoration-none d-block" href="${url}">${title}</a></th>
          <td class="thesis-archive-col-type small">${typeRoleLabel}</td>
          <td class="thesis-archive-col-source text-end">${sourceLink}</td>
        </tr>`;
      }
      const title = escapeHtml(entry.title);
      const url = escapeHtml(entry.url);
      const excerpt = entry.excerpt
        ? `<p class="find-explore-result-excerpt" data-find-explore-card-line="excerpt">${escapeHtml(entry.excerpt)}</p>`
        : "";
      return `<li class="find-explore-result">
        ${renderFamilyHeader(entry)}
        <a class="find-explore-result-title" href="${url}">${title}</a>
        ${renderPrimaryMetaLine(entry)}
        ${excerpt}
      </li>`;
    }

    // Publications FULL closure: emit semantic nested markup so
    // assistive tech announces the group headings as headings and
    // the inner list length as the actual publication count. Each
    // group becomes <section aria-labelledby> wrapping an <h3 id>
    // and an <ol> of publication rows.
    function renderGroupedResults(grouped) {
      return grouped.map(({ key, entries }, index) => {
        const label = escapeHtml(publicationGroupLabel(key));
        const count = entries.length;
        const headingId = `${kind}-group-${escapeHtml(String(key).toLowerCase().replace(/^_+|_+$/g, ""))}`;
        const rows = entries.map(renderResultEntry).join("");
        return `<section class="find-explore-result-group" data-publication-group="${escapeHtml(key)}" aria-labelledby="${headingId}">`
          + `<h3 id="${headingId}" class="find-explore-result-group-title h5">`
          + `<span class="find-explore-result-group-label">${label}</span>`
          + ` <span class="find-explore-result-group-count text-body-secondary">(${count})</span>`
          + `</h3>`
          + `<ol class="find-explore-result-group-list list-unstyled">${rows}</ol>`
          + `</section>`;
      }).join("");
    }

    function renderPublicationArchiveGroups(grouped) {
      return grouped.map(({ key, entries }) => {
        const label = escapeHtml(publicationGroupLabel(key));
        const count = entries.length;
        const headingId = `${kind}-table-${escapeHtml(String(key).toLowerCase().replace(/^_+|_+$/g, ""))}`;
        const rows = entries.map(renderPublicationArchiveRow).join("");
        return `<section class="publication-archive-group" data-publication-group="${escapeHtml(key)}" aria-labelledby="${headingId}">`
          + `<div class="publication-archive-group-header d-flex flex-wrap align-items-start justify-content-between gap-2">`
          + `<h3 id="${headingId}" class="publication-archive-group-title h5 mb-0">${label}</h3>`
          + `<span class="badge text-bg-light border text-dark">${count}</span>`
          + `</div>`
          + `<div class="table-responsive mt-3">`
          + `<table class="table table-sm publication-archive-table align-top mb-0">`
          + `<thead><tr>`
          + `<th scope="col" class="publication-archive-col-year">${escapeHtml(labels.langKey === "en" ? "Year" : "Vuosi")}</th>`
          + `<th scope="col" class="publication-archive-col-authors">${escapeHtml(labels.langKey === "en" ? "Authors" : "Tekijät")}</th>`
          + `<th scope="col" class="publication-archive-col-title">${escapeHtml(labels.langKey === "en" ? "Title" : "Otsikko")}</th>`
          + `<th scope="col" class="publication-archive-col-type">${escapeHtml(labels.langKey === "en" ? "Type" : "Tyyppi")}</th>`
          + `<th scope="col" class="publication-archive-col-source text-end">${escapeHtml(labels.langKey === "en" ? "Source" : "Lähde")}</th>`
          + `</tr></thead>`
          + `<tbody>${rows}</tbody>`
          + `</table></div></section>`;
      }).join("");
    }

    function renderResults() {
      const state = readState();
      const renderAll = Boolean(config.renderAllResults);
      const activeQuery = queryInput?.value.trim() || "";
      // THESIS-SEARCH-UX-01 — relevance ranking only kicks in for
      // actual text queries. Filter-only or archive states keep the
      // documented per-kind bibliographic ordering (year DESC for
      // theses; publication group ordering for publications).
      //
      // When the user has entered a free-text query, Pagefind's
      // relevance score is authoritative and must not be overwritten
      // by year/author archive sorting. The previous unconditional
      // `sortThesisEntries()` call had no `!activeQuery` guard and
      // so buried high-relevance hits under the year-DESC ordering.
      // Explicit user sort interactions still win via
      // hasThesisSortInteraction (state.authorSort / yearOrder set).
      const hasExplicitThesisSort = kind === "theses" && !isDefaultThesisSortState(state);
      let orderedResults = latestResults;
      if (kind === "theses" && (!activeQuery || hasExplicitThesisSort)) {
        orderedResults = sortThesisEntries(latestResults, state, labels.langKey);
      } else if (kind === "publications") {
        orderedResults = sortPublicationEntries(latestResults, state, labels.langKey);
      } else if (config.groupByPublicationGroup && !activeQuery) {
        orderedResults = sortResultsForBibliographicOrder(latestResults);
      }
      const slice = renderAll ? orderedResults : orderedResults.slice(0, visibleCount);
      if (kind === "publications" && slice.length) {
        const grouped = groupPublicationEntries(slice);
        resultsList.innerHTML = renderPublicationArchiveGroups(grouped);
      } else if (config.groupByPublicationGroup && slice.length) {
        const grouped = groupPublicationEntries(slice);
        resultsList.innerHTML = renderGroupedResults(grouped);
      } else if (kind === "theses") {
        resultsList.innerHTML = slice.length
          ? slice.map(renderResultEntry).join("")
          : `<tr class="thesis-archive-row thesis-archive-row--empty"><td colspan="5" class="text-muted small">${escapeHtml(labels.noResults)}</td></tr>`;
      } else if (slice.length) {
        resultsList.innerHTML = `<ol class="find-explore-result-list list-unstyled mb-0">${slice.map(renderResultEntry).join("")}</ol>`;
      } else {
        resultsList.innerHTML = "";
      }
      if (renderAll) {
        moreButton?.classList.add("d-none");
      } else {
        moreButton?.classList.toggle("d-none", visibleCount >= latestResults.length);
      }
      decorateResultLinks(true);
    }

    async function runSearch() {
      const runId = ++activeSearchRunId;
      const state = readState();
      const hasQuery = Boolean(state.q);
      const hasFilters = Boolean(state.type || state.role || state.year || state.topic || state.quality);
      const hasThesisSortInteraction = kind === "theses" && !isDefaultThesisSortState(state);
      const hasPublicationSortInteraction = kind === "publications" && !isDefaultPublicationSortState(state);
      // PF5-IMPL-APA: publications archive keeps the full canonical
      // list visible only through SSR. Pagefind activates once the
      // user enters a query, applies a filter, or changes sorting.
      //
      // Filter/sort-only discovery: Pagefind supports null-query +
      // filters (equivalent to "match all records in filter set"). Every
      // F&E mount already sets FindExplore:{kind} in filtersFor(), so a
      // filter-only search returns exactly the domain we want. This
      // replaces the previous synthetic seedQuery text (e.g.
      // "__find_explore_presentations__") that used to be injected into
      // page/custom-record content to make the seed queryable — that
      // token leaked into user-visible Pagefind excerpts (P1). The seed
      // identity now lives only in the FindExplore filter, which is
      // exact-match and not part of excerpts.
      const activeDiscoveryState =
        hasQuery || hasFilters || hasThesisSortInteraction || hasPublicationSortInteraction;
      const effectiveQuery = hasQuery ? state.q : (activeDiscoveryState ? null : "");

      updateUrl(state, kind);
      visibleCount = PAGE_SIZE;

      // TH-CITE1 Phase 3 — one visible result surface for the theses
      // archive. When Find & Explore has no active query/filter the
      // canonical SSR archive is the visible baseline. When a query
      // or filter is active the SSR archive is hidden and Pagefind
      // results occupy the same visible location. Reset returns to
      // archive state. This coordination applies only to `theses`
      // mounts; other kinds keep their existing behaviour.
      if ((kind === "theses" || kind === "publications") && document.body) {
        if (activeDiscoveryState) {
          document.body.classList.add("find-explore-active");
        } else {
          document.body.classList.remove("find-explore-active");
        }
      }

      if (!activeDiscoveryState && config.requiresQueryForSearch) {
        latestResults = [];
        if ((kind === "theses" || kind === "publications") && resultsList) resultsList.innerHTML = initialResultsHtml;
        else resultsList.innerHTML = "";
        moreButton?.classList.add("d-none");
        status.textContent = labels.idle;
        decorateResultLinks(activeDiscoveryState);
        return;
      }

      if (!activeDiscoveryState) {
        latestResults = [];
        if ((kind === "theses" || kind === "publications") && resultsList) resultsList.innerHTML = initialResultsHtml;
        else resultsList.innerHTML = "";
        moreButton?.classList.add("d-none");
        status.textContent = labels.idle;
        decorateResultLinks(activeDiscoveryState);
        return;
      }

      // PF-PERF2 — mark the results list busy during the search so
      // assistive tech announces the loading state. The status text
      // ("Haetaan tuloksia...") is already user-visible.
      status.textContent = labels.loading;
      resultsList?.setAttribute("aria-busy", "true");

      try {
        const searchKinds = config.contextual
          ? (state.type ? [state.type] : contextualKinds)
          : [kind];

        // THESIS-SEARCH-UX-01 — parallelise the per-language search
        // dispatch. Previously the outer kind × language loops were
        // serial with `await` inside both, so on a search surface
        // configured with `searchLanguages = ["fi","en"]` the EN
        // runtime waited for the FI runtime to finish even when the
        // two runtimes operate on disjoint Pagefind sublanguage
        // indexes. Concurrent dispatch preserves cancellation via
        // the shared runId check (both before and after the awaits)
        // and preserves the original result ordering because the
        // returned array is index-aligned with the input.
        const kindLanguagePairs = [];
        for (const searchKind of searchKinds) {
          const filterSet = config.contextual
            ? filtersForKind(mount, state, searchKind)
            : filtersFor(mount, state);
          for (const language of searchLanguages) {
            kindLanguagePairs.push({ searchKind, filterSet, language });
          }
        }
        const searchResults = (
          await Promise.all(
            kindLanguagePairs.map(async ({ searchKind, filterSet, language }) => {
              const pagefind = await createSearch(language);
              if (runId !== activeSearchRunId) return null;
              const result = await pagefind.search(effectiveQuery, {
                filters: filterSet
              });
              if (runId !== activeSearchRunId) return null;
              return { kind: searchKind, result };
            })
          )
        ).filter(Boolean);
        if (runId !== activeSearchRunId) return;

        const typeLabel = typeSelect?.selectedOptions?.[0]?.textContent?.replace(/\s+\(\d+\)$/, "") || "";
        // PF5-IMPL-APA: kinds that show the full canonical list on
        // initial load (e.g. publications) need a higher per-search
        // ceiling than the classic 50-result cap so nothing is
        // silently truncated.
        const resultCap = config.maxResults || 50;
        const merged = [];
        for (const searchResult of searchResults) {
          searchResult.result.results.slice(0, resultCap).forEach((result) => {
            merged.push({ kind: searchResult.kind, result });
          });
        }
        merged.sort((left, right) => (right.result.score || 0) - (left.result.score || 0));

        // THESIS-SEARCH-UX-01 — hydrate candidate result data in
        // parallel while preserving score order. `Promise.all` on an
        // ordered map keeps the array index-aligned with the score-
        // sorted `merged` input, so a slower `.data()` fetch cannot
        // reorder a lower-scoring result above a higher-scoring one.
        // Dedup runs *after* hydration in a deterministic pass; a
        // duplicate URL is dropped in favour of the first
        // (highest-scoring) occurrence. This still respects the
        // per-kind resultCap.
        const hydrated = await Promise.all(
          merged.map(async (item) => {
            const data = await item.result.data();
            return { kind: item.kind, data };
          })
        );
        if (runId !== activeSearchRunId) return;

        const seen = new Set();
        const entries = [];
        for (const item of hydrated) {
          const entry = createResultEntry(item.kind, item.data, {
            ...state,
            typeLabel
          }, recordsByUrl, labels);
          if (!entry.url || seen.has(entry.url)) continue;
          seen.add(entry.url);
          entries.push(entry);
          if (entries.length >= resultCap) break;
        }

        latestResults = entries;

        if (runId !== activeSearchRunId) return;
        status.textContent = latestResults.length ? labels.count(latestResults.length) : labels.noResults;
        renderResults();
      } catch (error) {
        if (runId !== activeSearchRunId) return;
        latestResults = [];
        if ((kind === "theses" || kind === "publications") && resultsList) resultsList.innerHTML = initialResultsHtml;
        else resultsList.innerHTML = "";
        moreButton?.classList.add("d-none");
        status.textContent = labels.error;
        console.warn("FindExplore search failed", error);
        decorateResultLinks(activeDiscoveryState);
      } finally {
        if (runId === activeSearchRunId) {
          resultsList?.removeAttribute("aria-busy");
        }
      }
    }

    const debouncedSearch = debounce(runSearch);
    queryInput?.addEventListener("input", debouncedSearch);
    // PF-PERF2 fix — the search input lives inside
    // <form data-find-explore-form ...> and its inputs carry `name`
    // attributes. Without an explicit submit handler, pressing Enter
    // triggers native GET form submission, which reloads the current
    // URL with the form values as a query string. The reload drops
    // the user to the top of the page and out of the results region.
    // Intercept submit → prevent default → run the same debounced
    // search path so Enter behaves like every other filter change.
    controlsForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      runSearch();
    });
    typeSelect?.addEventListener("change", runSearch);
    roleSelect?.addEventListener("change", runSearch);
    yearSelect?.addEventListener("change", runSearch);
    yearOrderSelect?.addEventListener("change", runSearch);
    authorSortSelect?.addEventListener("change", runSearch);
    typeRoleSelect?.addEventListener("change", runSearch);
    topicSelect?.addEventListener("change", runSearch);
    qualitySelect?.addEventListener("change", runSearch);
    resetButton?.addEventListener("click", () => {
      writeState({
        q: "",
        type: "",
        role: "",
        year: "",
        topic: "",
        quality: "",
        typeRole: "",
        yearOrder: "year-desc",
        authorSort: "use-year"
      });
      queryInput?.focus();
      runSearch();
    });
    moreButton?.addEventListener("click", () => {
      visibleCount += PAGE_SIZE;
      renderResults();
    });
    window.addEventListener("popstate", () => {
      writeState(readInitialState(mount));
      runSearch();
    });

    // PF-PERF2 + THESIS-SEARCH-UX-01 — warm Pagefind before the user's
    // first explicit search. Warmup imports the Pagefind wasm module
    // and calls pagefind.init() but NEVER calls pagefind.search(), so
    // no results appear before user interaction.
    //
    // Triggers, all idempotent because createSearch caches per language:
    //   1. Eager: fire on the next microtask when the mount opts in
    //      via data-find-explore-eager-warmup (e.g. dedicated thesis
    //      search surfaces that must feel immediate). This bypasses
    //      the 2.5-second requestIdleCallback ceiling that was
    //      dominating first-search latency on /opinnaytteet/.
    //   2. Idle window after mount init (requestIdleCallback →
    //      setTimeout fallback) — kept as the default for non-eager
    //      surfaces so they do not incur wasm bandwidth before the
    //      user shows interest.
    //   3. Search input focus (one-shot).
    //   4. Pointerenter on the mount (one-shot).
    const warmup = () => warmSearchLanguages(searchLanguages);
    if (mount.dataset.findExploreEagerWarmup === "true") {
      Promise.resolve().then(warmup);
    } else {
      scheduleIdle(warmup);
    }
    queryInput?.addEventListener("focus", warmup, { once: true });
    mount.addEventListener("pointerenter", warmup, { once: true });
    mount.dataset.findExplorePagefindWarmed = "scheduled";

    mount.dataset.findExploreReady = "true";
    runSearch();
  }

  mounts.forEach((mount) => initMount(mount));
})();

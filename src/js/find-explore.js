(function () {
  "use strict";

  const PAGE_SIZE = 10;
  const mounts = Array.from(document.querySelectorAll("[data-find-explore]"));
  if (!mounts.length) return;

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

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

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

  function resultTitle(data) {
    return data?.meta?.title || data?.title || data?.url || "";
  }

  // PF3 — user-facing content-family labels aligned with the PF2 Pagefind
  // `Sisältö:*` vocabulary. Deliberately Finnish across FI and EN mounts
  // so the visible label matches the actual Pagefind filter value.
  const SISALTO_LABELS = {
    publications: "Julkaisut",
    theses: "Opinnäytteet",
    writings: "Kirjoitukset ja puheenvuorot",
    presentations: "Esitykset",
    media: "Mediassa"
  };

  function contentFamilyLabelFromData(kind, data) {
    const fromFilter = Array.isArray(data?.filters?.["Sisältö"])
      ? data.filters["Sisältö"].find(Boolean)
      : "";
    if (fromFilter) return fromFilter;
    return SISALTO_LABELS[kind] || "";
  }

  function renderFamilyHeader(entry) {
    const label = entry?.contentFamilyLabel;
    if (!label) return "";
    const year = entry?.year || "";
    const yearMarkup = year
      ? `<span class="find-explore-result-year" data-find-explore-card-year>${escapeHtml(String(year))}</span>`
      : "";
    return `<div class="find-explore-result-family" data-find-explore-card-line="family"><span class="find-explore-result-family-badge" data-find-explore-family="${escapeHtml(entry.kind || "")}">${escapeHtml(label)}</span>${yearMarkup}</div>`;
  }

  // PF4 — render the single primary metadata sentence line under the
  // title. Each family's `resultMeta` now returns an already-composed
  // list of strings; PF4 joins them with a middot separator and emits
  // them as a text line rather than the old chip strip.
  function renderPrimaryMetaLine(entry) {
    const parts = Array.isArray(entry?.meta) ? entry.meta.filter(Boolean) : [];
    if (parts.length === 0) return "";
    return `<p class="find-explore-result-primary-meta" data-find-explore-card-line="primary-meta">${parts.map((p) => escapeHtml(String(p))).join(" · ")}</p>`;
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
      // PF4: single primary metadata line — author line + thesis type,
      // joined by the shared renderer. Year moved to family header.
      resultMeta(entry) {
        return [entry.authorLine, entry.typeLabel].filter(Boolean);
      },
      excerpt(data) {
        return data?.meta?.thesesDescription || data?.excerpt || "";
      },
      requiresQueryForSearch: false
    },
    publications: {
      filterPrefix: "Publications",
      typeFilterKey: "Publications group",
      yearFilterKey: "Publications year",
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
      // PF5-IMPL-APA: the publications archive shows the full canonical
      // list on initial load. When the user has entered no query and
      // no filters, the seed query is used as the effective query so
      // Pagefind returns every publication.
      showAllByDefault: true,
      // Per-search result ceiling for the publications kind — high
      // enough that the canonical 56 publications (and comfortable
      // growth headroom) never get truncated. Other kinds keep the
      // classic 50-result cap.
      maxResults: 200,
      // Publications FULL parity: professional publication list is
      // small enough to render every result at once — no
      // "Näytä lisää" paging.
      renderAllResults: true,
      // Group publication result rows by canonical OKM
      // publicationGroup (A–G + unclassified). Data flow:
      //   canonical publicationGroup
      //     → publicationsFindExplore record.group + groupLabelFi/En
      //     → this renderer emits <li class="find-explore-result-group-heading">
      //       between rows sharing the same group.
      groupByPublicationGroup: true
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

    if (state.type) filters[config.typeFilterKey || `${prefix} type`] = state.type;
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

    if (state.year) filters[config.yearFilterKey || `${prefix} year`] = state.year;
    if (state.topic) filters[config.topicFilterKey || `${prefix} topic`] = state.topic;
    if (state.quality && kind === "publications") {
      filters[config.qualityFilterKey || `${prefix} quality`] = state.quality;
    }
    return filters;
  }

  function readInitialState(mount) {
    const params = new URLSearchParams(window.location.search);
    return {
      q: params.get("q") || "",
      type: params.get("type") || "",
      year: params.get("year") || "",
      topic: params.get("topic") || "",
      quality: params.get("quality") || ""
    };
  }

  function updateUrl(state) {
    const next = new URLSearchParams(window.location.search);
    Object.entries(state).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
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
    const typeLabel = state.typeLabel || data?.meta?.thesesType || "";
    const year = state.year || data?.meta?.writingsYear || data?.meta?.thesesYear || data?.meta?.PresentationYear || "";
    const authorLine = data?.meta?.thesesAuthorLine || "";
    const publicationMeta = record ? {
      authors: record.authors || "",
      typeLabel: record.typeCode || record.group || "",
      year: record.year || "",
      venue: record.venue || "",
      citationCount: record.citationCount || 0,
      jufoLevel: record.jufoLevel || "",
      peerReviewed: record.peerReviewed,
      openAccess: record.openAccess
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
      record,
      // PF4: year lives on line 1 (family header) rather than the
      // primary-meta line. Presentation type/event surface directly
      // on the entry so the presentations resultMeta can compose a
      // single sentence without another indirection.
      year: resolvedYear,
      presentationType: data?.meta?.PresentationType || "",
      presentationEvent: data?.meta?.PresentationEvent || "",
      // PF5 — payload for the presentation horizontal renderer.
      // Only populated for the presentations kind so other kinds
      // see it as null.
      _presentationMeta: kind === "presentations" ? {
        sourceType: data?.meta?.PresentationSourceType || "",
        landingType: data?.meta?.PresentationLandingType || "",
        role: data?.meta?.PresentationRole || ""
      } : null,
      contentFamilyLabel: contentFamilyLabelFromData(kind, data)
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
    const resultsList = mount.querySelector("[data-find-explore-results]");
    const moreButton = mount.querySelector("[data-find-explore-more]");
    const controlsForm = mount.querySelector("[data-find-explore-form]");
    const seedQuery = mount.dataset.findExploreSeedQuery || "";
    const recordsByUrl = readRecords(mount);

    mount.dataset.findExploreReady = "false";

    let latestResults = [];
    let visibleCount = PAGE_SIZE;

    function readState() {
      return {
        q: queryInput?.value.trim() || "",
        type: typeSelect?.value || "",
        year: yearSelect?.value || "",
        topic: topicSelect?.value || "",
        quality: qualitySelect?.value || ""
      };
    }

    function writeState(state) {
      if (queryInput) queryInput.value = state.q || "";
      if (typeSelect) typeSelect.value = state.type || "";
      if (yearSelect) yearSelect.value = state.year || "";
      if (topicSelect) topicSelect.value = state.topic || "";
      if (qualitySelect) qualitySelect.value = state.quality || "";
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

    // PF5 — Presentation horizontal variant. Source-key icon on the
    // left, four-line body on the right (family badge · year on top,
    // title link, primary meta = presentation type + event, excerpt).
    // Icon-only fallback per PF5 audit §13a — no new Pagefind
    // metadata required. Bootstrap Icons picked to mirror the
    // existing src/_includes/presentations/result-card.njk mapping.
    const PRESENTATION_SOURCE_ICON = {
      canva: "bi-file-earmark-slides",
      slideshare: "bi-collection-play",
      youtube: "bi-youtube",
      youtubeVideos: "bi-youtube",
      aoe: "bi-book"
    };
    function presentationSourceIcon(sourceType) {
      const key = String(sourceType || "").trim();
      return PRESENTATION_SOURCE_ICON[key] || "bi-easel2";
    }

    function renderPresentationResult(entry) {
      const url = escapeHtml(entry.url);
      const sourceIcon = presentationSourceIcon(entry?._presentationMeta?.sourceType);
      const isExternal = String(entry?._presentationMeta?.landingType || "").toLowerCase().indexOf("external") === 0;
      const targetAttrs = isExternal ? ` target="_blank" rel="noopener noreferrer"` : "";
      const excerpt = entry.excerpt
        ? `<p class="find-explore-result-excerpt" data-find-explore-card-line="excerpt">${escapeHtml(entry.excerpt)}</p>`
        : "";
      return `<li class="find-explore-result find-explore-result--presentation">
        <span class="find-explore-result-presentation-thumb" aria-hidden="true"><i class="bi ${sourceIcon}"></i></span>
        <div class="find-explore-result-presentation-body">
          ${renderFamilyHeader(entry)}
          <a class="find-explore-result-title" href="${url}"${targetAttrs}>${escapeHtml(entry.title)}</a>
          ${renderPrimaryMetaLine(entry)}
          ${excerpt}
        </div>
      </li>`;
    }

    function renderPublicationResult(entry) {
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
        return String(left?.title || "").localeCompare(String(right?.title || ""), "fi");
      });
    }

    function renderResultEntry(entry) {
      if (entry.kind === "publications" && entry.record) return renderPublicationResult(entry);
      if (entry.kind === "presentations") return renderPresentationResult(entry);
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

    function renderResults() {
      const renderAll = Boolean(config.renderAllResults);
      const activeQuery = queryInput?.value.trim() || "";
      // Deterministic bibliographic order when the user has not
      // entered a free-text query. Any structured facet state still
      // uses bibliographic order — filters narrow the set, but
      // relevance ranking only kicks in for actual text queries.
      const orderedResults = (config.groupByPublicationGroup && !activeQuery)
        ? sortResultsForBibliographicOrder(latestResults)
        : latestResults;
      const slice = renderAll ? orderedResults : orderedResults.slice(0, visibleCount);
      if (config.groupByPublicationGroup && slice.length) {
        const grouped = groupPublicationEntries(slice);
        resultsList.innerHTML = renderGroupedResults(grouped);
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
    }

    async function runSearch() {
      const state = readState();
      const hasQuery = Boolean(state.q);
      const hasFilters = Boolean(state.type || state.year || state.topic || state.quality);
      // PF5-IMPL-APA: publications archive keeps the full canonical
      // list visible on initial load — fall back to the seed query
      // even without filters when the kind opted in.
      const useSeedForEmpty = config.showAllByDefault && seedQuery;
      const effectiveQuery = hasQuery
        ? state.q
        : ((hasFilters || useSeedForEmpty) && seedQuery ? seedQuery : "");

      updateUrl(state);
      visibleCount = PAGE_SIZE;

      if (!effectiveQuery && config.requiresQueryForSearch) {
        latestResults = [];
        resultsList.innerHTML = "";
        moreButton?.classList.add("d-none");
        status.textContent = labels.idle;
        return;
      }

      if (!effectiveQuery) {
        latestResults = [];
        resultsList.innerHTML = "";
        moreButton?.classList.add("d-none");
        status.textContent = labels.idle;
        return;
      }

      // PF-PERF2 — mark the results list busy during the search so
      // assistive tech announces the loading state. The status text
      // ("Haetaan tuloksia...") is already user-visible.
      status.textContent = labels.loading;
      resultsList?.setAttribute("aria-busy", "true");

      try {
        const searchResults = [];
        const searchKinds = config.contextual
          ? (state.type ? [state.type] : contextualKinds)
          : [kind];
        for (const searchKind of searchKinds) {
          const filterSet = config.contextual
            ? filtersForKind(mount, state, searchKind)
            : filtersFor(mount, state);
          for (const language of searchLanguages) {
            const pagefind = await createSearch(language);
            const result = await pagefind.search(effectiveQuery, {
              filters: filterSet
            });
            searchResults.push({ kind: searchKind, result });
          }
        }

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

        const seen = new Set();
        const entries = [];
        for (const item of merged) {
          const data = await item.result.data();
          const entry = createResultEntry(item.kind, data, {
            ...state,
            typeLabel
          }, recordsByUrl, labels);
          if (!entry.url || seen.has(entry.url)) continue;
          seen.add(entry.url);
          entries.push(entry);
          if (entries.length >= resultCap) break;
        }

        latestResults = entries;

        status.textContent = latestResults.length ? labels.count(latestResults.length) : labels.noResults;
        renderResults();
      } catch (error) {
        latestResults = [];
        resultsList.innerHTML = "";
        moreButton?.classList.add("d-none");
        status.textContent = labels.error;
        console.warn("FindExplore search failed", error);
      } finally {
        resultsList?.removeAttribute("aria-busy");
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
    yearSelect?.addEventListener("change", runSearch);
    topicSelect?.addEventListener("change", runSearch);
    qualitySelect?.addEventListener("change", runSearch);
    resetButton?.addEventListener("click", () => {
      writeState({ q: "", type: "", year: "", topic: "", quality: "" });
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

    // PF-PERF2 — warm Pagefind before the user's first explicit
    // search. Three orthogonal triggers, all idempotent because
    // createSearch caches per language:
    //   1. Idle window after mount init (requestIdleCallback → setTimeout).
    //   2. Search input focus (one-shot).
    //   3. Pointerenter on the mount (one-shot).
    // None of these calls pagefind.search — no auto-search on load.
    const warmup = () => warmSearchLanguages(searchLanguages);
    scheduleIdle(warmup);
    queryInput?.addEventListener("focus", warmup, { once: true });
    mount.addEventListener("pointerenter", warmup, { once: true });
    mount.dataset.findExplorePagefindWarmed = "scheduled";

    mount.dataset.findExploreReady = "true";
    runSearch();
  }

  mounts.forEach((mount) => initMount(mount));
})();

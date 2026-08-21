(function (global) {
  "use strict";

  const ARCHIVE_PAGE_SIZE = 12;
  const SOURCE_PAGE_SIZE = 6;

  const SOURCE_SECTION_KEYS = ["aoe", "canva", "slideshare", "youtubeVideos", "youtube"];

  const SOURCE_META = {
    aoe: {
      icon: "bi-book",
      label: { fi: "AOE / oppimateriaali", en: "AOE / learning material" },
      cta: { fi: "Avaa Finnassa", en: "Open in Finna" },
      detailCta: { fi: "Avaa sivu", en: "Open page" }
    },
    canva: {
      icon: "bi-file-earmark-slides",
      label: { fi: "Canva", en: "Canva" },
      cta: { fi: "Avaa Canva", en: "Open Canva" },
      detailCta: { fi: "Avaa sivu", en: "Open page" }
    },
    slideshare: {
      icon: "bi-collection-play",
      label: { fi: "SlideShare", en: "SlideShare" },
      cta: { fi: "Avaa SlideSharessa", en: "Open on SlideShare" },
      detailCta: { fi: "Avaa sivu", en: "Open page" }
    },
    youtubeVideos: {
      icon: "bi-youtube",
      label: { fi: "YouTube-video", en: "YouTube video" },
      cta: { fi: "Katso", en: "Watch" },
      detailCta: { fi: "Avaa sivu", en: "Open page" }
    },
    youtube: {
      icon: "bi-youtube",
      label: { fi: "YouTube-soittolista", en: "YouTube playlist" },
      cta: { fi: "Avaa YouTubessa", en: "Open on YouTube" },
      detailCta: { fi: "Avaa sivu", en: "Open page" }
    }
  };

  const UI = {
    fi: {
      archiveItemSingular: "esitys",
      archiveItemPlural: "esitystä",
      resultsPrefix: "Näytetään",
      ofLabel: "/",
      empty: "Hakuehdoilla ei löytynyt esityksiä.",
      exactTopicHint: "Aihe suodattaa vain tarkat osumat.",
      externalLabel: "Ulkoinen kohde",
      localLabel: "Paikallinen sivu",
      openLabel: "Avaa",
      paginationLabel: "Sivu",
      featuredBadge: "Uusin",
      sourcePageLabel: "Sisältösivu",
      noKeywords: "Ei avainsanoja",
      noLink: "Ei linkkiä",
      notAvailable: "Ei saatavilla"
    },
    en: {
      archiveItemSingular: "presentation",
      archiveItemPlural: "presentations",
      resultsPrefix: "Showing",
      ofLabel: "of",
      empty: "No presentations matched the current filters.",
      exactTopicHint: "Topic filtering matches exact canonical topics.",
      externalLabel: "External destination",
      localLabel: "Local page",
      openLabel: "Open",
      paginationLabel: "Page",
      featuredBadge: "Latest",
      sourcePageLabel: "Presentation page",
      noKeywords: "No keywords",
      noLink: "No link",
      notAvailable: "Not available"
    }
  };

  function ensureDeps() {
    if (!global.PE || typeof global.PE.escHtml !== "function") {
      console.error("presentations-page: /js/pe-list-render.js puuttuu");
      return false;
    }
    if (!global.ContentEngine || typeof global.ContentEngine.prefetch !== "function") {
      console.error("presentations-page: /js/content-engine.js puuttuu");
      return false;
    }
    if (!global.ContentPresets || typeof global.ContentPresets.queryPreset !== "function") {
      console.error("presentations-page: /js/content-presets.js puuttuu");
      return false;
    }
    return true;
  }

  function escHtml(value) {
    return global.PE.escHtml(value);
  }

  function localeFor(value) {
    return value === "en" ? "en" : "fi";
  }

  function labelsFor(locale) {
    return UI[localeFor(locale)];
  }

  function isExternalUrl(url) {
    return /^https?:\/\//i.test(String(url || ""));
  }

  function linkAttrs(url) {
    return isExternalUrl(url) ? ' target="_blank" rel="noopener noreferrer"' : "";
  }

  function truncate(value, max) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max).trim()}...` : text;
  }

  function normalizeForMatch(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
  }

  function toIsoDate(value) {
    if (!value) return "";
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    if (/^\d{4}$/.test(raw)) return `${raw}-12-31`;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsed.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDate(value, locale) {
    if (!value) return "";
    const raw = String(value).trim();
    if (/^\d{4}$/.test(raw)) return raw;
    const iso = toIsoDate(raw);
    if (!iso) return raw;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return raw;
    return global.PE.createDateFormatter(locale).format(parsed);
  }

  function sortByDateDesc(items) {
    return [...items].sort((a, b) => {
      const aDate = toIsoDate(a && a.date);
      const bDate = toIsoDate(b && b.date);
      if (aDate !== bDate) return String(bDate).localeCompare(String(aDate));
      return String(a && a.title || "").localeCompare(String(b && b.title || ""));
    });
  }

  function landingUrl(item) {
    return item && (item.landingUrl || item.localPageUrl || item.pageUrl || item.url || item.externalUrl || item.sourceUrl) || "";
  }

  function directSourceUrl(item) {
    return item && (item.sourceUrl || item.externalUrl || item.url || item.landingUrl || item.pageUrl || item.localPageUrl) || "";
  }

  function iconFor(item) {
    const key = item && item.sourceKey;
    return (SOURCE_META[key] && SOURCE_META[key].icon) || "bi-easel2";
  }

  function exactTopicMap(items) {
    const map = new Map();
    items.forEach((item) => {
      const topics = Array.isArray(item && item.topics) ? item.topics : [];
      topics.forEach((topic) => {
        const normalized = normalizeForMatch(topic);
        if (normalized && !map.has(normalized)) map.set(normalized, topic);
      });
    });
    return map;
  }

  function topicOptions(items) {
    const counts = new Map();
    items.forEach((item) => {
      const topics = Array.isArray(item && item.topics) ? item.topics : [];
      topics.forEach((topic) => {
        const label = String(topic || "").trim();
        if (!label) return;
        counts.set(label, (counts.get(label) || 0) + 1);
      });
    });
    return [...counts.entries()]
      .sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0], "fi");
      })
      .map(([label]) => label);
  }

  function archiveCardHtml(item, locale) {
    const labels = labelsFor(locale);
    let url = landingUrl(item);
    const external = Boolean(item && item.externalFirst) || isExternalUrl(url);
    if (!external && url && url.startsWith("/presentations/") && typeof window !== "undefined" && window.location) {
      const returnTo = window.location.pathname + window.location.search;
      if (returnTo) {
        const sep = url.includes("?") ? "&" : "?";
        url = `${url}${sep}returnTo=${encodeURIComponent(returnTo)}`;
      }
    }
    const meta = [];
    const displayDate = formatDate(item && (item.date || item.year), locale);
    if (displayDate) meta.push(`<span class="presentation-archive-card-detail"><i class="bi bi-calendar3"></i>${escHtml(displayDate)}</span>`);
    if (item && item.presentationType) meta.push(`<span class="presentation-archive-card-detail"><i class="bi bi-tag"></i>${escHtml(item.presentationType)}</span>`);
    if (item && item.event) meta.push(`<span class="presentation-archive-card-detail"><i class="bi bi-geo-alt"></i>${escHtml(truncate(item.event, 48))}</span>`);
    const topics = Array.isArray(item && item.topics) ? item.topics.slice(0, 3) : [];
    const thumb = item && item.thumbnail
      ? `<span class="presentation-archive-card-thumb-placeholder"><i class="bi ${escHtml(iconFor(item))}"></i></span><img src="${escHtml(item.thumbnail)}" alt="" class="presentation-archive-card-thumb-image" loading="lazy" decoding="async">`
      : `<span class="presentation-archive-card-thumb-placeholder"><i class="bi ${escHtml(iconFor(item))}"></i></span>`;

    return `
      <article class="presentation-archive-card">
        <div class="presentation-archive-card-thumb">${thumb}</div>
        <div class="presentation-archive-card-body">
          <div class="presentation-archive-card-header">
            <div class="presentation-archive-card-meta presentation-archive-card-meta--primary">
              ${item && item.sourceLabel ? `<span>${escHtml(item.sourceLabel)}</span>` : ""}
              <span>${external ? escHtml(labels.externalLabel) : escHtml(labels.localLabel)}</span>
            </div>
            <h3 class="presentation-archive-card-title">
              <a href="${escHtml(url)}"${linkAttrs(url)}>${escHtml(item && item.title || "")}</a>
            </h3>
            ${item && item.description ? `<p class="presentation-archive-card-desc">${escHtml(truncate(item.description, 180))}</p>` : ""}
          </div>

          ${meta.length ? `<div class="presentation-archive-card-meta presentation-archive-card-meta--details">${meta.join("")}</div>` : ""}

          ${topics.length ? `
            <div class="presentation-archive-card-meta presentation-archive-card-meta--secondary">
              ${topics.map((topic) => `<span>${escHtml(topic)}</span>`).join("")}
            </div>
          ` : ""}

          <div class="presentation-archive-card-actions">
            <a href="${escHtml(url)}"${linkAttrs(url)} class="btn btn-primary btn-sm rounded-pill px-3">
              ${escHtml(labels.openLabel)}
              <i class="bi ${external ? "bi-arrow-up-right" : "bi-arrow-right"} ms-1"></i>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function renderPagination(listEl, totalPages, currentPage, onPageChange, locale) {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (totalPages <= 1) return;

    const labels = labelsFor(locale);
    for (let page = 1; page <= totalPages; page += 1) {
      const li = document.createElement("li");
      li.className = `page-item${page === currentPage ? " active" : ""}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "page-link";
      button.setAttribute("aria-label", `${labels.paginationLabel} ${page}`);
      button.textContent = String(page);
      button.addEventListener("click", () => onPageChange(page));
      li.appendChild(button);
      listEl.appendChild(li);
    }
  }

  function updateArchiveStatus(el, total, shownFrom, shownTo, locale) {
    if (!el) return;
    const labels = labelsFor(locale);
    if (total === 0) {
      el.textContent = labels.empty;
      return;
    }
    el.textContent = `${labels.resultsPrefix} ${shownFrom}-${shownTo} ${labels.ofLabel} ${total} ${total === 1 ? labels.archiveItemSingular : labels.archiveItemPlural}.`;
  }

  function archiveItemsForState(items, state) {
    const filters = {};
    if (state.year) filters.year = Number(state.year);
    if (state.topic) filters.topics = state.topic;

    return global.ContentPresets.queryPreset(items, "FindExplore:presentations", {
      search: state.search,
      filters
    }).items;
  }

  function wireArchive(root, items) {
    const locale = localeFor(root.dataset.locale);
    const searchInput = root.querySelector('[data-presentation-control="search"]');
    const yearSelect = root.querySelector('[data-presentation-control="year"]');
    const topicInput = root.querySelector('[data-presentation-control="topic"]');
    const topicList = root.querySelector("datalist");
    const resetButton = root.querySelector("[data-presentation-reset]");
    const resultsEl = root.querySelector("[data-presentation-results]");
    const statusEl = root.querySelector("[data-presentation-status]");
    const paginationNav = root.querySelector("[data-presentation-pagination-nav]");
    const paginationEl = root.querySelector("[data-presentation-pagination]");
    const topicMap = exactTopicMap(items);
    const state = { search: "", year: "", topic: "", page: 1 };

    const years = [...new Set(items.map((item) => String(item && item.year || "").trim()).filter(Boolean))]
      .filter((value) => /^\d{4}$/.test(value))
      .sort((a, b) => Number(b) - Number(a));

    years.forEach((year) => {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });

    topicOptions(items).forEach((topic) => {
      const option = document.createElement("option");
      option.value = topic;
      topicList.appendChild(option);
    });

    function render() {
      const filteredItems = archiveItemsForState(items, state);
      const total = filteredItems.length;
      const totalPages = Math.max(1, Math.ceil(total / ARCHIVE_PAGE_SIZE));
      if (state.page > totalPages) state.page = totalPages;
      const start = (state.page - 1) * ARCHIVE_PAGE_SIZE;
      const pageItems = filteredItems.slice(start, start + ARCHIVE_PAGE_SIZE);

      if (total === 0) {
        resultsEl.innerHTML = `<div class="text-muted text-center py-4">${escHtml(labelsFor(locale).empty)}</div>`;
      } else {
        resultsEl.innerHTML = pageItems.map((item) => archiveCardHtml(item, locale)).join("");
      }

      updateArchiveStatus(statusEl, total, total === 0 ? 0 : start + 1, Math.min(start + ARCHIVE_PAGE_SIZE, total), locale);
      paginationNav.hidden = totalPages <= 1;
      renderPagination(paginationEl, totalPages, state.page, (page) => {
        state.page = page;
        render();
      }, locale);
    }

    function syncTopicValue() {
      const normalized = normalizeForMatch(topicInput.value);
      state.topic = topicMap.get(normalized) || "";
    }

    searchInput.addEventListener("input", () => {
      state.search = searchInput.value.trim();
      state.page = 1;
      render();
    });

    yearSelect.addEventListener("change", () => {
      state.year = yearSelect.value;
      state.page = 1;
      render();
    });

    topicInput.addEventListener("change", () => {
      syncTopicValue();
      state.page = 1;
      render();
    });

    topicInput.addEventListener("blur", () => {
      syncTopicValue();
      if (state.topic) topicInput.value = state.topic;
      state.page = 1;
      render();
    });

    resetButton.addEventListener("click", () => {
      state.search = "";
      state.year = "";
      state.topic = "";
      state.page = 1;
      searchInput.value = "";
      yearSelect.value = "";
      topicInput.value = "";
      render();
    });

    render();
  }

  function sourceItemsByKey(items, locale) {
    const result = {
      aoe: [],
      canva: [],
      slideshare: [],
      youtubeVideos: [],
      youtube: []
    };

    items.forEach((item) => {
      if (!item || !result[item.sourceKey]) return;
      if (locale === "en" && item.sourceKey === "canva" && item.lang !== "en") return;
      result[item.sourceKey].push(item);
    });

    Object.keys(result).forEach((key) => {
      result[key] = sortByDateDesc(result[key]);
    });

    return result;
  }

  function keywordBadges(item, locale) {
    const values = [...new Set([]
      .concat(Array.isArray(item && item.categories) ? item.categories : [])
      .concat(Array.isArray(item && item.keywords) ? item.keywords : [])
      .map((value) => String(value || "").trim())
      .filter(Boolean)
    )];
    if (!values.length) return `<span class="text-muted small">${escHtml(labelsFor(locale).noKeywords)}</span>`;
    return values.slice(0, 4)
      .map((value) => `<span class="badge text-bg-light text-dark border me-1 mb-1">${escHtml(value)}</span>`)
      .join("");
  }

  function sourceFeaturedHtml(item, key, locale) {
    const labels = labelsFor(locale);
    const meta = SOURCE_META[key] || SOURCE_META.canva;
    const href = directSourceUrl(item);
    const thumb = item && item.thumbnail
      ? `<img src="${escHtml(item.thumbnail)}" alt="${escHtml(item.title || "")}" class="featured-thumb" style="object-fit:cover;" loading="lazy" decoding="async">`
      : `<div class="featured-thumb" style="background:var(--bs-secondary-bg);display:flex;align-items:center;justify-content:center;color:var(--bs-secondary-color);font-size:1.5rem;"><i class="bi ${escHtml(meta.icon)}"></i></div>`;
    const date = formatDate(item && item.date, locale);
    const desc = truncate(item && (item.description || ""), 140);
    return `
      <div class="card border-0 shadow-sm mb-4 overflow-hidden">
        <div class="d-flex align-items-stretch">
          <div class="flex-shrink-0 overflow-hidden">${thumb}</div>
          <div class="card-body py-2 px-3 d-flex flex-column justify-content-center">
            <p class="text-muted small mb-1">
              ${date ? `<i class="bi bi-calendar3 me-1"></i>${escHtml(date)}&ensp;` : ""}
              <span class="badge text-bg-warning text-dark fw-semibold" style="font-size:.65rem;">${escHtml(labels.featuredBadge)}</span>
            </p>
            <h3 class="h6 fw-bold mb-1 lh-sm">${escHtml(item && item.title || "")}</h3>
            ${desc ? `<p class="text-muted small mb-2">${escHtml(desc)}</p>` : ""}
            ${href ? `<a href="${escHtml(href)}"${linkAttrs(href)} class="btn btn-primary btn-sm rounded-pill px-3 align-self-start">${escHtml(meta.cta[locale])} <i class="bi bi-arrow-up-right"></i></a>` : ""}
          </div>
        </div>
      </div>
    `;
  }

  function renderSourceTableRows(key, rows, locale) {
    const labels = labelsFor(locale);
    const meta = SOURCE_META[key] || SOURCE_META.canva;

    return rows.map((item) => {
      const sourceHref = directSourceUrl(item);
      const pageHref = item && (item.localPageUrl || item.pageUrl || "");
      const titleLink = sourceHref
        ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="text-decoration-none fw-semibold">${escHtml(item && item.title || "")}</a>`
        : `<span class="fw-semibold">${escHtml(item && item.title || "")}</span>`;
      const pageLink = pageHref && pageHref !== sourceHref
        ? `<a href="${escHtml(pageHref)}" class="btn btn-outline-secondary btn-sm rounded-pill px-2" title="${escHtml(labels.sourcePageLabel)}"><i class="bi bi-file-earmark-text"></i></a>`
        : "";

      if (key === "youtubeVideos") {
        const preview = item && item.thumbnail
          ? `<img src="${escHtml(item.thumbnail)}" alt="" loading="lazy" decoding="async" style="width:120px;height:68px;object-fit:cover;border-radius:.75rem;">`
          : `<span class="text-muted small">${escHtml(labels.notAvailable)}</span>`;
        return `
          <tr>
            <td>${preview}</td>
            <td>${titleLink}</td>
            <td class="small text-muted">${escHtml(truncate(item && item.description, 160) || "")}</td>
            <td class="small text-muted text-nowrap">${escHtml(formatDate(item && item.date, locale) || "-")}</td>
            <td class="text-nowrap">
              ${sourceHref ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="btn btn-outline-primary btn-sm rounded-pill px-3">${escHtml(meta.cta[locale])}</a>` : `<span class="text-muted small">${escHtml(labels.noLink)}</span>`}
              ${pageLink}
            </td>
          </tr>
        `;
      }

      if (key === "canva" || key === "slideshare") {
        const preview = item && item.thumbnail
          ? `<img src="${escHtml(item.thumbnail)}" alt="" loading="lazy" decoding="async" style="width:120px;height:68px;object-fit:cover;border-radius:.75rem;">`
          : `<span class="badge text-bg-light text-dark border">${escHtml(meta.label[locale])}</span>`;
        return `
          <tr>
            <td class="small text-muted text-nowrap text-center">${escHtml(formatDate(item && item.date, locale) || "-")}</td>
            <td>${preview}</td>
            <td>${titleLink}</td>
            <td class="small text-muted">${escHtml(truncate(item && item.description, 180) || "")}</td>
            <td>${keywordBadges(item, locale)}</td>
            <td class="text-center text-nowrap">
              ${sourceHref ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="btn btn-outline-primary btn-sm rounded-pill px-2" title="${escHtml(meta.cta[locale])}"><i class="bi bi-arrow-up-right"></i></a>` : `<span class="text-muted small">${escHtml(labels.noLink)}</span>`}
              ${pageLink}
            </td>
          </tr>
        `;
      }

      return `
        <tr>
          <td>${titleLink}</td>
          <td class="small text-muted">${escHtml(truncate(item && item.description, 180) || meta.label[locale])}</td>
          <td class="small text-muted text-nowrap">${escHtml(formatDate(item && (item.date || item.year), locale) || "-")}</td>
          <td class="text-nowrap">
            ${sourceHref ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="btn btn-outline-primary btn-sm rounded-pill px-3">${escHtml(meta.cta[locale])}</a>` : `<span class="text-muted small">${escHtml(labels.noLink)}</span>`}
            ${pageLink}
          </td>
        </tr>
      `;
    }).join("");
  }

  function renderMobileSourceList(key, rows, locale) {
    const labels = labelsFor(locale);
    const meta = SOURCE_META[key] || SOURCE_META.canva;
    return rows.map((item) => {
      const sourceHref = directSourceUrl(item);
      const pageHref = item && (item.localPageUrl || item.pageUrl || "");
      return `
        <li class="mb-3">
          <article class="presentation-archive-card">
            <div class="presentation-archive-card-body">
              <div class="presentation-archive-card-header">
                <div class="presentation-archive-card-meta presentation-archive-card-meta--primary">
                  <span>${escHtml(meta.label[locale])}</span>
                </div>
                <h3 class="presentation-archive-card-title">${escHtml(item && item.title || "")}</h3>
                ${item && item.description ? `<p class="presentation-archive-card-desc">${escHtml(truncate(item.description, 140))}</p>` : ""}
              </div>
              <div class="presentation-archive-card-meta presentation-archive-card-meta--details">
                ${item && (item.date || item.year) ? `<span class="presentation-archive-card-detail"><i class="bi bi-calendar3"></i>${escHtml(formatDate(item.date || item.year, locale))}</span>` : ""}
              </div>
              <div class="presentation-archive-card-actions">
                ${sourceHref ? `<a href="${escHtml(sourceHref)}"${linkAttrs(sourceHref)} class="btn btn-outline-primary btn-sm rounded-pill px-3">${escHtml(meta.cta[locale])}</a>` : `<span class="text-muted small">${escHtml(labels.noLink)}</span>`}
                ${pageHref && pageHref !== sourceHref ? `<a href="${escHtml(pageHref)}" class="btn btn-outline-secondary btn-sm rounded-pill px-3">${escHtml(labels.sourcePageLabel)}</a>` : ""}
              </div>
            </div>
          </article>
        </li>
      `;
    }).join("");
  }

  function wireSourceSections(items, locale) {
    const byKey = sourceItemsByKey(items, locale);

    SOURCE_SECTION_KEYS.forEach((key) => {
      const tbody = document.getElementById(`table-body-${key}`);
      const mobileList = document.getElementById(`mobile-list-${key}`);
      const featured = document.getElementById(`featured-${key}`);
      const pagination = document.getElementById(`pagination-${key}`);

      if (!tbody && !mobileList && !featured) return;

      const allRows = byKey[key] || [];
      if (!allRows.length) {
        if (featured) featured.innerHTML = "";
        if (tbody) tbody.innerHTML = "";
        if (mobileList) mobileList.innerHTML = "";
        if (pagination) pagination.innerHTML = "";
        return;
      }

      if (featured) featured.innerHTML = sourceFeaturedHtml(allRows[0], key, locale);
      const pagedRows = featured ? allRows.slice(1) : allRows;

      function render(page) {
        const totalPages = Math.max(1, Math.ceil(pagedRows.length / SOURCE_PAGE_SIZE));
        const currentPage = Math.min(page, totalPages);
        const start = (currentPage - 1) * SOURCE_PAGE_SIZE;
        const slice = pagedRows.slice(start, start + SOURCE_PAGE_SIZE);
        if (tbody) tbody.innerHTML = renderSourceTableRows(key, slice, locale);
        if (mobileList) mobileList.innerHTML = renderMobileSourceList(key, slice, locale);
        renderPagination(pagination, totalPages, currentPage, render, locale);
      }

      if (pagedRows.length) render(1);
    });
  }

  async function init() {
    if (!ensureDeps()) return;

    const archiveRoots = Array.from(document.querySelectorAll("[data-presentation-find-explore]"));
    const wantsSourceSections = SOURCE_SECTION_KEYS.some((key) => document.getElementById(`table-body-${key}`) || document.getElementById(`mobile-list-${key}`));
    if (!archiveRoots.length && !wantsSourceSections) return;

    const items = await global.ContentEngine.prefetch("presentationsPage");
    if (!Array.isArray(items) || !items.length) return;

    archiveRoots.forEach((root) => wireArchive(root, items));

    const sourceLocale = archiveRoots.length
      ? localeFor(archiveRoots[0].dataset.locale)
      : localeFor(document.documentElement.lang);
    wireSourceSections(items, sourceLocale);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);

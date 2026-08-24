(function (global) {
  "use strict";

  const ARCHIVE_PAGE_SIZE = 12;

  const SOURCE_ICONS = {
    aoe: "bi-book",
    canva: "bi-file-earmark-slides",
    slideshare: "bi-collection-play",
    youtubeVideos: "bi-youtube",
    youtube: "bi-youtube"
  };

  const UI = {
    fi: {
      archiveItemSingular: "esitys",
      archiveItemPlural: "esitystä",
      resultsPrefix: "Näytetään",
      ofLabel: "/",
      empty: "Hakuehdoilla ei löytynyt esityksiä.",
      externalLabel: "Ulkoinen kohde",
      localLabel: "Paikallinen sivu",
      openLabel: "Avaa",
      paginationLabel: "Sivu"
    },
    en: {
      archiveItemSingular: "presentation",
      archiveItemPlural: "presentations",
      resultsPrefix: "Showing",
      ofLabel: "of",
      empty: "No presentations matched the current filters.",
      externalLabel: "External destination",
      localLabel: "Local page",
      openLabel: "Open",
      paginationLabel: "Page"
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

  function landingUrl(item) {
    return item && (item.landingUrl || item.localPageUrl || item.pageUrl || item.url || item.externalUrl || item.sourceUrl) || "";
  }

  function iconFor(item) {
    return SOURCE_ICONS[item && item.sourceKey] || "bi-easel2";
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
    const resetButton = root.querySelector("[data-presentation-reset]");
    const resultsEl = root.querySelector("[data-presentation-results]");
    const statusEl = root.querySelector("[data-presentation-status]");
    const paginationNav = root.querySelector("[data-presentation-pagination-nav]");
    const paginationEl = root.querySelector("[data-presentation-pagination]");
    const topicMap = exactTopicMap(items);
    const state = { search: "", year: "", topic: "", page: 1 };

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

  async function init() {
    if (!ensureDeps()) return;

    const archiveRoots = Array.from(document.querySelectorAll("[data-presentation-find-explore]"));
    if (!archiveRoots.length) return;

    const items = await global.ContentEngine.prefetch("presentationsPage");
    if (!Array.isArray(items) || !items.length) return;

    archiveRoots.forEach((root) => wireArchive(root, items));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : this);

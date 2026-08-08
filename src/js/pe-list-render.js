/**
 * Progressive Enhancement listaus-renderoija.
 *
 * Kaytto: kaikki v4.1 progressive enhancement -sivut (mediassa, blogi,
 * kirjoitukset, opinnaytteet yms.) kayttavat tata yhteista JS-kirjastoa.
 *
 * PERIAATE:
 * - SSR renderoi 15-30 uusinta itemia HTML:aan (avausnaykyma toimii
 *   ilman JS:aa)
 * - Tama JS ottaa listauksen hallintaan JS-tilassa, korvaa avausjoukon
 *   koko sisallolla, tarjoaa suodatuksen + haun + lajittelun
 *
 * Kirjasto tarjoaa:
 * - loadJsonEndpoint(url, fallback) - promise-pohjainen fetch + virheenkasittely
 * - escHtml(value) - XSS-turvallinen string-escape
 * - createDateFormatter(lang) - Intl.DateTimeFormat-instanssi
 * - buildListManager(config) - koko listauksen tila + render + suodatus
 *
 * Rakennettu v4.1 progressive enhancement -mastermpromptille (2026-08-08).
 */

(function (global) {
  'use strict';

  /**
   * Fetchaa JSON-endpointin. Palauttaa items-taulukon (fallback jos virhe).
   */
  async function loadJsonEndpoint(url, fallback = { items: [] }) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return data;
    } catch (e) {
      console.error('pe-list-render: fetch ' + url + ' failed:', e);
      return fallback;
    }
  }

  /**
   * XSS-turvallinen string-escape HTML:aan.
   */
  function escHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  /**
   * Palauttaa Intl.DateTimeFormat-instanssin annetulle kielelle.
   * Muistaa tulokset kielikohtaisesti.
   */
  const _dateFormatters = new Map();
  function createDateFormatter(lang) {
    const locale = lang === 'en' ? 'en-GB' : 'fi-FI';
    if (_dateFormatters.has(locale)) return _dateFormatters.get(locale);
    const f = new Intl.DateTimeFormat(locale, {
      day: 'numeric', month: 'long', year: 'numeric'
    });
    _dateFormatters.set(locale, f);
    return f;
  }

  /**
   * Rakennetaan listaus-manager joka ottaa hallintaan SSR-avausnakyman.
   *
   * @param {object} config
   * @param {HTMLElement} config.container - Container-elementti joka sisaltaa listaus-DOM:in
   * @param {Array} config.items - Kaikki itemit (JSON-endpointista)
   * @param {number} [config.pageSize=10] - Sivutus-koko
   * @param {function(item): string} config.renderItem - Renderoi yhden itemin HTML:ksi
   * @param {function(item, query): boolean} [config.matchesFilter] - Suodattaa itemit
   * @param {function(a, b, sortCol, sortDir): number} [config.compareItems] - Lajitteluvertailu
   * @param {HTMLElement} config.listEl - Elementti johon renderoidaan (tbody, div, ul)
   * @param {HTMLElement} [config.statusEl] - "Loydettiin N kpl" -viestin sijainti
   * @param {HTMLElement} [config.paginationEl] - Sivutus-navigaation sijainti
   * @param {function(text): string} [config.statusText] - Muotoile status-teksti
   * @param {string} [config.emptyMessage] - Viesti kun ei tuloksia
   * @returns {object} manager - { setFilter(filter), setSort(col, dir), render() }
   */
  function buildListManager(config) {
    const {
      container, items = [], pageSize = 10,
      renderItem, matchesFilter, compareItems,
      listEl, statusEl, paginationEl,
      statusText, emptyMessage = 'Ei tuloksia.'
    } = config;

    let allItems = [...items];
    let visibleItems = [...allItems];
    let currentPage = 1;
    let currentFilter = null;
    let currentSort = { col: null, dir: -1 };

    function applyFilters() {
      visibleItems = currentFilter
        ? allItems.filter(item => matchesFilter(item, currentFilter))
        : [...allItems];
      if (currentSort.col && compareItems) {
        visibleItems.sort((a, b) => compareItems(a, b, currentSort.col, currentSort.dir));
      }
      currentPage = 1;
    }

    function renderList() {
      const total = visibleItems.length;
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      if (currentPage > totalPages) currentPage = totalPages;
      const start = (currentPage - 1) * pageSize;
      const pageItems = visibleItems.slice(start, start + pageSize);

      if (listEl) {
        if (pageItems.length === 0) {
          listEl.innerHTML = `<div class="text-muted text-center py-4">${escHtml(emptyMessage)}</div>`;
        } else {
          listEl.innerHTML = pageItems.map(renderItem).join('');
        }
        listEl.removeAttribute('aria-busy');
      }

      if (statusEl && statusText) {
        statusEl.textContent = statusText(total, start + 1, Math.min(start + pageSize, total));
      }

      renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
      if (!paginationEl) return;
      paginationEl.innerHTML = '';
      if (totalPages <= 1) return;

      for (let page = 1; page <= totalPages; page += 1) {
        const li = document.createElement('li');
        li.className = 'page-item' + (page === currentPage ? ' active' : '');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'page-link';
        button.dataset.pePage = String(page);
        button.setAttribute('aria-label', `Sivu ${page}`);
        button.textContent = String(page);
        li.appendChild(button);
        paginationEl.appendChild(li);
      }
    }

    if (paginationEl) {
      paginationEl.addEventListener('click', (event) => {
        const button = event.target.closest('[data-pe-page]');
        if (!button) return;
        const nextPage = Number(button.dataset.pePage);
        if (!Number.isFinite(nextPage) || nextPage === currentPage) return;
        currentPage = nextPage;
        renderList();
      });
    }

    return {
      setFilter(filter) {
        currentFilter = filter;
        applyFilters();
        renderList();
      },
      setSort(col, dir) {
        currentSort = { col, dir: dir || -1 };
        applyFilters();
        renderList();
      },
      goToPage(page) {
        currentPage = page;
        renderList();
      },
      render() {
        applyFilters();
        renderList();
      },
      getItems() { return allItems; },
      getVisibleItems() { return visibleItems; }
    };
  }

  /**
   * Rakentaa yksinkertaisen taxonomy-badge:n renderoinnin.
   * Kayttaa /data/taxonomy-index.json:sta tai vastaavaa.
   *
   * @param {string} term - kategoria- tai avainsanan nimi
   * @param {("category"|"keyword")} kind
   * @param {object} config
   * @param {Set<string>} config.indexedCategories - Set<slug> indexed-kategorioista
   * @param {Set<string>} config.indexedKeywords - Set<slug> indexed-avainsanoista
   * @param {string} config.catBase - "/kategoriat/" tai "/en/categories/"
   * @param {string} config.kwBase - "/avainsanat/" tai "/en/keywords/"
   * @returns {string} HTML
   */
  function renderTaxonomyBadge(term, kind, config) {
    const slug = String(term || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const indexed = kind === 'category'
      ? config.indexedCategories.has(slug)
      : config.indexedKeywords.has(slug);
    const base = kind === 'category' ? config.catBase : config.kwBase;
    const cls = kind === 'category'
      ? 'badge text-bg-secondary me-1'
      : 'badge text-bg-light text-dark border me-1';
    if (indexed) {
      return `<a href="${base}${slug}/" class="${cls} text-decoration-none">${escHtml(term)}</a>`;
    }
    return `<span class="${cls}">${escHtml(term)}</span>`;
  }

  // Expose to global (window.PE)
  const PE = {
    loadJsonEndpoint,
    escHtml,
    createDateFormatter,
    buildListManager,
    renderTaxonomyBadge
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PE;
  } else {
    global.PE = PE;
  }
})(typeof window !== 'undefined' ? window : this);

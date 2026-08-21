    // Teemanvaihtajan logiikka
    document.addEventListener('DOMContentLoaded', () => {
      const themeToggles = Array.from(document.querySelectorAll('[data-theme-toggle], #themeToggleBtn'));
      const themeIcons = Array.from(document.querySelectorAll('[data-theme-icon], #themeToggleIcon'));
      const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

      const getStoredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        return storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : null;
      };

      const resolveTheme = () => {
        const storedTheme = getStoredTheme();
        if (storedTheme) return storedTheme;
        return prefersDarkScheme.matches ? 'dark' : 'light';
      };

      const applyTheme = (theme) => {
        const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-bs-theme', resolvedTheme);
        document.documentElement.style.colorScheme = resolvedTheme;
        const themeColor = document.getElementById('themeColor');
        if (themeColor) themeColor.setAttribute('content', resolvedTheme === 'dark' ? '#202833' : '#f6f3ee');
        updateIcon(resolvedTheme);
        return resolvedTheme;
      };

      const updateIcon = (theme) => {
        themeIcons.forEach((themeIcon) => {
          if (!themeIcon) return;
          if (theme === 'dark') {
            themeIcon.classList.remove('bi-moon-stars-fill');
            themeIcon.classList.add('bi-sun-fill');
          } else {
            themeIcon.classList.remove('bi-sun-fill');
            themeIcon.classList.add('bi-moon-stars-fill');
          }
        });
      };

      if (themeToggles.length) {
        applyTheme(resolveTheme());

        themeToggles.forEach((themeToggle) => {
          themeToggle.addEventListener('click', () => {
            const currentTheme = resolveTheme();
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
          });
        });

        const syncWithSystemTheme = (event) => {
          if (getStoredTheme()) return;
          applyTheme(event.matches ? 'dark' : 'light');
        };

        if (typeof prefersDarkScheme.addEventListener === 'function') {
          prefersDarkScheme.addEventListener('change', syncWithSystemTheme);
        } else if (typeof prefersDarkScheme.addListener === 'function') {
          prefersDarkScheme.addListener(syncWithSystemTheme);
        }
      }

      // Sticky header transparency logic
      const navbar = document.querySelector('.site-navbar');
      if (navbar) {
        // Keep header alignment and look consistent on all pages.
        navbar.classList.remove('navbar-hero-transparent');
        navbar.classList.add('navbar-hero-solid');
      }

      const normalizeLocalUrl = (value) => {
        if (!value) return null;
        try {
          const candidate = new URL(value, window.location.origin);
          if (candidate.origin !== window.location.origin) return null;
          return candidate;
        } catch (_) {
          return null;
        }
      };

      const sameTarget = (left, right) => (
        !!left
        && !!right
        && left.pathname === right.pathname
        && left.search === right.search
        && left.hash === right.hash
      );

      document.querySelectorAll('[data-detail-return-link]').forEach((link) => {
        const pageUrl = new URL(window.location.href);
        const fallbackUrl = normalizeLocalUrl(link.getAttribute('data-detail-return-fallback') || link.getAttribute('href') || '/');
        const allowedPrefixes = String(link.getAttribute('data-detail-return-prefixes') || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
        const returnUrl = normalizeLocalUrl(pageUrl.searchParams.get('returnTo'));
        const prefixMatch = returnUrl && allowedPrefixes.some((prefix) => returnUrl.pathname.startsWith(prefix));
        const sameDetailTarget = returnUrl
          && returnUrl.pathname === pageUrl.pathname
          && returnUrl.hash === pageUrl.hash;
        const useReturnLink = Boolean(
          returnUrl
          && prefixMatch
          && !sameTarget(returnUrl, fallbackUrl)
          && !sameDetailTarget
        );

        if (!useReturnLink) {
          link.classList.add('d-none');
          if (fallbackUrl) link.setAttribute('href', `${fallbackUrl.pathname}${fallbackUrl.search}${fallbackUrl.hash}`);
          return;
        }

        link.classList.remove('d-none');
        link.setAttribute('href', `${returnUrl.pathname}${returnUrl.search}${returnUrl.hash}`);
      });

      // Shared reveal motion for main content. CSS remains harmless without JS:
      // elements are only hidden after this class is added.
      const revealNodes = Array.from(document.querySelectorAll([
        'main > section',
        'main .card',
        'main .home-recent-card',
        'main .pol-current-card',
        'main .pol-theme-card',
        'main .about-role-card',
        'main .about-archive-link'
      ].join(','))).filter((el, index, arr) => arr.indexOf(el) === index);
      const reducedMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const revealImmediately = () => {
        revealNodes.forEach((el) => {
          el.classList.remove('motion-reveal');
          el.classList.add('is-visible');
        });
      };

      if (revealNodes.length) {
        revealNodes.forEach((el, idx) => {
          el.classList.add('motion-reveal');
          el.style.setProperty('--motion-delay', `${Math.min((idx % 6) * 45, 225)}ms`);
        });

        if (reducedMotionMq.matches || document.documentElement.classList.contains('a11y-reduced-motion') || !('IntersectionObserver' in window)) {
          revealImmediately();
        } else {
          const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            });
          }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
          revealNodes.forEach((el) => revealObserver.observe(el));
        }
      }

      // Latest content ticker — data ladataan erillisestä JSON-tiedostosta (ei inline)
      const tickerTracks = Array.from(document.querySelectorAll('.site-news-ticker-track[data-latest-track]'));
      if (tickerTracks.length) {
        const currentLangCode = (document.documentElement.lang || 'fi').slice(0, 2).toLowerCase();
        const escHtml = (value) => String(value || '')
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');

        const fmtDate = (isoDate) => {
          if (!isoDate) return '';
          const date = new Date(isoDate);
          if (Number.isNaN(date.getTime())) return '';
          return new Intl.DateTimeFormat(currentLangCode === 'en' ? 'en-GB' : 'fi-FI', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(date);
        };

        const mapKind = (kind) => {
          if (currentLangCode === 'en') return kind || 'Content';
          if (kind === 'Blog') return 'Blogi';
          if (kind === 'Publication') return 'Julkaisu';
          if (kind === 'Presentation') return 'Esitys';
          if (kind === 'Politics') return 'Politiikka';
          return 'Sisältö';
        };

        const renderTicker = (parsed) => {
          const seen = new Set();
          const latest = parsed
            .filter((item) => item && item.url && item.title)
            .filter((item) => {
              const itemLang = item.lang || (item.url.startsWith('/en/') ? 'en' : 'fi');
              return itemLang.slice(0, 2) === currentLangCode;
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .filter((item) => {
              if (seen.has(item.url)) return false;
              seen.add(item.url);
              return true;
            })
            .slice(0, 36);

          tickerTracks.forEach((tickerTrack) => {
            if (!latest.length) {
              tickerTrack.innerHTML = `<span class="site-news-ticker-item">${currentLangCode === 'en' ? 'No latest content found.' : 'Uusimpia sisältöjä ei löytynyt.'}</span>`;
              return;
            }
            const row = latest.map((item) => {
              const dateLabel = fmtDate(item.date);
              const kindLabel = mapKind(item.kind);
              return `
                <a class="site-news-ticker-item" href="${escHtml(item.url)}">
                  <span class="site-news-ticker-kind">${escHtml(kindLabel)}</span>
                  <span class="site-news-ticker-title">${escHtml(item.title)}</span>
                  ${dateLabel ? `<time datetime="${escHtml(item.date)}" class="site-news-ticker-date">${escHtml(dateLabel)}</time>` : ''}
                </a>
              `;
            }).join('');
            tickerTrack.innerHTML = `${row}${row}`;
            tickerTrack.classList.add('is-running');
          });
        };

        fetch('/js/ticker-data.json')
          .then((r) => r.json())
          .then(renderTicker)
          .catch(() => {});
      }

      // Shared mobile disclosure state for pages that collapse dense sections on phones.
      // Desktop keeps sections open; mobile closes them once without fighting user choices.
      const mobileDisclosureMq = window.matchMedia('(max-width: 767.98px)');
      const mobileDisclosureGroups = [
        { selector: '[data-home-mobile-collapse]' },
        { selector: '[data-larux-mobile-collapse]' },
        { selector: '[data-mobile-collapse]' },
        { selector: '[data-kynasta-mobile-collapse]', alwaysSync: true, hashAware: true, desktopOpen: false, closePeersOnHash: true },
        { selector: '[data-presentation-mobile-collapse]', preparedAttr: 'presentationMobilePrepared', hashAware: true },
        { selector: '[data-portfolio-mobile-collapse]', alwaysSync: true, hashAware: true },
        { selector: '[data-term-mobile-collapse]', alwaysSync: true, keepOpenAttr: 'termCurrent' },
        { selector: '[data-council-mobile-collapse]', alwaysSync: true, keepOpenAttr: 'councilCurrent', hashAware: true },
        { selector: '[data-about-mobile-collapse]', preparedAttr: 'aboutMobilePrepared', hashAware: true },
        { selector: '[data-research-mobile-collapse]', preparedAttr: 'researchMobilePrepared', hashAware: true }
      ];
      const hashAwareOpeners = [];
      const mobileDisclosureAppliers = [];

      const addMobileDisclosureGroup = ({
        selector,
        preparedAttr = 'mobilePrepared',
        hashAware = false,
        alwaysSync = false,
        keepOpenAttr = null,
        desktopOpen = true,
        closePeersOnHash = false
      }) => {
        const disclosures = Array.from(document.querySelectorAll(selector));
        if (!disclosures.length) return;
        disclosures.forEach((disclosure) => {
          if (disclosure.dataset.defaultOpen === undefined) {
            disclosure.dataset.defaultOpen = disclosure.open ? 'true' : 'false';
          }
        });

        const openDisclosureForHash = () => {
          if (!hashAware) return;
          const hash = window.location.hash;
          if (!hash) return;

          let target = null;
          try {
            target = document.querySelector(hash);
          } catch {
            return;
          }

          if (!target) return;
          const disclosure = target.closest(selector) || target.querySelector(selector);
          if (disclosure) {
            if (closePeersOnHash) {
              disclosures.forEach((peer) => {
                if (peer !== disclosure) peer.open = false;
              });
            }
            disclosure.open = true;
          }
        };

        const applyDisclosureState = () => {
          disclosures.forEach((disclosure) => {
            if (!mobileDisclosureMq.matches) {
              disclosure.open = desktopOpen ? true : disclosure.dataset.defaultOpen === 'true';
              disclosure.dataset[preparedAttr] = 'false';
              return;
            }

            if (alwaysSync) {
              disclosure.open = keepOpenAttr ? disclosure.dataset[keepOpenAttr] === 'true' : false;
              return;
            }

            if (disclosure.dataset[preparedAttr] === 'true') return;
            disclosure.open = false;
            disclosure.dataset[preparedAttr] = 'true';
          });
          openDisclosureForHash();
        };

        applyDisclosureState();
        mobileDisclosureAppliers.push(applyDisclosureState);

        if (hashAware) {
          hashAwareOpeners.push(openDisclosureForHash);
        }
      };

      mobileDisclosureGroups.forEach(addMobileDisclosureGroup);

      const syncMobileDisclosureGroups = () => {
        mobileDisclosureAppliers.forEach((applyDisclosureState) => applyDisclosureState());
      };

      if (typeof mobileDisclosureMq.addEventListener === 'function') {
        mobileDisclosureMq.addEventListener('change', syncMobileDisclosureGroups);
      } else if (typeof mobileDisclosureMq.addListener === 'function') {
        mobileDisclosureMq.addListener(syncMobileDisclosureGroups);
      }

      if (hashAwareOpeners.length) {
        const openHashAwareMobileDisclosures = () => {
          hashAwareOpeners.forEach((openDisclosureForHash) => openDisclosureForHash());
        };

        window.addEventListener('hashchange', openHashAwareMobileDisclosures);
        document.querySelectorAll('a[href^="#"]').forEach((link) => {
          link.addEventListener('click', () => {
            window.setTimeout(openHashAwareMobileDisclosures, 0);
          });
        });
      }

      // Mega menu interactions (desktop keyboard support + Esc focus return)
      // NOTE: Bootstrap Dropdown API cannot find .mega-menu-panel because the toggle is
      // inside .mega-nav-trigger while the panel is a sibling. We manage visibility directly.
      const megaDropdowns = Array.from(document.querySelectorAll('.mega-dropdown'));
      let activeMegaToggle = null;
      const desktopMq = window.matchMedia('(min-width: 768px)');
      const megaFocusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

      const getMegaToggle = (dropdown) => dropdown.querySelector('.mega-nav-toggle[data-bs-toggle="dropdown"]');
      const getMegaParentLink = (dropdown) => dropdown.querySelector('.mega-nav-link[href]');
      const getMegaItems = (menu) =>
        Array.from(menu.querySelectorAll(megaFocusableSelector)).filter((el) =>
          !el.disabled && !el.closest('[hidden]') && el.offsetParent !== null
        );

      const closeMegaMenuDirect = (toggle, menu) => {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('show', 'menu-open');
      };

      const closeAllMegaMenus = ({ focusToggle = false, except = null } = {}) => {
        megaDropdowns.forEach((dropdown) => {
          if (dropdown === except) return;
          const toggle = getMegaToggle(dropdown);
          const menu = dropdown.querySelector('.mega-menu-panel');
          if (toggle && menu) closeMegaMenuDirect(toggle, menu);
        });
        if (navbar && !except) navbar.classList.remove('mega-open');
        if (focusToggle && activeMegaToggle) {
          requestAnimationFrame(() => activeMegaToggle?.focus());
        }
      };

      const isAnyMenuOpen = (exceptDropdown = null) =>
        megaDropdowns.some(
          (d) => d !== exceptDropdown && d.querySelector('.mega-menu-panel')?.classList.contains('show')
        );

      megaDropdowns.forEach((dropdown) => {
        const toggle = getMegaToggle(dropdown);
        const parentLink = getMegaParentLink(dropdown);
        const menu = dropdown.querySelector('.mega-menu-panel');
        if (!toggle || !menu) return;
        const href = parentLink?.getAttribute('href');
        const navLabel = (parentLink?.textContent || toggle.getAttribute('aria-label') || '').trim();
        const jumpPrefix = (document.documentElement.lang || '').toLowerCase().startsWith('en')
          ? 'Go to page:'
          : 'Siirry sivulle:';

        // Mobile-only "go to top-level page" link inside each mega menu.
        if (href && href !== '#') {
          const wrap = menu.querySelector('.mega-wrap');
          if (wrap && !wrap.querySelector('.mega-mobile-jump')) {
            const mobileJump = document.createElement('a');
            mobileJump.className = 'mega-mobile-jump';
            mobileJump.href = href;
            mobileJump.setAttribute('aria-label', `${jumpPrefix} ${navLabel}`);
            mobileJump.innerHTML = `<i class="bi bi-arrow-up-right-circle me-2"></i>${jumpPrefix} ${navLabel}`;
            wrap.insertBefore(mobileJump, wrap.firstChild);
          }
        }

        const interactiveItems = getMegaItems(menu);
        interactiveItems.forEach((el, idx) => {
          el.classList.add('stagger-item');
          el.style.animationDelay = `${Math.min(idx * 35, 300)}ms`;
        });

        const openMegaMenuDirect = (focusTarget = 'first') => {
          closeAllMegaMenus({ except: dropdown });
          activeMegaToggle = toggle;
          toggle.setAttribute('aria-expanded', 'true');
          menu.classList.add('show');
          if (navbar) navbar.classList.add('mega-open');
          menu.classList.remove('menu-open');
          requestAnimationFrame(() => {
            menu.classList.add('menu-open');
            const items = getMegaItems(menu);
            if (items.length) {
              if (focusTarget === 'last') items[items.length - 1].focus();
              else items[0].focus();
            }
          });
        };

        toggle.addEventListener('click', () => {
          if (!desktopMq.matches) return;
          if (menu.classList.contains('show')) {
            closeMegaMenuDirect(toggle, menu);
            if (!isAnyMenuOpen()) navbar?.classList.remove('mega-open');
          } else {
            closeAllMegaMenus({ except: dropdown });
          }
        });

        toggle.addEventListener('keydown', (e) => {
          if (!desktopMq.matches) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            openMegaMenuDirect('first');
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            openMegaMenuDirect('last');
          } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
            if (menu.classList.contains('show')) {
              closeMegaMenuDirect(toggle, menu);
              if (!isAnyMenuOpen()) navbar?.classList.remove('mega-open');
            } else {
              openMegaMenuDirect('first');
            }
          } else if (e.key === 'Escape' && menu.classList.contains('show')) {
            e.preventDefault();
            closeAllMegaMenus({ focusToggle: true });
          }
        });

        // Bootstrap events fire when Bootstrap's click handler activates — keep animation in sync.
        dropdown.addEventListener('show.bs.dropdown', () => {
          activeMegaToggle = toggle;
          if (navbar) navbar.classList.add('mega-open');
          menu.classList.remove('menu-open');
          requestAnimationFrame(() => menu.classList.add('menu-open'));
        });

        dropdown.addEventListener('hide.bs.dropdown', () => {
          if (!isAnyMenuOpen(dropdown)) navbar?.classList.remove('mega-open');
          menu.classList.remove('menu-open', 'show');
        });

        dropdown.addEventListener('focusout', (e) => {
          if (!desktopMq.matches || !menu.classList.contains('show')) return;
          const nextTarget = e.relatedTarget;
          if (nextTarget instanceof Node && dropdown.contains(nextTarget)) return;
          requestAnimationFrame(() => {
            if (!dropdown.contains(document.activeElement)) {
              closeMegaMenuDirect(toggle, menu);
              if (!isAnyMenuOpen()) navbar?.classList.remove('mega-open');
            }
          });
        });

        menu.addEventListener('keydown', (e) => {
          if (!desktopMq.matches) return;
          const items = getMegaItems(menu);
          if (!items.length) return;
          const currentIndex = items.indexOf(document.activeElement);

          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1 + items.length) % items.length;
            items[nextIndex].focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex === -1 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
            items[prevIndex].focus();
          } else if (e.key === 'Home') {
            e.preventDefault();
            items[0].focus();
          } else if (e.key === 'End') {
            e.preventDefault();
            items[items.length - 1].focus();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            closeMegaMenuDirect(toggle, menu);
            if (!isAnyMenuOpen()) navbar?.classList.remove('mega-open');
            toggle.focus();
          }
        });

        menu.addEventListener('click', (e) => {
          if (!(e.target instanceof Element)) return;
          const clickedLink = e.target.closest('a[href]');
          if (!clickedLink) return;
          closeAllMegaMenus();
        });
      });

      // Hakutoiminnon logiikka
      // N1: search overlay uses the native <dialog> element. showModal()
      // owns modality + top layer + outside-page inertness + native Escape.
      // JS owns only what Chromium does not provide reliably: cyclic Tab
      // boundary wrap (Shift+Tab from first → last, Tab from last → first).
      // Interior Tab traversal is handled by native browser tab-order.
      const searchToggles = Array.from(document.querySelectorAll('[data-search-toggle], #searchToggleBtn'));
      const searchForms = Array.from(document.querySelectorAll('[data-search-form]'));
      const searchClose = document.getElementById('searchCloseBtn');
      const searchOverlay = document.getElementById('searchOverlay');
      let lastSearchTrigger = null;
      let pagefindUi = null;
      let pagefindUiReady = null;
      const focusableSelector = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

      const isVisibleElement = (el) => el instanceof HTMLElement && el.isConnected && el.offsetParent !== null;
      const getFocusableElements = (container) =>
        Array.from(container.querySelectorAll(focusableSelector)).filter((el) => !el.closest('[hidden]') && isVisibleElement(el));
      const getSearchReturnTarget = () => {
        if (isVisibleElement(lastSearchTrigger)) return lastSearchTrigger;
        return searchToggles.find((toggle) => isVisibleElement(toggle)) || null;
      };

      function closeContainingOffcanvas(node) {
        if (!node || !window.bootstrap) return;
        const offcanvasEl = node.closest('.offcanvas');
        if (!offcanvasEl) return;
        const instance = window.bootstrap.Offcanvas.getInstance(offcanvasEl) || new window.bootstrap.Offcanvas(offcanvasEl);
        instance.hide();
      }

      const getPagefindInput = () =>
        searchOverlay?.querySelector('.pagefind-ui__search-input, .pf-input') || null;

      const focusPagefindInput = (prefillQuery = '', { triggerQuery = true } = {}) => {
        const input = getPagefindInput();
        if (!input) return false;
        input.focus({ preventScroll: true });
        if (prefillQuery && triggerQuery && pagefindUi?.triggerSearch) {
          pagefindUi.triggerSearch(prefillQuery);
        } else if (prefillQuery && triggerQuery) {
          input.value = prefillQuery;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        return document.activeElement === input;
      };

      const waitForPagefindInput = (prefillQuery = '', attempt = 0) => {
        if (focusPagefindInput(prefillQuery, { triggerQuery: attempt === 0 })) return;
        if (attempt < 20) {
          window.setTimeout(() => waitForPagefindInput(prefillQuery, attempt + 1), 50);
        }
      };

      function initPagefindUi() {
        if (pagefindUiReady) return pagefindUiReady;

        pagefindUiReady = new Promise((resolve) => {
          const mount = searchOverlay?.querySelector('[data-pagefind-ui]');
          if (!mount) {
            resolve(null);
            return;
          }

          const waitForUi = (attempt = 0) => {
            if (!window.PagefindUI) {
              if (attempt < 40) {
                window.setTimeout(() => waitForUi(attempt + 1), 50);
              } else {
                console.warn('Pagefind UI ei latautunut hakudialogiin.');
                resolve(null);
              }
              return;
            }

            const isEn = (document.documentElement.lang || '').toLowerCase().startsWith('en');
            const languageFilter = mount.dataset.pagefindLang || (isEn ? 'English' : 'Suomi');
            const placeholder = mount.dataset.pagefindPlaceholder || (isEn ? 'Write a search term...' : 'Kirjoita hakusana...');

            // PF-UI-L10N1 — full PagefindUI translation bundle. Before
            // this fix the nav-bar overlay used a partial bundle,
            // which meant PagefindUI's left-side filters panel fell
            // back to English defaults ("Filters", alt-search
            // messages, suggestion header) on Finnish pages. Matches
            // the /haku/ init in src/js/site-search-page.js verbatim
            // for the strings PagefindUI ships.
            pagefindUi = new window.PagefindUI({
              element: mount,
              bundlePath: '/pagefind/',
              pageSize: 6,
              resetStyles: false,
              showImages: false,
              showSubResults: true,
              excerptLength: 24,
              autofocus: true,
              translations: isEn
                ? {
                    placeholder,
                    clear_search: 'Clear search',
                    load_more: 'Show more results',
                    search_label: 'Search this site',
                    filters_label: 'Filters',
                    zero_results: 'No results for [SEARCH_TERM]',
                    many_results: '[COUNT] results for [SEARCH_TERM]',
                    one_result: '[COUNT] result for [SEARCH_TERM]',
                    alt_search: 'No results for [SEARCH_TERM]. Showing results for [DIFFERENT_TERM] instead.',
                    search_suggestion: 'No results for [SEARCH_TERM]. Try one of the following searches:',
                    searching: 'Searching [SEARCH_TERM]...'
                  }
                : {
                    placeholder,
                    clear_search: 'Tyhjennä haku',
                    load_more: 'Näytä lisää tuloksia',
                    search_label: 'Hae sivustolta',
                    filters_label: 'Suodattimet',
                    zero_results: 'Ei tuloksia haulle [SEARCH_TERM]',
                    many_results: '[COUNT] tulosta haulle [SEARCH_TERM]',
                    one_result: '[COUNT] tulos haulle [SEARCH_TERM]',
                    alt_search: 'Ei tuloksia haulle [SEARCH_TERM]. Näytetään tulokset haulla [DIFFERENT_TERM].',
                    search_suggestion: 'Ei tuloksia haulle [SEARCH_TERM]. Kokeile jotain seuraavista:',
                    searching: 'Haetaan [SEARCH_TERM]...'
                  }
            });
            pagefindUi.triggerFilters({ Kieli: languageFilter });
            resolve(pagefindUi);
          };

          waitForUi();
        });

        return pagefindUiReady;
      }

      function openSearch(prefillQuery = '', triggerSource = null) {
        if (!searchOverlay) return;
        lastSearchTrigger = triggerSource instanceof HTMLElement
          ? triggerSource
          : (document.activeElement instanceof HTMLElement ? document.activeElement : null);
        if (!searchOverlay.open) {
          searchOverlay.showModal();
        }
        initPagefindUi().then(() => waitForPagefindInput(prefillQuery));
      }

      function closeSearch() {
        if (!searchOverlay) return;
        if (searchOverlay.open) {
          searchOverlay.close();
        }
        // Focus return is centralized in the native `close` event listener
        // below — the browser fires it for every close path (JS close(),
        // Escape/cancel, form-method=dialog). Do not duplicate focus
        // handling here.
      }

      // N1 Experiment I: cyclic-boundary wrap only. Chromium's native modal
      // <dialog> keeps focus inside the top layer for interior traversal,
      // but does not wrap Tab from the last focusable to the first (or
      // Shift+Tab from the first to the last) — instead focus lands on
      // <body>. Intercept exactly those two boundary transitions and leave
      // all interior Tab movement to native browser handling.
      function trapSearchFocus(e) {
        if (!searchOverlay || !searchOverlay.open || e.key !== 'Tab') return;
        const focusable = getFocusableElements(searchOverlay);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      searchToggles.forEach((searchToggle) => {
        searchToggle.addEventListener('click', (e) => {
          closeContainingOffcanvas(e.currentTarget);
          openSearch('', e.currentTarget);
        });
      });
      const runSearchForm = (form, sourceEvent = null) => {
        if (!(form instanceof HTMLFormElement)) return;
        const formData = new FormData(form);
        const query = String(formData.get('q') || '').trim();
        const action = form.getAttribute('action');

        if (action) {
          if (sourceEvent) sourceEvent.preventDefault();
          const url = new URL(action, window.location.origin);
          if (query) url.searchParams.set('q', query);
          window.location.href = url.toString();
          return;
        }

        if (sourceEvent) sourceEvent.preventDefault();
        const fallbackTrigger = searchToggles.find((toggle) => isVisibleElement(toggle)) || null;
        closeContainingOffcanvas(form);
        openSearch(query, fallbackTrigger);
      };

      searchForms.forEach((form) => {
        form.addEventListener('submit', (e) => {
          runSearchForm(form, e);
        });

        form.querySelectorAll('input[type="search"], input[name="q"]').forEach((input) => {
          input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') runSearchForm(form, e);
          });
        });

        form.querySelectorAll('button[type="submit"]').forEach((button) => {
          button.addEventListener('click', (e) => {
            runSearchForm(form, e);
          });
        });
      });
      if (searchClose) searchClose.addEventListener('click', () => closeSearch());

      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        // Native <dialog> handles its own Escape via the cancel event —
        // no manual closeSearch() branch here. We only own mega-menu Escape.
        const openDropdown = megaDropdowns.find((dropdown) => dropdown.classList.contains('show'));
        if (openDropdown) {
          closeAllMegaMenus();
          if (activeMegaToggle) activeMegaToggle.focus();
        }
      });

      if (searchOverlay) {
        // Native `close` fires for every close path (JS close(), Escape,
        // form-method=dialog). Centralize the exact-trigger focus return
        // here; no cancel listener, no zero-delay deferral. Native dialog
        // has already finished its own focus movement by the time close
        // is dispatched, so a plain synchronous focus() call sticks.
        searchOverlay.addEventListener('close', () => {
          const returnTarget = getSearchReturnTarget();
          if (returnTarget) returnTarget.focus();
        });
        // Boundary-only Tab wrap (see trapSearchFocus).
        searchOverlay.addEventListener('keydown', trapSearchFocus);
        // Backdrop click: with native <dialog>, click events on the ::backdrop
        // arrive with target === the dialog element itself.
        searchOverlay.addEventListener('click', (e) => {
          if (e.target === searchOverlay) closeSearch();
        });
      }
    });

// Jaettu paginaatiofunktio. Tukee myös desktopissa taulukon yläpuolista peilipageria,
// jotta sivukohtaisia pagerifunktioita ei tarvitse ylläpitää erikseen.
window.renderPaginationShared = function renderPaginationShared(ul, total, currentPage, onPageChange) {
  if (!ul) return;
  const isMobile = window.matchMedia('(max-width: 767.98px)').matches;
  const WINDOW_SIZE = 10;
  const footer = ul.closest('.card-footer');
  const footerNavLabel = footer?.querySelector('nav')?.getAttribute('aria-label') || 'Sivutus';
  const cardBody = footer?.previousElementSibling;
  const footerInfo = footer?.querySelector('small');
  const paginationId = ul.id || `pagination-${Math.random().toString(36).slice(2)}`;
  if (!ul.id) ul.id = paginationId;

  const getOrCreateDesktopMirror = () => {
    if (isMobile || !cardBody || !footer) {
      cardBody?.querySelector(`[data-pagination-top-for="${paginationId}"]`)?.remove();
      return null;
    }

    let dock = cardBody.querySelector(`[data-pagination-top-for="${paginationId}"]`);
    if (!dock) {
      const tableWrap = cardBody.querySelector('.table-responsive');
      if (!tableWrap) return null;

      dock = document.createElement('div');
      dock.className = 'site-pagination-bar site-pagination-bar--top kynasta-table-pager kynasta-table-pager--top d-none d-lg-flex';
      dock.setAttribute('data-pagination-top-for', paginationId);
      dock.innerHTML = `
        <small class="site-pagination-info text-muted" data-pagination-top-info></small>
        <nav aria-label="${footerNavLabel} taulukon yläreunassa">
          <ul class="pagination pagination-sm mb-0 flex-wrap site-pag"></ul>
        </nav>
      `;
      tableWrap.before(dock);
    }

    const topInfo = dock.querySelector('[data-pagination-top-info]');
    if (topInfo) topInfo.textContent = footerInfo?.textContent || '';
    return dock.querySelector('ul');
  };

  const mirrorUl = getOrCreateDesktopMirror();
  const targets = [ul, mirrorUl].filter(Boolean);
  targets.forEach((target) => {
    target.innerHTML = '';
  });

  if (total <= 1) {
    cardBody?.querySelector(`[data-pagination-top-for="${paginationId}"]`)?.remove();
    return;
  }

  const appendPageLink = (targetUl, label, page, { active = false, disabled = false, ariaLabel = '' } = {}) => {
    const li = document.createElement('li');
    li.className = `page-item${active ? ' active' : ''}${disabled ? ' disabled' : ''}`;
    const a = document.createElement('a');
    a.className = 'page-link';
    a.href = '#';
    a.textContent = label;
    if (ariaLabel) a.setAttribute('aria-label', ariaLabel);
    if (!disabled) {
      a.addEventListener('click', e => {
        e.preventDefault();
        onPageChange(page);
      });
    } else {
      a.setAttribute('aria-disabled', 'true');
      a.setAttribute('tabindex', '-1');
    }
    li.appendChild(a);
    targetUl.appendChild(li);
  };

  const appendEllipsis = (targetUl) => {
    const li = document.createElement('li');
    li.className = 'page-item disabled';
    li.innerHTML = '<span class="page-link">…</span>';
    targetUl.appendChild(li);
  };

  if (isMobile) {
    // Mobiili: kompakti ‹ 1 … nykyinen … N ›
    appendPageLink(ul, '‹', Math.max(1, currentPage - 1), {
      disabled: currentPage === 1,
      ariaLabel: 'Edellinen sivu'
    });
    const pages = new Set([1, total, currentPage - 1, currentPage, currentPage + 1]);
    const orderedPages = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);
    let previousPage = null;
    orderedPages.forEach(page => {
      if (previousPage !== null && page - previousPage > 1) appendEllipsis(ul);
      appendPageLink(ul, String(page), page, { active: page === currentPage });
      previousPage = page;
    });
    appendPageLink(ul, '›', Math.min(total, currentPage + 1), {
      disabled: currentPage === total,
      ariaLabel: 'Seuraava sivu'
    });
    return;
  }

  // Desktop: kaikki sivut jos ≤ WINDOW_SIZE, muuten liukuva ikkuna
  targets.forEach((targetUl) => {
    if (total <= WINDOW_SIZE) {
      for (let i = 1; i <= total; i++) {
        appendPageLink(targetUl, String(i), i, { active: i === currentPage });
      }
      return;
    }

    // Liukuva ikkuna: aina ensimmäinen + viimeinen, 8 keskisivua nykyisen ympärillä
    const midSlots = WINDOW_SIZE - 2;
    let winStart = Math.max(2, currentPage - Math.floor(midSlots / 2));
    let winEnd = winStart + midSlots - 1;
    if (winEnd > total - 1) {
      winEnd = total - 1;
      winStart = Math.max(2, winEnd - midSlots + 1);
    }

    appendPageLink(targetUl, '1', 1, { active: currentPage === 1 });
    if (winStart > 2) appendEllipsis(targetUl);
    for (let i = winStart; i <= winEnd; i++) {
      appendPageLink(targetUl, String(i), i, { active: i === currentPage });
    }
    if (winEnd < total - 1) appendEllipsis(targetUl);
    appendPageLink(targetUl, String(total), total, { active: currentPage === total });
  });
};

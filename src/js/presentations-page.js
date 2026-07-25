(() => {
  const PAGE_SIZE = 6;
  const UNIFIED_PAGE_SIZE = 12;
  function parseJsonScript(id, fallback) {
    const node = document.getElementById(id);
    if (!node) return fallback;
    try {
      return JSON.parse(node.textContent || "");
    } catch (error) {
      console.warn(`Failed to parse ${id}`, error);
      return fallback;
    }
  }

  const rawData = parseJsonScript("presentation-raw-data", {});
  const presentationContexts = parseJsonScript("presentation-contexts-data", []);
  const canvaPageUrls = parseJsonScript("presentation-canva-page-urls-data", []);
  const analysisArchiveItems = [
    {
      title: "Canva-esitykset 2021-2026",
      url: "/esitykset/canva-analyysi/",
      description: "Teemat, kehityskaaret ja laajimmat esitykset.",
      meta: "Aineistoanalyysi",
      date: "2026",
      _isoDate: "2026-12-31",
      archiveType: "analysis",
      archiveTypeLabel: "Aineistoanalyysi",
      sourceLabel: "Sivuston analyysi"
    },
    {
      title: "SlideShare-esitykset 2009-2020",
      url: "/esitykset/slideshare-analyysi/",
      description: "Katsotuimmat, teemat ja kehityskaaret vuosikymmenittäin.",
      meta: "Aineistoanalyysi",
      date: "2020",
      _isoDate: "2020-12-31",
      archiveType: "analysis",
      archiveTypeLabel: "Aineistoanalyysi",
      sourceLabel: "Sivuston analyysi"
    }
  ];

  // Liitetään Canva MD-sivujen sisäiset URLit canva.tableRows-dataan ulkoisen URLin perusteella
  const canvaPageUrlMap = {};
  canvaPageUrls.forEach((item) => {
    canvaPageUrlMap[item.externalUrl] = item.pageUrl;
  });
  if (!Array.isArray(rawData.canva)) rawData.canva = [];
  rawData.canva.forEach((item) => {
    item.pageUrl = canvaPageUrlMap[item.url] || null;
  });

  const iconByKey = {
    aoe: "bi-book",
    canva: "bi-file-earmark-slides",
    curatedVideos: "bi-camera-video",
    videoSeries: "bi-collection-play",
    youtubeVideos: "bi-youtube",
    youtube: "bi-youtube",
    slideshare: "bi-collection-play"
  };

  const linkLabelByKey = {
    aoe: "Avaa Finnassa",
    canva: "Avaa",
    curatedVideos: "Katso",
    videoSeries: "Avaa sarja",
    youtubeVideos: "Katso",
    youtube: "YouTube",
    slideshare: "SlideShare",
    analysis: "Lue analyysi"
  };

  const archiveMetaByKey = {
    canva: {
      archiveType: "own",
      archiveTypeLabel: "Koulutus / esitys",
      sourceLabel: "Canva"
    },
    slideshare: {
      archiveType: "own",
      archiveTypeLabel: "Koulutus / esitys",
      sourceLabel: "SlideShare"
    },
    aoe: {
      archiveType: "aoe",
      archiveTypeLabel: "Avoin oppimateriaali",
      sourceLabel: "AOE / Finna"
    },
    curatedVideos: {
      archiveType: "video",
      archiveTypeLabel: "Video / tallenne",
      sourceLabel: "YouTube / oma puheenvuoro"
    },
    videoSeries: {
      archiveType: "video",
      archiveTypeLabel: "Videosarja",
      sourceLabel: "YouTube / oma sarja"
    },
    youtubeVideos: {
      archiveType: "video",
      archiveTypeLabel: "Video / tallenne",
      sourceLabel: "YouTube"
    },
    youtube: {
      archiveType: "video",
      archiveTypeLabel: "Soittolista",
      sourceLabel: "YouTube"
    }
  };

  function escHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function truncate(value, max = 120) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text.length > max ? `${text.slice(0, max).trim()}…` : text;
  }

  function isExternalUrl(url) {
    return /^https?:\/\//i.test(String(url || ""));
  }

  function linkAttrs(url) {
    return isExternalUrl(url) ? ' target="_blank" rel="noopener noreferrer"' : "";
  }

  function normalizeContextUrl(value) {
    return String(value || "").trim().replace(/\/$/, "");
  }

  function uniquePush(list, value) {
    const normalized = String(value || "").trim();
    if (!normalized || list.includes(normalized)) return;
    list.push(normalized);
  }

  function createMatcherText(parts) {
    return parts
      .flatMap((part) => {
        if (Array.isArray(part)) return part;
        return [part];
      })
      .map((value) => String(value || "").toLowerCase())
      .join(" ");
  }

  function findContextsForItem(item) {
    const itemUrls = [
      item.url,
      item.externalUrl,
      item.pageUrl
    ].map(normalizeContextUrl).filter(Boolean);
    const itemTitle = String(item.title || "").trim();

    return presentationContexts.filter((context) => {
      const materialUrls = Array.isArray(context.materialUrls)
        ? context.materialUrls.map(normalizeContextUrl).filter(Boolean)
        : [];
      const materialTitles = Array.isArray(context.materialTitles)
        ? context.materialTitles.map((title) => String(title || "").trim())
        : [];
      return itemUrls.some((url) => materialUrls.includes(url)) || (itemTitle && materialTitles.includes(itemTitle));
    });
  }

  function classifyPresentationItem(item, contexts = []) {
    const categoryTags = [];
    const profileTags = [];
    const routeTags = [];
    const explicitCategory = String(item.kategoria || "").trim();
    const explicitProfiles = Array.isArray(item.asiantuntijaprofiili) ? item.asiantuntijaprofiili : [];
    const contextTypes = contexts.map((context) => String(context.type || "").trim()).filter(Boolean);
    const text = createMatcherText([
      item.title,
      item.description,
      item.meta,
      item.sourceLabel,
      item.archiveTypeLabel,
      item.jarjestaja,
      item.organizer,
      item.sourceKey,
      item.keywords,
      item.categories,
      contexts.map((context) => [
        context.title,
        context.type,
        context.typeLabel,
        context.format,
        context.role,
        context.organizer,
        context.audience,
        context.summary,
        context.topics
      ])
    ]);
    const has = (pattern) => pattern.test(text);

    if (explicitCategory) uniquePush(categoryTags, explicitCategory);
    explicitProfiles.forEach((profile) => uniquePush(profileTags, profile));

    if (contextTypes.includes("keynote")) {
      uniquePush(categoryTags, "konferenssi-keynote");
      uniquePush(profileTags, "asiantuntija");
    }

    if (contextTypes.includes("continuing-education")) {
      uniquePush(categoryTags, "täydennyskoulutus");
      uniquePush(profileTags, "kouluttaja");
    }

    if (contextTypes.includes("academic-lecture")) {
      uniquePush(categoryTags, "tdk-luento");
      uniquePush(profileTags, "tutkija");
      uniquePush(profileTags, "kouluttaja");
    }

    if (contextTypes.includes("expert-video")) {
      uniquePush(profileTags, "asiantuntija");
    }

    if (contextTypes.includes("video-series")) {
      uniquePush(profileTags, "kouluttaja");
      uniquePush(routeTags, "route:materiaalit");
    }

    if (!categoryTags.length || has(/\bkeynote\b|avauspuheenvuoro|avauspuhe|plenary|opening keynote/)) {
      if (has(/\bkeynote\b|avauspuheenvuoro|avauspuhe|plenary|opening keynote/)) {
        uniquePush(categoryTags, "konferenssi-keynote");
      }
    }

    if (!categoryTags.length || has(/\b(cscl|isls|earli|iste|hicss|site|edmedia|ed-media|ectel|icls|edulearn|steam|arctic frontiers|fablearn|conference|symposium|kongressi|konferenssi)\b/)) {
      if (has(/\b(cscl|isls|earli|iste|hicss|site|edmedia|ed-media|ectel|icls|edulearn|steam|arctic frontiers|fablearn|conference|symposium|kongressi|konferenssi)\b/)) {
        uniquePush(categoryTags, "kansainvälinen-konferenssi");
      }
    }

    if (has(/\bwebinaari\b|\bwebinar\b|itk-webinaari|verkkoluent|verkkolive/)) {
      uniquePush(categoryTags, "webinaari");
    }

    if (has(/\bveso\b|täydennyskoulut|taydennyskoulut|koulutuspaketti|opettajille suunnattu|opettajien täydennys|digierko|opopassi|\bavi\b/)) {
      uniquePush(categoryTags, "täydennyskoulutus");
    }

    if (has(/\bhanke\b|hankkeen|project presentation|hankeesittely|esittely japanilaiselle vieraalle/)) {
      uniquePush(categoryTags, "hanke-esittely");
    }

    if (has(/\bluento\b|opintojak|kurssi|kurssin|väitös|vaitos|doctoral defence|akateeminen luento|\b\d{5,6}[a-z]\b/)) {
      uniquePush(categoryTags, "tdk-luento");
    }

    if (categoryTags.includes("konferenssi-keynote") || categoryTags.includes("kansainvälinen-konferenssi")) {
      uniquePush(profileTags, "tutkija");
      uniquePush(profileTags, "asiantuntija");
    }

    if (categoryTags.includes("täydennyskoulutus") || categoryTags.includes("webinaari") || categoryTags.includes("hanke-esittely")) {
      uniquePush(profileTags, "kouluttaja");
    }

    if (categoryTags.includes("tdk-luento")) {
      uniquePush(profileTags, "kouluttaja");
      uniquePush(profileTags, "tutkija");
    }

    if (item.archiveType === "aoe") {
      uniquePush(profileTags, "kouluttaja");
    }

    if (item.archiveType === "analysis") {
      uniquePush(profileTags, "asiantuntija");
      uniquePush(profileTags, "tutkija");
    }

    if (item.sourceKey === "videoSeries") {
      uniquePush(profileTags, "kouluttaja");
      uniquePush(profileTags, "asiantuntija");
    }

    if (has(/asiantuntija|paneeli|palveluverkko|tausta-aineisto|päätöksenteko/)) {
      uniquePush(profileTags, "asiantuntija");
    }

    if (has(/väittelijä|research|doctoral|väitös|vaitos|conference|symposium|cscl|learning analytics/)) {
      uniquePush(profileTags, "tutkija");
    }

    if (has(/kouluttaja|workshop|työpaja|opettajille suunnattu|opettajien täydennys|digierko|veso/)) {
      uniquePush(profileTags, "kouluttaja");
    }

    if (item.archiveType === "video" || item.archiveType === "aoe") {
      uniquePush(routeTags, "route:materiaalit");
    }

    if (
      categoryTags.includes("konferenssi-keynote") ||
      categoryTags.includes("kansainvälinen-konferenssi") ||
      profileTags.includes("tutkija")
    ) {
      uniquePush(routeTags, "route:puheenvuorot");
    }

    if (
      categoryTags.includes("täydennyskoulutus") ||
      categoryTags.includes("webinaari") ||
      categoryTags.includes("hanke-esittely") ||
      categoryTags.includes("tdk-luento")
    ) {
      uniquePush(routeTags, "route:koulutukset");
    }

    if (
      profileTags.includes("asiantuntija") &&
      !routeTags.includes("route:koulutukset") &&
      item.archiveType !== "aoe"
    ) {
      uniquePush(routeTags, "route:puheenvuorot");
    }

    if (!routeTags.length && item.archiveType === "own") {
      if (has(/teacher education|opettajankoulutus|opettaj|pedagog|opetus|oppiminen|learning|education|kurssi|luento|workshop|mobiilioppiminen|multimedia|social media|teknologiatuettu/)) {
        uniquePush(routeTags, "route:koulutukset");
      } else {
        uniquePush(routeTags, "route:puheenvuorot");
      }
    }

    let routePrimary = "";
    if (item.archiveType !== "analysis") {
      if (item.archiveType === "video" || item.archiveType === "aoe") {
        routePrimary = "route:materiaalit";
      } else if (
        categoryTags.includes("konferenssi-keynote") ||
        categoryTags.includes("kansainvälinen-konferenssi")
      ) {
        routePrimary = "route:puheenvuorot";
      } else if (
        categoryTags.includes("täydennyskoulutus") ||
        categoryTags.includes("webinaari") ||
        categoryTags.includes("hanke-esittely") ||
        categoryTags.includes("tdk-luento")
      ) {
        routePrimary = "route:koulutukset";
      } else if (routeTags.includes("route:puheenvuorot")) {
        routePrimary = "route:puheenvuorot";
      } else if (routeTags.includes("route:koulutukset")) {
        routePrimary = "route:koulutukset";
      } else if (routeTags.includes("route:materiaalit")) {
        routePrimary = "route:materiaalit";
      }
    }

    return {
      categoryTags,
      profileTags,
      routeTags,
      routePrimary,
      primaryCategory: categoryTags[0] || ""
    };
  }

  function renderContextBadges(item) {
    const matches = (Array.isArray(item.matchedContexts) ? item.matchedContexts : findContextsForItem(item)).slice(0, 2);
    if (!matches.length) return "";
    return `<div class="presentation-context-chip-row">${matches.map((context) => `
      <span class="presentation-context-chip">${escHtml(context.typeLabel || "Konteksti")}: ${escHtml(context.title || "")}</span>
    `).join("")}</div>`;
  }

  function toDisplayDate(value) {
    if (!value) return "";
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("fi-FI").format(parsed);
    }
    return String(value);
  }

  function toIsoDate(value) {
    if (!value) return null;
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
    const day = String(parsed.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function extractSlideshareDateFromThumbnail(thumbnailUrl) {
    if (!thumbnailUrl) return null;
    // Kaikki SlideShare-formaatit: -YYMMDDHHMMSS- (12 numeroa väliviivojen välissä)
    // Uusi: -190322085500-thumbnail, Vanha: -120125013821-phpapp01-, -conversion-gate01- jne.
    const match = String(thumbnailUrl).match(/-(\d{6})\d{6}-/);
    if (!match) return null;
    const yymmdd = match[1];
    const yy = Number.parseInt(yymmdd.slice(0, 2), 10);
    const mm = Number.parseInt(yymmdd.slice(2, 4), 10);
    const dd = Number.parseInt(yymmdd.slice(4, 6), 10);
    if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return null;
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
    const year = yy >= 90 ? 1900 + yy : 2000 + yy;
    return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  }

  function normalizeSlideshareIsoDate(value, thumbnailUrl) {
    // Thumbnail-URL on luotettavin lähde (sisältää latauspäivän tiedostonimessä).
    // Front matter -päivämäärä toimii fallbackina tiedostoille joilla thumbnail puuttuu.
    return extractSlideshareDateFromThumbnail(thumbnailUrl) || toIsoDate(value) || "";
  }

  function normalizeRows(key, rows) {
    if (!Array.isArray(rows)) return [];

    if (key === "aoe") {
      return rows.map((r) => ({
        title: r.title || "Nimetön oppimateriaali",
        url: r.url || "",
        thumbnail: r.image || "",
        description: r.summary || "",
        meta: "AOE / Oppimateriaali",
        date: r.year || "",
        _isoDate: r.year ? `${r.year}-12-31` : ""
      }));
    }

    if (key === "canva") {
      return rows.map((r) => {
        const iso = toIsoDate(r.date || r.publishedAt || r.createdAt || r.updatedAt || "") || "";
        return {
          title: r.title || "Nimetön esitys",
          url: r.url || "",
          thumbnail: r.thumbnail || "",
          description: r.description || "",
          keywords: Array.isArray(r.categories) ? r.categories.filter(Boolean) : [],
          meta: "Canva",
          date: toDisplayDate(iso),
          _isoDate: iso,
          jarjestaja: r.jarjestaja || "",
          kategoria: r.kategoria || "",
          paakortti: r.paakortti === true,
          asiantuntijaprofiili: Array.isArray(r.asiantuntijaprofiili) ? r.asiantuntijaprofiili : [],
          sivuyhteys: Array.isArray(r.sivuyhteys) ? r.sivuyhteys : [],
        };
      });
    }

    if (key === "youtubeVideos") {
      return rows.map((r) => ({
        title: r.title || "Nimetön video",
        url: r.url || "",
        thumbnail: r.thumbnail || "",
        description: r.description || "",
        meta: "YouTube-video",
        date: toDisplayDate(r.publishedAt || ""),
        _isoDate: toIsoDate(r.publishedAt || "") || ""
      }));
    }

    if (key === "curatedVideos") {
      return rows.map((r) => ({
        title: r.title || "Nimetön video",
        url: r.url || r.externalUrl || "",
        externalUrl: r.externalUrl || "",
        thumbnail: r.thumbnail || "",
        description: r.description || "",
        meta: r.badgeText || "Video / tallenne",
        date: toDisplayDate(r.date || ""),
        _isoDate: toIsoDate(r.date || "") || ""
      }));
    }

    if (key === "videoSeries") {
      return rows.map((r) => ({
        title: r.title || "Nimetön videosarja",
        url: r.url || r.externalUrl || "",
        externalUrl: r.externalUrl || "",
        thumbnail: r.thumbnail || "",
        description: r.description || "",
        meta: r.badgeText || (r.itemCount ? `${r.itemCount} videota` : "Videosarja"),
        date: toDisplayDate(r.date || ""),
        _isoDate: toIsoDate(r.date || "") || ""
      }));
    }

    if (key === "youtube") {
      return rows.map((r) => ({
        title: r.title || "Nimetön soittolista",
        url: r.url || "",
        thumbnail: r.thumbnail || "",
        description: r.description || "",
        meta: `${r.itemCount || 0} videota`,
        date: toDisplayDate(r.publishedAt || ""),
        _isoDate: toIsoDate(r.publishedAt || "") || ""
      }));
    }

    if (key === "google") {
      return rows.map((r) => ({
        title: r.title || "Nimetön esitys",
        url: r.url || "",
        thumbnail: r.thumbnail || "",
        description: "Google Slides -esitys",
        meta: "Google Slides",
        date: r.date || "",
        _isoDate: toIsoDate(r.date || "") || ""
      }));
    }

    if (key === "slideshare") {
      return rows.map((r) => {
        const iso = normalizeSlideshareIsoDate(r.date || "", r.thumbnail || "");
        return {
          date: toDisplayDate(iso),
          title: r.title || "Nimetön esitys",
          url: r.url || "",
          thumbnail: r.thumbnail || "",
          description: r.description || "",
          keywords: [
            ...(Array.isArray(r.categories) ? r.categories : []),
            ...(Array.isArray(r.keywords) ? r.keywords : [])
          ].map((value) => String(value || "").trim()).filter(Boolean),
          _isoDate: iso
        };
      });
    }

    return [];
  }

  function renderFeatured(key, rows) {
    const host = document.getElementById(`featured-${key}`);
    if (!host || !rows.length) return;
    const item = rows[0];
    const icon = escHtml(iconByKey[key] || "bi-file-earmark");
    const isVideoThumb = key === "youtubeVideos" || key === "videoSeries";
    const thumb = item.thumbnail
      ? `<img src="${escHtml(item.thumbnail)}" alt="${escHtml(item.title)}" class="featured-thumb" style="object-fit:cover;" loading="lazy" decoding="async" onerror="this.style.display='none';">`
      : `<div class="featured-thumb" style="background:var(--bs-secondary-bg);display:flex;align-items:center;justify-content:center;color:var(--bs-secondary-color);font-size:1.5rem;"><i class="bi ${icon}"></i></div>`;
    const label = escHtml(linkLabelByKey[key] || "Avaa");
    const desc = escHtml(truncate(item.description || item.meta || "", 130));
    host.innerHTML = `
      <div class="card border-0 shadow-sm mb-4 overflow-hidden">
        <div class="d-flex align-items-stretch">
          <div class="flex-shrink-0 overflow-hidden ${isVideoThumb ? "video-preview video-preview--sm" : ""}">${thumb}</div>
          <div class="card-body py-2 px-3 d-flex flex-column justify-content-center">
            <p class="text-muted small mb-1">
              ${item.date ? `<i class="bi bi-calendar3 me-1"></i>${escHtml(item.date)}&ensp;` : ""}
              <span class="badge text-bg-warning text-dark fw-semibold" style="font-size:.65rem;">Uusin</span>
            </p>
            <h3 class="h6 fw-bold mb-1 lh-sm">${escHtml(item.title)}</h3>
            ${desc ? `<p class="text-muted small mb-2">${desc}</p>` : ""}
            ${item.url ? `<a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm rounded-pill px-3 align-self-start">${label} <i class="bi bi-arrow-up-right"></i></a>` : ""}
          </div>
        </div>
      </div>`;
  }

  function pickFourRandom(rows) {
    if (!rows.length) return [];
    const shuffled = [...rows];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const picked = shuffled.slice(0, Math.min(4, shuffled.length));
    while (picked.length < 4) {
      picked.push(shuffled[picked.length % shuffled.length]);
    }
    return picked;
  }

  function renderScroller(key, rows) {
    const host = document.querySelector(`.presentation-scroller[data-key="${key}"] .presentation-scroller-track`);
    if (!host) return;
    const cards = pickFourRandom(rows);
    if (!cards.length) {
      host.innerHTML = "";
      return;
    }

    const htmlCards = cards.map((item) => {
      const isVideoThumb = key === "youtubeVideos" || key === "videoSeries";
      const thumb = item.thumbnail
        ? `<div class="scroller-media ${isVideoThumb ? "video-preview video-preview--sm" : ""}">
             <img src="${escHtml(item.thumbnail)}" class="card-img-top" alt="${escHtml(item.title)}" loading="lazy" decoding="async" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
             <div class="scroller-placeholder" style="display:none;"><i class="bi ${escHtml(iconByKey[key] || "bi-file-earmark")}"></i></div>
           </div>`
        : `<div class="scroller-placeholder"><i class="bi ${escHtml(iconByKey[key] || "bi-file-earmark")}"></i></div>`;
      const link = item.url
        ? `<a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm rounded-pill px-3">${escHtml(linkLabelByKey[key] || "Avaa")} <i class="bi bi-arrow-up-right"></i></a>`
        : `<span class="text-muted small"><i class="bi bi-link-45deg"></i> Ei linkkiä</span>`;
      const pageLink = item.pageUrl
        ? `<a href="${escHtml(item.pageUrl)}" class="btn btn-outline-secondary btn-sm rounded-pill px-2 ms-1" title="Esityksen sivu"><i class="bi bi-file-earmark-text"></i></a>`
        : "";
      return `
        <article class="card border-0 shadow-sm presentation-scroller-card">
          ${thumb}
          <div class="card-body p-3">
            <h3 class="h6 mb-1">${escHtml(item.title)}</h3>
            ${item.date ? `<p class="text-muted small mb-1"><i class="bi bi-calendar3 me-1"></i>${escHtml(item.date)}</p>` : ""}
            <p class="text-muted small mb-3">${escHtml(truncate(item.meta || item.description, 72))}</p>
            ${link}${pageLink}
          </div>
        </article>
      `;
    }).join("");

    host.innerHTML = `${htmlCards}${htmlCards}`;
  }

  function renderPagination(key, rows, page, onChange) {
    const host = document.getElementById(`pagination-${key}`);
    if (!host) return;
    const pageCount = Math.ceil(rows.length / PAGE_SIZE);
    if (pageCount <= 1) {
      host.innerHTML = "";
      return;
    }

    let html = "";
    for (let p = 1; p <= pageCount; p += 1) {
      html += `
        <li class="page-item ${p === page ? "active" : ""}">
          <button class="page-link" type="button" data-page="${p}">${p}</button>
        </li>
      `;
    }
    host.innerHTML = html;
    host.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => onChange(Number(btn.dataset.page)));
    });
  }

  function renderTable(key, rows, page, onChange) {
    const tbody = document.getElementById(`table-body-${key}`);
    if (!tbody) return;
    const start = (page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);

    if (key === "youtubeVideos") {
      tbody.innerHTML = pageRows.map((item) => {
        const preview = item.thumbnail
          ? `<span class="video-preview video-preview--xs d-inline-block"><img src="${escHtml(item.thumbnail)}" alt="${escHtml(item.title)}" class="img-fluid border" style="max-height:72px;object-fit:cover;" loading="lazy" decoding="async" onerror="this.closest('.video-preview').outerHTML='<span class=&quot;text-muted small&quot;>Ei saatavilla</span>';"></span>`
          : '<span class="text-muted small">Ei saatavilla</span>';
        const desc = item.description ? escHtml(truncate(item.description, 140)) : '<span class="text-muted small">-</span>';
        return `
          <tr>
            <td class="small text-muted text-center" data-label="Esikatselu">${preview}</td>
            <td class="fw-semibold" data-label="Otsikko">${escHtml(item.title)}</td>
            <td class="small" data-label="Kuvaus">${desc}</td>
            <td class="text-nowrap" data-label="Päiväys">${escHtml(item.date || "-")}</td>
            <td data-label="Avaa">
              ${item.url
                ? `<a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm rounded-pill px-3">Katso</a>`
                : `<span class="text-muted small">Ei linkkiä</span>`}
            </td>
          </tr>
        `;
      }).join("");
      renderPagination(key, rows, page, onChange);
      return;
    }

    if (key === "canva" || key === "slideshare") {
      tbody.innerHTML = pageRows.map((item) => {
        const keywords = Array.isArray(item.keywords) ? item.keywords : [];
        const keywordHtml = keywords.length
          ? keywords.map((k) => `<span class="badge text-bg-light text-dark border me-1 mb-1">${escHtml(k)}</span>`).join("")
          : '<span class="text-muted small">Ei saatavilla</span>';
        const preview = item.thumbnail
          ? `<img src="${escHtml(item.thumbnail)}" alt="${escHtml(item.title)}" class="img-fluid border" style="max-height:72px;object-fit:cover;" loading="lazy" decoding="async" onerror="this.outerHTML='<span class=&quot;text-muted small&quot;>Ei saatavilla</span>';">`
          : '<span class="text-muted small">Ei saatavilla</span>';
        const summary = item.description ? escHtml(truncate(item.description, 220)) : '<span class="text-muted small">Ei saatavilla</span>';
        return `
          <tr>
            <td class="text-center small text-muted font-monospace" data-label="Päivämäärä">${escHtml(item.date || "Ei saatavilla")}</td>
            <td class="small text-muted text-center" data-label="Esikatselu">${preview}</td>
            <td class="fw-semibold" data-label="Otsikko">${escHtml(item.title)}</td>
            <td class="small" data-label="Tiivistelmä">${summary}</td>
            <td data-label="Avainsanat">${keywordHtml}</td>
            <td class="text-center" data-label="Avaa">
              <div class="d-flex gap-1 justify-content-center flex-wrap">
              ${item.url
                ? `<a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm rounded-pill px-2" title="Avaa esitys"><i class="bi bi-arrow-up-right"></i></a>`
                : `<span class="text-muted small">Ei linkkiä</span>`}
              ${item.pageUrl
                ? `<a href="${escHtml(item.pageUrl)}" class="btn btn-outline-secondary btn-sm rounded-pill px-2" title="Esityksen sivu"><i class="bi bi-file-earmark-text"></i></a>`
                : ""}
              </div>
            </td>
          </tr>
        `;
      }).join("");
    } else {
      tbody.innerHTML = pageRows.map((item) => `
        <tr>
          <td class="fw-semibold" data-label="Otsikko">${escHtml(item.title)}</td>
          <td data-label="Kuvaus">
            <div class="small">${escHtml(truncate(item.description, 140) || "-")}</div>
            <div class="small text-muted">${escHtml(item.meta || "")}</div>
          </td>
          <td class="text-nowrap" data-label="Päiväys / vuosi">${escHtml(item.date || "-")}</td>
          <td data-label="Avaa">
            ${item.url
              ? `<a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm rounded-pill px-3">${escHtml(linkLabelByKey[key] || "Avaa")}</a>`
              : `<span class="text-muted small">Ei linkkiä</span>`}
          </td>
        </tr>
      `).join("");
    }

    renderPagination(key, rows, page, onChange);
  }

  function renderMobileList(key, rows, page) {
    const host = document.getElementById(`mobile-list-${key}`);
    if (!host) return;
    const start = (page - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);

    host.innerHTML = pageRows.map((item) => {
      const keywords = Array.isArray(item.keywords) ? item.keywords : [];
      const keywordHtml = keywords.length
        ? `<div class="d-flex flex-wrap gap-1 mb-2">${keywords.map((k) => `<span class="badge text-bg-light text-dark border">${escHtml(k)}</span>`).join("")}</div>`
        : "";
      const isVideoThumb = key === "youtubeVideos" || key === "videoSeries";
      const thumbHtml = item.thumbnail
        ? `<span class="${isVideoThumb ? "video-preview video-preview--xs " : ""}rounded flex-shrink-0 me-3" style="width:72px;height:52px;"><img src="${escHtml(item.thumbnail)}" alt="" class="rounded" style="width:72px;height:52px;object-fit:cover;" loading="lazy" decoding="async" onerror="this.closest('span').style.display='none';"></span>`
        : "";
      const openBtn = item.url
        ? `<a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm rounded-pill px-3">${escHtml(linkLabelByKey[key] || "Avaa")} <i class="bi bi-arrow-up-right"></i></a>`
        : "";
      const pageBtn = item.pageUrl
        ? `<a href="${escHtml(item.pageUrl)}" class="btn btn-outline-secondary btn-sm rounded-pill px-2 ms-1" title="Esityksen sivu"><i class="bi bi-file-earmark-text"></i></a>`
        : "";
      const descText = truncate(item.description, 140);
      return `
        <li class="border-bottom py-3" role="listitem">
          <div class="d-flex align-items-start">
            ${thumbHtml}
            <div class="flex-grow-1 overflow-hidden">
              <p class="fw-semibold mb-1 lh-sm">${escHtml(item.title)}</p>
              ${item.date ? `<p class="text-muted small mb-1"><i class="bi bi-calendar3 me-1"></i>${escHtml(item.date)}</p>` : ""}
              ${item.meta ? `<p class="text-muted small mb-1">${escHtml(item.meta)}</p>` : ""}
              ${descText ? `<p class="text-muted small mb-2">${escHtml(descText)}</p>` : ""}
              ${keywordHtml}
              <div class="d-flex gap-1 flex-wrap">${openBtn}${pageBtn}</div>
            </div>
          </div>
        </li>`;
    }).join("");
  }

  function buildUnifiedArchiveItems() {
    const items = [];
    Object.entries(rawData).forEach(([key, rows]) => {
      const meta = archiveMetaByKey[key];
      if (!meta) return;
      normalizeRows(key, rows).forEach((item) => {
        const matchedContexts = findContextsForItem(item);
        const taxonomy = classifyPresentationItem(
          {
            ...item,
            archiveType: meta.archiveType,
            archiveTypeLabel: meta.archiveTypeLabel,
            sourceLabel: meta.sourceLabel,
            sourceKey: key
          },
          matchedContexts
        );
        items.push({
          ...item,
          archiveType: meta.archiveType,
          archiveTypeLabel: meta.archiveTypeLabel,
          sourceLabel: meta.sourceLabel,
          sourceKey: key,
          openLabel: linkLabelByKey[key] || "Avaa",
          matchedContexts,
          categoryTags: taxonomy.categoryTags,
          profileTags: taxonomy.profileTags,
          routeTags: taxonomy.routeTags,
          routePrimary: taxonomy.routePrimary,
          kategoria: item.kategoria || taxonomy.primaryCategory
        });
      });
    });

    analysisArchiveItems.forEach((item) => {
      const matchedContexts = findContextsForItem(item);
      const taxonomy = classifyPresentationItem(item, matchedContexts);
      items.push({
        ...item,
        openLabel: linkLabelByKey.analysis,
        matchedContexts,
        categoryTags: taxonomy.categoryTags,
        profileTags: taxonomy.profileTags,
        routeTags: taxonomy.routeTags,
        routePrimary: taxonomy.routePrimary,
        kategoria: item.kategoria || taxonomy.primaryCategory
      });
    });

    const seen = new Set();
    return items
      .filter((item) => {
        const key = `${item.url || item.pageUrl || ""}|${item.title || ""}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (b._isoDate || "").localeCompare(a._isoDate || ""));
  }

  function matchesPresentationFilter(item, filter) {
    if (!filter || filter === "all") return true;
    if (filter === "route:puheenvuorot") {
      return item.routePrimary === filter;
    }
    if (filter === "route:koulutukset") {
      return item.routePrimary === filter;
    }
    if (filter === "route:materiaalit") {
      return item.routePrimary === filter;
    }
    if (["own", "aoe", "video", "analysis"].includes(filter)) return item.archiveType === filter;
    if (filter.startsWith("category:")) {
      return Array.isArray(item.categoryTags) && item.categoryTags.includes(filter.slice("category:".length));
    }
    if (filter.startsWith("profile:")) {
      return Array.isArray(item.profileTags) && item.profileTags.includes(filter.slice("profile:".length));
    }
    if (filter.startsWith("context:")) {
      return Array.isArray(item.sivuyhteys) && item.sivuyhteys.includes(filter.slice("context:".length));
    }
    return false;
  }

  function renderPresentationFilterCounts(items) {
    document.querySelectorAll("[data-presentation-count]").forEach((node) => {
      const filter = node.dataset.presentationCount || "all";
      const count = items.filter((item) => matchesPresentationFilter(item, filter)).length;
      node.textContent = count === 1 ? "1 aineisto" : `${count} aineistoa`;
    });
  }

  function describePresentationFilter(filter) {
    const labels = {
      all: { label: "Kaikki aineistot", note: "" },
      "route:puheenvuorot": { label: "Puheenvuorot", note: "Pääreitti käyttää ensisijaista reittiluokitusta." },
      "route:koulutukset": { label: "Koulutukset", note: "Pääreitti käyttää ensisijaista reittiluokitusta." },
      "route:materiaalit": { label: "Videot ja materiaalit", note: "Pääreitti käyttää ensisijaista reittiluokitusta." },
      own: { label: "Omat esitykset", note: "" },
      aoe: { label: "Avoimet oppimateriaalit", note: "" },
      video: { label: "Videot", note: "" },
      analysis: { label: "Analyysit", note: "" }
    };
    if (labels[filter]) return labels[filter];

    if (filter.startsWith("category:")) {
      const suffix = filter.slice("category:".length);
      const categoryLabels = {
        "konferenssi-keynote": "Keynotet",
        "kansainvälinen-konferenssi": "Kansainväliset konferenssit",
        "täydennyskoulutus": "Täydennyskoulutukset",
        "tdk-luento": "Yliopistoluennot",
        "webinaari": "Webinaarit"
      };
      return { label: categoryLabels[suffix] || suffix, note: "Suodatus perustuu aineistolle annettuihin tai johdettuihin kategorioihin." };
    }

    if (filter.startsWith("profile:")) {
      const suffix = filter.slice("profile:".length);
      const profileLabels = {
        kouluttaja: "Kouluttaja",
        tutkija: "Tutkija",
        asiantuntija: "Asiantuntija"
      };
      return { label: profileLabels[suffix] || suffix, note: "Suodatus perustuu asiantuntijaprofiiliin." };
    }

    if (filter.startsWith("context:")) {
      return { label: filter.slice("context:".length), note: "Suodatus perustuu sivuyhteyteen." };
    }

    return { label: "Valittu suodatus", note: "" };
  }

  function renderUnifiedArchive(items, filter, page) {
    const grid = document.getElementById("presentation-unified-archive");
    const status = document.getElementById("presentation-unified-status");
    const pagination = document.getElementById("presentation-unified-pagination");
    if (!grid || !status || !pagination) return;

    const filtered = items.filter((item) => matchesPresentationFilter(item, filter));
    const pageCount = Math.max(1, Math.ceil(filtered.length / UNIFIED_PAGE_SIZE));
    const safePage = Math.min(Math.max(page, 1), pageCount);
    const start = (safePage - 1) * UNIFIED_PAGE_SIZE;
    const pageItems = filtered.slice(start, start + UNIFIED_PAGE_SIZE);
    const filterInfo = describePresentationFilter(filter || "all");

    status.innerHTML = `
      <span class="presentation-archive-status-badge">${escHtml(filterInfo.label)}</span>
      <span>${filtered.length === 1 ? "Näytetään 1 aineisto." : `Näytetään ${filtered.length} aineistoa.`}</span>
      ${filterInfo.note ? `<small>${escHtml(filterInfo.note)}</small>` : ""}
    `;

    if (!pageItems.length) {
      grid.innerHTML = `<p class="text-muted mb-0">Suodatuksella “${escHtml(filterInfo.label)}” ei löytynyt aineistoa.</p>`;
      pagination.innerHTML = "";
      return;
    }

    grid.innerHTML = pageItems.map((item) => {
      const primaryUrl = item.pageUrl || item.url || "";
      const contextBadges = renderContextBadges(item);
      const isVideoThumb = item.sourceKey === "youtubeVideos" || item.sourceKey === "videoSeries";
      const thumb = item.thumbnail
        ? `<span class="presentation-archive-card-thumb-placeholder"><i class="bi ${escHtml(iconByKey[item.sourceKey] || "bi-easel2")}"></i></span><img src="${escHtml(item.thumbnail)}" alt="" class="presentation-archive-card-thumb-image" loading="lazy" decoding="async" onerror="this.style.display='none';">`
        : `<span class="presentation-archive-card-thumb-placeholder"><i class="bi ${escHtml(iconByKey[item.sourceKey] || "bi-easel2")}"></i></span>`;
      const externalButton = item.url
        ? `<a href="${escHtml(item.url)}"${linkAttrs(item.url)} class="btn btn-outline-primary btn-sm rounded-pill px-3">${escHtml(item.openLabel || "Avaa")}</a>`
        : "";
      const sourceButton = item.externalUrl && item.externalUrl !== item.url
        ? `<a href="${escHtml(item.externalUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-secondary btn-sm rounded-pill px-3">YouTube</a>`
        : "";
      const pageButton = item.pageUrl
        ? `<a href="${escHtml(item.pageUrl)}" class="btn btn-outline-secondary btn-sm rounded-pill px-3">Lisätiedot</a>`
        : "";
      const titleLink = primaryUrl
        ? `<a href="${escHtml(primaryUrl)}"${linkAttrs(primaryUrl)}>${escHtml(item.title)}</a>`
        : escHtml(item.title);
      const kategoriaLabels = {
        "konferenssi-keynote": "Keynote",
        "kansainvälinen-konferenssi": "Kansainvälinen",
        "täydennyskoulutus": "Täydennyskoulutus",
        "webinaari": "Webinaari",
        "hanke-esittely": "Hanke",
        "tdk-luento": "Yliopistoopetus",
        "muu": ""
      };
      const routeLabels = {
        "route:puheenvuorot": "Pääreitti: Puheenvuorot",
        "route:koulutukset": "Pääreitti: Koulutukset",
        "route:materiaalit": "Pääreitti: Videot ja materiaalit"
      };
      const kategoriaLabel = item.kategoria ? (kategoriaLabels[item.kategoria] || item.kategoria) : "";
      const kategoriaBadge = kategoriaLabel
        ? `<span class="badge text-bg-secondary me-1" style="font-size:.65rem;">${escHtml(kategoriaLabel)}</span>`
        : "";
      const routeBadge = item.routePrimary && routeLabels[item.routePrimary]
        ? `<span class="presentation-archive-card-route">${escHtml(routeLabels[item.routePrimary])}</span>`
        : "";
      const jarjestajaLine = (item.sourceKey === "canva" && item.jarjestaja)
        ? `<p class="presentation-archive-card-date">${escHtml(item.jarjestaja)}${item.date ? ` · ${escHtml(item.date)}` : ""}</p>`
        : `<p class="presentation-archive-card-date">${escHtml(item.date || item.meta || "")}</p>`;
      return `
        <article class="presentation-archive-card">
          <div class="presentation-archive-card-thumb ${isVideoThumb ? "video-preview video-preview--sm" : ""}">${thumb}</div>
          <div class="presentation-archive-card-body">
            <div class="presentation-archive-card-meta">
              ${routeBadge}${kategoriaBadge}<span>${escHtml(item.archiveTypeLabel || "Aineisto")}</span>
              <span>${escHtml(item.sourceLabel || item.meta || "")}</span>
            </div>
            <h3 class="presentation-archive-card-title">${titleLink}</h3>
            ${jarjestajaLine}
            ${contextBadges}
            <p class="presentation-archive-card-desc">${escHtml(truncate(item.description || item.meta || "", 150))}</p>
            <div class="presentation-archive-card-actions">${externalButton}${sourceButton}${pageButton}</div>
          </div>
        </article>
      `;
    }).join("");

    if (pageCount <= 1) {
      pagination.innerHTML = "";
      return;
    }

    pagination.innerHTML = Array.from({ length: pageCount }, (_, index) => {
      const pageNumber = index + 1;
      return `
        <li class="page-item ${pageNumber === safePage ? "active" : ""}">
          <button class="page-link" type="button" data-unified-page="${pageNumber}">${pageNumber}</button>
        </li>
      `;
    }).join("");
  }

  function renderFeatureShowcase() {
    const host = document.getElementById("presentation-feature-showcase");
    if (!host) return;
    const kategoriaLabels = {
      "konferenssi-keynote": "Keynote",
      "kansainvälinen-konferenssi": "Kansainvälinen",
      "täydennyskoulutus": "Täydennyskoulutus",
      "webinaari": "Webinaari",
      "hanke-esittely": "Hanke",
      "tdk-luento": "Yliopistoopetus",
      "muu": ""
    };
    const items = normalizeRows("canva", rawData.canva)
      .filter((r) => r.paakortti)
      .sort((a, b) => (b._isoDate || "").localeCompare(a._isoDate || ""));
    if (!items.length) {
      host.closest("section")?.style && (host.closest("section").style.display = "none");
      return;
    }

    const featured = items[0];
    const secondary = items.slice(1, 5);
    const labelFor = (item) => item.kategoria ? (kategoriaLabels[item.kategoria] || item.kategoria) : "Päänosto";
    const thumbFor = (item, className = "presentation-feature-primary-media") => item.thumbnail
      ? `<a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="${className}">
          <img src="${escHtml(item.thumbnail)}" alt="${escHtml(item.title)}" loading="lazy" decoding="async" onerror="this.style.display='none';">
        </a>`
      : `<a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="${className}">
          <span class="presentation-feature-placeholder"><i class="bi bi-file-earmark-slides"></i></span>
        </a>`;

    host.innerHTML = `
      <div class="presentation-feature-layout">
        <article class="presentation-feature-primary">
          ${thumbFor(featured)}
          <div class="presentation-feature-primary-body">
            <div class="presentation-feature-meta">
              <span>${escHtml(labelFor(featured))}</span>
              ${featured.jarjestaja ? `<span>${escHtml(featured.jarjestaja)}</span>` : ""}
              ${featured.date ? `<span>${escHtml(featured.date)}</span>` : ""}
            </div>
            <h3><a href="${escHtml(featured.url)}" target="_blank" rel="noopener noreferrer">${escHtml(featured.title)}</a></h3>
            <p>${escHtml(featured.description || "Analyysidatan perusteella päänostoksi merkitty esitys.")}</p>
            <div class="presentation-feature-actions">
              <a href="${escHtml(featured.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary rounded-pill px-4">Avaa esitys <i class="bi bi-arrow-up-right"></i></a>
              <a href="#kaikki-esitykset" class="btn btn-outline-secondary rounded-pill px-4" data-presentation-filter="category:${escHtml(featured.kategoria || "konferenssi-keynote")}">Näytä sama ryhmä</a>
            </div>
          </div>
        </article>
        <div class="presentation-feature-secondary">
          ${secondary.map((item) => `
            <a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="presentation-feature-small">
              ${item.thumbnail
                ? `<div class="presentation-feature-small-thumb"><img src="${escHtml(item.thumbnail)}" alt="" loading="lazy" decoding="async" onerror="this.parentElement.style.display='none';"></div>`
                : `<div class="presentation-feature-small-thumb presentation-feature-small-thumb--empty"><i class="bi bi-easel2"></i></div>`}
              <div class="presentation-feature-small-body">
                <span class="presentation-feature-small-label">${escHtml(labelFor(item))}</span>
                <strong>${escHtml(item.title)}</strong>
                ${item.description ? `<p class="presentation-feature-small-desc">${escHtml(item.description)}</p>` : ""}
                ${(item.jarjestaja || item.date) ? `<span class="presentation-feature-small-meta">${escHtml(item.jarjestaja ? `${item.jarjestaja}${item.date ? ` · ${item.date}` : ""}` : (item.date || ""))}</span>` : ""}
              </div>
            </a>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderLegacyFeaturedCards() {
    const grid = document.getElementById("paakortti-grid");
    if (!grid) return;
    const items = normalizeRows("canva", rawData.canva).filter((r) => r.paakortti);
    if (!items.length) {
      grid.closest("section")?.style && (grid.closest("section").style.display = "none");
      return;
    }
    grid.innerHTML = items.map((item) => {
      const thumb = item.thumbnail
        ? `<span class="presentation-archive-card-thumb-placeholder"><i class="bi bi-file-earmark-slides"></i></span><img src="${escHtml(item.thumbnail)}" alt="" class="presentation-archive-card-thumb-image" loading="lazy" decoding="async" onerror="this.style.display='none';">`
        : `<span class="presentation-archive-card-thumb-placeholder"><i class="bi bi-file-earmark-slides"></i></span>`;
      return `
        <article class="presentation-archive-card presentation-archive-card--featured">
          <div class="presentation-archive-card-thumb">${thumb}</div>
          <div class="presentation-archive-card-body">
            <div class="presentation-archive-card-meta"><span>Canva</span></div>
            <h3 class="presentation-archive-card-title">
              <a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escHtml(item.title)}</a>
            </h3>
            ${item.date ? `<p class="presentation-archive-card-date">${escHtml(item.date)}</p>` : ""}
            <p class="presentation-archive-card-desc">${escHtml(truncate(item.description || "", 150))}</p>
            <div class="presentation-archive-card-actions">
              <a href="${escHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm rounded-pill px-3">Avaa <i class="bi bi-arrow-up-right"></i></a>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function initUnifiedArchive() {
    const archiveItems = buildUnifiedArchiveItems();
    const filterControls = [...document.querySelectorAll("[data-presentation-filter]")];
    let activeFilter = "all";
    let activePage = 1;
    renderPresentationFilterCounts(archiveItems);

    const applyFilter = (filter, shouldScroll = false) => {
      activeFilter = filter || "all";
      activePage = 1;
      filterControls.forEach((control) => {
        control.classList.toggle("is-active", control.dataset.presentationFilter === activeFilter);
      });
      renderUnifiedArchive(archiveItems, activeFilter, activePage);
      if (shouldScroll) {
        document.getElementById("kaikki-esitykset")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    filterControls.forEach((control) => {
      control.addEventListener("click", (event) => {
        const filter = control.dataset.presentationFilter || "all";
        if (control.tagName === "A") event.preventDefault();
        applyFilter(filter, control.tagName === "A");
      });
    });

    document.getElementById("presentation-unified-pagination")?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-unified-page]");
      if (!button) return;
      activePage = Number(button.dataset.unifiedPage) || 1;
      renderUnifiedArchive(archiveItems, activeFilter, activePage);
      document.getElementById("kaikki-esitykset")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    applyFilter("all", false);
  }

  Object.entries(rawData).forEach(([key, rows]) => {
    const normalized = normalizeRows(key, rows);
    if (!normalized.length) return;
    normalized.sort((a, b) => (b._isoDate || "").localeCompare(a._isoDate || ""));
    const hasFeatured = !!document.getElementById(`featured-${key}`);
    if (hasFeatured) renderFeatured(key, normalized);
    const rest = hasFeatured ? normalized.slice(1) : normalized;
    if (!rest.length) return;
    let currentPage = 1;
    const rerender = (newPage) => {
      currentPage = newPage;
      renderTable(key, rest, currentPage, rerender);
      renderMobileList(key, rest, currentPage);
    };
    rerender(1);
  });
  renderFeatureShowcase();
  renderLegacyFeaturedCards();
  initUnifiedArchive();
})();

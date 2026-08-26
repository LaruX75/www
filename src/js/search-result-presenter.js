/**
 * Shared search result presenter — pure browser projection from a
 * Pagefind result object to PF4/PF5-family HTML.
 *
 * Exposed as `window.SearchResultPresenter`. This module owns no
 * Pagefind state, no mount, no query/filter/sort state, and no
 * archive replacement. Its only job is:
 *
 *   Pagefind result + labels/context  ->  result presentation
 *
 * Reuses the existing `.find-explore-result*` CSS token family so
 * cards render identically to the Find & Explore surfaces without a
 * parallel design system.
 *
 * AUTHORITATIVE OWNER — as of the PF5-G1 shared-presenter convergence
 * (2026-08-23), the following helpers live only here:
 *   - escapeHtml
 *   - resultTitle
 *   - SISALTO_LABELS
 *   - contentFamilyLabelFromData
 *   - renderFamilyHeader
 *   - renderPrimaryMetaLine
 *
 * find-explore.js consumes them from `window.SearchResultPresenter`.
 * Any page that loads find-explore.js MUST load this presenter first.
 *
 * Additional helpers scoped to the global-search Modular UI surface
 * (detectKind, primaryMetaFor, yearFor, projectEntry, renderExcerpt,
 * renderSharedCard) also live here. F&E deliberately does NOT use
 * `renderExcerpt` from this module because F&E's current excerpt
 * rendering escapes the string (killing Pagefind's `<mark>` highlight
 * markup) — that behaviour is intentionally preserved by F&E owning
 * its own excerpt fragment inline; this presenter's `renderExcerpt`
 * preserves the raw markup because global search wants highlighted
 * excerpts.
 */
(function () {
  "use strict";

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function resultTitle(data) {
    return data?.meta?.title || data?.title || data?.url || "";
  }

  function searchSurfaceLanguage() {
    const lang = typeof document !== "undefined"
      ? document?.documentElement?.lang || ""
      : "";
    return String(lang || "").toLowerCase().startsWith("en") ? "en" : "fi";
  }

  // PF3: user-facing content-family labels deliberately Finnish across
  // FI and EN mounts so the visible label matches the Pagefind
  // `Sisältö:*` filter value. Do not localise here.
  const SISALTO_LABELS = {
    publications: "Julkaisut",
    theses: "Opinnäytteet",
    writings: "Kirjoitukset ja puheenvuorot",
    presentations: "Esitykset",
    media: "Mediassa"
  };

  function contentFamilyLabelFromData(kind, data) {
    const filters = data?.filters || {};
    const fromFilter = Array.isArray(filters["Sisältö"])
      ? filters["Sisältö"].find(Boolean)
      : "";
    if (fromFilter) return fromFilter;
    return SISALTO_LABELS[kind] || "";
  }

  function humanizeMediaEnum(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    return raw
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^./, (char) => char.toUpperCase());
  }

  function mediaLabelValue(meta, keyBase, language) {
    const localizedKey = `${keyBase}Label${language === "en" ? "En" : "Fi"}`;
    const localized = String(meta?.[localizedKey] || "").trim();
    if (localized && localized.toLowerCase() !== "media") return localized;

    const rawValue = String(meta?.[keyBase] || "").trim();
    if (rawValue) return humanizeMediaEnum(rawValue);

    return localized;
  }

  function mediaThumbnailUrl(meta) {
    const raw = String(meta?.thumbnail || "").trim();
    if (!raw) return "";
    try {
      const absolute = new URL(raw);
      if (absolute.protocol === "http:" || absolute.protocol === "https:") return absolute.href;
    } catch {
      // Relative thumbnails still need a valid browser origin below.
    }
    if (typeof window === "undefined" || !window.location?.origin || window.location.origin === "null") return "";
    try {
      const normalized = new URL(raw, window.location.origin);
      if (normalized.protocol !== "http:" && normalized.protocol !== "https:") return "";
      return normalized.href;
    } catch {
      return "";
    }
  }

  // Detect the canonical content kind from Pagefind result metadata.
  // Order matters: publications and theses expose the most specific
  // meta keys; presentations use `PresentationYear`; media uses
  // `mediaType`; writings expose `writingsYear`/`writingsContentType`.
  function detectKind(data) {
    const meta = data?.meta || {};
    if (meta.publicationYear || meta.publicationType || meta.publicationCsl) return "publications";
    if (meta.thesesYear || meta.thesesType || meta.thesesAuthorLine) return "theses";
    if (meta.mediaType || meta.mediaRole || meta.mediaOutlet) return "media";
    if (meta.PresentationYear || meta.PresentationType || meta.PresentationEvent) return "presentations";
    if (meta.writingsYear || meta.writingsContentType) return "writings";
    return "unknown";
  }

  // Deliberately reduced PF4 primary meta per kind. This matches the
  // PF5-G1 audit's writings decision (reduced result retained because
  // Pagefind meta does not carry description/publication) and stays
  // inside the metadata currently projected by canonical -> Pagefind.
  //
  // Scope: only kinds that had a resultMeta projection in
  // find-explore.js's `kindConfig` PRE-G1 emit a primary meta line.
  // `media` did NOT have a shared-renderer kind pre-G1 (that decision
  // is G3/PF5 Phase 3 territory, deliberately deferred); it therefore
  // renders here with the family badge only, no primary meta line.
  function primaryMetaFor(kind, data) {
    const meta = data?.meta || {};
    if (kind === "publications") {
      // Direct reuse of find-explore.js kindConfig.publications
      // resultMeta shape: authors · type · venue. The full APA
      // sentence lives in find-explore.js's publication card and
      // depends on mount-scope helpers we do not extract yet.
      return [
        meta.publicationAuthors || "",
        meta.publicationTypeLabel || meta.publicationType || meta.publicationGroup || "",
        meta.publicationVenue || meta.publicationJournal || meta.publicationPublisher || ""
      ].filter(Boolean);
    }
    if (kind === "theses") {
      // Direct reuse of find-explore.js kindConfig.theses shape:
      // author line + composed type-role.
      const type = meta.thesesType || "";
      const role = meta.thesesRole || "";
      const typeRole = [type, role].filter(Boolean).join(" · ");
      return [meta.thesesAuthorLine || "", typeRole].filter(Boolean);
    }
    if (kind === "writings") {
      // Direct reuse of find-explore.js kindConfig.writings shape:
      // content type only. Description/publication badges are NOT
      // projected on Pagefind meta today (PF5-G1 audit gap).
      return [meta.writingsContentType || ""].filter(Boolean);
    }
    if (kind === "presentations") {
      // Direct reuse of find-explore.js kindConfig.presentations
      // resultMeta shape: type + event.
      return [meta.PresentationType || "", meta.PresentationEvent || ""].filter(Boolean);
    }
    if (kind === "media") {
      const language = searchSurfaceLanguage();
      return [
        mediaLabelValue(meta, "mediaType", language),
        mediaLabelValue(meta, "mediaRole", language),
        meta.mediaOutlet || ""
      ].filter(Boolean);
    }
    // `unknown`: no primary meta line. Family badge only.
    return [];
  }

  function yearFor(kind, data) {
    const meta = data?.meta || {};
    if (kind === "publications") return meta.publicationYear || "";
    if (kind === "theses") return meta.thesesYear || "";
    if (kind === "writings") return meta.writingsYear || "";
    if (kind === "presentations") return meta.PresentationYear || "";
    if (kind === "media") return meta.year || "";
    return "";
  }

  function projectEntry(data) {
    const kind = detectKind(data);
    const meta = data?.meta || {};
    return {
      kind,
      url: data?.url || "",
      title: resultTitle(data),
      year: yearFor(kind, data),
      excerpt: data?.excerpt || "",
      meta: primaryMetaFor(kind, data),
      contentFamilyLabel: contentFamilyLabelFromData(kind, data),
      thumbnailUrl: kind === "media" ? mediaThumbnailUrl(meta) : ""
    };
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

  function renderPrimaryMetaLine(entry) {
    const parts = Array.isArray(entry?.meta) ? entry.meta.filter(Boolean) : [];
    if (parts.length === 0) return "";
    return `<p class="find-explore-result-primary-meta" data-find-explore-card-line="primary-meta">${parts.map((p) => escapeHtml(String(p))).join(" · ")}</p>`;
  }

  function renderExcerpt(entry) {
    if (!entry?.excerpt) return "";
    return `<p class="find-explore-result-excerpt" data-find-explore-card-line="excerpt">${entry.excerpt}</p>`;
  }

  function renderMediaThumbnail(entry) {
    if (!entry?.thumbnailUrl) return "";
    return `<div class="find-explore-result-media-thumb" data-find-explore-card-line="thumbnail" aria-hidden="true"><img class="find-explore-result-media-thumb-image" src="${escapeHtml(entry.thumbnailUrl)}" alt="" loading="lazy" decoding="async"></div>`;
  }

  function renderSharedBody(entry, titleMarkup) {
    return `${renderFamilyHeader(entry)}
      ${titleMarkup}
      ${renderPrimaryMetaLine(entry)}
      ${renderExcerpt(entry)}`;
  }

  // Pagefind's excerpt already contains safe <mark> tags for highlights;
  // do NOT escapeHtml() it, or the highlight markup collapses into text.
  // Title and meta are always escapeHtml()'d.
  function renderSharedCard(data) {
    const entry = projectEntry(data);
    const url = escapeHtml(entry.url);
    const title = escapeHtml(entry.title);
    const titleMarkup = `<a class="find-explore-result-title" href="${url}">${title}</a>`;
    if (entry.kind === "media" && entry.thumbnailUrl) {
      return `<li class="find-explore-result find-explore-result--${escapeHtml(entry.kind)} find-explore-result--with-thumbnail" data-search-result-kind="${escapeHtml(entry.kind)}">
      <div class="find-explore-result-media-layout">
        <div class="find-explore-result-media-body">
          ${renderSharedBody(entry, titleMarkup)}
        </div>
        ${renderMediaThumbnail(entry)}
      </div>
    </li>`;
    }
    return `<li class="find-explore-result find-explore-result--${escapeHtml(entry.kind)}" data-search-result-kind="${escapeHtml(entry.kind)}">
      ${renderSharedBody(entry, titleMarkup)}
    </li>`;
  }

  window.SearchResultPresenter = {
    escapeHtml,
    resultTitle,
    SISALTO_LABELS,
    contentFamilyLabelFromData,
    detectKind,
    primaryMetaFor,
    yearFor,
    projectEntry,
    renderFamilyHeader,
    renderPrimaryMetaLine,
    renderExcerpt,
    renderSharedCard
  };
})();

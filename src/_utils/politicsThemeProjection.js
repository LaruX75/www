function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeCanonicalPageUrl(value) {
  const pageUrl = pickString(value);
  const match = pageUrl.match(/^\/(\d{4})\/(\d{2})\/(\d{2})\/\1-\2-\3-(.+)\/$/);
  if (!match) return pageUrl;
  return `/${match[1]}/${match[2]}/${match[3]}/${match[4]}/`;
}

function createAuthoritativeItemIndex(authoritativeItems = []) {
  const index = new Map();

  toArray(authoritativeItems).forEach((item) => {
    const pageUrl = pickString(item?.pageUrl);
    if (!pageUrl) return;
    index.set(pageUrl, item);
    const normalizedPageUrl = normalizeCanonicalPageUrl(pageUrl);
    if (normalizedPageUrl && normalizedPageUrl !== pageUrl && !index.has(normalizedPageUrl)) {
      index.set(normalizedPageUrl, item);
    }
  });

  return index;
}

function projectThemeLink(link, authoritativeIndex) {
  if (typeof link === "string") {
    const pageUrl = pickString(link);
    if (!pageUrl.startsWith("/")) {
      throw new Error(`politics theme canonical link must be a local pageUrl: ${pageUrl}`);
    }

    const item = authoritativeIndex.get(pageUrl);
    if (!item) {
      throw new Error(`politics theme canonical link missing authoritative item: ${pageUrl}`);
    }

    return {
      href: normalizeCanonicalPageUrl(item.pageUrl),
      label: item.title,
      pageUrl: normalizeCanonicalPageUrl(item.pageUrl),
      date: item.date,
      year: item.year,
      contentType: item.contentType,
      contexts: toArray(item.contexts)
    };
  }

  const href = pickString(link?.href);
  const label = pickString(link?.label);
  if (!href || !label) {
    throw new Error("politics theme manual link requires href and label");
  }

  return {
    href,
    label
  };
}

function projectThemeTimelineEntry(entry, authoritativeIndex) {
  return {
    ...entry,
    links: toArray(entry?.links).map((link) => projectThemeLink(link, authoritativeIndex))
  };
}

function buildPoliticsThemePages(companionPages = [], options = {}) {
  const authoritativeIndex = options.authoritativeItems instanceof Map
    ? options.authoritativeItems
    : createAuthoritativeItemIndex(options.authoritativeItems || []);

  return toArray(companionPages).map((theme) => ({
    ...theme,
    timeline: toArray(theme?.timeline).map((entry) => projectThemeTimelineEntry(entry, authoritativeIndex))
  }));
}

module.exports = {
  createAuthoritativeItemIndex,
  normalizeCanonicalPageUrl,
  projectThemeLink,
  projectThemeTimelineEntry,
  buildPoliticsThemePages
};

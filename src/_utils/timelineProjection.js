const INTERNAL_TIMELINE_FIELDS = Object.freeze([
  "id",
  "pageUrl",
  "title",
  "date",
  "year",
  "contentType",
  "contexts",
  "sourceDomain"
]);

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function uniqueStrings(values = []) {
  const seen = new Set();
  return toArray(values).reduce((items, value) => {
    const normalized = pickString(value);
    if (!normalized || seen.has(normalized)) return items;
    seen.add(normalized);
    items.push(normalized);
    return items;
  }, []);
}

function normalizeAuthoritativeDate(value) {
  if (!value) {
    return {
      ok: false,
      reason: "missing-date",
      date: "",
      year: null
    };
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return {
        ok: false,
        reason: "invalid-date",
        date: "",
        year: null
      };
    }

    const iso = value.toISOString().slice(0, 10);
    return {
      ok: true,
      reason: null,
      date: iso,
      year: Number.parseInt(iso.slice(0, 4), 10)
    };
  }

  const normalized = pickString(value);
  if (!normalized) {
    return {
      ok: false,
      reason: "missing-date",
      date: "",
      year: null
    };
  }

  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/);
  if (!match) {
    return {
      ok: false,
      reason: "invalid-date",
      date: "",
      year: null
    };
  }

  const parsed = new Date(`${match[1]}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return {
      ok: false,
      reason: "invalid-date",
      date: "",
      year: null
    };
  }

  return {
    ok: true,
    reason: null,
    date: match[1],
    year: Number.parseInt(match[1].slice(0, 4), 10)
  };
}

function projectCanonicalTimelineItem(record = {}, options = {}) {
  const sourceDomain = pickString(options.sourceDomain);
  const id = pickString(record.id);
  const pageUrl = pickString(record.pageUrl || record.url);
  const title = pickString(record.title);
  const contentType = pickString(record.contentType);
  const contexts = uniqueStrings(record.contexts);
  const normalizedDate = normalizeAuthoritativeDate(record.date);

  if (!sourceDomain) {
    throw new Error("timeline projection requires sourceDomain");
  }

  if (!id) {
    throw new Error(`timeline projection requires canonical id for sourceDomain=${sourceDomain}`);
  }

  if (!pageUrl || !pageUrl.startsWith("/")) {
    throw new Error(`timeline projection requires local canonical pageUrl for id=${id}`);
  }

  if (!title) {
    throw new Error(`timeline projection requires title for id=${id}`);
  }

  if (!contentType) {
    throw new Error(`timeline projection requires contentType for id=${id}`);
  }

  if (!normalizedDate.ok) {
    return {
      ok: false,
      sourceDomain,
      reason: normalizedDate.reason,
      input: {
        id,
        pageUrl,
        title
      }
    };
  }

  return {
    ok: true,
    item: {
      id,
      pageUrl,
      title,
      date: normalizedDate.date,
      year: normalizedDate.year,
      contentType,
      contexts,
      sourceDomain
    }
  };
}

function compareTimelineItems(left = {}, right = {}) {
  const dateDiff = String(right.date || "").localeCompare(String(left.date || ""));
  if (dateDiff !== 0) return dateDiff;
  return String(left.pageUrl || "").localeCompare(String(right.pageUrl || ""), "fi");
}

function sortTimelineItems(items = []) {
  return [...toArray(items)].sort(compareTimelineItems);
}

function groupTimelineItemsByYear(items = []) {
  const groups = [];
  let currentYear = null;

  sortTimelineItems(items).forEach((item) => {
    if (item.year !== currentYear) {
      currentYear = item.year;
      groups.push({
        year: currentYear,
        items: []
      });
    }
    groups[groups.length - 1].items.push(item);
  });

  return groups;
}

function countTimelineField(items = [], field) {
  const counts = new Map();

  toArray(items).forEach((item) => {
    const values = Array.isArray(item?.[field]) ? item[field] : [item?.[field]];
    values
      .map(pickString)
      .filter(Boolean)
      .forEach((value) => {
        counts.set(value, (counts.get(value) || 0) + 1);
      });
  });

  return Object.fromEntries(
    [...counts.entries()].sort((left, right) => {
      const countDiff = right[1] - left[1];
      if (countDiff !== 0) return countDiff;
      return left[0].localeCompare(right[0], "fi");
    })
  );
}

function collectDuplicateFieldValues(items = [], field) {
  const seen = new Set();
  const duplicates = new Set();

  toArray(items).forEach((item) => {
    const value = pickString(item?.[field]);
    if (!value) return;
    if (seen.has(value)) {
      duplicates.add(value);
      return;
    }
    seen.add(value);
  });

  return [...duplicates].sort((left, right) => left.localeCompare(right, "fi"));
}

function createDuplicateError(kind, values) {
  const error = new Error(`${kind} detected in timeline projection`);
  error.code = kind;
  error.values = values;
  return error;
}

function buildTimelineProjection(sources = []) {
  const projectedItems = [];
  const excluded = [];
  const sourceDomains = [];
  let inputCount = 0;

  toArray(sources).forEach((source) => {
    const sourceDomain = pickString(source?.sourceDomain);
    const items = toArray(source?.items);
    if (!sourceDomain) {
      throw new Error("timeline projection source requires sourceDomain");
    }

    sourceDomains.push(sourceDomain);
    inputCount += items.length;

    items.forEach((record) => {
      const projected = projectCanonicalTimelineItem(record, { sourceDomain });
      if (projected.ok) {
        projectedItems.push(projected.item);
        return;
      }
      excluded.push(projected);
    });
  });

  const duplicateIds = collectDuplicateFieldValues(projectedItems, "id");
  if (duplicateIds.length) {
    throw createDuplicateError("duplicate-identity", duplicateIds);
  }

  const duplicatePageUrls = collectDuplicateFieldValues(projectedItems, "pageUrl");
  if (duplicatePageUrls.length) {
    throw createDuplicateError("duplicate-pageUrl", duplicatePageUrls);
  }

  const items = sortTimelineItems(projectedItems);
  const yearGroups = groupTimelineItemsByYear(items);
  const years = yearGroups.map((group) => group.year);

  return {
    sourceDomains: [...new Set(sourceDomains)],
    inputCount,
    projectedCount: items.length,
    excludedCount: excluded.length,
    items,
    yearGroups,
    excluded,
    excludedReasons: countTimelineField(excluded, "reason"),
    duplicateIds,
    duplicatePageUrls,
    earliestYear: years.length ? years[years.length - 1] : null,
    latestYear: years.length ? years[0] : null,
    itemsPerYear: Object.fromEntries(yearGroups.map((group) => [String(group.year), group.items.length])),
    contextCounts: countTimelineField(items, "contexts"),
    sourceDomainCounts: countTimelineField(items, "sourceDomain"),
    ordering: {
      primary: "date DESC",
      tieBreaker: "pageUrl ASC"
    }
  };
}

module.exports = {
  INTERNAL_TIMELINE_FIELDS,
  normalizeAuthoritativeDate,
  projectCanonicalTimelineItem,
  compareTimelineItems,
  sortTimelineItems,
  groupTimelineItemsByYear,
  collectDuplicateFieldValues,
  buildTimelineProjection
};

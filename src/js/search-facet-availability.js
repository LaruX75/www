(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.SearchFacetAvailability = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function toCount(value) {
    const count = Number(value || 0);
    return Number.isFinite(count) ? count : 0;
  }

  function countFor(map, key) {
    if (!map || typeof map !== "object") return 0;
    return toCount(map[key]);
  }

  function filterValuesForRecord(record, filterName) {
    const values = record?.filters?.[filterName];
    if (!Array.isArray(values)) return [];
    return values
      .map((value) => String(value || "").trim())
      .filter(Boolean);
  }

  function recordMatchesActiveValues(record, activeValues = {}, omitFilter = "") {
    for (const [filterName, targetValue] of Object.entries(activeValues || {})) {
      const expected = String(targetValue || "").trim();
      if (!expected || filterName === omitFilter) continue;
      if (!filterValuesForRecord(record, filterName).includes(expected)) {
        return false;
      }
    }
    return true;
  }

  function collectFilterCounts({
    records = [],
    targetFilter = "",
    activeValues = {},
    omitFilter = ""
  } = {}) {
    const counts = {};
    for (const record of records || []) {
      if (!recordMatchesActiveValues(record, activeValues, omitFilter)) continue;
      for (const value of filterValuesForRecord(record, targetFilter)) {
        counts[value] = countFor(counts, value) + 1;
      }
    }
    return counts;
  }

  function buildOrderedValues({
    knownValues = [],
    activeValue = "",
    currentCounts = {},
    replacementCounts = {}
  } = {}) {
    const ordered = [];
    const seen = new Set();
    const pushValue = (value) => {
      const label = String(value || "").trim();
      if (!label || seen.has(label)) return;
      seen.add(label);
      ordered.push(label);
    };
    for (const value of knownValues || []) pushValue(value);
    for (const key of Object.keys(currentCounts || {})) pushValue(key);
    for (const key of Object.keys(replacementCounts || {})) pushValue(key);
    const active = String(activeValue || "").trim();
    if (active && !seen.has(active)) {
      ordered.unshift(active);
    }
    return ordered;
  }

  function buildSearchFilters({ pinnedFilters = {}, activeDomain = "", activeValues = {} } = {}) {
    const filters = {};
    for (const [name, value] of Object.entries(pinnedFilters || {})) {
      if (Array.isArray(value)) filters[name] = value.slice();
      else if (value != null && value !== "") filters[name] = [value];
    }
    if (activeDomain) {
      filters["Sisältö"] = [activeDomain];
    }
    for (const [name, value] of Object.entries(activeValues || {})) {
      if (!value) continue;
      filters[name] = [value];
    }
    return filters;
  }

  function buildPresenterOptions({
    values = [],
    activeValue = "",
    currentCounts = {},
    replacementCounts = {}
  } = {}) {
    const active = String(activeValue || "").trim();
    return values
      .map((value) => {
        const label = String(value || "").trim();
        if (!label) return null;
        const count = label === active
          ? countFor(currentCounts, label)
          : countFor(active ? replacementCounts : currentCounts, label);
        const isActive = label === active;
        if (!isActive && count <= 0) return null;
        return {
          value: label,
          count,
          active: isActive
        };
      })
      .filter(Boolean);
  }

  return {
    buildOrderedValues,
    buildPresenterOptions,
    buildSearchFilters,
    collectFilterCounts,
    countFor
  };
});

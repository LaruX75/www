function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function snippet(value, maxLength = 260) {
  const normalized = pickString(value).replace(/\s+/g, " ");
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function countValues(items, getter) {
  const counts = new Map();
  toArray(items).forEach((item) => {
    toArray(getter(item)).forEach((value) => {
      const key = pickString(value);
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return [...counts.entries()];
}

function sortTopics(entries) {
  return [...entries].sort((left, right) => {
    const countDiff = right[1] - left[1];
    if (countDiff !== 0) return countDiff;
    return left[0].localeCompare(right[0], "fi");
  });
}

function includesContext(item = {}, context) {
  return toArray(item.contexts).includes(context);
}

function thesisRoleLabel(role, lang = "fi") {
  if (role === "reviewed") return lang === "en" ? "Reviewed thesis" : "Tarkastettu opinnäyte";
  return lang === "en" ? "Supervised thesis" : "Ohjattu opinnäyte";
}

function thesisTypeRoleFilterOptions(lang = "fi") {
  const locale = String(lang || "fi").toLowerCase() === "en" ? "en" : "fi";
  if (locale === "en") {
    return [
      { value: "masterThesis::advised", thesisType: "masterThesis", thesisRole: "advised", label: "Master's · advised" },
      { value: "masterThesis::reviewed", thesisType: "masterThesis", thesisRole: "reviewed", label: "Master's · reviewed" },
      { value: "bachelorThesis::advised", thesisType: "bachelorThesis", thesisRole: "advised", label: "Bachelor's · advised" }
    ];
  }

  return [
    { value: "masterThesis::advised", thesisType: "masterThesis", thesisRole: "advised", label: "Gradu · ohjattu" },
    { value: "masterThesis::reviewed", thesisType: "masterThesis", thesisRole: "reviewed", label: "Gradu · tarkastettu" },
    { value: "bachelorThesis::advised", thesisType: "bachelorThesis", thesisRole: "advised", label: "Kandi · ohjattu" }
  ];
}

function buildThesesFindExplorePageModel(thesisDetailsModel = {}) {
  const items = toArray(thesisDetailsModel.items);
  const advisedItems = items.filter((item) => item.thesisRole !== "reviewed");
  const reviewedItems = items.filter((item) => item.thesisRole === "reviewed");
  const masterItems = items.filter((item) => item.thesisType === "masterThesis");
  const bachelorItems = items.filter((item) => item.thesisType === "bachelorThesis");
  const advisedMasterItems = advisedItems.filter((item) => item.thesisType === "masterThesis");
  const advisedBachelorItems = advisedItems.filter((item) => item.thesisType === "bachelorThesis");
  const years = [...new Set(items.map((item) => item.year).filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  const topicOptions = sortTopics(countValues(items, (item) => item.categories || []))
    .map(([value, count]) => ({ value, label: value, count }));

  return {
    count: items.length,
    items,
    advisedItems,
    reviewedItems,
    masterItems,
    bachelorItems,
    advisedMasterItems,
    advisedBachelorItems,
    years,
    topicOptions,
    topicHighlights: topicOptions.slice(0, 8),
    typeRoleOptionsFi: thesisTypeRoleFilterOptions("fi"),
    typeRoleOptionsEn: thesisTypeRoleFilterOptions("en"),
    langCounts: Object.fromEntries(countValues(items, (item) => [item.lang])),
    roleCounts: Object.fromEntries(countValues(items, (item) => [item.thesisRole])),
    typeCounts: Object.fromEntries(countValues(items, (item) => [item.thesisType]))
  };
}

// THESIS-HUB-02: scoped Find & Explore model.
//
// Each subarchive (/opinnaytteet/gradut/, /kandit/, /tarkastetut/ + EN
// counterparts) hosts its own Find & Explore instance that must only
// search within that group. This factory builds the per-scope model from
// the canonical `thesisDetails` items already filtered down to the group.
//
// `scope` is the ONLY narrowing filter — type/role are enforced separately
// via the pinned filters on the FE mount data attributes so the browser
// search cannot leak across groups even if state.type/state.role are ever
// re-introduced. The returned `pinnedType` / `pinnedRole` are what the
// template writes into `data-find-explore-pinned-{type,role}`.
function buildScopedFindExploreModel(items = [], scopeConfig = {}) {
  const scopedItems = toArray(items);
  const years = [...new Set(scopedItems.map((item) => item.year).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));
  const topicOptions = sortTopics(countValues(scopedItems, (item) => item.categories || []))
    .map(([value, count]) => ({ value, label: value, count }));

  return {
    count: scopedItems.length,
    items: scopedItems,
    years,
    topicOptions,
    topicHighlights: topicOptions.slice(0, 8),
    pinnedType: scopeConfig.pinnedType || "",
    pinnedRole: scopeConfig.pinnedRole || "",
    scopeKey: scopeConfig.scopeKey || ""
  };
}

function buildThesisFindExploreDocument(thesisDetail) {
  if (!thesisDetail?.pageUrl || !thesisDetail?.title) return null;

  const filters = [
    { name: "Sisältö", value: "Opinnäytteet" },
    { name: "FindExplore", value: "theses" },
    { name: "Theses scope", value: "fi" },
    { name: "Theses scope", value: "en" },
    { name: "Theses type", value: thesisDetail.thesisType || "unknown" },
    { name: "Theses role", value: thesisDetail.thesisRole || "advised" }
  ];

  if (thesisDetail.year) {
    filters.push({ name: "Theses year", value: String(thesisDetail.year) });
  }
  if (includesContext(thesisDetail, "research")) {
    filters.push({ name: "Research context", value: "research" });
  }
  filters.push({ name: "Theses language", value: thesisDetail.lang || "fi" });

  toArray(thesisDetail.categories).slice(0, 8).forEach((category) => {
    filters.push({ name: "Theses topic", value: category });
  });
  toArray(thesisDetail.authors).slice(0, 4).forEach((author) => {
    filters.push({ name: "Theses author", value: author });
  });

  const meta = {
    thesesType: thesisDetail.thesisType || "",
    thesesYear: thesisDetail.year || "",
    thesesLang: thesisDetail.lang || "fi",
    thesesAuthorLine: thesisDetail.authorLine || "",
    thesesRole: thesisDetail.thesisRole || "advised",
    thesesSourceUrl: thesisDetail.sourceUrl || "",
    thesesDescription: snippet(thesisDetail.abstract || "", 260)
  };

  return {
    filters,
    meta
  };
}

module.exports = {
  thesisRoleLabel,
  thesisTypeRoleFilterOptions,
  buildThesesFindExplorePageModel,
  buildScopedFindExploreModel,
  buildThesisFindExploreDocument
};

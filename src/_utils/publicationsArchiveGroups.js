"use strict";

const { PUBLICATION_GROUP_ORDER } = require("../_data/publicationsPage");
const { buildArchiveRow, normalizeLang } = require("./publicationArchiveRow");

const UNCLASSIFIED_KEY = "__unclassified__";
const UNCLASSIFIED_LABELS = {
  fi: "Muut julkaisut (luokittelematon)",
  en: "Other publications (unclassified)"
};

function groupKey(item = {}) {
  const raw = String(item.publicationGroup || item.group || "").trim().toUpperCase();
  return PUBLICATION_GROUP_ORDER.includes(raw) ? raw : UNCLASSIFIED_KEY;
}

function groupLabel(key, lang) {
  return key === UNCLASSIFIED_KEY ? UNCLASSIFIED_LABELS[lang] : "";
}

function buildPublicationsArchiveGroups(items = [], options = {}) {
  const lang = normalizeLang(options.lang);
  const buckets = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const row = buildArchiveRow(item, lang);
    if (!row.pageUrl || !row.title) return;
    const key = groupKey(item);
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        label: key === UNCLASSIFIED_KEY ? groupLabel(key, lang) : row.groupLabel,
        rows: []
      });
    }
    buckets.get(key).rows.push(row);
  });

  const orderedKeys = PUBLICATION_GROUP_ORDER.filter((key) => buckets.has(key));
  if (buckets.has(UNCLASSIFIED_KEY)) orderedKeys.push(UNCLASSIFIED_KEY);

  const groups = orderedKeys.map((key) => {
    const entry = buckets.get(key);
    return {
      key,
      label: entry.label,
      count: entry.rows.length,
      rows: entry.rows
    };
  });

  return {
    count: groups.reduce((sum, group) => sum + group.count, 0),
    groupCount: groups.length,
    groups
  };
}

module.exports = {
  PUBLICATION_GROUP_ORDER,
  UNCLASSIFIED_KEY,
  buildPublicationsArchiveGroups
};

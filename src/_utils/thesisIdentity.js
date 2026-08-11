function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function extractStableThesisId(link) {
  const normalized = pickString(link).split("#")[0].split("?")[0];
  const match = normalized.match(/\/(\d+)\/?$/);
  return match ? match[1] : null;
}

function thesisPageUrl(link) {
  const stableId = extractStableThesisId(link);
  return stableId ? `/opinnaytteet/${stableId}/` : null;
}

module.exports = {
  extractStableThesisId,
  thesisPageUrl
};

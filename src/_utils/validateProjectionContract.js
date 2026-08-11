const VALID_LANG_CODES = Object.freeze(["fi", "en"]);

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function pickString(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function getIdentity(item, identityKey) {
  if (!item || !identityKey) return "";
  if (typeof identityKey === "function") {
    return pickString(identityKey(item));
  }
  return pickString(item[identityKey]);
}

function collectDuplicateIds(items = [], identityKey = "id") {
  const seen = new Set();
  const duplicates = new Set();

  toArray(items).forEach((item) => {
    const id = getIdentity(item, identityKey);
    if (!id) return;
    if (seen.has(id)) {
      duplicates.add(id);
      return;
    }
    seen.add(id);
  });

  return [...duplicates].sort();
}

function collectAllowlistViolations(items = [], publicFields = []) {
  if (!publicFields.length) return [];
  const allowed = new Set(publicFields);
  const violations = [];

  toArray(items).forEach((item) => {
    Object.keys(item || {}).forEach((key) => {
      if (!allowed.has(key)) {
        violations.push({
          id: pickString(item?.id),
          field: key
        });
      }
    });
  });

  return violations.sort((left, right) => {
    const idDiff = String(left.id || "").localeCompare(String(right.id || ""));
    if (idDiff !== 0) return idDiff;
    return String(left.field || "").localeCompare(String(right.field || ""));
  });
}

function collectMissingRequiredFields(items = [], requiredFields = [], identityKey = "id") {
  const missing = [];

  toArray(items).forEach((item) => {
    requiredFields.forEach((field) => {
      if (!hasValue(item?.[field])) {
        missing.push({
          id: getIdentity(item, identityKey),
          field
        });
      }
    });
  });

  return missing;
}

function collectInvalidLangs(items = [], identityKey = "id") {
  const allowed = new Set(VALID_LANG_CODES);

  return toArray(items)
    .filter((item) => hasValue(item?.lang) && !allowed.has(pickString(item.lang)))
    .map((item) => ({
      id: getIdentity(item, identityKey),
      lang: item.lang
    }));
}

function collectInvalidLocalPageUrls(items = [], identityKey = "id") {
  return toArray(items)
    .filter((item) => hasValue(item?.pageUrl) && !pickString(item.pageUrl).startsWith("/"))
    .map((item) => ({
      id: getIdentity(item, identityKey),
      pageUrl: item.pageUrl
    }));
}

function collectParityDiffs(canonicalItems = [], projectedItems = [], identityKey = "id") {
  const canonicalIds = new Set(
    toArray(canonicalItems)
      .map((item) => getIdentity(item, identityKey))
      .filter(Boolean)
  );
  const projectedIds = new Set(
    toArray(projectedItems)
      .map((item) => getIdentity(item, identityKey))
      .filter(Boolean)
  );

  return {
    missingFromProjection: [...canonicalIds].filter((id) => !projectedIds.has(id)).sort(),
    unexpectedInProjection: [...projectedIds].filter((id) => !canonicalIds.has(id)).sort()
  };
}

function validateProjection({
  name = "projection",
  canonicalItems = null,
  projectedItems = [],
  publicFields = [],
  requiredFields = [],
  identityKey = "id",
  count = null
} = {}) {
  const items = toArray(projectedItems);
  const duplicateIds = collectDuplicateIds(items, identityKey);
  const allowlistViolations = collectAllowlistViolations(items, publicFields);
  const missingRequiredFields = collectMissingRequiredFields(items, requiredFields, identityKey);
  const invalidLangs = collectInvalidLangs(items, identityKey);
  const invalidLocalPageUrls = collectInvalidLocalPageUrls(items, identityKey);
  const countMismatch = Number.isFinite(count) ? count !== items.length : false;
  const parity = Array.isArray(canonicalItems)
    ? collectParityDiffs(canonicalItems, items, identityKey)
    : { missingFromProjection: [], unexpectedInProjection: [] };

  const ok = !countMismatch
    && duplicateIds.length === 0
    && allowlistViolations.length === 0
    && missingRequiredFields.length === 0
    && invalidLangs.length === 0
    && invalidLocalPageUrls.length === 0
    && parity.missingFromProjection.length === 0
    && parity.unexpectedInProjection.length === 0;

  return {
    ok,
    name,
    summary: {
      count: Number.isFinite(count) ? count : null,
      itemsLength: items.length,
      duplicateIdCount: duplicateIds.length,
      allowlistViolationCount: allowlistViolations.length,
      missingRequiredFieldCount: missingRequiredFields.length,
      invalidLangCount: invalidLangs.length,
      invalidLocalPageUrlCount: invalidLocalPageUrls.length,
      missingFromProjectionCount: parity.missingFromProjection.length,
      unexpectedInProjectionCount: parity.unexpectedInProjection.length
    },
    errors: {
      countMismatch,
      duplicateIds,
      allowlistViolations,
      missingRequiredFields,
      invalidLangs,
      invalidLocalPageUrls,
      missingFromProjection: parity.missingFromProjection,
      unexpectedInProjection: parity.unexpectedInProjection
    }
  };
}

module.exports = {
  VALID_LANG_CODES,
  collectDuplicateIds,
  collectAllowlistViolations,
  collectMissingRequiredFields,
  collectInvalidLangs,
  collectInvalidLocalPageUrls,
  collectParityDiffs,
  validateProjection
};

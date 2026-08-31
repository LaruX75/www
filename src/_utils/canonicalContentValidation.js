const path = require("path");
const contentSchema = require("../_data/contentSchema");
const { resolveContexts } = require("../_data/contentContext");

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

function isMissing(value) {
  if (value === null || typeof value === "undefined") return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function isValidHttpUrl(value) {
  try {
    const parsed = new URL(String(value || ""));
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (_) {
    return false;
  }
}

function isValidIsoDate(value) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const parsed = new Date(`${raw}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === raw;
}

function getCollectionRule(collectionName) {
  return contentSchema.collectionRules[collectionName] || null;
}

function getResolvedFieldValue(data, field, filePath, useResolvedContexts) {
  if (field === "contexts" && useResolvedContexts) {
    return resolveContexts(data, filePath);
  }

  return data[field];
}

function validateControlledValue({ field, value, vocabularyName, file }) {
  const allowed = contentSchema.vocabularies[vocabularyName] || [];
  const values = Array.isArray(value) ? value : [value];
  const errors = [];

  values.filter((item) => !isMissing(item)).forEach((item) => {
    if (!allowed.includes(item)) {
      errors.push({
        file,
        field,
        message: `tuntematon arvo "${item}", sallitut: ${allowed.join(", ")}`
      });
    }
  });

  return errors;
}

function validateStrictPresentationSemantics(data, relativeFile) {
  const errors = [];
  const sourceUrl = String(data.sourceUrl || data.url || "").trim();
  const permalink = String(data.permalink || "").trim();
  const source = String(data.source || "").trim().toLowerCase();

  if (data.date && !isValidIsoDate(data.date)) {
    errors.push({
      file: relativeFile,
      field: "date",
      message: "päivämäärän on oltava muodossa YYYY-MM-DD"
    });
  }

  if (sourceUrl && !isValidHttpUrl(sourceUrl)) {
    errors.push({
      file: relativeFile,
      field: "sourceUrl",
      message: "sourceUrlin on oltava absoluuttinen http(s)-URL"
    });
  }

  if (source === "youtube" && sourceUrl && !/(youtube\.com|youtu\.be)/i.test(sourceUrl)) {
    errors.push({
      file: relativeFile,
      field: "sourceUrl",
      message: "YouTube-esityksen sourceUrlin on osoitettava youtube.com- tai youtu.be-osoitteeseen"
    });
  }

  if (permalink && (!permalink.startsWith("/presentations/") || !permalink.endsWith("/"))) {
    errors.push({
      file: relativeFile,
      field: "permalink",
      message: "esityksen permalinkin on oltava muotoa /presentations/<slug>/"
    });
  }

  if (!Array.isArray(data.contexts) || data.contexts.length === 0) {
    errors.push({
      file: relativeFile,
      field: "contexts",
      message: "kontekstia ei saa arvata; anna vähintään yksi eksplisiittinen contexts-arvo"
    });
  }

  if (sourceUrl && /^\/(?!\/)/.test(sourceUrl)) {
    errors.push({
      file: relativeFile,
      field: "sourceUrl",
      message: "sourceUrl ei voi olla paikallinen sivupolku"
    });
  }

  return errors;
}

function validateCollectionItem({
  collectionName,
  data,
  filePath = "",
  rootDir = process.cwd(),
  useResolvedContexts = true,
  strictSemanticChecks = false
}) {
  const rule = getCollectionRule(collectionName);
  if (!rule) {
    throw new Error(`Unknown collection rule: ${collectionName}`);
  }

  const relativeFile = path.relative(rootDir, filePath || `${collectionName}.md`) || `${collectionName}.md`;
  const errors = [];
  const warnings = [];

  rule.required.forEach((field) => {
    if (isMissing(data[field])) {
      errors.push({ file: relativeFile, field, message: "pakollinen kentta puuttuu" });
    }
  });

  (rule.recommended || []).forEach((field) => {
    const value = getResolvedFieldValue(data, field, filePath, useResolvedContexts);
    if (isMissing(value)) {
      warnings.push({ file: relativeFile, field, message: "suositeltu kentta puuttuu" });
    }
  });

  (rule.arrayFields || []).forEach((field) => {
    if (!isMissing(data[field]) && !Array.isArray(data[field])) {
      warnings.push({ file: relativeFile, field, message: "kentta kannattaa kirjoittaa listana" });
    }
  });

  Object.entries(rule.controlled || {}).forEach(([field, vocabularyName]) => {
    const value = getResolvedFieldValue(data, field, filePath, useResolvedContexts);
    if (isMissing(value)) return;
    errors.push(...validateControlledValue({
      field,
      value,
      vocabularyName,
      file: relativeFile
    }));
  });

  const typeRecommendations = rule.typeRecommendations?.[data.type] || [];
  typeRecommendations.forEach((field) => {
    if (isMissing(data[field])) {
      warnings.push({
        file: relativeFile,
        field,
        message: `suositeltu kentta tyypille "${data.type}" puuttuu`
      });
    }
  });

  if (data.type === "mielipide") {
    const roles = new Set([...toArray(data.opinionRoles), ...toArray(data.writingRoles)]);
    if (!roles.has("political") && !roles.has("expert") && !roles.has("personal")) {
      warnings.push({
        file: relativeFile,
        field: "opinionRoles",
        message: "mielipiteelta puuttuu rooliluokitus"
      });
    }
  }

  if (data.mediaType === "video" && isMissing(data.youtubeId) && isMissing(data.sourceUrl)) {
    warnings.push({
      file: relativeFile,
      field: "youtubeId",
      message: "videolle kannattaa lisata youtubeId tai sourceUrl"
    });
  }

  if (strictSemanticChecks && collectionName === "presentations") {
    errors.push(...validateStrictPresentationSemantics(data, relativeFile));
  }

  return { errors, warnings };
}

module.exports = {
  contentSchema,
  getCollectionRule,
  isMissing,
  isValidHttpUrl,
  isValidIsoDate,
  toArray,
  validateCollectionItem
};

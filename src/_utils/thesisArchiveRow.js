/**
 * thesisArchiveRow — display projection for the archive table row.
 *
 * Small presentation helper introduced by the theses archive
 * convergence workstream. Turns a canonical thesis / thesisDetail
 * shape into a display-safe row projection consumed by both the
 * SSR archive template (Nunjucks) and the browser Pagefind result
 * renderer (find-explore.js). Both callers emit the SAME <tr>
 * shape by consuming the SAME projection contract.
 *
 * NOT a canonical taxonomy. NOT persistent storage. NOT a citation
 * composer. Callers may only rely on the fields returned here as
 * display values. Canonical truth remains in canonical thesis data.
 *
 *   Input:  canonical thesis (raw or detail) or a Pagefind meta
 *           projection { title, thesesAuthorLine, thesesType,
 *           thesesRole, thesesYear, thesesSourceUrl } + url.
 *   Output: {
 *     year,
 *     authorLine,
 *     title,
 *     thesisType,          // canonical value passed through
 *     thesisRole,          // canonical value passed through
 *     typeRoleLabel,       // localized presentation label
 *     pageUrl,             // local canonical thesis detail page
 *     sourceUrl            // external OuluREPO source, never inferred
 *   }
 *
 * pageUrl and sourceUrl are hard semantic contracts. Never derive
 * one from the other. If either is unavailable the projection
 * simply returns an empty string for that field; callers must
 * gate their UI on presence.
 */

"use strict";

const TYPE_ROLE_LABELS = {
  fi: {
    masterThesis: {
      advised: "Gradu · ohjattu",
      reviewed: "Gradu · tarkastettu"
    },
    bachelorThesis: {
      advised: "Kandi · ohjattu",
      reviewed: "Kandi · tarkastettu"
    }
  },
  en: {
    masterThesis: {
      advised: "Master's · advised",
      reviewed: "Master's · reviewed"
    },
    bachelorThesis: {
      advised: "Bachelor's · advised",
      reviewed: "Bachelor's · reviewed"
    }
  }
};

const TYPE_ONLY_LABELS = {
  fi: {
    masterThesis: "Gradu",
    bachelorThesis: "Kandi",
    doctoralThesis: "Väitöskirja",
    licentiateThesis: "Lisensiaatintutkielma"
  },
  en: {
    masterThesis: "Master's thesis",
    bachelorThesis: "Bachelor's thesis",
    doctoralThesis: "Doctoral dissertation",
    licentiateThesis: "Licentiate thesis"
  }
};

const ROLE_ONLY_LABELS = {
  fi: { advised: "ohjattu", reviewed: "tarkastettu" },
  en: { advised: "advised", reviewed: "reviewed" }
};

function normalizeLang(value) {
  const s = String(value || "").toLowerCase();
  return s === "en" ? "en" : "fi";
}

function pickString(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function buildAuthorLine(value) {
  if (Array.isArray(value)) {
    return value.map(pickString).filter(Boolean).join("; ");
  }
  return pickString(value);
}

function buildTypeRoleLabel(thesisType, thesisRole, lang) {
  const locale = normalizeLang(lang);
  const type = pickString(thesisType);
  const role = pickString(thesisRole);
  const byType = TYPE_ROLE_LABELS[locale][type];
  if (byType && byType[role]) return byType[role];
  const typeFallback = TYPE_ONLY_LABELS[locale][type] || "";
  const roleFallback = ROLE_ONLY_LABELS[locale][role] || "";
  if (typeFallback && roleFallback) return typeFallback + " · " + roleFallback;
  if (typeFallback) return typeFallback;
  if (roleFallback) return locale === "en" ? "Thesis · " + roleFallback : "Opinnäyte · " + roleFallback;
  return locale === "en" ? "Thesis" : "Opinnäyte";
}

/**
 * Build the archive row projection from a canonical thesis or
 * thesisDetail record.
 */
function buildArchiveRow(thesis, lang) {
  const locale = normalizeLang(lang);
  if (!thesis || typeof thesis !== "object") {
    return emptyRow(locale);
  }
  const authors = thesis.authors !== undefined
    ? thesis.authors
    : thesis.authorLine !== undefined
      ? thesis.authorLine
      : "";
  const authorLine = buildAuthorLine(authors);
  const title = pickString(thesis.title);
  const year = pickString(thesis.year);
  const thesisType = pickString(thesis.thesisType || thesis.type);
  const thesisRole = pickString(thesis.thesisRole);
  const pageUrl = pickString(thesis.pageUrl);
  // Never derive sourceUrl from pageUrl. sourceUrl must come from
  // the canonical source contract (thesis.sourceUrl or the raw
  // OuluREPO link).
  const sourceUrl = pickString(thesis.sourceUrl || thesis.link);
  return {
    year,
    authorLine,
    title,
    thesisType,
    thesisRole,
    typeRoleLabel: buildTypeRoleLabel(thesisType, thesisRole, locale),
    pageUrl,
    sourceUrl,
    lang: locale
  };
}

/**
 * Build the archive row projection from a Pagefind result meta
 * object + result URL. Explicit sourceUrl comes from the
 * `thesesSourceUrl` meta field (added by CONV-B). Missing meta
 * yields an empty-field row — callers must gate.
 */
function buildArchiveRowFromPagefind(meta, resultUrl, lang) {
  const locale = normalizeLang(lang);
  if (!meta || typeof meta !== "object") {
    return emptyRow(locale, resultUrl);
  }
  const thesisType = pickString(meta.thesesType);
  const thesisRole = pickString(meta.thesesRole);
  return {
    year: pickString(meta.thesesYear),
    authorLine: pickString(meta.thesesAuthorLine),
    title: pickString(meta.title),
    thesisType,
    thesisRole,
    typeRoleLabel: buildTypeRoleLabel(thesisType, thesisRole, locale),
    pageUrl: pickString(resultUrl),
    sourceUrl: pickString(meta.thesesSourceUrl),
    lang: locale
  };
}

function emptyRow(locale, pageUrl) {
  return {
    year: "",
    authorLine: "",
    title: "",
    thesisType: "",
    thesisRole: "",
    typeRoleLabel: locale === "en" ? "Thesis" : "Opinnäyte",
    pageUrl: pickString(pageUrl),
    sourceUrl: "",
    lang: locale
  };
}

module.exports = {
  buildArchiveRow,
  buildArchiveRowFromPagefind,
  buildTypeRoleLabel,
  normalizeLang
};

module.exports.TYPE_ROLE_LABELS = TYPE_ROLE_LABELS;
module.exports.TYPE_ONLY_LABELS = TYPE_ONLY_LABELS;
module.exports.ROLE_ONLY_LABELS = ROLE_ONLY_LABELS;

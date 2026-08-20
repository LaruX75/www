#!/usr/bin/env node

const { buildElectionHistoryData } = require("../src/_utils/electionHistory");

const EXPECTED_ROUTES = Object.freeze({
  fi: "/politiikka/vaalikaudet/",
  en: "/en/election-history/",
  legacyFi: "/vaalihistoria/"
});

const EXPECTED_TERM_IDS = Object.freeze([
  "2025-2029",
  "2021-2025",
  "2017-2021",
  "2013-2017"
]);

const BASELINE_TOTALS = Object.freeze({
  speeches: 83,
  initiatives: 10,
  opinions: 49,
  otherPoliticalItems: 34,
  councilMeetings: 53
});

function collectMissingLocalizedFields(data) {
  const missing = [];

  for (const term of data.terms) {
    ["fi", "en"].forEach((lang) => {
      const localized = term.localized?.[lang];
      if (!localized?.period) missing.push(`term:${term.id}:localized.${lang}.period`);
      if (!localized?.title) missing.push(`term:${term.id}:localized.${lang}.title`);
      if (!localized?.summary) missing.push(`term:${term.id}:localized.${lang}.summary`);

      (localized?.results || []).forEach((entry, index) => {
        if (!entry?.label) missing.push(`term:${term.id}:localized.${lang}.results[${index}].label`);
        if (!entry?.detail) missing.push(`term:${term.id}:localized.${lang}.results[${index}].detail`);
        if (!entry?.result) missing.push(`term:${term.id}:localized.${lang}.results[${index}].result`);
      });

      (localized?.roles || []).forEach((entry, index) => {
        if (!entry) missing.push(`term:${term.id}:localized.${lang}.roles[${index}]`);
      });

      (localized?.archives || []).forEach((entry, index) => {
        if (!entry?.href) missing.push(`term:${term.id}:localized.${lang}.archives[${index}].href`);
        if (!entry?.label) missing.push(`term:${term.id}:localized.${lang}.archives[${index}].label`);
      });
    });
  }

  (data.otherCivicRoles?.fi || []).forEach((entry, index) => {
    if (!entry) missing.push(`otherCivicRoles.fi[${index}]`);
  });
  (data.otherCivicRoles?.en || []).forEach((entry, index) => {
    if (!entry) missing.push(`otherCivicRoles.en[${index}]`);
  });

  return missing;
}

function main() {
  const data = buildElectionHistoryData();
  const localizedFiTermIds = data.terms
    .filter((term) => term.localized?.fi?.period && term.localized?.fi?.title && term.localized?.fi?.summary)
    .map((term) => term.id);
  const localizedEnTermIds = data.terms
    .filter((term) => term.localized?.en?.period && term.localized?.en?.title && term.localized?.en?.summary)
    .map((term) => term.id);
  const unresolvedOrphanFields = collectMissingLocalizedFields(data);

  const countsByTerm = Object.fromEntries(
    data.terms.map((term) => [
      term.id,
      {
        speeches: term.counts.speeches,
        initiatives: term.counts.initiatives,
        opinions: term.counts.opinions,
        otherPoliticalItems: term.counts.otherPoliticalItems,
        councilMeetings: term.counts.councilMeetings,
        results: term.counts.results,
        roles: term.counts.roles,
        archives: term.counts.archives
      }
    ])
  );

  const baselineComparison = Object.fromEntries(
    Object.keys(BASELINE_TOTALS).map((key) => [
      key,
      {
        expected: BASELINE_TOTALS[key],
        actual: data.familyTotals[key],
        matches: BASELINE_TOTALS[key] === data.familyTotals[key]
      }
    ])
  );

  const invariants = [
    {
      key: "routeParity",
      ok: JSON.stringify(data.routeParity) === JSON.stringify(EXPECTED_ROUTES),
      detail: data.routeParity
    },
    {
      key: "termIdsOrder",
      ok: JSON.stringify(data.termIds) === JSON.stringify(EXPECTED_TERM_IDS),
      detail: data.termIds
    },
    {
      key: "localizedFiTermIds",
      ok: JSON.stringify(localizedFiTermIds) === JSON.stringify(EXPECTED_TERM_IDS),
      detail: localizedFiTermIds
    },
    {
      key: "localizedEnTermIds",
      ok: JSON.stringify(localizedEnTermIds) === JSON.stringify(EXPECTED_TERM_IDS),
      detail: localizedEnTermIds
    },
    {
      key: "baselineTotals",
      ok: Object.values(baselineComparison).every((entry) => entry.matches),
      detail: baselineComparison
    },
    {
      key: "duplicateCanonicalIds",
      ok: data.canonicalCorpus.duplicateIds.length === 0,
      detail: data.canonicalCorpus.duplicateIds
    },
    {
      key: "duplicateCanonicalPageUrls",
      ok: data.canonicalCorpus.duplicatePageUrls.length === 0,
      detail: data.canonicalCorpus.duplicatePageUrls
    },
    {
      key: "localizedCompanionFields",
      ok: unresolvedOrphanFields.length === 0,
      detail: unresolvedOrphanFields
    }
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    routeParity: data.routeParity,
    termCount: data.termCount,
    fiTermCount: localizedFiTermIds.length,
    enTermCount: localizedEnTermIds.length,
    termIds: data.termIds,
    termOrderMatchesBetweenFiAndEn: JSON.stringify(localizedFiTermIds) === JSON.stringify(localizedEnTermIds),
    familyTotals: data.familyTotals,
    countsByTerm,
    companionTotals: {
      results: data.terms.reduce((sum, term) => sum + term.counts.results, 0),
      roles: data.terms.reduce((sum, term) => sum + term.counts.roles, 0),
      archives: data.terms.reduce((sum, term) => sum + term.counts.archives, 0),
      otherCivicRoles: data.otherCivicRoles.en.length
    },
    canonicalCorpus: data.canonicalCorpus,
    duplicateCanonicalIds: data.canonicalCorpus.duplicateIds,
    duplicateCanonicalPageUrls: data.canonicalCorpus.duplicatePageUrls,
    pagination: {
      pageSize: data.pagination.pageSize,
      enabled: data.pagination.enabled,
      timelinePagefindRequests: 0,
      runtimeJsonRequests: 0
    },
    baselineComparison,
    unresolvedOrphanFields,
    invariants,
    ok: invariants.every((invariant) => invariant.ok)
  };

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main();

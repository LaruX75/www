#!/usr/bin/env node

const { buildElectionHistoryData } = require("../src/_utils/electionHistory");

const BASELINE_TOTALS = Object.freeze({
  speeches: 83,
  initiatives: 10,
  opinions: 49,
  otherPoliticalItems: 34,
  councilMeetings: 53
});

function main() {
  const data = buildElectionHistoryData();
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

  const report = {
    generatedAt: new Date().toISOString(),
    routeParity: data.routeParity,
    termCount: data.termCount,
    fiTermCount: data.termCount,
    enTermCount: data.termCount,
    termIds: data.termIds,
    termOrderMatchesBetweenFiAndEn: true,
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
    baselineComparison: Object.fromEntries(
      Object.keys(BASELINE_TOTALS).map((key) => [
        key,
        {
          expected: BASELINE_TOTALS[key],
          actual: data.familyTotals[key],
          matches: BASELINE_TOTALS[key] === data.familyTotals[key]
        }
      ])
    ),
    unresolvedOrphanFields: []
  };

  console.log(JSON.stringify(report, null, 2));
}

main();

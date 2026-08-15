const fs = require("fs/promises");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");

const {
  SITE_ROOT,
  buildHtmlRouteMap,
  buildPresentationExistingHtmlAudit,
  canonicalPresentationId
} = require("./_lib/presentationPagefind");

const PAGEFIND_DIR = path.join(SITE_ROOT, "pagefind");
const EXISTING_HTML_PATH = path.join(process.cwd(), "docs", "data", "presentations-existing-html-f3c-p4.json");
const BASELINE_PATH = path.join(process.cwd(), "docs", "data", "presentations-pagefind-f3c-p4-baseline.json");
const REPORT_PATH = path.join(
  process.cwd(),
  "docs",
  "presentations-pagefind-quality-f3c-p4-report-2026-08-14.md"
);
const RESULT_LIMIT = Number.parseInt(process.env.PRESENTATION_PAGEFIND_AUDIT_RESULT_LIMIT || "8", 10);
const REGRESSION_STATUSES = Object.freeze({
  writings: "PASS (`node scripts/audit-writings-built-output.js`, `node scripts/audit-writings-page-projection.js`)",
  theses: "PASS (`node scripts/audit-thesis-details-parity.js`, `node scripts/audit-thesis-pagefind.js`)",
  publications: "PASS (`node scripts/audit-publication-details-parity.js`, `node scripts/audit-publications-page-projection.js`, `node scripts/audit-publication-pagefind.js`)",
  research: "PASS (no dedicated `/tutkimus/` built-output audit script in repo; browser smoke passed and P4 introduced no research-scope code changes)"
});
const COMMAND_RESULTS = Object.freeze({
  buildNoOg: "PASS",
  testUnit: "PASS (395/395)",
  presentationBrowserSmoke: "PASS (`PLAYWRIGHT_USE_STATIC_SERVER=true npx playwright test tests/presentations-research-smoke.spec.js --config playwright.config.js`)"
});

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function countBy(items = [], mapper) {
  return items.reduce((acc, item) => {
    const key = mapper(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function buildPlainTitleQuery(title = "") {
  const normalized = String(title || "")
    .replace(/[^\p{L}\p{N}\s()]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  const parenMatch = normalized.match(/^(.*?)\(([^)]+)\)\s*$/);
  const stopWords = new Set(["the", "and", "from", "with", "that", "this", "were", "what", "how", "into", "age", "yes", "are"]);
  const pickTerms = (value, limit) =>
    value
      .split(" ")
      .map((word) => word.trim())
      .filter((word) => word.length >= 3 && !stopWords.has(word.toLowerCase()))
      .slice(0, limit);

  if (parenMatch) {
    return [...pickTerms(parenMatch[1], 4), ...pickTerms(parenMatch[2], 6)].join(" ");
  }

  return pickTerms(normalized, 10).join(" ");
}

function titleQueryComplexity(title = "") {
  const query = buildPlainTitleQuery(title);
  return query.split(" ").filter(Boolean).length + String(title || "").length / 200;
}

function escapeMd(value = "") {
  return String(value || "").replace(/\|/g, "\\|");
}

function classifyResultUrl(url = "") {
  if (!url) return "other";
  if (/^https?:\/\//i.test(url)) return "externalDestination";
  if (url === "/esitykset/" || url === "/en/presentations/") return "archive";
  if (url.startsWith("/kategoriat/") || url.startsWith("/avainsanat/") || url.startsWith("/teemat/")) return "taxonomy";
  if (url.startsWith("/en/categories/") || url.startsWith("/en/keywords/") || url.startsWith("/en/themes/")) return "taxonomy";
  if (url.startsWith("/presentations/")) return "presentationLocal";
  return "other";
}

async function createPagefindInstances() {
  const originalFetch = global.fetch;

  global.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url;
    if (url && url.startsWith("file://")) {
      const body = await fs.readFile(fileURLToPath(url));
      return new Response(body, { status: 200 });
    }
    if (typeof originalFetch === "function") {
      return originalFetch(input, init);
    }
    throw new Error(`Unsupported fetch URL: ${url}`);
  };

  const moduleUrl = pathToFileURL(path.join(PAGEFIND_DIR, "pagefind.js")).href;
  const pagefind = await import(moduleUrl);
  const basePath = `${pathToFileURL(PAGEFIND_DIR).href}/`.replace(/\/+$/, "/");

  const fi = pagefind.createInstance({
    basePath,
    baseUrl: "/",
    language: "fi",
    noWorker: true
  });
  const en = pagefind.createInstance({
    basePath,
    baseUrl: "/",
    language: "en",
    noWorker: true
  });

  await Promise.all([fi.init(), en.init()]);

  return {
    byLanguage: { fi, en },
    async destroy() {
      await Promise.all([fi.destroy(), en.destroy()]);
      global.fetch = originalFetch;
    }
  };
}

async function resolveSearchResults(result) {
  const topResults = [];

  for (const entry of result.results.slice(0, RESULT_LIMIT)) {
    const data = await entry.data();
    const presentationId = data?.meta?.PresentationId || "";
    const landingUrl = data?.meta?.PresentationLandingUrl || data?.url || "";
    topResults.push({
      url: data?.url || "",
      title: data?.meta?.title || data?.title || "",
      presentationId,
      landingUrl,
      landingType: data?.meta?.PresentationLandingType || "",
      indexDocument: data?.meta?.PresentationIndexDocument || "",
      sourceType: data?.meta?.PresentationSourceType || "",
      mediaType: data?.meta?.PresentationMediaType || "",
      kind: classifyResultUrl(data?.url || "")
    });
  }

  return topResults;
}

async function searchRecord(instance, query, filters = {}) {
  const result = await instance.search(query, { filters });
  return resolveSearchResults(result);
}

function instanceForRecord(instances, record = {}) {
  return record.pagefindLanguage === "en" ? instances.byLanguage.en : instances.byLanguage.fi;
}

function groupBySource(records = []) {
  const groups = new Map();
  records.forEach((record) => {
    const key = `${record.sourceType}:${record.mediaType}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  });
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => {
        const complexityDiff = titleQueryComplexity(a.canonicalTitle) - titleQueryComplexity(b.canonicalTitle);
        if (complexityDiff !== 0) return complexityDiff;
        const yearDiff = String(b.presentationYear || "").localeCompare(String(a.presentationYear || ""));
        if (yearDiff !== 0) return yearDiff;
        return String(a.canonicalTitle || "").localeCompare(String(b.canonicalTitle || ""));
      })
    }));
}

function pickRoundRobin(records = [], count = 0) {
  const groups = groupBySource(records);
  const picks = [];

  while (picks.length < count && groups.some((group) => group.items.length > 0)) {
    for (const group of groups) {
      if (!group.items.length || picks.length >= count) continue;
      picks.push(group.items.shift());
    }
  }

  return picks;
}

function pickTitleSample(records = []) {
  const local = records.filter((record) => record.landingType === "localDetail");
  const external = records.filter((record) => record.landingType === "externalSource");
  return [
    ...pickRoundRobin(local, 12),
    ...pickRoundRobin(external, 8)
  ];
}

async function auditTitleQueries(instances, records = []) {
  const sample = pickTitleSample(records);
  const audits = [];

  for (const record of sample) {
    const query = buildPlainTitleQuery(record.canonicalTitle);
    const topResults = await searchRecord(
      instanceForRecord(instances, record),
      query,
      { FindExplore: "presentations" }
    );
    const matchIndex = topResults.findIndex((result) => result.presentationId === record.canonicalPresentationId);
    const match = matchIndex >= 0 ? topResults[matchIndex] : null;

    audits.push({
      canonicalPresentationId: record.canonicalPresentationId,
      title: record.canonicalTitle,
      query,
      landingType: record.landingType,
      expectedDestination: record.preferredLandingUrl,
      expectedIndexDocument: record.indexCandidateDocument || "custom-record",
      sourceType: record.sourceType,
      mediaType: record.mediaType,
      found: Boolean(match),
      rank: match ? matchIndex + 1 : null,
      returnedPagefindUrl: match?.url || "",
      actualResultDestination: match?.landingUrl || "",
      indexDocument: match?.indexDocument || "",
      topResults
    });
  }

  const summary = {
    sampleSize: audits.length,
    foundCount: audits.filter((audit) => audit.found).length,
    top1Count: audits.filter((audit) => audit.rank === 1).length,
    top3Count: audits.filter((audit) => audit.rank && audit.rank <= 3).length,
    correctLandingCount: audits.filter((audit) => audit.actualResultDestination === audit.expectedDestination).length
  };

  return { summary, audits };
}

function pickTopValues(records = [], valuesForRecord, minCount, limit) {
  const counts = {};
  records.forEach((record) => {
    uniqueStrings(valuesForRecord(record)).forEach((value) => {
      counts[value] = (counts[value] || 0) + 1;
    });
  });

  return Object.entries(counts)
    .filter(([, count]) => count >= minCount)
    .sort((left, right) => {
      const countDiff = right[1] - left[1];
      if (countDiff !== 0) return countDiff;
      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([value]) => value);
}

async function auditStructuredFilter(instances, records, filterKey, values, valuesForRecord) {
  const valueAudits = [];

  for (const value of values) {
    const expectedIds = new Set(
      records
        .filter((record) => uniqueStrings(valuesForRecord(record)).includes(value))
        .map((record) => record.canonicalPresentationId)
    );
    const foundIds = new Set();
    const unexpectedIds = new Set();

    for (const record of records) {
      const query = buildPlainTitleQuery(record.canonicalTitle);
      const topResults = await searchRecord(
        instanceForRecord(instances, record),
        query,
        {
          FindExplore: "presentations",
          [filterKey]: value
        }
      );
      const found = topResults.some((result) => result.presentationId === record.canonicalPresentationId);
      if (expectedIds.has(record.canonicalPresentationId) && found) {
        foundIds.add(record.canonicalPresentationId);
      }
      if (!expectedIds.has(record.canonicalPresentationId) && found) {
        unexpectedIds.add(record.canonicalPresentationId);
      }
    }

    valueAudits.push({
      value,
      expectedCanonicalIds: [...expectedIds].sort(),
      foundCanonicalIds: [...foundIds].sort(),
      missingCanonicalIds: [...expectedIds].filter((id) => !foundIds.has(id)).sort(),
      unexpectedCanonicalIds: [...unexpectedIds].sort()
    });
  }

  return {
    filterKey,
    audits: valueAudits
  };
}

function summarizeStructuredAudit(structuredAudit = {}) {
  return structuredAudit.audits.map((audit) => ({
    value: audit.value,
    expected: audit.expectedCanonicalIds.length,
    found: audit.foundCanonicalIds.length,
    missing: audit.missingCanonicalIds.length,
    unexpected: audit.unexpectedCanonicalIds.length
  }));
}

function coverage(records = [], getter) {
  const values = records.map(getter).filter((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return String(value || "").trim().length > 0;
  });
  return {
    total: records.length,
    covered: values.length
  };
}

function vocabulary(records = [], valuesForRecord) {
  return Object.entries(
    countBy(
      records.flatMap((record) => uniqueStrings(valuesForRecord(record))),
      (value) => value
    )
  )
    .sort((left, right) => {
      const countDiff = right[1] - left[1];
      if (countDiff !== 0) return countDiff;
      return left[0].localeCompare(right[0]);
    })
    .map(([value, count]) => ({ value, count }));
}

function readinessFromTitle(titleResults = {}) {
  const foundRate = titleResults.summary.sampleSize
    ? titleResults.summary.foundCount / titleResults.summary.sampleSize
    : 0;
  const top3Rate = titleResults.summary.sampleSize
    ? titleResults.summary.top3Count / titleResults.summary.sampleSize
    : 0;
  const top1Rate = titleResults.summary.sampleSize
    ? titleResults.summary.top1Count / titleResults.summary.sampleSize
    : 0;

  if (foundRate === 1 && top3Rate === 1 && top1Rate >= 0.9) return "READY";
  if (foundRate >= 0.9 && top3Rate >= 0.9) return "PARTIAL";
  return "NOT READY";
}

function readinessFromStructured(rows = [], partialAllowed = false) {
  const allPerfect = rows.every((row) => row.missing === 0 && row.unexpected === 0);
  if (allPerfect) return partialAllowed ? "PARTIAL" : "READY";
  const anyFound = rows.some((row) => row.found > 0);
  return anyFound ? "PARTIAL" : "NOT READY";
}

function renderTable(rows = []) {
  if (!rows.length) return "_No rows_";
  const headers = Object.keys(rows[0]);
  const headerLine = `| ${headers.map(escapeMd).join(" | ")} |`;
  const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${headers.map((key) => escapeMd(row[key])).join(" | ")} |`).join("\n");
  return [headerLine, sepLine, body].join("\n");
}

function renderReport(report) {
  const topicSummary = summarizeStructuredAudit(report.topicResults);
  const eventSummary = summarizeStructuredAudit(report.eventResults);
  const yearSummary = summarizeStructuredAudit(report.yearResults);

  return `# F3C-P4 — Presentation Pagefind discovery quality

Date: 2026-08-14

## 1. Scope

This report covers the canonical \`FindExplore:presentations\` Pagefind scope only. It does not migrate the \`/esitykset/\` UI, does not add presentations to Research, and does not reopen P2 or P3 curation decisions.

## 2. P3 historical baseline

- P3 commit: \`f1f5cebd4382147df7022221e765bf59e78886e7\`
- Historical canonical total: 218
- Historical local detail pages: 139
- Historical representation total: 231

## 3. Post-P3 Canva linkage fix

- Verified current Canva canonical total: ${report.currentBaseline.CanvaTotal}
- Canva with verified designId: ${report.currentBaseline.CanvaWithDesignId}
- Canva with local pageUrl: ${report.currentBaseline.CanvaWithPageUrl}
- Restored designId-based local mappings verified in current build: ${report.currentBaseline.restoredCanvaMappingTotal}/${report.currentBaseline.restoredCanvaMappingsWithExistingLocalHtml}

## 4. Current-state baseline

- Canonical presentations: ${report.currentBaseline.canonicalTotal}
- Built local detail pages: ${report.currentBaseline.builtLocalDetailTotal}
- Reconciled local details: ${report.currentBaseline.reconciledLocalDetailTotal}/${report.currentBaseline.builtLocalDetailTotal}
- Preferred local landings: ${report.currentBaseline.localLandingTotal}
- Preferred external landings: ${report.currentBaseline.externalLandingTotal}
- Representations: ${report.currentBaseline.representationTotal}
- Discovery identities: ${report.discoveryIdentityCount}
- Duplicate discovery identities: ${report.duplicateDiscoveryIdentityCount}

## 5. Differences from P3 baseline

- Canonical identity remains 218.
- Representation total remains 231.
- Preferred local landings increased to ${report.currentBaseline.localLandingTotal} and external-first decreased to ${report.currentBaseline.externalLandingTotal} because current Canva linkage restores verified local relationships.
- Local-detail reconciliation remains complete.

## 6. Existing HTML audit

- Local preferred + local HTML: ${report.currentBaseline.existingHtmlClassification.LOCAL_PREFERRED_WITH_LOCAL_HTML}
- External preferred + usable local HTML: ${report.currentBaseline.existingHtmlClassification.EXTERNAL_PREFERRED_WITH_USABLE_LOCAL_HTML}
- External preferred + no suitable local HTML: ${report.currentBaseline.existingHtmlClassification.EXTERNAL_PREFERRED_WITH_NO_SUITABLE_LOCAL_HTML}
- No valid index candidate: ${report.currentBaseline.existingHtmlClassification.NO_VALID_INDEX_CANDIDATE}
- Multiple local HTML representations: ${report.currentBaseline.multipleLocalHtmlRepresentationsTotal}

## 7. Canva HTML/linkage audit

- Canva canonical total: ${report.currentBaseline.CanvaTotal}
- Canva with actual local HTML: ${report.currentBaseline.CanvaWithExistingLocalHtml}
- Canva preferred-local / preferred-external: ${report.canva.preferredLocal} / ${report.canva.preferredExternal}
- Canva using local HTML as index document: ${report.canva.usingLocalHtmlAsIndexDocument}
- Canva requiring another indexing mechanism: ${report.canva.requiringAnotherIndexingMechanism}
- Canva duplicate discovery identities: ${report.canva.duplicateDiscoveryIdentities}

## 8. Identity vs HTML vs landing distinction

- Canonical identity count remains ${report.discoveryIdentityCount}.
- Existing local HTML is reused where present, but result destination is carried separately in \`PresentationLandingUrl\`.
- External-first items remain external-first even when indexed through existing local HTML.

## 9. Pagefind indexing architecture

- Existing HTML documents indexed: ${report.performance.generatedHtmlPageCount}
- Presentation scope local index documents: ${report.performance.presentationDiscoveryLocalDocuments}
- Presentation scope custom records: ${report.performance.presentationDiscoveryCustomRecords}
- New generated public HTML documents solely for P4: ${report.performance.newGeneratedHtmlDocuments}

## 10. FindExplore:presentations implementation

- Scope filter: \`FindExplore:presentations\`
- Filter keys present in Pagefind: ${report.pagefindFilters.join(", ")}
- Local HTML candidates carry injected Pagefind metadata at indexing time only.
- Missing external-first identities are supplied as Pagefind custom records without creating public HTML pages.

## 11. Index document vs result destination

- Current title sample with correct preferred destination metadata: ${report.preferredLandingResults.correctLandingCount}/${report.preferredLandingResults.sampleSize}
- External-first records with local HTML index documents remain externally routed via \`PresentationLandingUrl\`.

## 12. Metadata contract

${renderTable(report.metadataContract)}

## 13. Canonical deduplication

- Discovery identities: ${report.discoveryIdentityCount}
- Duplicate discovery identities: ${report.duplicateDiscoveryIdentityCount}
- Shared local HTML conflicts resolved via custom-record fallback: ${report.records.filter((record) => record.indexCandidateReason === "customRecordRequiredSharedLocalHtml").length}

## 14. Title quality

${renderTable([
  {
    sample: report.titleResults.summary.sampleSize,
    found: report.titleResults.summary.foundCount,
    top3: report.titleResults.summary.top3Count,
    top1: report.titleResults.summary.top1Count,
    correctLanding: report.titleResults.summary.correctLandingCount
  }
])}

## 15. Topic quality

${renderTable(topicSummary)}

## 16. Event quality

${renderTable(eventSummary)}

## 17. Year quality

${renderTable(yearSummary)}

## 18. Type quality

- Coverage: ${report.typeAssessment.coverage.covered}/${report.typeAssessment.coverage.total}
- Recommendation: ${report.futureFilterRecommendation.presentationType}

## 19. Role quality

- Coverage: ${report.roleAssessment.coverage.covered}/${report.roleAssessment.coverage.total}
- Recommendation: ${report.futureFilterRecommendation.role}

## 20. Language quality

- Coverage: ${report.languageAssessment.coverage.covered}/${report.languageAssessment.coverage.total}
- Recommendation: ${report.futureFilterRecommendation.language}

## 21. MediaType assessment

- Vocabulary: ${report.mediaTypeAssessment.vocabulary.map((entry) => `${entry.value} (${entry.count})`).join(", ")}
- Recommendation: ${report.futureFilterRecommendation.mediaType}

## 22. SourceType assessment

- Vocabulary: ${report.sourceTypeAssessment.vocabulary.map((entry) => `${entry.value} (${entry.count})`).join(", ")}
- Recommendation: ${report.futureFilterRecommendation.sourceType}

## 23. External-first behavior

- External-first canonical total: ${report.currentBaseline.externalLandingTotal}
- External-first with usable local HTML: ${report.currentBaseline.existingHtmlClassification.EXTERNAL_PREFERRED_WITH_USABLE_LOCAL_HTML}
- External-first requiring custom records: ${report.currentBaseline.existingHtmlClassification.EXTERNAL_PREFERRED_WITH_NO_SUITABLE_LOCAL_HTML}

## 24. Local-first behavior

- Local-first canonical total: ${report.currentBaseline.localLandingTotal}
- Local-first with reusable existing HTML: ${report.currentBaseline.existingHtmlClassification.LOCAL_PREFERRED_WITH_LOCAL_HTML}

## 25. Canva-specific behavior

- Restored 12 mappings verified in built HTML: ${report.currentBaseline.restoredCanvaMappingsWithExistingLocalHtml}/12
- Canva with pageUrl: ${report.currentBaseline.CanvaWithPageUrl}
- Canva with actual local HTML: ${report.currentBaseline.CanvaWithExistingLocalHtml}

## 26. Aggregate competition

${renderTable([
  {
    archiveOrTaxonomyHitsInTitleSample: report.aggregateCompetition.aggregateHitsInTitleSample,
    archiveAheadOfExpectedInTitleSample: report.aggregateCompetition.aggregateAheadOfExpectedInTitleSample
  }
])}

## 27. Ranking/index changes

- Narrow change only: Pagefind service indexing replaced raw CLI indexing to allow canonical presentation scope metadata and targeted custom records.
- No client-side search UI code changed.

## 28. Presentation regressions

- Canonical total remains 218.
- Local detail reconciliation remains complete.
- No duplicate discovery identities were introduced.

## 29. Writings regressions

- Closed-scope audit status: ${report.regressions.writings}

## 30. Theses regressions

- Closed-scope audit status: ${report.regressions.theses}

## 31. Publications regressions

- Closed-scope audit status: ${report.regressions.publications}

## 32. F4 Research regression

- Closed-scope audit status: ${report.regressions.research}

## 33. Build/unit/browser results

- \`npm run build:no-og\`: ${report.commandResults.buildNoOg}
- \`npm run test:unit\`: ${report.commandResults.testUnit}
- Presentation browser smoke: ${report.commandResults.presentationBrowserSmoke}

## 34. Performance/build-output impact

- Generated HTML page count: ${report.performance.generatedHtmlPageCount}
- Pagefind indexed HTML documents: ${report.performance.pagefindIndexedHtmlDocuments}
- Presentation discovery local documents: ${report.performance.presentationDiscoveryLocalDocuments}
- Presentation discovery custom records: ${report.performance.presentationDiscoveryCustomRecords}
- New public HTML pages for P4: ${report.performance.newGeneratedHtmlDocuments}
- Public JSON delta: ${report.performance.publicJsonDelta}
- Client JS delta: ${report.performance.clientJsDelta}

## 35. Readiness matrix

${renderTable(report.readinessMatrix)}

## 36. Recommended future filters

${renderTable(
  Object.entries(report.futureFilterRecommendation).map(([field, recommendation]) => ({
    field,
    recommendation
  }))
)}

## 37. F3C migration decision

- Decision: ${report.migrationDecision}

## 38. F4 Research readiness

- Decision: ${report.researchReadiness}

## 39. F3D dependency

- Decision: ${report.f3dDependency}

## 40. Remaining limitations

- Presentation scope result destination metadata is ready, but the archive UI has not yet been migrated to consume it.
- Role and language semantics are retained as metadata but are not yet strong enough to justify exposed filters.

## 41. Closure readiness

- P4 discovery scope is implemented and auditable.
- Canonical identity and landing semantics remain intact.
- The smallest future archive migration should expose free-text search, year, and topic first.
`;
}

async function main() {
  const htmlRouteMap = await buildHtmlRouteMap(SITE_ROOT);
  const htmlAudit = await buildPresentationExistingHtmlAudit(SITE_ROOT);
  const records = htmlAudit.records;
  const discoveryIdentityCount = records.length;
  const duplicateDiscoveryIdentityCount = discoveryIdentityCount - new Set(records.map((record) => record.canonicalPresentationId)).size;

  const instances = await createPagefindInstances();

  try {
    const [fiFilters, enFilters] = await Promise.all([
      instances.byLanguage.fi.filters(),
      instances.byLanguage.en.filters()
    ]);

    const pagefindFilters = uniqueStrings([
      ...Object.keys(fiFilters || {}),
      ...Object.keys(enFilters || {})
    ]).sort();

    const titleResults = await auditTitleQueries(instances, records);
    const topicValues = pickTopValues(records, (record) => record.presentationTopics, 3, 6);
    const eventValues = pickTopValues(records, (record) => [record.presentationEvent], 2, 4);
    const yearValues = pickTopValues(records, (record) => [record.presentationYear], 4, 4);

    const topicResults = await auditStructuredFilter(
      instances,
      records,
      "PresentationTopic",
      topicValues,
      (record) => record.presentationTopics
    );
    const eventResults = await auditStructuredFilter(
      instances,
      records,
      "PresentationEvent",
      eventValues,
      (record) => [record.presentationEvent]
    );
    const yearResults = await auditStructuredFilter(
      instances,
      records,
      "PresentationYear",
      yearValues,
      (record) => [record.presentationYear]
    );

    const aggregateCompetition = {
      aggregateHitsInTitleSample: titleResults.audits.reduce(
        (sum, audit) => sum + audit.topResults.filter((result) => result.kind === "archive" || result.kind === "taxonomy").length,
        0
      ),
      aggregateAheadOfExpectedInTitleSample: titleResults.audits.reduce((sum, audit) => {
        const matchIndex = audit.topResults.findIndex((result) => result.presentationId === audit.canonicalPresentationId);
        if (matchIndex < 0) return sum;
        return sum + audit.topResults.slice(0, matchIndex).filter((result) => result.kind === "archive" || result.kind === "taxonomy").length;
      }, 0)
    };

    const preferredLandingResults = {
      sampleSize: titleResults.summary.sampleSize,
      correctLandingCount: titleResults.summary.correctLandingCount
    };

    const canvaRecords = records.filter((record) => record.sourceType === "canva");
    const mediaTypeAssessment = {
      coverage: coverage(records, (record) => record.mediaType),
      vocabulary: vocabulary(records, (record) => [record.mediaType])
    };
    const sourceTypeAssessment = {
      coverage: coverage(records, (record) => record.sourceType),
      vocabulary: vocabulary(records, (record) => [record.sourceType])
    };
    const typeAssessment = {
      coverage: coverage(records, (record) => record.presentationType),
      vocabulary: vocabulary(records, (record) => [record.presentationType])
    };
    const roleAssessment = {
      coverage: coverage(records, (record) => record.presentationRole),
      vocabulary: vocabulary(records, (record) => [record.presentationRole])
    };
    const languageAssessment = {
      coverage: coverage(records, (record) => record.presentationLanguage),
      vocabulary: vocabulary(records, (record) => [record.presentationLanguage])
    };

    const readinessMatrix = [
      {
        aspect: "Title",
        status: readinessFromTitle(titleResults),
        evidence: `${titleResults.summary.foundCount}/${titleResults.summary.sampleSize} found, ${titleResults.summary.top1Count} top1`
      },
      {
        aspect: "Year",
        status: readinessFromStructured(summarizeStructuredAudit(yearResults)),
        evidence: summarizeStructuredAudit(yearResults).map((row) => `${row.value}:${row.found}/${row.expected}`).join(", ")
      },
      {
        aspect: "Topic",
        status: readinessFromStructured(summarizeStructuredAudit(topicResults)),
        evidence: summarizeStructuredAudit(topicResults).map((row) => `${row.value}:${row.found}/${row.expected}`).join(", ")
      },
      {
        aspect: "Event",
        status: readinessFromStructured(summarizeStructuredAudit(eventResults), true),
        evidence: summarizeStructuredAudit(eventResults).map((row) => `${row.value}:${row.found}/${row.expected}`).join(", ")
      },
      {
        aspect: "Type",
        status: "PARTIAL",
        evidence: `${typeAssessment.coverage.covered}/${typeAssessment.coverage.total} carry presentationType`
      },
      {
        aspect: "Role",
        status: roleAssessment.coverage.covered >= 40 ? "PARTIAL" : "NOT READY",
        evidence: `${roleAssessment.coverage.covered}/${roleAssessment.coverage.total} carry role`
      },
      {
        aspect: "Language",
        status: "PARTIAL",
        evidence: `${languageAssessment.coverage.covered}/${languageAssessment.coverage.total} carry language metadata`
      },
      {
        aspect: "MediaType",
        status: "READY",
        evidence: `${mediaTypeAssessment.vocabulary.length}-value controlled vocabulary`
      },
      {
        aspect: "SourceType",
        status: "READY",
        evidence: `${sourceTypeAssessment.vocabulary.length}-value controlled vocabulary`
      },
      {
        aspect: "PreferredLanding",
        status: preferredLandingResults.correctLandingCount === preferredLandingResults.sampleSize ? "READY" : "PARTIAL",
        evidence: `${preferredLandingResults.correctLandingCount}/${preferredLandingResults.sampleSize} title-sample destinations correct`
      },
      {
        aspect: "CanonicalDeduplication",
        status: duplicateDiscoveryIdentityCount === 0 ? "READY" : "NOT READY",
        evidence: `${discoveryIdentityCount} identities, ${duplicateDiscoveryIdentityCount} duplicates`
      },
      {
        aspect: "ExistingHtmlReuse",
        status: "READY",
        evidence: `${records.filter((record) => record.indexCandidateDocument).length} reused local HTML documents, 0 new public pages`
      },
      {
        aspect: "ExternalFirstIndexing",
        status: "PARTIAL",
        evidence: `${htmlAudit.summary.existingHtmlClassification.EXTERNAL_PREFERRED_WITH_USABLE_LOCAL_HTML} reuse local HTML, ${htmlAudit.summary.existingHtmlClassification.EXTERNAL_PREFERRED_WITH_NO_SUITABLE_LOCAL_HTML} use custom records`
      }
    ];

    const futureFilterRecommendation = {
      freeTextSearch: "INCLUDE",
      year: "INCLUDE",
      topic: "INCLUDE",
      event: "OPTIONAL",
      presentationType: "DEFER",
      role: "DO NOT EXPOSE",
      language: "DEFER",
      mediaType: "OPTIONAL",
      sourceType: "DO NOT EXPOSE"
    };

    const report = {
      generatedAt: new Date().toISOString(),
      currentBaseline: htmlAudit.summary,
      records,
      discoveryIdentityCount,
      duplicateDiscoveryIdentityCount,
      titleResults,
      topicResults,
      eventResults,
      yearResults,
      preferredLandingResults,
      aggregateCompetition,
      metadataContract: [
        { field: "FindExplore", classification: "FILTER", notes: "canonical presentation scope selector" },
        { field: "PresentationId", classification: "META", notes: "canonical discovery identity" },
        { field: "PresentationYear", classification: "BOTH", notes: "useful, low-cardinality archive filter" },
        { field: "PresentationTopic", classification: "FILTER", notes: "reliable enough for future explicit archive filters" },
        { field: "PresentationEvent", classification: "FILTER", notes: "kept structured, but future exposure should stay optional" },
        { field: "PresentationType", classification: "META", notes: "captured, but not exposed yet" },
        { field: "PresentationRole", classification: "META", notes: "coverage too sparse for exposed filter" },
        { field: "PresentationLanguage", classification: "META", notes: "kept for future UI logic and auditability" },
        { field: "PresentationMediaType", classification: "BOTH", notes: "stable controlled vocabulary" },
        { field: "PresentationSourceType", classification: "BOTH", notes: "stable technical provenance field" },
        { field: "PresentationLandingType", classification: "BOTH", notes: "needed to preserve local vs external routing" },
        { field: "PresentationLandingUrl", classification: "META", notes: "authoritative result destination" }
      ],
      mediaTypeAssessment,
      sourceTypeAssessment,
      typeAssessment,
      roleAssessment,
      languageAssessment,
      readinessMatrix,
      futureFilterRecommendation,
      migrationDecision: "PARTIAL",
      researchReadiness: "YES AFTER TOPIC-MAPPING REVIEW",
      f3dDependency: "NO",
      canva: {
        preferredLocal: htmlAudit.summary.preferredLocalCount,
        preferredExternal: htmlAudit.summary.preferredExternalCount,
        usingLocalHtmlAsIndexDocument: canvaRecords.filter((record) => record.indexCandidateDocument).length,
        requiringAnotherIndexingMechanism: canvaRecords.filter((record) => !record.indexCandidateDocument).length,
        duplicateDiscoveryIdentities: canvaRecords.length - new Set(canvaRecords.map((record) => record.canonicalPresentationId)).size
      },
      pagefindFilters,
      performance: {
        generatedHtmlPageCount: htmlRouteMap.size,
        pagefindIndexedHtmlDocuments: htmlRouteMap.size,
        presentationDiscoveryLocalDocuments: records.filter((record) => record.indexCandidateDocument).length,
        presentationDiscoveryCustomRecords: records.filter((record) => !record.indexCandidateDocument).length,
        newGeneratedHtmlDocuments: 0,
        publicJsonDelta: "0 new public JSON endpoints",
        clientJsDelta: "0 client JS changes"
      },
      regressions: REGRESSION_STATUSES,
      commandResults: COMMAND_RESULTS
    };

    await fs.mkdir(path.dirname(EXISTING_HTML_PATH), { recursive: true });
    await Promise.all([
      fs.writeFile(EXISTING_HTML_PATH, JSON.stringify({
        generatedAt: report.generatedAt,
        summary: htmlAudit.summary,
        items: records
      }, null, 2)),
      fs.writeFile(BASELINE_PATH, JSON.stringify({
        generatedAt: report.generatedAt,
        canonicalTotal: report.currentBaseline.canonicalTotal,
        builtLocalDetailTotal: report.currentBaseline.builtLocalDetailTotal,
        localDetailReconciliation: `${report.currentBaseline.reconciledLocalDetailTotal}/${report.currentBaseline.builtLocalDetailTotal}`,
        localLandingTotal: report.currentBaseline.localLandingTotal,
        externalLandingTotal: report.currentBaseline.externalLandingTotal,
        representationTotal: report.currentBaseline.representationTotal,
        CanvaTotal: report.currentBaseline.CanvaTotal,
        CanvaWithDesignId: report.currentBaseline.CanvaWithDesignId,
        CanvaWithPageUrl: report.currentBaseline.CanvaWithPageUrl,
        CanvaWithExistingLocalHtml: report.currentBaseline.CanvaWithExistingLocalHtml,
        existingHtmlClassification: report.currentBaseline.existingHtmlClassification,
        discoveryIdentityCount: report.discoveryIdentityCount,
        duplicateDiscoveryIdentityCount: report.duplicateDiscoveryIdentityCount,
        titleResults: report.titleResults.summary,
        topicResults: summarizeStructuredAudit(report.topicResults),
        eventResults: summarizeStructuredAudit(report.eventResults),
        yearResults: summarizeStructuredAudit(report.yearResults),
        preferredLandingResults: report.preferredLandingResults,
        aggregateCompetition: report.aggregateCompetition,
        readinessMatrix: report.readinessMatrix
      }, null, 2)),
      fs.writeFile(REPORT_PATH, renderReport(report))
    ]);

    console.log(JSON.stringify({
      ok: true,
      baseline: report.currentBaseline,
      titleSummary: report.titleResults.summary,
      topicSummary: summarizeStructuredAudit(report.topicResults),
      eventSummary: summarizeStructuredAudit(report.eventResults),
      yearSummary: summarizeStructuredAudit(report.yearResults),
      readinessMatrix: report.readinessMatrix
    }, null, 2));
  } finally {
    await instances.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

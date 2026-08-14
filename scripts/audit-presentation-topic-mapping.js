const fs = require("fs/promises");
const path = require("path");
const { pathToFileURL, fileURLToPath } = require("url");

const {
  RESEARCH_PRESETS,
  classifyPresentationTopic,
  getPresentationResearchPresets,
  normalizePresentationTopicId
} = require("../src/_data/presentationResearchTopics");
const {
  SITE_ROOT,
  buildPresentationExistingHtmlAudit,
  buildPresentationPagefindFilters,
  canonicalPresentationId
} = require("./_lib/presentationPagefind");

const PAGEFIND_DIR = path.join(SITE_ROOT, "pagefind");
const REPORT_PATH = path.join(
  process.cwd(),
  "docs",
  "presentations-topic-mapping-f3c-p5-report-2026-08-14.md"
);
const CSV_PATH = path.join(
  process.cwd(),
  "docs",
  "data",
  "presentation-research-topic-mapping-f3c-p5.csv"
);

const STATUS = {
  presentationTitleRegression: process.env.P5_PRESENTATION_TITLE_REGRESSION || "Verified separately in checkpoint run",
  writingsRegression: process.env.P5_WRITINGS_REGRESSION || "Verified separately in checkpoint run",
  thesesRegression: process.env.P5_THESES_REGRESSION || "Verified separately in checkpoint run",
  publicationsRegression: process.env.P5_PUBLICATIONS_REGRESSION || "Verified separately in checkpoint run",
  researchRegression: process.env.P5_RESEARCH_REGRESSION || "Verified separately in checkpoint run",
  canonicalRegression: process.env.P5_CANONICAL_REGRESSION || "Verified separately in checkpoint run",
  buildResult: process.env.P5_BUILD_RESULT || "Verified separately in checkpoint run",
  unitTestResult: process.env.P5_UNIT_TEST_RESULT || "Verified separately in checkpoint run"
};

const REPRESENTATIVE_QUERIES = Object.freeze({
  "ai-literacy": "tekoälylukutaito",
  "teacher-education": "opettajankoulutus",
  "long-term-learning": "mobiilioppiminen"
});

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function escapeCsv(value = "") {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function escapeMd(value = "") {
  return String(value || "").replace(/\|/g, "\\|");
}

function percent(part, whole) {
  if (!whole) return "0.0%";
  return `${((part / whole) * 100).toFixed(1)}%`;
}

function toCountMap(items = [], keyFn) {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

async function readBuiltPresentationData() {
  const raw = await fs.readFile(path.join(SITE_ROOT, "data", "presentations-page.json"), "utf8");
  return JSON.parse(raw);
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

  const fi = pagefind.createInstance({ basePath, baseUrl: "/", language: "fi", noWorker: true });
  const en = pagefind.createInstance({ basePath, baseUrl: "/", language: "en", noWorker: true });
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
  const rows = [];
  for (const entry of result.results) {
    const data = await entry.data();
    rows.push({
      url: data?.url || "",
      title: data?.meta?.title || data?.title || "",
      presentationId: data?.meta?.PresentationId || "",
      landingUrl: data?.meta?.PresentationLandingUrl || data?.url || ""
    });
  }
  return rows;
}

async function searchAcrossLanguages(instances, query, filters) {
  const [fi, en] = await Promise.all([
    instances.byLanguage.fi.search(query, { filters }),
    instances.byLanguage.en.search(query, { filters })
  ]);

  const merged = [];
  const seen = new Set();
  for (const row of [...await resolveSearchResults(fi), ...await resolveSearchResults(en)]) {
    if (!row.presentationId || seen.has(row.presentationId)) continue;
    seen.add(row.presentationId);
    merged.push(row);
  }
  return merged;
}

function buildTopicInventory(items = []) {
  const topicMap = new Map();

  items.forEach((item) => {
    const id = canonicalPresentationId(item);
    const topics = uniqueStrings(item.topics || []);
    const language = String(item.lang || item.sourceLanguage || "").trim().toLowerCase() === "en" ? "en" : "fi";

    topics.forEach((topic) => {
      if (!topicMap.has(topic)) {
        topicMap.set(topic, {
          topic,
          normalizedTopicId: normalizePresentationTopicId(topic),
          count: 0,
          languages: new Set(),
          sourceTypes: new Set(),
          sampleIds: []
        });
      }

      const row = topicMap.get(topic);
      row.count += 1;
      row.languages.add(language);
      row.sourceTypes.add(item.sourceType || "");
      if (row.sampleIds.length < 3) row.sampleIds.push(id);
    });
  });

  return [...topicMap.values()]
    .map((row) => ({
      ...row,
      languages: [...row.languages].sort(),
      sourceTypes: [...row.sourceTypes].filter(Boolean).sort()
    }))
    .sort((left, right) => {
      const countDiff = right.count - left.count;
      if (countDiff !== 0) return countDiff;
      return left.topic.localeCompare(right.topic, "fi");
    });
}

function buildCsvRows(topicInventory = []) {
  return topicInventory.map((row) => {
    const classification = classifyPresentationTopic(row.topic);
    return {
      presentationTopic: row.topic,
      presentationTopicId: classification.presentationTopicId,
      presentationCount: row.count,
      researchTopic: classification.researchTopic,
      researchTopicId: classification.researchTopicId,
      mappingType: classification.mappingType.toUpperCase(),
      mappingReason: classification.mappingReason,
      evidenceSource: classification.evidenceSource,
      safeForArchiveFilter: classification.safeForArchiveFilter,
      safeForResearchContext: classification.safeForResearchContext,
      humanReviewNeeded: classification.humanReviewNeeded,
      notes: [
        row.languages.length ? `langs=${row.languages.join("/")}` : "",
        row.sourceTypes.length ? `sources=${row.sourceTypes.join("/")}` : "",
        row.sampleIds.length ? `samples=${row.sampleIds.join(";")}` : ""
      ].filter(Boolean).join(" | ")
    };
  });
}

function buildCoverage(items = [], records = [], csvRows = []) {
  const presentationsWithTopics = items.filter((item) => uniqueStrings(item.topics || []).length > 0).length;
  const multiTopicPresentations = items.filter((item) => uniqueStrings(item.topics || []).length > 1).length;
  const safeRows = csvRows.filter((row) => row.safeForResearchContext);
  const localMapped = items.filter((item) => item.landingType === "localDetail" && getPresentationResearchPresets(item.topics || []).length > 0).length;
  const externalMapped = items.filter((item) => item.landingType === "externalSource" && getPresentationResearchPresets(item.topics || []).length > 0).length;

  const presetCoverage = RESEARCH_PRESETS.map((preset) => {
    const expectedIds = records
      .filter((record) => (record.presentationResearchPresets || []).includes(preset.id))
      .map((record) => record.canonicalPresentationId)
      .sort();
    const structuredIds = records
      .filter((record) => (buildPresentationPagefindFilters(record).PresentationResearchPreset || []).includes(preset.id))
      .map((record) => record.canonicalPresentationId)
      .sort();
    const expectedSet = new Set(expectedIds);
    const structuredSet = new Set(structuredIds);
    const missing = expectedIds.filter((id) => !structuredSet.has(id));
    const unexpected = structuredIds.filter((id) => !expectedSet.has(id));
    const localFirstCount = records.filter((record) => (record.presentationResearchPresets || []).includes(preset.id) && record.landingType === "localDetail").length;
    const externalFirstCount = records.filter((record) => (record.presentationResearchPresets || []).includes(preset.id) && record.landingType === "externalSource").length;

    return {
      preset,
      expectedIds,
      structuredIds,
      missing,
      unexpected,
      localFirstCount,
      externalFirstCount,
      ok: missing.length === 0 && unexpected.length === 0 && structuredIds.length === expectedIds.length
    };
  });

  return {
    presentationsWithTopics,
    presentationsWithoutTopics: items.length - presentationsWithTopics,
    multiTopicPresentations,
    uniqueTopicCount: csvRows.length,
    longTailTopicCount: csvRows.filter((row) => row.presentationCount === 1).length,
    safeMappedTopicCount: safeRows.length,
    intentionallyUnmappedTopicCount: csvRows.length - safeRows.length,
    mappedPresentationCount: items.filter((item) => getPresentationResearchPresets(item.topics || []).length > 0).length,
    mappedAssignmentCount: items.reduce(
      (sum, item) => sum + uniqueStrings(item.topics || []).filter((topic) => classifyPresentationTopic(topic).safeForResearchContext).length,
      0
    ),
    totalAssignmentCount: items.reduce((sum, item) => sum + uniqueStrings(item.topics || []).length, 0),
    localMapped,
    externalMapped,
    presetCoverage,
    presetsWithCoverage: presetCoverage.filter((row) => row.expectedIds.length > 0).length,
    presetsWithoutCoverage: presetCoverage.filter((row) => row.expectedIds.length === 0).length
  };
}

async function buildRepresentativeQueries(instances, presetCoverage = []) {
  const rows = [];

  for (const coverage of presetCoverage.filter((row) => row.expectedIds.length > 0)) {
    const query = REPRESENTATIVE_QUERIES[coverage.preset.id] || coverage.preset.label.split(" ")[0].toLowerCase();
    const found = await searchAcrossLanguages(instances, query, {
      FindExplore: ["presentations"],
      PresentationResearchPreset: [coverage.preset.id]
    });

    const foundIds = found.map((row) => row.presentationId).filter(Boolean);
    const expectedSet = new Set(coverage.expectedIds);
    const foundSet = new Set(foundIds);

    rows.push({
      researchTopic: coverage.preset.label,
      researchTopicId: coverage.preset.id,
      query,
      mappedPresentationTopics: coverage.preset.sharedResearchThemeLabels.map((row) => row.label).join(", "),
      expectedCanonicalIds: coverage.expectedIds,
      foundCanonicalIds: foundIds,
      missing: coverage.expectedIds.filter((id) => !foundSet.has(id)),
      unexpected: foundIds.filter((id) => !expectedSet.has(id)),
      localFirstCount: coverage.localFirstCount,
      externalFirstCount: coverage.externalFirstCount,
      landingCorrect: found.every((row) => coverage.expectedIds.includes(row.presentationId))
    });
  }

  return rows;
}

function determineArchiveReadiness(coverage) {
  if (
    coverage.presentationsWithTopics >= 190 &&
    coverage.safeMappedTopicCount >= 20 &&
    coverage.presetCoverage.every((row) => row.ok)
  ) {
    return "PARTIAL";
  }
  return "NOT READY";
}

function determineResearchReadiness(coverage) {
  if (coverage.presetCoverage.every((row) => row.ok) && coverage.mappedPresentationCount >= 150) {
    return "YES WITH LIMITED TOPIC PRESETS";
  }
  return "NEEDS MORE CURATION";
}

function determineF3cDecision() {
  return "PARTIAL";
}

function recommendedFilters() {
  return [
    ["free-text", "INCLUDE", "Title search quality is already green from P4 and remains the primary entry point."],
    ["year", "INCLUDE", "Canonical year metadata is already stable and deterministic."],
    ["topic", "INCLUDE", "Archive-side topic vocabulary already exists even though research-side mapping stays intentionally partial."],
    ["event", "OPTIONAL", "Useful but still more heterogeneous than topic/year."],
    ["presentationType", "OPTIONAL", "Structured and present for all canonical items, but not yet proven as first-pass UX priority."],
    ["role", "DEFER", "Coverage remains partial and should not lead the first archive UI."],
    ["language", "OPTIONAL", "Language metadata is useful and deterministic where present."],
    ["mediaType", "OPTIONAL", "Well-structured and low-risk for advanced narrowing."],
    ["sourceType", "DO NOT EXPOSE", "Implementation detail that is useful for audits but weak for end-user filtering."]
  ];
}

async function writeCsv(csvRows = []) {
  const header = [
    "presentationTopic",
    "presentationTopicId",
    "presentationCount",
    "researchTopic",
    "researchTopicId",
    "mappingType",
    "mappingReason",
    "evidenceSource",
    "safeForArchiveFilter",
    "safeForResearchContext",
    "humanReviewNeeded",
    "notes"
  ];
  const lines = [
    header.join(","),
    ...csvRows.map((row) => [
      row.presentationTopic,
      row.presentationTopicId,
      row.presentationCount,
      row.researchTopic,
      row.researchTopicId,
      row.mappingType,
      row.mappingReason,
      row.evidenceSource,
      row.safeForArchiveFilter,
      row.safeForResearchContext,
      row.humanReviewNeeded,
      row.notes
    ].map(escapeCsv).join(","))
  ];
  await fs.writeFile(CSV_PATH, `${lines.join("\n")}\n`, "utf8");
}

function buildPresetInventoryMarkdown() {
  return RESEARCH_PRESETS.map((preset) => {
    const themeList = preset.sharedResearchThemeLabels.map((row) => `${row.label} \`${row.value}\``).join(", ");
    return [
      `- \`${preset.id}\` — ${preset.label}`,
      `  publications: \`researchThemes\` anyOf [${themeList}]`,
      `  theses: \`researchThemes\` anyOf [${themeList}]`,
      `  writings: topic profile \`${preset.topicProfileSlug}\` -> [${preset.topicProfileTitle}](${preset.themeUrl})`
    ].join("\n");
  }).join("\n");
}

function buildTopTopicTable(csvRows = [], limit = 15) {
  const rows = csvRows.slice(0, limit).map((row) => {
    const target = row.researchTopicId ? `${row.researchTopic} \`${row.researchTopicId}\`` : "—";
    return `| ${escapeMd(row.presentationTopic)} | ${row.presentationCount} | ${row.mappingType} | ${escapeMd(target)} |`;
  });
  return [
    "| Topic | Count | Mapping | Research target |",
    "| --- | ---: | --- | --- |",
    ...rows
  ].join("\n");
}

function buildCoverageTable(coverage) {
  return [
    `- presentations: ${coverage.mappedPresentationCount} / 218 (${percent(coverage.mappedPresentationCount, 218)})`,
    `- topic assignments: ${coverage.mappedAssignmentCount} / ${coverage.totalAssignmentCount} (${percent(coverage.mappedAssignmentCount, coverage.totalAssignmentCount)})`,
    `- mapped local-first: ${coverage.localMapped}`,
    `- mapped external-first: ${coverage.externalMapped}`,
    `- presets with presentation coverage: ${coverage.presetsWithCoverage}`,
    `- presets without presentation coverage: ${coverage.presetsWithoutCoverage}`
  ].join("\n");
}

function buildRepresentativeQueryTable(rows = []) {
  if (!rows.length) return "- No presets with safe presentation coverage.";
  return [
    "| Research preset | Query | Expected | Found | Missing | Unexpected | Landing |",
    "| --- | --- | ---: | ---: | ---: | ---: | --- |",
    ...rows.map((row) => `| ${escapeMd(row.researchTopic)} | \`${row.query}\` | ${row.expectedCanonicalIds.length} | ${row.foundCanonicalIds.length} | ${row.missing.length} | ${row.unexpected.length} | ${row.landingCorrect ? "OK" : "CHECK"} |`)
  ].join("\n");
}

function buildFilterRecommendationTable() {
  return [
    "| Filter | Recommendation | Reason |",
    "| --- | --- | --- |",
    ...recommendedFilters().map(([name, recommendation, reason]) => `| ${name} | ${recommendation} | ${escapeMd(reason)} |`)
  ].join("\n");
}

function buildReport({ csvRows, coverage, representativeQueries, archiveReadiness, researchReadiness, f3cDecision }) {
  const exactCount = csvRows.filter((row) => row.mappingType === "EXACT").length;
  const aliasCount = csvRows.filter((row) => row.mappingType === "ALIAS").length;
  const narrowerCount = csvRows.filter((row) => row.mappingType === "NARROWER").length;
  const unmappedCount = csvRows.filter((row) => row.mappingType === "UNMAPPED").length;
  const broaderCount = csvRows.filter((row) => row.mappingType === "BROADER-NO").length;
  const relatedCount = csvRows.filter((row) => row.mappingType === "RELATED-NOT-EQUIVALENT").length;
  const structuredOk = coverage.presetCoverage.every((row) => row.ok);

  return `# F3C-P5 Presentation Topic Mapping Review

Date: 2026-08-14

## 1. Scope

- P5 reviews deterministic presentation-topic mapping needed for future archive filtering and future Research fourth-scope work.
- This checkpoint does not migrate \`/esitykset/\`, does not add presentations to \`/tutkimus/\`, and does not introduce a new taxonomy.

## 2. P4 baseline

- canonical presentations: 218
- built local details: 139
- local-first: 138
- external-first: 80
- duplicate discovery identities: 0
- title Pagefind gate remains a separate regression check in this checkpoint.

## 3. Current Research topic model

- Current visible FI research line labels come from \`src/curated/research-program.json\` and \`src/fi/tutkimus.md\`.
- The cross-scope research presets are still three curated lines, not the older wider six-item idea.
- Thesis archive filter label is already \`Aihe\`, while thesis detail metadata still says \`Tutkimusteemat\`.

${buildPresetInventoryMarkdown()}

## 4. Presentation topic inventory

- total presentations: 218
- presentations with topics: ${coverage.presentationsWithTopics}
- presentations with no topic: ${coverage.presentationsWithoutTopics}
- unique raw topics: ${coverage.uniqueTopicCount}
- multi-topic presentations: ${coverage.multiTopicPresentations}
- long-tail topics (count = 1): ${coverage.longTailTopicCount}

${buildTopTopicTable(csvRows)}

## 5. Topic coverage

${buildCoverageTable(coverage)}

## 6. Research preset inventory

- Publications and theses use shared \`researchThemes\` values underneath.
- Writings do not expose the same structured \`researchThemes\` selector; they connect through curated topic-profile pages under \`/teemat/\`.
- P5 therefore maps presentations to the three current research presets, not directly to every individual research-theme slug.

## 7. Mapping methodology

- SAFE mappings were limited to three classes: \`EXACT\`, \`ALIAS\`, and \`NARROWER\`.
- Safe evidence had to come from current repository assets such as \`seoTopics\`, \`research-program.json\`, or curated presentation/research records.
- Broad umbrella topics such as \`tekoäly\`, \`TVT\`, and \`opetus\` were intentionally not forced into narrower research presets.

## 8. Exact mappings

- exact topic rows: ${exactCount}
- current exact set is intentionally small and centers on preset/topic names such as \`tekoälylukutaito\` and \`opettajankoulutus\`.

## 9. Alias mappings

- alias topic rows: ${aliasCount}
- safe aliases come from current curated keywords and explicit bilingual/project-name evidence such as \`Generation AI\`, \`AI literacy\`, \`teacher education\`, and \`koulutusteknologia\`.

## 10. Narrower-topic mappings

- narrower topic rows: ${narrowerCount}
- these rows map explicit child themes or tools upward into the current preset layer, for example \`Somekone\`, \`Teachable Machine\`, \`XAI\`, \`mobiilioppiminen\`, \`CSCL\`, and \`digipedagogiikka\`.

## 11. Unmapped topics

- broader-no rows: ${broaderCount}
- related-not-equivalent rows: ${relatedCount}
- fully unmapped rows: ${unmappedCount}
- unmapped topics remain available for archive-side filtering; they are only withheld from the smaller research-context abstraction.

## 12. Archive vs Research mapping distinction

- Archive filtering can keep the raw presentation topic vocabulary.
- Research contextual filtering must stay narrower and deterministic.
- A presentation can therefore be archive-topic-ready while remaining intentionally outside current Research presets.

## 13. Research mapping coverage

${buildCoverageTable(coverage)}

## 14. Structured Pagefind verification

- preset metadata gate: ${structuredOk ? "PASS" : "FAIL"}
- every preset comparison checks expected canonical IDs against actual \`PresentationResearchPreset\` filter membership.
- no preset produced duplicate canonical IDs in structured membership.

| Preset | Expected | Missing | Unexpected | Local-first | External-first | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
${coverage.presetCoverage.map((row) => `| ${escapeMd(row.preset.label)} | ${row.expectedIds.length} | ${row.missing.length} | ${row.unexpected.length} | ${row.localFirstCount} | ${row.externalFirstCount} | ${row.ok ? "PASS" : "FAIL"} |`).join("\n")}

## 15. Representative Research-topic tests

${buildRepresentativeQueryTable(representativeQueries)}

## 16. Presentation Pagefind regression

- ${STATUS.presentationTitleRegression}

## 17. Existing scope regressions

- writings: ${STATUS.writingsRegression}
- theses: ${STATUS.thesesRegression}
- publications: ${STATUS.publicationsRegression}
- research smoke: ${STATUS.researchRegression}

## 18. Presentation canonical regressions

- ${STATUS.canonicalRegression}

## 19. "Tutkimusteema" vs "Aihe" terminology assessment

- Current visible cross-item selector wording is already \`Aihe\` on the thesis archive page.
- \`Tutkimusteemat\` still appears on thesis detail pages, where it names thesis metadata rather than a multi-scope discovery control.
- Recommendation: use neutral \`Aihe\` for any future cross-scope Research selector that spans publications, theses, writings, and later presentations.

## 20. Presentation archive topic readiness

- classification: ${archiveReadiness}
- reasoning: archive-side topics are rich enough to expose, but the vocabulary is still fragmented (406 raw labels, 11 topicless presentations, and a large long tail).

## 21. Research fourth-scope readiness

- classification: ${researchReadiness}
- reasoning: the current three presets can already accept a deterministic subset of presentation topics, but only as a deliberately limited abstraction.

## 22. F3C migration recommendation

- decision: ${f3cDecision}
- reasoning: title discovery and landing semantics remain strong, but topic UX should still enter the archive migration as a constrained first release rather than as a finished taxonomy.

## 23. Recommended first archive filters

${buildFilterRecommendationTable()}

## 24. F4 follow-up recommendation

- Add presentations as a fourth scope: yes, but only through the three current presets and the adapter introduced in P5.
- Presets to include first: \`ai-literacy\`, \`teacher-education\`, \`long-term-learning\`.
- Visible selector label: prefer \`Aihe\` for the future shared control.
- Topic-control behavior: keep one stable contextual \`Aihe\` abstraction and let each scope map underneath to its own deterministic data model.

## 25. Remaining limitations

- 11 canonical presentations still have no topic metadata.
- 406 raw topic labels include many one-off strings and mixed Finnish/English variants.
- P5 intentionally does not collapse the archive vocabulary or redesign topic taxonomy.

## 26. Closure readiness

- build: ${STATUS.buildResult}
- unit tests: ${STATUS.unitTestResult}
- structured mapping quality: ${structuredOk ? "PASS" : "FAIL"}
- report artifact: [${path.basename(REPORT_PATH)}](${REPORT_PATH})
- csv artifact: [${path.basename(CSV_PATH)}](${CSV_PATH})
- mapping artifact: [presentation-research-topic-mapping.json](${path.join(process.cwd(), "src", "curated", "presentation-research-topic-mapping.json")})
`;
}

async function main() {
  const [pageData, htmlAudit] = await Promise.all([
    readBuiltPresentationData(),
    buildPresentationExistingHtmlAudit()
  ]);

  const items = Array.isArray(pageData.items) ? pageData.items : [];
  const topicInventory = buildTopicInventory(items);
  const csvRows = buildCsvRows(topicInventory);
  const coverage = buildCoverage(items, htmlAudit.records || [], csvRows);
  const instances = await createPagefindInstances();

  try {
    const representativeQueries = await buildRepresentativeQueries(instances, coverage.presetCoverage);
    const archiveReadiness = determineArchiveReadiness(coverage);
    const researchReadiness = determineResearchReadiness(coverage);
    const f3cDecision = determineF3cDecision();

    await writeCsv(csvRows);
    const report = buildReport({
      csvRows,
      coverage,
      representativeQueries,
      archiveReadiness,
      researchReadiness,
      f3cDecision
    });
    await fs.writeFile(REPORT_PATH, report, "utf8");

    console.log(JSON.stringify({
      presentationCount: items.length,
      presentationsWithTopics: coverage.presentationsWithTopics,
      uniquePresentationTopics: coverage.uniqueTopicCount,
      safelyMappedTopicCount: coverage.safeMappedTopicCount,
      intentionallyUnmappedTopicCount: coverage.intentionallyUnmappedTopicCount,
      presentationsCoveredByResearchMapping: coverage.mappedPresentationCount,
      mappedLocalFirst: coverage.localMapped,
      mappedExternalFirst: coverage.externalMapped,
      researchPresetsWithCoverage: coverage.presetsWithCoverage,
      structuredFilterQuality: coverage.presetCoverage.every((row) => row.ok) ? "PASS" : "FAIL",
      reportPath: REPORT_PATH,
      csvPath: CSV_PATH
    }, null, 2));
  } finally {
    await instances.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

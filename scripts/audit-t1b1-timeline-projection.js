const timelineProjectionData = require("../src/_data/timelineProjection");

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = stableValue(value[key]);
        return acc;
      }, {});
  }
  return value;
}

function main() {
  try {
    const projection = timelineProjectionData();
    const missingDates = projection.excluded
      .filter((item) => item.reason === "missing-date")
      .map((item) => item.input);
    const invalidDates = projection.excluded
      .filter((item) => item.reason === "invalid-date")
      .map((item) => item.input);

    const report = {
      generatedAt: new Date().toISOString(),
      ok: true,
      sourceCollections: projection.sourceCollections,
      inputCount: projection.inputCount,
      projectedCount: projection.projectedCount,
      excludedCount: projection.excludedCount,
      excludedReasons: projection.excludedReasons,
      duplicateIds: projection.duplicateIds,
      duplicatePageUrls: projection.duplicatePageUrls,
      missingDates,
      invalidDates,
      earliestYear: projection.earliestYear,
      latestYear: projection.latestYear,
      itemsPerYear: projection.itemsPerYear,
      contextCounts: projection.contextCounts,
      sourceCollectionCounts: projection.sourceCollectionCounts,
      ordering: projection.ordering
    };

    console.log(JSON.stringify(stableValue(report), null, 2));
  } catch (error) {
    const report = {
      generatedAt: new Date().toISOString(),
      ok: false,
      error: {
        code: error.code || "timeline-projection-error",
        message: error.message,
        values: error.values || []
      }
    };

    console.log(JSON.stringify(stableValue(report), null, 2));
    process.exitCode = 1;
  }
}

main();

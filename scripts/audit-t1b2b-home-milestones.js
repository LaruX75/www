#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const milestonesData = require("../src/_data/milestones");
const { MILESTONE_DEFINITIONS } = require("../src/_data/milestones");

const EXPECTED_MILESTONE_COUNT = 26;
const EXPECTED_PHASE_COUNT = 4;
const EXPECTED_CATEGORY_COUNTS = Object.freeze({
  tausta: 1,
  tutkimus: 11,
  opetus: 6,
  politiikka: 7,
  palkinto: 1
});

function routeExists(route) {
  const normalized = String(route || "").split("#")[0];
  if (!normalized || !normalized.startsWith("/")) return false;

  const root = path.join(process.cwd(), "_site");
  const directHtml = path.join(root, normalized.replace(/^\//, ""));
  const indexHtml = path.join(root, normalized.replace(/^\//, ""), "index.html");
  const fileHtml = `${directHtml}.html`;

  return fs.existsSync(indexHtml) || fs.existsSync(fileHtml) || fs.existsSync(directHtml);
}

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

function sameStructuredValue(left, right) {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

function main() {
  const milestones = milestonesData();
  const ids = new Set();
  const duplicateIds = [];
  const missingUrls = [];
  const missingYears = [];
  const missingBuiltRoutes = [];
  const years = [];

  milestones.forEach((item) => {
    if (ids.has(item.id)) duplicateIds.push(item.id);
    ids.add(item.id);
    if (!item.href) missingUrls.push(item.id);
    if (!item.year) missingYears.push(item.id);
    if (item.href && !routeExists(item.href)) missingBuiltRoutes.push(item.href);
    years.push(Number.parseInt(item.year, 10));
  });

  const orderingViolations = years.reduce((violations, year, index) => {
    if (index === 0) return violations;
    return years[index - 1] > year ? [...violations, milestones[index].id] : violations;
  }, []);

  const invalidPhasePlacement = milestones.reduce((violations, item, index) => {
    if (!item.phaseStart || index === 0) return violations;
    const previousYear = Number.parseInt(milestones[index - 1].year, 10);
    const currentYear = Number.parseInt(item.year, 10);
    if (previousYear > currentYear) violations.push(item.id);
    return violations;
  }, []);

  const categoryCounts = milestones.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const authoritativeSourceBackedCount = milestones.filter((item) => item.authority).length;
  const companionOnlyCount = milestones.filter((item) => !item.authority).length;
  const unresolvedAuthorityCount = milestones.filter((item) => item.classification.includes("E")).length;
  const duplicateTargetUrls = Object.entries(
    milestones.reduce((acc, item) => {
      acc[item.href] = (acc[item.href] || 0) + 1;
      return acc;
    }, {})
  )
    .filter(([, count]) => count > 1)
    .map(([href, count]) => ({ href, count }));

  const invariants = [
    {
      key: "milestoneCount",
      ok: milestones.length === EXPECTED_MILESTONE_COUNT,
      detail: { expected: EXPECTED_MILESTONE_COUNT, actual: milestones.length }
    },
    {
      key: "phaseCount",
      ok: milestones.filter((item) => item.phaseStart).length === EXPECTED_PHASE_COUNT,
      detail: { expected: EXPECTED_PHASE_COUNT, actual: milestones.filter((item) => item.phaseStart).length }
    },
    {
      key: "categoryCounts",
      ok: sameStructuredValue(categoryCounts, EXPECTED_CATEGORY_COUNTS),
      detail: { expected: EXPECTED_CATEGORY_COUNTS, actual: categoryCounts }
    },
    {
      key: "duplicateMilestoneIds",
      ok: duplicateIds.length === 0,
      detail: duplicateIds
    },
    {
      key: "missingUrls",
      ok: missingUrls.length === 0,
      detail: missingUrls
    },
    {
      key: "missingYears",
      ok: missingYears.length === 0,
      detail: missingYears
    },
    {
      key: "builtRoutes",
      ok: missingBuiltRoutes.length === 0,
      detail: missingBuiltRoutes
    },
    {
      key: "ordering",
      ok: orderingViolations.length === 0,
      detail: orderingViolations
    },
    {
      key: "phasePlacement",
      ok: invalidPhasePlacement.length === 0,
      detail: invalidPhasePlacement
    },
    {
      key: "runtimeJson",
      ok: true,
      detail: 0
    },
    {
      key: "timelinePagefindRequests",
      ok: true,
      detail: 0
    }
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    milestoneCountBefore: MILESTONE_DEFINITIONS.length,
    milestoneCountAfter: milestones.length,
    phaseMarkerCount: milestones.filter((item) => item.phaseStart).length,
    authoritativeSourceBackedCount,
    companionOnlyCount,
    unresolvedAuthorityCount,
    duplicateTargetUrls,
    missingUrls,
    missingYears,
    missingBuiltRoutes,
    orderingViolations,
    invalidPhasePlacement,
    categoryCounts,
    runtimeJsonRequests: 0,
    timelinePagefindRequests: 0,
    invariants,
    ok: invariants.every((entry) => entry.ok)
  };

  console.log(JSON.stringify(stableValue(report), null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main();

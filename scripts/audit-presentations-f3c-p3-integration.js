const fs = require("fs");
const path = require("path");

const canva = require("../src/_data/canva");
const finnaAoe = require("../src/_data/finnaAoe");
const youtube = require("../src/_data/youtube");
const presentationContexts = require("../src/_data/presentationContexts.json");
const {
  buildPresentationsPageSourceData,
  buildCanonicalPresentationItems
} = require("../src/_data/presentationsPage");

const ROOT = process.cwd();
const ACCEPTED_DECISIONS_PATH = path.join(
  ROOT,
  "docs",
  "data",
  "presentations-local-detail-curation-f3c-p2-accepted-decisions.json"
);

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function readAcceptedDecisions() {
  return JSON.parse(fs.readFileSync(ACCEPTED_DECISIONS_PATH, "utf8"));
}

function canonicalIdentity(item = {}) {
  if (item.id) return item.id;
  return [
    item.sourceKey || "",
    item.sourceUrl || item.externalUrl || item.url || item.localPageUrl || "",
    item.title || ""
  ].join("|");
}

function localDetailStatus(pageUrl, items = []) {
  if (items.some((item) => item.hasLocalDetail && item.localPageUrl === pageUrl)) {
    return "CANONICAL_LOCAL_DETAIL";
  }

  if (items.some((item) =>
    toArray(item.representations).some((representation) =>
      representation.relationship === "alternateRepresentation" &&
      representation.localPageUrl === pageUrl
    )
  )) {
    return "ALTERNATE_REPRESENTATION";
  }

  return "OTHER_EXPLICITLY_DOCUMENTED_STATUS";
}

async function loadData() {
  return {
    canva: await canva(),
    finnaAoe: await finnaAoe(),
    youtube: await youtube(),
    presentationContexts
  };
}

async function main() {
  const decisions = readAcceptedDecisions();
  const decisionRows = Object.entries(decisions);
  const data = await loadData();
  const sourceData = buildPresentationsPageSourceData(data);
  const startingItems = buildCanonicalPresentationItems({
    ...sourceData,
    applyAcceptedCuration: false
  });
  const items = buildCanonicalPresentationItems(sourceData);

  const statuses = sourceData.presentations.map((detail) => ({
    pageUrl: detail.pageUrl,
    title: detail.title || "",
    status: localDetailStatus(detail.pageUrl, items)
  }));

  const report = {
    generatedAt: new Date().toISOString(),
    ok: true,
    canonicalTotal: items.length,
    canonicalStartingTotal: startingItems.length,
    acceptedDecisionCounts: decisionRows.reduce((acc, [, decision]) => {
      acc[decision.humanDecision] = (acc[decision.humanDecision] || 0) + 1;
      return acc;
    }, {}),
    localDetailStatuses: {
      total: statuses.length,
      canonicalLocalDetail: statuses.filter((row) => row.status === "CANONICAL_LOCAL_DETAIL").length,
      alternateRepresentation: statuses.filter((row) => row.status === "ALTERNATE_REPRESENTATION").length,
      unresolved: statuses.filter((row) => row.status === "OTHER_EXPLICITLY_DOCUMENTED_STATUS")
    },
    representationTotal: items.reduce((sum, item) => sum + toArray(item.representations).length, 0),
    localLandingTotal: items.filter((item) => item.landingType === "localDetail").length,
    externalLandingTotal: items.filter((item) => item.landingType === "externalSource").length,
    duplicateCanonicalIds: (() => {
      const seen = new Set();
      const duplicates = new Set();
      items.map(canonicalIdentity).forEach((id) => {
        if (seen.has(id)) duplicates.add(id);
        seen.add(id);
      });
      return [...duplicates];
    })()
  };

  if (report.canonicalStartingTotal !== 210) report.ok = false;
  if (report.canonicalTotal !== 218) report.ok = false;
  if (report.localDetailStatuses.unresolved.length !== 0) report.ok = false;
  if (report.duplicateCanonicalIds.length !== 0) report.ok = false;

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const canva = require("../../src/_data/canva");
const finnaAoe = require("../../src/_data/finnaAoe");
const youtube = require("../../src/_data/youtube");
const presentationContexts = require("../../src/_data/presentationContexts.json");
const {
  buildPresentationsPageSourceData,
  buildCanonicalPresentationItems
} = require("../../src/_data/presentationsPage");

const ROOT = path.join(__dirname, "..", "..");
const ACCEPTED_DECISIONS_PATH = path.join(
  ROOT,
  "docs",
  "data",
  "presentations-local-detail-curation-f3c-p2-accepted-decisions.json"
);

const allowedSourceTypes = new Set(["aoe", "canva", "ouka", "slideshare", "youtube", "other"]);
const allowedMediaTypes = new Set(["document", "slides", "unknown", "video", "videoSeries", "webMaterial"]);
const allowedLandingTypes = new Set(["externalSource", "localDetail"]);

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function readAcceptedDecisions() {
  return JSON.parse(fs.readFileSync(ACCEPTED_DECISIONS_PATH, "utf8"));
}

async function buildActualPresentationData() {
  const data = {
    canva: await canva(),
    finnaAoe: await finnaAoe(),
    youtube: await youtube(),
    presentationContexts
  };
  const sourceData = buildPresentationsPageSourceData(data);
  return {
    sourceData,
    startingItems: buildCanonicalPresentationItems({
      ...sourceData,
      applyAcceptedCuration: false
    }),
    items: buildCanonicalPresentationItems(sourceData)
  };
}

function findCanonicalPresentation(items = [], id = "") {
  return items.find((item) =>
    item.id === id ||
    item.localPageUrl === id ||
    item.pageUrl === id ||
    item.landingUrl === id ||
    item.url === id ||
    item.externalUrl === id ||
    item.sourceUrl === id
  );
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

describe("F3C-P3 presentation canonical integration", () => {
  test("keeps accepted P2 decisions integrated into the current canonical model", async () => {
    const decisions = readAcceptedDecisions();
    const decisionRows = Object.entries(decisions);
    const { sourceData, startingItems, items } = await buildActualPresentationData();
    const decisionCounts = {};

    decisionRows.forEach(([, decision]) => {
      decisionCounts[decision.humanDecision] = (decisionCounts[decision.humanDecision] || 0) + 1;
      assert.ok(decision.detailUrl);
    });

    assert.equal(decisionRows.length, 24);
    assert.equal(decisionCounts.MATCHES_EXISTING_CANONICAL, 1);
    assert.equal(decisionCounts.ALTERNATE_REPRESENTATION, 12);
    assert.equal(decisionCounts.IS_DISTINCT_LOCAL_PRESENTATION, 11);
    assert.equal(decisionCounts.CANNOT_DETERMINE || 0, 0);

    const expectedCanonicalCount = startingItems.length + decisionCounts.IS_DISTINCT_LOCAL_PRESENTATION;
    assert.equal(startingItems.length, 206);
    assert.equal(items.length, expectedCanonicalCount);
    assert.equal(items.length, 217);

    decisionRows.forEach(([caseId, decision]) => {
      if (decision.humanDecision === "MATCHES_EXISTING_CANONICAL") {
        const item = findCanonicalPresentation(items, decision.humanCanonicalId);
        assert.ok(item, caseId);
        assert.equal(item.localPageUrl, decision.detailUrl);
        assert.equal(item.hasLocalDetail, true);
        assert.equal(item.landingType, "localDetail");
        assert.equal(item.landingUrl, decision.detailUrl);
        assert.ok(
          toArray(item.representations).some((representation) =>
            representation.relationship === "canonicalLocalDetail" &&
            representation.localPageUrl === decision.detailUrl &&
            representation.provenance === `F3C-P2:${caseId}`
          ),
          caseId
        );
        return;
      }

      if (decision.humanDecision === "ALTERNATE_REPRESENTATION") {
        const item = findCanonicalPresentation(items, decision.humanCanonicalId);
        assert.ok(item, caseId);
        assert.ok(
          toArray(item.representations).some((representation) =>
            representation.relationship === "alternateRepresentation" &&
            representation.localPageUrl === decision.detailUrl &&
            representation.provenance === `F3C-P2:${caseId}`
          ),
          caseId
        );
        return;
      }

      if (decision.humanDecision === "IS_DISTINCT_LOCAL_PRESENTATION") {
        const item = items.find((candidate) => candidate.localPageUrl === decision.detailUrl);
        assert.ok(item, caseId);
        assert.equal(item.curationStatus, "human-approved-distinct-local-presentation");
        assert.equal(item.hasLocalDetail, true);
        assert.equal(item.landingType, "localDetail");
        assert.equal(item.landingUrl, decision.detailUrl);
      }
    });

    const statuses = sourceData.presentations.map((detail) => localDetailStatus(detail.pageUrl, items));
    assert.equal(statuses.filter((status) => status === "OTHER_EXPLICITLY_DOCUMENTED_STATUS").length, 0);
    assert.equal(statuses.filter((status) => status !== "OTHER_EXPLICITLY_DOCUMENTED_STATUS").length, sourceData.presentations.length);
  });

  test("keeps canonical landing, id, source, and media semantics valid", async () => {
    const { items } = await buildActualPresentationData();
    const ids = items.map(canonicalIdentity);

    assert.equal(new Set(ids).size, ids.length);

    for (const item of items) {
      assert.ok(item.title);
      assert.ok(allowedSourceTypes.has(item.sourceType), item.sourceType);
      assert.ok(allowedMediaTypes.has(item.mediaType), item.mediaType);
      assert.ok(allowedLandingTypes.has(item.landingType), item.landingType);
      assert.ok(item.landingUrl, item.title);
      assert.equal(item.hasLocalDetail, Boolean(item.localPageUrl));
      assert.equal(item.externalFirst, !item.hasLocalDetail);
      assert.equal(item.landingType, item.hasLocalDetail ? "localDetail" : "externalSource");
      assert.equal(item.landingUrl, item.hasLocalDetail ? item.localPageUrl : item.sourceUrl);

      for (const representation of toArray(item.representations)) {
        assert.ok(representation.relationship, item.title);
        assert.ok(representation.provenance, item.title);
        assert.ok(allowedSourceTypes.has(representation.sourceType), representation.sourceType);
        assert.ok(allowedMediaTypes.has(representation.mediaType), representation.mediaType);
        assert.ok(
          representation.url || representation.sourceUrl || representation.externalUrl || representation.localPageUrl,
          item.title
        );
      }
    }
  });
});

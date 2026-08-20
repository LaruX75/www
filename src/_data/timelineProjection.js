const { readCouncilMeetingCollections } = require("./councilMeetings");
const toPublicContentRecord = require("../_utils/toPublicContentRecord");
const { buildTimelineProjection } = require("../_utils/timelineProjection");

const TIMELINE_SOURCE_COLLECTIONS = Object.freeze([
  "blog",
  "politics",
  "publications"
]);

function toArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function buildTimelineSourceItems(items = []) {
  return toArray(items)
    .map((item) => toPublicContentRecord(item))
    .filter(Boolean);
}

module.exports = function timelineProjectionData() {
  const collections = readCouncilMeetingCollections();
  const sources = TIMELINE_SOURCE_COLLECTIONS.map((sourceCollection) => ({
    sourceCollection,
    items: buildTimelineSourceItems(collections[sourceCollection] || [])
  }));

  return buildTimelineProjection(sources);
};

module.exports.TIMELINE_SOURCE_COLLECTIONS = TIMELINE_SOURCE_COLLECTIONS;

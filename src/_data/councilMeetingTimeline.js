const { buildCouncilMeetingTimeline } = require("../../eleventy.filters");
const { readCouncilMeetingCollections } = require("./councilMeetings");

module.exports = function councilMeetingTimelineData() {
  return buildCouncilMeetingTimeline(readCouncilMeetingCollections(), "fi");
};

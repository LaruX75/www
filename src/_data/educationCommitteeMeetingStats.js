const buildMeetings = require("./educationCommitteeMeetings");

const meetings = buildMeetings();

module.exports = {
  periodStart: "2017-06-21",
  currentCommitteePeriodStart: "2025-06-24",
  total: meetings.length,
  sivistyslautakunta: meetings.filter((meeting) => meeting.bodyKey === "sivistyslautakunta").length,
  sivistysJaKulttuurilautakunta: meetings.filter((meeting) => meeting.bodyKey === "sivistys-ja-kulttuurilautakunta").length,
  withOwnContent: meetings.filter((meeting) => meeting.items.length).length
};

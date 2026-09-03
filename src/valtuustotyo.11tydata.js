const { buildValtuustotyoPage } = require("./_utils/valtuustotyoPage");
const councilMeetingMeta = require("./_data/councilMeetingMeta");
const oukaCouncilSpeechProtocols = require("./_data/oukaCouncilSpeechProtocols");
const councilSpeechVideos = require("./_data/councilSpeechVideos.json");

module.exports = {
  eleventyComputed: {
    // VALTUUSTOTYO-SSR-01: single-owner projection consumed by
    // src/valtuustotyo.njk. Emits speeches + initiatives + filter
    // option arrays + dashboard KPI/chart data all precomputed at
    // build time so the template renders zero runtime-JSON fetches.
    valtuustotyoPage: (data) =>
      buildValtuustotyoPage({
        collections: data.collections,
        councilMeetingMeta,
        oukaCouncilSpeechProtocols,
        councilSpeechVideos
      })
  }
};

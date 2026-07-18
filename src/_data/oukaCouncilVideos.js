/**
 * Fetches Oulu city council meeting videos from the public API.
 * Source: https://api.ouka.fi/v1/city_council_meeting_videos
 */

const { fetchWithTimeout, readCacheIfFresh, writeCache } = require("./_apiCache");

const CACHE_TTL_HOURS = 1;
const CACHE_KEY = "ouka-council-meeting-videos-v1";

function parseMeetingDateFromHeader(header = "") {
  const match = header.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00`);
}

function toFiDate(date) {
  if (!date) return "";
  return date.toLocaleDateString("fi-FI", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function normalizeVideo(item) {
  const ytMatch = item.videoid && item.videoid.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  const ytId = ytMatch ? ytMatch[1] : null;
  const publishDate = item.publish_time ? new Date(item.publish_time) : null;
  const meetingDate = parseMeetingDateFromHeader(item.header) || publishDate;

  return {
    url: item.videoid,
    youtubeId: ytId,
    thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null,
    title: item.header,
    date: meetingDate,
    dateStr: toFiDate(meetingDate),
    publishDate,
    publishDateStr: toFiDate(publishDate),
    meetingDate: meetingDate ? meetingDate.toISOString().slice(0, 10) : "",
    keyfield: item.keyfield,
  };
}

module.exports = async function () {
  const cached = readCacheIfFresh(CACHE_KEY, CACHE_TTL_HOURS);
  if (cached) return cached.data;

  const url =
    "https://api.ouka.fi/v1/city_council_meeting_videos?order=publish_time.desc&limit=100&select=videoid,publish_time,header,keyfield";

  try {
    const res = await fetchWithTimeout(url, {}, 15000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const videos = data.map(normalizeVideo);
    writeCache(CACHE_KEY, videos);
    return videos;
  } catch (err) {
    console.warn("[oukaCouncilVideos] Fetch failed:", err.message);
    return cached?.data || [];
  }
};

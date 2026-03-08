/**
 * Fetches Oulu city council meeting videos from the public API.
 * Source: https://api.ouka.fi/v1/city_council_meeting_videos
 */

const CACHE_TTL_HOURS = 24;

module.exports = async function () {
  const url =
    "https://api.ouka.fi/v1/city_council_meeting_videos?order=publish_time.desc&limit=12&select=videoid,publish_time,header,keyfield";

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    return data.map((item) => {
      // Extract YouTube video ID from URL
      const ytMatch = item.videoid && item.videoid.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
      const ytId = ytMatch ? ytMatch[1] : null;

      // Parse date from publish_time
      const date = item.publish_time ? new Date(item.publish_time) : null;

      return {
        url: item.videoid,
        youtubeId: ytId,
        thumbnail: ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null,
        title: item.header,
        date: date,
        dateStr: date
          ? date.toLocaleDateString("fi-FI", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            })
          : "",
        keyfield: item.keyfield,
      };
    });
  } catch (err) {
    console.warn("[oukaCouncilVideos] Fetch failed:", err.message);
    return [];
  }
};

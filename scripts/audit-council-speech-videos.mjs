import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLICATIONS_DIR = path.join(ROOT, "src", "publications");
const VIDEO_DATA_PATH = path.join(ROOT, "src", "_data", "councilSpeechVideos.json");
const OUKA_VIDEO_API =
  "https://api.ouka.fi/v1/city_council_meeting_videos?select=videoid,publish_time,header,keyfield&order=publish_time.desc&limit=100";

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  const fm = match ? match[1] : "";
  const get = (key) => {
    const found = fm.match(new RegExp(`^${key}:\\s*['"]?([^'"\\n]+)`, "m"));
    return found ? found[1].trim() : "";
  };
  const listValues = [...fm.matchAll(/^\s*-\s*(.+)$/gm)].map((item) => item[1].trim());
  return {
    title: get("title"),
    date: get("date"),
    event: get("event"),
    meetingDate: get("meetingDate"),
    asiakohta: get("asiakohta"),
    type: get("type"),
    source_url: get("source_url"),
    tags: listValues
  };
}

function toPermalink(fileName, date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const slug = fileName.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return `/${date.slice(0, 4)}/${date.slice(5, 7)}/${date.slice(8, 10)}/${slug}/`;
}

function parseTimestamp(value = "") {
  const clean = String(value).replace(/^#?t=/, "").replace(/s$/, "");
  if (/^\d+$/.test(clean)) return Number(clean);
  const h = clean.match(/(\d+)h/);
  const m = clean.match(/(\d+)m/);
  const s = clean.match(/(\d+)s/);
  return (Number(h?.[1] || 0) * 3600) + (Number(m?.[1] || 0) * 60) + Number(s?.[1] || 0);
}

function extractYoutubeLinks(raw) {
  const matches = [...raw.matchAll(/(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})([^\s<)]*)?/g)];
  return matches.map((match) => {
    const suffix = match[2] || "";
    const t = suffix.match(/[?&#](?:t|start)=([^&#\s]+)/);
    const start = t ? parseTimestamp(t[1]) : null;
    return {
      youtubeId: match[1],
      start,
      url: `https://www.youtube.com/watch?v=${match[1]}${start ? `&t=${start}s` : ""}`
    };
  });
}

function isCouncilSpeech(fileName, raw, data) {
  const haystack = `${fileName} ${data.title} ${data.event} ${data.asiakohta} ${data.tags.join(" ")}`;
  return (
    data.type === "puhe" &&
    /kaupunginvaltuusto|valtuusto/i.test(haystack) &&
    !/aluevaltuusto/i.test(haystack)
  );
}

function parseMeetingDateFromHeader(header = "") {
  const match = header.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return "";
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeVideo(item) {
  const youtubeId = item.videoid?.match(/[?&]v=([a-zA-Z0-9_-]{11})/)?.[1] || "";
  const meetingDate = parseMeetingDateFromHeader(item.header) || item.publish_time?.slice(0, 10) || "";
  return {
    meetingDate,
    youtubeId,
    url: item.videoid || "",
    title: item.header || "",
    keyfield: item.keyfield || null
  };
}

async function fetchOukaVideos() {
  try {
    const response = await fetch(OUKA_VIDEO_API);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()).map(normalizeVideo);
  } catch (error) {
    return { error: error.message, videos: [] };
  }
}

const configuredVideos = JSON.parse(readFile(VIDEO_DATA_PATH)).byUrl || {};
const oukaResult = await fetchOukaVideos();
const oukaVideos = Array.isArray(oukaResult) ? oukaResult : oukaResult.videos;
const oukaByDate = new Map();

for (const video of oukaVideos) {
  if (!video.meetingDate) continue;
  const list = oukaByDate.get(video.meetingDate) || [];
  list.push(video);
  oukaByDate.set(video.meetingDate, list);
}

const rows = [];
for (const fileName of fs.readdirSync(PUBLICATIONS_DIR).filter((file) => file.endsWith(".md"))) {
  const filePath = path.join(PUBLICATIONS_DIR, fileName);
  const raw = readFile(filePath);
  const data = parseFrontmatter(raw);
  if (!isCouncilSpeech(fileName, raw, data)) continue;

  const meetingDate = data.meetingDate || data.date;
  const permalink = toPermalink(fileName, data.date);
  const bodyLinks = extractYoutubeLinks(raw);
  const timedBodyLinks = bodyLinks.filter((link) => link.start !== null);
  const configured = configuredVideos[permalink] || configuredVideos[data.source_url] || [];
  const candidateVideos = oukaByDate.get(meetingDate) || [];

  let status = "needs_timestamp";
  if (configured.length > 0) status = "ok_configured";
  else if (timedBodyLinks.length > 0) status = "has_body_timestamp_not_migrated";
  else if (candidateVideos.length > 0) status = "video_candidate_found";
  else status = "needs_video_and_timestamp";

  rows.push({
    status,
    date: data.date,
    meetingDate,
    title: data.title,
    file: `src/publications/${fileName}`,
    permalink,
    sourceUrl: data.source_url,
    asiakohta: data.asiakohta,
    configuredCount: configured.length,
    bodyTimestampCount: timedBodyLinks.length,
    candidateVideoIds: candidateVideos.map((video) => video.youtubeId).filter(Boolean)
  });
}

const summary = rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] || 0) + 1;
  return acc;
}, {});

console.log(JSON.stringify({
  totalCouncilSpeeches: rows.length,
  oukaVideoApiItems: oukaVideos.length,
  oukaApiError: Array.isArray(oukaResult) ? null : oukaResult.error,
  summary,
  rows
}, null, 2));

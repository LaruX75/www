import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const PUBLICATIONS_DIR = path.join(ROOT, "src", "publications");
const VIDEO_DATA_PATH = path.join(ROOT, "src", "_data", "councilSpeechVideos.json");
const CACHE_DIR = path.join(ROOT, ".cache", "council-youtube");
const TRANSCRIPT_DIR = path.join(CACHE_DIR, "transcripts");
const PLAYLIST_CACHE = path.join(CACHE_DIR, "playlist.json");
const REPORT_PATH = path.join(ROOT, "reports", "council-speech-video-time-candidates.json");
const PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLkcwgUIxt-HlQzW_0p6h16VqGd_9omsvy";

const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, value = "true"] = arg.replace(/^--/, "").split("=");
  return [key, value];
}));

const refreshPlaylist = args.get("refresh-playlist") === "true";
const refreshTranscripts = args.get("refresh-transcripts") === "true";
const onlyDate = args.get("date") || "";
const maxVideos = Number(args.get("max-videos") || 0);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  const fm = match ? match[1] : "";
  const body = match ? raw.slice(match[0].length) : raw;
  const get = (key) => {
    const found = fm.match(new RegExp(`^${key}:\\s*['"]?([^'"\\n]+)`, "m"));
    return found ? found[1].trim() : "";
  };
  const listValues = [...fm.matchAll(/^\s*-\s*(.+)$/gm)].map((item) => item[1].trim());
  return {
    body,
    data: {
      title: get("title"),
      date: get("date"),
      event: get("event"),
      meetingDate: get("meetingDate"),
      asiakohta: get("asiakohta"),
      type: get("type"),
      source_url: get("source_url"),
      tags: listValues
    }
  };
}

function toPermalink(fileName, date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const slug = fileName.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return `/${date.slice(0, 4)}/${date.slice(5, 7)}/${date.slice(8, 10)}/${slug}/`;
}

function isCouncilSpeech(fileName, raw, data) {
  const haystack = `${fileName} ${data.title} ${data.event} ${data.asiakohta} ${data.tags.join(" ")}`;
  return (
    data.type === "puhe" &&
    /kaupunginvaltuusto|valtuusto/i.test(haystack) &&
    !/aluevaltuusto/i.test(haystack)
  );
}

function parseMeetingDateFromTitle(title = "") {
  const match = title.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return "";
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function loadPlaylist() {
  const cached = readJson(PLAYLIST_CACHE);
  if (cached && !refreshPlaylist) return cached;

  const output = execFileSync("yt-dlp", [
    "--flat-playlist",
    "--print",
    "%(id)s\t%(title)s",
    PLAYLIST_URL
  ], { encoding: "utf8", maxBuffer: 1024 * 1024 * 4 });

  const videos = output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [youtubeId, ...titleParts] = line.split("\t");
      const title = titleParts.join("\t").trim();
      return {
        youtubeId,
        title,
        meetingDate: parseMeetingDateFromTitle(title),
        url: `https://www.youtube.com/watch?v=${youtubeId}`
      };
    })
    .filter((video) => video.youtubeId && video.title);

  writeJson(PLAYLIST_CACHE, {
    savedAt: new Date().toISOString(),
    source: PLAYLIST_URL,
    videos
  });

  return { savedAt: new Date().toISOString(), source: PLAYLIST_URL, videos };
}

function transcriptPath(videoId) {
  return path.join(TRANSCRIPT_DIR, `${videoId}.fi.json3`);
}

function downloadTranscript(videoId) {
  const finalPath = transcriptPath(videoId);
  if (fs.existsSync(finalPath) && !refreshTranscripts) return finalPath;

  ensureDir(TRANSCRIPT_DIR);
  const template = path.join(TRANSCRIPT_DIR, `${videoId}.%(ext)s`);

  try {
    execFileSync("yt-dlp", [
      "--skip-download",
      "--write-subs",
      "--write-auto-subs",
      "--sub-langs",
      "fi",
      "--sub-format",
      "json3",
      "-o",
      template,
      `https://www.youtube.com/watch?v=${videoId}`
    ], { stdio: "pipe", encoding: "utf8", maxBuffer: 1024 * 1024 * 4 });
  } catch (error) {
    return null;
  }

  const downloaded = fs.readdirSync(TRANSCRIPT_DIR)
    .find((file) => file.startsWith(`${videoId}.fi`) && file.endsWith(".json3"));

  if (!downloaded) return null;
  const downloadedPath = path.join(TRANSCRIPT_DIR, downloaded);
  if (downloadedPath !== finalPath) fs.renameSync(downloadedPath, finalPath);
  return finalPath;
}

function transcriptRows(filePath) {
  const data = readJson(filePath);
  if (!data?.events) return [];
  return data.events
    .map((event) => ({
      start: Math.round((event.tStartMs || 0) / 1000),
      text: (event.segs || [])
        .map((segment) => segment.utf8 || "")
        .join("")
        .replace(/\s+/g, " ")
        .trim()
    }))
    .filter((row) => row.text);
}

function stripToText(value = "") {
  return String(value)
    .replace(/^---[\s\S]*?---/, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#*_>`()[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value = "") {
  return stripToText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9åäö\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function importantTerms(text = "") {
  const stop = new Set([
    "arvoisa", "puheenjohtaja", "hyvat", "valtuutetut", "kiitos", "oulun", "kaupungin",
    "kaupunginvaltuusto", "puheenvuoro", "kohdassa", "kasitteli", "tassa", "etta", "joka",
    "joita", "tulee", "pitää", "pitaa", "myos", "ovat", "olla", "olen", "asia", "asiassa"
  ]);
  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length >= 5 && !stop.has(word))
    .slice(0, 180);
}

function scoreWindow(speechTerms, text) {
  const windowTerms = new Set(importantTerms(text));
  return speechTerms.reduce((score, term) => score + (windowTerms.has(term) ? 1 : 0), 0);
}

function markerWeight({ speakerLine, chairIntro, previousChairIntro }) {
  if (speakerLine && previousChairIntro) return 7;
  if (speakerLine) return 5;
  if (chairIntro) return 2;
  return 1;
}

function findSpeakerHits(rows, speechText) {
  const terms = importantTerms(speechText);
  const hitsByStart = new Map();

  rows.forEach((row, index) => {
    const prev = rows[index - 1]?.text || "";
    const speakerLine = /(?:^|\s)(?:JARI\s+LARU|VALTUUTETTU\s+LARU)\s*:/i.test(row.text);
    const chairIntro = /(?:VALTUUTETTU\s+)?LARU.*(?:OLKAA|OLE)\s+HYV[AÄ]/i.test(row.text);
    const previousChairIntro = speakerLine && /(?:VALTUUTETTU\s+)?LARU.*(?:OLKAA|OLE)\s+HYV[AÄ]/i.test(prev);

    if (!speakerLine && !chairIntro) return;

    const nextSpeakerIndex = rows
      .slice(index + 1, index + 8)
      .findIndex((item) => /(?:^|\s)(?:JARI\s+LARU|VALTUUTETTU\s+LARU)\s*:/i.test(item.text) && item.start - row.start <= 20);
    const nextSpeakerRow = nextSpeakerIndex >= 0 ? rows[index + 1 + nextSpeakerIndex] : null;
    if (chairIntro && !nextSpeakerRow) return;

    const start = chairIntro && nextSpeakerRow ? nextSpeakerRow.start : row.start;
    const introStart = chairIntro && start !== row.start ? row.start : null;
    const startIndex = start === row.start ? index : index + 1 + nextSpeakerIndex;
    const nextWindow = rows.slice(startIndex, startIndex + 36).map((item) => item.text).join(" ");
    const contentScore = scoreWindow(terms, nextWindow);
    const score = (contentScore * 4) + markerWeight({ speakerLine: speakerLine || Boolean(nextSpeakerRow), chairIntro, previousChairIntro });
    const hit = {
      start,
      introStart,
      url: "",
      marker: row.text.slice(0, 180),
      score,
      contentScore,
      preview: nextWindow.slice(0, 420)
    };

    const existing = hitsByStart.get(start);
    if (!existing || hit.score > existing.score || (hit.score === existing.score && (hit.introStart ?? hit.start) < (existing.introStart ?? existing.start))) {
      hitsByStart.set(start, hit);
    }
  });

  return [...hitsByStart.values()]
    .filter((hit, _index, allHits) => hit.contentScore > 0 || !allHits.some((item) => item.contentScore > 0))
    .sort((a, b) => b.score - a.score || b.contentScore - a.contentScore || a.start - b.start);
}

function loadCouncilSpeeches() {
  return fs.readdirSync(PUBLICATIONS_DIR)
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const filePath = path.join(PUBLICATIONS_DIR, fileName);
      const raw = fs.readFileSync(filePath, "utf8");
      const { body, data } = parseFrontmatter(raw);
      return { fileName, raw, body, data };
    })
    .filter(({ fileName, raw, data }) => isCouncilSpeech(fileName, raw, data))
    .map(({ fileName, body, data }) => ({
      title: data.title,
      file: `src/publications/${fileName}`,
      date: data.date,
      meetingDate: data.meetingDate || data.date,
      permalink: toPermalink(fileName, data.date),
      sourceUrl: data.source_url,
      asiakohta: data.asiakohta,
      text: `${data.title} ${data.asiakohta} ${stripToText(body)}`
    }))
    .filter((speech) => !onlyDate || speech.meetingDate === onlyDate);
}

function configuredVideoCount(speech, configuredVideos) {
  return (configuredVideos[speech.permalink] || configuredVideos[speech.sourceUrl] || []).length;
}

const playlist = loadPlaylist();
const videosByDate = new Map();
for (const video of playlist.videos) {
  if (!video.meetingDate) continue;
  const list = videosByDate.get(video.meetingDate) || [];
  list.push(video);
  videosByDate.set(video.meetingDate, list);
}

const configuredVideos = readJson(VIDEO_DATA_PATH, { byUrl: {} }).byUrl || {};
const speeches = loadCouncilSpeeches();
const uniqueVideoIds = [...new Set(speeches
  .flatMap((speech) => videosByDate.get(speech.meetingDate) || [])
  .map((video) => video.youtubeId))];
const selectedVideoIds = maxVideos > 0 ? uniqueVideoIds.slice(0, maxVideos) : uniqueVideoIds;
const transcriptCache = new Map();

for (const videoId of selectedVideoIds) {
  const filePath = downloadTranscript(videoId);
  transcriptCache.set(videoId, filePath ? transcriptRows(filePath) : null);
}

const rows = speeches.map((speech) => {
  const videos = videosByDate.get(speech.meetingDate) || [];
  const configuredCount = configuredVideoCount(speech, configuredVideos);
  const candidates = videos.map((video) => {
    const rowsForVideo = transcriptCache.has(video.youtubeId) ? transcriptCache.get(video.youtubeId) : null;
    const hits = rowsForVideo ? findSpeakerHits(rowsForVideo, speech.text) : [];
    return {
      youtubeId: video.youtubeId,
      title: video.title,
      url: video.url,
      transcript: rowsForVideo ? "available" : "missing_or_not_checked",
      speakerHits: hits.slice(0, 8).map((hit) => ({
        ...hit,
        url: `${video.url}&t=${hit.start}s`
      })),
      bestStart: hits[0]?.start ?? null,
      bestUrl: hits[0] ? `${video.url}&t=${hits[0].start}s` : ""
    };
  });

  let status = "needs_video";
  if (configuredCount > 0) status = "already_configured";
  else if (!videos.length) status = "no_playlist_video";
  else if (candidates.some((candidate) => candidate.speakerHits.length)) status = "speaker_hits_found";
  else if (candidates.some((candidate) => candidate.transcript === "available")) status = "transcript_without_laru_hit";
  else status = "video_found_no_transcript";

  return {
    status,
    configuredCount,
    title: speech.title,
    file: speech.file,
    date: speech.date,
    meetingDate: speech.meetingDate,
    asiakohta: speech.asiakohta,
    permalink: speech.permalink,
    videoCandidates: candidates
  };
});

const summary = rows.reduce((acc, row) => {
  acc[row.status] = (acc[row.status] || 0) + 1;
  return acc;
}, {});

const report = {
  generatedAt: new Date().toISOString(),
  playlist: {
    source: PLAYLIST_URL,
    videoCount: playlist.videos.length,
    savedAt: playlist.savedAt
  },
  transcriptVideosChecked: selectedVideoIds.length,
  totalCouncilSpeeches: rows.length,
  summary,
  rows
};

writeJson(REPORT_PATH, report);
console.log(JSON.stringify({
  reportPath: path.relative(ROOT, REPORT_PATH),
  transcriptCache: path.relative(ROOT, TRANSCRIPT_DIR),
  ...report,
  rows: rows.slice(0, 12)
}, null, 2));

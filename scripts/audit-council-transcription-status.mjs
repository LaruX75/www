import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "reports");
const AUDIO_DIR = path.join(ROOT, ".cache", "council-youtube", "whisper", "audio");
const CHUNK_ROOT = path.join(ROOT, ".cache", "council-youtube", "whisper", "transcripts", "chunks");
const MEETING_VIDEO_DATA = path.join(ROOT, "src", "_data", "councilMeetingYoutubeVideos.json");
const SPEECH_VIDEO_DATA = path.join(ROOT, "src", "_data", "councilSpeechVideos.json");
const QUEUE_STATUS = path.join(REPORT_DIR, "council-video-transcription-queue-status.json");
const OUT_JSON = path.join(REPORT_DIR, "council-video-transcription-audit.json");
const OUT_MD = path.join(REPORT_DIR, "council-video-transcription-audit.md");

const strictName = /jari\s+laru|valtuutettu\s+laru|\blaru\b|\blarun\b|\blaaru\b|\blauru\b/i;
const looseName = /valtuutettu\s+(?:la|lar|laar|laur|lalu)/i;
const speechContext = /olkaa\s+hyv[aä]|arvoisa\s+puheenjohtaja|puheenjohtaja|kannatan|esit[aä]n|kysyn|haluan\s+nostaa|valtuutettu\s+laru/i;
const listContext = /nimenhuuto|poissa|l[aä]sn[aä]|varaj[aä]sen|lautakunta|valitaan|j[aä]seneksi|[a-zåäö]+,\s+[a-zåäö]+,\s+[a-zåäö]+,/i;
const referenceContext = /laru\s+puhui|larun\s+puheenvuoro|vastauksena\s+larulle|valtuutettu\s+larulle/i;

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
}

function durationSeconds(audioPath) {
  if (!fs.existsSync(audioPath)) return 0;
  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audioPath],
    { encoding: "utf8" }
  );
  if (result.status !== 0) return 0;
  return Math.ceil(Number(result.stdout.trim()) || 0);
}

function allMeetingVideos() {
  const data = readJson(MEETING_VIDEO_DATA, { byDate: {} });
  return Object.entries(data.byDate || {})
    .flatMap(([date, videos]) => (videos || []).map((video) => ({ date, ...video })))
    .sort((a, b) => `${a.date}:${a.youtubeId}`.localeCompare(`${b.date}:${b.youtubeId}`));
}

function linkedSpeechVideos() {
  const data = readJson(SPEECH_VIDEO_DATA, { byUrl: {} });
  const byYoutubeId = new Map();
  for (const [pageUrl, videos] of Object.entries(data.byUrl || {})) {
    for (const video of videos || []) {
      if (!video.youtubeId) continue;
      if (!byYoutubeId.has(video.youtubeId)) byYoutubeId.set(video.youtubeId, []);
      byYoutubeId.get(video.youtubeId).push({
        pageUrl,
        start: video.start ?? null,
        label: video.label || "",
        verified: Boolean(video.verified)
      });
    }
  }
  for (const items of byYoutubeId.values()) {
    items.sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
  }
  return byYoutubeId;
}

function chunkFiles(youtubeId) {
  const candidates = [];
  for (const dir of [CHUNK_ROOT, path.join(CHUNK_ROOT, "10s"), path.join(CHUNK_ROOT, "60s")]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const match = name.match(new RegExp(`^${youtubeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-chunk-(\\d+)\\.json$`));
      if (match) {
        candidates.push({
          filePath: path.join(dir, name),
          chunkIndex: Number(match[1]),
          chunkSeconds: path.basename(dir) === "10s" ? 10 : path.basename(dir) === "60s" ? 60 : 30
        });
      }
    }
  }
  return candidates.sort((a, b) => a.chunkSeconds - b.chunkSeconds || a.chunkIndex - b.chunkIndex);
}

function segmentText(json) {
  if (Array.isArray(json?.transcription)) return json.transcription;
  if (Array.isArray(json?.segments)) return json.segments;
  return [];
}

function classifyHit(text) {
  if (referenceContext.test(text)) return "viittaus aiempaan puheenvuoroon";
  if (speechContext.test(text) && !listContext.test(text)) return "puhe-ehdokas";
  if (listContext.test(text)) return "nimilista/valinta";
  return "tarkistettava osuma";
}

function scanHits(files) {
  const hits = [];
  for (const item of files) {
    const json = readJson(item.filePath, {});
    for (const segment of segmentText(json)) {
      const text = String(segment.text || "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      const isStrict = strictName.test(text);
      const isLoose = !isStrict && looseName.test(text);
      if (!isStrict && !isLoose) continue;
      const segmentOffsetSeconds = Number(segment.start || 0) || Number(segment.offsets?.from || 0) / 1000 || 0;
      const startsAt = item.chunkIndex * item.chunkSeconds + segmentOffsetSeconds;
      hits.push({
        startsAt,
        time: formatTime(startsAt),
        type: isStrict ? "strict" : "loose",
        classification: classifyHit(text),
        text
      });
    }
  }
  return hits.sort((a, b) => a.startsAt - b.startsAt);
}

function statusFor(video, linkedByVideo) {
  const audioPath = path.join(AUDIO_DIR, `${video.youtubeId}.wav`);
  const duration = durationSeconds(audioPath);
  const files = chunkFiles(video.youtubeId);
  const byChunkLength = new Map();
  for (const file of files) {
    if (!byChunkLength.has(file.chunkSeconds)) byChunkLength.set(file.chunkSeconds, []);
    byChunkLength.get(file.chunkSeconds).push(file);
  }
  const preferredChunkSeconds = byChunkLength.has(60) ? 60 : byChunkLength.has(30) ? 30 : byChunkLength.has(10) ? 10 : 60;
  const preferredFiles = byChunkLength.get(preferredChunkSeconds) || [];
  const expectedChunks = duration > 0 ? Math.ceil(duration / preferredChunkSeconds) : 0;
  const completedChunks = new Set(preferredFiles.map((file) => file.chunkIndex)).size;
  const completion =
    expectedChunks > 0 && completedChunks >= expectedChunks
      ? "valmis"
      : completedChunks > 0
        ? "kesken"
        : fs.existsSync(audioPath)
          ? "audio valmis, ei litteroitu"
          : "ei audioa";

  return {
    date: video.date,
    youtubeId: video.youtubeId,
    title: video.title,
    url: video.url,
    audio: fs.existsSync(audioPath),
    durationSeconds: duration,
    duration: duration ? formatTime(duration) : "",
    chunkSeconds: preferredChunkSeconds,
    completedChunks,
    expectedChunks,
    completion,
    linkedSpeechPages: linkedByVideo.get(video.youtubeId) || [],
    hits: scanHits(preferredFiles).slice(0, 40)
  };
}

function markdownTable(rows) {
  const header = "| Päivä | Video | Tila | Linkitettyjä puhesivuja | Osumat | Huomio |\n|---|---|---:|---:|---:|---|";
  const body = rows.map((row) => {
    const speechCandidates = row.hits.filter((hit) => hit.classification === "puhe-ehdokas").length;
    const mentions = row.hits.length - speechCandidates;
    const note = speechCandidates > 0
      ? `${speechCandidates} puhe-ehdokasta`
      : row.hits.length > 0
        ? `${mentions} nimimainintaa/viittausta`
        : "";
    const title = row.url ? `[${row.title}](${row.url})` : row.title;
    return `| ${row.date} | ${title} | ${row.completion} ${row.completedChunks}/${row.expectedChunks || "?"} | ${row.linkedSpeechPages.length} | ${row.hits.length} | ${note} |`;
  });
  return [header, ...body].join("\n");
}

function main() {
  const videos = allMeetingVideos();
  const linkedByVideo = linkedSpeechVideos();
  const rows = videos
    .filter((video) => fs.existsSync(path.join(AUDIO_DIR, `${video.youtubeId}.wav`)) || linkedByVideo.has(video.youtubeId))
    .map((video) => statusFor(video, linkedByVideo));
  const queue = readJson(QUEUE_STATUS, null);
  const report = {
    generatedAt: new Date().toISOString(),
    queue,
    summary: {
      videos: rows.length,
      complete: rows.filter((row) => row.completion === "valmis").length,
      partial: rows.filter((row) => row.completion === "kesken").length,
      withSpeechCandidates: rows.filter((row) => row.hits.some((hit) => hit.classification === "puhe-ehdokas")).length,
      withLinkedSpeechPages: rows.filter((row) => row.linkedSpeechPages.length > 0).length
    },
    rows
  };

  writeJson(OUT_JSON, report);
  const md = [
    "# Valtuustovideoiden litterointitarkastus",
    "",
    `Päivitetty: ${report.generatedAt}`,
    "",
    `Yhteenveto: ${report.summary.videos} videota, ${report.summary.complete} valmista litterointia, ${report.summary.partial} kesken, ${report.summary.withSpeechCandidates} videossa puhe-ehdokas.`,
    "",
    markdownTable(rows),
    ""
  ].join("\n");
  fs.writeFileSync(OUT_MD, md);
  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
}

main();

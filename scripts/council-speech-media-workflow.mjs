import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const PUBLICATIONS_DIR = path.join(ROOT, "src", "publications");
const VIDEO_DATA_PATH = path.join(ROOT, "src", "_data", "councilSpeechVideos.json");
const MEETING_VIDEO_DATA_PATH = path.join(ROOT, "src", "_data", "councilMeetingYoutubeVideos.json");
const CACHE_DIR = path.join(ROOT, ".cache", "council-youtube");
const WHISPER_AUDIO_DIR = path.join(CACHE_DIR, "whisper", "audio");
const WHISPER_TRANSCRIPT_DIR = path.join(CACHE_DIR, "whisper", "transcripts");
const WHISPER_LOG_DIR = path.join(CACHE_DIR, "whisper", "logs");
const MACWHISPER_INDEX_PATH = path.join(CACHE_DIR, "macwhisper-transcripts", "index.json");
const REPORT_PATH = path.join(ROOT, "reports", "council-speech-media-workflow.json");

const DEFAULT_CPP_MODEL = path.join(
  process.env.HOME || "",
  "Library",
  "Application Support",
  "MacWhisper",
  "models",
  "ggml-model-whisper-base.bin"
);

function parseArgs(argv) {
  const args = {
    list: false,
    transcribeNext: false,
    url: "",
    youtubeId: "",
    model: DEFAULT_CPP_MODEL,
    whisperBin: "whisper-cli",
    threads: 8,
    chunkSeconds: 900,
    maxChunks: 0,
    startChunk: 0,
    windowSeconds: 150,
    forceChunk: false
  };

  for (const raw of argv) {
    if (raw === "--list") args.list = true;
    else if (raw === "--transcribe-next") args.transcribeNext = true;
    else if (raw === "--force-chunk") args.forceChunk = true;
    else if (raw.startsWith("--url=")) args.url = raw.slice("--url=".length);
    else if (raw.startsWith("--youtube-id=")) args.youtubeId = raw.slice("--youtube-id=".length);
    else if (raw.startsWith("--model=")) args.model = raw.slice("--model=".length);
    else if (raw.startsWith("--whisper-bin=")) args.whisperBin = raw.slice("--whisper-bin=".length);
    else if (raw.startsWith("--threads=")) args.threads = Number(raw.slice("--threads=".length) || args.threads);
    else if (raw.startsWith("--chunk-seconds=")) args.chunkSeconds = Number(raw.slice("--chunk-seconds=".length) || args.chunkSeconds);
    else if (raw.startsWith("--max-chunks=")) args.maxChunks = Number(raw.slice("--max-chunks=".length) || args.maxChunks);
    else if (raw.startsWith("--start-chunk=")) args.startChunk = Number(raw.slice("--start-chunk=".length) || args.startChunk);
    else if (raw.startsWith("--window-seconds=")) args.windowSeconds = Number(raw.slice("--window-seconds=".length) || args.windowSeconds);
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));

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
  const list = (key) => {
    const found = fm.match(new RegExp(`^${key}:\\s*\\n([\\s\\S]*?)(?=^[a-zA-Z_][a-zA-Z0-9_-]*:|\\Z)`, "m"));
    return found
      ? [...found[1].matchAll(/^\\s*-\\s*(.+)$/gm)].map((item) => item[1].trim())
      : [];
  };

  return {
    body,
    data: {
      title: get("title"),
      date: get("date"),
      meetingDate: get("meetingDate"),
      event: get("event"),
      asiakohta: get("asiakohta"),
      type: get("type"),
      sourceUrl: get("source_url"),
      eventType: list("eventType"),
      forum: list("forum"),
      tags: list("tags")
    }
  };
}

function toPermalink(fileName, date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
  const slug = fileName.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return `/${date.slice(0, 4)}/${date.slice(5, 7)}/${date.slice(8, 10)}/${slug}/`;
}

function stripToText(value = "") {
  return String(value)
    .replace(/^---[\s\S]*?---/, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#*_>`()[\\]{}|]/g, " ")
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
    "arvoisa", "puheenjohtaja", "hyvat", "hyvät", "valtuutetut", "kiitos",
    "oulun", "oulu", "kaupungin", "kaupunginvaltuusto", "valtuusto",
    "puheenvuoro", "kohdassa", "kasitteli", "käsitteli", "tassa", "tässä",
    "etta", "että", "joka", "joita", "tulee", "pitää", "pitaa", "myos",
    "myös", "ovat", "olla", "olen", "asia", "asiassa", "kysyn", "kysyin",
    "esitin", "koski", "keskustelussa"
  ]);

  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length >= 5 && !stop.has(word))
    .slice(0, 260);
}

function extractAnchorPhrases(text = "") {
  return stripToText(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => normalizeText(line))
    .filter((line) => line.length >= 30 && line.length <= 190)
    .slice(0, 50);
}

function isCouncilSpeech(fileName, raw, data) {
  const haystack = normalizeText(`${fileName} ${data.title} ${data.event} ${data.asiakohta} ${data.forum.join(" ")} ${data.tags.join(" ")}`);
  return data.type === "puhe" && /kaupunginvaltuusto|valtuusto/.test(haystack) && !/aluevaltuusto/.test(haystack);
}

function loadCouncilSpeeches() {
  const configuredVideos = readJson(VIDEO_DATA_PATH, { byUrl: {} }).byUrl || {};
  const speeches = [];

  for (const fileName of fs.readdirSync(PUBLICATIONS_DIR).filter((file) => file.endsWith(".md"))) {
    const filePath = path.join(PUBLICATIONS_DIR, fileName);
    const raw = fs.readFileSync(filePath, "utf8");
    const { body, data } = parseFrontmatter(raw);
    if (!isCouncilSpeech(fileName, raw, data)) continue;

    const permalink = toPermalink(fileName, data.date);
    const configured = [
      ...(configuredVideos[permalink] || []),
      ...(data.sourceUrl ? (configuredVideos[data.sourceUrl] || []) : [])
    ];
    const uniqueConfigured = [];
    const seenConfigured = new Set();
    for (const video of configured) {
      const key = `${video.youtubeId || ""}:${video.start || ""}:${video.label || ""}`;
      if (seenConfigured.has(key)) continue;
      seenConfigured.add(key);
      uniqueConfigured.push(video);
    }

    speeches.push({
      file: path.relative(ROOT, filePath),
      permalink,
      title: data.title,
      date: data.meetingDate || data.date,
      publishedDate: data.date,
      asiakohta: data.asiakohta,
      event: data.event,
      eventType: data.eventType,
      sourceUrl: data.sourceUrl,
      text: `${data.title} ${data.asiakohta} ${data.event} ${stripToText(body)}`,
      body,
      configuredVideos: uniqueConfigured
    });
  }

  return speeches.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function audioPath(youtubeId) {
  return path.join(WHISPER_AUDIO_DIR, `${youtubeId}.wav`);
}

function whisperTranscriptPath(youtubeId) {
  return path.join(WHISPER_TRANSCRIPT_DIR, `${youtubeId}.json`);
}

function youtubeTranscriptPath(youtubeId) {
  return path.join(CACHE_DIR, "transcripts", `${youtubeId}.fi.json3`);
}

function chunkTranscriptPath(youtubeId, chunkIndex) {
  return path.join(WHISPER_TRANSCRIPT_DIR, "chunks", `${youtubeId}-chunk-${String(chunkIndex).padStart(3, "0")}.json`);
}

function chunkTranscriptCount(youtubeId) {
  const chunkDir = path.join(WHISPER_TRANSCRIPT_DIR, "chunks");
  if (!fs.existsSync(chunkDir)) return 0;
  return fs.readdirSync(chunkDir).filter((file) => file.startsWith(`${youtubeId}-chunk-`) && file.endsWith(".json")).length;
}

function chunkTranscriptProgress(youtubeId) {
  const count = chunkTranscriptCount(youtubeId);
  const stagePath = path.join(ROOT, "reports", `council-speech-cpu-transcription-${youtubeId}.json`);
  const stage = readJson(stagePath, null);
  const expected = stage?.durationSeconds && stage?.chunkSeconds
    ? Math.ceil(stage.durationSeconds / stage.chunkSeconds)
    : 0;
  return {
    count,
    expected,
    complete: Boolean(expected && count >= expected)
  };
}

function attendancePrecheckStatus(youtubeId) {
  const transcript = chunkTranscriptPath(youtubeId, 0);
  const status = {
    status: "not_checked",
    transcript: fs.existsSync(transcript) ? path.relative(ROOT, transcript) : null,
    finding: "",
    preview: ""
  };
  if (!status.transcript) return status;

  const rows = transcriptRows(transcript, 0).filter((row) => row.start <= 900);
  const text = normalizeText(rows.map((row) => row.text).join(" "));
  status.preview = rows.map((row) => row.text).join(" ").replace(/\s+/g, " ").slice(0, 500);

  const laruMatch = text.match(/\b(jari\s+laru|laru|larun)\b/);
  if (!laruMatch) {
    status.status = "continue_no_explicit_absence";
    status.finding = "Opening transcript does not explicitly mark Jari Laru absent; continue review.";
    return status;
  }

  const laruIndex = laruMatch.index || 0;
  const context = text.slice(Math.max(0, laruIndex - 180), laruIndex + 180);
  if (/poissa|poissaolev|este|varavaltuutet/.test(context)) {
    status.status = "explicit_absence_review";
    status.finding = "Opening transcript mentions Jari Laru near absence-related words; skip only after confirming absence.";
    return status;
  }

  status.status = "continue_laru_mentioned";
  status.finding = "Opening transcript mentions Jari Laru, but not as explicitly absent; continue review.";
  return status;
}

function transcriptStatus(youtubeId) {
  const chunkProgress = chunkTranscriptProgress(youtubeId);
  return {
    youtubeId,
    audio: fs.existsSync(audioPath(youtubeId)) ? path.relative(ROOT, audioPath(youtubeId)) : null,
    whisperTranscript: fs.existsSync(whisperTranscriptPath(youtubeId)) ? path.relative(ROOT, whisperTranscriptPath(youtubeId)) : null,
    youtubeTranscript: fs.existsSync(youtubeTranscriptPath(youtubeId)) ? path.relative(ROOT, youtubeTranscriptPath(youtubeId)) : null,
    chunkTranscripts: chunkProgress.count,
    expectedChunks: chunkProgress.expected,
    chunkTranscriptComplete: chunkProgress.complete
  };
}

function loadMeetingVideosByDate() {
  const byDate = readJson(MEETING_VIDEO_DATA_PATH, { byDate: {} }).byDate || {};
  return new Map(Object.entries(byDate));
}

function loadMacWhisperDates() {
  const index = readJson(MACWHISPER_INDEX_PATH, { sessions: [] });
  const dates = new Set();
  for (const session of index.sessions || []) {
    const title = `${session.title || ""} ${session.originalFilename || ""}`;
    const match = title.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (!match) continue;
    const [, day, month, year] = match;
    dates.add(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  }
  return dates;
}

function buildWorkflowReport() {
  const speeches = loadCouncilSpeeches();
  const meetingVideosByDate = loadMeetingVideosByDate();
  const macWhisperDates = loadMacWhisperDates();
  const configuredYoutubeIds = new Set();

  const rows = speeches.map((speech) => {
    for (const video of speech.configuredVideos) {
      if (video.youtubeId) configuredYoutubeIds.add(video.youtubeId);
    }

    const videos = speech.configuredVideos.map((video) => ({
      ...video,
      hasStart: Number.isFinite(Number(video.start)) && Number(video.start) > 0,
      transcript: transcriptStatus(video.youtubeId)
    }));
    const hasVideo = videos.length > 0;
    const hasTimestamp = videos.some((video) => video.hasStart);
    const isCouncilMeeting = /kaupunginvaltuuston kokous|kaupunginvaltuusto käsitteli/i.test(`${speech.event} ${speech.body}`) || Boolean(speech.asiakohta);
    const needsManualSourceReview = !hasVideo && !isCouncilMeeting;

    return {
      date: speech.date,
      publishedDate: speech.publishedDate,
      title: speech.title,
      permalink: speech.permalink,
      file: speech.file,
      asiakohta: speech.asiakohta,
      event: speech.event,
      eventType: speech.eventType,
      status: needsManualSourceReview ? "manual_source_review" : (!hasVideo ? "missing_video" : (!hasTimestamp ? "missing_timestamp" : "ok")),
      meetingVideoCandidates: !hasVideo ? (meetingVideosByDate.get(speech.date) || []) : [],
      macWhisperTranscriptAvailableForDate: macWhisperDates.has(speech.date),
      videos
    };
  });

  const missingVideo = rows.filter((row) => row.status === "missing_video");
  const missingTimestamp = rows.filter((row) => row.status === "missing_timestamp");
  const manualSourceReview = rows.filter((row) => row.status === "manual_source_review");
  const missingTranscript = rows
    .flatMap((row) => row.videos.map((video) => ({ row, video })))
    .filter(({ video }) => video.youtubeId && !video.transcript.whisperTranscript && !video.transcript.youtubeTranscript);
  const completeChunkTranscript = missingTranscript.filter(({ video }) => video.transcript.chunkTranscriptComplete);
  const partialTranscript = missingTranscript.filter(({ video }) => video.transcript.chunkTranscripts > 0 && !video.transcript.chunkTranscriptComplete);
  const noTranscriptStarted = missingTranscript.filter(({ video }) => video.transcript.chunkTranscripts === 0);

  const speechDates = new Set(speeches.map((speech) => speech.date));
  const meetingVideosWithoutSpeechPage = [...meetingVideosByDate.entries()]
    .filter(([date]) => !speechDates.has(date))
    .flatMap(([date, videos]) => videos.map((video) => ({
      date,
      ...video,
      attendancePrecheck: attendancePrecheckStatus(video.youtubeId),
      transcript: transcriptStatus(video.youtubeId)
    })));

  const attendancePrecheck = {
    notChecked: meetingVideosWithoutSpeechPage.filter((video) => video.attendancePrecheck.status === "not_checked").length,
    continueNoExplicitAbsence: meetingVideosWithoutSpeechPage.filter((video) => video.attendancePrecheck.status === "continue_no_explicit_absence").length,
    continueLaruMentioned: meetingVideosWithoutSpeechPage.filter((video) => video.attendancePrecheck.status === "continue_laru_mentioned").length,
    explicitAbsenceReview: meetingVideosWithoutSpeechPage.filter((video) => video.attendancePrecheck.status === "explicit_absence_review").length
  };

  const report = {
    generatedAt: new Date().toISOString(),
    totalCouncilSpeeches: rows.length,
    summary: {
      ok: rows.filter((row) => row.status === "ok").length,
      missingVideo: missingVideo.length,
      missingTimestamp: missingTimestamp.length,
      manualSourceReview: manualSourceReview.length,
      missingTranscript: missingTranscript.length,
      completeChunkTranscript: completeChunkTranscript.length,
      partialTranscript: partialTranscript.length,
      noTranscriptStarted: noTranscriptStarted.length,
      meetingVideosWithoutSpeechPage: meetingVideosWithoutSpeechPage.length,
      attendancePrecheck
    },
    missingVideo,
    manualSourceReview,
    missingTimestamp,
    missingTranscript: missingTranscript.map(({ row, video }) => ({
      date: row.date,
      title: row.title,
      permalink: row.permalink,
      file: row.file,
      youtubeId: video.youtubeId,
      hasAudio: Boolean(video.transcript.audio),
      chunkTranscripts: video.transcript.chunkTranscripts,
      expectedChunks: video.transcript.expectedChunks,
      chunkTranscriptComplete: video.transcript.chunkTranscriptComplete,
      transcript: video.transcript
    })),
    meetingVideosWithoutSpeechPage,
    rows
  };

  writeJson(REPORT_PATH, report);
  return report;
}

function printWorkflowReport(report) {
  console.log(`Report: ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`Council speeches: ${report.totalCouncilSpeeches}`);
  console.log(`OK: ${report.summary.ok}`);
  console.log(`Missing video: ${report.summary.missingVideo}`);
  console.log(`Missing timestamp: ${report.summary.missingTimestamp}`);
  console.log(`Manual source review: ${report.summary.manualSourceReview}`);
  console.log(`Missing transcript: ${report.summary.missingTranscript}`);
  console.log(`Complete chunk transcript: ${report.summary.completeChunkTranscript}`);
  console.log(`Partial transcript: ${report.summary.partialTranscript}`);
  console.log(`No transcript started: ${report.summary.noTranscriptStarted}`);
  console.log(`Meeting videos without speech page: ${report.summary.meetingVideosWithoutSpeechPage}`);
  console.log(`Attendance precheck: ${JSON.stringify(report.summary.attendancePrecheck)}`);

  if (report.missingVideo.length) {
    console.log("\nMissing video links:");
    for (const row of report.missingVideo) {
      console.log(`- ${row.date} ${row.title}`);
      console.log(`  ${row.permalink}`);
      if (row.meetingVideoCandidates.length) {
        console.log(`  candidates: ${row.meetingVideoCandidates.map((video) => video.youtubeId).join(", ")}`);
      }
    }
  }

  if (report.missingTimestamp.length) {
    console.log("\nMissing timestamps:");
    for (const row of report.missingTimestamp) {
      const ids = row.videos.map((video) => video.youtubeId).filter(Boolean).join(", ");
      console.log(`- ${row.date} ${row.title}`);
      console.log(`  ${row.permalink}`);
      console.log(`  videos: ${ids}`);
    }
  }

  if (report.manualSourceReview.length) {
    console.log("\nManual source review:");
    for (const row of report.manualSourceReview) {
      console.log(`- ${row.date} ${row.title}`);
      console.log(`  ${row.permalink}`);
      console.log(`  event: ${row.event || "(no event)"}`);
    }
  }

  if (report.missingTranscript.length) {
    console.log("\nMissing transcripts:");
    for (const item of report.missingTranscript) {
      console.log(`- ${item.youtubeId} ${item.date} ${item.title} audio=${item.hasAudio ? "yes" : "no"} chunks=${item.chunkTranscripts}/${item.expectedChunks || "?"}${item.chunkTranscriptComplete ? " complete" : ""}`);
    }
  }
}

function printWorkflowSummary(report) {
  console.log(`Workflow report: ${path.relative(ROOT, REPORT_PATH)}`);
  console.log([
    `council speeches=${report.totalCouncilSpeeches}`,
    `ok=${report.summary.ok}`,
    `missing video=${report.summary.missingVideo}`,
    `missing timestamp=${report.summary.missingTimestamp}`,
    `manual source review=${report.summary.manualSourceReview}`,
    `missing transcript=${report.summary.missingTranscript}`,
    `complete chunk transcript=${report.summary.completeChunkTranscript}`,
    `partial transcript=${report.summary.partialTranscript}`,
    `no transcript started=${report.summary.noTranscriptStarted}`,
    `meeting videos without speech page=${report.summary.meetingVideosWithoutSpeechPage}`,
    `attendance not checked=${report.summary.attendancePrecheck.notChecked}`
  ].join(" | "));
}

function run(command, commandArgs, options = {}) {
  console.log(`$ ${[command, ...commandArgs].join(" ")}`);
  if (!options.logPath) {
    execFileSync(command, commandArgs, {
      cwd: ROOT,
      stdio: "inherit",
      maxBuffer: 1024 * 1024 * 64
    });
    return;
  }

  ensureDir(path.dirname(options.logPath));
  const logFd = fs.openSync(options.logPath, "a");
  try {
    fs.writeSync(logFd, `\n$ ${[command, ...commandArgs].join(" ")}\n`);
    execFileSync(command, commandArgs, {
      cwd: ROOT,
      stdio: ["ignore", logFd, logFd],
      maxBuffer: 1024 * 1024 * 64
    });
  } finally {
    fs.closeSync(logFd);
  }
}

function audioDurationSeconds(filePath) {
  const output = execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath
  ], { encoding: "utf8" }).trim();
  return Number(output || 0);
}

function parseTimestamp(value = "") {
  const match = String(value).match(/(\d+):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return 0;
  const [, hours, minutes, seconds, ms] = match;
  return (Number(hours) * 3600) + (Number(minutes) * 60) + Number(seconds) + (Number(ms) / 1000);
}

function transcriptRows(filePath, offsetSeconds = 0) {
  const data = readJson(filePath, {});
  const rows = [];
  const maybeOffset = (rawStart) => {
    const start = Number(rawStart || 0);
    if (!offsetSeconds) return start;
    // whisper.cpp's --offset-t writes absolute timestamps; other JSON formats
    // may still be chunk-relative. Only add the chunk offset when the segment
    // clearly starts near zero.
    return start < Math.min(60, offsetSeconds * 0.25) ? offsetSeconds + start : start;
  };

  if (Array.isArray(data.segments)) {
    for (const segment of data.segments) {
      const start = maybeOffset(segment.start);
      const end = maybeOffset(segment.end ?? segment.start);
      rows.push({
        start,
        end,
        text: String(segment.text || "").trim()
      });
    }
  }

  if (Array.isArray(data.transcription)) {
    for (const segment of data.transcription) {
      const rawStart = typeof segment.offsets?.from === "number" ? segment.offsets.from / 1000 : parseTimestamp(segment.timestamps?.from);
      const rawEnd = typeof segment.offsets?.to === "number" ? segment.offsets.to / 1000 : parseTimestamp(segment.timestamps?.to);
      rows.push({
        start: maybeOffset(rawStart),
        end: maybeOffset(rawEnd || rawStart),
        text: String(segment.text || "").trim()
      });
    }
  }

  return rows.filter((row) => row.text);
}

function scoreWindow(speech, rows, startIndex) {
  const speechTerms = new Set(importantTerms(speech.text));
  const anchors = extractAnchorPhrases(speech.body);
  const start = rows[startIndex].start;
  const windowRows = rows.slice(startIndex).filter((row) => row.start - start <= args.windowSeconds);
  const beforeRows = rows.filter((row) => row.start >= Math.max(0, start - 45) && row.start < start);
  const windowText = windowRows.map((row) => row.text).join(" ");
  const anchorText = `${beforeRows.map((row) => row.text).join(" ")} ${windowText}`;
  const normalizedWindow = normalizeText(windowText);
  const normalizedAnchor = normalizeText(anchorText);
  const windowTerms = new Set(importantTerms(windowText));
  let overlap = 0;

  for (const term of speechTerms) {
    if (windowTerms.has(term)) overlap += 1;
  }

  const speakerBoost = /jari\s+laru|valtuutettu\s+laru|laru\s+ole\s+hyva|laru\s+olkaa\s+hyva/.test(normalizedAnchor) ? 28 : 0;
  const anchorHits = anchors.filter((anchor) => {
    const terms = importantTerms(anchor);
    if (!terms.length) return false;
    const hits = terms.filter((term) => windowTerms.has(term)).length;
    return hits >= Math.min(4, Math.ceil(terms.length * 0.45));
  }).length;
  const exactishBoost = anchors.some((anchor) => normalizedWindow.includes(anchor.slice(0, 35))) ? 30 : 0;

  return {
    score: overlap + (anchorHits * 12) + speakerBoost + exactishBoost,
    overlap,
    anchorHits,
    speakerBoost,
    exactishBoost,
    preview: windowText.replace(/\s+/g, " ").slice(0, 900)
  };
}

function findCandidates(speech, rows) {
  return rows
    .map((row, index) => ({
      start: Math.max(0, Math.round(row.start)),
      end: Math.max(0, Math.round(row.end || row.start)),
      ...scoreWindow(speech, rows, index)
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.start - b.start)
    .slice(0, 12);
}

function findSpeechForTarget(report) {
  let target = null;
  if (args.url) target = report.rows.find((row) => row.permalink === args.url);
  if (!target && args.youtubeId) {
    target = report.rows.find((row) => row.videos.some((video) => video.youtubeId === args.youtubeId));
  }
  if (!target && args.transcribeNext) target = report.missingTimestamp[0] || report.missingTranscript[0];
  if (!target) throw new Error("No transcription target. Use --url=... or --youtube-id=... or --transcribe-next.");

  const speech = loadCouncilSpeeches().find((item) => item.permalink === target.permalink);
  const video = target.videos?.find((item) => !item.hasStart || item.youtubeId === args.youtubeId) || target.videos?.[0];
  if (!speech || !video?.youtubeId) throw new Error(`Target has no configured video: ${target.permalink}`);
  return { speech, video };
}

function transcribeChunk({ youtubeId, audio, chunkIndex, offsetSeconds, durationSeconds }) {
  ensureDir(path.dirname(chunkTranscriptPath(youtubeId, chunkIndex)));
  const finalPath = chunkTranscriptPath(youtubeId, chunkIndex);
  const logPath = path.join(WHISPER_LOG_DIR, `${youtubeId}-chunk-${String(chunkIndex).padStart(3, "0")}.log`);
  if (fs.existsSync(finalPath) && !args.forceChunk) {
    return { path: finalPath, logPath, cached: true };
  }

  const outputStem = finalPath.replace(/\.json$/, "");
  run(args.whisperBin, [
    "--language", "fi",
    "--model", args.model,
    "--file", audio,
    "--output-json",
    "--output-file", outputStem,
    "--threads", String(args.threads),
    "--no-gpu",
    "--no-prints",
    "--offset-t", String(Math.round(offsetSeconds * 1000)),
    "--duration", String(Math.round(durationSeconds * 1000))
  ], { logPath });

  if (!fs.existsSync(finalPath)) throw new Error(`Missing chunk transcript: ${path.relative(ROOT, finalPath)}`);
  return { path: finalPath, logPath, cached: false };
}

function transcribeTarget(report) {
  const { speech, video } = findSpeechForTarget(report);
  const youtubeId = video.youtubeId;
  const audio = audioPath(youtubeId);
  if (!fs.existsSync(audio)) {
    throw new Error(`Audio missing for ${youtubeId}: ${path.relative(ROOT, audio)}. Download it with yt-dlp first.`);
  }
  if (!fs.existsSync(args.model)) throw new Error(`Whisper model missing: ${args.model}`);

  const duration = audioDurationSeconds(audio);
  const chunkCount = Math.ceil(duration / args.chunkSeconds);
  const endChunk = args.maxChunks > 0 ? Math.min(chunkCount, args.startChunk + args.maxChunks) : chunkCount;
  const stage = {
    generatedAt: new Date().toISOString(),
    mode: "cpu-chunked-whisper",
    youtubeId,
    title: speech.title,
    permalink: speech.permalink,
    audio: path.relative(ROOT, audio),
    model: args.model,
    durationSeconds: Math.round(duration),
    chunkSeconds: args.chunkSeconds,
    startChunk: args.startChunk,
    endChunk,
    chunks: [],
    candidates: []
  };

  console.log(`CPU transcription target: ${speech.title}`);
  console.log(`Video: https://www.youtube.com/watch?v=${youtubeId}`);
  console.log(`Audio: ${path.relative(ROOT, audio)} (${Math.round(duration / 60)} min)`);
  console.log(`Chunks: ${args.startChunk + 1}-${endChunk} / ${chunkCount}`);

  let allRows = [];
  for (let chunkIndex = args.startChunk; chunkIndex < endChunk; chunkIndex += 1) {
    const offsetSeconds = chunkIndex * args.chunkSeconds;
    const durationSeconds = Math.min(args.chunkSeconds, Math.max(0, duration - offsetSeconds));
    console.log(`\n[chunk ${chunkIndex + 1}/${chunkCount}] ${Math.round(offsetSeconds)}s + ${Math.round(durationSeconds)}s`);
    const transcript = transcribeChunk({ youtubeId, audio, chunkIndex, offsetSeconds, durationSeconds });
    const rows = transcriptRows(transcript.path, offsetSeconds);
    const candidates = findCandidates(speech, rows).map((candidate) => ({
      ...candidate,
      url: `https://www.youtube.com/watch?v=${youtubeId}&t=${candidate.start}s`
    }));

    stage.chunks.push({
      chunkIndex,
      offsetSeconds,
      durationSeconds,
      transcript: path.relative(ROOT, transcript.path),
      log: path.relative(ROOT, transcript.logPath),
      cached: transcript.cached,
      segmentCount: rows.length,
      bestCandidate: candidates[0] || null
    });
    allRows = allRows.concat(rows);
    console.log(`Status: ${transcript.cached ? "cached" : "transcribed"} | segments=${rows.length} | transcript=${path.relative(ROOT, transcript.path)}`);
    console.log(`Log: ${path.relative(ROOT, transcript.logPath)}`);
    if (candidates[0]) {
      console.log(`Best in chunk: ${candidates[0].start}s score=${candidates[0].score}`);
      console.log(candidates[0].preview);
    } else {
      console.log("No candidate in chunk.");
    }
  }

  stage.candidates = findCandidates(speech, allRows).map((candidate) => ({
    ...candidate,
    url: `https://www.youtube.com/watch?v=${youtubeId}&t=${candidate.start}s`
  }));
  stage.bestCandidate = stage.candidates[0] || null;

  const stagePath = path.join(ROOT, "reports", `council-speech-cpu-transcription-${youtubeId}.json`);
  writeJson(stagePath, stage);
  console.log(`\nStage report: ${path.relative(ROOT, stagePath)}`);
  if (stage.bestCandidate) {
    console.log(`Best overall: ${stage.bestCandidate.url} score=${stage.bestCandidate.score}`);
  } else {
    console.log("Best overall: no candidate yet");
  }
}

const report = buildWorkflowReport();

if (args.list || (!args.transcribeNext && !args.url && !args.youtubeId)) {
  printWorkflowReport(report);
} else {
  printWorkflowSummary(report);
  console.log("\n--- CPU transcription ---");
  transcribeTarget(report);
}

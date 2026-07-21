import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const AUDIO_DIR = path.join(ROOT, ".cache", "council-youtube", "whisper", "audio");
const REPORT_DIR = path.join(ROOT, "reports");
const VIDEO_DATA_PATH = path.join(ROOT, "src", "_data", "councilMeetingYoutubeVideos.json");

function parseArgs(argv) {
  const args = {
    engine: "mw",
    chunkSeconds: 60,
    batchChunks: 1,
    threads: 8,
    chunkTimeoutSeconds: 420,
    retryDelaySeconds: 30,
    maxAttemptsPerChunk: 3,
    allAudio: false
  };

  for (const raw of argv) {
    if (raw === "--all-audio") args.allAudio = true;
    else if (raw.startsWith("--engine=")) args.engine = raw.slice("--engine=".length);
    else if (raw.startsWith("--chunk-seconds=")) args.chunkSeconds = Number(raw.slice("--chunk-seconds=".length));
    else if (raw.startsWith("--batch-chunks=")) args.batchChunks = Number(raw.slice("--batch-chunks=".length));
    else if (raw.startsWith("--threads=")) args.threads = Number(raw.slice("--threads=".length));
    else if (raw.startsWith("--chunk-timeout-seconds=")) args.chunkTimeoutSeconds = Number(raw.slice("--chunk-timeout-seconds=".length));
    else if (raw.startsWith("--retry-delay-seconds=")) args.retryDelaySeconds = Number(raw.slice("--retry-delay-seconds=".length));
    else if (raw.startsWith("--max-attempts-per-chunk=")) args.maxAttemptsPerChunk = Number(raw.slice("--max-attempts-per-chunk=".length));
  }

  return args;
}

function readJson(filePath, fallback) {
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

function audioIds() {
  if (!fs.existsSync(AUDIO_DIR)) return new Set();
  return new Set(
    fs.readdirSync(AUDIO_DIR)
      .filter((file) => file.endsWith(".wav"))
      .map((file) => file.replace(/\.wav$/, ""))
  );
}

function councilVideoRows() {
  const data = readJson(VIDEO_DATA_PATH, { byDate: {} });
  const rows = [];
  for (const [date, items] of Object.entries(data.byDate || {})) {
    for (const item of items || []) {
      rows.push({
        date,
        youtubeId: item.youtubeId,
        title: item.title,
        url: item.url
      });
    }
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.youtubeId.localeCompare(b.youtubeId));
  return rows;
}

function queueItems(args) {
  const availableAudioIds = audioIds();
  if (args.allAudio) {
    return [...availableAudioIds].sort().map((youtubeId) => ({ youtubeId, date: "", title: "", url: "" }));
  }

  return councilVideoRows().filter((item) => availableAudioIds.has(item.youtubeId));
}

function statusPath() {
  return path.join(REPORT_DIR, "council-video-transcription-queue-status.json");
}

function runVideo(args, item) {
  const commandArgs = [
    "scripts/supervise-council-video-chunks.mjs",
    `--youtube-id=${item.youtubeId}`,
    `--chunk-seconds=${args.chunkSeconds}`,
    `--batch-chunks=${args.batchChunks}`,
    `--threads=${args.threads}`,
    `--chunk-timeout-seconds=${args.chunkTimeoutSeconds}`,
    `--retry-delay-seconds=${args.retryDelaySeconds}`,
    `--max-attempts-per-chunk=${args.maxAttemptsPerChunk}`,
    `--engine=${args.engine}`
  ];

  return spawnSync(process.execPath, commandArgs, {
    cwd: ROOT,
    stdio: "inherit",
    encoding: "utf8"
  });
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const items = queueItems(args);
  const startedAt = new Date().toISOString();
  const completed = [];
  const failed = [];

  if (items.length === 0) {
    throw new Error("No local council video audio files found for the queue.");
  }

  writeJson(statusPath(), {
    startedAt,
    updatedAt: startedAt,
    state: "running",
    mode: args.allAudio ? "all-audio" : "council-meeting-audio",
    engine: args.engine,
    total: items.length,
    currentIndex: 0,
    current: items[0],
    completed,
    failed
  });

  console.log(`[${startedAt}] queue started, videos=${items.length}`);
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    writeJson(statusPath(), {
      startedAt,
      updatedAt: new Date().toISOString(),
      state: "running",
      mode: args.allAudio ? "all-audio" : "council-meeting-audio",
      engine: args.engine,
      total: items.length,
      currentIndex: index,
      current: item,
      completed,
      failed
    });

    console.log(`[${new Date().toISOString()}] ${index + 1}/${items.length} ${item.date || ""} ${item.youtubeId} ${item.title || ""}`.trim());
    const result = runVideo(args, item);
    if (result.status === 0) completed.push(item);
    else failed.push({ ...item, exitCode: result.status ?? 1 });
  }

  writeJson(statusPath(), {
    startedAt,
    updatedAt: new Date().toISOString(),
    state: failed.length > 0 ? "complete-with-failures" : "complete",
    mode: args.allAudio ? "all-audio" : "council-meeting-audio",
    engine: args.engine,
    total: items.length,
    currentIndex: items.length,
    current: null,
    completed,
    failed
  });
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}

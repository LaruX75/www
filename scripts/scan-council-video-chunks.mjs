import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const CACHE_DIR = path.join(ROOT, ".cache", "council-youtube", "whisper");
const AUDIO_DIR = path.join(CACHE_DIR, "audio");
const CHUNK_DIR = path.join(CACHE_DIR, "transcripts", "chunks");
const LOG_DIR = path.join(CACHE_DIR, "logs");
const CHUNK_AUDIO_DIR = path.join(CACHE_DIR, "chunk-audio");
const DEFAULT_MODEL = path.join(
  process.env.HOME || "",
  "Library",
  "Application Support",
  "MacWhisper",
  "models",
  "ggml-model-whisper-base.bin"
);

function parseArgs(argv) {
  const args = {
    youtubeId: "",
    model: DEFAULT_MODEL,
    whisperBin: "whisper-cli",
    chunkSeconds: 900,
    startChunk: 0,
    maxChunks: 0,
    threads: 8,
    precut: false,
    force: false
  };
  for (const raw of argv) {
    if (raw === "--force") args.force = true;
    else if (raw === "--precut") args.precut = true;
    else if (raw.startsWith("--youtube-id=")) args.youtubeId = raw.slice("--youtube-id=".length);
    else if (raw.startsWith("--model=")) args.model = raw.slice("--model=".length);
    else if (raw.startsWith("--whisper-bin=")) args.whisperBin = raw.slice("--whisper-bin=".length);
    else if (raw.startsWith("--chunk-seconds=")) args.chunkSeconds = Number(raw.slice("--chunk-seconds=".length));
    else if (raw.startsWith("--start-chunk=")) args.startChunk = Number(raw.slice("--start-chunk=".length));
    else if (raw.startsWith("--max-chunks=")) args.maxChunks = Number(raw.slice("--max-chunks=".length));
    else if (raw.startsWith("--threads=")) args.threads = Number(raw.slice("--threads=".length));
  }
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: options.stdio || "inherit", encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} exited with ${result.status}`);
  }
  return result;
}

function durationSeconds(audioPath) {
  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audioPath],
    { encoding: "utf8" }
  );
  if (result.status !== 0) return 0;
  return Math.ceil(Number(result.stdout.trim()) || 0);
}

function chunkPath(youtubeId, index) {
  return path.join(CHUNK_DIR, `${youtubeId}-chunk-${String(index).padStart(3, "0")}.json`);
}

function logPath(youtubeId, index) {
  return path.join(LOG_DIR, `${youtubeId}-chunk-${String(index).padStart(3, "0")}.log`);
}

function chunkAudioPath(youtubeId, index, chunkSeconds) {
  return path.join(CHUNK_AUDIO_DIR, `${youtubeId}-${chunkSeconds}s-chunk-${String(index).padStart(3, "0")}.wav`);
}

function formatMs(ms) {
  let seconds = Math.floor(Number(ms || 0) / 1000);
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const strictName = /jari\s+laru|valtuutettu\s+laru|\blaru\b|\blarun\b|\blaaru\b|\blauru\b/i;
const looseName = /valtuutettu\s+(?:la|lar|laar|laur|lalu)/i;

function scanChunk(filePath, baseMs = 0) {
  const json = readJson(filePath);
  const segments = json.transcription || json.segments || [];
  const hits = [];
  const looseHits = [];
  for (const segment of segments) {
    const text = String(segment.text || "").replace(/\s+/g, " ").trim();
    const from = baseMs + (segment.offsets?.from ?? Math.round(Number(segment.start || 0) * 1000));
    if (strictName.test(text)) hits.push({ from, text });
    else if (looseName.test(text)) looseHits.push({ from, text });
  }
  return { segments: segments.length, hits, looseHits };
}

function extractChunkAudio(args, audioPath, chunkIndex, logFd) {
  ensureDir(CHUNK_AUDIO_DIR);
  const chunkAudio = chunkAudioPath(args.youtubeId, chunkIndex, args.chunkSeconds);
  if (fs.existsSync(chunkAudio) && !args.force) return chunkAudio;

  const offsetSeconds = chunkIndex * args.chunkSeconds;
  const ffmpegArgs = [
    "-y",
    "-ss", String(offsetSeconds),
    "-t", String(args.chunkSeconds),
    "-i", audioPath,
    "-ac", "1",
    "-ar", "16000",
    "-vn",
    chunkAudio
  ];
  const result = spawnSync("ffmpeg", ffmpegArgs, {
    cwd: ROOT,
    stdio: ["ignore", logFd, logFd],
    encoding: "utf8"
  });
  if (result.status !== 0) throw new Error(`ffmpeg exited with ${result.status}; see chunk log`);
  return chunkAudio;
}

function transcribeChunk(args, audioPath, chunkIndex) {
  ensureDir(CHUNK_DIR);
  ensureDir(LOG_DIR);
  const outputBase = chunkPath(args.youtubeId, chunkIndex).replace(/\.json$/, "");
  const log = logPath(args.youtubeId, chunkIndex);
  const offsetMs = chunkIndex * args.chunkSeconds * 1000;
  const durationMs = args.chunkSeconds * 1000;
  let whisperAudioPath = audioPath;
  let timingArgs = [
    "--offset-t", String(offsetMs),
    "--duration", String(durationMs)
  ];

  const fd = fs.openSync(log, "w");
  try {
    if (args.precut) {
      whisperAudioPath = extractChunkAudio(args, audioPath, chunkIndex, fd);
      timingArgs = [];
    }

    const whisperArgs = [
      "--language", "fi",
      "--model", args.model,
      "--file", whisperAudioPath,
      "--output-json",
      "--output-file", outputBase,
      "--threads", String(args.threads),
      "--no-gpu",
      "--no-prints",
      ...timingArgs
    ];

    const result = spawnSync(args.whisperBin, whisperArgs, {
      cwd: ROOT,
      stdio: ["ignore", fd, fd],
      encoding: "utf8"
    });
    if (result.status !== 0) throw new Error(`${args.whisperBin} exited with ${result.status}; see ${path.relative(ROOT, log)}`);
  } finally {
    fs.closeSync(fd);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.youtubeId) throw new Error("Missing --youtube-id");

  const audio = path.join(AUDIO_DIR, `${args.youtubeId}.wav`);
  if (!fs.existsSync(audio)) throw new Error(`Missing audio: ${path.relative(ROOT, audio)}`);
  if (!fs.existsSync(args.model)) throw new Error(`Missing model: ${args.model}`);

  const totalSeconds = durationSeconds(audio);
  const expectedChunks = Math.ceil(totalSeconds / args.chunkSeconds);
  const endChunk = args.maxChunks > 0
    ? Math.min(expectedChunks, args.startChunk + args.maxChunks)
    : expectedChunks;

  console.log(`Video ${args.youtubeId}: ${totalSeconds}s, chunks ${args.startChunk}-${endChunk - 1}/${expectedChunks}`);

  for (let chunkIndex = args.startChunk; chunkIndex < endChunk; chunkIndex += 1) {
    const filePath = chunkPath(args.youtubeId, chunkIndex);
    if (!fs.existsSync(filePath) || args.force) {
      console.log(`Transcribing chunk ${chunkIndex}...`);
      transcribeChunk(args, audio, chunkIndex);
    } else {
      console.log(`Using existing chunk ${chunkIndex}.`);
    }

    const chunkStartMs = chunkIndex * args.chunkSeconds * 1000;
    const result = scanChunk(filePath, args.precut ? chunkStartMs : 0);
    const label = `chunk ${chunkIndex} ${formatMs(chunkStartMs)}`;
    console.log(`${label}: segments=${result.segments} strict=${result.hits.length} loose=${result.looseHits.length}`);
    for (const hit of result.hits) console.log(`  STRICT ${formatMs(hit.from)} ${hit.text}`);
    for (const hit of result.looseHits.slice(0, 8)) console.log(`  LOOSE ${formatMs(hit.from)} ${hit.text}`);
  }
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

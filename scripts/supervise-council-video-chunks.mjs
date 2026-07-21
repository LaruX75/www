import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const CHUNK_ROOT = path.join(ROOT, ".cache", "council-youtube", "whisper", "transcripts", "chunks");
const AUDIO_DIR = path.join(ROOT, ".cache", "council-youtube", "whisper", "audio");
const REPORT_DIR = path.join(ROOT, "reports");

function parseArgs(argv) {
  const args = {
    youtubeId: "",
    engine: "whisper-cli",
    chunkSeconds: 60,
    batchChunks: 1,
    threads: 8,
    chunkTimeoutSeconds: 420,
    retryDelaySeconds: 30,
    maxAttemptsPerChunk: 3,
    precut: true,
    whisperBin: "whisper-cli",
    mwBin: "/Applications/MacWhisper.app/Contents/MacOS/mw",
    mwModel: "whisper-cpp:ggml-model-whisper-base",
    model: path.join(
      process.env.HOME || "",
      "Library",
      "Application Support",
      "MacWhisper",
      "models",
      "ggml-model-whisper-base.bin"
    )
  };

  for (const raw of argv) {
    if (raw === "--no-precut") args.precut = false;
    else if (raw.startsWith("--engine=")) args.engine = raw.slice("--engine=".length);
    else if (raw.startsWith("--youtube-id=")) args.youtubeId = raw.slice("--youtube-id=".length);
    else if (raw.startsWith("--chunk-seconds=")) args.chunkSeconds = Number(raw.slice("--chunk-seconds=".length));
    else if (raw.startsWith("--batch-chunks=")) args.batchChunks = Number(raw.slice("--batch-chunks=".length));
    else if (raw.startsWith("--threads=")) args.threads = Number(raw.slice("--threads=".length));
    else if (raw.startsWith("--chunk-timeout-seconds=")) args.chunkTimeoutSeconds = Number(raw.slice("--chunk-timeout-seconds=".length));
    else if (raw.startsWith("--retry-delay-seconds=")) args.retryDelaySeconds = Number(raw.slice("--retry-delay-seconds=".length));
    else if (raw.startsWith("--max-attempts-per-chunk=")) args.maxAttemptsPerChunk = Number(raw.slice("--max-attempts-per-chunk=".length));
    else if (raw.startsWith("--whisper-bin=")) args.whisperBin = raw.slice("--whisper-bin=".length);
    else if (raw.startsWith("--mw-bin=")) args.mwBin = raw.slice("--mw-bin=".length);
    else if (raw.startsWith("--mw-model=")) args.mwModel = raw.slice("--mw-model=".length);
    else if (raw.startsWith("--model=")) args.model = raw.slice("--model=".length);
  }

  if (!args.youtubeId) throw new Error("Missing --youtube-id");
  args.chunkSeconds = Math.max(1, args.chunkSeconds || 60);
  args.batchChunks = Math.max(1, args.batchChunks || 1);
  args.threads = Math.max(1, args.threads || 8);
  args.chunkTimeoutSeconds = Math.max(30, args.chunkTimeoutSeconds || 420);
  args.retryDelaySeconds = Math.max(1, args.retryDelaySeconds || 30);
  args.maxAttemptsPerChunk = Math.max(1, args.maxAttemptsPerChunk || 3);
  return args;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function chunkPath(youtubeId, index, chunkSeconds) {
  return path.join(CHUNK_ROOT, `${chunkSeconds}s`, `${youtubeId}-chunk-${String(index).padStart(3, "0")}.json`);
}

function statusPath(youtubeId) {
  return path.join(REPORT_DIR, `${youtubeId}-chunk-supervisor-status.json`);
}

function stopPath(youtubeId) {
  return path.join(REPORT_DIR, `${youtubeId}-chunk-supervisor.stop`);
}

function audioPath(youtubeId) {
  return path.join(AUDIO_DIR, `${youtubeId}.wav`);
}

function durationSeconds(audio) {
  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audio],
    { encoding: "utf8" }
  );
  if (result.status !== 0) throw new Error(`ffprobe failed for ${path.relative(ROOT, audio)}`);
  return Math.ceil(Number(result.stdout.trim()) || 0);
}

function validChunk(filePath) {
  try {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size === 0) return false;
    const json = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const rows = json.transcription || json.segments || [];
    return Array.isArray(rows);
  } catch {
    return false;
  }
}

function countValidChunks(youtubeId, expectedChunks, chunkSeconds) {
  let count = 0;
  for (let index = 0; index < expectedChunks; index += 1) {
    if (validChunk(chunkPath(youtubeId, index, chunkSeconds))) count += 1;
  }
  return count;
}

function firstMissingChunk(youtubeId, expectedChunks, chunkSeconds, failedChunks = []) {
  const failed = new Set(failedChunks);
  for (let index = 0; index < expectedChunks; index += 1) {
    if (!failed.has(index) && !validChunk(chunkPath(youtubeId, index, chunkSeconds))) return index;
  }
  return -1;
}

function writeStatus(args, patch) {
  ensureDir(REPORT_DIR);
  const previous = fs.existsSync(statusPath(args.youtubeId))
    ? JSON.parse(fs.readFileSync(statusPath(args.youtubeId), "utf8"))
    : {};
  const status = {
    ...previous,
    ...patch,
    pid: process.pid,
    youtubeId: args.youtubeId,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(statusPath(args.youtubeId), `${JSON.stringify(status, null, 2)}\n`);
}

function sleep(seconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.max(1, seconds) * 1000);
}

function runBatch(args, startChunk, expectedChunks) {
  const maxChunks = Math.min(args.batchChunks, expectedChunks - startChunk);
  const scanArgs = [
    "scripts/scan-council-video-chunks.mjs",
    `--youtube-id=${args.youtubeId}`,
    `--chunk-seconds=${args.chunkSeconds}`,
    `--start-chunk=${startChunk}`,
    `--max-chunks=${maxChunks}`,
    `--threads=${args.threads}`,
    `--engine=${args.engine}`,
    `--whisper-bin=${args.whisperBin}`,
    `--model=${args.model}`,
    `--mw-bin=${args.mwBin}`,
    `--mw-model=${args.mwModel}`
  ];
  if (args.precut) scanArgs.push("--precut");

  console.log(`[${new Date().toISOString()}] start chunk ${startChunk}, batch ${maxChunks}`);
  const result = spawnSync(process.execPath, scanArgs, {
    cwd: ROOT,
    stdio: "inherit",
    encoding: "utf8",
    timeout: args.chunkTimeoutSeconds * 1000
  });
  if (result.error?.code === "ETIMEDOUT") {
    console.log(`[${new Date().toISOString()}] chunk ${startChunk} timed out after ${args.chunkTimeoutSeconds}s`);
  }
  console.log(`[${new Date().toISOString()}] chunk ${startChunk} exit ${result.status}`);
  if (validChunk(chunkPath(args.youtubeId, startChunk, args.chunkSeconds))) return 0;
  return result.status ?? 1;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  ensureDir(path.join(CHUNK_ROOT, `${args.chunkSeconds}s`));
  ensureDir(REPORT_DIR);

  const audio = audioPath(args.youtubeId);
  if (!fs.existsSync(audio)) throw new Error(`Missing audio: ${path.relative(ROOT, audio)}`);
  if (!fs.existsSync(args.model)) throw new Error(`Missing model: ${args.model}`);

  const totalSeconds = durationSeconds(audio);
  const expectedChunks = Math.ceil(totalSeconds / args.chunkSeconds);
  const startedAt = new Date().toISOString();
  console.log(`[${startedAt}] supervisor started for ${args.youtubeId}`);
  console.log(`Audio: ${path.relative(ROOT, audio)} (${Math.round(totalSeconds / 60)} min)`);
  console.log(`Chunks: ${expectedChunks} x ${args.chunkSeconds}s`);

  writeStatus(args, {
    startedAt,
    state: "running",
    engine: args.engine,
    totalSeconds,
    chunkSeconds: args.chunkSeconds,
    expectedChunks,
    completedChunks: countValidChunks(args.youtubeId, expectedChunks, args.chunkSeconds),
    nextChunk: firstMissingChunk(args.youtubeId, expectedChunks, args.chunkSeconds),
    failedChunks: [],
    chunkPathPattern: path.relative(ROOT, chunkPath(args.youtubeId, 0, args.chunkSeconds)).replace("000", "###"),
    lastExitCode: null
  });
  const attempts = new Map();
  const failedChunks = new Set();

  while (true) {
    if (fs.existsSync(stopPath(args.youtubeId))) {
      console.log(`[${new Date().toISOString()}] stop file found, exiting`);
      writeStatus(args, { state: "stopped" });
      return;
    }

    const nextChunk = firstMissingChunk(args.youtubeId, expectedChunks, args.chunkSeconds, [...failedChunks]);
    const completedChunks = countValidChunks(args.youtubeId, expectedChunks, args.chunkSeconds);

    if (nextChunk < 0) {
      console.log(`[${new Date().toISOString()}] complete`);
      writeStatus(args, {
        state: failedChunks.size > 0 ? "complete-with-failures" : "complete",
        completedChunks,
        nextChunk: null,
        failedChunks: [...failedChunks],
        lastExitCode: 0
      });
      return;
    }

    writeStatus(args, {
      state: "running",
      completedChunks,
      nextChunk,
      failedChunks: [...failedChunks],
      nextTimeSeconds: nextChunk * args.chunkSeconds
    });

    const exitCode = runBatch(args, nextChunk, expectedChunks);
    const nextAttempts = (attempts.get(nextChunk) || 0) + 1;
    attempts.set(nextChunk, nextAttempts);
    if (exitCode !== 0 && nextAttempts >= args.maxAttemptsPerChunk) {
      console.log(`[${new Date().toISOString()}] chunk ${nextChunk} failed ${nextAttempts} times, marking failed and continuing`);
      failedChunks.add(nextChunk);
    }
    writeStatus(args, {
      state: exitCode === 0 ? "running" : "retry-wait",
      completedChunks: countValidChunks(args.youtubeId, expectedChunks, args.chunkSeconds),
      nextChunk: firstMissingChunk(args.youtubeId, expectedChunks, args.chunkSeconds, [...failedChunks]),
      failedChunks: [...failedChunks],
      lastExitCode: exitCode,
      lastRunAt: new Date().toISOString()
    });

    if (exitCode !== 0 && !failedChunks.has(nextChunk)) {
      console.log(`[${new Date().toISOString()}] retrying after ${args.retryDelaySeconds}s`);
      sleep(args.retryDelaySeconds);
    }
  }
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "reports");

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

function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const logPath = path.join(REPORT_DIR, "council-video-transcription-queue.log");
  const pidPath = path.join(REPORT_DIR, "council-video-transcription-queue.pid");
  const out = fs.openSync(logPath, "a");
  const err = fs.openSync(logPath, "a");

  const childArgs = [
    "scripts/supervise-council-video-queue.mjs",
    `--chunk-seconds=${args.chunkSeconds}`,
    `--batch-chunks=${args.batchChunks}`,
    `--threads=${args.threads}`,
    `--chunk-timeout-seconds=${args.chunkTimeoutSeconds}`,
    `--retry-delay-seconds=${args.retryDelaySeconds}`,
    `--max-attempts-per-chunk=${args.maxAttemptsPerChunk}`,
    `--engine=${args.engine}`
  ];
  if (args.allAudio) childArgs.push("--all-audio");

  const child = spawn(process.execPath, childArgs, {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", out, err]
  });

  child.unref();
  fs.writeFileSync(pidPath, `${child.pid}\n`);
  console.log(`Started council video transcription queue pid=${child.pid}`);
  console.log(`Log: ${path.relative(ROOT, logPath)}`);
  console.log(`Status: ${path.relative(ROOT, path.join(REPORT_DIR, "council-video-transcription-queue-status.json"))}`);
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}

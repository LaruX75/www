import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
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
    maxAttemptsPerChunk: 3
  };

  for (const raw of argv) {
    if (raw.startsWith("--youtube-id=")) args.youtubeId = raw.slice("--youtube-id=".length);
    else if (raw.startsWith("--engine=")) args.engine = raw.slice("--engine=".length);
    else if (raw.startsWith("--chunk-seconds=")) args.chunkSeconds = Number(raw.slice("--chunk-seconds=".length));
    else if (raw.startsWith("--batch-chunks=")) args.batchChunks = Number(raw.slice("--batch-chunks=".length));
    else if (raw.startsWith("--threads=")) args.threads = Number(raw.slice("--threads=".length));
    else if (raw.startsWith("--chunk-timeout-seconds=")) args.chunkTimeoutSeconds = Number(raw.slice("--chunk-timeout-seconds=".length));
    else if (raw.startsWith("--retry-delay-seconds=")) args.retryDelaySeconds = Number(raw.slice("--retry-delay-seconds=".length));
    else if (raw.startsWith("--max-attempts-per-chunk=")) args.maxAttemptsPerChunk = Number(raw.slice("--max-attempts-per-chunk=".length));
  }

  if (!args.youtubeId) throw new Error("Missing --youtube-id");
  return args;
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error?.code === "EPERM") return true;
    return false;
  }
}

function assertNoRunningSupervisor(pidPath) {
  if (!fs.existsSync(pidPath)) return;
  const pid = Number(fs.readFileSync(pidPath, "utf8").trim());
  if (processIsAlive(pid)) {
    throw new Error(`Supervisor already appears to be running: pid=${pid}. Stop it before starting another one.`);
  }
  fs.rmSync(pidPath);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const logPath = path.join(REPORT_DIR, `${args.youtubeId}-chunk-supervisor.log`);
  const pidPath = path.join(REPORT_DIR, `${args.youtubeId}-chunk-supervisor.pid`);
  assertNoRunningSupervisor(pidPath);
  const out = fs.openSync(logPath, "a");
  const err = fs.openSync(logPath, "a");

  const child = spawn(process.execPath, [
    "scripts/supervise-council-video-chunks.mjs",
    `--youtube-id=${args.youtubeId}`,
    `--engine=${args.engine}`,
    `--chunk-seconds=${args.chunkSeconds}`,
    `--batch-chunks=${args.batchChunks}`,
    `--threads=${args.threads}`,
    `--chunk-timeout-seconds=${args.chunkTimeoutSeconds}`,
    `--retry-delay-seconds=${args.retryDelaySeconds}`,
    `--max-attempts-per-chunk=${args.maxAttemptsPerChunk}`
  ], {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", out, err]
  });

  child.unref();
  fs.writeFileSync(pidPath, `${child.pid}\n`);
  console.log(`Started ${args.youtubeId} chunk supervisor pid=${child.pid}`);
  console.log(`Log: ${path.relative(ROOT, logPath)}`);
  console.log(`Status: ${path.relative(ROOT, path.join(REPORT_DIR, `${args.youtubeId}-chunk-supervisor-status.json`))}`);
}

try {
  main();
} catch (error) {
  console.error(error.stack || error.message);
  process.exit(1);
}

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const PUBLICATIONS_DIR = path.join(ROOT, "src", "publications");
const VIDEO_DATA_PATH = path.join(ROOT, "src", "_data", "councilSpeechVideos.json");
const CACHE_DIR = path.join(ROOT, ".cache", "council-youtube", "whisper");
const AUDIO_DIR = path.join(CACHE_DIR, "audio");
const TRANSCRIPT_DIR = path.join(CACHE_DIR, "transcripts");
const REPORT_PATH = path.join(ROOT, "reports", "council-speech-video-whisper-candidates.json");

function parseArgs(argv) {
  const args = {
    whisperArgs: [],
    onlyUrls: [],
    youtubeIds: []
  };

  for (const raw of argv) {
    if (!raw.startsWith("--")) continue;
    const [key, ...rest] = raw.slice(2).split("=");
    const value = rest.length ? rest.join("=") : "true";
    if (key === "whisper-arg") args.whisperArgs.push(value);
    else if (key === "url") args.onlyUrls.push(value);
    else if (key === "youtube-id") args.youtubeIds.push(value);
    else args[key] = value;
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));
const engine = args.engine || "openai";
const whisperBin = args["whisper-bin"] || (engine === "cpp" ? "whisper-cli" : "whisper");
const model = args.model || (engine === "cpp" ? "" : "large-v3");
const forceAudio = args["force-audio"] === "true";
const forceTranscript = args["force-transcript"] === "true";
const dryRun = args["dry-run"] === "true" || args["list-targets"] === "true";
const limit = Number(args.limit || 0);
const windowSeconds = Number(args["window-seconds"] || 90);

if (!["openai", "cpp"].includes(engine)) {
  throw new Error(`Unsupported --engine=${engine}. Use openai or cpp.`);
}

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

function run(command, commandArgs, options = {}) {
  console.log(`$ ${[command, ...commandArgs].join(" ")}`);
  return execFileSync(command, commandArgs, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.stdio || "pipe",
    maxBuffer: 1024 * 1024 * 64
  });
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  const fm = match ? match[1] : "";
  const body = match ? raw.slice(match[0].length) : raw;

  const get = (key) => {
    const found = fm.match(new RegExp(`^${key}:\\s*['"]?([^'"\\n]+)`, "m"));
    return found ? found[1].trim() : "";
  };

  return {
    body,
    data: {
      title: get("title"),
      date: get("date"),
      description: get("description"),
      event: get("event"),
      type: get("type")
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
    .replace(/[#*_>`()[\]{}|]/g, " ")
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
    "arvoisa", "puheenjohtaja", "hyvat", "hyvät", "valtuutetut", "kiitos", "oulun",
    "kaupungin", "kaupunginvaltuusto", "puheenvuoro", "kohdassa", "kasitteli",
    "käsitteli", "tassa", "tässä", "etta", "että", "joka", "joita", "tulee",
    "pitää", "pitaa", "myos", "myös", "ovat", "olla", "olen", "asia", "asiassa",
    "kysyin", "kysymys", "esitin", "koski", "käsittelyssä", "keskustelussa"
  ]);

  return normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length >= 5 && !stop.has(word))
    .slice(0, 240);
}

function extractAnchorPhrases(text = "") {
  return stripToText(text)
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => normalizeText(line))
    .filter((line) => line.length >= 28 && line.length <= 180)
    .slice(0, 30);
}

function loadSpeeches() {
  const byPermalink = new Map();

  for (const fileName of fs.readdirSync(PUBLICATIONS_DIR).filter((file) => file.endsWith(".md"))) {
    const filePath = path.join(PUBLICATIONS_DIR, fileName);
    const raw = fs.readFileSync(filePath, "utf8");
    const { body, data } = parseFrontmatter(raw);
    const permalink = toPermalink(fileName, data.date);
    if (!permalink) continue;

    byPermalink.set(permalink, {
      file: path.relative(ROOT, filePath),
      permalink,
      title: data.title,
      date: data.date,
      text: `${data.title} ${data.description} ${data.event} ${stripToText(body)}`,
      body
    });
  }

  return byPermalink;
}

function loadTargets() {
  const data = readJson(VIDEO_DATA_PATH, { byUrl: {} });
  const speeches = loadSpeeches();
  const targets = [];

  for (const [url, entries] of Object.entries(data.byUrl || {})) {
    if (args.onlyUrls.length && !args.onlyUrls.includes(url)) continue;
    if (!Array.isArray(entries)) continue;

    const speech = speeches.get(url);
    if (!speech) continue;

    for (const entry of entries) {
      if (!entry.youtubeId) continue;
      if (entry.start && args.all !== "true") continue;
      if (args.youtubeIds.length && !args.youtubeIds.includes(entry.youtubeId)) continue;

      targets.push({
        url,
        speech,
        entry
      });
    }
  }

  return limit > 0 ? targets.slice(0, limit) : targets;
}

function audioPath(videoId) {
  return path.join(AUDIO_DIR, `${videoId}.wav`);
}

function openAiTranscriptPath(videoId) {
  return path.join(TRANSCRIPT_DIR, `${videoId}.json`);
}

function cppTranscriptPath(videoId) {
  return path.join(TRANSCRIPT_DIR, `${videoId}.json`);
}

function downloadAudio(videoId) {
  ensureDir(AUDIO_DIR);
  const finalPath = audioPath(videoId);
  if (fs.existsSync(finalPath) && !forceAudio) return finalPath;

  run("yt-dlp", [
    "-f",
    "ba",
    "-x",
    "--audio-format",
    "wav",
    "--audio-quality",
    "0",
    "-o",
    path.join(AUDIO_DIR, `${videoId}.%(ext)s`),
    `https://www.youtube.com/watch?v=${videoId}`
  ], { stdio: "inherit" });

  if (!fs.existsSync(finalPath)) {
    throw new Error(`Audio download did not create ${path.relative(ROOT, finalPath)}`);
  }

  return finalPath;
}

function transcribeOpenAI(videoId, filePath) {
  ensureDir(TRANSCRIPT_DIR);
  const finalPath = openAiTranscriptPath(videoId);
  if (fs.existsSync(finalPath) && !forceTranscript) return finalPath;

  const commandArgs = [
    filePath,
    "--language",
    "Finnish",
    "--task",
    "transcribe",
    "--model",
    model,
    "--output_format",
    "json",
    "--output_dir",
    TRANSCRIPT_DIR,
    "--verbose",
    "False",
    ...args.whisperArgs
  ];

  run(whisperBin, commandArgs, { stdio: "inherit" });

  const generatedPath = path.join(TRANSCRIPT_DIR, `${path.basename(filePath, path.extname(filePath))}.json`);
  if (generatedPath !== finalPath && fs.existsSync(generatedPath)) fs.renameSync(generatedPath, finalPath);
  if (!fs.existsSync(finalPath)) throw new Error(`Whisper did not create ${path.relative(ROOT, finalPath)}`);
  return finalPath;
}

function transcribeCpp(videoId, filePath) {
  ensureDir(TRANSCRIPT_DIR);
  const finalPath = cppTranscriptPath(videoId);
  if (fs.existsSync(finalPath) && !forceTranscript) return finalPath;
  if (!model) throw new Error("Use --model=/path/to/ggml-model.bin with --engine=cpp");

  const outputStem = path.join(TRANSCRIPT_DIR, videoId);
  run(whisperBin, [
    "--language",
    "fi",
    "--model",
    model,
    "--file",
    filePath,
    "--output-json",
    "--output-file",
    outputStem,
    ...args.whisperArgs
  ], { stdio: "inherit" });

  if (!fs.existsSync(finalPath)) throw new Error(`whisper-cli did not create ${path.relative(ROOT, finalPath)}`);
  return finalPath;
}

function transcribe(videoId, filePath) {
  if (engine === "cpp") return transcribeCpp(videoId, filePath);
  if (engine === "openai") return transcribeOpenAI(videoId, filePath);
  throw new Error(`Unsupported --engine=${engine}. Use openai or cpp.`);
}

function parseTimestamp(value = "") {
  const match = String(value).match(/(\d+):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return 0;
  const [, hours, minutes, seconds, ms] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds) + Number(ms) / 1000;
}

function transcriptRows(filePath) {
  const data = readJson(filePath, {});

  if (Array.isArray(data.segments)) {
    return data.segments
      .map((segment) => ({
        start: Number(segment.start || 0),
        end: Number(segment.end || segment.start || 0),
        text: String(segment.text || "").trim()
      }))
      .filter((segment) => segment.text);
  }

  if (Array.isArray(data.transcription)) {
    return data.transcription
      .map((segment) => ({
        start: typeof segment.offsets?.from === "number"
          ? segment.offsets.from / 1000
          : parseTimestamp(segment.timestamps?.from),
        end: typeof segment.offsets?.to === "number"
          ? segment.offsets.to / 1000
          : parseTimestamp(segment.timestamps?.to),
        text: String(segment.text || "").trim()
      }))
      .filter((segment) => segment.text);
  }

  return [];
}

function scoreWindow(speech, rows, startIndex) {
  const speechTerms = new Set(importantTerms(speech.text));
  const anchors = extractAnchorPhrases(speech.body);
  const start = rows[startIndex].start;
  const windowRows = rows.slice(startIndex).filter((row) => row.start - start <= windowSeconds);
  const windowText = windowRows.map((row) => row.text).join(" ");
  const normalized = normalizeText(windowText);
  const windowTerms = new Set(importantTerms(windowText));
  let overlap = 0;

  for (const term of speechTerms) {
    if (windowTerms.has(term)) overlap += 1;
  }

  const speakerBoost = /jari\s+laru|valtuutettu\s+laru|laru\s+ole\s+hyvä|laru\s+olkaa\s+hyvä/i.test(windowText) ? 20 : 0;
  const anchorHits = anchors.filter((anchor) => {
    const anchorTerms = importantTerms(anchor);
    if (!anchorTerms.length) return false;
    const hits = anchorTerms.filter((term) => windowTerms.has(term)).length;
    return hits >= Math.min(4, Math.ceil(anchorTerms.length * 0.45));
  }).length;

  const exactishBoost = anchors.some((anchor) => normalized.includes(anchor.slice(0, 35))) ? 25 : 0;

  return {
    score: overlap + (anchorHits * 12) + speakerBoost + exactishBoost,
    overlap,
    anchorHits,
    speakerBoost,
    exactishBoost,
    preview: windowText.replace(/\s+/g, " ").slice(0, 700)
  };
}

function findCandidates(speech, rows) {
  return rows
    .map((row, index) => {
      const scored = scoreWindow(speech, rows, index);
      return {
        start: Math.max(0, Math.round(row.start)),
        end: Math.max(0, Math.round(row.end || row.start)),
        ...scored
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.start - b.start)
    .slice(0, 12);
}

function uniqueTargets(targets) {
  const seen = new Set();
  return targets.filter((target) => {
    const key = `${target.url}::${target.entry.youtubeId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const targets = uniqueTargets(loadTargets());

if (!targets.length) {
  console.log("No targets found. Use --all=true, --url=/path/, or check missing start fields in councilSpeechVideos.json.");
  process.exit(0);
}

if (dryRun) {
  console.log(JSON.stringify({
    targetCount: targets.length,
    targets: targets.map((target) => ({
      title: target.speech.title,
      file: target.speech.file,
      url: target.url,
      youtubeId: target.entry.youtubeId,
      youtubeUrl: `https://www.youtube.com/watch?v=${target.entry.youtubeId}`,
      label: target.entry.label || ""
    }))
  }, null, 2));
  process.exit(0);
}

const rows = [];

for (const [index, target] of targets.entries()) {
  console.log(`\n[${index + 1}/${targets.length}] ${target.speech.title}`);
  console.log(`Video: https://www.youtube.com/watch?v=${target.entry.youtubeId}`);

  const audio = downloadAudio(target.entry.youtubeId);
  const transcript = transcribe(target.entry.youtubeId, audio);
  const transcriptSegments = transcriptRows(transcript);
  const candidates = findCandidates(target.speech, transcriptSegments);

  rows.push({
    title: target.speech.title,
    file: target.speech.file,
    url: target.url,
    youtubeId: target.entry.youtubeId,
    youtubeUrl: `https://www.youtube.com/watch?v=${target.entry.youtubeId}`,
    audio: path.relative(ROOT, audio),
    transcript: path.relative(ROOT, transcript),
    segmentCount: transcriptSegments.length,
    bestStart: candidates[0]?.start ?? null,
    bestUrl: candidates[0] ? `https://www.youtube.com/watch?v=${target.entry.youtubeId}&t=${candidates[0].start}s` : "",
    candidates: candidates.map((candidate) => ({
      ...candidate,
      url: `https://www.youtube.com/watch?v=${target.entry.youtubeId}&t=${candidate.start}s`
    }))
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  engine,
  whisperBin,
  model,
  windowSeconds,
  targetCount: rows.length,
  rows
};

writeJson(REPORT_PATH, report);
console.log(`\nReport written to ${path.relative(ROOT, REPORT_PATH)}`);
console.log(JSON.stringify({
  targetCount: report.targetCount,
  reportPath: path.relative(ROOT, REPORT_PATH),
  best: rows.map((row) => ({
    title: row.title,
    bestStart: row.bestStart,
    bestUrl: row.bestUrl,
    score: row.candidates[0]?.score ?? 0,
    preview: row.candidates[0]?.preview ?? ""
  }))
}, null, 2));

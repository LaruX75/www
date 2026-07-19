import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLICATIONS_DIR = path.join(ROOT, "src", "publications");
const TRANSCRIPT_INDEX = path.join(ROOT, ".cache", "council-youtube", "macwhisper-transcripts", "index.json");
const REPORT_PATH = path.join(ROOT, "reports", "council-speech-macwhisper-candidates.json");

function parseArgs(argv) {
  const args = {
    url: "",
    date: "",
    limit: 0,
    minScore: 20,
    windowSeconds: 150,
    includeExisting: false,
    listTargets: false
  };

  for (const raw of argv) {
    if (raw === "--list-targets") args.listTargets = true;
    else if (raw === "--include-existing") args.includeExisting = true;
    else if (raw.startsWith("--url=")) args.url = raw.slice("--url=".length);
    else if (raw.startsWith("--date=")) args.date = raw.slice("--date=".length);
    else if (raw.startsWith("--limit=")) args.limit = Number(raw.slice("--limit=".length) || 0);
    else if (raw.startsWith("--min-score=")) args.minScore = Number(raw.slice("--min-score=".length) || 0);
    else if (raw.startsWith("--window-seconds=")) args.windowSeconds = Number(raw.slice("--window-seconds=".length) || 150);
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
  const listValues = [...fm.matchAll(/^\s*-\s*(.+)$/gm)].map((item) => item[1].trim());

  return {
    body,
    data: {
      title: get("title"),
      date: get("date"),
      event: get("event"),
      meetingDate: get("meetingDate"),
      asiakohta: get("asiakohta"),
      agenda_item: get("agenda_item"),
      agenda_title: get("agenda_title"),
      type: get("type"),
      tags: listValues
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
    "kysyin", "kysymys", "esitin", "koski", "käsittelyssä", "keskustelussa",
    "valtuusto", "valtuustossa", "kaupungille", "kaupungissa", "oulu", "oulussa"
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
    .slice(0, 40);
}

function parseDateFromText(value = "") {
  const dot = String(value).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dot) {
    const [, day, month, year] = dot;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const dash = String(value).match(/(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dash) {
    const [, day, month, year] = dash;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function isRelevantSpeech(fileName, raw, data) {
  if (data.type !== "puhe") return false;
  const haystack = normalizeText(`${fileName} ${data.title} ${data.event} ${data.asiakohta} ${data.agenda_title} ${data.tags.join(" ")} ${raw.slice(0, 2000)}`);
  return /kaupunginvaltuusto|valtuusto|raksila|linnanmaa|keskustelutilaisuus/.test(haystack)
    && !/aluevaltuusto/.test(haystack);
}

function loadSpeeches() {
  const speeches = [];

  for (const fileName of fs.readdirSync(PUBLICATIONS_DIR).filter((file) => file.endsWith(".md"))) {
    const filePath = path.join(PUBLICATIONS_DIR, fileName);
    const raw = fs.readFileSync(filePath, "utf8");
    const { body, data } = parseFrontmatter(raw);
    if (!isRelevantSpeech(fileName, raw, data)) continue;

    const permalink = toPermalink(fileName, data.date);
    if (!permalink) continue;

    speeches.push({
      file: path.relative(ROOT, filePath),
      permalink,
      title: data.title,
      date: data.meetingDate || data.date,
      publishedDate: data.date,
      context: data.asiakohta || data.agenda_title || data.event || "",
      text: `${data.title} ${data.asiakohta} ${data.agenda_title} ${data.event} ${stripToText(body)}`,
      body
    });
  }

  return speeches
    .filter((speech) => !args.url || speech.permalink === args.url)
    .filter((speech) => !args.date || speech.date === args.date)
    .sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

function loadTranscriptIndex() {
  const index = readJson(TRANSCRIPT_INDEX);
  if (!index?.sessions) {
    throw new Error(`MacWhisper transcript index not found. Run: npm run export:macwhisper-transcripts`);
  }

  return index.sessions
    .map((session) => ({
      ...session,
      date: parseDateFromText(session.title || session.originalFilename || session.path || "")
    }))
    .filter((session) => session.date);
}

function loadSegments(session) {
  const transcript = readJson(path.join(ROOT, session.path), {});
  return Array.isArray(transcript.segments)
    ? transcript.segments
      .map((segment) => ({
        start: Number(segment.start || 0),
        end: Number(segment.end || segment.start || 0),
        text: String(segment.text || "").trim()
      }))
      .filter((segment) => segment.text)
    : [];
}

function scoreWindow(speech, rows, startIndex) {
  const speechTerms = new Set(importantTerms(speech.text));
  const anchors = extractAnchorPhrases(speech.body);
  const start = rows[startIndex].start;
  const windowRows = rows.slice(startIndex).filter((row) => row.start - start <= args.windowSeconds);
  const beforeRows = rows.filter((row) => row.start >= Math.max(0, start - 45) && row.start < start);
  const windowText = windowRows.map((row) => row.text).join(" ");
  const anchorText = `${beforeRows.map((row) => row.text).join(" ")} ${windowText}`;
  const normalized = normalizeText(windowText);
  const windowTerms = new Set(importantTerms(windowText));
  let overlap = 0;

  for (const term of speechTerms) {
    if (windowTerms.has(term)) overlap += 1;
  }

  const speakerBoost = /jari\s+laru|valtuutettu\s+laru|laru\s+ole\s+hyva|laru\s+olkaa\s+hyva|laru\s+olkaa hyvä/i.test(normalizeText(anchorText))
    ? 28
    : 0;
  const firstPersonBoost = /\b(mina|minulla|kysyn|kysyisin|kannatan|olen)\b/.test(normalizeText(windowText)) ? 4 : 0;
  const anchorHits = anchors.filter((anchor) => {
    const anchorTerms = importantTerms(anchor);
    if (!anchorTerms.length) return false;
    const hits = anchorTerms.filter((term) => windowTerms.has(term)).length;
    return hits >= Math.min(4, Math.ceil(anchorTerms.length * 0.45));
  }).length;
  const exactishBoost = anchors.some((anchor) => normalized.includes(anchor.slice(0, 35))) ? 30 : 0;

  return {
    score: overlap + (anchorHits * 12) + speakerBoost + firstPersonBoost + exactishBoost,
    overlap,
    anchorHits,
    speakerBoost,
    firstPersonBoost,
    exactishBoost,
    preview: windowText.replace(/\s+/g, " ").slice(0, 900)
  };
}

function findCandidates(speech, segments) {
  return segments
    .map((segment, index) => {
      const scored = scoreWindow(speech, segments, index);
      return {
        start: Math.max(0, Math.round(segment.start)),
        end: Math.max(0, Math.round(segment.end || segment.start)),
        ...scored
      };
    })
    .filter((candidate) => candidate.score >= args.minScore)
    .sort((a, b) => b.score - a.score || a.start - b.start)
    .slice(0, 10);
}

function candidateConfidence(candidate) {
  if (!candidate) return "none";
  if (candidate.score >= 85 && (candidate.anchorHits >= 2 || candidate.speakerBoost > 0)) return "high";
  if (candidate.score >= 55 && (candidate.anchorHits >= 1 || candidate.overlap >= 25)) return "medium";
  return "low";
}

const transcripts = loadTranscriptIndex();
const transcriptsByDate = new Map();
for (const transcript of transcripts) {
  const list = transcriptsByDate.get(transcript.date) || [];
  list.push(transcript);
  transcriptsByDate.set(transcript.date, list);
}

let targets = loadSpeeches()
  .map((speech) => ({
    speech,
    transcripts: transcriptsByDate.get(speech.date) || []
  }))
  .filter((target) => target.transcripts.length);

if (args.limit > 0) targets = targets.slice(0, args.limit);

if (args.listTargets) {
  console.log(JSON.stringify({
    targetCount: targets.length,
    targets: targets.map((target) => ({
      date: target.speech.date,
      title: target.speech.title,
      permalink: target.speech.permalink,
      transcripts: target.transcripts.map((transcript) => transcript.title)
    }))
  }, null, 2));
  process.exit(0);
}

const rows = [];

for (const [targetIndex, target] of targets.entries()) {
  console.log(`[${targetIndex + 1}/${targets.length}] ${target.speech.date} ${target.speech.title}`);

  const transcriptResults = target.transcripts.map((transcript) => {
    const segments = loadSegments(transcript);
    const candidates = findCandidates(target.speech, segments);
    const best = candidates[0] || null;

    return {
      transcriptTitle: transcript.title,
      transcriptPath: transcript.path,
      transcriptDate: transcript.date,
      segmentCount: segments.length,
      bestStart: best?.start ?? null,
      confidence: candidateConfidence(best),
      candidates
    };
  }).sort((a, b) => (b.candidates[0]?.score || 0) - (a.candidates[0]?.score || 0));

  const bestTranscript = transcriptResults[0] || null;
  const bestCandidate = bestTranscript?.candidates?.[0] || null;

  rows.push({
    date: target.speech.date,
    title: target.speech.title,
    permalink: target.speech.permalink,
    file: target.speech.file,
    context: target.speech.context,
    bestStart: bestCandidate?.start ?? null,
    confidence: candidateConfidence(bestCandidate),
    bestTranscript: bestTranscript?.transcriptTitle || "",
    bestTranscriptPath: bestTranscript?.transcriptPath || "",
    transcriptResults
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  source: "MacWhisper export",
  transcriptIndex: path.relative(ROOT, TRANSCRIPT_INDEX),
  windowSeconds: args.windowSeconds,
  minScore: args.minScore,
  targetCount: rows.length,
  rows
};

writeJson(REPORT_PATH, report);

console.log(`Report written to ${path.relative(ROOT, REPORT_PATH)}`);
console.log(JSON.stringify({
  targetCount: report.targetCount,
  reportPath: path.relative(ROOT, REPORT_PATH),
  best: rows.map((row) => ({
    date: row.date,
    title: row.title,
    bestStart: row.bestStart,
    confidence: row.confidence,
    score: row.transcriptResults[0]?.candidates[0]?.score || 0,
    transcript: row.bestTranscript,
    preview: row.transcriptResults[0]?.candidates[0]?.preview || ""
  }))
}, null, 2));

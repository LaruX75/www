import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const DEFAULT_DB = path.join(
  os.homedir(),
  "Library",
  "Application Support",
  "MacWhisper",
  "Database",
  "main.sqlite"
);
const DEFAULT_OUT_DIR = path.join(ROOT, ".cache", "council-youtube", "macwhisper-transcripts");

function parseArgs(argv) {
  const args = {
    db: DEFAULT_DB,
    out: DEFAULT_OUT_DIR,
    list: false,
    all: false,
    includeFailed: false,
    filter: "",
    session: "",
    limit: 0
  };

  for (const raw of argv) {
    if (raw === "--list") args.list = true;
    else if (raw === "--all") args.all = true;
    else if (raw === "--include-failed") args.includeFailed = true;
    else if (raw.startsWith("--db=")) args.db = raw.slice("--db=".length);
    else if (raw.startsWith("--out=")) args.out = raw.slice("--out=".length);
    else if (raw.startsWith("--filter=")) args.filter = raw.slice("--filter=".length);
    else if (raw.startsWith("--session=")) args.session = raw.slice("--session=".length).toUpperCase();
    else if (raw.startsWith("--limit=")) args.limit = Number(raw.slice("--limit=".length) || 0);
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqliteJson(sql) {
  const output = execFileSync("sqlite3", ["-json", args.db, sql], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 128
  }).trim();
  return output ? JSON.parse(output) : [];
}

function normalizeSlug(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9åäö]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "macwhisper-session";
}

function councilWhereClause() {
  if (args.all) return "1 = 1";

  const fields = [
    "coalesce(s.originalFilename, '')",
    "coalesce(s.userChosenTitle, '')",
    "coalesce(s.aiTitle, '')"
  ];
  const terms = args.filter
    ? [args.filter.toLowerCase()]
    : ["kaupunginvaltuust", "raksila", "linnanmaa"];

  return terms
    .map((term) => {
      const needle = sqlString(`%${term}%`);
      return `(${fields.map((field) => `lower(${field}) LIKE ${needle}`).join(" OR ")})`;
    })
    .join(" OR ");
}

function loadSessions() {
  const statusClause = args.includeFailed ? "1 = 1" : "coalesce(s.transcriptionDidSucceed, 0) = 1";
  const sessionClause = args.session ? `hex(s.id) LIKE ${sqlString(`${args.session}%`)}` : "1 = 1";
  const limitClause = args.limit > 0 ? `LIMIT ${Number(args.limit)}` : "";

  return sqliteJson(`
    SELECT
      hex(s.id) AS id,
      s.dateCreated,
      s.dateUpdated,
      s.dateLastOpened,
      s.originalFilename,
      s.originalExtension,
      s.userChosenTitle,
      s.aiTitle,
      s.textPreview,
      s.transcriptionDidSucceed,
      s.modelEngine,
      s.modelIdentifer,
      s.modelInputLanguage,
      s.detectedLanguage,
      s.playbackDuration,
      s.timeTakenToTranscribe,
      s.isFromYoutube,
      COUNT(t.id) AS lineCount
    FROM session s
    LEFT JOIN transcriptline t ON t.sessionId = s.id
    WHERE ${statusClause}
      AND ${sessionClause}
      AND (${councilWhereClause()})
    GROUP BY s.id
    HAVING lineCount > 0
    ORDER BY s.dateCreated DESC
    ${limitClause};
  `);
}

function loadSegments(sessionId) {
  const rows = sqliteJson(`
    SELECT
      t.start AS startRaw,
      t.end AS endRaw,
      t.text,
      t.wordsJson,
      hex(t.speakerID) AS speakerId
    FROM transcriptline t
    WHERE hex(t.sessionId) = ${sqlString(sessionId)}
    ORDER BY t.start ASC;
  `);

  return rows
    .map((row) => ({
      start: Number(row.startRaw || 0) / 1000,
      end: Number(row.endRaw || row.startRaw || 0) / 1000,
      startRaw: Number(row.startRaw || 0),
      endRaw: Number(row.endRaw || row.startRaw || 0),
      text: String(row.text || "").trim(),
      speakerId: row.speakerId || null,
      wordsJson: row.wordsJson || null
    }))
    .filter((row) => row.text);
}

function printSessions(sessions) {
  if (!sessions.length) {
    console.log("No matching MacWhisper sessions found.");
    return;
  }

  for (const session of sessions) {
    const name = session.originalFilename || session.userChosenTitle || session.aiTitle || "(untitled)";
    const seconds = Number(session.playbackDuration || 0);
    const duration = seconds > 0 ? `${Math.round(seconds / 60)} min` : "unknown duration";
    console.log(`${session.id.slice(0, 12)}  ${session.lineCount} lines  ${duration}  ${name}`);
  }
}

function exportSessions(sessions) {
  ensureDir(args.out);

  const index = {
    exportedAt: new Date().toISOString(),
    sourceDatabase: args.db,
    outputDirectory: args.out,
    count: 0,
    sessions: []
  };

  for (const session of sessions) {
    const segments = loadSegments(session.id);
    if (!segments.length) continue;

    const name = session.originalFilename || session.userChosenTitle || session.aiTitle || "macwhisper-session";
    const baseName = `${String(session.dateCreated || "").slice(0, 10)}-${normalizeSlug(name)}-${session.id.slice(0, 8)}`;
    const outputFile = `${baseName}.json`;
    const outputPath = path.join(args.out, outputFile);

    const payload = {
      source: "MacWhisper",
      exportedAt: new Date().toISOString(),
      session: {
        ...session,
        idShort: session.id.slice(0, 12)
      },
      segments
    };

    writeJson(outputPath, payload);
    index.sessions.push({
      id: session.id,
      idShort: session.id.slice(0, 12),
      title: name,
      originalFilename: session.originalFilename,
      playbackDuration: session.playbackDuration,
      lineCount: segments.length,
      path: path.relative(ROOT, outputPath)
    });
    index.count += 1;
  }

  writeJson(path.join(args.out, "index.json"), index);
  console.log(`Exported ${index.count} MacWhisper transcript(s) to ${path.relative(ROOT, args.out)}`);
}

if (!fs.existsSync(args.db)) {
  console.error(`MacWhisper database not found: ${args.db}`);
  process.exit(1);
}

const sessions = loadSessions();

if (args.list) {
  printSessions(sessions);
} else {
  exportSessions(sessions);
}

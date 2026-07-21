import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLICATIONS_DIR = path.join(ROOT, "src", "publications");
const TRANSCRIPT_INDEX = path.join(ROOT, ".cache", "council-youtube", "macwhisper-transcripts", "index.json");
const MEETING_VIDEO_DATA = path.join(ROOT, "src", "_data", "councilMeetingYoutubeVideos.json");
const SPEECH_VIDEO_DATA = path.join(ROOT, "src", "_data", "councilSpeechVideos.json");
const REPORT_PATH = path.join(ROOT, "reports", "unmapped-council-speech-mentions.json");

const CLUSTER_SECONDS = 360;
const KNOWN_START_TOLERANCE_SECONDS = 420;

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (_) {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9åäö\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDate(value = "") {
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

  const iso = String(value).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];

  return "";
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

function loadCouncilSpeechesByDate() {
  const byDate = new Map();

  for (const fileName of fs.readdirSync(PUBLICATIONS_DIR).filter((file) => file.endsWith(".md"))) {
    const filePath = path.join(PUBLICATIONS_DIR, fileName);
    const raw = fs.readFileSync(filePath, "utf8");
    const { data } = parseFrontmatter(raw);
    const haystack = normalizeText(`${fileName} ${data.title} ${data.event} ${data.asiakohta} ${data.forum.join(" ")} ${data.tags.join(" ")}`);
    if (data.type !== "puhe") continue;
    if (!/kaupunginvaltuusto|valtuusto|raksila|linnanmaa/.test(haystack)) continue;
    if (/aluevaltuusto/.test(haystack)) continue;

    const date = data.meetingDate || data.date;
    const item = {
      date,
      title: data.title,
      permalink: toPermalink(fileName, data.date),
      file: path.relative(ROOT, filePath),
      asiakohta: data.asiakohta,
      event: data.event
    };
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date).push(item);

    const eventDate = parseDate(`${data.event} ${data.title}`);
    if (eventDate && eventDate !== date) {
      if (!byDate.has(eventDate)) byDate.set(eventDate, []);
      byDate.get(eventDate).push({ ...item, matchedBy: "eventDate" });
    }
  }

  for (const rows of byDate.values()) {
    rows.sort((a, b) => a.title.localeCompare(b.title, "fi"));
  }

  return byDate;
}

function loadKnownStartsByDate() {
  const speechVideos = readJson(SPEECH_VIDEO_DATA, { byUrl: {} }).byUrl || {};
  const speechesByDate = loadCouncilSpeechesByDate();
  const byPermalink = new Map();
  const byDate = new Map();

  for (const speeches of speechesByDate.values()) {
    for (const speech of speeches) byPermalink.set(speech.permalink, speech);
  }

  for (const [url, videos] of Object.entries(speechVideos)) {
    const speech = byPermalink.get(url);
    const date = speech?.date || parseDate(url);
    if (!date) continue;
    if (!byDate.has(date)) byDate.set(date, []);
    for (const video of videos || []) {
      if (!Number.isFinite(Number(video.start))) continue;
      byDate.get(date).push({
        date,
        permalink: url,
        title: speech?.title || "",
        youtubeId: video.youtubeId || "",
        start: Number(video.start),
        label: video.label || ""
      });
    }
  }

  return byDate;
}

function loadMeetingVideosByDate() {
  return readJson(MEETING_VIDEO_DATA, { byDate: {} }).byDate || {};
}

function transcriptRows(session) {
  const data = readJson(path.join(ROOT, session.path), {});
  return (data.segments || [])
    .map((segment) => ({
      start: Number(segment.start || 0),
      end: Number(segment.end || segment.start || 0),
      text: String(segment.text || "").replace(/\s+/g, " ").trim()
    }))
    .filter((row) => row.text);
}

function formatTime(seconds) {
  let value = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(value / 3600);
  value -= hours * 3600;
  const minutes = Math.floor(value / 60);
  const secs = value - (minutes * 60);
  return [hours, minutes, secs].map((part) => String(part).padStart(2, "0")).join(":");
}

function mentionKind(text) {
  const normalized = normalizeText(text);
  if (/jari\s+laru|valtuutettu\s+laru/.test(normalized)) return "strong";
  if (/\blaru\b|\blarun\b/.test(normalized)) return "name";
  if (/valtuutettu\s+(la|lar|laar|laur|lalu)/.test(normalized)) return "loose";
  return "";
}

function isAbsenceContext(text) {
  const normalized = normalizeText(text);
  return /poissa|poissaolev|este|varavaltuutet|paikalla/.test(normalized);
}

function isRollcallContext(text) {
  const normalized = normalizeText(text);
  return /aanest|äänest|aantenlask|ääntenlask|uurn|poissa|läsnä|lasna|pöytäkirjan tarkast|poytakirjan tarkast|aloitteet|allekirjoittaneet/.test(normalized);
}

function isReferenceOrResponseContext(text) {
  const normalized = normalizeText(text);
  return /vastauksena larulle|larun kysymykseen|larun kanssa|jari sanoi|laru sanoi|laru nosti|laru viittasi|larukin sanoi|valtuutettu larun kanssa|kiitos hänelle|kiitos hanelle|kuten valtuutettu laru|niin kuin jari sanoi|jaan .* larun kanssa|jarille .* vastaisin/.test(normalized);
}

function hasFloorCue(text) {
  const normalized = normalizeText(text);
  return /valtuutettu laru.{0,40}olkaa hyva|valtuutettu laru.{0,40}ole hyva|jari laru.{0,80}ole hyva|jari laru.{0,80}olkaa hyva/.test(normalized);
}

function rowsAround(rows, start, before = 45, after = 210) {
  return rows.filter((row) => row.start >= Math.max(0, start - before) && row.start <= start + after);
}

function classifyCluster(cluster, date, knownStarts) {
  const start = cluster.start;
  const known = (knownStarts.get(date) || [])
    .map((item) => ({ ...item, distance: Math.abs(Number(item.start) - start) }))
    .filter((item) => item.distance <= KNOWN_START_TOLERANCE_SECONDS)
    .sort((a, b) => a.distance - b.distance)[0];

  if (known) {
    return {
      status: "mapped",
      reason: `Existing speech video start within ${Math.round(known.distance)}s`,
      known
    };
  }

  if (cluster.absenceLike && cluster.start < 1200) {
    return {
      status: "attendance_or_rollcall",
      reason: "Name appears near absence/attendance wording early in the meeting",
      known: null
    };
  }

  if (cluster.rollcallLike) {
    return {
      status: "likely_vote_or_rollcall",
      reason: "Name appears near voting, attendance, minutes-checking or initiative-list wording",
      known: null
    };
  }

  if (cluster.referenceLike && !cluster.floorCue) {
    return {
      status: "reference_or_response",
      reason: "Name appears in another speaker's response or reference, not as a floor cue",
      known: null
    };
  }

  if (!cluster.floorCue) {
    return {
      status: "name_mention_only",
      reason: "Name appears in the transcript, but the local context does not contain a clear floor cue",
      known: null
    };
  }

  return {
    status: "needs_review",
    reason: "Name mention is not close to any existing speech timestamp",
    known: null
  };
}

function detectClusters(session, rows, knownStarts) {
  const hits = rows
    .map((row, index) => ({
      ...row,
      index,
      kind: mentionKind(row.text)
    }))
    .filter((row) => row.kind);

  const clusters = [];
  for (const hit of hits) {
    const previous = clusters.at(-1);
    if (previous && hit.start - previous.end <= CLUSTER_SECONDS) {
      previous.end = Math.max(previous.end, hit.end);
      previous.hits.push(hit);
      continue;
    }

    clusters.push({
      start: hit.start,
      end: hit.end,
      hits: [hit]
    });
  }

  const date = session.date;
  return clusters.map((cluster) => {
    const contextRows = rowsAround(rows, cluster.start);
    const preview = contextRows.map((row) => row.text).join(" ").replace(/\s+/g, " ").trim();
    const previewNormalized = normalizeText(preview);
    const enriched = {
      date,
      transcriptTitle: session.title || session.originalFilename || "",
      transcriptPath: session.path,
      start: Math.max(0, Math.round(cluster.start)),
      end: Math.max(0, Math.round(cluster.end)),
      time: formatTime(cluster.start),
      hitCount: cluster.hits.length,
      hitKinds: [...new Set(cluster.hits.map((hit) => hit.kind))],
      absenceLike: isAbsenceContext(preview),
      rollcallLike: isRollcallContext(preview),
      referenceLike: isReferenceOrResponseContext(preview),
      floorCue: hasFloorCue(preview),
      preview,
      previewNormalized
    };
    const classification = classifyCluster(enriched, date, knownStarts);
    return {
      ...enriched,
      previewNormalized: undefined,
      status: classification.status,
      reason: classification.reason,
      known: classification.known
    };
  });
}

function main() {
  const index = readJson(TRANSCRIPT_INDEX, { sessions: [] });
  const meetingVideos = loadMeetingVideosByDate();
  const knownStarts = loadKnownStartsByDate();
  const speechesByDate = loadCouncilSpeechesByDate();
  const sessions = (index.sessions || [])
    .map((session) => ({
      ...session,
      date: parseDate(`${session.title || ""} ${session.originalFilename || ""}`) || parseDate(session.path || "")
    }))
    .filter((session) => session.date);

  const rows = [];
  for (const session of sessions) {
    const segments = transcriptRows(session);
    if (!segments.length) continue;
    const clusters = detectClusters(session, segments, knownStarts);
    const youtubeIds = (meetingVideos[session.date] || []).map((video) => video.youtubeId);
    for (const cluster of clusters) {
      rows.push({
        ...cluster,
        youtubeIds,
        existingSpeechPagesForDate: (speechesByDate.get(session.date) || []).map((speech) => ({
          title: speech.title,
          permalink: speech.permalink,
          asiakohta: speech.asiakohta
        }))
      });
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    source: "MacWhisper transcripts",
    transcriptIndex: path.relative(ROOT, TRANSCRIPT_INDEX),
    clusterSeconds: CLUSTER_SECONDS,
    knownStartToleranceSeconds: KNOWN_START_TOLERANCE_SECONDS,
    summary: {
      transcripts: sessions.length,
      clusters: rows.length,
      mapped: rows.filter((row) => row.status === "mapped").length,
      attendanceOrRollcall: rows.filter((row) => row.status === "attendance_or_rollcall").length,
      likelyVoteOrRollcall: rows.filter((row) => row.status === "likely_vote_or_rollcall").length,
      referenceOrResponse: rows.filter((row) => row.status === "reference_or_response").length,
      nameMentionOnly: rows.filter((row) => row.status === "name_mention_only").length,
      needsReview: rows.filter((row) => row.status === "needs_review").length
    },
    needsReview: rows.filter((row) => row.status === "needs_review"),
    rows
  };

  writeJson(REPORT_PATH, report);

  console.log(`Report: ${path.relative(ROOT, REPORT_PATH)}`);
  console.log(`Transcripts: ${report.summary.transcripts}`);
  console.log(`Clusters: ${report.summary.clusters}`);
  console.log(`Mapped: ${report.summary.mapped}`);
  console.log(`Attendance/rollcall: ${report.summary.attendanceOrRollcall}`);
  console.log(`Likely vote/rollcall: ${report.summary.likelyVoteOrRollcall}`);
  console.log(`Needs review: ${report.summary.needsReview}`);

  for (const row of report.needsReview.slice(0, 20)) {
    console.log(`\n${row.date} ${row.time} ${row.transcriptTitle}`);
    console.log(`  ${row.reason}`);
    console.log(`  videos: ${row.youtubeIds.join(", ") || "-"}`);
    console.log(`  preview: ${row.preview.slice(0, 500)}`);
  }
}

main();

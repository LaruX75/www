import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, "reports");
const AUDIO_DIR = path.join(ROOT, ".cache", "council-youtube", "whisper", "audio");
const CHUNK_ROOT = path.join(ROOT, ".cache", "council-youtube", "whisper", "transcripts", "chunks");
const MEETING_VIDEO_DATA = path.join(ROOT, "src", "_data", "councilMeetingYoutubeVideos.json");
const SPEECH_VIDEO_DATA = path.join(ROOT, "src", "_data", "councilSpeechVideos.json");
const QUEUE_STATUS = path.join(REPORT_DIR, "council-video-transcription-queue-status.json");
const MACWHISPER_CANDIDATES = path.join(REPORT_DIR, "council-speech-macwhisper-candidates.json");
const OUT_JSON = path.join(REPORT_DIR, "council-video-transcription-audit.json");
const OUT_MD = path.join(REPORT_DIR, "council-video-transcription-audit.md");

const strictName = /jari\s+laru|valtuutettu\s+laru|\blaru\b|\blarun\b|\blaaru\b|\blauru\b/i;
const looseName = /valtuutettu\s+(?:la|lar|laar|laur|lalu)/i;
const speechContext = /olkaa\s+hyv[aä]|arvoisa\s+puheenjohtaja|puheenjohtaja|kannatan|esit[aä]n|kysyn|haluan\s+nostaa|valtuutettu\s+laru/i;
const listContext = /nimenhuuto|poissa|l[aä]sn[aä]|varaj[aä]sen|lautakunta|valitaan|j[aä]seneksi|[a-zåäö]+,\s+[a-zåäö]+,\s+[a-zåäö]+,/i;
const referenceContext = /laru\s+puhui|larun\s+puheenvuoro|vastauksena\s+larulle|valtuutettu\s+larulle/i;

const manualHitReviews = [
  {
    youtubeId: "_s4SnjPh0PE",
    startsAt: 4260,
    toleranceSeconds: 90,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Lawson-Hellu",
    note: "Tarkistettu litteraatista: puheenjohtaja antaa vuoron Lawson-Hellulle/Lateko-Hellulle, ei Jari Larulle."
  },
  {
    youtubeId: "_s4SnjPh0PE",
    startsAt: 11100,
    toleranceSeconds: 120,
    classification: "hylätty nimilista/aloitteiden lukeminen",
    reviewDecision: "rejected",
    speaker: "sihteeri",
    note: "Tarkistettu litteraatista: kyse on asiakohtien ja valtuustoaloitteiden lukemisesta, ei Jari Larun puheenvuorosta."
  },
  {
    youtubeId: "dc_YU-ZjToc",
    startsAt: 9420,
    toleranceSeconds: 120,
    classification: "hylätty lautakuntajäsenten vaalilista",
    reviewDecision: "rejected",
    speaker: "valtuutettu Kolmonen",
    note: "Tarkistettu litteraatista: kohdassa esitetään sivistys- ja kulttuurilautakunnan jäseniä, mukana Jari Laru nimilistassa."
  },
  {
    youtubeId: "NDbJ2Nf4OxM",
    startsAt: 9420,
    toleranceSeconds: 120,
    classification: "hylätty lautakuntajäsenten vaalilista",
    reviewDecision: "rejected",
    speaker: "valtuutettu Kolmonen",
    note: "Tarkistettu litteraatista: kyse on samasta sivistys- ja kulttuurilautakunnan jäsenten vaalilistasta kuin rinnakkaisessa 5.6.2017 tallenteessa."
  },
  {
    youtubeId: "ryJF54kD-58",
    startsAt: 1800,
    toleranceSeconds: 120,
    classification: "viittaus Jari Laruun",
    reviewDecision: "reference",
    speaker: "Sirviö",
    note: "Tarkistettu litteraatista: kyse on Sirviön kysymyksestä, jossa viitataan valtuutettu Laruun; ei Jari Larun puheenvuoro."
  },
  {
    youtubeId: "ryJF54kD-58",
    startsAt: 14940,
    toleranceSeconds: 120,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Lawson-Hellu",
    note: "Tarkistettu litteraatista: puheenjohtaja antaa vuoron Lawson-Hellulle, ei Jari Larulle."
  },
  {
    youtubeId: "ryJF54kD-58",
    startsAt: 16440,
    toleranceSeconds: 120,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Oja-Lehto",
    note: "Tarkistettu litteraatista: kohta on Oja-Lehdon puheenvuoro, ei Jari Larun puheenvuoro."
  },
  {
    youtubeId: "Xpsqd8oegrg",
    startsAt: 6060,
    toleranceSeconds: 90,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Lawson-Hellu",
    note: "Tarkistettu litteraatista: kohta jatkuu Lawson-Hellun kysymykseen, ei Jari Larun puheenvuoroon."
  },
  {
    youtubeId: "aoDtYnge4LU",
    startsAt: 10411.28,
    toleranceSeconds: 90,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Lawson-Hellu",
    note: "Tarkistettu litteraatista: puheenjohtaja antaa vuoron Lawson-Hellulle, ei Jari Larulle."
  },
  {
    youtubeId: "MSwNnPOutVE",
    startsAt: 10860,
    toleranceSeconds: 90,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Lawson-Hellu",
    note: "Kuunneltu käsin: kohdassa puhuu Lawson-Hellu, ei Jari Laru."
  },
  {
    youtubeId: "SWh6nkVRAIc",
    startsAt: 9420,
    toleranceSeconds: 120,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Lawson-Hellu",
    note: "Tarkistettu litteraatista: 27.11.2017 talousarviokeskustelun kohdassa puhuu Lawson-Hellu, ei Jari Laru."
  },
  {
    youtubeId: "mvSWzUYaMyM",
    startsAt: 7980,
    toleranceSeconds: 90,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Lawson-Hellu",
    note: "Tarkistettu litteraatista: kyselytunnin viimeinen kysymys menee Lawson-Hellulle, ei Jari Larulle."
  },
  {
    youtubeId: "mvSWzUYaMyM",
    startsAt: 17832,
    toleranceSeconds: 120,
    classification: "hylätty valtuustoaloitteiden lukeminen",
    reviewDecision: "rejected",
    speaker: "sihteeri",
    note: "Tarkistettu litteraatista: kyse on valtuustoaloitteen lukemisesta, ei puheenvuorosta."
  },
  {
    youtubeId: "pzAqzLVRFjI",
    startsAt: 8040,
    toleranceSeconds: 120,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Lappalainen",
    note: "Tarkistettu litteraatista: puheenjohtaja antaa vuoron Lappalaiselle, ei Jari Larulle."
  },
  {
    youtubeId: "Hagilx03nzk",
    startsAt: 8172,
    toleranceSeconds: 90,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Lawson-Hellu",
    note: "Tarkistettu litteraatista: kohta on Lawson-Hellun puheenvuoro Oulunsalon hammashoitolasta."
  },
  {
    youtubeId: "Hagilx03nzk",
    startsAt: 10172.72,
    toleranceSeconds: 90,
    classification: "viittaus Jari Larun puheenvuoroon",
    reviewDecision: "reference",
    speaker: "toinen valtuutettu",
    note: "Tarkistettu litteraatista: toinen valtuutettu täydentää valtuutettu Larun kaupunginosa- ja suuraluepuheenvuoroa."
  },
  {
    youtubeId: "f-jaWyE97P0",
    startsAt: 9120,
    toleranceSeconds: 90,
    classification: "viittaus Jari Laruun",
    reviewDecision: "reference",
    speaker: "toinen valtuutettu",
    note: "Tarkistettu litteraatista: toinen valtuutettu viittaa Laruun yliopiston koulutusneuvostossa, ei Jari Larun puheenvuoro."
  },
  {
    youtubeId: "f-jaWyE97P0",
    startsAt: 11680,
    toleranceSeconds: 120,
    classification: "hylätty väärä puhuja",
    reviewDecision: "rejected",
    speaker: "Lawson-Hellu",
    note: "Tarkistettu litteraatista: puheenjohtaja antaa vuoron Lateko/Lawson-Hellulle, ei Jari Larulle."
  },
  {
    youtubeId: "jzy_BsdgDhY",
    startsAt: 15854,
    toleranceSeconds: 120,
    classification: "viittaus Jari Laruun",
    reviewDecision: "reference",
    speaker: "toinen valtuutettu",
    note: "Tarkistettu litteraatista: toinen valtuutettu sanoo jakavansa huolta valtuutettu Larun kanssa; ei Jari Larun puheenvuoro."
  },
  {
    youtubeId: "gZsi7ybN_AM",
    startsAt: 16589,
    toleranceSeconds: 240,
    classification: "linkitetty puheenvuoro",
    reviewDecision: "mapped",
    speaker: "Jari Laru",
    note: "Tarkistettu litteraatista: sama koulusihteeripuheenvuoro on jo sivulla /2019/10/07/puheenvuoro-valtuustossa-koulusihteeripalveluista-on-paatettava-osana-laajempaa-kokonaisuutta/."
  },
  {
    youtubeId: "-cKXhhzhsiQ",
    startsAt: 3456,
    toleranceSeconds: 120,
    classification: "viittaus Jari Larun puheenvuoroon",
    reviewDecision: "reference",
    speaker: "toinen valtuutettu",
    note: "Tarkistettu litteraatista: toinen valtuutettu viittaa Larun aiempaan kommenttiin Oulun rakennussuojelusta; ei Jari Larun puheenvuoro."
  }
];

function readJson(filePath, fallback = null) {
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

function formatTime(totalSeconds) {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((part) => String(part).padStart(2, "0")).join(":");
}

function durationSeconds(audioPath) {
  if (!fs.existsSync(audioPath)) return 0;
  const result = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audioPath],
    { encoding: "utf8" }
  );
  if (result.status !== 0) return 0;
  return Math.ceil(Number(result.stdout.trim()) || 0);
}

function allMeetingVideos() {
  const data = readJson(MEETING_VIDEO_DATA, { byDate: {} });
  return Object.entries(data.byDate || {})
    .flatMap(([date, videos]) => (videos || []).map((video) => ({ date, ...video })))
    .sort((a, b) => `${a.date}:${a.youtubeId}`.localeCompare(`${b.date}:${b.youtubeId}`));
}

function linkedSpeechVideos() {
  const data = readJson(SPEECH_VIDEO_DATA, { byUrl: {} });
  const byYoutubeId = new Map();
  for (const [pageUrl, videos] of Object.entries(data.byUrl || {})) {
    for (const video of videos || []) {
      if (!video.youtubeId) continue;
      if (!byYoutubeId.has(video.youtubeId)) byYoutubeId.set(video.youtubeId, []);
      byYoutubeId.get(video.youtubeId).push({
        pageUrl,
        start: video.start ?? null,
        label: video.label || "",
        verified: Boolean(video.verified)
      });
    }
  }
  for (const items of byYoutubeId.values()) {
    items.sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
  }
  return byYoutubeId;
}

function macwhisperCandidateMatches() {
  const data = readJson(MACWHISPER_CANDIDATES, { rows: [] });
  const byDate = new Map();

  for (const row of data.rows || []) {
    if (!row.date) continue;
    const candidate = {
      title: row.title,
      permalink: row.permalink,
      file: row.file,
      context: row.context,
      bestStart: row.bestStart ?? null,
      bestTime: row.bestStart != null ? formatTime(row.bestStart) : "",
      confidence: row.confidence || "none",
      bestTranscript: row.bestTranscript || "",
      bestTranscriptPath: row.bestTranscriptPath || "",
      score: row.transcriptResults?.[0]?.candidates?.[0]?.score || 0
    };
    const items = byDate.get(row.date) || [];
    items.push(candidate);
    byDate.set(row.date, items);
  }

  for (const items of byDate.values()) {
    items.sort((a, b) => (a.bestStart ?? 0) - (b.bestStart ?? 0) || a.title.localeCompare(b.title));
  }

  return byDate;
}

function chunkFiles(youtubeId) {
  const candidates = [];
  for (const dir of [CHUNK_ROOT, path.join(CHUNK_ROOT, "10s"), path.join(CHUNK_ROOT, "60s")]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      const match = name.match(new RegExp(`^${youtubeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-chunk-(\\d+)\\.json$`));
      if (match) {
        candidates.push({
          filePath: path.join(dir, name),
          chunkIndex: Number(match[1]),
          chunkSeconds: path.basename(dir) === "10s" ? 10 : path.basename(dir) === "60s" ? 60 : 30
        });
      }
    }
  }
  return candidates.sort((a, b) => a.chunkSeconds - b.chunkSeconds || a.chunkIndex - b.chunkIndex);
}

function segmentText(json) {
  if (Array.isArray(json?.transcription)) return json.transcription;
  if (Array.isArray(json?.segments)) return json.segments;
  return [];
}

function classifyHit(text) {
  if (referenceContext.test(text)) return "viittaus aiempaan puheenvuoroon";
  if (speechContext.test(text) && !listContext.test(text)) return "puhe-ehdokas";
  if (listContext.test(text)) return "nimilista/valinta";
  return "tarkistettava osuma";
}

function applyManualHitReview(youtubeId, hit) {
  const review = manualHitReviews.find((item) => {
    if (item.youtubeId !== youtubeId) return false;
    return Math.abs(Number(hit.startsAt || 0) - item.startsAt) <= (item.toleranceSeconds || 0);
  });
  return review ? { ...hit, ...review } : hit;
}

function scanHits(youtubeId, files) {
  const hits = [];
  for (const item of files) {
    const json = readJson(item.filePath, {});
    for (const segment of segmentText(json)) {
      const text = String(segment.text || "").replace(/\s+/g, " ").trim();
      if (!text) continue;
      const isStrict = strictName.test(text);
      const isLoose = !isStrict && looseName.test(text);
      if (!isStrict && !isLoose) continue;
      const segmentOffsetSeconds = Number(segment.start || 0) || Number(segment.offsets?.from || 0) / 1000 || 0;
      const startsAt = item.chunkIndex * item.chunkSeconds + segmentOffsetSeconds;
      hits.push(applyManualHitReview(youtubeId, {
        startsAt,
        time: formatTime(startsAt),
        type: isStrict ? "strict" : "loose",
        classification: classifyHit(text),
        text
      }));
    }
  }
  return hits.sort((a, b) => a.startsAt - b.startsAt);
}

function statusFor(video, linkedByVideo, macwhisperByDate) {
  const audioPath = path.join(AUDIO_DIR, `${video.youtubeId}.wav`);
  const duration = durationSeconds(audioPath);
  const files = chunkFiles(video.youtubeId);
  const byChunkLength = new Map();
  for (const file of files) {
    if (!byChunkLength.has(file.chunkSeconds)) byChunkLength.set(file.chunkSeconds, []);
    byChunkLength.get(file.chunkSeconds).push(file);
  }
  const preferredChunkSeconds = byChunkLength.has(60) ? 60 : byChunkLength.has(30) ? 30 : byChunkLength.has(10) ? 10 : 60;
  const preferredFiles = byChunkLength.get(preferredChunkSeconds) || [];
  const expectedChunks = duration > 0 ? Math.ceil(duration / preferredChunkSeconds) : 0;
  const completedChunks = new Set(preferredFiles.map((file) => file.chunkIndex)).size;
  const completion =
    expectedChunks > 0 && completedChunks >= expectedChunks
      ? "valmis"
      : completedChunks > 0
        ? "kesken"
        : fs.existsSync(audioPath)
          ? "audio valmis, ei litteroitu"
          : "ei audioa";

  return {
    date: video.date,
    youtubeId: video.youtubeId,
    title: video.title,
    url: video.url,
    audio: fs.existsSync(audioPath),
    durationSeconds: duration,
    duration: duration ? formatTime(duration) : "",
    chunkSeconds: preferredChunkSeconds,
    completedChunks,
    expectedChunks,
    completion,
    linkedSpeechPages: linkedByVideo.get(video.youtubeId) || [],
    macwhisperCandidates: macwhisperByDate.get(video.date) || [],
    hits: scanHits(video.youtubeId, preferredFiles).slice(0, 40)
  };
}

function markdownTable(rows) {
  const header = "| Päivä | Video | Tila | Linkitettyjä puhesivuja | MacWhisper-osumia | Nimi-/puheosumat | Huomio |\n|---|---|---:|---:|---:|---:|---|";
  const body = rows.map((row) => {
    const speechCandidates = row.hits.filter((hit) => hit.classification === "puhe-ehdokas").length;
    const rejected = row.hits.filter((hit) => hit.reviewDecision === "rejected").length;
    const mentions = row.hits.length - speechCandidates - rejected;
    const notes = [];
    if (speechCandidates > 0) notes.push(`${speechCandidates} ${speechCandidates === 1 ? "puhe-ehdokas" : "puhe-ehdokasta"}`);
    if (rejected > 0) notes.push(`${rejected} ${rejected === 1 ? "hylätty vääränä puhujana" : "hylättyä vääränä puhujana"}`);
    if (!speechCandidates && row.hits.length > 0 && mentions > 0) notes.push(`${mentions} ${mentions === 1 ? "nimimaininta/viittaus" : "nimimainintaa/viittausta"}`);
    if (row.macwhisperCandidates.length > 0) notes.push(`${row.macwhisperCandidates.length} ${row.macwhisperCandidates.length === 1 ? "tekstimatch" : "tekstimatchia"}`);
    const note = notes.join(", ");
    const title = row.url ? `[${row.title}](${row.url})` : row.title;
    return `| ${row.date} | ${title} | ${row.completion} ${row.completedChunks}/${row.expectedChunks || "?"} | ${row.linkedSpeechPages.length} | ${row.macwhisperCandidates.length} | ${row.hits.length} | ${note} |`;
  });
  return [header, ...body].join("\n");
}

function main() {
  const videos = allMeetingVideos();
  const linkedByVideo = linkedSpeechVideos();
  const macwhisperByDate = macwhisperCandidateMatches();
  const rows = videos
    .filter((video) => fs.existsSync(path.join(AUDIO_DIR, `${video.youtubeId}.wav`)) || linkedByVideo.has(video.youtubeId))
    .map((video) => statusFor(video, linkedByVideo, macwhisperByDate));
  const queue = readJson(QUEUE_STATUS, null);
  const report = {
    generatedAt: new Date().toISOString(),
    queue,
    summary: {
      videos: rows.length,
      complete: rows.filter((row) => row.completion === "valmis").length,
      partial: rows.filter((row) => row.completion === "kesken").length,
      withSpeechCandidates: rows.filter((row) => row.hits.some((hit) => hit.classification === "puhe-ehdokas")).length,
      withMacwhisperCandidates: rows.filter((row) => row.macwhisperCandidates.length > 0).length,
      rejectedManualHits: rows.flatMap((row) => row.hits).filter((hit) => hit.reviewDecision === "rejected").length,
      withLinkedSpeechPages: rows.filter((row) => row.linkedSpeechPages.length > 0).length
    },
    rows
  };

  writeJson(OUT_JSON, report);
  const md = [
    "# Valtuustovideoiden litterointitarkastus",
    "",
    `Päivitetty: ${report.generatedAt}`,
    "",
    `Yhteenveto: ${report.summary.videos} videota, ${report.summary.complete} valmista litterointia, ${report.summary.partial} kesken, ${report.summary.withSpeechCandidates} videossa puhe-ehdokas, ${report.summary.withMacwhisperCandidates} videossa tekstimatch, ${report.summary.rejectedManualHits} ${report.summary.rejectedManualHits === 1 ? "käsin hylätty osuma" : "käsin hylättyä osumaa"}.`,
    "",
    markdownTable(rows),
    ""
  ].join("\n");
  fs.writeFileSync(OUT_MD, md);
  console.log(`Wrote ${path.relative(ROOT, OUT_JSON)}`);
  console.log(`Wrote ${path.relative(ROOT, OUT_MD)}`);
}

main();

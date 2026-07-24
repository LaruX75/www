import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { TextDecoder } from "node:util";

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUTPUT = path.join(ROOT, "src/_data/educationCommitteeOfficialMeetings.json");
const decoder = new TextDecoder("windows-1252");

const SOURCES = [
  {
    bodyKey: "sivistys-ja-kulttuurilautakunta",
    bodyName: "Sivistys- ja kulttuurilautakunta",
    kirjaamo: "730",
    start: "01.06.2017",
    end: "31.12.2022"
  },
  {
    bodyKey: "sivistyslautakunta",
    bodyName: "Sivistyslautakunta",
    kirjaamo: "32416",
    start: "01.01.2023",
    end: "31.12.2026"
  }
];

function decodeEntities(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

function dateToIso(value = "") {
  const match = String(value).match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return "";
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function requestBuffer(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const nextUrl = new URL(response.headers.location, url).toString();
        response.resume();
        requestBuffer(nextUrl, options).then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        return;
      }
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function fetchMeetingList(source) {
  const body = new URLSearchParams({
    oper: "where",
    kirjaamo: source.kirjaamo,
    pvm1: source.start,
    pvm2: source.end
  }).toString();

  const buffer = await requestBuffer("https://asiakirjat.ouka.fi/ktwebscr/pk_kokl_tweb.htm", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body)
    },
    body
  });

  const html = decoder.decode(buffer);
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];

  return rows.flatMap((row) => {
    const text = decodeEntities(row[1]);
    if (!text.includes(source.bodyName)) return [];

    const numberMatch = text.match(/:\s*([0-9]+\/[0-9]{4})/);
    const dateMatch = text.match(/(\d{1,2}\.\d{1,2}\.\d{4})\s+(\d{1,2}:\d{2})/);
    const hrefMatch = row[1].match(/href=["']([^"']*pk_asil_tweb\.htm\?bid=\d+)["']/i);
    if (!numberMatch || !dateMatch || !hrefMatch) return [];

    const protocolUrl = new URL(hrefMatch[1], "https://asiakirjat.ouka.fi").toString();
    return [{
      bodyKey: source.bodyKey,
      bodyName: source.bodyName,
      meetingNumber: numberMatch[1],
      date: dateToIso(dateMatch[1]),
      time: dateMatch[2],
      protocolUrl
    }];
  });
}

function parseAgenda(html = "") {
  const captionMatch = html.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);
  const caption = decodeEntities(captionMatch?.[1] || "");
  const rows = [...html.matchAll(/<tr[^>]*class=["']data[01]["'][^>]*>([\s\S]*?)<\/tr>/gi)];

  return {
    caption,
    items: rows
      .map((row) => [...row[1].matchAll(/<td[^>]*class=["']data["'][^>]*>([\s\S]*?)<\/td>/gi)])
      .filter((cells) => cells.length >= 2)
      .map((cells) => ({
        section: decodeEntities(cells[0][1]),
        title: decodeEntities(cells[1][1]),
        attachments: decodeEntities(cells[2]?.[1] || "")
      }))
      .filter((item) => /^\d+$/.test(item.section) && item.title)
  };
}

const ROUTINE_AGENDA_PATTERNS = [
  /tiedoksi annettavat infoasiat/i,
  /tiedoksi annettavat infot/i,
  /infot .*lautakunnalle/i,
  /nuorisovaltuust.*terveiset/i,
  /tiedoksi annettavat otto-oikeus/i,
  /kokouksen laillisuus/i,
  /pöytäkirjan tarkast/i,
  /pöytäkirjantarkast/i,
  /työjärjestyksen hyväks/i,
  /^muut asiat/i,
  /viranhaltijapäät/i,
  /salassapidettävä/i
];

function cleanAgendaTitle(item = {}) {
  return String(item.title || item || "")
    .replace(/^§\s*\d+\s*/, "")
    .replace(/\u0080/g, "€")
    .replace(/[\u0096\u0097]/g, "–")
    .replace(/\s+/g, " ")
    .trim();
}

function isRoutineAgendaTitle(title = "") {
  return ROUTINE_AGENDA_PATTERNS.some((pattern) => pattern.test(title));
}

function joinFinnishList(items = []) {
  if (items.length <= 1) return items[0] || "";
  if (items.length === 2) return `${items[0]} sekä ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} sekä ${items[items.length - 1]}`;
}

function compactRepeatedAgendaTitles(titles = []) {
  const compacted = [];
  let serviceNetworkAdded = false;
  const serviceNetworkTitles = titles
    .filter((title) => /^Palveluverkkoa koskeva päätös:/i.test(title))
    .map((title) => title.replace(/^Palveluverkkoa koskeva päätös:\s*/i, "").trim())
    .filter(Boolean);

  titles.forEach((title) => {
    if (/^Palveluverkkoa koskeva päätös:/i.test(title)) {
      if (!serviceNetworkAdded) {
        const schools = serviceNetworkTitles.slice(0, 5);
        const suffix = serviceNetworkTitles.length > schools.length ? " ja muita kohteita" : "";
        compacted.push(`Palveluverkkoa koskevat päätökset: ${joinFinnishList(schools)}${suffix}`);
        serviceNetworkAdded = true;
      }
      return;
    }

    compacted.push(title);
  });

  return compacted;
}

function pykalaCountSentence(count = 0) {
  if (!count) return "";
  return count === 1
    ? "Pöytäkirjassa oli 1 pykälä."
    : `Pöytäkirjassa oli kaikkiaan ${count} pykälää.`;
}

function agendaSummary(meeting, items) {
  const highlights = compactRepeatedAgendaTitles(items
    .map(cleanAgendaTitle)
    .filter((title) => title && !isRoutineAgendaTitle(title)))
    .slice(0, 4);
  const count = items.length;
  if (!count) {
    return "Pöytäkirjasta ei saatu poimittua pykäläotsikoita automaattisesti. Kokous säilyy silti aikajanalla virallisen pöytäkirjalinkin kautta.";
  }
  if (!highlights.length) {
    return `${pykalaCountSentence(count)} Julkisesti näkyvät otsikot eivät avaa kokouksen sisältöä tarkemmin.`;
  }

  const lead = highlights.length > 2
    ? "Kokouksen asioita olivat muun muassa"
    : "Kokouksen asioita olivat";

  return `${lead} ${joinFinnishList(highlights)}. ${pykalaCountSentence(count)}`;
}

async function fetchAgendaFor(meeting) {
  const buffer = await requestBuffer(meeting.protocolUrl);
  const html = decoder.decode(buffer);
  const agenda = parseAgenda(html);
  return {
    ...meeting,
    caption: agenda.caption,
    agendaItems: agenda.items,
    agendaSummary: agendaSummary(meeting, agenda.items)
  };
}

async function main() {
  const meetings = [];

  for (const source of SOURCES) {
    const list = await fetchMeetingList(source);
    console.log(`[education-committee] ${source.bodyName}: ${list.length} kokousta`);

    for (const meeting of list) {
      process.stdout.write(`[education-committee] ${meeting.date} ${meeting.meetingNumber} `);
      try {
        const enriched = await fetchAgendaFor(meeting);
        meetings.push(enriched);
        process.stdout.write(`${enriched.agendaItems.length} pykälää\n`);
      } catch (error) {
        meetings.push({
          ...meeting,
          caption: "",
          agendaItems: [],
          agendaSummary: "Pöytäkirjan pykäläotsikoita ei saatu noudettua automaattisesti.",
          error: error.message
        });
        process.stdout.write(`virhe: ${error.message}\n`);
      }
    }
  }

  meetings.sort((a, b) => a.date.localeCompare(b.date) || a.meetingNumber.localeCompare(b.meetingNumber));
  fs.writeFileSync(OUTPUT, `${JSON.stringify({ sources: SOURCES, meetings }, null, 2)}\n`);
  console.log(`[education-committee] kirjoitettu ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

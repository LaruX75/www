import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { TextDecoder } from "node:util";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { protocolsByDate } = require("../src/_data/oukaCouncilSpeechProtocols.js");

const ROOT = path.resolve(new URL("..", import.meta.url).pathname);
const OUTPUT = path.join(ROOT, "src/_data/councilMeetingAgendas.json");
const decoder = new TextDecoder("windows-1252");

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const nextUrl = new URL(response.headers.location, url).toString();
        response.resume();
        fetchBuffer(nextUrl).then(resolve, reject);
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
    }).on("error", reject);
  });
}

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

function parseAgenda(html = "") {
  const captionMatch = html.match(/<caption[^>]*>([\s\S]*?)<\/caption>/i);
  const caption = decodeEntities(captionMatch?.[1] || "");
  const rows = [...html.matchAll(/<tr[^>]*class=["']data[01]["'][^>]*>([\s\S]*?)<\/tr>/gi)];

  const items = rows
    .map((row) => [...row[1].matchAll(/<td[^>]*class=["']data["'][^>]*>([\s\S]*?)<\/td>/gi)])
    .filter((cells) => cells.length >= 2)
    .map((cells) => {
      const section = decodeEntities(cells[0][1]);
      const title = decodeEntities(cells[1][1]);
      const attachmentText = decodeEntities(cells[2]?.[1] || "");
      return {
        section,
        title,
        attachments: attachmentText === "-" ? "" : attachmentText
      };
    })
    .filter((item) => item.section && item.title);

  return { caption, items };
}

async function main() {
  const result = {};
  const entries = Object.entries(protocolsByDate).sort(([a], [b]) => a.localeCompare(b));

  for (const [date, url] of entries) {
    process.stdout.write(`[agenda] ${date} `);
    try {
      const buffer = await fetchBuffer(url);
      const html = decoder.decode(buffer);
      const agenda = parseAgenda(html);
      result[date] = {
        protocolUrl: url,
        caption: agenda.caption,
        items: agenda.items
      };
      process.stdout.write(`${agenda.items.length} asiakohtaa\n`);
    } catch (error) {
      result[date] = {
        protocolUrl: url,
        caption: "",
        items: [],
        error: error.message
      };
      process.stdout.write(`virhe: ${error.message}\n`);
    }
  }

  fs.writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
  console.log(`[agenda] kirjoitettu ${OUTPUT}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

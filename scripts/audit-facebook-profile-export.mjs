#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const REPORT_JSON = "reports/facebook-profile-export-audit.json";
const REPORT_CSV = "reports/facebook-profile-export-audit.csv";
const REPORT_MD = "reports/facebook-profile-export-audit.md";

const TARGET_GROUP_TERMS = [
  "oulun ja oulun seudun politiikka",
  "oulun kuntapolitiikka",
  "oulun puskaradio",
  "jäälin puskaradio",
  "kiimingin puskaradio",
  "haukiputaan puskaradio",
  "oulun kokoomusvaikuttajat"
];

const THEMES = [
  {
    key: "sivistyslautakunta",
    label: "Sivistyslautakunta ja koulutuspolitiikka",
    terms: ["sivistyslautakunta", "sivistys- ja kulttuurilautakunta", "siku", "koulu", "opetus", "oppilas", "varhaiskasvatus", "lukio", "digione"]
  },
  {
    key: "palveluverkko",
    label: "Palveluverkko ja kaupunginosat",
    terms: ["palveluverkko", "kouluverkko", "lähikoulu", "lähipalvel", "jääli", "kiiminki", "haukipudas", "oulunsalo", "kaupunginosa", "suuralue"]
  },
  {
    key: "kampus",
    label: "Kampus, Raksila ja Linnanmaa",
    terms: ["kampus", "linnanmaa", "raksila", "keskustakampus", "normaalikoulu", "yliopisto", "syk", "kontinkangas"]
  },
  {
    key: "avoimuus",
    label: "Avoimuus, data ja tiedolla johtaminen",
    terms: ["avoimuus", "läpinäky", "tietojohtaminen", "data", "mittari", "valmistelu", "pöytäkirja", "kartta", "bi"]
  },
  {
    key: "kulttuuri",
    label: "Kulttuuri, liikunta ja kirjastot",
    terms: ["kulttuuri", "kirjasto", "luuppi", "museo", "kierikki", "liikunta", "uimahalli", "ouluhalli", "nuoriso"]
  },
  {
    key: "vaalit",
    label: "Vaalit ja kampanja",
    terms: ["vaalit", "vaalikone", "ehdokas", "äänestä", "kampanja", "kuntavaalit", "aluevaalit"]
  }
];

function parseArgs(argv) {
  const args = {
    input: "",
    minChars: 80,
    limit: 0,
    onlyTargetGroups: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--input" || arg === "-i") {
      args.input = next || "";
      index += 1;
    } else if (arg === "--min-chars") {
      args.minChars = Number(next || args.minChars);
      index += 1;
    } else if (arg === "--limit") {
      args.limit = Number(next || 0);
      index += 1;
    } else if (arg === "--only-target-groups") {
      args.onlyTargetGroups = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  npm run audit:facebook-profile -- --input /path/to/facebook-profile-export
  npm run audit:facebook-profile -- --input /path/to/file.json

Options:
  --input, -i            Extracted Facebook profile export directory or one JSON file
  --min-chars            Skip very short texts, default 80
  --limit                Only analyze first N candidates
  --only-target-groups   Keep only likely Oulu/politics/puskaradio group content

This tool writes:
  ${REPORT_JSON}
  ${REPORT_CSV}
  ${REPORT_MD}
`);
}

function normalize(value = "") {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function decodeFacebookText(value = "") {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function listJsonFiles(inputPath) {
  const absolute = path.resolve(ROOT, inputPath);
  const stat = fs.statSync(absolute);

  if (stat.isFile() && absolute.toLowerCase().endsWith(".json")) return [absolute];
  if (!stat.isDirectory()) return [];

  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(absolute, entry.name);
    if (entry.isDirectory()) return listJsonFiles(entryPath);
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) return [entryPath];
    return [];
  });
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function timestampToDate(value) {
  if (!value) return "";
  if (typeof value === "number") return new Date(value * 1000).toISOString().slice(0, 10);
  const match = String(value).match(/\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function collectStrings(value, output = []) {
  if (typeof value === "string") {
    const text = decodeFacebookText(value);
    if (text) output.push(text);
    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, output));
    return output;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, child]) => {
      if (/uri|url|media|thumbnail|creation_timestamp|timestamp/i.test(key)) return;
      collectStrings(child, output);
    });
  }

  return output;
}

function extractUrl(value) {
  if (!value || typeof value !== "object") return "";
  const direct = value.url || value.uri || value.href || value.permalink_url || "";
  if (typeof direct === "string" && /^https?:\/\//.test(direct)) return direct;
  if (Array.isArray(value.attachments)) {
    for (const attachment of value.attachments) {
      const url = extractUrl(attachment);
      if (url) return url;
    }
  }
  if (value.media) return extractUrl(value.media);
  return "";
}

function likelyContentType(filePath, item = {}) {
  const lower = normalize(filePath);
  const strings = collectStrings(item).join(" ").toLowerCase();
  if (/comment|komment/.test(lower) || /commented on|kommentoi/.test(strings)) return "comment";
  if (/group|ryhm/.test(lower) || /group|ryhma/.test(strings)) return "group";
  if (/post|timeline|status|julkais/.test(lower)) return "post";
  return "activity";
}

function itemTimestamp(item = {}) {
  return item.timestamp
    || item.creation_timestamp
    || item.created_timestamp
    || item.created_time
    || item.update_timestamp
    || item.last_modified_timestamp
    || "";
}

function itemTitle(item = {}) {
  return decodeFacebookText(item.title || item.name || item.story || item.label || "");
}

function itemText(item = {}) {
  const preferred = [
    item.data?.post,
    item.data?.comment?.comment,
    item.post,
    item.comment,
    item.message,
    item.text,
    item.description,
    itemTitle(item)
  ].filter(Boolean);

  const all = preferred.length ? preferred : collectStrings(item);
  return decodeFacebookText([...new Set(all.map(decodeFacebookText))].join("\n\n"));
}

function groupNameFrom(item = {}, filePath = "", text = "") {
  const fields = collectStrings({
    title: item.title,
    name: item.name,
    group: item.group,
    sharedWith: item.shared_with,
    attachments: item.attachments
  }).join(" ");
  const haystack = normalize(`${fields} ${filePath} ${text}`);
  const target = TARGET_GROUP_TERMS.find((term) => haystack.includes(normalize(term)));
  if (target) return target;
  const groupMatch = fields.match(/(?:ryhm(?:ä|a)lle|group)\s+([^.\n]+)/i);
  return groupMatch ? decodeFacebookText(groupMatch[1]) : "";
}

function classifyThemes(text = "") {
  const haystack = normalize(text);
  return THEMES
    .filter((theme) => theme.terms.some((term) => haystack.includes(normalize(term))))
    .map((theme) => theme.label);
}

function flattenCandidates(payload, filePath) {
  const root = Array.isArray(payload) ? payload : Object.values(payload || {}).find(Array.isArray);
  if (Array.isArray(root)) return root.map((item) => ({ item, filePath }));

  if (payload && typeof payload === "object") return [{ item: payload, filePath }];
  return [];
}

function csvEscape(value = "") {
  const text = String(value || "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeReports(rows, args, files) {
  fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    input: args.input,
    files: files.length,
    rows: rows.length,
    targetGroupRows: rows.filter((row) => row.targetGroup).length,
    comments: rows.filter((row) => row.type === "comment").length,
    groupItems: rows.filter((row) => row.type === "group").length,
    posts: rows.filter((row) => row.type === "post").length
  };

  fs.writeFileSync(path.join(ROOT, REPORT_JSON), JSON.stringify({ summary, rows }, null, 2));

  const csvHeader = ["date", "type", "targetGroup", "themes", "title", "excerpt", "url", "file"];
  const csvRows = rows.map((row) => [
    row.date,
    row.type,
    row.targetGroup,
    row.themes.join("; "),
    row.title,
    row.excerpt,
    row.url,
    row.file
  ].map(csvEscape).join(","));
  fs.writeFileSync(path.join(ROOT, REPORT_CSV), `${csvHeader.join(",")}\n${csvRows.join("\n")}\n`);

  const md = [
    "# Facebook-profiilidumpin inventaario",
    "",
    `Luotu: ${summary.generatedAt}`,
    `Lähde: \`${args.input}\``,
    "",
    `- JSON-tiedostoja: ${summary.files}`,
    `- Sisältörivejä: ${summary.rows}`,
    `- Kohderyhmiin osuvia: ${summary.targetGroupRows}`,
    `- Kommentteja: ${summary.comments}`,
    `- Ryhmäkontekstia: ${summary.groupItems}`,
    `- Julkaisuja: ${summary.posts}`,
    "",
    "## Vahvimmat löydöt",
    "",
    "| Pvm | Tyyppi | Ryhmä | Teemat | Otsikko / alku |",
    "| --- | --- | --- | --- | --- |",
    ...rows.slice(0, 80).map((row) => (
      `| ${row.date || ""} | ${row.type} | ${row.targetGroup || ""} | ${row.themes.join(", ")} | ${row.title || row.excerpt} |`
    ))
  ].join("\n");
  fs.writeFileSync(path.join(ROOT, REPORT_MD), `${md}\n`);

  return summary;
}

function main() {
  const args = parseArgs(process.argv);
  if (!args.input) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const files = listJsonFiles(args.input);
  const rows = [];

  for (const filePath of files) {
    const payload = safeReadJson(filePath);
    if (!payload) continue;

    for (const { item } of flattenCandidates(payload, filePath)) {
      const text = itemText(item);
      if (text.length < args.minChars) continue;

      const title = itemTitle(item);
      const type = likelyContentType(filePath, item);
      const targetGroup = groupNameFrom(item, filePath, text);
      if (args.onlyTargetGroups && !targetGroup) continue;

      const themes = classifyThemes(`${title}\n${text}`);
      const row = {
        date: timestampToDate(itemTimestamp(item)),
        type,
        targetGroup,
        themes,
        title: title.slice(0, 140),
        excerpt: text.replace(/\s+/g, " ").slice(0, 220),
        textLength: text.length,
        url: extractUrl(item),
        file: path.relative(ROOT, filePath)
      };

      rows.push(row);
      if (args.limit && rows.length >= args.limit) break;
    }
    if (args.limit && rows.length >= args.limit) break;
  }

  rows.sort((a, b) => String(b.date).localeCompare(String(a.date)) || b.textLength - a.textLength);
  const summary = writeReports(rows, args, files);

  console.log(`Facebook profile audit complete: ${summary.rows} rows from ${summary.files} JSON files.`);
  console.log(`Reports: ${REPORT_MD}, ${REPORT_CSV}, ${REPORT_JSON}`);
}

main();

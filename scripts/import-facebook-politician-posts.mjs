#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import "dotenv/config";

const ROOT = process.cwd();
const DEFAULT_OUTPUT = "src/blog/_drafts/facebook-politician";
const DEFAULT_GRAPH_VERSION = "v23.0";
const DEFAULT_GRAPH_TOKEN_ENV = "FACEBOOK_PAGE_ACCESS_TOKEN";
const DEFAULT_GRAPH_PAGE_ID_ENV = "FACEBOOK_PAGE_ID";

const PROFILE_RULES = [
  {
    profile: "sivistys",
    categories: ["Sivistys ja koulutus"],
    terms: ["koulu", "opetus", "oppilas", "opettaja", "varhaiskasvatus", "lukio", "sivistys", "lautakunta", "oppiminen"]
  },
  {
    profile: "lahipalvelut",
    categories: ["Kaupunkikehitys ja palveluverkko"],
    terms: ["palveluverkko", "lähipalvel", "lähikoulu", "kaupunginosa", "suuralue", "jääli", "kiiminki", "haukipudas", "yli-ii", "oulunsalo"]
  },
  {
    profile: "avoinhallinto",
    categories: ["Politiikka ja päätöksenteko"],
    terms: ["avoimuus", "läpinäky", "valmistelu", "päätöksenteko", "tietojohtaminen", "data", "pöytäkirja", "konsernijaosto"]
  },
  {
    profile: "kaupunkikehitys",
    categories: ["Kaupunkikehitys ja palveluverkko"],
    terms: ["kaava", "kaavoitus", "liikenne", "joukkoliikenne", "kampus", "linnanmaa", "raksila", "keskusta", "tontti", "rakentaminen"]
  },
  {
    profile: "hyvinvointi",
    categories: ["Hyvinvointi ja osallisuus"],
    terms: ["hyvinvointi", "sote", "aluevaltuusto", "pohde", "terveys", "osallisuus", "nuoret", "lapset", "perhe"]
  },
  {
    profile: "yhteistyo",
    categories: ["Politiikka ja päätöksenteko"],
    terms: ["yhteistyö", "neuvottelu", "ryhmä", "puolue", "valtuusto", "lautakunta", "luottamushenkilö"]
  }
];

const STOP_WORDS = new Set([
  "että", "joka", "joku", "ovat", "olla", "olen", "tämä", "tässä", "tuo", "tuossa", "niin", "kuten",
  "myös", "vain", "sitä", "sitten", "kun", "mutta", "tai", "sekä", "eli", "jos", "nyt", "vielä",
  "meillä", "meidän", "heidän", "tulee", "pitää", "voisi", "olisi", "hyvin", "ihan", "koko"
]);

function parseArgs(argv) {
  const args = {
    input: "",
    output: DEFAULT_OUTPUT,
    minChars: 120,
    dryRun: false,
    limit: 0,
    graphPageId: process.env[DEFAULT_GRAPH_PAGE_ID_ENV] || "",
    graphTokenEnv: DEFAULT_GRAPH_TOKEN_ENV,
    graphVersion: DEFAULT_GRAPH_VERSION,
    graphLimit: 100,
    graphMaxPages: 25
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];
    if (arg === "--input" || arg === "-i") {
      args.input = next || "";
      i += 1;
    } else if (arg === "--out" || arg === "-o") {
      args.output = next || DEFAULT_OUTPUT;
      i += 1;
    } else if (arg === "--min-chars") {
      args.minChars = Number(next || args.minChars);
      i += 1;
    } else if (arg === "--limit") {
      args.limit = Number(next || 0);
      i += 1;
    } else if (arg === "--graph-page-id") {
      args.graphPageId = next || "";
      i += 1;
    } else if (arg === "--graph-token-env") {
      args.graphTokenEnv = next || DEFAULT_GRAPH_TOKEN_ENV;
      i += 1;
    } else if (arg === "--graph-version") {
      args.graphVersion = next || DEFAULT_GRAPH_VERSION;
      i += 1;
    } else if (arg === "--graph-limit") {
      args.graphLimit = Number(next || args.graphLimit);
      i += 1;
    } else if (arg === "--graph-max-pages") {
      args.graphMaxPages = Number(next || args.graphMaxPages);
      i += 1;
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Usage:
  npm run import:facebook-politician -- --input /path/to/facebook-posts.json
  npm run import:facebook-politician -- --input /path/to/extracted-facebook-export
  npm run import:facebook-politician -- --dry-run

Options:
  --input, -i       Facebook export JSON, JSON array with posts, or extracted export directory
  --out, -o         Output draft directory, default ${DEFAULT_OUTPUT}
  --min-chars       Skip very short posts, default 120
  --limit           Import only first N candidates
  --graph-page-id   Fetch posts from a Facebook Page through Graph API, defaults to ${DEFAULT_GRAPH_PAGE_ID_ENV}
  --graph-token-env Environment variable that contains Page Access Token, default ${DEFAULT_GRAPH_TOKEN_ENV}
  --graph-version   Graph API version, default ${DEFAULT_GRAPH_VERSION}
  --graph-limit     Posts per Graph API page, default 100
  --graph-max-pages Maximum Graph API pages to request, default 25
  --dry-run         Print candidates without writing files

Accepted simplified input shape:
  [
    {
      "date": "2026-01-15",
      "text": "Post text...",
      "url": "https://www.facebook.com/...",
      "title": "Optional title"
    }
  ]
`);
}

function readJson(filePath) {
  const absolute = path.resolve(ROOT, filePath);
  const raw = fs.readFileSync(absolute, "utf8");
  return JSON.parse(raw);
}

function assertGraphFetchAvailable() {
  if (typeof fetch !== "function") {
    throw new Error("Graph import requires Node.js with global fetch support. Use Node 18 or newer.");
  }
}

function buildGraphPostsUrl(args, after = "") {
  const token = process.env[args.graphTokenEnv];
  const url = new URL(`https://graph.facebook.com/${args.graphVersion}/${args.graphPageId}/posts`);
  url.searchParams.set("fields", [
    "id",
    "created_time",
    "message",
    "story",
    "permalink_url",
    "status_type",
    "attachments{media_type,type,url,title,description,media}"
  ].join(","));
  url.searchParams.set("limit", String(args.graphLimit));
  url.searchParams.set("access_token", token);
  if (after) url.searchParams.set("after", after);
  return url;
}

async function readGraphPosts(args) {
  assertGraphFetchAvailable();

  if (!process.env[args.graphTokenEnv]) {
    throw new Error(`Missing Graph API token. Set ${args.graphTokenEnv} before running the importer.`);
  }

  const posts = [];
  let after = "";

  for (let page = 1; page <= args.graphMaxPages; page += 1) {
    const response = await fetch(buildGraphPostsUrl(args, after));
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = payload?.error?.message || `${response.status} ${response.statusText}`;
      throw new Error(`Graph API request failed: ${message}`);
    }

    posts.push(...(Array.isArray(payload.data) ? payload.data : []));
    after = payload?.paging?.cursors?.after || "";
    if (!after || !payload?.paging?.next) break;
  }

  return { posts };
}

function listJsonFiles(dirPath) {
  const absolute = path.resolve(ROOT, dirPath);
  const entries = fs.readdirSync(absolute, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const entryPath = path.join(absolute, entry.name);
    if (entry.isDirectory()) return listJsonFiles(entryPath);
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".json")) return [entryPath];
    return [];
  });
}

function readInput(inputPath) {
  const absolute = path.resolve(ROOT, inputPath);
  const stat = fs.statSync(absolute);
  if (stat.isFile()) return [readJson(absolute)];
  if (!stat.isDirectory()) return [];

  const jsonFiles = listJsonFiles(absolute);
  const postLikeFiles = jsonFiles.filter((filePath) => {
    const lower = filePath.toLowerCase();
    return /post|timeline|status|feed|activity|julkais/.test(lower);
  });
  const filesToRead = postLikeFiles.length ? postLikeFiles : jsonFiles;

  return filesToRead.flatMap((filePath) => {
    try {
      return [readJson(filePath)];
    } catch (error) {
      console.warn(`Skipped invalid JSON: ${path.relative(ROOT, filePath)} (${error.message})`);
      return [];
    }
  });
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value).flatMap(toArray);
  return [];
}

function normalizeDate(value) {
  if (!value && value !== 0) return "";
  if (typeof value === "number") {
    const millis = value > 10_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function firstString(...values) {
  const value = values.find((candidate) => typeof candidate === "string" && candidate.trim());
  return value ? decodeMetaExportString(value).trim() : "";
}

function mojibakeScore(value) {
  return (String(value).match(/[ÃÂâ][\u0080-\u00ff]?/g) || []).length;
}

function decodeMetaExportString(value) {
  const text = String(value || "");
  if (!/[ÃÂâ][\u0080-\u00ff]?/.test(text)) return text;

  const decoded = Buffer.from(text, "latin1").toString("utf8");
  if (mojibakeScore(decoded) < mojibakeScore(text)) return decoded;
  return text;
}

function extractMetaExportText(item) {
  const dataTexts = toArray(item.data)
    .map((entry) => firstString(entry?.post, entry?.text, entry?.comment, entry?.description))
    .filter(Boolean);

  const directText = firstString(item.post, item.message, item.text, item.description, item.story);
  return firstString(directText, ...dataTexts);
}

function collectUrls(value, urls = new Set()) {
  if (!value) return urls;
  if (typeof value === "string") {
    const matches = value.match(/https?:\/\/[^\s<>)"]+/g) || [];
    matches.forEach((url) => urls.add(url.replace(/[),.;]+$/, "")));
    return urls;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectUrls(item, urls));
    return urls;
  }
  if (typeof value === "object") {
    ["url", "href", "source", "uri"].forEach((key) => {
      if (typeof value[key] === "string" && value[key].startsWith("http")) urls.add(value[key]);
    });
    Object.values(value).forEach((nested) => collectUrls(nested, urls));
  }
  return urls;
}

function flattenCandidates(root) {
  const sourceItems = Array.isArray(root)
    ? root
    : Array.isArray(root.posts)
      ? root.posts
      : Array.isArray(root.timeline)
        ? root.timeline
        : toArray(root).filter((item) => item && typeof item === "object");

  return sourceItems
    .map((item, index) => {
      const text = extractMetaExportText(item);
      const date = normalizeDate(item.date || item.created_time || item.creation_timestamp || item.timestamp || item.update_timestamp);
      const urls = Array.from(collectUrls(item));
      const facebookUrl = urls.find((url) => url.includes("facebook.com")) || "";
      return {
        index,
        date,
        text,
        title: firstString(item.title, item.name),
        url: firstString(item.url, item.permalink_url, facebookUrl),
        raw: item
      };
    })
    .filter((item) => item.text && item.date);
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((post) => {
    const key = `${post.date}::${post.text.replace(/\s+/g, " ").trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function sentenceExcerpt(text, maxLength = 220) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  const clipped = clean.slice(0, maxLength);
  const sentenceEnd = Math.max(clipped.lastIndexOf("."), clipped.lastIndexOf("!"), clipped.lastIndexOf("?"));
  return `${clipped.slice(0, sentenceEnd > 80 ? sentenceEnd + 1 : clipped.lastIndexOf(" ")).trim()}…`;
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function titleFromText(text) {
  const firstLine = text.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
  const withoutUrls = firstLine.replace(/https?:\/\/\S+/g, "").trim();
  const title = withoutUrls.length > 8 ? withoutUrls : sentenceExcerpt(text, 80);
  return title.length > 88 ? `${title.slice(0, 85).trim()}…` : title;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function classifyPost(text) {
  const lower = text.toLowerCase();
  const politicalProfiles = [];
  const categories = ["Politiikka ja päätöksenteko"];

  PROFILE_RULES.forEach((rule) => {
    if (rule.terms.some((term) => lower.includes(term))) {
      politicalProfiles.push(rule.profile);
      categories.push(...rule.categories);
    }
  });

  if (/\bvaali|ehdok|äänest|kampanja/.test(lower)) {
    categories.push("Vaalit");
  }

  const writingRoles = ["political"];
  if (/\byliopisto|tutkimus|tekoäly|koulutusteknologia|opettajankoulutus|asiantuntija/.test(lower)) {
    writingRoles.push("expert");
  }

  const keywordCandidates = lower
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 5 && !STOP_WORDS.has(word));

  const keywords = unique([
    ...PROFILE_RULES.flatMap((rule) => rule.terms.filter((term) => lower.includes(term)).slice(0, 2)),
    ...keywordCandidates.slice(0, 12)
  ]).slice(0, 12);

  return {
    categories: unique(categories),
    writingRoles: unique(writingRoles),
    politicalProfiles: unique(politicalProfiles.length ? politicalProfiles : ["yhteistyo"]),
    keywords
  };
}

function yamlString(value) {
  const escaped = String(value || "").replace(/'/g, "''");
  return `'${escaped}'`;
}

function yamlArray(key, values) {
  if (!values?.length) return `${key}: []`;
  return `${key}:\n${values.map((value) => `  - ${value}`).join("\n")}`;
}

function buildDraft(post, importedAt) {
  const title = post.title && !post.title.toLowerCase().includes("updated")
    ? post.title
    : titleFromText(post.text);
  const slug = `${post.date}-${slugify(title || `facebook-${post.index}`)}`;
  const classification = classifyPost(post.text);
  const description = sentenceExcerpt(post.text, 240);
  const body = post.text.trim().replace(/\r\n/g, "\n");

  const frontMatter = [
    "---",
    `title: ${yamlString(title)}`,
    `date: '${post.date}'`,
    `description: ${yamlString(description)}`,
    yamlArray("categories", classification.categories),
    yamlArray("keywords", classification.keywords),
    yamlArray("writingRoles", classification.writingRoles),
    yamlArray("politicalProfiles", classification.politicalProfiles),
    "contexts:",
    "  - politics",
    "source: facebook",
    "sourceLabel: Facebook",
    post.url ? `sourceUrl: ${yamlString(post.url)}` : "",
    "contentType: blogPost",
    "facebookImport:",
    "  status: draft",
    `  importedAt: '${importedAt}'`,
    `  sourceIndex: ${post.index}`,
    "eleventyExcludeFromCollections: true",
    "permalink: false",
    "templateEngineOverride: md",
    "---"
  ].filter(Boolean).join("\n");

  const content = `${frontMatter}\n\n> Luonnos Facebookin poliitikkosivun julkaisusta. Käsittele teksti blogimuotoon ennen julkaisua.\n\n## Työstettävä blogiteksti\n\n${body}\n\n## Alkuperäinen lähde\n\n${post.url ? `[Facebook-julkaisu](${post.url})` : "Facebook-julkaisu, tarkista alkuperäinen linkki exportista."}\n`;

  return {
    slug,
    content,
    meta: { title, ...classification, description }
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (!args.input && !args.graphPageId) {
    printHelp();
    process.exit(1);
  }

  const importedAt = new Date().toISOString();
  const roots = [];
  if (args.input) roots.push(...readInput(args.input));
  if (args.graphPageId) roots.push(await readGraphPosts(args));

  let candidates = dedupeCandidates(roots.flatMap(flattenCandidates)
    .filter((post) => post.text.length >= args.minChars)
    .sort((a, b) => b.date.localeCompare(a.date)));

  if (args.limit > 0) candidates = candidates.slice(0, args.limit);

  if (args.dryRun) {
    console.log(`Found ${candidates.length} import candidates.`);
    candidates.slice(0, 30).forEach((post) => {
      console.log(`${post.date} | ${titleFromText(post.text)} | ${post.text.length} chars`);
    });
    return;
  }

  const outputDir = path.resolve(ROOT, args.output);
  fs.mkdirSync(outputDir, { recursive: true });

  const written = [];
  candidates.forEach((post) => {
    const draft = buildDraft(post, importedAt);
    const filePath = path.join(outputDir, `${draft.slug}.md`);
    if (fs.existsSync(filePath)) return;
    fs.writeFileSync(filePath, draft.content, "utf8");
    written.push(filePath);
  });

  console.log(`Facebook import candidates: ${candidates.length}`);
  console.log(`Drafts written: ${written.length}`);
  console.log(`Output: ${path.relative(ROOT, outputDir)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

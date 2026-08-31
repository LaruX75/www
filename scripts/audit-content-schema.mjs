import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import yaml from "js-yaml";

const require = createRequire(import.meta.url);
const schema = require("../src/_data/contentSchema.js");
const { validateCollectionItem } = require("../src/_utils/canonicalContentValidation.js");

const rootDir = process.cwd();

async function walkMarkdown(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkMarkdown(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

function parseFrontMatter(raw, filePath) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return { data: {}, problem: "front matter puuttuu" };
  }

  try {
    return { data: yaml.load(match[1]) || {}, problem: "" };
  } catch (error) {
    return { data: {}, problem: `front matter ei parsittu: ${error.message}` };
  }
}

function getCollectionName(filePath) {
  const normalized = filePath.split(path.sep).join("/");

  for (const [name, rule] of Object.entries(schema.collectionRules)) {
    const prefix = rule.glob.replace("*.md", "");
    if (normalized.includes(prefix)) {
      return name;
    }
  }

  return "";
}

function validateItem(file, data, rule) {
  return validateCollectionItem({
    collectionName: Object.entries(schema.collectionRules).find(([, candidate]) => candidate === rule)?.[0] || "",
    data,
    filePath: file,
    rootDir,
    useResolvedContexts: true,
    strictSemanticChecks: false
  });
}

function printList(title, items, limit = 80) {
  if (!items.length) return;

  console.log(`\n${title} (${items.length})`);
  items.slice(0, limit).forEach((item) => {
    console.log(`- ${item.file}: ${item.field}: ${item.message}`);
  });

  if (items.length > limit) {
    console.log(`- ... ${items.length - limit} lisää`);
  }
}

const files = await walkMarkdown(path.join(rootDir, "src"));
const scopedFiles = files.filter((file) => getCollectionName(file));
const totals = {
  checked: 0,
  byCollection: {},
  errors: [],
  warnings: []
};

for (const file of scopedFiles) {
  const collection = getCollectionName(file);
  const rule = schema.collectionRules[collection];
  const raw = await fs.readFile(file, "utf8");
  const parsed = parseFrontMatter(raw, file);
  const relativeFile = path.relative(rootDir, file);

  totals.checked += 1;
  totals.byCollection[collection] = (totals.byCollection[collection] || 0) + 1;

  if (parsed.problem) {
    totals.errors.push({ file: relativeFile, field: "frontMatter", message: parsed.problem });
    continue;
  }

  const result = validateItem(file, parsed.data, rule);
  totals.errors.push(...result.errors);
  totals.warnings.push(...result.warnings);
}

console.log(`Sisaltoskeeman auditointi ${schema.version}`);
console.log(`Tarkistettuja sisaltoja: ${totals.checked}`);
Object.entries(totals.byCollection)
  .sort(([a], [b]) => a.localeCompare(b, "fi"))
  .forEach(([name, count]) => console.log(`- ${name}: ${count}`));

printList("Virheet", totals.errors);
printList("Varoitukset", totals.warnings);

if (!totals.errors.length && !totals.warnings.length) {
  console.log("\nEi huomautettavaa.");
} else {
  console.log(`\nYhteenveto: ${totals.errors.length} virhetta, ${totals.warnings.length} varoitusta.`);
}

if (totals.errors.length) {
  process.exitCode = 1;
}

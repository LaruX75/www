#!/usr/bin/env node

/**
 * Kokoaa Canva- ja Slideshare-esitykset yhteen JSONiin, jota voi
 * käyttää Copilotin kanssa etsimään sähköposteista esityskohtaista
 * palautetta.
 *
 * Aja: node scripts/build-presentation-feedback-index.js
 * Tulos: reports/presentation-feedback-index.json
 */

const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const projectRoot = process.cwd();
const canvaJsonPath = path.join(projectRoot, "src/_data/canva-presentations.json");
const slideshareDir = path.join(projectRoot, "src/presentations");
const reportsDir = path.join(projectRoot, "reports");
const outPath = path.join(reportsDir, "presentation-feedback-index.json");

function toIsoDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function slug(value, maxLen = 60) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, maxLen);
}

function firstNonEmpty(...values) {
  for (const v of values) {
    if (v === undefined || v === null) continue;
    const s = String(v).trim();
    if (s.length) return s;
  }
  return null;
}

function readCanvaItems() {
  const raw = JSON.parse(fs.readFileSync(canvaJsonPath, "utf8"));
  return raw.map((item, idx) => {
    const title = firstNonEmpty(item.title);
    const date = toIsoDate(item.date);
    const organizer = firstNonEmpty(item.jarjestaja, item.organizer);
    const location = firstNonEmpty(item.location);
    const summary = firstNonEmpty(item.summary, item.description);
    const url = firstNonEmpty(item.publicUrl, item.link);
    const keywords = Array.isArray(item.keywords) ? item.keywords : [];

    return {
      id: `canva-${slug(title || "esitys") || "item-" + idx}`,
      source: "canva",
      title,
      date,
      year: date ? Number(date.slice(0, 4)) : null,
      organizer,
      location,
      summary,
      keywords,
      url
    };
  });
}

function readSlideshareItems() {
  const files = fs.readdirSync(slideshareDir).filter((f) => f.endsWith(".md"));
  const items = [];
  for (const file of files) {
    const filePath = path.join(slideshareDir, file);
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = matter(raw);
    const data = parsed.data || {};

    if (data.type && data.type !== "esitys") continue;

    const title = firstNonEmpty(data.title);
    const date = toIsoDate(data.date);
    const organizer = firstNonEmpty(data.event, data.jarjestaja, data.organizer);
    const audience = firstNonEmpty(data.audience);
    const summary = firstNonEmpty(data.description);
    const url = firstNonEmpty(data.url, data.publicUrl);
    const source = firstNonEmpty(data.source) || "slideshare";
    const keywords = Array.isArray(data.keywords)
      ? data.keywords
      : Array.isArray(data.categories)
        ? data.categories
        : [];

    items.push({
      id: `${source}-${slug(title || file, 60)}`,
      source,
      title,
      date,
      year: date ? Number(date.slice(0, 4)) : null,
      organizer,
      audience,
      summary,
      keywords,
      url
    });
  }
  return items;
}

function buildSearchHints(item) {
  const primary = [];
  if (item.title) primary.push(item.title);
  if (item.organizer) primary.push(item.organizer);
  if (item.audience) primary.push(item.audience);
  if (item.location) primary.push(item.location);
  return {
    primary,
    keywords: item.keywords || []
  };
}

function buildCopilotExamples(item) {
  const examples = [];
  const dateContext = item.year ? ` (vuoden ${item.year} tienoilla)` : "";
  if (item.title) {
    examples.push(
      `Etsi Outlookista viestit, joissa mainitaan "${item.title}"${dateContext} tai jotka liittyvät kyseiseen esitykseen ja niiden palautteet.`
    );
  }
  if (item.organizer) {
    examples.push(
      `Etsi viestit järjestäjältä tai järjestäjän domainista "${item.organizer}"${dateContext} ja poimi palaute-, kiitos- ja arviointiviestit.`
    );
  }
  return examples;
}

function main() {
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const canva = readCanvaItems();
  const slideshare = readSlideshareItems();
  const all = [...canva, ...slideshare]
    .filter((item) => item.title)
    .map((item) => ({
      ...item,
      search_hints: buildSearchHints(item),
      copilot_query_examples: buildCopilotExamples(item)
    }))
    .sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date);
      if (a.date) return -1;
      if (b.date) return 1;
      return String(a.title || "").localeCompare(String(b.title || ""));
    });

  const withOrganizer = all.filter((p) => p.organizer).length;
  const withDate = all.filter((p) => p.date).length;

  const output = {
    generated_at: new Date().toISOString().slice(0, 10),
    purpose:
      "Copilot-avustettu palautehaku sähköpostista esityskohtaisesti. Käytä 'copilot_query_examples' -kenttiä valmiina hakupohjina Outlookissa tai Microsoft 365 Copilotissa.",
    scope:
      "Vain esitykset ja opetusmateriaalit (Canva + Slideshare/muut). Ei sisällä opintojaksopalautetta.",
    counts: {
      total: all.length,
      canva: canva.length,
      slideshare: slideshare.length,
      with_organizer: withOrganizer,
      with_date: withDate
    },
    usage_hints: [
      "Copilot Outlookissa: kopioi 'copilot_query_examples' -pohja hakukenttään tai chattiin.",
      "Yhdistä 'title' + 'organizer' + 'year' -kentät hakuun tarkkuuden parantamiseksi.",
      "Jos esityksellä ei ole 'organizer'-kenttää, käytä pelkkää nimeä ja vuotta.",
      "Kentät 'keywords' ja 'summary' auttavat rajaamaan hakua konteksti-sanoilla."
    ],
    presentations: all
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");

  console.log(`[presentation-feedback-index] total=${all.length} canva=${canva.length} slideshare=${slideshare.length} withOrganizer=${withOrganizer} withDate=${withDate}`);
  console.log(`[presentation-feedback-index] output: ${path.relative(projectRoot, outPath)}`);
}

main();

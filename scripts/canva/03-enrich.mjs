#!/usr/bin/env node
/**
 * Canva Content Pipeline — Vaihe 3: enrichment (richSummary + themes).
 *
 * Lukee data/canva/cache/*.json (Vaihe 2:n tulos) + data/canva/id-map.json
 * (Vaihe 1:n site-metadata). Kutsuu Anthropic API:a tuottamaan per esitys:
 *   - richSummary  (600-1200 mk, esityksen kielellä, PERUSTUU DIA-TEKSTIIN)
 *   - lang         (fi | en | fi-en, päätellään dia-tekstistä)
 *   - themes       (3-5 slugia kiinteästä data/canva/theme-vocabulary.json)
 *   - confidence   (high | medium | low, extraction-peiton perusteella)
 *
 * Kirjoittaa src/_data/canva-presentations-rich.json (committoidaan).
 *
 * INKREMENTAALINEN: jos rich olemassa ja sourceUpdatedAt sama → skippaa.
 *
 * KÄYTTÖ:
 *   node scripts/canva/03-enrich.mjs           # kaikki, cache käytössä
 *   node scripts/canva/03-enrich.mjs --refresh # arvioi kaikki uudelleen
 *   node scripts/canva/03-enrich.mjs --limit=5 # vain 5 ensimmäistä (testi)
 *   node scripts/canva/03-enrich.mjs --design=DAGxxx  # yksi
 */

import fs from "node:fs";
import path from "node:path";
import { loadEnv, requireEnv, ROOT_DIR } from "./_lib/env.mjs";

loadEnv();
const { ANTHROPIC_API_KEY } = requireEnv("ANTHROPIC_API_KEY");

const CACHE_DIR = path.join(ROOT_DIR, "data", "canva", "cache");
const MAP_FILE = path.join(ROOT_DIR, "data", "canva", "id-map.json");
const VOCAB_FILE = path.join(ROOT_DIR, "data", "canva", "theme-vocabulary.json");
const RICH_FILE = path.join(ROOT_DIR, "src", "_data", "canva-presentations-rich.json");
const UNKNOWN_THEMES_LOG = path.join(ROOT_DIR, "data", "canva", "unknown-themes.log");

const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

const argv = process.argv.slice(2);
const forceRefresh = argv.includes("--refresh");
const limitArg = argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.slice("--limit=".length)) : null;
const designArg = argv.find((a) => a.startsWith("--design="));
const DESIGN_ID = designArg ? designArg.slice("--design=".length) : null;

// -----------------------------------------------------------------------------
// Data-lataus
// -----------------------------------------------------------------------------

const idMap = JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
const vocab = JSON.parse(fs.readFileSync(VOCAB_FILE, "utf8")).themes;
const vocabSet = new Set(vocab);

const siteByDesignId = new Map();
idMap.items.forEach((it) => {
  if (it.user?.status === "confirmed" && it.user?.designId) {
    if (!siteByDesignId.has(it.user.designId)) siteByDesignId.set(it.user.designId, []);
    siteByDesignId.get(it.user.designId).push(it.site);
  }
});

function loadCache(designId) {
  const file = path.join(CACHE_DIR, `${designId}.json`);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return null; }
}

function loadRich() {
  if (!fs.existsSync(RICH_FILE)) return { items: [] };
  try { return JSON.parse(fs.readFileSync(RICH_FILE, "utf8")); } catch { return { items: [] }; }
}

function saveRich(rich) {
  fs.mkdirSync(path.dirname(RICH_FILE), { recursive: true });
  const tmp = RICH_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(rich, null, 2) + "\n");
  fs.renameSync(tmp, RICH_FILE);
}

// -----------------------------------------------------------------------------
// Confidence extraction-peiton perusteella
// -----------------------------------------------------------------------------

function extractionConfidence(cache) {
  if (!cache || !cache.slides) return "low";
  const total = cache.pageCount || cache.slides.length;
  if (total === 0) return "low";
  const withText = cache.slides.filter((s) => s.text && s.text.trim().length > 0).length;
  const pct = withText / total;
  if (pct >= 0.8) return "high";
  if (pct >= 0.3) return "medium";
  return "low";
}

// -----------------------------------------------------------------------------
// Prompt
// -----------------------------------------------------------------------------

function truncate(str, max) {
  if (!str) return "";
  return str.length <= max ? str : str.substring(0, max) + "... [KATKAISTU]";
}

function buildPrompt({ designId, cache, sites }) {
  const conf = extractionConfidence(cache);
  const slideText = cache.slides
    .map((s) => `--- Dia ${s.page} ---\n${s.text || "(tyhjä)"}`)
    .join("\n\n");

  // Rajaa dia-tekstin pituus jotta prompti pysyy kohtuullisena (~15000 mk cap)
  const slidesTruncated = truncate(slideText, 15000);

  const siteMeta = sites.map((s, i) => `
Sivustotietue ${i + 1}:
- Otsikko: ${s.title}
- Päivä: ${s.date || "(puuttuu)"}
- Kuvaus: ${s.summary || "(ei)"}
- Avainsanat: ${(s.keywords || []).join(", ") || "(ei)"}
- Paikka: ${s.location || "(ei)"}
- Järjestäjä: ${s.jarjestaja || "(ei)"}
- Kategoria: ${s.kategoria || "(ei)"}
- Kansio: ${s.folder || "(ei)"}
`).join("");

  return `Sinun tehtävänäsi on rikastuttaa Canva-esityksen metadata dia-tekstin pohjalta.

Sinulla on:
1. Canva-esityksen DIA-TEKSTIT (${cache.pageCount} diaa, ${cache.emptyPages.length} tyhjää)
2. Sivustolla olevan tietueen METADATA (kontekstiksi, ei faktalähde)

Kirjoita richSummary VAIN dia-tekstin pohjalta. Metadata on kontekstiksi (esim. tapahtuma-aika, järjestäjä), mutta älä toista sitä eikä keksi sisältöä joka puuttuu dioista.

--- DIA-TEKSTIT ---
${slidesTruncated}

--- SIVUSTOTIETUE (konteksti) ---
${siteMeta}

--- TEHTÄVÄ ---

Palauta JSON tarkalleen tässä muodossa (ei muuta tekstiä):
{
  "designId": "${designId}",
  "lang": "fi" tai "en" tai "fi-en",
  "richSummary": "600-1200 merkin yhteenveto esityksen kielellä",
  "themes": ["slug1", "slug2"],
  "unknownThemes": [],
  "notes": ""
}

**richSummary** (600-1200 mk):
- Perustuu VAIN dia-tekstiin
- Esityksen pääkielellä (fi tai en, päättele dia-tekstistä)
- Kerro: mihin kysymykseen esitys vastaa, keskeiset käsitteet, mallit/viitekehykset, esimerkit, nimetyt työkalut/projektit, kohdeyleisö (jos dioista ilmenee)
- Älä aloita muotoilulla "Canva-esitys, jossa käsitellään..."
- Suomeksi: älä käytä passiivia liikaa, ei genetiiviketjuja, ajatusviiva on –, ei —, suorat lainausmerkit, yhdyssanat kiinni

**lang**:
- "fi" jos dia-tekstin pääkieli on suomi
- "en" jos englanti
- "fi-en" jos molempia tasan (ei automaattista fallbackia)

**themes** (3-5 slugia):
Käytä VAIN seuraavia:
${vocab.map((s) => `  ${s}`).join("\n")}

Älä keksi uusia. Jos jokin dioissa esiintyvä teema puuttuu listasta, kirjaa se \`unknownThemes\`-kenttään (ei themes:iin).

**notes**: mahdollisia huomioita ihmiselle (esim. "dia-teksti sekava" tai "sisältää lyhennettyjä otsikoita").`;
}

// -----------------------------------------------------------------------------
// Claude
// -----------------------------------------------------------------------------

async function callClaude(prompt) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API HTTP ${res.status}: ${text.substring(0, 300)}`);
  }
  const data = await res.json();
  return { text: data.content?.[0]?.text || "", usage: data.usage };
}

function parseClaude(text) {
  let clean = text.trim();
  if (clean.startsWith("```")) clean = clean.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  try { return JSON.parse(clean); }
  catch (e) {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw e;
  }
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  const cacheFiles = fs.readdirSync(CACHE_DIR).filter((f) => f.endsWith(".json"));
  console.log(`[enrich] ${cacheFiles.length} cache-tiedostoa saatavilla`);

  const rich = loadRich();
  const richByDesignId = new Map(rich.items.map((it) => [it.designId, it]));

  // Kohteet
  let designIds;
  if (DESIGN_ID) {
    designIds = [DESIGN_ID];
  } else {
    designIds = cacheFiles.map((f) => f.replace(/\.json$/, ""));
  }

  const targets = [];
  for (const designId of designIds) {
    const cache = loadCache(designId);
    if (!cache) { console.warn(`  [skip] ${designId}: ei cachea`); continue; }
    const existing = richByDesignId.get(designId);
    if (!forceRefresh && existing && existing.sourceUpdatedAt === cache.sourceUpdatedAt && existing.richSummary) {
      // Skippaa (cache hit)
      continue;
    }
    const sites = siteByDesignId.get(designId) || [];
    targets.push({ designId, cache, sites });
  }

  const trimmed = LIMIT ? targets.slice(0, LIMIT) : targets;
  console.log(`[enrich] ${trimmed.length} enrichattavaa (${cacheFiles.length - trimmed.length} skipattu cachena)\n`);

  if (trimmed.length === 0) return;

  let successes = 0, failures = 0, tokIn = 0, tokOut = 0;
  const unknownThemesAll = [];

  for (const target of trimmed) {
    const { designId, cache, sites } = target;
    const siteTitle = sites[0]?.title || "(ei site-osumaa)";
    process.stdout.write(`  [${designId}] ${siteTitle.substring(0, 55)}... `);

    try {
      const prompt = buildPrompt(target);
      const { text, usage } = await callClaude(prompt);
      const parsed = parseClaude(text);
      tokIn += usage?.input_tokens || 0;
      tokOut += usage?.output_tokens || 0;

      // Validoi themes vs. sanasto
      const validThemes = (parsed.themes || []).filter((t) => vocabSet.has(t));
      const rejectedThemes = (parsed.themes || []).filter((t) => !vocabSet.has(t));
      const allUnknownThemes = [...(parsed.unknownThemes || []), ...rejectedThemes];
      if (allUnknownThemes.length) {
        unknownThemesAll.push({ designId, unknownThemes: allUnknownThemes });
      }

      const item = {
        designId,
        lang: parsed.lang || "fi",
        richSummary: parsed.richSummary || "",
        themes: validThemes,
        unknownThemesProposed: allUnknownThemes.length ? allUnknownThemes : undefined,
        confidence: extractionConfidence(cache),
        slideCount: cache.pageCount,
        emptyPages: cache.emptyPages.length,
        pageCount: cache.pageCount,
        sourceUpdatedAt: cache.sourceUpdatedAt,
        model: MODEL,
        generatedAt: new Date().toISOString(),
        notes: parsed.notes || ""
      };

      // Päivitä rich (inkrementaalinen tallennus)
      const idx = rich.items.findIndex((it) => it.designId === designId);
      if (idx >= 0) rich.items[idx] = item;
      else rich.items.push(item);
      saveRich(rich);

      successes++;
      const summaryLen = item.richSummary.length;
      const themesStr = item.themes.join(", ");
      const lenColor = summaryLen >= 600 && summaryLen <= 1200 ? "" : "⚠";
      console.log(`→ ${item.lang.toUpperCase()} ${summaryLen}mk ${lenColor}[${themesStr}] conf=${item.confidence}`);
    } catch (e) {
      failures++;
      console.log(`→ VIRHE: ${e.message.substring(0, 100)}`);
    }
  }

  // Tallenna unknown themes -loki (jos joitakin)
  if (unknownThemesAll.length) {
    const logLines = unknownThemesAll.map((u) => `${u.designId}: ${u.unknownThemes.join(", ")}`);
    fs.writeFileSync(UNKNOWN_THEMES_LOG, logLines.join("\n") + "\n");
    console.log(`\n⚠ Tuntemattomia themes-ehdotuksia (ei tallennettu itemsiin): ${unknownThemesAll.length} — ks. data/canva/unknown-themes.log`);
  }

  console.log(`\n[enrich] Valmis: ${successes} onnistui, ${failures} epäonnistui`);
  console.log(`[enrich] Tokenit: input ${tokIn}, output ${tokOut}`);

  // Confidence-jakauma
  const confDist = { high: 0, medium: 0, low: 0 };
  rich.items.forEach((it) => confDist[it.confidence] = (confDist[it.confidence] || 0) + 1);
  console.log(`\nConfidence-jakauma (${rich.items.length} itemiä):`);
  console.log(`  HIGH:   ${confDist.high}`);
  console.log(`  MEDIUM: ${confDist.medium}`);
  console.log(`  LOW:    ${confDist.low}`);
}

main().catch((err) => {
  console.error("VIRHE:", err.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Canva Content Pipeline — Vaihe 2 (mapping): Claude-arviointi.
 *
 * Lukee data/canva/id-map.json (Vaihe 1:n tulos, top-K candidatet per anchor).
 * Kutsuu Anthropic API:a arvioidakseen mikä candidate on todennäköisimmin
 * sama esitys kuin sivustotietue. Kirjoittaa `claude`-kentän per item.
 *
 * Claude EI vahvista mitään. Se ehdottaa parhaan matchin + confidence-arvion.
 * Käyttäjä tekee lopullisen päätöksen review-UI:ssa.
 *
 * KÄYTTÖ:
 *   node scripts/canva/02-claude-review.mjs           # normaali, cache käytössä
 *   node scripts/canva/02-claude-review.mjs --refresh # arvioi kaikki uudelleen
 *   node scripts/canva/02-claude-review.mjs --limit=5 # vain 5 ensimmäistä (testi)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, requireEnv, ROOT_DIR } from "./_lib/env.mjs";

loadEnv();
const { ANTHROPIC_API_KEY } = requireEnv("ANTHROPIC_API_KEY");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAP_FILE = path.join(ROOT_DIR, "data", "canva", "id-map.json");

const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

const argv = process.argv.slice(2);
const forceRefresh = argv.includes("--refresh");
const limitArg = argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.slice("--limit=".length)) : null;

function shortDate(unix) {
  if (!unix) return "?";
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

function buildPrompt(item) {
  const site = item.site;
  const cand = item.candidates.slice(0, 8);

  const siteLines = [
    `Otsikko: ${site.title}`,
    `Päivä: ${site.date || "(puuttuu)"}`,
    `Kuvaus: ${site.summary || "(ei kuvausta)"}`,
    `Avainsanat: ${(site.keywords || []).join(", ") || "(ei avainsanoja)"}`,
    `Paikka: ${site.location || "(ei tietoa)"}`,
    `Järjestäjä: ${site.jarjestaja || "(ei tietoa)"}`,
    `Kategoria: ${site.kategoria || "(ei tietoa)"}`,
    `Kansio: ${site.folder || "(ei tietoa)"}`
  ].join("\n");

  const candLines = cand.map((c, i) => {
    const signals = c.signals ? ` (titleSim=${c.signals.titleSim}, dateScore=${c.signals.dateScore}, kwScore=${c.signals.keywordScore})` : "";
    return `${i + 1}. designId=${c.designId}
   Canva-otsikko: "${c.canvaTitle}"
   Diaa: ${c.pageCount}, luotu: ${shortDate(c.createdAt)}, päivitetty: ${shortDate(c.updatedAt)}
   Heuristic score: ${c.heuristicScore}${signals}`;
  }).join("\n\n");

  return `Sinun tehtäväsi on arvioida onko sivuston esitys sama kuin joku annetuista Canva-design-ehdokkaista.

Sivuston otsikko on toimituksellisesti kirjoitettu ja voi poiketa Canvan alkuperäisestä otsikosta merkittävästi. Esimerkiksi sivuston "Pori/Kerava: Millaisia tekoälytaitoja peruskoulussa tulisi opettaa 2020-luvulla?" voi olla Canvassa "Pori Kerava AI 21.11.".

Arvioi kokonaisuutta: otsikon aiheenmukaisuus, päivämäärän ja tapahtuma-ajan yhteensopivuus, paikan/järjestäjän mätsi, avainsanojen esiintyminen Canva-otsikossa.

SIVUSTOTIETUE:
${siteLines}

CANVA-DESIGN-EHDOKKAAT (top-${cand.length}):

${candLines}

Palauta JSON tarkalleen tässä muodossa (ei muuta tekstiä):
{
  "designId": "DAxxxxxxxxx" tai null jos mikään ei ole riittävän vahva match,
  "confidence": "high" | "medium" | "low" | "none",
  "reason": "1-2 lausetta perustelusta suomeksi",
  "runnerUps": [{"designId": "DAxxx", "reason": "lyhyt perustelu miksi tämä on toinen mahdollinen"}]
}

Confidence-tasot:
- high: vahva näyttö (otsikon aihe + päivä + paikka/järjestäjä täsmää)
- medium: kohtalainen näyttö (2 signaalia täsmää)
- low: heikko näyttö (yksi signaali)
- none: mikään ei ole tarpeeksi vahva

Älä keksi matchia väkisin. Jos näyttö on liian heikkoa, käytä none.
Runner-upit vain jos on aidosti muita mahdollisia (0-3 kpl).`;
}

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
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic API HTTP ${res.status}: ${text.substring(0, 300)}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text || "";
  return { text, usage: data.usage };
}

function parseClaudeResponse(text) {
  // Poista mahdolliset markdown-koodilohkot
  let clean = text.trim();
  if (clean.startsWith("```")) {
    clean = clean.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  }
  try {
    return JSON.parse(clean);
  } catch (e) {
    // Yritä löytää JSON-blokki tekstistä
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    throw new Error(`Claude-vastauksen JSON-parsintavirhe: ${e.message}\nRaaka vastaus: ${text.substring(0, 300)}`);
  }
}

async function main() {
  if (!fs.existsSync(MAP_FILE)) {
    console.error(`${MAP_FILE} puuttuu. Aja ensin: node scripts/canva/01-map-ids.mjs --folder-ids=...`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
  const items = data.items;
  console.log(`[claude] ${items.length} anchoria id-map.json:issa`);

  const targets = items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => forceRefresh || !it.claude || !it.claude.designId && it.claude.confidence !== "none")
    .slice(0, LIMIT || items.length);

  if (targets.length === 0) {
    console.log("[claude] Kaikki jo arvioitu. Käytä --refresh pakottaaksesi uudelleen.");
    return;
  }

  console.log(`[claude] Arvioidaan ${targets.length} tietuetta (malli: ${MODEL})...`);
  console.log("");

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let successes = 0;
  let failures = 0;

  // KRITINEN: tuore-luku ennen kirjoitusta jotta käyttäjän review-UI:n
  // muutokset (item.user) EIVÄT ylikirjoitu. Ei pidetä koko data-objektia
  // muistissa — luetaan aina levyltä ja päivitetään vain claude-kenttä
  // yhteen kohtaan.
  function writeClaudeForIndex(siteIndex, claudeObj) {
    const fresh = JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
    const target = fresh.items[siteIndex];
    if (!target) throw new Error(`siteIndex ${siteIndex} puuttuu tuoreesta datasta`);
    target.claude = claudeObj;
    const tmp = MAP_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(fresh, null, 2) + "\n");
    fs.renameSync(tmp, MAP_FILE);
  }

  for (const { it, i } of targets) {
    process.stdout.write(`  [${(i + 1).toString().padStart(2)}/${items.length}] ${it.site.title.substring(0, 55)}... `);

    try {
      const prompt = buildPrompt(it);
      const { text, usage } = await callClaude(prompt);
      const parsed = parseClaudeResponse(text);

      it.claude = {
        designId: parsed.designId || null,
        confidence: parsed.confidence || "none",
        reason: parsed.reason || "",
        runnerUps: Array.isArray(parsed.runnerUps) ? parsed.runnerUps : [],
        model: MODEL,
        evaluatedAt: new Date().toISOString()
      };
      totalInputTokens += usage?.input_tokens || 0;
      totalOutputTokens += usage?.output_tokens || 0;
      successes++;
      console.log(`→ ${it.claude.confidence.toUpperCase()} ${it.claude.designId || "(none)"}`);

      writeClaudeForIndex(i, it.claude);
    } catch (e) {
      failures++;
      console.log(`→ VIRHE: ${e.message.substring(0, 100)}`);
      it.claude = {
        designId: null,
        confidence: "none",
        reason: `Claude-virhe: ${e.message.substring(0, 200)}`,
        runnerUps: [],
        model: MODEL,
        evaluatedAt: new Date().toISOString(),
        error: true
      };
      writeClaudeForIndex(i, it.claude);
    }
  }

  console.log("");
  console.log(`[claude] Valmis: ${successes} onnistui, ${failures} epäonnistui`);
  console.log(`[claude] Tokenit: input ${totalInputTokens}, output ${totalOutputTokens}`);
  console.log("");

  // Yhteenveto confidence-jakaumasta
  const confDist = { high: 0, medium: 0, low: 0, none: 0 };
  items.forEach((it) => {
    if (!it.claude) return;
    confDist[it.claude.confidence] = (confDist[it.claude.confidence] || 0) + 1;
  });
  console.log("Confidence-jakauma (kaikkien 75:n):");
  console.log(`  HIGH:   ${confDist.high}`);
  console.log(`  MEDIUM: ${confDist.medium}`);
  console.log(`  LOW:    ${confDist.low}`);
  console.log(`  NONE:   ${confDist.none}`);
  console.log("");
  console.log("Seuraava askel:");
  console.log("  node scripts/canva/review-server.mjs → http://localhost:5174/");
}

main().catch((err) => {
  console.error("VIRHE:", err.message);
  process.exit(1);
});

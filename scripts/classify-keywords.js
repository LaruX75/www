#!/usr/bin/env node
/**
 * classify-keywords.js
 * Luokittelee opinnäytteiden avainsanat kategorioihin Claude API:n avulla.
 * Tulos tallennetaan src/_data/keyword-categories.json -tiedostoon.
 *
 * Käyttö: node scripts/classify-keywords.js
 * Vaatii: ANTHROPIC_API_KEY ympäristömuuttujana tai .env-tiedostossa
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const CACHE_PATH = path.join(__dirname, "../src/_data/thesis-keywords-cache.json");
const OUTPUT_PATH = path.join(__dirname, "../src/_data/keywordCategories.json");

async function main() {
  // Lue välimuisti
  if (!fs.existsSync(CACHE_PATH)) {
    console.error("Virhe: thesis-keywords-cache.json puuttuu. Aja ensin fetch-thesis-keywords.js.");
    process.exit(1);
  }

  const cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
  const allKeywords = [...new Set(Object.values(cache).flat())].filter(Boolean);
  console.log(`Luokitellaan ${allKeywords.length} uniikkia avainsanaa...`);

  // Tarkista onko jo luokittelu olemassa
  if (fs.existsSync(OUTPUT_PATH)) {
    const existing = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf-8"));
    const existingCount = Object.values(existing).flat().length;
    if (existingCount > 0) {
      console.log(`keyword-categories.json on jo olemassa (${existingCount} avainsanaa ${Object.keys(existing).length} kategoriassa).`);
      console.log("Poista tiedosto tai lisää --force lippu ylikirjoittaaksesi.");
      if (!process.argv.includes("--force")) {
        process.exit(0);
      }
      console.log("--force annettu, ylikirjoitetaan...");
    }
  }

  const client = new Anthropic.default();

  const prompt = `Alla on lista opinnäytetöiden avainsanoja suomeksi ja englanniksi.
Tehtäväsi on luokitella nämä avainsanat 6–9 selkeään kategoriaan, jotka sopivat kasvatustieteen ja teknologian alan opinnäytetöihin.

Avainsanat:
${allKeywords.join(", ")}

Palauta vastaus VAIN validina JSON-objektina, ilman muuta tekstiä, kommentteja tai code fences.
Muoto:
{
  "KategorianNimi": ["avainsana1", "avainsana2", ...],
  ...
}

Ohjeet:
- Jokaiselle avainsanalle yksi kategoria (ei päällekkäisyyksiä)
- Kategorioiden nimet suomeksi, kuvaavia ja lyhyitä
- Jos avainsana ei sovi mihinkään, sijoita se kategoriaan "Muut"
- Säilytä avainsanat alkuperäisessä muodossaan`;

  console.log("Kutsutaan Claude API:a...");

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock) {
    console.error("Virhe: API ei palauttanut tekstivastauksia.");
    process.exit(1);
  }

  let categories;
  try {
    // Puhdista mahdolliset code fencet
    const raw = textBlock.text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();
    categories = JSON.parse(raw);
  } catch (err) {
    console.error("Virhe: JSON-parsinta epäonnistui:", err.message);
    console.error("API vastaus:", textBlock.text.slice(0, 500));
    process.exit(1);
  }

  // Validoi rakenne
  const classified = Object.values(categories).flat().length;
  console.log(`Luokiteltu ${classified} avainsanaa ${Object.keys(categories).length} kategoriaan:`);
  for (const [cat, kws] of Object.entries(categories)) {
    console.log(`  ${cat}: ${kws.length} avainsanaa`);
  }

  // Tarkista puuttuvat avainsanat
  const classifiedSet = new Set(Object.values(categories).flat());
  const missing = allKeywords.filter((kw) => !classifiedSet.has(kw));
  if (missing.length > 0) {
    console.warn(`\nHuomio: ${missing.length} avainsanaa ei luokiteltu:`, missing.slice(0, 10));
    // Lisää puuttuvat "Muut"-kategoriaan
    if (!categories["Muut"]) categories["Muut"] = [];
    categories["Muut"].push(...missing);
    console.log(`Lisätty "Muut"-kategoriaan.`);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(categories, null, 2), "utf-8");
  console.log(`\nTallennettu: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error("Odottamaton virhe:", err.message);
  process.exit(1);
});

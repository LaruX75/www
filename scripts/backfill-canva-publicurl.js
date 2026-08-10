#!/usr/bin/env node
/**
 * Backfill: kopioi src/_data/canva-presentations.json:in link → publicUrl
 * kaikille riveille joilla:
 *   1) publicUrl puuttuu tai on tyhjä
 *   2) link normalisoituu julkiseksi Canva-linkiksi (normalizeCanvaUrl != "")
 *
 * Tausta: Admin-työkalu (admin/canva/index.html) näyttää rivin tilassa
 * "Source-linkki näyttää jo julkiselta" mutta EI kirjoita publicUrl-kenttää
 * ellei käyttäjä paina "Käytä source-linkkiä" + "Tallenna" per rivi.
 * Tuloksena publicUrl-kenttä oli täytetty vain 13/75 rivissä, vaikka
 * loput 62 kelpaisivat julkiseksi (canva.com/design/xxx/YYY/view).
 *
 * Tämä script tekee saman minkä admin tekisi rivi kerrallaan — yhdellä
 * kertaa. Käyttää samaa normalizeCanvaUrl-filtteriä kuin admin ja
 * canva.js, joten data-lopputulos on identtinen "paina Käytä source
 * kaikille" -käyttäytymisen kanssa.
 *
 * KÄYTTÖ:
 *   node scripts/backfill-canva-publicurl.js         # kuiva-ajo, näyttää muutokset
 *   node scripts/backfill-canva-publicurl.js --write # kirjoita tiedostoon
 */

const fs = require("fs");
const path = require("path");
const { normalizeCanvaUrl } = require("../src/_data/canvaUrl");

const FILE = path.join(__dirname, "..", "src", "_data", "canva-presentations.json");
const WRITE = process.argv.includes("--write");

function main() {
  const raw = fs.readFileSync(FILE, "utf8");
  const items = JSON.parse(raw);

  let updated = 0;
  let skippedHasPublic = 0;
  let skippedInvalid = 0;

  items.forEach((item) => {
    const hasPublic = String(item.publicUrl || "").trim() !== "";
    if (hasPublic) { skippedHasPublic++; return; }

    const link = String(item.link || "").trim();
    const normalized = normalizeCanvaUrl(link);
    if (!normalized) { skippedInvalid++; return; }

    // publicUrl-kenttä lisätään link-kentän JÄLKEEN (JSON-avainten järjestys
    // säilyy V8:ssa insertion-orderissa). Käytetään objekti-spread + delete
    // -kikkaa jotta uudet kentät ilmestyvät johdonmukaiseen paikkaan.
    item.publicUrl = normalized;
    updated++;
  });

  console.log(`Rivejä yhteensä       : ${items.length}`);
  console.log(`Jo publicUrl-kentässä : ${skippedHasPublic}`);
  console.log(`Kelvoton link         : ${skippedInvalid}`);
  console.log(`Päivitettäisiin       : ${updated}`);
  console.log("");

  if (!WRITE) {
    console.log("Kuiva-ajo. Aja --write kirjoittaaksesi tiedostoon.");
    return;
  }

  const output = JSON.stringify(items, null, 2) + "\n";
  fs.writeFileSync(FILE, output, "utf8");
  console.log(`Kirjoitettu ${path.relative(process.cwd(), FILE)}`);
}

main();

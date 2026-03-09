#!/usr/bin/env node
/**
 * export-canva-thumbnails.mjs
 *
 * Lataa Canva-esitysten thumbnail-kuvat paikallisiksi tiedostoiksi.
 * Lukee src/_data/canva-presentations.json, lataa design.canva.ai-URLit
 * ja tallentaa JPG-tiedostot kansioon src/images/canva-thumbnails/.
 * Päivittää JSON-tiedoston käyttämään paikallisia polkuja.
 *
 * Käyttö:
 *   node scripts/export-canva-thumbnails.mjs
 *   node scripts/export-canva-thumbnails.mjs --dry-run   # ei tallenna tiedostoja
 *   node scripts/export-canva-thumbnails.mjs --force     # lataa uudelleen jo olemassa olevat
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const JSON_PATH = path.join(ROOT, "src/_data/canva-presentations.json");
const OUT_DIR = path.join(ROOT, "src/images/canva-thumbnails");
const PUBLIC_PATH_PREFIX = "/images/canva-thumbnails/";

const DRY_RUN = process.argv.includes("--dry-run");
const FORCE = process.argv.includes("--force");

// Muodosta tiedostonimi otsikosta
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Lataa URL ja palauta Buffer
async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; jarilaru-site-builder/1.0)",
      Accept: "image/jpeg,image/png,image/*,*/*",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Odottamaton Content-Type: ${contentType}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return { buffer: Buffer.from(arrayBuffer), contentType };
}

// Päätä tiedostopääte Content-Typen perusteella
function extFromContentType(contentType) {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("webp")) return ".webp";
  return ".jpg";
}

async function main() {
  console.log(`🖼  Canva thumbnail -viejä`);
  if (DRY_RUN) console.log("  (dry-run – ei tallenneta tiedostoja)");
  console.log();

  const presentations = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let alreadyLocal = 0;

  if (!DRY_RUN) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const usedFilenames = new Set();

  for (let i = 0; i < presentations.length; i++) {
    const item = presentations[i];
    const thumbUrl = item.thumbnail;

    if (!thumbUrl) {
      console.log(`  [${i + 1}/${presentations.length}] ⚠  Ei thumbnail-URLia: "${item.title}"`);
      skipped++;
      continue;
    }

    // Jo paikallinen polku
    if (thumbUrl.startsWith("/") || thumbUrl.startsWith("./")) {
      console.log(`  [${i + 1}/${presentations.length}] ✓  Jo paikallinen: "${item.title}"`);
      alreadyLocal++;
      continue;
    }

    // Muodosta uniikki tiedostonimi
    let slug = slugify(item.title);
    let filename = slug + ".jpg";
    let counter = 2;
    while (usedFilenames.has(filename)) {
      filename = `${slug}-${counter}.jpg`;
      counter++;
    }
    usedFilenames.add(filename);

    const localPath = path.join(OUT_DIR, filename);
    const publicPath = PUBLIC_PATH_PREFIX + filename;

    // Ohita jos tiedosto on jo olemassa ja ei --force
    if (!FORCE && fs.existsSync(localPath)) {
      console.log(`  [${i + 1}/${presentations.length}] ✓  Olemassa jo: ${filename}`);
      item.thumbnail = publicPath;
      alreadyLocal++;
      continue;
    }

    process.stdout.write(`  [${i + 1}/${presentations.length}] ⬇  ${item.title.slice(0, 50)}... `);

    try {
      const { buffer, contentType } = await fetchBuffer(thumbUrl);

      // Tarkista oikea tiedostopääte
      const ext = extFromContentType(contentType);
      if (ext !== ".jpg" && !filename.endsWith(ext)) {
        filename = slug + ext;
        usedFilenames.delete(slug + ".jpg");
        usedFilenames.add(filename);
      }
      const finalLocalPath = path.join(OUT_DIR, filename);
      const finalPublicPath = PUBLIC_PATH_PREFIX + filename;

      if (!DRY_RUN) {
        fs.writeFileSync(finalLocalPath, buffer);
        item.thumbnail = finalPublicPath;
      }

      console.log(`✅ (${Math.round(buffer.length / 1024)} KB)`);
      updated++;
    } catch (err) {
      console.log(`❌ ${err.message}`);
      failed++;
      // Säilytä alkuperäinen URL epäonnistuessa
    }

    // Pieni viive API-rajoitusten välttämiseksi
    if (i < presentations.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log();
  console.log(`Yhteenveto:`);
  console.log(`  Ladattu:     ${updated}`);
  console.log(`  Jo paikall.: ${alreadyLocal}`);
  console.log(`  Ohitettu:    ${skipped}`);
  console.log(`  Epäonnist.:  ${failed}`);

  if (!DRY_RUN && updated > 0) {
    fs.writeFileSync(JSON_PATH, JSON.stringify(presentations, null, 2) + "\n");
    console.log();
    console.log(`✅ Päivitetty: ${JSON_PATH}`);
    console.log(`   Kuvat: ${OUT_DIR}`);
  }

  if (failed > 0) {
    console.log();
    console.log(`⚠  ${failed} thumbnail ei latautunut. Tarkista verkko tai Canvan CDN-rajaukset.`);
    console.log(`   Vaihtoehtoisesti: vie thumbnail-kuvat manuaalisesti Canva-editorista ja`);
    console.log(`   aseta src/_data/canva-presentations.json thumbnail-kentät paikallisiksi poluiksi.`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Virhe:", err);
  process.exit(1);
});

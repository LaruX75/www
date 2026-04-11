#!/usr/bin/env node
/**
 * scripts/extract-local-keywords.js
 *
 * Poimii avainsanat paikallisesti tallennetuista opinnäyte-PDF:istä ja
 * tallentaa ne välimuistiin (src/_data/thesis-keywords-cache.json).
 *
 * Käyttö:
 *   1. Lataa PDF:t OuluREPO:sta selaimella
 *   2. Tallenna ne kansioon scripts/thesis-pdfs/
 *   3. Nimeä tiedostot handle-numeron mukaan, esim. 9314.pdf
 *      (handle = URL:n loppuosa, esim. handle/10024/9314 → 9314.pdf)
 *   4. Aja: node scripts/extract-local-keywords.js
 *
 * Ohittaa jo cachetuista löytyvät tietueet, ellei --force-lippu ole käytössä.
 * Käytä --force päivittääksesi jo cachessa olevat.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CACHE_PATH = path.resolve(__dirname, '../src/_data/thesis-keywords-cache.json');
const PDF_DIR = path.resolve(__dirname, 'thesis-pdfs');
const PYTHON_SCRIPT = path.resolve(__dirname, 'extract-keywords.py');
const BASE_HANDLE = 'https://oulurepo.oulu.fi/handle/10024/';

const force = process.argv.includes('--force');

function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); }
  catch { return {}; }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}

function extractKeywords(pdfPath) {
  const result = spawnSync('python3', [PYTHON_SCRIPT, pdfPath], {
    encoding: 'utf8',
    timeout: 30000,
  });
  const line = (result.stdout || '').trim();
  if (!line) return [];
  return line.split(/[,;]/).map(k => k.trim()).filter(Boolean);
}

function main() {
  if (!fs.existsSync(PDF_DIR)) {
    console.error(`Kansio puuttuu: ${PDF_DIR}`);
    process.exit(1);
  }

  const cache = loadCache();
  const files = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'));

  if (files.length === 0) {
    console.log(`Ei PDF-tiedostoja kansiossa ${PDF_DIR}`);
    console.log('Tallenna PDF:t sinne nimellä {handle-numero}.pdf, esim. 9314.pdf');
    return;
  }

  console.log(`[local-keywords] Löydetty ${files.length} PDF-tiedostoa.`);
  let found = 0;

  files.forEach((file, i) => {
    const handle = path.basename(file, '.pdf');
    const url = BASE_HANDLE + handle;
    const pdfPath = path.join(PDF_DIR, file);

    const alreadyCached = url in cache && Array.isArray(cache[url]) && cache[url].length > 0;
    if (alreadyCached && !force) {
      console.log(`[${i + 1}/${files.length}] ${file} → jo cachessa (${cache[url].length} kw), ohitetaan`);
      return;
    }

    const label = file.padEnd(30);
    const keywords = extractKeywords(pdfPath);
    if (keywords.length > 0) {
      cache[url] = keywords;
      found++;
      console.log(`[${i + 1}/${files.length}] ${label} → ${keywords.join(', ')}`);
    } else {
      cache[url] = [];
      console.log(`[${i + 1}/${files.length}] ${label} → avainsanoja ei löydetty`);
    }
  });

  saveCache(cache);
  console.log(`\n[local-keywords] Valmis! Avainsanat löydetty ${found}/${files.length} tiedostosta.`);
  console.log(`[local-keywords] Cache: ${CACHE_PATH}`);
}

main();

#!/usr/bin/env node
/**
 * scripts/fetch-thesis-keywords.js
 *
 * Hakee avainsanat opinnäyte-PDF:ien tiivistelmäsivuilta ja tallentaa
 * ne välimuistiin (src/_data/thesis-keywords-cache.json).
 *
 * Käyttö: npm run fetch:keywords
 *
 * - Ohittaa jo cachetuista löytyvät tietueet → vain uudet prosessoidaan
 * - Tallentaa välimuistin automaattisesti jokaisen 5. tietueen jälkeen
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');

const CACHE_PATH = path.resolve(__dirname, '../src/_data/thesis-keywords-cache.json');
const PYTHON_SCRIPT = path.resolve(__dirname, 'extract-keywords.py');
const BASE_URL = 'https://oulurepo.oulu.fi';
const RPP = 100;
const NAME = 'Laru';
const DELAY_MS = 700;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}

async function fetchXml(query, start = 0) {
  const params = new URLSearchParams({ query, format: 'kk', rpp: RPP, start, sort_by: 2, order: 'desc' });
  const res = await fetch(`${BASE_URL}/open-search/?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function getTotalResults(xml) {
  const m = xml.match(/totalResults[^>]*>(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function parseItems(xmlStr) {
  const items = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xmlStr)) !== null) {
    const block = m[1];
    const getMeta = (el, qual) => {
      const re = new RegExp(`<metadata[^>]*element="${el}"[^>]*qualifier="${qual}"[^>]*>([^<]*)</metadata>`);
      const mm = block.match(re);
      return mm ? mm[1].trim() : '';
    };
    const link = getMeta('identifier', 'uri');
    const title = getMeta('title', '') || getMeta('title', 'alternative');
    if (!link || !title) continue;
    items.push({ link, title });
  }
  return items;
}

async function fetchAllItems(query) {
  const xml1 = await fetchXml(query, 0);
  const total = getTotalResults(xml1);
  let items = parseItems(xml1);
  if (total > RPP) {
    const pages = Math.min(Math.ceil(total / RPP), 20);
    for (let p = 1; p < pages; p++) {
      await sleep(300);
      const xml = await fetchXml(query, p * RPP);
      items.push(...parseItems(xml));
    }
  }
  return items;
}

async function findPdfUrl(handleUrl) {
  try {
    const res = await fetch(handleUrl);
    if (!res.ok) return null;
    const html = await res.text();
    // Hyväksy myös isAllowed=n — ladataan joka tapauksessa ja tarkistetaan content-type
    const m = html.match(/href="(\/bitstream\/handle\/[^"]*\.pdf\?sequence=\d+[^"]*)"/);
    return m ? BASE_URL + m[1].replace(/&amp;/g, '&') : null;
  } catch {
    return null;
  }
}

async function downloadPdf(pdfUrl) {
  try {
    const res = await fetch(pdfUrl);
    if (!res.ok) return null;
    // Jos palvelin palauttaa login-sivun eikä PDF:ää, ohitetaan
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('pdf')) return null;
    const buf = await res.arrayBuffer();
    return Buffer.from(buf);
  } catch {
    return null;
  }
}

function extractKeywords(pdfBuffer) {
  const tmpFile = path.join(os.tmpdir(), `thesis-kw-${Date.now()}.pdf`);
  try {
    fs.writeFileSync(tmpFile, pdfBuffer);
    const result = spawnSync('python3', [PYTHON_SCRIPT, tmpFile], {
      encoding: 'utf8',
      timeout: 30000,
    });
    const line = (result.stdout || '').trim();
    if (!line) return [];
    return line.split(/[,;]/).map(k => k.trim()).filter(k => k.length > 1);
  } catch {
    return [];
  } finally {
    try { fs.unlinkSync(tmpFile); } catch {}
  }
}

async function main() {
  console.log('[keywords] Ladataan cache...');
  const cache = loadCache();
  console.log(`[keywords] Cachessa valmiina: ${Object.keys(cache).length} tietuetta.`);

  console.log('[keywords] Haetaan opinnäyteluettelo OuluREPO:sta...');
  const advisorQ = `dc.contributor.thesisadvisor:${NAME}* AND (type:masterThesis OR type:bachelorThesis)`;
  const reviewerQ = `dc.contributor.reviewer:${NAME}* AND (type:masterThesis OR type:bachelorThesis)`;
  const [advisorItems, reviewerItems] = await Promise.all([
    fetchAllItems(advisorQ),
    fetchAllItems(reviewerQ),
  ]);

  const allMap = new Map();
  for (const item of [...advisorItems, ...reviewerItems]) {
    if (item.link) allMap.set(item.link, item);
  }
  const allItems = Array.from(allMap.values());
  const newItems = allItems.filter(item => !(item.link in cache));

  console.log(`[keywords] Yhteensä ${allItems.length} opinnäytettä, ${newItems.length} käsittelemättä.`);

  if (newItems.length === 0) {
    console.log('[keywords] Kaikki jo cachessa. Valmis.');
    return;
  }

  let found = 0;
  for (let i = 0; i < newItems.length; i++) {
    const item = newItems[i];
    const prefix = `[${i + 1}/${newItems.length}]`;
    console.log(`${prefix} ${item.title.substring(0, 70)}`);

    await sleep(DELAY_MS);
    const pdfUrl = await findPdfUrl(item.link);
    if (!pdfUrl) {
      console.log('  → ei PDF-linkkiä, ohitetaan');
      cache[item.link] = [];
      continue;
    }

    await sleep(DELAY_MS);
    const pdfBuffer = await downloadPdf(pdfUrl);
    if (!pdfBuffer) {
      console.log('  → PDF-lataus epäonnistui');
      cache[item.link] = [];
      continue;
    }

    const keywords = extractKeywords(pdfBuffer);
    cache[item.link] = keywords;

    if (keywords.length > 0) {
      found++;
      console.log(`  → ${keywords.join(', ')}`);
    } else {
      console.log('  → avainsanoja ei löydetty');
    }

    // Välitallennus joka 5. tietue
    if ((i + 1) % 5 === 0) {
      saveCache(cache);
      console.log(`  [tallennettu ${i + 1}/${newItems.length}]`);
    }
  }

  saveCache(cache);
  console.log(`\n[keywords] Valmis! Avainsanat löydetty ${found}/${newItems.length} uudesta tietueesta.`);
  console.log(`[keywords] Cache: ${CACHE_PATH}`);
}

main().catch(e => {
  console.error('[keywords] VIRHE:', e.message);
  process.exit(1);
});

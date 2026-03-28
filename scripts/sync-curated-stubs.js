#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function slugify(str) {
  return String(str || '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeTitle(str) {
  // Strip all control characters (invalid in YAML double-quoted scalars)
  // and replace double quotes with escaped versions
  return String(str || '')
    .replace(/[\x00-\x1f\x7f]/g, ' ')  // replace all control chars with space
    .replace(/"/g, '\\"')
    .replace(/\s+/g, ' ')               // collapse multiple spaces
    .trim();
}

function stubContent(title, sourceId) {
  return `---\ntitle: "${escapeTitle(title)}"\nsource_id: "${sourceId}"\nhidden: false\n---\n`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Check if a stub with matching source_id already exists in dir.
 * Returns true if a matching stub file is found.
 */
function stubExistsForId(dir, sourceId) {
  if (!fs.existsSync(dir)) return false;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;
    const fm = match[1];
    const idMatch = fm.match(/^source_id:\s*["']?([^"'\n]+?)["']?\s*$/m);
    if (idMatch?.[1] === String(sourceId)) return true;
  }
  return false;
}

function writeStub(dir, title, sourceId) {
  if (stubExistsForId(dir, sourceId)) return false;

  const base = slugify(String(sourceId)) || slugify(title);
  let filename = `${base}.md`;
  let counter = 1;
  // Avoid filename collisions (different IDs that slugify the same way)
  while (fs.existsSync(path.join(dir, filename))) {
    filename = `${base}-${counter}.md`;
    counter++;
  }

  fs.writeFileSync(path.join(dir, filename), stubContent(title, sourceId), 'utf8');
  return true;
}

function syncSource(label, items, dir) {
  ensureDir(dir);
  let created = 0;
  for (const { id, title } of items) {
    if (!id) continue;
    if (writeStub(dir, title, id)) created++;
  }
  console.log(`${label}: ${items.length} kohdetta löytyi, ${created} uutta stub-tiedostoa luotu.`);
}

/**
 * Cache files are stored as { savedAt, data } wrappers by _apiCache.js.
 * Unwrap if needed.
 */
function loadCache(cachePath) {
  const raw = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  // Wrapper format: { savedAt: '...', data: <actual data> }
  if (raw && typeof raw === 'object' && 'data' in raw && 'savedAt' in raw) {
    return raw.data;
  }
  return raw;
}

// ── researchfi ──────────────────────────────────────────────────────────────
function syncResearchfi() {
  const cachePath = path.join(ROOT, '.cache', 'api-fallback', 'researchfi-publications.json');
  if (!fs.existsSync(cachePath)) {
    console.log('researchfi: cache-tiedostoa ei löydy, ohitetaan.');
    return;
  }
  const data = loadCache(cachePath);
  // data is an array of publication objects
  const arr = Array.isArray(data) ? data : Object.values(data);
  const items = arr.map((item) => ({
    id: String(item.publicationId || ''),
    title: item.publicationName || 'Ei otsikkoa',
  })).filter((i) => i.id);
  syncSource('researchfi', items, path.join(ROOT, 'src', 'curated', 'researchfi'));
}

// ── slideshare ───────────────────────────────────────────────────────────────
function syncSlideshare() {
  const cachePath = path.join(ROOT, '.cache', 'api-fallback', 'slideshare-presentations-v1.json');
  if (!fs.existsSync(cachePath)) {
    console.log('slideshare: cache-tiedostoa ei löydy, ohitetaan.');
    return;
  }
  const data = loadCache(cachePath);
  const arr = Array.isArray(data) ? data : Object.values(data);
  const items = arr.map((item) => ({
    id: String(item.id || ''),
    title: item.title || 'Nimetön esitys',
  })).filter((i) => i.id);
  syncSource('slideshare', items, path.join(ROOT, 'src', 'curated', 'slideshare'));
}

// ── finna ────────────────────────────────────────────────────────────────────
function syncFinna() {
  const cachePath = path.join(ROOT, '.cache', 'api-fallback', 'finna-aoe-v2.json');
  if (!fs.existsSync(cachePath)) {
    console.log('finna: cache-tiedostoa ei löydy, ohitetaan.');
    return;
  }
  const data = loadCache(cachePath);
  const rows = Array.isArray(data) ? data : (Array.isArray(data?.rows) ? data.rows : []);
  const items = rows.map((item) => ({
    id: String(item.id || ''),
    title: item.title || 'Nimetön oppimateriaali',
  })).filter((i) => i.id);
  syncSource('finna', items, path.join(ROOT, 'src', 'curated', 'finna'));
}

// ── canva ────────────────────────────────────────────────────────────────────
function syncCanva() {
  const dataPath = path.join(ROOT, 'src', '_data', 'canva-presentations.json');
  if (!fs.existsSync(dataPath)) {
    console.log('canva: canva-presentations.json ei löydy, ohitetaan.');
    return;
  }
  const presentations = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const items = presentations.map((item) => {
    const urlMatch = String(item.link || '').match(/\/d\/([A-Za-z0-9_-]+)/);
    return {
      id: urlMatch ? urlMatch[1] : '',
      title: item.title || 'Nimetön esitys',
    };
  }).filter((i) => i.id);
  syncSource('canva', items, path.join(ROOT, 'src', 'curated', 'canva'));
}

// ── main ─────────────────────────────────────────────────────────────────────
console.log('=== sync-curated-stubs ===');
syncResearchfi();
syncSlideshare();
syncFinna();
syncCanva();
console.log('=== valmis ===');

/**
 * Kertaluonteinen tuontiskripti: lukee SlideShare-välimuistin ja luo
 * Markdown-tiedostot src/presentations/-hakemistoon.
 *
 * Ajo: node scripts/import-slideshare.js
 */

const fs = require("fs");
const path = require("path");

const CACHE_FILE = path.join(__dirname, "../.cache/api-fallback/slideshare-presentations-v1.json");
const OUTPUT_DIR = path.join(__dirname, "../src/presentations");
const MAX_SLIDESHARE_DATE = "2020-12-31";

/** Poistaa kontrollimerkit (koodit 0–31, pl. tavallinen rivitys) ja siistii välilyönnit. */
function sanitize(str) {
  return String(str || "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/**
 * Yrittää poimia päivämäärän SlideShare CDN -thumbnail-URL:sta.
 * Formaatti: something-YYMMDDHHMMSS-thumbnail.jpg
 */
function extractDateFromThumbnail(thumbnailUrl) {
  if (!thumbnailUrl) return null;
  const match = String(thumbnailUrl).match(/-(\d{6})\d{6}-thumbnail/);
  if (!match) return null;
  const yymmdd = match[1];
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = parseInt(yymmdd.slice(2, 4), 10);
  const dd = parseInt(yymmdd.slice(4, 6), 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const year = yy >= 90 ? 1900 + yy : 2000 + yy;
  return `${year}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function normalizeSlideshareDate(thumbnailUrl) {
  const extracted = extractDateFromThumbnail(thumbnailUrl);
  if (!extracted) return null;
  return extracted > MAX_SLIDESHARE_DATE ? MAX_SLIDESHARE_DATE : extracted;
}

function main() {
  if (!fs.existsSync(CACHE_FILE)) {
    console.error("Välimuistitiedosto puuttuu:", CACHE_FILE);
    process.exit(1);
  }

  const cache = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  const presentations = Array.isArray(cache.data) ? cache.data : [];
  console.log(`Välimuistissa ${presentations.length} esitystä.\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const usedSlugs = new Set(
    fs.readdirSync(OUTPUT_DIR)
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
  );

  let created = 0;
  let skipped = 0;
  const slugCount = {};

  for (const p of presentations) {
    const baseSlug = `ss-${slugify(p.title)}`;

    // Varmista uniikit slugit
    let slug = baseSlug;
    if (usedSlugs.has(slug)) {
      slugCount[baseSlug] = (slugCount[baseSlug] || 1) + 1;
      slug = `${baseSlug}-${slugCount[baseSlug]}`;
    }
    usedSlugs.add(slug);

    const filename = `${slug}.md`;
    const filepath = path.join(OUTPUT_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`OHITA (on jo): ${filename}`);
      skipped++;
      continue;
    }

    const date = normalizeSlideshareDate(p.thumbnail);
    const title = sanitize(p.title || "SlideShare-esitys").replace(/'/g, "''");
    const url = sanitize(p.url || "").replace(/'/g, "''");
    const thumbnail = sanitize(p.thumbnail || "").replace(/'/g, "''");

    const frontmatter = [
      `---`,
      `title: '${title}'`,
      `description: 'SlideShare-esitys'`,
      date ? `date: ${date}` : null,
      `url: '${url}'`,
      `thumbnail: '${thumbnail}'`,
      `categories: []`,
      `type: 'esitys'`,
      `source: 'slideshare'`,
      `layout: base.njk`,
      `templateEngineOverride: md`,
      `---`,
    ].filter((l) => l !== null).join("\n");

    const body = url
      ? `\nTämä esitys on saatavilla SlideSharessa. [Avaa esitys SlideSharessa](${url}).\n`
      : `\nSlideShare-esitys.\n`;

    fs.writeFileSync(filepath, frontmatter + "\n" + body, "utf8");
    console.log(`LUO: ${filename}${date ? `  (${date})` : "  (ei päivää)"}`);
    created++;
  }

  console.log(`\nValmis: luotu ${created}, ohitettu ${skipped} / yhteensä ${presentations.length}`);
}

main();

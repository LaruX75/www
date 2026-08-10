/**
 * canvaMerged — yhdistää sivuston toimituksellisen Canva-datan ja Vaihe 3:n
 * rich-datan (richSummary + themes + lang + slideCount + confidence).
 *
 * Ensisijainen mapping: data/canva/id-map.json (75/75 vahvistettu käyttäjän
 * toimesta). Fallback: `link`-kentästä poimittu design-ID (canva.com/design/…).
 *
 * EI muuta canva-presentations.json:ia. Toimituksellinen metadata ja rich-data
 * ovat eri kerroksia — merged-recordi pitää molemmat ja lisää `rich`-oksan.
 *
 * Käyttö Eleventyssä:
 *   {% for item in canvaMerged.items %}
 *     {{ item.title }}
 *     {% if item.rich %}{{ item.rich.richSummary }}{% endif %}
 *   {% endfor %}
 *
 * Käyttö Node-scripteissä (buildEmbeddingInput jne.):
 *   const { buildCanvaMerged } = require("./canvaMerged");
 *   const merged = buildCanvaMerged();
 */

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const site = require("./canva-presentations.json");
const rich = require("./canva-presentations-rich.json");

const ID_MAP_FILE = path.join(__dirname, "..", "..", "data", "canva", "id-map.json");
const CONTENT_SLUG_MAP_FILE = path.join(__dirname, "..", "..", "data", "canva", "content-slug-to-designid.json");
const PRESENTATIONS_DIR = path.join(__dirname, "..", "presentations");

function loadIdMap() {
  if (!fs.existsSync(ID_MAP_FILE)) return null;
  try { return JSON.parse(fs.readFileSync(ID_MAP_FILE, "utf8")); }
  catch { return null; }
}

// Poimi Canva design-ID linkistä muotoa https://www.canva.com/design/DAxxx/…
function extractDesignIdFromLink(link) {
  const m = String(link || "").match(/\/design\/(DA[A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

// -----------------------------------------------------------------------------
// Content-URL → designId (fuzzy title matching)
//
// Sivustolla `/presentations/{slug}/` -sivut ovat src/presentations/{slug}.md.
// Näiden frontmatter-`url`-kenttä on tyypillisesti canva.com/d/[shortlink] —
// EI sisällä design_id:tä. Canva-presentations.json:in `link` on eri shortlink
// samaan designiin. Yhteistä token-tunnistetta ei ole.
//
// Ratkaisu: käytä frontmatter-title:ä + fuzzy-mätsäystä canva-presentations.json:in
// title:iin. Kun mätsi löytyy, id-map antaa designId:n.
// -----------------------------------------------------------------------------

function normalizeTitle(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenJaccard(a, b) {
  const A = new Set(normalizeTitle(a).split(" ").filter(Boolean));
  const B = new Set(normalizeTitle(b).split(" ").filter(Boolean));
  if (A.size === 0 && B.size === 0) return 1;
  const inter = [...A].filter((x) => B.has(x)).length;
  const union = new Set([...A, ...B]).size;
  return union ? inter / union : 0;
}

// Cache: contentUrl → designId. Ladataan kerran per prosessi.
// Ensisijainen lähde: data/canva/content-slug-to-designid.json (11/15 Canva-
// linkitettyä sivustopresentation-recordia mätsätty Claude-avusteisesti,
// scripts/canva/05-map-content-slugs.mjs). Loput 4 saavat fallback:in
// (title + summary + keywords) buildEmbeddingInput:issa.
let _contentUrlDesignIdCache = null;

function buildContentUrlToDesignId() {
  if (_contentUrlDesignIdCache) return _contentUrlDesignIdCache;
  const cache = new Map();
  if (!fs.existsSync(CONTENT_SLUG_MAP_FILE)) { _contentUrlDesignIdCache = cache; return cache; }
  try {
    const map = JSON.parse(fs.readFileSync(CONTENT_SLUG_MAP_FILE, "utf8"));
    for (const [contentUrl, entry] of Object.entries(map)) {
      if (entry && entry.designId) cache.set(contentUrl, entry.designId);
    }
  } catch (e) {
    console.warn(`[canvaMerged] content-slug-to-designid.json luku epäonnistui: ${e.message}`);
  }
  _contentUrlDesignIdCache = cache;
  return cache;
}

/**
 * Palauttaa Canva design-ID:n annetulle content-URL:lle (esim.
 * /presentations/xxx/), tai null jos vastaavaa mappia ei löydy.
 * Käytetään buildEmbeddingInput:issa Canva-presentation-recordeille.
 */
function contentUrlToDesignId(contentUrl) {
  return buildContentUrlToDesignId().get(contentUrl) || null;
}

/**
 * Palauttaa rich-datan (richSummary + themes + lang jne) annetulle
 * content-URL:lle jos vastaava Canva-design löytyy. Muuten null.
 * confidence=low → palauttaa null (kaltasee fallbackin).
 */
function richDataForContentUrl(contentUrl) {
  const designId = contentUrlToDesignId(contentUrl);
  if (!designId) return null;
  const r = rich.items.find((it) => it.designId === designId);
  if (!r || r.confidence === "low") return null;
  return r;
}

function buildCanvaMerged() {
  const idMap = loadIdMap();
  const linkToDesignId = new Map();
  if (idMap?.items) {
    idMap.items.forEach((it) => {
      if (it.user?.status === "confirmed" && it.user?.designId) {
        linkToDesignId.set(it.site.link, it.user.designId);
      }
    });
  }

  const richByDesignId = new Map(rich.items.map((it) => [it.designId, it]));

  const items = [];
  let matched = 0, richCount = 0, fallback = 0, unmatched = 0;

  for (const s of site) {
    // 1. id-map (vahvistettu)  2. extractDesignIdFromLink (fallback)
    const designId = linkToDesignId.get(s.link) || extractDesignIdFromLink(s.link) || extractDesignIdFromLink(s.publicUrl);
    const r = designId ? richByDesignId.get(designId) : null;

    if (designId) matched++;
    else unmatched++;

    let richPayload = null;
    if (r && r.confidence !== "low") {
      richCount++;
      richPayload = {
        designId: r.designId,
        richSummary: r.richSummary || null,
        themes: Array.isArray(r.themes) ? r.themes : [],
        lang: r.lang || null,
        slideCount: r.slideCount || null,
        emptyPages: r.emptyPages ?? null,
        confidence: r.confidence,
        sourceUpdatedAt: r.sourceUpdatedAt || null,
        generatedAt: r.generatedAt || null
      };
    } else if (r) {
      // confidence low → älä käytä rich-dataa
      fallback++;
    } else if (designId) {
      // designId löytyi mutta rich-dataa ei ole (ehkä 2 export-lukkoista)
      fallback++;
    }

    items.push({
      // Toimituksellinen metadata (koskematon canva-presentations.json:sta)
      ...s,
      designId: designId || null,
      // Rich-data omalla oksalla (null jos ei käytettävissä)
      rich: richPayload
    });
  }

  return {
    items,
    stats: {
      total: items.length,
      matched,
      unmatched,
      rich: richCount,
      fallback
    }
  };
}

module.exports = function () {
  const merged = buildCanvaMerged();
  return merged;
};

module.exports.buildCanvaMerged = buildCanvaMerged;
module.exports.contentUrlToDesignId = contentUrlToDesignId;
module.exports.richDataForContentUrl = richDataForContentUrl;

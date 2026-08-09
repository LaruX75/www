/**
 * v4.3 PR-4 -- Vertailu topicItemScore vs. relatedContent.
 * Ei koodimuutoksia — vain nykyisen baseline-scoringin arviointi
 * ennen v4.4 semantic-layer-pilottia.
 *
 * Aja: node scripts/debug-scoring-comparison.js
 *
 * Fetches: /data/content.json (union: publications+presentations+media+
 *   blog+politics) + /data/theses.json.
 *
 * Testaa:
 * 1. relatedContent per otos-item (5-10 sisältöä eri tyypeistä)
 * 2. Same-type vs. cross-type -jakauma tuloksissa
 * 3. Erityisesti: onko `same type +2` -bonus dominantti tai marginaalinen?
 *
 * HUOM: kopioi relatedContent-logiikan eleventy.filters.js:sta koska
 * funktio on Nunjucks-filter-wrapperin sisällä, ei exportattu.
 */

const fs = require("fs");
const path = require("path");

// Load data
const contentPath = path.join(__dirname, "..", "_site", "data", "content.json");
const thesesPath = path.join(__dirname, "..", "_site", "data", "theses.json");

if (!fs.existsSync(contentPath) || !fs.existsSync(thesesPath)) {
  console.error("Build required first: npm run build:no-og");
  process.exit(1);
}

const contentData = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const thesesData = JSON.parse(fs.readFileSync(thesesPath, "utf8"));

// -----------------------------------------------------------------------------
// Kopio: normalizeTerm + intersectionCount + relatedContent-logiikka
// -----------------------------------------------------------------------------

function normalizeTerm(v) {
  return String(v || "").trim().toLowerCase();
}
function normalizeTerms(values) {
  const arr = Array.isArray(values) ? values : (values ? [values] : []);
  return new Set(arr.filter(Boolean).map(normalizeTerm).filter(Boolean));
}
function intersectionCount(values, wanted) {
  const arr = Array.isArray(values) ? values : (values ? [values] : []);
  return arr.reduce((c, v) => (wanted.has(normalizeTerm(v)) ? c + 1 : c), 0);
}

function computeRelatedScore(candidate, anchor) {
  const wantedCategories = normalizeTerms(anchor.categories);
  const wantedKeywords = normalizeTerms(anchor.keywords);
  const wantedTags = normalizeTerms(anchor.tags);
  const wantedContexts = normalizeTerms(anchor.contexts);
  const wantedType = String(anchor.type || anchor.contentType || "");

  const data = candidate;  // /data/*.json -recordit ovat "flat"
  const categoryScore = intersectionCount(data.categories, wantedCategories) * 5;
  const keywordScore = intersectionCount(data.keywords, wantedKeywords) * 3;
  const tagScore = intersectionCount(data.tags, wantedTags) * 2;
  const contextScore = intersectionCount(data.contexts, wantedContexts) * 4;

  // "same type +2" — anchor.type vs. candidate.type (frontmatter type-kenttä
  // esim. "mielipide", "kolumni", "puhe"). Content.json:ssa on canonical
  // contentType, ei alkuperäistä `type`ia. Simuloin: verrataan contentType.
  const typeScore = wantedType && data.contentType === wantedType ? 2 : 0;

  return {
    total: categoryScore + keywordScore + tagScore + contextScore + typeScore,
    breakdown: { categoryScore, keywordScore, tagScore, contextScore, typeScore }
  };
}

function relatedForItem(anchor, allItems, limit = 4) {
  return allItems
    .filter((c) => c.url !== anchor.url)
    .map((c) => {
      const { total, breakdown } = computeRelatedScore(c, anchor);
      return { item: c, score: total, breakdown };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || String(b.item.date).localeCompare(String(a.item.date)))
    .slice(0, limit);
}

// -----------------------------------------------------------------------------
// Datajoukko
// -----------------------------------------------------------------------------

const allItems = [
  ...(contentData.items || []),
  ...(thesesData.items || [])
];
console.log(`Datajoukko: ${allItems.length} item:iä (${contentData.items.length} content + ${thesesData.items.length} theses)\n`);

// Poimi otos: 1 item per contentType, uusinta
const contentTypes = ["blogPost", "opinion", "column", "statement", "speech", "initiative", "presentation", "mediaItem", "thesis", "video"];
const sample = contentTypes
  .map((ct) => {
    const items = allItems.filter((i) => i.contentType === ct)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return items[0];
  })
  .filter(Boolean);

console.log(`Otos: ${sample.length} anchor-item:iä (yksi per contentType):`);
sample.forEach((s, i) => {
  console.log(`  [${i}] ${s.contentType.padEnd(20)} ${s.year || "?"}  ${s.title.substring(0, 55)}`);
});

// -----------------------------------------------------------------------------
// Per anchor: laske top-4 related + type-jakauma
// -----------------------------------------------------------------------------

console.log("\n" + "=".repeat(80));
console.log("relatedContent top-4 per anchor + type-jakauma");
console.log("=".repeat(80));

const globalStats = { sameType: 0, crossType: 0, byAnchorType: {} };

sample.forEach((anchor) => {
  console.log(`\n--- ANCHOR: [${anchor.contentType}] ${anchor.title.substring(0, 60)}`);
  console.log(`    categories: ${(anchor.categories || []).join(", ") || "-"}`);
  console.log(`    keywords: ${(anchor.keywords || []).slice(0, 5).join(", ") || "-"}`);
  console.log(`    contexts: ${(anchor.contexts || []).join(", ") || "-"}`);

  const results = relatedForItem(anchor, allItems, 4);

  if (results.length === 0) {
    console.log("    (ei tuloksia)");
    return;
  }

  results.forEach(({ item, score, breakdown }) => {
    const sameType = item.contentType === anchor.contentType;
    if (sameType) globalStats.sameType += 1; else globalStats.crossType += 1;
    if (!globalStats.byAnchorType[anchor.contentType]) {
      globalStats.byAnchorType[anchor.contentType] = { same: 0, cross: 0 };
    }
    if (sameType) globalStats.byAnchorType[anchor.contentType].same += 1;
    else globalStats.byAnchorType[anchor.contentType].cross += 1;

    const marker = sameType ? "[same]" : "[cross]";
    console.log(`    [${score}] ${marker} ${item.contentType.padEnd(20)} ${item.title.substring(0, 50)}`);
    console.log(`         cat:${breakdown.categoryScore} kw:${breakdown.keywordScore} tag:${breakdown.tagScore} ctx:${breakdown.contextScore} type:${breakdown.typeScore}`);
  });
});

// -----------------------------------------------------------------------------
// Yhteenveto: same-type vs. cross-type
// -----------------------------------------------------------------------------

console.log("\n" + "=".repeat(80));
console.log("YHTEENVETO: same-type vs. cross-type -jakauma");
console.log("=".repeat(80));

const total = globalStats.sameType + globalStats.crossType;
if (total > 0) {
  const samePct = Math.round((globalStats.sameType / total) * 100);
  const crossPct = 100 - samePct;
  console.log(`\nKokonaisjakauma (${total} tulosta):`);
  console.log(`  same-type: ${globalStats.sameType} (${samePct}%)`);
  console.log(`  cross-type: ${globalStats.crossType} (${crossPct}%)`);
}

console.log("\nPer anchor-tyyppi (same / cross):");
Object.entries(globalStats.byAnchorType).forEach(([type, { same, cross }]) => {
  const t = same + cross;
  const pct = t > 0 ? Math.round((same / t) * 100) : 0;
  console.log(`  ${type.padEnd(20)} same=${same}  cross=${cross}  (${pct}% same)`);
});

console.log("\nHUOM: 'same type +2' -bonus voi olla dominantti jos same-type % > 60-70%.");
console.log("      Cross-content-suositus toimii jos cross-type-osuus on merkittava.");

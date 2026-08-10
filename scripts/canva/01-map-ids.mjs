#!/usr/bin/env node
/**
 * Canva Content Pipeline — Vaihe 1: tunnistekartta.
 *
 * Hakee Canva Connect API:sta kaikki käyttäjän omistamat esitykset ja
 * ehdottaa täsmäytyksiä sivuston `src/_data/canva-presentations.json`:in
 * 75 tietueeseen. Tuottaa:
 *
 *   data/canva/id-map.json         — konekäyttöinen mapping (proposed/unmatched)
 *   data/canva/id-map-review.md    — ihmisen tarkistuslista
 *
 * EI muuta canva-presentations.json:iä.
 * EI merkitse mitään automaattisesti confirmed-tilaan.
 *
 * KÄYTTÖ:
 *   node scripts/canva/01-map-ids.mjs
 *   node scripts/canva/01-map-ids.mjs --dry-run    # ei API-kutsuja, käytä välimuistia
 *   node scripts/canva/01-map-ids.mjs --refresh    # pakota API-haku uudelleen
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv, ROOT_DIR } from "./_lib/env.mjs";
import { listAllOwnedDesigns, listFolderItems } from "./_lib/canva-api.mjs";
import {
  bestTitleSimilarity,
  dateProximityScore,
  keywordOverlap,
  extractDesignIdFromLink,
  combinedScore,
  normalizeTitle
} from "./_lib/match.mjs";

loadEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(ROOT_DIR, "data", "canva");
const RAW_CACHE = path.join(DATA_DIR, "canva-designs-raw.json");
const MAP_FILE = path.join(DATA_DIR, "id-map.json");
const SITE_FILE = path.join(ROOT_DIR, "src", "_data", "canva-presentations.json");

const argv = process.argv.slice(2);
const isDryRun = argv.includes("--dry-run");
const forceRefresh = argv.includes("--refresh");
// Tuki --folder-id=X (yksi kansio) TAI --folder-ids=X,Y,Z (monta kansiota)
const folderIdArg = argv.find((a) => a.startsWith("--folder-id="));
const folderIdsArg = argv.find((a) => a.startsWith("--folder-ids="));
const FOLDER_IDS = folderIdsArg
  ? folderIdsArg.slice("--folder-ids=".length).split(",").map((s) => s.trim()).filter(Boolean)
  : (folderIdArg ? [folderIdArg.slice("--folder-id=".length)] : []);
const FOLDER_ID_CACHE_KEY = FOLDER_IDS.join(",") || null;

const CONFIRM_THRESHOLD = 0.85;  // yli tämän: ei review-listaan
const REVIEW_THRESHOLD = 0.5;    // alle: unmatched
const CANDIDATE_TOP_K = 8;       // tallennetaan top-K candidatet per anchor (Claude + user review)

async function loadSiteRecords() {
  const raw = fs.readFileSync(SITE_FILE, "utf8");
  return JSON.parse(raw);
}

async function loadOrFetchDesigns() {
  // Käytetään cachea vain jos folder-ID:t vastaavat aiempaa hakua
  if (!forceRefresh && fs.existsSync(RAW_CACHE)) {
    const cached = JSON.parse(fs.readFileSync(RAW_CACHE, "utf8"));
    const cachedKey = cached.folderIdCacheKey || cached.folderId || null;
    if (cachedKey === FOLDER_ID_CACHE_KEY) {
      console.log(`[cache] ${cached.designs.length} designia (fetched ${cached.fetchedAt}, folders=${cachedKey || "(kaikki)"})`);
      return cached.designs;
    }
    console.log(`[cache] Cache on eri folder-joukosta (${cachedKey || "kaikki"} vs. pyydetty ${FOLDER_ID_CACHE_KEY || "kaikki"}) — haetaan uudelleen`);
  }
  if (isDryRun) {
    console.error("Ei välimuistia ja --dry-run — ei API-kutsuja. Aja ilman --dry-run:ta ensin.");
    process.exit(1);
  }

  let designs = [];
  const seenIds = new Set();

  if (FOLDER_IDS.length > 0) {
    for (const folderId of FOLDER_IDS) {
      console.log(`[api] Haetaan folder ${folderId}:in items (paginoi)...`);
      const items = await listFolderItems(folderId, {
        onProgress: ({ fetched, hasMore }) => {
          process.stdout.write(`  ${folderId}: ${fetched} items${hasMore ? " (jatkuu)" : ""}\r`);
        }
      });
      process.stdout.write("\n");
      const subfolders = items.filter((it) => it._subfolder);
      const folderDesigns = items.filter((it) => !it._subfolder);
      let added = 0;
      for (const d of folderDesigns) {
        if (seenIds.has(d.id)) continue;
        seenIds.add(d.id);
        designs.push({ ...d, _sourceFolderId: folderId });
        added++;
      }
      console.log(`  → ${folderDesigns.length} designia (${added} uutta) + ${subfolders.length} alifolderia`);
      if (subfolders.length) {
        subfolders.forEach((sf) => console.log(`     alifolderi: ${sf.id}  ${sf.name}`));
      }
    }
    console.log(`[api] Yhteensä ${designs.length} uniikkia designia ${FOLDER_IDS.length} kansiosta.`);
  } else {
    console.log("[api] Haetaan Canva Connect: GET /v1/designs (paginoi)...");
    console.log("  [VAROITUS] Ei --folder-ids — haetaan KAIKKI tilin designit (voi olla 1000+).");
    designs = await listAllOwnedDesigns({
      onProgress: ({ fetched, hasMore }) => {
        process.stdout.write(`  ${fetched} designia${hasMore ? " (jatkuu)" : ""}\r`);
      }
    });
    process.stdout.write("\n");
    console.log(`[api] Yhteensä ${designs.length} designia haettu.`);
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(RAW_CACHE, JSON.stringify({
    fetchedAt: new Date().toISOString(),
    folderIdCacheKey: FOLDER_ID_CACHE_KEY,
    folderIds: FOLDER_IDS,
    designs
  }, null, 2));
  return designs;
}

function scoreDesign(siteItem, design) {
  const titleSim = bestTitleSimilarity(siteItem.title, design.title);
  const dateScore = dateProximityScore(siteItem.date, design.created_at, design.updated_at);
  const { matched: kwMatched, score: keywordScore } = keywordOverlap(siteItem.keywords, design.title);
  const total = combinedScore({ titleSim, dateScore, keywordScore });
  const basis = [];
  if (titleSim >= 0.5) basis.push("title");
  if (dateScore !== null && dateScore >= 0.5) basis.push("date");
  if (kwMatched.length > 0) basis.push("keywords");
  return {
    designId: design.id,
    canvaTitle: design.title,
    pageCount: design.page_count,
    createdAt: design.created_at,
    updatedAt: design.updated_at,
    matchScore: Number(total.toFixed(3)),
    matchBasis: basis,
    _debug: {
      titleSim: Number(titleSim.toFixed(3)),
      dateScore: dateScore === null ? null : Number(dateScore.toFixed(3)),
      keywordScore: Number(keywordScore.toFixed(3)),
      matchedKeywords: kwMatched
    }
  };
}

function buildCandidate(design, siteItem, { isDirect = false } = {}) {
  const scored = scoreDesign(siteItem, design);
  return {
    designId: design.id,
    canvaTitle: design.title,
    pageCount: design.page_count,
    createdAt: design.created_at,
    updatedAt: design.updated_at,
    viewUrl: design.view_url || null,
    editUrl: design.edit_url || null,
    thumbnailUrl: design.thumbnail_url || null,
    sourceFolderId: design._sourceFolderId || null,
    heuristicScore: isDirect ? 1.0 : scored.matchScore,
    matchBasis: isDirect ? ["direct-design-id"] : scored.matchBasis,
    signals: scored._debug,
    isDirectDesignId: isDirect
  };
}

function buildMappings(siteRecords, designs) {
  const designsByShortcut = new Map();
  designs.forEach((d) => designsByShortcut.set(d.id, d));

  const items = siteRecords.map((site, siteIndex) => {
    // 1. Direct design-ID linkistä (jos on)
    const directId = extractDesignIdFromLink(site.link) || extractDesignIdFromLink(site.publicUrl);
    let candidates = [];

    if (directId && designsByShortcut.has(directId)) {
      candidates.push(buildCandidate(designsByShortcut.get(directId), site, { isDirect: true }));
    }

    // 2. Top-K heuristic candidates (poista direct duplicate)
    const heuristic = designs
      .filter((d) => d.id !== directId)
      .map((d) => ({ design: d, scored: scoreDesign(site, d) }))
      .sort((a, b) => b.scored.matchScore - a.scored.matchScore)
      .slice(0, CANDIDATE_TOP_K)
      .map(({ design }) => buildCandidate(design, site));

    candidates = [...candidates, ...heuristic];

    // Auto-status (ennen Claude-arviointia + user-reviewiä)
    let status = "proposed";
    if (candidates.length === 0 || (candidates[0].heuristicScore < REVIEW_THRESHOLD)) {
      status = "unmatched";
    }

    return {
      siteIndex,
      site: {
        title: site.title,
        date: site.date,
        summary: site.summary,
        keywords: site.keywords || [],
        location: site.location,
        jarjestaja: site.jarjestaja,
        kategoria: site.kategoria,
        folder: site.folder,
        link: site.link,
        publicUrl: site.publicUrl,
        thumbnail: site.thumbnail
      },
      candidates,
      claude: null,      // Täytetään scripts/canva/02-claude-review.mjs:llä
      user: null,        // Täytetään review-UI:ssa
      status
    };
  });

  // Duplikaatit: sama top-1 designId monella sivustotietueella
  const dupGroups = new Map();
  items.forEach((m) => {
    const top = m.candidates[0];
    if (!top) return;
    if (!dupGroups.has(top.designId)) dupGroups.set(top.designId, []);
    dupGroups.get(top.designId).push(m);
  });
  const duplicates = [...dupGroups.entries()].filter(([, arr]) => arr.length > 1);

  return { items, duplicates };
}

function writeMapFile(items, designs, duplicates) {
  // Rikas muoto review-UI:lle. Sisältää top-K candidatet + kaikki metadata.
  // Käyttäjän lopulliset päätökset tulevat kentän `user` alle.
  const payload = {
    generatedAt: new Date().toISOString(),
    folderIds: FOLDER_IDS,
    designCount: designs.length,
    itemCount: items.length,
    duplicateDesignIds: duplicates.map(([designId, arr]) => ({
      designId,
      siteIndices: arr.map((m) => m.siteIndex)
    })),
    items
  };
  fs.writeFileSync(MAP_FILE, JSON.stringify(payload, null, 2) + "\n");
  console.log(`[write] ${path.relative(ROOT_DIR, MAP_FILE)}`);
}

async function main() {
  console.log("=== Canva Content Pipeline — Vaihe 1: tunnistekartta ===\n");

  const siteRecords = await loadSiteRecords();
  console.log(`[site] ${siteRecords.length} Canva-tietuetta canva-presentations.json:issa`);

  const designs = await loadOrFetchDesigns();

  console.log(`\n[match] Rakennetaan candidatet (top-${CANDIDATE_TOP_K}) per sivustotietue...`);
  const { items, duplicates } = buildMappings(siteRecords, designs);

  const stats = {
    total: items.length,
    highConfidence: items.filter((m) => m.candidates[0] && m.candidates[0].heuristicScore >= CONFIRM_THRESHOLD).length,
    needsReview: items.filter((m) => m.candidates[0] && m.candidates[0].heuristicScore < CONFIRM_THRESHOLD && m.status === "proposed").length,
    unmatched: items.filter((m) => m.status === "unmatched").length,
    duplicates: duplicates.length
  };

  console.log(`  Sivustotietueita: ${stats.total}`);
  console.log(`  Heuristic top-1 korkea varmuus (>=${CONFIRM_THRESHOLD}): ${stats.highConfidence}`);
  console.log(`  Heuristic vaatii tarkistuksen: ${stats.needsReview}`);
  console.log(`  Ei riittävää heuristic-osumaa (unmatched): ${stats.unmatched}`);
  console.log(`  Duplikaatteja: ${stats.duplicates}\n`);

  writeMapFile(items, designs, duplicates);

  console.log("\nSeuraava askel:");
  console.log(`  1. Aja Claude-arvio: node scripts/canva/02-claude-review.mjs`);
  console.log(`  2. Avaa review-UI: node scripts/canva/review-server.mjs → http://localhost:5174/`);
  console.log(`  3. Käy 75 tietuetta läpi UI:ssa (hyväksy / valitse toinen / ei vastinetta)`);
  console.log(`  4. Vasta sitten aja Vaihe 2 (02-extract.mjs) confirmed-riveille`);
}

main().catch((err) => {
  console.error("VIRHE:", err.message);
  console.error(err.stack);
  process.exit(1);
});

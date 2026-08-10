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
import { listAllOwnedDesigns } from "./_lib/canva-api.mjs";
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
const REVIEW_FILE = path.join(DATA_DIR, "id-map-review.md");
const SITE_FILE = path.join(ROOT_DIR, "src", "_data", "canva-presentations.json");

const argv = process.argv.slice(2);
const isDryRun = argv.includes("--dry-run");
const forceRefresh = argv.includes("--refresh");

const CONFIRM_THRESHOLD = 0.85;  // yli tämän: ei review-listaan
const REVIEW_THRESHOLD = 0.5;    // alle: unmatched

async function loadSiteRecords() {
  const raw = fs.readFileSync(SITE_FILE, "utf8");
  return JSON.parse(raw);
}

async function loadOrFetchDesigns() {
  if (!forceRefresh && fs.existsSync(RAW_CACHE)) {
    const cached = JSON.parse(fs.readFileSync(RAW_CACHE, "utf8"));
    console.log(`[cache] ${cached.designs.length} designia (fetched ${cached.fetchedAt})`);
    return cached.designs;
  }
  if (isDryRun) {
    console.error("Ei välimuistia ja --dry-run — ei API-kutsuja. Aja ilman --dry-run:ta ensin.");
    process.exit(1);
  }
  console.log("[api] Haetaan Canva Connect: GET /v1/designs (paginoi)...");
  const designs = await listAllOwnedDesigns({
    onProgress: ({ fetched, hasMore }) => {
      process.stdout.write(`  ${fetched} designia${hasMore ? " (jatkuu)" : ""}\r`);
    }
  });
  process.stdout.write("\n");
  console.log(`[api] Yhteensä ${designs.length} designia haettu.`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(RAW_CACHE, JSON.stringify({
    fetchedAt: new Date().toISOString(),
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

function buildMappings(siteRecords, designs) {
  const designsByShortcut = new Map();  // designId → design (nopea lookup)
  designs.forEach((d) => designsByShortcut.set(d.id, d));

  const mappings = [];
  const usedDesignIds = new Map();  // designId → siteIndex (jotta havaitaan duplikaatit)

  siteRecords.forEach((site, siteIndex) => {
    // 1. Yritä ensin poimia design-ID suoraan sivuston link/publicUrl-kentästä
    const directId = extractDesignIdFromLink(site.link) || extractDesignIdFromLink(site.publicUrl);
    if (directId && designsByShortcut.has(directId)) {
      const design = designsByShortcut.get(directId);
      mappings.push({
        siteIndex,
        link: site.link,
        siteTitle: site.title,
        siteDate: site.date,
        designId: directId,
        canvaTitle: design.title,
        pageCount: design.page_count,
        createdAt: design.created_at,
        updatedAt: design.updated_at,
        matchScore: 1.0,
        matchBasis: ["direct-design-id"],
        status: "proposed",
        _candidates: []
      });
      return;
    }

    // 2. Sumea matching kaikkia designeja vastaan
    const scored = designs
      .map((d) => scoreDesign(site, d))
      .sort((a, b) => b.matchScore - a.matchScore);

    const top = scored[0];
    const top3 = scored.slice(0, 3);

    if (!top || top.matchScore < REVIEW_THRESHOLD) {
      mappings.push({
        siteIndex,
        link: site.link,
        siteTitle: site.title,
        siteDate: site.date,
        designId: null,
        canvaTitle: null,
        pageCount: null,
        createdAt: null,
        updatedAt: null,
        matchScore: top ? top.matchScore : 0,
        matchBasis: [],
        status: "unmatched",
        _candidates: top3
      });
      return;
    }

    mappings.push({
      siteIndex,
      link: site.link,
      siteTitle: site.title,
      siteDate: site.date,
      designId: top.designId,
      canvaTitle: top.canvaTitle,
      pageCount: top.pageCount,
      createdAt: top.createdAt,
      updatedAt: top.updatedAt,
      matchScore: top.matchScore,
      matchBasis: top.matchBasis,
      status: "proposed",
      _candidates: top3
    });
  });

  // Tunnista duplikaatit (sama designId ehdotetaan useaan siteIndex:iin)
  const dupGroups = new Map();
  mappings.forEach((m) => {
    if (!m.designId) return;
    if (!dupGroups.has(m.designId)) dupGroups.set(m.designId, []);
    dupGroups.get(m.designId).push(m);
  });
  const duplicates = [...dupGroups.entries()].filter(([, arr]) => arr.length > 1);

  return { mappings, duplicates };
}

function writeMapFile(mappings) {
  // Yksinkertaisempi output-muoto: piilotetaan _debug ja _candidates (nämä ovat vain review-tiedostossa)
  const clean = mappings.map((m) => ({
    link: m.link,
    designId: m.designId,
    canvaTitle: m.canvaTitle,
    pageCount: m.pageCount,
    matchScore: m.matchScore,
    matchBasis: m.matchBasis,
    status: m.status
  }));
  fs.writeFileSync(MAP_FILE, JSON.stringify(clean, null, 2) + "\n");
  console.log(`[write] ${path.relative(ROOT_DIR, MAP_FILE)}`);
}

function shortDate(unix) {
  if (!unix) return "?";
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

function writeReviewFile(mappings, duplicates, designs) {
  const confirmed = mappings.filter((m) => m.status === "proposed" && m.matchScore >= CONFIRM_THRESHOLD && duplicates.every(([, arr]) => !arr.includes(m)));
  const needsReview = mappings.filter((m) => m.status === "proposed" && (m.matchScore < CONFIRM_THRESHOLD || duplicates.some(([, arr]) => arr.includes(m))));
  const unmatched = mappings.filter((m) => m.status === "unmatched");
  const unusedDesigns = designs.filter((d) => !mappings.some((m) => m.designId === d.id));

  const lines = [];
  lines.push("# Canva id-map: review\n");
  lines.push(`Generoitu: ${new Date().toISOString()}\n`);
  lines.push("");
  lines.push("Tämä tiedosto listaa täsmäytykset jotka vaativat ihmisen tarkistuksen.");
  lines.push("Kun olet käynyt läpi:");
  lines.push("");
  lines.push("- vahvista OK-tapaukset muuttamalla `data/canva/id-map.json`:in `status: \"proposed\"` → `\"confirmed\"`");
  lines.push("- korjaa väärät `designId`-arvot manuaalisesti");
  lines.push("- jätä epävarmat `\"unmatched\"`-tilaan tai poista rivi jos sivustolla ei ole Canva-vastinetta");
  lines.push("");
  lines.push("## Yhteenveto\n");
  lines.push(`- Sivustolla: ${mappings.length}`);
  lines.push(`- Canva-tilillä: ${designs.length}`);
  lines.push(`- Automaattisesti korkealla varmuudella (>=${CONFIRM_THRESHOLD}): ${confirmed.length}`);
  lines.push(`- Vaatii tarkistuksen: ${needsReview.length}`);
  lines.push(`- Unmatched (ei ehdokasta): ${unmatched.length}`);
  lines.push(`- Duplikaatteja (sama designId ehdotetaan useaan tietueeseen): ${duplicates.length}`);
  lines.push(`- Canva-tilillä designeja jotka eivät mätsänneet mihinkään: ${unusedDesigns.length}`);
  lines.push("");

  if (duplicates.length) {
    lines.push("## Duplikaatit (sama designId → monta sivustotietuetta)\n");
    duplicates.forEach(([designId, arr]) => {
      const design = designs.find((d) => d.id === designId);
      lines.push(`### ${designId}${design ? ` — "${design.title}"` : ""}`);
      arr.forEach((m) => {
        lines.push(`- [${m.siteIndex}] **${m.siteTitle}** (site date: ${m.siteDate}, score: ${m.matchScore})`);
        lines.push(`  - link: ${m.link}`);
      });
      lines.push("");
    });
  }

  if (needsReview.length) {
    lines.push("## Vaatii tarkistuksen (matchScore < " + CONFIRM_THRESHOLD + ")\n");
    needsReview.forEach((m) => {
      lines.push(`### [${m.siteIndex}] ${m.siteTitle}`);
      lines.push(`- Site date: ${m.siteDate}, link: ${m.link}`);
      lines.push(`- **Ehdotettu**: \`${m.designId}\` — "${m.canvaTitle}"`);
      lines.push(`  - pageCount: ${m.pageCount}, created: ${shortDate(m.createdAt)}, updated: ${shortDate(m.updatedAt)}`);
      lines.push(`  - matchScore: **${m.matchScore}**, basis: [${m.matchBasis.join(", ")}]`);
      if (m._debug) {
        lines.push(`  - _debug: title=${m._debug.titleSim}, date=${m._debug.dateScore ?? "n/a"}, keywords=${m._debug.keywordScore} (${m._debug.matchedKeywords.join(", ") || "—"})`);
      }
      if (m._candidates && m._candidates.length > 1) {
        lines.push(`- **Muut ehdokkaat**:`);
        m._candidates.slice(1).forEach((c) => {
          lines.push(`  - \`${c.designId}\` "${c.canvaTitle}" (score ${c.matchScore}, ${shortDate(c.createdAt)})`);
        });
      }
      lines.push("");
    });
  }

  if (unmatched.length) {
    lines.push("## Unmatched (ei riittävän hyvää ehdokasta)\n");
    unmatched.forEach((m) => {
      lines.push(`### [${m.siteIndex}] ${m.siteTitle}`);
      lines.push(`- Site date: ${m.siteDate}, link: ${m.link}`);
      if (m._candidates && m._candidates.length) {
        lines.push(`- Parhaat ehdokkaat (kaikki alle ${REVIEW_THRESHOLD}):`);
        m._candidates.forEach((c) => {
          lines.push(`  - \`${c.designId}\` "${c.canvaTitle}" (score ${c.matchScore}, ${shortDate(c.createdAt)})`);
        });
      } else {
        lines.push(`- Ei ehdokkaita`);
      }
      lines.push("");
    });
  }

  if (unusedDesigns.length) {
    lines.push("## Canva-tilillä olevat designit joita ei liitetty mihinkään sivustotietueeseen\n");
    lines.push(`Yhteensä: ${unusedDesigns.length}. Nämä ovat todennäköisesti esityksiä, joita ei ole julkaistu jarilaru.fi:ssä.`);
    lines.push("");
    unusedDesigns
      .sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0))
      .slice(0, 50)
      .forEach((d) => {
        lines.push(`- \`${d.id}\` "${d.title}" (${d.page_count} diaa, updated ${shortDate(d.updated_at)})`);
      });
    if (unusedDesigns.length > 50) {
      lines.push(`- … ja ${unusedDesigns.length - 50} muuta.`);
    }
    lines.push("");
  }

  fs.writeFileSync(REVIEW_FILE, lines.join("\n"));
  console.log(`[write] ${path.relative(ROOT_DIR, REVIEW_FILE)}`);
}

async function main() {
  console.log("=== Canva Content Pipeline — Vaihe 1: tunnistekartta ===\n");

  const siteRecords = await loadSiteRecords();
  console.log(`[site] ${siteRecords.length} Canva-tietuetta canva-presentations.json:issa`);

  const designs = await loadOrFetchDesigns();

  console.log(`\n[match] Rakennetaan ehdotukset...`);
  const { mappings, duplicates } = buildMappings(siteRecords, designs);

  const stats = {
    total: mappings.length,
    highConfidence: mappings.filter((m) => m.status === "proposed" && m.matchScore >= CONFIRM_THRESHOLD).length,
    needsReview: mappings.filter((m) => m.status === "proposed" && m.matchScore < CONFIRM_THRESHOLD).length,
    unmatched: mappings.filter((m) => m.status === "unmatched").length,
    duplicates: duplicates.length
  };

  console.log(`  Sivustotietueita: ${stats.total}`);
  console.log(`  Korkea varmuus (>=${CONFIRM_THRESHOLD}): ${stats.highConfidence}`);
  console.log(`  Vaatii tarkistuksen: ${stats.needsReview}`);
  console.log(`  Unmatched: ${stats.unmatched}`);
  console.log(`  Duplikaatteja: ${stats.duplicates}\n`);

  writeMapFile(mappings);
  writeReviewFile(mappings, duplicates, designs);

  console.log("\nSeuraava askel:");
  console.log(`  1. Avaa ${path.relative(ROOT_DIR, REVIEW_FILE)} ja käy epävarmat läpi`);
  console.log(`  2. Vahvista OK-tapaukset muuttamalla ${path.relative(ROOT_DIR, MAP_FILE)}:in status "proposed" → "confirmed"`);
  console.log(`  3. Aja sitten Vaihe 2 (02-extract.mjs) confirmed-riveille`);
}

main().catch((err) => {
  console.error("VIRHE:", err.message);
  console.error(err.stack);
  process.exit(1);
});

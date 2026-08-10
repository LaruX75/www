#!/usr/bin/env node
/**
 * Canva Content Pipeline — Vaihe 4: kokonaisanalyysi.
 *
 * Lukee:
 *   src/_data/canva-presentations.json      (75 sivustotietuetta)
 *   src/_data/canva-presentations-rich.json (69 rikastettua)
 *   data/canva/cache/*.json                  (70 diakohtaista tekstiä)
 *   data/canva/theme-vocabulary.json         (37 slugia)
 *   slideshare-analyysi.md                   (aiempi SlideShare-analyysi, vertailupohja)
 *
 * Kirjoittaa:
 *   src/_data/canva-analyse.json
 *   data/canva/analyse-quality-review.md     (jos poikkeamia)
 *
 * Työnjako:
 *   - LASKENTA (ohjelmallisesti): coverage, stats, vuosistat, theme-frekvenssit,
 *     slideCount-jakauma, kielijakauma, kontekstiryhmittelyt, laajimmat
 *   - TULKINTA (Claude): kaudet, punaisetLangat, sisallollinenKehitys,
 *     vertailuSlideShare, aihepiirit-tekstit
 *
 * KÄYTTÖ:
 *   node scripts/canva/04-analyse.mjs
 *   node scripts/canva/04-analyse.mjs --skip-claude  # vain laskenta
 */

import fs from "node:fs";
import path from "node:path";
import { loadEnv, requireEnv, ROOT_DIR } from "./_lib/env.mjs";

loadEnv();

const argv = process.argv.slice(2);
const skipClaude = argv.includes("--skip-claude");

const OUT_FILE = path.join(ROOT_DIR, "src", "_data", "canva-analyse.json");
const QUALITY_FILE = path.join(ROOT_DIR, "data", "canva", "analyse-quality-review.md");

const MODEL = "claude-sonnet-4-6";
const API_URL = "https://api.anthropic.com/v1/messages";

// -----------------------------------------------------------------------------
// Data-lataus
// -----------------------------------------------------------------------------

const site = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "src", "_data", "canva-presentations.json"), "utf8"));
const rich = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "src", "_data", "canva-presentations-rich.json"), "utf8"));
const vocab = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "canva", "theme-vocabulary.json"), "utf8")).themes;
const idMap = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "data", "canva", "id-map.json"), "utf8"));

const cacheDir = path.join(ROOT_DIR, "data", "canva", "cache");
const cacheFiles = fs.readdirSync(cacheDir).filter((f) => f.endsWith(".json"));

// Yhdistä site + rich designId:llä (idMap kertoo linkin site.link → designId)
const linkToDesignId = new Map();
idMap.items.forEach((it) => {
  if (it.user?.status === "confirmed" && it.user?.designId) {
    linkToDesignId.set(it.site.link, it.user.designId);
  }
});

const richByDesignId = new Map(rich.items.map((it) => [it.designId, it]));

// Rakenna yhdistetty korpus: per site-tietue, jos designId → rich data
const corpus = site.map((s) => {
  const designId = linkToDesignId.get(s.link) || null;
  const r = designId ? richByDesignId.get(designId) : null;
  return {
    // Sivusto
    title: s.title,
    date: s.date,
    year: s.date ? Number(s.date.slice(0, 4)) : null,
    location: s.location,
    jarjestaja: s.jarjestaja,
    kategoria: s.kategoria,
    folder: s.folder,
    keywords: s.keywords || [],
    summary: s.summary,
    // Rich
    designId,
    richSummary: r?.richSummary || null,
    themes: r?.themes || [],
    lang: r?.lang || s.lang || null,
    slideCount: r?.slideCount || null,
    emptyPages: r?.emptyPages ?? null,
    confidence: r?.confidence || null,
    hasRich: !!r
  };
});

// -----------------------------------------------------------------------------
// LASKENTA
// -----------------------------------------------------------------------------

function computeStats() {
  const totalSite = corpus.length;
  const totalRich = corpus.filter((c) => c.hasRich).length;
  const totalCached = cacheFiles.length;
  const noYear = corpus.filter((c) => !c.year).length;

  // Vuosistat
  const yearCounts = {};
  corpus.forEach((c) => {
    const y = c.year ? String(c.year) : "unknown";
    if (!yearCounts[y]) yearCounts[y] = { year: y, count: 0, langs: { fi: 0, en: 0, "fi-en": 0, unknown: 0 } };
    yearCounts[y].count++;
    const lang = c.lang || "unknown";
    yearCounts[y].langs[lang] = (yearCounts[y].langs[lang] || 0) + 1;
  });
  const vuosistat = Object.values(yearCounts)
    .filter((v) => v.year !== "unknown")
    .sort((a, b) => a.year.localeCompare(b.year));

  // Themes-frekvenssit + vuosittainen jakauma
  const themeCounts = {};
  vocab.forEach((slug) => { themeCounts[slug] = { theme: slug, count: 0, years: {}, examples: [] }; });
  corpus.forEach((c) => {
    (c.themes || []).forEach((t) => {
      if (!themeCounts[t]) themeCounts[t] = { theme: t, count: 0, years: {}, examples: [] };
      themeCounts[t].count++;
      const y = c.year ? String(c.year) : "unknown";
      themeCounts[t].years[y] = (themeCounts[t].years[y] || 0) + 1;
      if (themeCounts[t].examples.length < 3) {
        themeCounts[t].examples.push({ title: c.title, year: c.year, designId: c.designId });
      }
    });
  });
  const aihepiirit = Object.values(themeCounts)
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count);
  const unusedThemes = Object.values(themeCounts).filter((t) => t.count === 0).map((t) => t.theme);

  // Kielijakauma per vuosi
  const kielet = {
    total: { fi: 0, en: 0, "fi-en": 0, unknown: 0 },
    byYear: {}
  };
  corpus.forEach((c) => {
    const lang = c.lang || "unknown";
    kielet.total[lang] = (kielet.total[lang] || 0) + 1;
    if (c.year) {
      if (!kielet.byYear[c.year]) kielet.byYear[c.year] = { fi: 0, en: 0, "fi-en": 0, unknown: 0 };
      kielet.byYear[c.year][lang] = (kielet.byYear[c.year][lang] || 0) + 1;
    }
  });

  // Slide-count-jakauma
  const withSlides = corpus.filter((c) => c.slideCount && c.slideCount > 0);
  const slideCounts = withSlides.map((c) => c.slideCount).sort((a, b) => a - b);
  const median = slideCounts.length ? slideCounts[Math.floor(slideCounts.length / 2)] : 0;
  const laajimmat = withSlides
    .sort((a, b) => b.slideCount - a.slideCount)
    .slice(0, 10)
    .map((c) => ({
      title: c.title,
      designId: c.designId,
      slideCount: c.slideCount,
      year: c.year,
      themes: c.themes,
      lang: c.lang
    }));

  // Kontekstijakaumat
  const byKategoria = {};
  const byFolder = {};
  const byJarjestaja = {};
  corpus.forEach((c) => {
    if (c.kategoria) byKategoria[c.kategoria] = (byKategoria[c.kategoria] || 0) + 1;
    if (c.folder) byFolder[c.folder] = (byFolder[c.folder] || 0) + 1;
    if (c.jarjestaja) byJarjestaja[c.jarjestaja] = (byJarjestaja[c.jarjestaja] || 0) + 1;
  });

  const totalSlides = withSlides.reduce((s, c) => s + c.slideCount, 0);
  const avgSlides = withSlides.length ? Math.round(totalSlides / withSlides.length) : 0;

  return {
    coverage: {
      siteRecords: totalSite,
      confirmed: linkToDesignId.size,
      extracted: totalCached,
      enriched: totalRich,
      noYear
    },
    stats: {
      totalSlides,
      slideCountMin: slideCounts[0] || 0,
      slideCountMax: slideCounts[slideCounts.length - 1] || 0,
      slideCountAvg: avgSlides,
      slideCountMedian: median,
      years: {
        first: vuosistat[0]?.year,
        last: vuosistat[vuosistat.length - 1]?.year,
        span: vuosistat.length
      }
    },
    vuosistat,
    aihepiirit,
    unusedThemes,
    kielet,
    laajimmat,
    kontekstit: {
      byKategoria: Object.entries(byKategoria).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ label: k, count: n })),
      byFolder: Object.entries(byFolder).sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ label: k, count: n })),
      byJarjestaja: Object.entries(byJarjestaja).sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, n]) => ({ label: k, count: n }))
    }
  };
}

// -----------------------------------------------------------------------------
// DATA QUALITY
// -----------------------------------------------------------------------------

function findQualityIssues(stats) {
  const issues = [];
  corpus.forEach((c, i) => {
    if (!c.date || c.date === "null") issues.push(`#${i} ${c.title}: date puuttuu`);
    if (c.hasRich && c.slideCount === 1) issues.push(`#${i} ${c.title} (${c.designId}): vain 1 dia — voi olla poikkeus`);
    if (c.hasRich && c.emptyPages && c.emptyPages > c.slideCount * 0.5) {
      issues.push(`#${i} ${c.title} (${c.designId}): ${c.emptyPages}/${c.slideCount} tyhjää diaa (> 50%) — OCR-ehdokas`);
    }
    if (c.themes && c.themes.length > 5) issues.push(`#${i} ${c.title}: ${c.themes.length} themes — pitäisi olla 3-5`);
    if (c.hasRich && c.richSummary && c.richSummary.length < 200) {
      issues.push(`#${i} ${c.title} (${c.designId}): richSummary vain ${c.richSummary.length} mk`);
    }
  });
  return issues;
}

// -----------------------------------------------------------------------------
// SlideShare-vertailu (raakadata)
// -----------------------------------------------------------------------------

function loadSlideshareContext() {
  const mdPath = path.join(ROOT_DIR, "slideshare-analyysi.md");
  if (!fs.existsSync(mdPath)) return null;
  return fs.readFileSync(mdPath, "utf8");
}

// -----------------------------------------------------------------------------
// TULKINTA (Claude)
// -----------------------------------------------------------------------------

async function callClaude(prompt) {
  const { ANTHROPIC_API_KEY } = requireEnv("ANTHROPIC_API_KEY");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }]
    })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Anthropic HTTP ${res.status}: ${text.substring(0, 300)}`);
  }
  const data = await res.json();
  return { text: data.content?.[0]?.text || "", usage: data.usage };
}

function parseClaude(text) {
  let clean = text.trim();
  if (clean.startsWith("```")) clean = clean.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  try { return JSON.parse(clean); }
  catch {
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Claude JSON parse failed");
  }
}

function buildInterpretationPrompt(stats, slideshareContext) {
  // Kokoa esityksistä lyhyt katsaus vuosittain (richSummary jos on, muuten site.summary)
  const perYear = {};
  corpus.forEach((c) => {
    const y = c.year || "unknown";
    if (!perYear[y]) perYear[y] = [];
    perYear[y].push({
      title: c.title,
      themes: c.themes,
      slideCount: c.slideCount,
      // Lyhennä rich summary kohtuulliseksi (max 400 mk per esitys)
      summary: c.richSummary ? c.richSummary.substring(0, 400) : (c.summary || "").substring(0, 200)
    });
  });

  const yearlyOverview = Object.entries(perYear)
    .filter(([y]) => y !== "unknown")
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([y, items]) => {
      return `## ${y} (${items.length} esitystä)\n${items.map((it) => `- **${it.title}** (${it.slideCount || "?"} diaa) [${it.themes.join(", ")}]\n  ${it.summary}`).join("\n\n")}`;
    }).join("\n\n");

  const themeSummary = stats.aihepiirit.slice(0, 20)
    .map((a) => `- ${a.theme}: ${a.count} esitystä (${Object.entries(a.years).map(([y, n]) => `${y}:${n}`).join(", ")})`).join("\n");

  const slideshareSection = slideshareContext
    ? `\n## SlideShare-korpus (2009-2020, vertailu)\n\n${slideshareContext.substring(0, 5000)}`
    : "\n## SlideShare-korpus: ei löytynyt vertailudataa";

  return `Sinun tehtäväsi on analysoida Jari Larun Canva-esityskorpus (${stats.coverage.siteRecords} esitystä 2021-2026) ja tuottaa strukturoitu tulkinta.

TÄRKEÄT SÄÄNNÖT:
- Perusta tulkintasi VAIN allaolevaan aineistoon (richSummary + themes + vuosistat)
- ÄLÄ keksi lukuja — ne on jo laskettu ohjelmallisesti ja annetaan valmiina
- Jos aineisto ei tue jotain hypoteesia, älä pakota sitä
- Kirjoita suomeksi (sivuston pääkieli)

## OHJELMALLISET STATS (annetut, älä muuta lukuja)

- Yhteensä: ${stats.coverage.siteRecords} esitystä, ${stats.stats.totalSlides} diaa
- Vuodet: ${stats.stats.years.first}-${stats.stats.years.last}
- Kielijakauma: FI ${stats.kielet.total.fi}, EN ${stats.kielet.total.en}, FI-EN ${stats.kielet.total["fi-en"]}
- Aktiivisimmat vuodet: ${stats.vuosistat.slice().sort((a, b) => b.count - a.count).slice(0, 3).map((v) => `${v.year} (${v.count})`).join(", ")}

## THEMES-FREKVENSSIT (top-20)

${themeSummary}

## AJALLINEN AINEISTO (esitykset vuosittain, teemat + rich summary)

${yearlyOverview}
${slideshareSection}

---

Palauta JSON tarkalleen tässä muodossa (ei muuta tekstiä):

{
  "kaudet": [
    {
      "name": "Kauden nimi (esim. 'Peruskoulutusmateriaalien aika')",
      "years": "YYYY-YYYY",
      "count": N (lasketaan tästä aineistosta, ei arvattu),
      "summary": "2-3 lausetta kauden luonteesta",
      "keyThemes": ["teema1", "teema2"]
    }
  ],
  "punaisetLangat": [
    {
      "name": "Punaisen langan nimi",
      "description": "1-2 lausetta miksi tämä toistuu",
      "spanning": "vuosivälit tai 'koko korpus'"
    }
  ],
  "sisallollinenKehitys": [
    {
      "phase": "Kehitysvaiheen kuvaus",
      "years": "YYYY-YYYY",
      "description": "1-2 lausetta"
    }
  ],
  "vertailuSlideShare": {
    "jatkuvuudet": ["3-5 selkeästi jatkuvaa aihetta"],
    "uudet": ["3-5 aihetta jotka syntyvät Canva-kaudella"],
    "vaimenevat": ["1-3 aihetta jotka häviävät/vaimenevat SlideShare-ajan jälkeen"],
    "ero": "1-2 lausetta merkittävimmästä erosta"
  },
  "aihepiirienTulkinnat": {
    "SLUG": "1-2 lauseen kuvaus mitä tämä teema tarkoittaa tässä korpuksessa"
  },
  "kayttokontekstit": [
    {
      "name": "Kontekstin nimi (esim. 'Opettajien täydennyskoulutukset')",
      "description": "Millaisia tapahtumia, ketkä yleisönä",
      "count": N,
      "examples": ["esimerkkiesityksen otsikko 1", "esimerkkiotsikko 2"]
    }
  ],
  "hypoteesiKehitys": {
    "supports": true tai false,
    "reasoning": "Tukeeko aineisto hypoteesia: digitaaliset oppimisympäristöt → ohjelmointi/STEAM → data/koneoppiminen → tekoälylukutaito → generatiivinen tekoäly → tekoälyagentit/datatoimijuus/oikeudet/turvallisuus"
  }
}

Tulkinta on tässä keskeisin osa — ohjelmalliset stats ovat jo täydellisiä. Keskity **kaudet**, **punaisetLangat**, **sisallollinenKehitys** ja **vertailuSlideShare**.`;
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main() {
  console.log("=== Canva Content Pipeline — Vaihe 4: kokonaisanalyysi ===\n");

  console.log("[laskenta] Aggregoidaan ohjelmalliset stats...");
  const stats = computeStats();

  console.log(`  Coverage: site=${stats.coverage.siteRecords}, confirmed=${stats.coverage.confirmed}, extracted=${stats.coverage.extracted}, enriched=${stats.coverage.enriched}`);
  console.log(`  Diaa yht: ${stats.stats.totalSlides} (min ${stats.stats.slideCountMin}, max ${stats.stats.slideCountMax}, avg ${stats.stats.slideCountAvg}, med ${stats.stats.slideCountMedian})`);
  console.log(`  Vuodet: ${stats.stats.years.first}-${stats.stats.years.last} (${stats.stats.years.span} vuotta)`);
  console.log(`  Kielet: FI=${stats.kielet.total.fi}, EN=${stats.kielet.total.en}, FI-EN=${stats.kielet.total["fi-en"]}`);
  console.log(`  Themes käytössä: ${stats.aihepiirit.length}/${vocab.length}, käyttämättä: ${stats.unusedThemes.length}`);
  console.log("");

  // Data quality
  const issues = findQualityIssues(stats);
  if (issues.length) {
    console.log(`[quality] ${issues.length} poikkeamaa havaittu (data/canva/analyse-quality-review.md)`);
    fs.writeFileSync(QUALITY_FILE, `# Canva-analyysin data quality -huomiot\n\nGeneroitu: ${new Date().toISOString()}\nAnalyysissä havaitut poikkeamat (${issues.length} kpl). Ei korjata analyysiskriptissä — raportoi käyttäjälle.\n\n` + issues.map((i) => `- ${i}`).join("\n") + "\n");
  }

  // Claude-tulkinta
  let interpretation = null;
  if (!skipClaude) {
    console.log("[claude] Kutsutaan tulkintaa...");
    const slideshareContext = loadSlideshareContext();
    if (slideshareContext) console.log(`  SlideShare-vertailudata löytyi (${slideshareContext.length} mk)`);
    const prompt = buildInterpretationPrompt(stats, slideshareContext);
    console.log(`  Prompt: ${(prompt.length / 1024).toFixed(1)} KB`);
    try {
      const { text, usage } = await callClaude(prompt);
      interpretation = parseClaude(text);
      console.log(`  ✓ Tulkinta saatu (tokenit: in=${usage?.input_tokens}, out=${usage?.output_tokens})`);
    } catch (e) {
      console.log(`  ✗ VIRHE: ${e.message.substring(0, 200)}`);
      interpretation = { error: e.message };
    }
  }

  // Kokoa analyse.json
  const analyse = {
    generatedAt: new Date().toISOString(),
    coverage: stats.coverage,
    stats: stats.stats,
    vuosistat: stats.vuosistat,
    kaudet: interpretation?.kaudet || [],
    punaisetLangat: interpretation?.punaisetLangat || [],
    sisallollinenKehitys: interpretation?.sisallollinenKehitys || [],
    aihepiirit: stats.aihepiirit.map((a) => ({
      ...a,
      tulkinta: interpretation?.aihepiirienTulkinnat?.[a.theme] || null
    })),
    unusedThemes: stats.unusedThemes,
    laajimmat: stats.laajimmat,
    kielet: stats.kielet,
    kontekstit: stats.kontekstit,
    kayttokontekstit: interpretation?.kayttokontekstit || [],
    vertailuSlideShare: interpretation?.vertailuSlideShare || null,
    hypoteesiKehitys: interpretation?.hypoteesiKehitys || null
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(analyse, null, 2) + "\n");
  console.log(`\n[write] ${path.relative(ROOT_DIR, OUT_FILE)} (${(fs.statSync(OUT_FILE).size / 1024).toFixed(1)} KB)`);
}

main().catch((e) => { console.error("VIRHE:", e.message); process.exit(1); });

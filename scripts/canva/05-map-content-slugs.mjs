#!/usr/bin/env node
/**
 * Kertaluontoinen mapping: src/presentations/{slug}.md (sivuston Canva-esitys)
 * ↔ canva-presentations.json (rich data) via designId.
 *
 * Tarpeen: sivuston /presentations/{slug}/-sivujen titles poikkeavat merkittävästi
 * canva-presentations.json:in editoiduista title:istä. URL-tokenit eivät jaa (eri
 * shortlinkit samaan designiin). Fuzzy-title-mätsi ei toimi.
 *
 * Ratkaisu: Claude valitsee parhaan mätsin metadatan (title + date + url + description)
 * perusteella. Ihminen voi korjata tarvittaessa data/canva/content-slug-to-designid.json.
 *
 * KÄYTTÖ:
 *   node scripts/canva/05-map-content-slugs.mjs
 */

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { loadEnv, requireEnv, ROOT_DIR } from "./_lib/env.mjs";

loadEnv();
const { ANTHROPIC_API_KEY } = requireEnv("ANTHROPIC_API_KEY");

const PRESENTATIONS_DIR = path.join(ROOT_DIR, "src", "presentations");
const SITE_FILE = path.join(ROOT_DIR, "src", "_data", "canva-presentations.json");
const ID_MAP_FILE = path.join(ROOT_DIR, "data", "canva", "id-map.json");
const OUT_FILE = path.join(ROOT_DIR, "data", "canva", "content-slug-to-designid.json");

const site = JSON.parse(fs.readFileSync(SITE_FILE, "utf8"));
const idMap = JSON.parse(fs.readFileSync(ID_MAP_FILE, "utf8"));

// Site linkillä designId
const linkToDesignId = new Map();
idMap.items.forEach((it) => {
  if (it.user?.status === "confirmed" && it.user?.designId) {
    linkToDesignId.set(it.site.link, it.user.designId);
  }
});

// Lataa src/presentations/*.md-tiedostot joilla url sisältää "canva"
const presFiles = fs.readdirSync(PRESENTATIONS_DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const raw = fs.readFileSync(path.join(PRESENTATIONS_DIR, f), "utf8");
    const fm = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!fm) return null;
    let data;
    try { data = yaml.load(fm[1]) || {}; } catch { return null; }
    if (!/canva\.(com|link)/.test(data.url || data.publicUrl || "")) return null;
    return {
      slug: f.replace(/\.md$/, ""),
      title: data.title || "",
      date: data.date || "",
      url: data.url || "",
      description: (data.description || fm[2] || "").substring(0, 300)
    };
  })
  .filter(Boolean);

console.log(`[map] ${presFiles.length} Canva-linkitettyä src/presentations/*.md`);
console.log(`[map] ${site.length} canva-presentations.json-tietuetta valittavana\n`);

async function callClaude(prompt) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 512, messages: [{ role: "user", content: prompt }] })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).substring(0, 200)}`);
  return (await res.json()).content?.[0]?.text || "";
}

function parseClaude(text) {
  const clean = text.trim().replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
  const m = clean.match(/\{[\s\S]*\}/);
  return m ? JSON.parse(m[0]) : JSON.parse(clean);
}

// Rakenna site-index Claude-syötteeksi
const siteList = site.map((s, i) => `${i}: "${s.title}" (${s.date || "?"}) [${s.jarjestaja || "?"}, ${s.location || "?"}]`).join("\n");

const out = {};
let matched = 0, failed = 0;

for (const p of presFiles) {
  process.stdout.write(`  [${p.slug.substring(0, 45)}] ... `);
  const prompt = `Valitse sivustotietue joka vastaa alla olevaa jarilaru.fi-esitystä. Sama esitys, eri title voi olla käytössä.

JARILARU.FI-ESITYS:
- Title: "${p.title}"
- Date: ${p.date}
- URL: ${p.url}
- Description: ${p.description}

CANVA-PRESENTATIONS.JSON-TIETUEET (${site.length} kpl):
${siteList}

Palauta JSON tarkalleen tässä muodossa:
{ "siteIndex": N tai null, "confidence": "high" | "medium" | "low" | "none", "reason": "yksi lause" }

Sama title, sama päivä ja sama järjestäjä = high. Osittain samat = medium. Vain aihe samankaltainen = low. Ei mätsiä = none.`;

  try {
    const text = await callClaude(prompt);
    const parsed = parseClaude(text);
    if (parsed.siteIndex !== null && site[parsed.siteIndex]) {
      const designId = linkToDesignId.get(site[parsed.siteIndex].link);
      if (designId) {
        out[`/presentations/${p.slug}/`] = { designId, confidence: parsed.confidence, siteTitle: site[parsed.siteIndex].title, reason: parsed.reason };
        matched++;
        console.log(`→ ${parsed.confidence.toUpperCase()} ${designId} "${site[parsed.siteIndex].title.substring(0, 40)}"`);
      } else {
        failed++;
        console.log(`→ mätsi mutta ei designId:tä (site.link puuttuu id-map:sta)`);
      }
    } else {
      out[`/presentations/${p.slug}/`] = null;
      failed++;
      console.log(`→ NONE`);
    }
  } catch (e) {
    failed++;
    console.log(`→ VIRHE ${e.message.substring(0, 80)}`);
  }
}

fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + "\n");
console.log(`\n[write] ${path.relative(ROOT_DIR, OUT_FILE)}`);
console.log(`Yhteenveto: ${matched} mätsäsi, ${failed} ei mätsännyt`);

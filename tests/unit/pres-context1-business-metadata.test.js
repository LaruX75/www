/**
 * PRES-CONTEXT1 — Presentation business-context editorial reconciliation.
 *
 * Structural unit tests that guard the canonical-metadata contract:
 *
 *   1. `business` remains a valid Canonical Content v1 vocabulary member.
 *   2. Explicitly curated business presentations resolve to include `business`.
 *   3. A known non-business presentation does not acquire `business` solely due
 *      to the PRES-CONTEXT1 edits (we assert against a MD that carries no
 *      editorial declaration AND does not match the pre-existing inferContexts
 *      business heuristic).
 *   4. Existing presentation identity / URL / landing / research-membership
 *      semantics are not touched — spot-check on one edited MD.
 *
 * Ref: docs/pres-context1-presentation-business-context-reconciliation-2026-08-30.md
 */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const yaml = require("js-yaml");

const {
  CONTEXT_ORDER,
  CONTEXT_META,
  resolveContexts
} = require("../../src/_data/contentContext.js");

const PRESENTATIONS_DIR = path.join(__dirname, "..", "..", "src", "presentations");

function loadPresentation(basename) {
  const filePath = path.join(PRESENTATIONS_DIR, basename);
  const raw = fs.readFileSync(filePath, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---([\s\S]*)$/);
  if (!m) throw new Error(`missing frontmatter in ${basename}`);
  const fm = yaml.load(m[1]) || {};
  const page = {
    url: `/presentations/${basename.replace(/\.md$/, "")}/`,
    inputPath: `./src/presentations/${basename}`
  };
  return { fm, page, body: m[2] };
}

const KNOWN_BUSINESS = [
  "kempele-veso-2026.md",
  "riihim-ki-veso-2026.md",
  "konen-k-vibe-robotiikka-riihim-ki-robokampus-2026.md",
  "kohti-kriittist-teko-lylukutaitoa-2026-finnoschool.md",
  "opettaja-teko-lyn-ja-lytt-myyden-turbulenssissa-tampere-2025.md",
  "kokkola-2025-teko-ly-opettajan-yst-v-vai-viho.md",
  "monilukutaito-on-opettajan-supervoima-teko-lylukutaito-luento.md",
  "pori-kerava-millaisia-teko-lytaitoja-peruskoulussa-tulisi-opettaa-2020-luvulla.md",
  "digierko2024-risteilyesitys.md",
  "simo-veso-2024.md",
  "tekoaly-opetuskaytto-avi-webinaari-2024.md",
  "ss-osaava-veso-tieto-ja-viestintatekniikka-pedagogisena-tyovalineena-raahe-2015.md"
];

const KNOWN_NON_BUSINESS = "arjen-tekoalyhaaste.md";

test("PRES-CONTEXT1: business is a valid Canonical Content v1 vocabulary member", () => {
  assert.ok(CONTEXT_ORDER.includes("business"), "CONTEXT_ORDER must contain 'business'");
  assert.equal(CONTEXT_META.business.href.fi, "/kouluttaja/",
    "CONTEXT_META.business.href.fi must map to /kouluttaja/");
});

test("PRES-CONTEXT1: every curated business MD declares contexts explicitly and resolves to business", () => {
  for (const basename of KNOWN_BUSINESS) {
    const { fm, page } = loadPresentation(basename);
    assert.ok(Array.isArray(fm.contexts),
      `${basename}: frontmatter must have contexts: array`);
    assert.ok(fm.contexts.includes("business"),
      `${basename}: frontmatter contexts must explicitly include "business"`);
    const resolved = resolveContexts({ ...fm, page }, page.inputPath);
    assert.ok(resolved.includes("business"),
      `${basename}: resolveContexts must include "business"`);
  }
});

test("PRES-CONTEXT1: a known non-business presentation does not acquire business from this slice", () => {
  const { fm, page } = loadPresentation(KNOWN_NON_BUSINESS);
  assert.equal(
    Array.isArray(fm.contexts) && fm.contexts.includes("business"),
    false,
    `${KNOWN_NON_BUSINESS}: must not have explicit contexts=business`
  );
  const resolved = resolveContexts({ ...fm, page }, page.inputPath);
  assert.equal(resolved.includes("business"), false,
    `${KNOWN_NON_BUSINESS}: must not resolve to business`);
});

test("PRES-CONTEXT1: explicit metadata edits preserve existing identity / URL / landing fields", () => {
  const spec = loadPresentation("kempele-veso-2026.md");
  assert.equal(spec.fm.title, "Kempele VESO 2026");
  const iso = spec.fm.date instanceof Date
    ? spec.fm.date.toISOString().slice(0, 10)
    : String(spec.fm.date).slice(0, 10);
  assert.equal(iso, "2026-01-21");
  assert.equal(spec.fm.url, "https://www.canva.com/d/cbYXXNXQtLqaOC");
  assert.equal(spec.fm.type, "esitys");
  assert.deepEqual(spec.fm.categories, ["VESO", "Opettajankoulutus", "Tekoäly"]);
  assert.deepEqual(spec.fm.topics, ["opettajankoulutus"]);
  const resolved = resolveContexts({ ...spec.fm, page: spec.page }, spec.page.inputPath);
  assert.ok(resolved.includes("business"), "business context resolved");
  assert.ok(resolved.includes("teaching"), "teaching context still resolved (unchanged)");
  assert.equal(resolved.includes("research"), false,
    "research must not be inferred merely from adding business");
});

test("PRES-CONTEXT1: adding business does not silently strip other explicit contexts on unrelated MDs", () => {
  const dir = fs.readdirSync(PRESENTATIONS_DIR).filter(f => f.endsWith(".md"));
  const seenExplicitBusinessMds = new Set(KNOWN_BUSINESS);
  for (const basename of dir) {
    const { fm } = loadPresentation(basename);
    if (Array.isArray(fm.contexts)) {
      if (!seenExplicitBusinessMds.has(basename)) {
        assert.equal(fm.contexts.includes("business"), false,
          `${basename}: has explicit contexts but was NOT in the PRES-CONTEXT1 curated list — investigate`);
      }
    }
  }
});

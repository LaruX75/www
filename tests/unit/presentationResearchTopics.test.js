const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const canva = require("../../src/_data/canva");
const finnaAoe = require("../../src/_data/finnaAoe");
const youtube = require("../../src/_data/youtube");
const presentationContexts = require("../../src/_data/presentationContexts.json");
const {
  buildCanonicalPresentationItems,
  buildPresentationsPageSourceData
} = require("../../src/_data/presentationsPage");
const {
  RESEARCH_PRESETS,
  SAFE_RULES,
  classifyPresentationTopic,
  getPresentationResearchPresets
} = require("../../src/_data/presentationResearchTopics");
const { buildPresentationPagefindFilters } = require("../../scripts/_lib/presentationPagefind");

function canonicalIdentity(item = {}) {
  if (item.id) return item.id;
  return [
    item.sourceKey || "",
    item.sourceUrl || item.externalUrl || item.url || item.localPageUrl || "",
    item.title || ""
  ].join("|");
}

async function buildActualPresentationItems() {
  const data = {
    canva: await canva(),
    finnaAoe: await finnaAoe(),
    youtube: await youtube(),
    presentationContexts
  };
  const sourceData = buildPresentationsPageSourceData(data);
  return buildCanonicalPresentationItems(sourceData);
}

describe("presentationResearchTopics", () => {
  test("maps only to known current research presets", () => {
    const presetIds = new Set(RESEARCH_PRESETS.map((preset) => preset.id));
    assert.deepEqual([...presetIds].sort(), ["ai-literacy", "long-term-learning", "teacher-education"]);

    for (const rule of SAFE_RULES) {
      assert.ok(presetIds.has(rule.researchPresetId), rule.id);
      assert.ok(["exact", "alias", "narrower"].includes(rule.mappingType), rule.id);
      assert.ok(Array.isArray(rule.matchValues) && rule.matchValues.length > 0, rule.id);
    }
  });

  test("applies exact, alias, narrower, and non-safe classifications deterministically", () => {
    assert.equal(classifyPresentationTopic("tekoälylukutaito").mappingType, "exact");
    assert.equal(classifyPresentationTopic("Generation AI").mappingType, "alias");
    assert.equal(classifyPresentationTopic("Somekone").mappingType, "narrower");
    assert.equal(classifyPresentationTopic("tekoäly").mappingType, "broader-no");
    assert.equal(classifyPresentationTopic("STEAM").mappingType, "related-not-equivalent");
    assert.equal(classifyPresentationTopic("totally unknown topic").mappingType, "unmapped");
  });

  test("deduplicates preset expansion across multiple matching topics", () => {
    const presets = getPresentationResearchPresets([
      "Generation AI",
      "tekoälylukutaito",
      "Somekone",
      "mobiilioppiminen",
      "CSCL"
    ]);

    assert.deepEqual(presets, ["ai-literacy", "long-term-learning"]);
  });

  test("exposes mapped research presets as structured Pagefind filters", () => {
    const filters = buildPresentationPagefindFilters({
      pagefindLanguage: "fi",
      landingType: "localDetail",
      mediaType: "slides",
      sourceType: "canva",
      presentationYear: "2026",
      presentationContexts: ["education", "research", "teaching"],
      presentationTopics: ["Generation AI", "mobiilioppiminen"],
      presentationResearchPresets: ["ai-literacy", "long-term-learning"],
      presentationEvent: "ITK"
    });

    assert.deepEqual(filters.PresentationContext, ["education", "research", "teaching"]);
    assert.deepEqual(filters["Research context"], ["research"]);
    assert.deepEqual(filters.PresentationResearchPreset, ["ai-literacy", "long-term-learning"]);
  });

  test("keeps canonical presentation identity untouched while deriving preset mappings", async () => {
    const items = await buildActualPresentationItems();
    const before = items.map((item) => canonicalIdentity(item));
    const mapped = items.map((item) => ({
      id: canonicalIdentity(item),
      presets: getPresentationResearchPresets(item.topics || [])
    }));

    assert.equal(items.length, 217);
    assert.deepEqual(
      mapped.map((entry) => entry.id),
      before
    );

    for (const entry of mapped) {
      assert.equal(new Set(entry.presets).size, entry.presets.length, entry.id);
    }

    const coverageByPreset = new Map();
    mapped.forEach((entry) => {
      entry.presets.forEach((presetId) => {
        coverageByPreset.set(presetId, (coverageByPreset.get(presetId) || 0) + 1);
      });
    });

    for (const preset of RESEARCH_PRESETS) {
      assert.ok((coverageByPreset.get(preset.id) || 0) > 0, preset.id);
    }
  });
});

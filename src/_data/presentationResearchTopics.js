const curatedProgram = require("../curated/research-program.json");
const safeMappingArtifact = require("../curated/presentation-research-topic-mapping.json");
const seoTopics = require("./seoTopics");
const loadResearchProgram = require("./researchProgram");

const RESEARCH_THEME_LABELS = loadResearchProgram.RESEARCH_THEME_LABELS || {};

const NON_SAFE_TOPIC_CLASSIFICATIONS = Object.freeze({
  tekoaly: {
    mappingType: "broader-no",
    researchPresetId: "ai-literacy",
    reason: "Broader than the current AI literacy preset; the preset is explicitly about literacy and education, not every AI mention.",
    evidenceSource: "src/fi/tutkimus.md: tekoälylukutaito current line; src/_data/seoTopics.js: tekoalylukutaito profile"
  },
  "generatiivinen tekoaly": {
    mappingType: "related-not-equivalent",
    researchPresetId: "ai-literacy",
    reason: "Important adjacent AI topic, but current research presets do not define generative AI itself as a canonical topic.",
    evidenceSource: "src/fi/tutkimus.md; src/_data/seoTopics.js"
  },
  "generative ai": {
    mappingType: "related-not-equivalent",
    researchPresetId: "ai-literacy",
    reason: "English adjacent AI topic, but not a current canonical research preset or shared research theme.",
    evidenceSource: "src/en/research.md; src/_data/seoTopics.js"
  },
  chatgpt: {
    mappingType: "related-not-equivalent",
    researchPresetId: "ai-literacy",
    reason: "Tool-specific topic rather than a current curated research preset.",
    evidenceSource: "src/fi/tutkimus.md; src/_data/seoTopics.js"
  },
  "eu ai act": {
    mappingType: "related-not-equivalent",
    researchPresetId: "ai-literacy",
    reason: "Regulatory topic tied to AI work, but not one of the current research preset topics or shared research themes.",
    evidenceSource: "src/fi/tutkimus.md; src/_data/seoTopics.js"
  },
  tvt: {
    mappingType: "broader-no",
    researchPresetId: "long-term-learning",
    reason: "Historical umbrella term is broader than the current curated research preset set.",
    evidenceSource: "src/fi/tutkimus.md; src/_data/seoTopics.js"
  },
  veso: {
    mappingType: "related-not-equivalent",
    researchPresetId: "teacher-education",
    reason: "Training event context, not a research topic.",
    evidenceSource: "src/_data/seoTopics.js: opettajankoulutus keywords include veso; src/presentations/riihim-ki-veso-2026.md"
  },
  opetus: {
    mappingType: "broader-no",
    researchPresetId: "teacher-education",
    reason: "Too broad to force into the teacher education preset without adding noise.",
    evidenceSource: "src/_data/seoTopics.js: opettajankoulutus keywords include opetus"
  },
  opettaja: {
    mappingType: "broader-no",
    researchPresetId: "teacher-education",
    reason: "Too broad to use as a deterministic research-topic mapping by itself.",
    evidenceSource: "src/_data/seoTopics.js: opettajankoulutus keywords include opettaja"
  },
  steam: {
    mappingType: "related-not-equivalent",
    researchPresetId: "",
    reason: "Current research themes include STEAM as a subtheme in some curated records, but there is no current top-level research preset that safely owns it.",
    evidenceSource: "src/_data/researchProgram.js: RESEARCH_THEME_LABELS includes steam; src/_data/seoTopics.js: no preset currently exposes steam"
  }
});

function uniqueStrings(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function normalizePresentationTopicId(value = "") {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function topicProfileSlugFromUrl(url = "") {
  const match = String(url || "").match(/\/teemat\/([^/]+)\//);
  return match ? match[1] : "";
}

const seoTopicBySlug = new Map(
  seoTopics
    .filter((topic) => topic && topic.slug)
    .map((topic) => [String(topic.slug), topic])
);

const RESEARCH_PRESETS = Object.freeze(
  (Array.isArray(curatedProgram.lines) ? curatedProgram.lines : [])
    .filter((line) => line && line.showOnResearchPage !== false)
    .map((line) => {
      const topicProfileSlug = topicProfileSlugFromUrl(line.themeUrl || "");
      const topicProfile = seoTopicBySlug.get(topicProfileSlug) || {};
      const sharedThemes = uniqueStrings(topicProfile.researchThemes || []);

      return {
        id: String(line.key),
        label: String(line.title || ""),
        themeUrl: String(line.themeUrl || ""),
        themeLabel: String(line.themeLabel || ""),
        topicProfileSlug,
        topicProfileTitle: String(topicProfile.title || ""),
        publicationsMapping: { field: "researchThemes", values: sharedThemes },
        thesesMapping: { field: "researchThemes", values: sharedThemes },
        writingsMapping: topicProfileSlug
          ? {
              type: "topicProfile",
              slug: topicProfileSlug,
              url: String(line.themeUrl || ""),
              title: String(topicProfile.title || "")
            }
          : null,
        pagefindFilter: { key: "PresentationResearchPreset", value: String(line.key) },
        sharedResearchThemes: sharedThemes,
        sharedResearchThemeLabels: sharedThemes.map((value) => ({
          value,
          label: RESEARCH_THEME_LABELS[value] || value
        })),
        topicProfileKeywords: uniqueStrings(topicProfile.keywords || [])
      };
    })
);

const RESEARCH_PRESET_BY_ID = new Map(RESEARCH_PRESETS.map((preset) => [preset.id, preset]));

const SAFE_RULES = Object.freeze((safeMappingArtifact.rules || []).map((rule) => ({
  ...rule,
  matchValues: uniqueStrings((rule.matchValues || []).map(normalizePresentationTopicId))
})));

SAFE_RULES.forEach((rule) => {
  if (!RESEARCH_PRESET_BY_ID.has(rule.researchPresetId)) {
    throw new Error(`Unknown research preset in presentation topic mapping: ${rule.researchPresetId}`);
  }
});

const SAFE_RULE_BY_MATCH_VALUE = new Map();

SAFE_RULES.forEach((rule) => {
  rule.matchValues.forEach((matchValue) => {
    if (!matchValue) return;
    if (SAFE_RULE_BY_MATCH_VALUE.has(matchValue)) {
      throw new Error(`Duplicate presentation topic mapping alias: ${matchValue}`);
    }
    SAFE_RULE_BY_MATCH_VALUE.set(matchValue, rule);
  });
});

function buildClassificationResult(rawTopic = "", normalizedTopicId = "") {
  const safeRule = SAFE_RULE_BY_MATCH_VALUE.get(normalizedTopicId);
  if (safeRule) {
    const preset = RESEARCH_PRESET_BY_ID.get(safeRule.researchPresetId);
    return {
      presentationTopic: String(rawTopic || ""),
      presentationTopicId: normalizedTopicId,
      normalizedLabel: normalizedTopicId,
      researchTopic: preset.label,
      researchTopicId: preset.id,
      researchTopicProfileSlug: preset.topicProfileSlug,
      mappingType: safeRule.mappingType,
      mappingReason: safeRule.reason,
      evidenceSource: safeRule.evidenceSource,
      safeForArchiveFilter: true,
      safeForResearchContext: true,
      humanReviewNeeded: false,
      notes: String(safeRule.notes || "")
    };
  }

  const nonSafeRule = NON_SAFE_TOPIC_CLASSIFICATIONS[normalizedTopicId];
  if (nonSafeRule) {
    const preset = nonSafeRule.researchPresetId
      ? RESEARCH_PRESET_BY_ID.get(nonSafeRule.researchPresetId)
      : null;

    return {
      presentationTopic: String(rawTopic || ""),
      presentationTopicId: normalizedTopicId,
      normalizedLabel: normalizedTopicId,
      researchTopic: preset?.label || "",
      researchTopicId: preset?.id || "",
      researchTopicProfileSlug: preset?.topicProfileSlug || "",
      mappingType: nonSafeRule.mappingType,
      mappingReason: nonSafeRule.reason,
      evidenceSource: nonSafeRule.evidenceSource,
      safeForArchiveFilter: true,
      safeForResearchContext: false,
      humanReviewNeeded: false,
      notes: ""
    };
  }

  return {
    presentationTopic: String(rawTopic || ""),
    presentationTopicId: normalizedTopicId,
    normalizedLabel: normalizedTopicId,
    researchTopic: "",
    researchTopicId: "",
    researchTopicProfileSlug: "",
    mappingType: "unmapped",
    mappingReason: "No explicit deterministic mapping evidence was found in the current repository.",
    evidenceSource: "",
    safeForArchiveFilter: true,
    safeForResearchContext: false,
    humanReviewNeeded: false,
    notes: ""
  };
}

function classifyPresentationTopic(value = "") {
  const rawTopic = String(value || "").trim();
  const normalizedTopicId = normalizePresentationTopicId(rawTopic);
  return buildClassificationResult(rawTopic, normalizedTopicId);
}

function getPresentationResearchPresets(topics = []) {
  return uniqueStrings(topics)
    .map((topic) => classifyPresentationTopic(topic))
    .filter((result) => result.safeForResearchContext && result.researchTopicId)
    .map((result) => result.researchTopicId)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function getPresentationResearchPresetLabels(topics = []) {
  return getPresentationResearchPresets(topics)
    .map((presetId) => RESEARCH_PRESET_BY_ID.get(presetId))
    .filter(Boolean)
    .map((preset) => preset.label);
}

function getSafePresentationTopicMappingRows() {
  return SAFE_RULES.map((rule) => ({
    ...rule,
    researchPreset: RESEARCH_PRESET_BY_ID.get(rule.researchPresetId)
  }));
}

module.exports = {
  NON_SAFE_TOPIC_CLASSIFICATIONS,
  RESEARCH_PRESETS,
  RESEARCH_PRESET_BY_ID,
  SAFE_RULES,
  classifyPresentationTopic,
  getPresentationResearchPresetLabels,
  getPresentationResearchPresets,
  getSafePresentationTopicMappingRows,
  normalizePresentationTopicId
};

/**
 * Debug-scripti PR-1:n käsintarkastukseen — v4.3.
 * TILAPÄINEN: älä committoi jos ei ole tarvetta.
 *
 * Tulostaa: jokaisen teeman top-8 opinnäytettä + pisteet.
 * Kopio topicItemScore-logiikasta (eleventy.filters.js:in ei-exportatusta).
 */

const loadTheses = require("../src/_data/theses");
const toThesesCollectionItems = require("../src/_utils/toThesesCollectionItems");
const seoTopics = require("../src/_data/seoTopics");

// Kopio normalizeTopicTerm:istä (eleventy.filters.js)
function normalizeTopicTerm(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function topicTermSet(values) {
  return new Set(toArray(values).map(normalizeTopicTerm).filter(Boolean));
}

// Kopio topicTextScore:sta
function topicTextScore(item, topic) {
  const data = item?.data || {};
  const topicTerms = [
    ...toArray(topic.categories),
    ...toArray(topic.keywords),
    topic.title
  ].map(normalizeTopicTerm).filter(Boolean);
  const text = [
    data.title, data.description, data.event, data.venue,
    data.sourceLabel, data.mediaOutlet, data.roleTitle,
    data.type, data.mediaType
  ].map(normalizeTopicTerm).join(" ");
  return topicTerms.reduce((score, term) => {
    if (!term || term.length < 3) return score;
    return text.includes(term) ? score + 1 : score;
  }, 0);
}

// Kopio topicItemScore:sta (PR-1-versio, sisältää theses-tuen)
function topicItemScore(item, topic) {
  if (!item || !item.url || !item.data?.title) return 0;
  const inputPath = item.inputPath || "";
  const tagSet = new Set(toArray(item.data?.tags).map(normalizeTopicTerm));
  const supportedByPath = /src\/(blog|publications|politics|media|presentations)\//.test(inputPath);
  const supportedByTags = ["blog", "publications", "politics", "media", "presentations", "theses"].some((tag) => tagSet.has(tag));
  const supportedByUrl = /^\/(blogi|kynasta|mediassa|esitykset|20\d{2})\//.test(item.url);
  if (!supportedByPath && !supportedByTags && !supportedByUrl) return 0;

  const data = item.data || {};
  const categoryTerms = topicTermSet(topic.categories);
  const keywordTerms = topicTermSet(topic.keywords);
  let score = 0;

  if (topic.slug && toArray(data.topics).map(s => String(s).trim()).includes(topic.slug)) {
    score += 10;
  }
  score += toArray(data.categories).reduce((sum, value) => {
    const norm = normalizeTopicTerm(value);
    if (categoryTerms.has(norm)) return sum + 5;
    if (keywordTerms.has(norm)) return sum + 4;
    return sum;
  }, 0);
  score += toArray(data.keywords).reduce((sum, value) => (
    keywordTerms.has(normalizeTopicTerm(value)) ? sum + 4 : sum
  ), 0);
  score += topicTextScore(item, topic);
  return score;
}

const TOPIC_MIN_SCORE = 5;

(async () => {
  console.log("Ladataan theses-collection...\n");
  const thesesData = await loadTheses();
  const items = toThesesCollectionItems(thesesData);
  console.log(`Yhteensa ${items.length} opinnaytetta.\n`);

  for (const topic of seoTopics) {
    console.log(`\n=== ${topic.title} (${topic.slug}) ===`);
    console.log(`Topic kw: ${(topic.keywords || []).join(", ")}`);
    console.log(`Topic cats: ${(topic.categories || []).join(", ")}`);

    const scored = items
      .map(item => ({ item, score: topicItemScore(item, topic) }))
      .filter(x => x.score >= TOPIC_MIN_SCORE)
      .sort((a, b) => b.score - a.score);

    console.log(`Osumia (score >= ${TOPIC_MIN_SCORE}): ${scored.length}`);
    console.log(`Top 8:`);
    scored.slice(0, 8).forEach(({ item, score }) => {
      const kws = (item.data.keywords || []).slice(0, 4).join(", ");
      const themes = (item.data.researchThemes || []).join(", ") || "-";
      console.log(`  [${score}] ${item.data.year} ${item.data.thesisType === "masterThesis" ? "PG" : "K "} ${item.data.title.substring(0, 65)}`);
      console.log(`         kw: ${kws}${(item.data.keywords || []).length > 4 ? " (+lisaa)" : ""} | themes: ${themes}`);
    });
  }
})();

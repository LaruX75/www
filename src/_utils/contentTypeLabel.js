/**
 * FI/EN-label sisaltotyypille sivun datan, tagien ja kielen perusteella.
 *
 * Aiemmin logiikka asui eleventy.filters.js:n riveilla 71-96
 * (`contentTypeLabel`-funktio). Extraktoitu itsenaiseksi moduuliksi jotta
 * characterization-testit voivat lukita nykyisen kayttaytymisen ennen
 * resolver-refaktoria. Toteutus 1:1 sama, helperit paikallisesti duplikoitu
 * (toArray, normalizeTerm, normalizeTerms) jotta moduuli on itsenainen.
 *
 * @param {object} data - sivun data (mediaType, type, agenda_title, contexts, keywords, speechContext, ...)
 * @param {(Array|string)} tags - sivun tagit
 * @param {("fi"|"en")} lang - kielen valinta
 * @returns {string} nayttolabel
 */
function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function normalizeTerm(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTerms(values) {
  return new Set(toArray(values).map(normalizeTerm).filter(Boolean));
}

function contentTypeLabel(data = {}, tags = [], lang = "fi") {
  const tagSet = new Set(toArray(tags));
  const contexts = normalizeTerms(data.contexts || []);
  const keywords = normalizeTerms(data.keywords || []);
  const type = data.type || "";
  const speechContext = String(data.speechContext || "").trim();
  if (data.mediaType === "video") return lang === "en" ? "Video" : "Video";
  if (data.mediaType === "podcast") return lang === "en" ? "Podcast" : "Podcast";
  if (data.mediaType === "radio") return lang === "en" ? "Radio" : "Radio";
  if (data.mediaType === "article") return lang === "en" ? "Media article" : "Lehtijuttu";
  if (type === "esitys" || tagSet.has("presentations")) return lang === "en" ? "Presentation" : "Esitys";
  if (type === "lausunto") return lang === "en" ? "Expert statement" : "Asiantuntijalausunto";
  if (data.agenda_title === "Valtuuston kyselytunti" || contexts.has("valtuuston kyselytunti") || keywords.has("valtuustokysely") || speechContext === "kyselytunti") return lang === "en" ? "Council question hour" : "Valtuuston kyselytunti";
  if (type === "puhe") {
    if (speechContext === "valtuusto") return lang === "en" ? "Council speech" : "Valtuustopuheenvuoro";
    if (speechContext === "akateeminen-puhe") return lang === "en" ? "Academic speech" : "Akateeminen puhe";
    if (speechContext === "juhlapuhe") return lang === "en" ? "Ceremonial speech" : "Juhlapuhe";
    if (speechContext === "julkinen-tilaisuus") return lang === "en" ? "Public speech" : "Julkinen puhe";
    return lang === "en" ? "Speech" : "Puhe";
  }
  if (type === "mielipide") return lang === "en" ? "Opinion" : "Mielipide";
  if (type === "kolumni") return lang === "en" ? "Column" : "Kolumni";
  if (tagSet.has("politics")) return lang === "en" ? "Council initiative" : "Valtuustoaloite";
  if (tagSet.has("blog")) return lang === "en" ? "Blog post" : "Blogikirjoitus";
  return lang === "en" ? "Text" : "Kirjoitus";
}

module.exports = contentTypeLabel;

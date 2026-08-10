/**
 * Matching-apufunktiot: sivuston 75 Canva-tietuetta ↔ tilin design-luettelo.
 *
 * Ei ulkopuolisia paketasennuksia. Levenshtein + Jaccard + päivämääräerotus.
 */

/**
 * Normalisoi otsikko sumeaa vertailua varten.
 * - lowercase
 * - NFKD + poista aksentit
 * - poista välimerkit
 * - collapse whitespace
 */
export function normalizeTitle(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Levenshtein-etäisyys */
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Levenshtein-samankaltaisuus normalisoituna 0..1 */
export function titleSimilarity(a, b) {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (!na && !nb) return 1;
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const dist = levenshtein(na, nb);
  const max = Math.max(na.length, nb.length);
  return 1 - dist / max;
}

/** Jaccard-samankaltaisuus token-tasolla (sanajoukot) */
export function tokenJaccard(a, b) {
  const setA = new Set(normalizeTitle(a).split(" ").filter(Boolean));
  const setB = new Set(normalizeTitle(b).split(" ").filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;
  const inter = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union ? inter / union : 0;
}

/**
 * Otsikko-similarity: paras (max) Levenshteinin ja Jaccardin välillä.
 * Jaccard palkitsee osumia järjestyksestä riippumatta.
 */
export function bestTitleSimilarity(a, b) {
  return Math.max(titleSimilarity(a, b), tokenJaccard(a, b));
}

/**
 * Sivuston `date` on "YYYY-MM-DD" tai null.
 * Canvan created_at/updated_at on unix seconds.
 * @returns {number|null} päivien erotus (min(created, updated) — sivustoDate), tai null
 */
export function daysBetween(siteDateIso, canvaUnixSecs) {
  if (!siteDateIso) return null;
  const siteMs = Date.parse(siteDateIso);
  if (Number.isNaN(siteMs)) return null;
  const canvaMs = Number(canvaUnixSecs || 0) * 1000;
  if (!canvaMs) return null;
  return Math.abs(canvaMs - siteMs) / 86_400_000;
}

/**
 * Paras päivämääräpisteytys (0..1):
 * käyttää lähimpää created_at/updated_at, toleranssi 14 päivää.
 */
export function dateProximityScore(siteDateIso, createdAt, updatedAt, toleranceDays = 14) {
  const dCreated = daysBetween(siteDateIso, createdAt);
  const dUpdated = daysBetween(siteDateIso, updatedAt);
  const candidates = [dCreated, dUpdated].filter((x) => x !== null && Number.isFinite(x));
  if (candidates.length === 0) return null;
  const best = Math.min(...candidates);
  if (best > toleranceDays) return 0;
  return 1 - best / toleranceDays;
}

/**
 * Avainsana-osumat sivuston keywords vs. Canvan otsikko.
 * @returns {{ matched: string[], score: number }} matched = mätsäävät sanat, score 0..1
 */
export function keywordOverlap(siteKeywords = [], canvaTitle = "") {
  const words = new Set(normalizeTitle(canvaTitle).split(" ").filter(Boolean));
  const normKw = (siteKeywords || []).map(normalizeTitle).filter(Boolean);
  if (normKw.length === 0) return { matched: [], score: 0 };
  const matched = normKw.filter((kw) => {
    // Multi-word keyword: pitää löytyä koko fraasi tai kaikki sanat
    const parts = kw.split(" ").filter(Boolean);
    return parts.every((p) => words.has(p));
  });
  return { matched, score: matched.length / normKw.length };
}

/**
 * Poimi Canva design-ID sivuston link-kentästä, jos se on suoraan tunnisteen muodossa.
 * Muodot:
 *   https://www.canva.com/design/DAxxxxxxxxx/YYYY/view  → DAxxxxxxxxx
 *   https://www.canva.com/design/DAxxxxxxxxx           → DAxxxxxxxxx
 * NB: canva.com/d/[token] on lyhytlinkin token, EI design-ID:tä.
 */
export function extractDesignIdFromLink(link) {
  const m = String(link || "").match(/\/design\/(DA[A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

/**
 * Yhdistelmäscore.
 * Painot: title 0.55, date 0.30, keywords 0.15.
 * Jos päivämääräpisteytys puuttuu (null), title 0.75 + keywords 0.25.
 */
export function combinedScore({ titleSim, dateScore, keywordScore }) {
  if (dateScore === null) {
    return 0.75 * titleSim + 0.25 * keywordScore;
  }
  return 0.55 * titleSim + 0.30 * dateScore + 0.15 * keywordScore;
}

const fs = require('fs');
const path = require('path');
const { isOfflineFetchMode, readCache, readCacheIfFresh, writeCache } = require('./_apiCache');
const { loadHiddenIds } = require('./_curatedStubs');
const { thesisPageUrl } = require('../_utils/thesisIdentity');
// TH-CITE1 Phase 6: withCitation now derives citationApa from the
// canonical thesis CSL projection + shared publicationCitation
// renderer (server-safe UMD via the Node accessor). This deletes
// the last parallel server-side APA composer while preserving the
// public /data/theses.json.citationApa and JSON-LD citation
// contracts byte-identically (Phase 6 baseline: 169/169 IDENTICAL).
const { buildThesisCslItem } = require('../_utils/thesisCsl');
const publicationCitation = require('../_utils/publicationCitation');
const curatedProgram = require('../curated/research-program.json');
const curatedThesisMeta = require('../curated/research-thesis-meta.json');

// TH-CITE1 Phase 6 language contract: citationApa is a persisted
// public/build field. Its historical value is always FI regardless
// of thesis source language or page UI locale. Phase 2 shared-
// renderer output with lang="fi" is byte-identical to the pre-4A
// legacy composer for all 169 canonical unique theses, so this
// constant preserves the current public contract. Template-level
// visible citations remain independent (they call
// csl | publicationCitation("apa", currentLang) — see
// src/_includes/thesis-detail-body.njk + thesis-archive-table.njk).
const CITATION_APA_LANG = 'fi';

const CACHE_KEY = 'theses-oulurepo-v2';
const CACHE_TTL_HOURS = 6;

const BASE = 'https://oulurepo.oulu.fi/open-search/';
const NAME = 'Laru';  // ← vaihda ohjaajan sukunimi
const RPP = 100;
const CURATED_THESIS_META = {
    ...(curatedThesisMeta || {}),
    ...((curatedProgram && curatedProgram.thesisMeta) || {}),
};

// HUOM: aiemmin oli ALLOWED_LICENSE_PREFIXES + isAllowedLicense() joka suodatti
// abstract-tekstin pois InC-lisensoiduilta opinnaytteilta (~120/170). Filtteri
// poistettiin 2026-08-09 koska abstract on opinnaytteen bibliografista
// metadataa, joka on julkaistavissa lisensista riippumatta (yliopiston
// julkaisuarkiston vakiokaytanto). OuluREPO nayttaa itse abstract:in kaikille.

function normalizeText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

// TH-CITE1 Phase 6: derive citationApa from canonical CSL + shared
// renderer. `buildThesisCslItem` accepts the raw thesis shape
// (link / title / authors / year / type / language) — see
// src/_utils/thesisCsl.js. Publications use the same renderer via
// src/_data/researchfiContent.js; there is one bibliographic
// implementation for the whole site.
//
// The previous server-side APA composer (`buildApaCitation`) and
// its FI/EN thesis-level helper (`getThesisLevelLabel`) plus the
// APA author-list formatters (`formatAuthorsApa`, `formatAuthorApa`,
// `formatAuthorInitials`) were deleted in Phase 6 after 169/169
// byte-identical parity was proven on the entire canonical corpus
// against the shared renderer at lang="fi".
function citationApaFromCsl(thesis) {
    const csl = buildThesisCslItem(thesis);
    if (!csl) return '';
    const rendered = publicationCitation.buildCitation({
        csl,
        style: 'apa',
        lang: CITATION_APA_LANG
    });
    return (rendered && rendered.text) ? rendered.text : '';
}

function withCitation(thesis) {
    const meta = CURATED_THESIS_META[thesis.link] || {};
    return {
        ...thesis,
        pageUrl: thesisPageUrl(thesis.link),
        citationApa: citationApaFromCsl(thesis),
        citationStyle: 'APA 7',
        researchLine: meta.researchLine || null,
        researchExcluded: meta.excludeFromResearchProgram === true,
        researchThemes: Array.isArray(meta.themes) ? meta.themes.filter(Boolean) : [],
        researchAudience: Array.isArray(meta.audience) ? meta.audience.filter(Boolean) : [],
        featuredOn: Array.isArray(meta.featuredOn) ? meta.featuredOn.filter(Boolean) : [],
        researchPriority: Number.isFinite(meta.priority) ? meta.priority : 0,
        researchSummary: normalizeText(meta.summary || ''),
    };
}

function buildEmptyResult(error = null, source = 'fallback') {
    return {
        gradut: [],
        kandit: [],
        reviewerOnly: [],
        stats: {
            totalGradut: 0,
            totalKandit: 0,
            totalReviewer: 0,
            total: 0,
            byYear: [],
            firstYear: '',
            lastYear: '',
        },
        fetchedAt: new Date().toISOString(),
        source,
        error,
    };
}

// Lataa manuaalisesti kuratoidut opinnäytetyöt (esim. ennen 2022 kandit)
function loadManualTheses() {
  try {
    const p = path.join(__dirname, 'curated', 'theses.json');
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    return (data.manual || []).map(t => ({
      title: t.title || '',
      year: t.year || '',
      authors: t.authors || [],
      advisors: t.advisors || [],
      reviewers: t.reviewers || [],
      type: t.type || 'bachelorThesis',
      link: t.link || '',
      abstract: t.abstract || '',
      language: t.language || '',
      subjects: t.subjects || [],
      keywords: t.keywords || [],
      manual: true,
    })).map(withCitation);
  } catch {
    return [];
  }
}

// Lataa PDF:istä poimitut avainsanat cachesta (päivitetään: npm run fetch:keywords)
// Formaatti: { link: [...keywords] }  TAI  { link: { keywords: [...], abstract: "..." } }
function loadKeywordsCache() {
  try {
    const cachePath = path.join(__dirname, 'thesis-keywords-cache.json');
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    return {};
  }
}

// Palauttaa { keywords, abstract } riippumatta cachessa käytetystä formaatista
function getCacheEntry(keywordsCache, link) {
  const entry = keywordsCache[link];
  if (!entry) return { keywords: [], abstract: '' };
  if (Array.isArray(entry)) return { keywords: entry, abstract: '' };
  return { keywords: entry.keywords || [], abstract: entry.abstract || '' };
}

// Rakenna Lucene-kysely
function buildQuery(role, types) {
    const typePart = types.map(t => `type:${t}`).join(' OR ');
    return `dc.contributor.${role}:${NAME}* AND (${typePart})`;
}

// Hae yksi sivu
async function fetchPage(query, start = 0) {
    const params = new URLSearchParams({
        query, format: 'kk', rpp: RPP, start, sort_by: 2, order: 'desc'
    });
    const url = `${BASE}?${params}`;
    console.log(`[theses] Haetaan: ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
}

// Parsii kk-formaatin XML:n
function decodeXmlEntities(str) {
    return str
        .replace(/&#13;/g, '')       // rivinpaluu XML-entiteettinä → poistetaan
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

function parseKK(xmlStr) {
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let itemMatch;

    while ((itemMatch = itemRegex.exec(xmlStr)) !== null) {
        const block = itemMatch[1];

        const getMeta = (element, qualifier) => {
            const re = new RegExp(
                `<metadata[^>]*element="${element}"[^>]*qualifier="${qualifier}"[^>]*>([^<]*)</metadata>`
            );
            const m = block.match(re);
            return m ? decodeXmlEntities(m[1].trim()) : '';
        };

        const getMetaAll = (element, qualifier) => {
            const re = new RegExp(
                `<metadata[^>]*element="${element}"[^>]*qualifier="${qualifier}"[^>]*>([^<]*)</metadata>`,
                'g'
            );
            const results = [];
            let m;
            while ((m = re.exec(block)) !== null) {
                if (m[1].trim()) results.push(m[1].trim());
            }
            return results;
        };

        const title = getMeta('title', '') || getMeta('title', 'alternative');
        if (!title) continue;

        const issued = getMeta('date', 'issued');
        const year = (issued.match(/\d{4}/) || [])[0] || '';

        const licenseUri = getMeta('rights', 'uri') || getMeta('rights', 'url');
        items.push({
            title,
            year,
            authors: getMetaAll('contributor', 'author'),
            advisors: getMetaAll('contributor', 'thesisadvisor'),
            reviewers: getMetaAll('contributor', 'reviewer'),
            type: getMeta('type', 'publication'),
            okmType: getMeta('type', 'okm'),
            link: getMeta('identifier', 'uri') || (block.match(/<url>([^<]*)<\/url>/) || [])[1] || '',
            licenseUri,
            abstract: getMeta('description', 'abstract') || '',
            language: getMeta('language', 'iso'),
            subjects: getMetaAll('subject', 'discipline'),
            keywords: [], // täytetään cachesta alla
        });
    }
    return items;
}

// Hae kaikki sivut yhdelle querylle
// kk-formaatti ei sisällä totalResults-tagia, joten sivutetaan niin kauan
// kuin sivu palauttaa RPP kappaletta (turvaraja 20 sivua)
// Palauttaa { items, hadError } — kutsujan vastuulla tarkistaa hadError
// ennen kuin korvaa välimuistidatan osittaisilla tuloksilla.
async function fetchAll(query) {
    let items = [];
    let hadError = false;
    for (let page = 0; page < 20; page++) {
        try {
            const xml = await fetchPage(query, page * RPP);
            const pageItems = parseKK(xml);
            items.push(...pageItems);
            console.log(`[theses] sivu ${page + 1}: ${pageItems.length} tietuetta, yhteensä ${items.length}`);
            if (pageItems.length < RPP) break; // viimeinen sivu
        } catch (e) {
            console.warn(`[theses] sivu ${page + 1} epäonnistui:`, e.message);
            hadError = true;
            break;
        }
    }
    return { items, hadError };
}

// Client-side filtteri: varmista nimen osuma
function filterByName(items, name, role) {
    const lower = name.toLowerCase();
    return items.filter(r => {
        const field = role === 'reviewer' ? r.reviewers : r.advisors;
        return field.some(n => n.toLowerCase().includes(lower));
    });
}

// Yhdistä manuaaliset kandit välimuistidataan ja päivitä avainsanat tuoreesta cachesta
function mergeManualIntoCache(data, keywordsCache) {
    const applyKw = items => items.map(t => {
        const cached = getCacheEntry(keywordsCache, t.link);
        return withCitation({
            ...t,
            keywords: t.manual ? (t.keywords || []) : cached.keywords,
            abstract: t.abstract || (t.manual ? '' : cached.abstract),
        });
    });

    const manual = loadManualTheses().filter(t => t.type === 'bachelorThesis');
    const existingLinks = new Set(data.kandit.map(t => t.link));
    const extra = manual.filter(t => !existingLinks.has(t.link));
    const reviewerOnly = applyKw(data.reviewerOnly || []);
    const gradut = applyKw(data.gradut || []);
    const baseKandit = applyKw([
        ...data.kandit,
        ...extra.filter(t => !existingLinks.has(t.link)),
    ]).sort((a, b) => (b.year || '').localeCompare(a.year || ''));
    return {
        ...data,
        gradut,
        kandit: baseKandit,
        reviewerOnly,
        stats: {
            ...data.stats,
            totalKandit: baseKandit.length,
            totalReviewer: reviewerOnly.length,
            total: (data.stats.totalGradut || gradut.length) + baseKandit.length,
        },
    };
}

module.exports = async function () {
    console.log('[theses] Haetaan opinnäytetöitä OuluREPO:sta...');
    const keywordsCache = loadKeywordsCache();

    if (isOfflineFetchMode()) {
        console.log('[theses] Offline fetch mode käytössä, ohitetaan OuluREPO-haku.');
        const offlineCached = readCache(CACHE_KEY);
        if (offlineCached?.data) {
            console.log('[theses] Käytetään offline-välimuistia.');
            return { ...mergeManualIntoCache(offlineCached.data, keywordsCache), source: 'cache' };
        }
        return buildEmptyResult('Offline fetch mode enabled', 'offline');
    }

    const fresh = readCacheIfFresh(CACHE_KEY, CACHE_TTL_HOURS);
    if (fresh?.data) {
        console.log(`[theses] Käytetään tuoretta välimuistia (${fresh.savedAt}).`);
        return { ...mergeManualIntoCache(fresh.data, keywordsCache), source: 'cache' };
    }

    const cached = readCache(CACHE_KEY);
    const cachedData = cached?.data || null;

    const addKeywords = items => items.map(t => {
        const cached = getCacheEntry(keywordsCache, t.link);
        return withCitation({
            ...t,
            keywords: t.manual ? (t.keywords || []) : cached.keywords,
            abstract: t.abstract || (t.manual ? '' : cached.abstract),
        });
    });
    const manualTheses = loadManualTheses();

    try {
        // Hae ohjaajan gradut/kandit ja tarkastetut rinnakkain
        const advisorQuery = buildQuery('thesisadvisor', ['masterThesis', 'bachelorThesis']);
        const reviewerQuery = buildQuery('reviewer', ['masterThesis', 'bachelorThesis']);
        const [
            { items: rawAdvisor, hadError: advisorError },
            { items: rawReviewer, hadError: reviewerError },
        ] = await Promise.all([fetchAll(advisorQuery), fetchAll(reviewerQuery)]);
        const advisor = filterByName(rawAdvisor, NAME, 'thesisadvisor');
        const reviewer = filterByName(rawReviewer, NAME, 'reviewer');

        // Jos jokin haku epäonnistui osittain, käytetään vanhaa välimuistia
        if ((advisorError || reviewerError) && cachedData) {
            console.warn('[theses] Osittainen API-virhe — käytetään vanhaa välimuistia.');
            return { ...mergeManualIntoCache(cachedData, keywordsCache), source: 'cache', error: 'partial fetch error' };
        }

        // Kuratorointi: piilota pyydetyt opinnäytetyöt linkin perusteella
        const hiddenLinks = loadHiddenIds('theses');
        const isVisible = (t) => !hiddenLinks.has(t.link);

        // Jaa tyyppien mukaan
        const gradut = addKeywords(advisor.filter(t => t.type === 'masterThesis' && isVisible(t))
            .sort((a, b) => (b.year || '').localeCompare(a.year || '')));

        // OuluREPO:sta haetut + manuaaliset kandit, deduplikoitu linkin perusteella
        const repoBachelorLinks = new Set(
            advisor.filter(t => t.type === 'bachelorThesis' && isVisible(t)).map(t => t.link)
        );
        const manualKandit = manualTheses.filter(
            t => t.type === 'bachelorThesis' && !repoBachelorLinks.has(t.link)
        );
        const kandit = addKeywords([
            ...advisor.filter(t => t.type === 'bachelorThesis' && isVisible(t)),
            ...manualKandit,
        ]).sort((a, b) => (b.year || '').localeCompare(a.year || ''));

        // Deduplikoi tarkastetut (poista ne jotka ovat myös ohjattuja)
        const advisorLinks = new Set(advisor.map(t => t.link));
        const reviewerOnly = addKeywords(reviewer.filter(t => !advisorLinks.has(t.link) && isVisible(t))
            .sort((a, b) => (b.year || '').localeCompare(a.year || '')));

        // Yhteenveto vuosittain
        const byYear = {};
        for (const t of [...gradut, ...kandit]) {
            byYear[t.year] = (byYear[t.year] || 0) + 1;
        }
        const yearStats = Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0]));

        const result = {
            gradut,
            kandit,
            reviewerOnly,
            stats: {
                totalGradut: gradut.length,
                totalKandit: kandit.length,
                totalReviewer: reviewerOnly.length,
                total: gradut.length + kandit.length,
                byYear: yearStats,
                firstYear: yearStats.length ? yearStats[yearStats.length - 1][0] : '',
                lastYear: yearStats.length ? yearStats[0][0] : '',
            },
            fetchedAt: new Date().toISOString(),
        };

        console.log(`[theses] Valmis: ${result.stats.totalGradut} gradua, ${result.stats.totalKandit} kandia, ${result.stats.totalReviewer} tarkastettua`);
        writeCache(CACHE_KEY, result);
        return result;

    } catch (e) {
        console.error('[theses] VIRHE:', e.message);
        if (cachedData) {
            console.warn('[theses] Käytetään vanhaa välimuistia virheen takia.');
            return { ...mergeManualIntoCache(cachedData, keywordsCache), source: 'cache', error: e.message };
        }
        // Palauta tyhjä rakenne ettei build kaadu
        return buildEmptyResult(e.message);
    }
};

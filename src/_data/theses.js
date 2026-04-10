const fs = require('fs');
const path = require('path');
const { isOfflineFetchMode } = require('./_apiCache');
const { loadHiddenIds } = require('./_curatedStubs');

const BASE = 'https://oulurepo.oulu.fi/open-search/';
const NAME = 'Laru';  // ← vaihda ohjaajan sukunimi
const RPP = 100;

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

// Lataa PDF:istä poimitut avainsanat cachesta (päivitetään: npm run fetch:keywords)
function loadKeywordsCache() {
  try {
    const cachePath = path.join(__dirname, 'thesis-keywords-cache.json');
    return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
  } catch {
    return {};
  }
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
            return m ? m[1].trim() : '';
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

        items.push({
            title,
            year,
            authors: getMetaAll('contributor', 'author'),
            advisors: getMetaAll('contributor', 'thesisadvisor'),
            reviewers: getMetaAll('contributor', 'reviewer'),
            type: getMeta('type', 'publication'),
            okmType: getMeta('type', 'okm'),
            link: getMeta('identifier', 'uri') || (block.match(/<url>([^<]*)<\/url>/) || [])[1] || '',
            abstract: getMeta('description', 'abstract').substring(0, 300),
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
async function fetchAll(query) {
    let items = [];
    for (let page = 0; page < 20; page++) {
        try {
            const xml = await fetchPage(query, page * RPP);
            const pageItems = parseKK(xml);
            items.push(...pageItems);
            console.log(`[theses] sivu ${page + 1}: ${pageItems.length} tietuetta, yhteensä ${items.length}`);
            if (pageItems.length < RPP) break; // viimeinen sivu
        } catch (e) {
            console.warn(`[theses] sivu ${page + 1} epäonnistui:`, e.message);
            break;
        }
    }
    return items;
}

// Client-side filtteri: varmista nimen osuma
function filterByName(items, name, role) {
    const lower = name.toLowerCase();
    return items.filter(r => {
        const field = role === 'reviewer' ? r.reviewers : r.advisors;
        return field.some(n => n.toLowerCase().includes(lower));
    });
}

module.exports = async function () {
    console.log('[theses] Haetaan opinnäytetöitä OuluREPO:sta...');
    if (isOfflineFetchMode()) {
        console.log('[theses] Offline fetch mode käytössä, ohitetaan OuluREPO-haku.');
        return buildEmptyResult('Offline fetch mode enabled', 'offline');
    }

    const keywordsCache = loadKeywordsCache();
    const addKeywords = items => items.map(t => ({
        ...t,
        keywords: keywordsCache[t.link] || [],
    }));

    try {
        // Hae ohjaajan gradut ja kandit
        const advisorQuery = buildQuery('thesisadvisor', ['masterThesis', 'bachelorThesis']);
        const rawAdvisor = await fetchAll(advisorQuery);
        const advisor = filterByName(rawAdvisor, NAME, 'thesisadvisor');

        // Hae myös tarkastamat (valinnainen)
        const reviewerQuery = buildQuery('reviewer', ['masterThesis', 'bachelorThesis']);
        const rawReviewer = await fetchAll(reviewerQuery);
        const reviewer = filterByName(rawReviewer, NAME, 'reviewer');

        // Kuratorointi: piilota pyydetyt opinnäytetyöt linkin perusteella
        const hiddenLinks = loadHiddenIds('theses');
        const isVisible = (t) => !hiddenLinks.has(t.link);

        // Jaa tyyppien mukaan
        const gradut = addKeywords(advisor.filter(t => t.type === 'masterThesis' && isVisible(t))
            .sort((a, b) => (b.year || '').localeCompare(a.year || '')));
        const kandit = addKeywords(advisor.filter(t => t.type === 'bachelorThesis' && isVisible(t))
            .sort((a, b) => (b.year || '').localeCompare(a.year || '')));

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
        return result;

    } catch (e) {
        console.error('[theses] VIRHE:', e.message);
        // Palauta tyhjä rakenne ettei build kaadu
        return buildEmptyResult(e.message);
    }
};

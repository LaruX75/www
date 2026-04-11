require('dotenv').config();
const { readCache, readCacheIfFresh, writeCache, fetchWithTimeout } = require("./_apiCache");
const { loadHiddenIds } = require("./_curatedStubs");

const CACHE_TTL_HOURS = 6;
const CROSSREF_CACHE_KEY = "crossref-enrichments-v1";
const CROSSREF_CACHE_TTL_HOURS = 168; // 1 viikko
const JUFO_CACHE_KEY = "jufo-enrichments-v1";
const JUFO_CACHE_TTL_HOURS = 168; // 1 viikko
const JUFO_BASE = "https://jufo-rest.csc.fi/v1.1";
const JUFO_HEADERS = { "User-Agent": "jarilaru.fi/2.0 (mailto:jari.laru@oulu.fi; academic personal site)" };

const CACHE_KEY = "researchfi-publications";

const typeMap = {
    "A1": "Alkuperäisartikkeli tieteellisessä aikakauslehdessä",
    "A2": "Katsausartikkeli tieteellisessä aikakauslehdessä",
    "A3": "Kirjan tai muun kokoomateoksen osa",
    "A4": "Artikkeli konferenssijulkaisussa",
    "B1": "Kirjoitus tieteellisessä aikakauslehdessä",
    "B2": "Kirjan tai muun kokoomateoksen osa",
    "B3": "Vertaisarvioimaton artikkeli konferenssijulkaisussa",
    "C1": "Kustannettu tieteellinen erillisteos",
    "C2": "Toimitettu kirja, kokoomateos, konferenssijulkaisu tai lehden erikoisnumero",
    "D1": "Artikkeli ammattilehdessä",
    "D2": "Artikkeli ammatillisessa kokoomateoksessa",
    "D3": "Artikkeli ammatillisessa konferenssijulkaisussa",
    "E1": "Yleistajuinen artikkeli, sanomalehtiartikkeli",
    "E2": "Yleistajuinen monografia",
    "G4": "Väitöskirja (artikkeli)",
    "G5": "Väitöskirja (monografia)"
};

function normalizeOpenAccess(value, selfArchivedCode) {
    if (typeof value === "boolean") return value ? 1 : 0;
    if (typeof value === "number") return value > 0 ? 1 : 0;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["1", "true", "yes", "oa", "open"].includes(normalized)) return 1;
        if (["0", "false", "no", "closed"].includes(normalized)) return 0;
    }
    if (Array.isArray(value)) {
        const hasOpen = value.some((item) => {
            const id = String(item?.id ?? "").trim().toLowerCase();
            const names = [
                item?.nameFi,
                item?.nameEn,
                item?.nameSv,
                item?.nameFiOpenAccess,
                item?.nameEnOpenAccess,
                item?.nameSvOpenAccess
            ].filter(Boolean).join(" ").toLowerCase();
            return id === "1" || names.includes("open access") || names.includes("avoin");
        });
        return hasOpen ? 1 : 0;
    }
    if (value && typeof value === "object") {
        return normalizeOpenAccess(
            value.id ?? value.code ?? value.value ?? value.status ?? value.nameEn ?? value.nameFi,
            selfArchivedCode
        );
    }
    if (selfArchivedCode === "1" || selfArchivedCode === 1) return 1;
    return 0;
}

function normalizePeerReviewed(value, typeCode) {
    // Julkaisuluokitus määrittää vertaisarvioinnin luotettavimmin.
    if (typeof typeCode === "string" && typeCode.length > 0) {
        if (typeCode.startsWith("A") || typeCode.startsWith("C") || typeCode === "G4" || typeCode === "G5") {
            return true;
        }
        if (typeCode.startsWith("B") || typeCode.startsWith("D") || typeCode.startsWith("E")) {
            return false;
        }
    }

    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (["1", "true", "yes", "peer-reviewed", "vertaisarvioitu"].includes(normalized)) return true;
        if (["0", "false", "no", "non-peer-reviewed", "ei vertaisarvioitu", "vertaisarvioimaton"].includes(normalized)) return false;
    }
    if (Array.isArray(value)) {
        return value.some(item => {
            const id = String(item?.id ?? "").trim();
            const names = [
                item?.nameFiPeerReviewed,
                item?.nameEnPeerReviewed,
                item?.nameSvPeerReviewed
            ].filter(Boolean).join(" ").toLowerCase();
            return id === "1" || names.includes("peer-reviewed") || names.includes("vertaisarvioitu");
        });
    }
    if (value && typeof value === "object") {
        return normalizePeerReviewed(
            value.id ?? value.code ?? value.value ?? value.nameEnPeerReviewed ?? value.nameFiPeerReviewed ?? value.nameEn ?? value.nameFi,
            typeCode
        );
    }

    return false;
}

function normalizeTypeCode(pub) {
    const candidates = [
        pub?.publicationTypeCode,
        pub?.typeCode,
        pub?.publicationType?.code,
        pub?.publicationType?.id,
        pub?.publicationType?.value,
        pub?.publicationType?.publicationTypeCode,
        pub?.publicationTypeCodeFi,
        pub?.publicationTypeCodeEn
    ];

    for (const candidate of candidates) {
        if (candidate === null || candidate === undefined) continue;
        const normalized = String(candidate).trim().toUpperCase();
        if (normalized) return normalized;
    }

    return "";
}

function normalizeKeywordText(value) {
    return String(value || "")
        .replace(/\s+/g, " ")
        .trim();
}

function splitKeywordString(value) {
    return String(value || "")
        .split(/[;,|]/g)
        .map(normalizeKeywordText)
        .filter(Boolean);
}

function collectKeywordLikeValue(value, targetSet) {
    if (value === null || value === undefined) return;

    if (typeof value === "string") {
        splitKeywordString(value).forEach((keyword) => targetSet.add(keyword));
        return;
    }

    if (Array.isArray(value)) {
        value.forEach((item) => collectKeywordLikeValue(item, targetSet));
        return;
    }

    if (typeof value === "object") {
        const directCandidates = [
            value.keyword,
            value.keywords,
            value.subject,
            value.subjects,
            value.topic,
            value.topics,
            value.value,
            value.name,
            value.label,
            value.text,
            value.nameFi,
            value.nameEn,
            value.nameSv
        ];
        directCandidates.forEach((candidate) => collectKeywordLikeValue(candidate, targetSet));
    }
}

function extractKeywords(pub) {
    const keywords = new Set();

    const directCandidates = [
        pub?.keywords,
        pub?.keyword,
        pub?.subjects,
        pub?.subject,
        pub?.topic,
        pub?.topics,
        pub?.researchKeywords,
        pub?.publicationKeywords,
        pub?.researchSubject,
        pub?.scienceKeywords,
        pub?.avainsanat,
        pub?.asiasanat
    ];
    directCandidates.forEach((candidate) => collectKeywordLikeValue(candidate, keywords));

    const queue = [pub];
    while (queue.length) {
        const current = queue.shift();
        if (!current || typeof current !== "object") continue;
        if (Array.isArray(current)) {
            current.forEach((item) => queue.push(item));
            continue;
        }
        for (const [key, value] of Object.entries(current)) {
            if (/(keyword|subject|topic|tag|avainsana|asiasana)/i.test(key)) {
                collectKeywordLikeValue(value, keywords);
            } else if (value && typeof value === "object") {
                queue.push(value);
            }
        }
    }

    return Array.from(keywords)
        .map(normalizeKeywordText)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "fi"));
}

// ---------------------------------------------------------------------------
// CrossRef-rikastus: volyymi, numero, sivut, kustantaja, ISBN
// ---------------------------------------------------------------------------

async function fetchCrossrefMeta(doi) {
    const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
    try {
        const res = await fetchWithTimeout(url, {
            headers: {
                // Polite pool: tunnistautuminen sähköpostilla -> korkeampi rate limit
                "User-Agent": "jarilaru.fi/2.0 (mailto:jari.laru@oulu.fi; academic site)"
            }
        }, 10000);
        if (!res.ok) return null;
        const data = await res.json();
        const msg = data?.message;
        if (!msg) return null;
        return {
            volume: msg.volume || null,
            issue: msg.issue || null,
            pages: msg.page || null,
            articleNumber: msg["article-number"] || null,
            publisher: msg.publisher || null,
            isbn: (msg.ISBN || [])[0] || null,
            issn: (msg.ISSN || [])[0] || null,
            containerTitle: (msg["container-title"] || [])[0] || null,
        };
    } catch {
        return null;
    }
}

async function enrichWithCrossref(publications) {
    const freshCrossref = readCacheIfFresh(CROSSREF_CACHE_KEY, CROSSREF_CACHE_TTL_HOURS);
    let crossrefMap = freshCrossref?.data || null;

    if (!crossrefMap) {
        // Lataa vanha cache – täydennetään siitä
        const oldCache = readCache(CROSSREF_CACHE_KEY);
        crossrefMap = oldCache?.data || {};

        const dois = [...new Set(
            publications.map(p => p.doi).filter(Boolean).map(d => d.toLowerCase())
        )];
        const toFetch = dois.filter(doi => !crossrefMap[doi]);

        if (toFetch.length > 0) {
            console.log(`[crossref] Haetaan ${toFetch.length} DOI-metatietoa CrossRefista...`);
            for (const doi of toFetch) {
                const meta = await fetchCrossrefMeta(doi);
                crossrefMap[doi] = meta || {};
                // Polite pool: max ~5 pyyntöä/s
                await new Promise(r => setTimeout(r, 210));
            }
            console.log(`[crossref] Valmis. Yhteensä ${Object.keys(crossrefMap).length} DOI cachessa.`);
        } else {
            console.log(`[crossref] Kaikki ${dois.length} DOI:ta löytyvät välimuistista.`);
        }

        writeCache(CROSSREF_CACHE_KEY, crossrefMap);
    } else {
        console.log(`[crossref] Käytetään tuoretta välimuistia (${freshCrossref.savedAt}).`);
    }

    // Liitetään CrossRef-kenttät julkaisuihin
    return publications.map(p => {
        if (!p.doi) return p;
        const meta = crossrefMap[p.doi.toLowerCase()];
        if (!meta) return p;
        return {
            ...p,
            volume: meta.volume || null,
            issue: meta.issue || null,
            pages: meta.pages || null,
            articleNumber: meta.articleNumber || null,
            publisher: meta.publisher || null,
            isbn: meta.isbn || null,
            issn: meta.issn || null,
        };
    });
}

// ---------------------------------------------------------------------------
// JUFO-rikastus: julkaisutason haku Julkaisufoorumin REST-API:sta
// Strategia: ISSN → /etsi.php → Jufo_ID → /kanava/{id} → Level
// ---------------------------------------------------------------------------

async function fetchJufoByIssn(issn) {
    // Normalisoidaan ISSN: poistetaan tyhjät, varmistetaan viiva-formaatti (1234-5678)
    const normalized = issn.trim().replace(/[^0-9X]/gi, "").replace(/^(.{4})(.+)$/, "$1-$2");
    const searchUrl = `${JUFO_BASE}/etsi.php?issn=${encodeURIComponent(normalized)}&tyyppi=1`;
    try {
        const res = await fetchWithTimeout(searchUrl, { headers: JUFO_HEADERS }, 8000);
        if (!res.ok) return null;
        const results = await res.json();
        if (!Array.isArray(results) || results.length === 0) return null;
        // Haetaan kanavan tiedot Jufo_ID:llä
        const jufoId = results[0].Jufo_ID;
        const channelUrl = `${JUFO_BASE}/kanava/${jufoId}`;
        const channelRes = await fetchWithTimeout(channelUrl, { headers: JUFO_HEADERS }, 8000);
        if (!channelRes.ok) return null;
        const channelData = await channelRes.json();
        // API palauttaa taulukon myös yksittäiselle kanavalle
        const ch = Array.isArray(channelData) ? channelData[0] : channelData;
        if (!ch) return null;
        return {
            level: ch.Level != null ? String(ch.Level) : null,
            jufoId,
            jufoName: ch.Name || null,
        };
    } catch {
        return null;
    }
}

async function enrichWithJufo(publications) {
    const fresh = readCacheIfFresh(JUFO_CACHE_KEY, JUFO_CACHE_TTL_HOURS);
    let jufoMap = fresh?.data || null;

    if (!jufoMap) {
        const old = readCache(JUFO_CACHE_KEY);
        jufoMap = old?.data || {};

        // Kerää uniikit ISSNt julkaisuista (CrossRef on jo rikastuttanut ne)
        const issns = [...new Set(
            publications.map(p => p.issn).filter(Boolean)
        )];
        // Hae vain ne jotka eivät vielä ole cachessa (null = "haettu, ei löydy")
        const toFetch = issns.filter(issn => !(issn in jufoMap));

        if (toFetch.length > 0) {
            console.log(`[jufo] Haetaan ${toFetch.length} ISSN:n JUFO-taso...`);
            for (const issn of toFetch) {
                jufoMap[issn] = await fetchJufoByIssn(issn); // null = ei löydy
                await new Promise(r => setTimeout(r, 350)); // ~3 req/s
            }
            const found = Object.values(jufoMap).filter(v => v && v.level != null).length;
            console.log(`[jufo] Valmis. Löydettiin taso ${found}/${Object.keys(jufoMap).length} kanavasta.`);
        } else {
            console.log(`[jufo] Kaikki ${issns.length} ISSN:ää välimuistissa.`);
        }

        writeCache(JUFO_CACHE_KEY, jufoMap);
    } else {
        console.log(`[jufo] Käytetään tuoretta välimuistia (${fresh.savedAt}).`);
    }

    return publications
        .map(p => {
            if (!p.issn) return p;
            const meta = jufoMap[p.issn];
            if (!meta) return p;
            return { ...p, jufoLevel: meta.level, jufoId: meta.jufoId };
        })
        .sort((a, b) => (b.year || 0) - (a.year || 0));
}

// ---------------------------------------------------------------------------

function normalizePublication(pub) {
    const typeCode = normalizeTypeCode(pub);
    const doi = pub.doi || null;

    return {
        title: pub.publicationName || pub.title || "Ei otsikkoa",
        authors: pub.authorsText || pub.authors || "",
        year: pub.publicationYear || pub.year || null,
        journal: pub.journalName || pub.parentPublicationName || pub.journal || null,
        doi,
        doiUrl: doi ? `https://doi.org/${doi}` : null,
        url: pub.url || (doi ? `https://doi.org/${doi}` : null),
        typeCode,
        typeFi: typeMap[typeCode] || pub.typeFi || typeCode || "Muu julkaisu",
        typeShort: typeCode,
        peerReviewed: normalizePeerReviewed(pub.peerReviewed, typeCode),
        openAccess: normalizeOpenAccess(pub.openAccess, pub.selfArchivedCode),
        publicationId: pub.publicationId || null,
        keywords: extractKeywords(pub)
    };
}

module.exports = async function () {
    const hidden = loadHiddenIds('researchfi');
    const applyCuration = (pubs) => pubs.filter((p) => !hidden.has(String(p.publicationId)));

    const orcidId = process.env.ORCID_ID || "0000-0003-0347-0182";

    const fresh = readCacheIfFresh(CACHE_KEY, CACHE_TTL_HOURS);
    if (fresh?.data) {
        const freshPubs = fresh.data.map(normalizePublication);
        console.log(`Research.fi: käytetään tuoretta välimuistia (${fresh.savedAt}), ${freshPubs.length} julkaisua.`);
        return enrichWithJufo(await enrichWithCrossref(applyCuration(freshPubs)));
    }

    const cached = readCache(CACHE_KEY);
    const cachedPublications = cached?.data ? cached.data.map(normalizePublication) : null;

    // Research.fi portal API (Elasticsearch)
    const apiUrl = "https://researchfi-api-production.2.rahtiapp.fi/portalapi/person/_search";

    const requestBody = JSON.stringify({
        query: {
            match_phrase: {
                id: orcidId
            }
        },
        size: 1
    });

    try {
        console.log("Haetaan julkaisuja Research.fi:stä...");

        // eleventy-fetch ei tue POST-kutsuja suoraan, käytetään node-fetch
        const response = await fetchWithTimeout(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": "https://research.fi",
                "Referer": "https://research.fi/"
            },
            body: requestBody
        }, 15000);

        if (!response.ok) {
            console.error(`Research.fi API palautti virheen: ${response.status}`);
            if (cachedPublications) {
                console.warn(`Research.fi: käytetään välimuistia (${cached.savedAt}).`);
                return cachedPublications;
            }
            return [];
        }

        const data = await response.json();

        // Tarkista vastaus
        const hits = data?.hits?.hits;
        if (!hits || hits.length === 0) {
            console.error("Research.fi: henkilöä ei löytynyt.");
            if (cachedPublications) {
                console.warn(`Research.fi: käytetään välimuistia (${cached.savedAt}).`);
                return cachedPublications;
            }
            return [];
        }

        const person = hits[0]._source;
        const rawPubs = person?.activity?.publications || [];

        // Parsitaan ja järjestetään
        const publications = rawPubs.map(normalizePublication);

        // Uusimmat ensin
        publications.sort((a, b) => (b.year || 0) - (a.year || 0));

        if (rawPubs.length > 0) {
            // Säilytetään raakadata välimuistissa, jotta myös myöhemmin löydetyt kentät
            // (esim. avainsanat) voidaan normalisoida ilman uutta API-kutsua.
            writeCache(CACHE_KEY, rawPubs);
        } else if (cachedPublications) {
            console.warn(`Research.fi palautti tyhjän listan, käytetään välimuistia (${cached.savedAt}).`);
            return cachedPublications;
        }

        console.log(`Löydettiin ${publications.length} Research.fi-julkaisua.`);
        return enrichWithJufo(await enrichWithCrossref(applyCuration(publications)));

    } catch (error) {
        console.error("Research.fi API haku epäonnistui:", error.message);
        if (cachedPublications) {
            console.warn(`Research.fi: käytetään välimuistia (${cached.savedAt}).`);
            return enrichWithJufo(await enrichWithCrossref(applyCuration(cachedPublications)));
        }
        return [];
    }
};

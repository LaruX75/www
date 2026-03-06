require('dotenv').config();
const { readCache, writeCache } = require("./_apiCache");

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
        if (["0", "false", "no"].includes(normalized)) return false;
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

    return false;
}

function normalizePublication(pub) {
    const typeCode = pub.publicationTypeCode || pub.typeCode || "";
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
        publicationId: pub.publicationId || null
    };
}

module.exports = async function () {
    const orcidId = process.env.ORCID_ID || "0000-0003-0347-0182";
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
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": "https://research.fi",
                "Referer": "https://research.fi/"
            },
            body: requestBody
        });

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

        if (publications.length > 0) {
            writeCache(CACHE_KEY, publications);
        } else if (cachedPublications) {
            console.warn(`Research.fi palautti tyhjän listan, käytetään välimuistia (${cached.savedAt}).`);
            return cachedPublications;
        }

        console.log(`Löydettiin ${publications.length} Research.fi-julkaisua.`);
        return publications;

    } catch (error) {
        console.error("Research.fi API haku epäonnistui:", error.message);
        if (cachedPublications) {
            console.warn(`Research.fi: käytetään välimuistia (${cached.savedAt}).`);
            return cachedPublications;
        }
        return [];
    }
};

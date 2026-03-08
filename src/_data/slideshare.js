const cheerio = require("cheerio");
const { readCache, writeCache } = require("./_apiCache");

const CACHE_KEY = "slideshare-presentations-v1";
const PROFILE_URL = "https://www.slideshare.net/larux";
const FALLBACK_ROWS = [
  {
    id: "228552429",
    title: "Digital Enabled Learning - Arctic Frontiers speech 2020",
    thumbnail: "/img/slideshare/228552429.png",
    url: "https://www.slideshare.net/slideshow/digital-enabled-learning-arctic-frontiers-speech-2020/228552429"
  },
  {
    id: "149380656",
    title: "Educational robotics in Finland 2019",
    thumbnail: "/img/slideshare/149380656.png",
    url: "https://www.slideshare.net/slideshow/educational-robotics-in-finland-2019/149380656"
  },
  {
    id: "148128991",
    title: "Robotiikka ja tekoäly oppimisen tukena - uhka vai mahdollisuus (itk2019)",
    thumbnail: "/img/slideshare/148128991.png",
    url: "https://www.slideshare.net/slideshow/robotiikka-ja-tekoily-oppimisen-tukena-uhka-vai-mahdollisuus-itk2019/148128991"
  },
  {
    id: "146730753",
    title: "Kuulumisia opetuksen ja oppimisen digitalisaatiosta: mobiilioppimista, robotiikkaa ja tekoälyä (Raksilan lukio 2019)",
    thumbnail: "/img/slideshare/146730753.png",
    url: "https://www.slideshare.net/slideshow/kuulumisia-opetuksen-ja-oppimisen-digitalisaatiosta-mobiilioppimista-robotiikkaa-ja-tekoily-raksilan-lukio-2019/146730753"
  },
  {
    id: "140995534",
    title: "Digitalisaatio osaksi opettajakoulutusta - case kokeileva ja kehittävä luma-opettaja",
    thumbnail: "/img/slideshare/140995534.png",
    url: "https://www.slideshare.net/slideshow/digitalisaatio-osaksi-opettajakoulutusta-case-kokeileva-ja-kehittv-lumaopettaja/140995534"
  },
  {
    id: "137666039",
    title: "Digitaaliset välineet opetuksessa ja oppimisessa opettajankoulutuksen kontekstissa - tasapainoilua tulevaisuuden mahdollisuuksien ja teknologian opetuskäytön arkirealismin välillä (itk2019)",
    thumbnail: "/img/slideshare/137666039.png",
    url: "https://www.slideshare.net/slideshow/digitaaliset-vlineet-opetuksessa-ja-oppimisessa-opettajankoulutuksen-kontekstissa-tasapainoilua-tulevaisuuden-mahdollisuuksien-ja-teknologian-opetuskytn-arkirealismin-vlill/137666039"
  },
  {
    id: "137649224",
    title: "Digitaalisen oppimisen välineitä yhdessä kehittämässä - varhainen omaksuja, uhka vai mahdollisuus tietohallinnolle?",
    thumbnail: "/img/slideshare/137649224.png",
    url: "https://www.slideshare.net/slideshow/digitaalisen-oppimisen-vlineit-yhdess-kehittmss-varhainen-omaksuja-uhka-vai-mahdollisuus-tietohallinnolle-137649224/137649224"
  },
  {
    id: "135625316",
    title: "Are we currently moving from the age of mobilism to age of artificial intelligence, learning analytics and robotics?",
    thumbnail: "/img/slideshare/135625316.png",
    url: "https://www.slideshare.net/slideshow/are-we-currently-moving-from-the-age-of-mobilism-to-age-of-artificial-intelligence-learning-analytics-and-robotics-yes-we-arehow-to-couple-emergent-technology-with-learning-and-teaching/135625316"
  },
  {
    id: "129224523",
    title: "PREDICTING FUTURE OF EDTECH 2030 v2",
    thumbnail: "/img/slideshare/129224523.png",
    url: "https://www.slideshare.net/slideshow/predicting-future-of-edtech-2030-v2/129224523"
  },
  {
    id: "122776081",
    title: "Varhainen omaksuja, uhka vai mahdollisuus tietohallinnolle? (2018)",
    thumbnail: "/img/slideshare/122776081.png",
    url: "https://www.slideshare.net/slideshow/digitaalisen-oppimisen-vlineit-yhdess-kehittmss-varhainen-omaksuja-uhka-vai-mahdollisuus-tietohallinnolle/122776081"
  }
];

function isPresentationRow(item) {
  return (
    item &&
    typeof item === "object" &&
    (item.canonicalUrl || item.id) &&
    typeof item.title === "string"
  );
}

function findPresentationArray(node) {
  if (!node || typeof node !== "object") return null;

  if (Array.isArray(node)) {
    if (node.length > 0 && node.every(isPresentationRow)) {
      return node;
    }

    for (const item of node) {
      const found = findPresentationArray(item);
      if (found) return found;
    }
    return null;
  }

  for (const value of Object.values(node)) {
    const found = findPresentationArray(value);
    if (found) return found;
  }

  return null;
}

function normalizeRow(item) {
  const url =
    item.canonicalUrl ||
    item.url ||
    (item.id ? `https://www.slideshare.net/slideshow/${item.id}/${item.id}` : null);

  return {
    id: String(item.id || ""),
    title: item.title || "Untitled SlideShare",
    thumbnail: item.thumbnail || null,
    url,
    author: item?.user?.name || "Jari Laru",
    views: Number(item.viewCount || 0)
  };
}

async function fetchSlideshareRows() {
  const response = await fetch(PROFILE_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Eleventy build bot)",
      Accept: "text/html,application/xhtml+xml"
    }
  });

  if (!response.ok) {
    throw new Error(`SlideShare fetch failed (${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const nextDataRaw = $("#__NEXT_DATA__").text();

  if (!nextDataRaw) {
    throw new Error("SlideShare next data payload missing");
  }

  const nextData = JSON.parse(nextDataRaw);
  const presentations = findPresentationArray(nextData?.props?.pageProps || nextData);

  if (!Array.isArray(presentations) || presentations.length === 0) {
    throw new Error("SlideShare presentations not found in payload");
  }

  return presentations.map(normalizeRow).filter((item) => item.id && item.url);
}

module.exports = async function () {
  const cached = readCache(CACHE_KEY);
  const cachedRows = Array.isArray(cached?.data) ? cached.data : [];
  const maxItems = Number(process.env.SLIDESHARE_LIMIT || 24);

  try {
    const rows = await fetchSlideshareRows();
    writeCache(CACHE_KEY, rows);
    return rows.slice(0, maxItems);
  } catch (error) {
    if (cachedRows.length) {
      console.warn(`SlideShare: live fetch failed, using cache (${cached.savedAt}): ${error.message}`);
      return cachedRows.slice(0, maxItems);
    }

    console.warn(`SlideShare: live fetch failed, using static fallback: ${error.message}`);
    return FALLBACK_ROWS.slice(0, maxItems);
  }
};

const english = require('../_data/pageTranslations/en.json');

// Only public landing-page routes are translated. Original articles,
// presentations, course materials and external sources keep their URLs.
const routes = {
  '/': '/en/', '/blogi/': '/en/blog/', '/sidonnaisuudet/': '/en/affiliations/', '/tietoa/': '/en/about/',
  '/tyoni-yliopistonlehtorina/': '/en/work/', '/opetus/': '/en/teaching/',
  '/portfolio/': '/en/portfolio/', '/cv/': '/en/cv/', '/tutkimus/': '/en/research/',
  '/vaitoskirja/': '/en/dissertation/', '/julkaisut/': '/en/publications/',
  '/opinnaytteet/': '/en/theses/', '/esitykset/': '/en/presentations/',
  '/yhteiskunnallinen-vuorovaikutus/': '/en/societal-engagement/',
  '/kouluttaja/': '/en/company/', '/politiikka/': '/en/politics/',
  '/politiikka/vaalikaudet/': '/en/election-history/',
  '/poliittinen-avoimuus/': '/en/affiliations/', '/kynasta/': '/en/kynasta/',
  '/kirjoitukset/': '/en/writings/', '/valtuustotyo/': '/en/council-work/',
  '/lausunnot/': '/en/statements/', '/mediassa/': '/en/media/',
  '/yhteystiedot/': '/en/contact/', '/palkinnot/': '/en/awards/',
  '/autolomat/': '/en/road-trips/', '/haku/': '/en/search/',
  '/teemat/': '/en/topics/', '/kategoriat/': '/en/categories/', '/avainsanat/': '/en/keywords/',
  '/opiskelijoiden-antamaa-palautetta/': '/en/student-feedback/',
  '/koulutuspalaute/': '/en/training-feedback/',
  '/politiikka/kaupunginvaltuusto/': '/en/politics/city-council/',
  '/politiikka/sivistyslautakunta/': '/en/politics/education-committee/'
};

function pageText(value, lang) {
  if (lang !== 'en' || typeof value !== 'string') return value;
  const key = value.trim().replace(/\s+/g, ' ');
  return Object.hasOwn(english, key) ? value.replace(value.trim(), english[key]) : value;
}

function localeUrl(value, lang) {
  if (lang !== 'en' || typeof value !== 'string') return value;
  const match = value.match(/^(https:\/\/www\.jarilaru\.fi)?(\/[^?#]*)([?#].*)?$/);
  if (!match) return value;
  const translated = routes[match[2]] || (match[2].startsWith('/teemat/') ? match[2].replace('/teemat/', '/en/topics/') : null);
  return translated ? translated + (match[3] || '') : value;
}

// Use only on editorial display data, never on canonical content identities.
function localizeCopy(value, lang) {
  if (lang !== 'en') return value;
  if (Array.isArray(value)) return value.map(item => localizeCopy(item, lang));
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    const identityKeys = new Set(['id', 'key', 'value', 'slug', 'category', 'source', 'sourceKey', 'sourceUrl', 'type', 'contentType', 'lang', 'icon', 'filter', 'categories', 'keywords', 'contexts', 'researchThemes']);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, identityKeys.has(key) ? item : localizeCopy(item, lang)]));
  }
  return typeof value === 'string' ? localeUrl(pageText(value, lang), lang) : value;
}

module.exports = { pageText, localeUrl, localizeCopy, routes };

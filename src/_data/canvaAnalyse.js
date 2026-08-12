/**
 * Global-data-loaderi Canva-analyysille.
 *
 * Wrappaa src/_data/canva-analyse.json:in (yhdysmerkki tiedostonimessä olisi
 * Nunjucks-käytössä hankala). Templateissa saatavilla nimellä `canvaAnalyse`.
 *
 * Lähde: scripts/canva/04-analyse.mjs (Vaihe 4). Sisältää coverage-, stats-,
 * kaudet-, punaisetLangat-, aihepiirit-, laajimmat-, kielet-, vertailuSlideShare-
 * ja hypoteesiKehitys-osiot.
 *
 * Fallback: tyhjä objekti jos JSON puuttuu → template ei kaadu.
 */

const fs = require("fs");
const path = require("path");

const JSON_FILE = path.join(__dirname, "canva-analyse.json");

module.exports = function () {
  if (!fs.existsSync(JSON_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(JSON_FILE, "utf8"));
  } catch (e) {
    console.warn(`[canvaAnalyse] JSON:in luku epäonnistui: ${e.message} — fallback {}`);
    return {};
  }
};

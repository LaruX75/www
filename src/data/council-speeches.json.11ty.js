/**
 * /data/council-speeches.json — valtuustopuheenvuorot.
 *
 * Kayttaa olemassa olevaa collections.pub_puhe_valtuusto -collectionia
 * jotta ei rakenneta uutta luokittelua. Sama data mika nakyy
 * /valtuustotyo/#puheet ja /kirjoitukset/-suodattimissa.
 *
 * ENRICHED-versio: itemien mukana kulkee build-time computed lookup-data
 * jota valtuustotyo.njk:n puheet-taulukko tarvitsee: meetingLabel,
 * meetingNumber, protocolUrl, councilVideos, resolvedEvent/asiakohta
 * (jotka voivat tulla oukaCouncilSpeechProtocols.overrides:sta pub.data:n
 * sijaan).
 *
 * VALTUUSTOTYO-SSR-01: enrichment logic extracted into single-owner
 * `src/_utils/councilEnrichment.js` so the SSR projection and this
 * public-JSON producer emit byte-identical enriched records.
 */

const { serializeItems, jsonWrap, JSON_SCHEMA_VERSION } = require("./_shared");
const councilMeetingMeta = require("../_data/councilMeetingMeta");
const oukaCouncilSpeechProtocols = require("../_data/oukaCouncilSpeechProtocols");
const councilSpeechVideos = require("../_data/councilSpeechVideos.json");
const { enrichCouncilSpeech } = require("../_utils/councilEnrichment");

module.exports = class {
  data() {
    return {
      permalink: "/data/council-speeches.json",
      eleventyExcludeFromCollections: true,
      layout: false
    };
  }

  render(data) {
    const items = data.collections.pub_puhe_valtuusto || [];
    // Serialisoi ensin standardi-serialiserilla, sitten enrich:aa
    // computed council-metallä.
    const baseRecords = serializeItems(items);
    const itemByUrl = new Map(items.map(i => [i.url, i]));
    const enriched = baseRecords.map(record => {
      const originalItem = itemByUrl.get(record.url);
      if (!originalItem) return record;
      return enrichCouncilSpeech(record, originalItem, {
        councilMeetingMeta,
        oukaCouncilSpeechProtocols,
        councilSpeechVideos
      });
    });
    return jsonWrap(enriched);
  }
};

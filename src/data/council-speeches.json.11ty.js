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
 */

const { serializeItems, jsonWrap, JSON_SCHEMA_VERSION } = require("./_shared");
const councilMeetingMeta = require("../_data/councilMeetingMeta");
const oukaCouncilSpeechProtocols = require("../_data/oukaCouncilSpeechProtocols");
const councilSpeechVideos = require("../_data/councilSpeechVideos.json");

function isoDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function enrichWithCouncilMeta(record, item) {
  const data = item?.data || {};
  const resolvedUrl = data.url || record.url || item?.url || "";
  const override = oukaCouncilSpeechProtocols.overrides?.[resolvedUrl] || {};
  const resolvedEvent = override.event || data.event || "";
  const resolvedAsiakohta = override.asiakohta || data.asiakohta || "";

  const publicationDate = isoDate(item?.date);
  const declaredMeetingDate = isoDate(data.meetingDate || override.meetingDate || item?.date);
  const publicationMeetingMeta = councilMeetingMeta.byDate?.[publicationDate] || {};
  const meetingDate = publicationMeetingMeta.timelineTitle && publicationDate
    ? publicationDate
    : declaredMeetingDate;
  const meetingMeta = councilMeetingMeta.byDate?.[meetingDate] || {};

  const protocolUrl = override.protocolUrl
    || (resolvedEvent === "Oulun kaupunginvaltuusto"
      ? (oukaCouncilSpeechProtocols.protocolsByDate?.[meetingDate] || "")
      : "");

  const councilVideos = councilSpeechVideos.byUrl?.[resolvedUrl]
    || councilSpeechVideos.byUrl?.[data.source_url]
    || [];

  // Palauta enriched record — sailyta kaikki alkuperaiset kentat
  // ja kirjoita ylle event/asiakohta jos override antaa uuden arvon.
  return {
    ...record,
    event: resolvedEvent || record.event,
    asiakohta: resolvedAsiakohta || record.asiakohta,
    meetingDate: meetingDate || record.meetingDate,
    meetingNumber: meetingMeta.meetingNumber || "",
    meetingLabel: meetingMeta.meetingNumber || meetingMeta.timelineTitle || "",
    protocolUrl: protocolUrl || "",
    councilVideos: Array.isArray(councilVideos) ? councilVideos : []
  };
}

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
      return originalItem ? enrichWithCouncilMeta(record, originalItem) : record;
    });
    return jsonWrap(enriched);
  }
};

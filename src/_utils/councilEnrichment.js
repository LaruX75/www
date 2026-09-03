"use strict";

/**
 * councilEnrichment — canonical single-owner meeting/protocol/video
 * enrichment for Oulu city council speeches (VALTUUSTOTYO-SSR-01).
 *
 * Extracted from `src/data/council-speeches.json.11ty.js:27-63` so
 * both the public JSON producer and the SSR projection
 * (`src/_utils/valtuustotyoPage.js`) can compute identical enriched
 * records without duplicating the lookup logic.
 *
 * Inputs (canonical Eleventy data files):
 *   - councilMeetingMeta.byDate       — meeting number + timeline title
 *   - oukaCouncilSpeechProtocols       — event/asiakohta overrides + protocolsByDate
 *   - councilSpeechVideos.byUrl        — YouTube video timestamps
 *
 * Output: enriched fields merged onto a base record —
 *   { event, asiakohta, meetingDate, meetingNumber, meetingLabel,
 *     protocolUrl, councilVideos }
 *
 * Callers may pass EITHER:
 *   (record, item)  — record is a serialized public-JSON row + item
 *                     is the raw Eleventy collection item (needed for
 *                     item.date + item.data.source_url fallbacks)
 *   OR
 *   (null, item)    — SSR projection path: derive record shape from
 *                     item.data directly
 */

function isoDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function enrichCouncilSpeech(
  record,
  item,
  { councilMeetingMeta, oukaCouncilSpeechProtocols, councilSpeechVideos } = {}
) {
  const data = item?.data || {};
  const baseRecord = record || {
    url: item?.url || "",
    title: data.title || "",
    date: isoDate(item?.date),
    description: data.description || "",
    categories: data.categories || [],
    keywords: data.keywords || [],
    event: data.event || "",
    asiakohta: data.asiakohta || "",
    meetingDate: data.meetingDate || null,
    source_url: data.source_url || null
  };

  const resolvedUrl = data.url || baseRecord.url || item?.url || "";
  const override = oukaCouncilSpeechProtocols?.overrides?.[resolvedUrl] || {};
  const resolvedEvent = override.event || data.event || "";
  const resolvedAsiakohta = override.asiakohta || data.asiakohta || "";

  const publicationDate = isoDate(item?.date);
  const declaredMeetingDate = isoDate(
    data.meetingDate || override.meetingDate || item?.date
  );
  const publicationMeetingMeta =
    councilMeetingMeta?.byDate?.[publicationDate] || {};
  const meetingDate =
    publicationMeetingMeta.timelineTitle && publicationDate
      ? publicationDate
      : declaredMeetingDate;
  const meetingMeta = councilMeetingMeta?.byDate?.[meetingDate] || {};

  const protocolUrl =
    override.protocolUrl ||
    (resolvedEvent === "Oulun kaupunginvaltuusto"
      ? oukaCouncilSpeechProtocols?.protocolsByDate?.[meetingDate] || ""
      : "");

  const councilVideos =
    councilSpeechVideos?.byUrl?.[resolvedUrl] ||
    councilSpeechVideos?.byUrl?.[data.source_url] ||
    baseRecord.source_url && councilSpeechVideos?.byUrl?.[baseRecord.source_url] ||
    [];

  return {
    ...baseRecord,
    event: resolvedEvent || baseRecord.event,
    asiakohta: resolvedAsiakohta || baseRecord.asiakohta,
    meetingDate: meetingDate || baseRecord.meetingDate,
    meetingNumber: meetingMeta.meetingNumber || "",
    meetingLabel: meetingMeta.meetingNumber || meetingMeta.timelineTitle || "",
    protocolUrl: protocolUrl || "",
    councilVideos: Array.isArray(councilVideos) ? councilVideos : []
  };
}

module.exports = {
  enrichCouncilSpeech,
  isoDate
};

const buildMeetings = require("./educationCommitteeMeetings");

const SEASONS = [
  {
    key: "sivistyslautakunta-2025-2029",
    title: "Sivistyslautakunta 2025-2029",
    bodyName: "Sivistyslautakunta",
    period: "2025-2029",
    start: "2025-06-01",
    end: "2029-05-31",
    bodyKey: "sivistyslautakunta",
    description: "Nykyisellä kaudella sivistyslautakunnan toimialaan kuuluvat varhaiskasvatus, perusopetus- ja nuorisopalvelut sekä lukiokoulutus, vapaa sivistystyö ja taiteen perusopetus."
  },
  {
    key: "sivistyslautakunta-2023-2025",
    title: "Sivistyslautakunta 2023-2025",
    bodyName: "Sivistyslautakunta",
    period: "2023-2025",
    start: "2023-01-01",
    end: "2025-05-31",
    bodyKey: "sivistyslautakunta",
    description: "Valtuustokauden 2021-2025 loppupuolella lautakuntarakennetta muutettiin. Sivistyslautakunnalle jäivät varhaiskasvatus, perusopetus- ja nuorisopalvelut sekä lukiokoulutus, vapaa sivistystyö ja taiteen perusopetus."
  },
  {
    key: "siku-2021-2022",
    title: "Sivistys- ja kulttuurilautakunta 2021-2022",
    bodyName: "Sivistys- ja kulttuurilautakunta",
    period: "2021-2022",
    start: "2021-08-01",
    end: "2022-12-31",
    bodyKey: "sivistys-ja-kulttuurilautakunta",
    description: "Vuoden 2021 vaalien jälkeen sivistys- ja kulttuurilautakunta vastasi vielä laajasta kokonaisuudesta: varhaiskasvatuksesta, perusopetuksesta ja nuorisopalveluista, lukiokoulutuksesta, vapaasta sivistystyöstä ja taiteen perusopetuksesta sekä kulttuuri-, liikunta- ja vapaa-ajanpalveluista."
  },
  {
    key: "siku-2017-2021",
    title: "Sivistys- ja kulttuurilautakunta 2017-2021",
    bodyName: "Sivistys- ja kulttuurilautakunta",
    period: "2017-2021",
    start: "2017-06-21",
    end: "2021-07-31",
    bodyKey: "sivistys-ja-kulttuurilautakunta",
    description: "Ensimmäinen lautakuntakauteni alkoi kesällä 2017. Toimialaan kuuluivat varhaiskasvatus, perusopetus- ja nuorisopalvelut, lukiokoulutus, vapaa sivistystyö ja taiteen perusopetus sekä kulttuuri-, liikunta- ja vapaa-ajanpalvelut."
  }
];

function isInSeason(meeting, season) {
  return meeting.bodyKey === season.bodyKey
    && meeting.date >= season.start
    && meeting.date <= season.end;
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.url || item.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

module.exports = function educationCommitteeMeetingSeasons() {
  const meetings = buildMeetings();
  const standaloneItems = typeof buildMeetings.standaloneCommitteeItems === "function"
    ? buildMeetings.standaloneCommitteeItems()
    : [];

  const seasons = SEASONS.map((season) => {
    const seasonMeetings = meetings
      .filter((meeting) => isInSeason(meeting, season));

    const meetingItems = seasonMeetings
        .flatMap((meeting) => meeting.items.map((item) => ({
          ...item,
          meetingDate: meeting.date,
          meetingLabel: meeting.meetingLabel,
          meetingUrl: `#kokous-${meeting.date}`
        })));

    const seasonStandaloneItems = standaloneItems
      .filter((item) => item.bodyKey === season.bodyKey)
      .filter((item) => item.seasonDate >= season.start && item.seasonDate <= season.end)
      .map((item) => ({
        ...item,
        meetingDate: "",
        meetingLabel: item.seasonLabel || "Taustasisältö",
        meetingUrl: ""
      }));

    const seasonItems = uniqueItems(
      meetingItems
        .concat(seasonStandaloneItems)
        .sort((a, b) => String(b.date || b.meetingDate).localeCompare(String(a.date || a.meetingDate)))
    );

    const ownContentCount = seasonMeetings.reduce((sum, meeting) => sum + meeting.items.length, 0);
    const agendaItemCount = seasonMeetings.reduce((sum, meeting) => (
      sum + (meeting.officialAgendaCount || meeting.agendaItems.length)
    ), 0);

    return {
      ...season,
      meetings: seasonMeetings,
      items: seasonItems,
      hasMeetingData: seasonMeetings.length > 0,
      counts: {
        meetings: seasonMeetings.length,
        ownContent: seasonItems.length || ownContentCount,
        agendaItems: agendaItemCount
      }
    };
  });

  seasons.allItems = uniqueItems(
    seasons
      .flatMap((season) => season.items.map((item) => ({
        ...item,
        seasonTitle: season.title,
        seasonPeriod: season.period
      })))
      .sort((a, b) => String(b.date || b.meetingDate).localeCompare(String(a.date || a.meetingDate)))
  );

  return seasons;
};

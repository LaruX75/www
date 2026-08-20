const cvData = require("./cv.json");
const researchProjects = require("./researchProjects");
const loadElectionHistory = require("./electionHistory");
const { buildHomeMilestones } = require("../_utils/homeMilestones");

const MILESTONE_DEFINITIONS = Object.freeze([
  {
    id: "bbs-1989",
    year: 1989,
    category: "tausta",
    title: "BBS-harrastus alkaa (Raahe)",
    description: "Commodore 64, modeemi, Large's Security BBS:n SysOp, Fidonet-solmu, ANSI-taide ja HTML-koodaus. Teknologiapolun alkupiste ennen nykyistä verkkoa.",
    href: "/1998/02/16/silloin-kun-sita-oltiin-larges-securityn-sysop-bbs-muisteluita/",
    phaseStart: {
      label: "1989–2001",
      title: "Tausta ja ensimmäiset askeleet",
      description: "Teknologiaharrastus ja ensimmäiset poliittiset avaukset."
    },
    companionFields: ["year", "title", "href", "description", "category", "phaseStart"],
    classification: "C",
    targetLabel: "BBS-muistelusivu",
    currentSourceState: "Legitimate homepage companion fact with related local memoir page."
  },
  {
    id: "politics-2000-raahe",
    year: 2000,
    category: "politiikka",
    title: "Vaalikausi 2001–2004 (Raahe)",
    description: "Ehdolla Raahen kuntavaaleissa 2000 Kansallisen Kokoomuksen listoilla; sijoittui koululautakunnan jäseneksi. Poliittisen uran alkupiste.",
    href: "/politiikka/vaalikaudet/",
    companionFields: ["year", "title", "href", "description", "category"],
    classification: "C",
    targetLabel: "Vaalikaudet",
    currentSourceState: "Pre-2013 political milestone remains a companion fact."
  },
  {
    id: "research-assistant-2002",
    sourceKey: "cv-prev-research-assistant",
    category: "tutkimus",
    description: "Ensimmäinen työtehtävä Oulun yliopistossa opetusteknologian tutkimusyksikössä (EDTECH). Tutkimusuran alkupiste.",
    phaseStart: {
      label: "2002–2012",
      title: "Väitöskirjatie: mobiilioppiminen ja CSCL",
      description: "Tutkimus mobiililaitteista ja yhteisöllisestä oppimisesta — juuret nykyiselle tekoälykasvatustyölle."
    },
    companionFields: ["description", "category", "phaseStart"],
    classification: "B/D",
    targetLabel: "CV",
    currentSourceState: "Year/title/route now reused from cv.json."
  },
  {
    id: "km-2003",
    sourceKey: "cv-education-km",
    category: "opetus",
    title: "KM ja pro gradu valmis",
    description: "Kasvatustieteiden maisteri (14.5.2003), teknologiapainotteinen luokanopettajakoulutus, Oulun yliopisto. Pro gradu \"Langattomat päätelaitteet hajautetun asiantuntijuuden ja yhteisöllisen tiedonrakentelun tukena\" (Goman & Laru).",
    href: "/tutkimus/#varhaisvaihe",
    companionFields: ["title", "description", "href", "category"],
    classification: "B/D",
    targetLabel: "Tutkimus / varhaisvaihe",
    currentSourceState: "Year reused from cv.json; editorial title and anchor stay companion-owned."
  },
  {
    id: "rotuaari-2003",
    sourceKey: "research-project-rotuaari",
    category: "tutkimus",
    description: "Osallistuin tutkimusavustajana TEKESin rahoittamaan Rotuaari-hankkeeseen (6/2003–5/2006) Oulun yliopistossa; mobiili- ja langaton oppimisteknologia kaupunkitilassa.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Tutkimus / hankkeet",
    currentSourceState: "Project identity now reused from researchProjects.js."
  },
  {
    id: "mosil-2004",
    sourceKey: "research-project-mosil",
    category: "tutkimus",
    description: "Mobile Support For Integrated Learning — eurooppalainen Kaleidoscope Network of Excellence -hanke mobiililaitteiden ja oppimisympäristöjen integraatiosta; oppimisen 'skriptit' formaalien ja epäformaalien tilojen välillä.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Tutkimus / hankkeet",
    currentSourceState: "Project identity now reused from researchProjects.js."
  },
  {
    id: "politics-2005-oulu",
    year: 2005,
    category: "politiikka",
    title: "Vaalikausi 2005–2008 (Oulu)",
    description: "Muutto Ouluun toi mukanaan uudet vaalit; ehdolla Oulun kunnallisvaaleissa Kansallisen Kokoomuksen listoilla.",
    href: "/politiikka/vaalikaudet/",
    companionFields: ["year", "title", "href", "description", "category"],
    classification: "C",
    targetLabel: "Vaalikaudet",
    currentSourceState: "Pre-2013 political milestone remains a companion fact."
  },
  {
    id: "grant-2005",
    sourceKey: "cv-grant-2005",
    category: "tutkimus",
    description: "Suomen Kulttuurirahaston Urpo ja Maijaliisa Harvan rahasto, 16 400 €. Tutkimussuunnitelman ja ensimmäisen artikkelikäsikirjoituksen laadinta EDTECH-yksikössä.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Tutkimus",
    currentSourceState: "Grant year/title/route now reused from cv.json."
  },
  {
    id: "doctoral-student-2006",
    sourceKey: "cv-prev-doctoral-student",
    category: "tutkimus",
    description: "Väitöskirjatyö käynnistyi Oppimisympäristöjen monitieteisen tutkijakoulun (OPMON) puitteissa 2006–2010.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "CV",
    currentSourceState: "Year/title/route now reused from cv.json."
  },
  {
    id: "politics-2008-kiiminki",
    year: 2008,
    category: "politiikka",
    title: "Vaalikausi 2009–2012 (Kiiminki)",
    description: "Ehdolla Kiimingin kuntavaaleissa 2008; sijoittui varavaltuutetuksi.",
    href: "/politiikka/vaalikaudet/",
    companionFields: ["year", "title", "href", "description", "category"],
    classification: "C",
    targetLabel: "Vaalikaudet",
    currentSourceState: "Pre-2013 political milestone remains a companion fact."
  },
  {
    id: "larux-2010",
    sourceKey: "cv-current-entrepreneurship",
    category: "opetus",
    description: "Sivutoiminen yrittäjyys alkaa: luennot, esitelmät, koulutukset sekä oppimisympäristöjen ja www-sivujen kehittäminen.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Kouluttaja",
    currentSourceState: "Entrepreneurship year/title/route now reused from cv.json."
  },
  {
    id: "grant-2010",
    sourceKey: "cv-grant-2010",
    category: "tutkimus",
    description: "Suomen Kulttuurirahaston Xerox Oy:n rahasto, 21 000 €. Apuraha väitöskirjan viimeistelyyn EDTECH-yksikössä.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Tutkimus",
    currentSourceState: "Grant year/title/route now reused from cv.json."
  },
  {
    id: "university-teacher-2011",
    sourceKey: "cv-prev-university-teacher",
    category: "opetus",
    description: "Ensimmäinen päätoiminen opetustehtävä Oulun yliopistossa (syyskuu 2011 – heinäkuu 2013): tieto- ja viestintäteknologian opetuskäytön yliopisto-opettaja.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "CV",
    currentSourceState: "Year/title/route now reused from cv.json."
  },
  {
    id: "dissertation-2012",
    sourceKey: "cv-education-dissertation",
    category: "tutkimus",
    title: "Väitöskirja: mobiili- ja yhteisöllinen oppiminen",
    description: "Väitös 21.11.2012 Oulun yliopistossa: \"Opiskelun tukeminen mobiililaitteiden ja pedagogisen vaiheistuksen avulla\".",
    companionFields: ["title", "description", "category"],
    classification: "B/D",
    targetLabel: "Väitöskirja",
    currentSourceState: "Year/route reused from cv.json; homepage title remains editorial."
  },
  {
    id: "teaching-award-2012",
    year: 2012,
    category: "opetus",
    title: "Opiskelijoiden tunnustus: Omena hyvälle opettajalle",
    description: "OYY:n LO11-B-ryhmä palkitsi opetuksesta luokanopettajakoulutuksessa.",
    href: "/palkinnot/",
    companionFields: ["year", "title", "href", "description", "category"],
    classification: "C",
    targetLabel: "Palkinnot",
    currentSourceState: "Award detail exists on the awards page, but there is no shared structured source yet."
  },
  {
    id: "election-term-2013-2017",
    sourceKey: "election-term-2013-2017",
    category: "politiikka",
    description: "Ehdolla Oulun kunnallisvaaleissa 2012; varavaltuutettu ja lähidemokratiatoimikunnan puheenjohtaja.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Vaalikaudet",
    currentSourceState: "Term period/year/route now reused from electionHistory."
  },
  {
    id: "university-lecturer-2013",
    sourceKey: "cv-current-university-lecturer",
    category: "opetus",
    description: "Toistaiseksi voimassaoleva tehtävä (elokuu 2013 alkaen): teknologiatuetun oppimisen ja opetuksen yliopistonlehtori, Kasvatustieteiden ja psykologian tiedekunta, Oulun yliopisto.",
    phaseStart: {
      label: "2013–2021",
      title: "Yliopistonlehtori ja avoin tiede",
      description: "Vakiintunut opetustyö luokanopettajakoulutuksessa. Avoimen tieteen ja digipedagogiikan edistäminen — TSV:n avoimen tieteen palkinto 2020."
    },
    companionFields: ["description", "category", "phaseStart"],
    classification: "B/D",
    targetLabel: "Työni yliopistonlehtorina",
    currentSourceState: "Year/title/route now reused from cv.json."
  },
  {
    id: "election-term-2017-2021",
    sourceKey: "election-term-2017-2021",
    category: "politiikka",
    description: "Kaupunginvaltuutettu ja sivistys- ja kulttuurilautakunnan jäsen. Työ sivistys- ja palveluverkkokysymyksissä syvenee.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Vaalikaudet",
    currentSourceState: "Term period/year/route now reused from electionHistory."
  },
  {
    id: "lea-2018",
    sourceKey: "research-project-lea",
    category: "tutkimus",
    description: "Learning Technology Accelerator — EU Horizon 2020 -rahoitteinen hanke oppimisteknologia-alan innovatiivisen julkisen hankinnan (PPI) verkoston rakentamiseksi Eurooppaan.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Tutkimus / hankkeet",
    currentSourceState: "Project identity now reused from researchProjects.js."
  },
  {
    id: "open-science-award-2020",
    year: 2020,
    category: "palkinto",
    title: "Kansallinen avoimen tieteen palkinto",
    description: "Tieteellisten seurain valtuuskunnan (TSV) tunnustus pitkäaikaisesta avoimuuden edistämisestä ja etäopetuksen tuesta koronapandemian aikana.",
    href: "/palkinnot/",
    companionFields: ["year", "title", "href", "description", "category"],
    classification: "C",
    targetLabel: "Palkinnot",
    currentSourceState: "Award detail exists on the awards page, but there is no shared structured source yet."
  },
  {
    id: "makect-2020",
    sourceKey: "research-project-makect",
    category: "tutkimus",
    description: "Assessing CT in Nordic Maker Education — Nordplus Horizontal -rahoitteinen pohjoismainen yhteistyöhanke laskennallisen ajattelun arvioinnista maker-kasvatuksessa.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Tutkimus / hankkeet",
    currentSourceState: "Project identity now reused from researchProjects.js."
  },
  {
    id: "election-term-2021-2025",
    sourceKey: "election-term-2021-2025",
    category: "politiikka",
    description: "Kaupunginvaltuutettu ja sivistys- ja kulttuurilautakunnan jäsen; myös maakuntavaltuuston jäsen.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Vaalikaudet",
    currentSourceState: "Term period/year/route now reused from electionHistory."
  },
  {
    id: "generation-ai-2022",
    sourceKey: "research-project-generation ai",
    category: "tutkimus",
    description: "Suomen Akatemian Strategisen tutkimuksen neuvoston (STN) rahoittama tekoälykasvatuksen tutkimusohjelma (lokakuu 2022–). Vuorovaikutusasiantuntijana tutkimustiedon välittäjä opettajille ja kouluille.",
    phaseStart: {
      label: "2022–",
      title: "Tekoälylukutaito ja Generation AI",
      description: "Aiempi tutkimus mobiilioppimisesta, yhteisöllisistä skripteistä ja opettajankoulutuksesta johtaa loogisesti tekoälykasvatukseen — sama kysymys teknologian roolista oppimisessa uudessa muodossa."
    },
    companionFields: ["description", "category", "phaseStart"],
    classification: "B/D",
    targetLabel: "Tutkimus / hankkeet",
    currentSourceState: "Project identity now reused from researchProjects.js."
  },
  {
    id: "tkaedite-2023",
    sourceKey: "research-project-tkaedite",
    category: "tutkimus",
    description: "Transforming the Kosovo and Albanian Education System by introducing Digital Technology in Teacher Education — Erasmus+ -rahoitteinen kansainvälinen hanke opettajankoulutuksen digitalisoinnista.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Tutkimus / hankkeet",
    currentSourceState: "Project identity now reused from researchProjects.js."
  },
  {
    id: "election-term-2025-2029",
    sourceKey: "election-term-2025-2029",
    category: "politiikka",
    description: "Varavaltuutettu ja sivistyslautakunnan jäsen Oulun kaupungissa; aluevaltuuston varajäsen Pohjois-Pohjanmaan hyvinvointialueella.",
    companionFields: ["description", "category"],
    classification: "B/D",
    targetLabel: "Vaalikaudet",
    currentSourceState: "Term period/year/route now reused from electionHistory."
  },
  {
    id: "ai-literacy-2026",
    year: 2026,
    category: "opetus",
    title: "Tekoälylukutaito opettajankoulutuksen keskiössä",
    description: "Generation AI -tutkimus ja täydennyskoulutukset siirtävät tekoälylukutaidon opettajankoulutuksen ja opettajayhteisöjen arkeen.",
    href: "/teemat/tekoalylukutaito/",
    companionFields: ["year", "title", "href", "description", "category"],
    classification: "C",
    targetLabel: "Tekoälylukutaito-teema",
    currentSourceState: "Homepage-only editorial synthesis of the current AI literacy phase."
  }
]);

module.exports = function milestonesData() {
  const electionHistory = loadElectionHistory();
  const projection = buildHomeMilestones({
    definitions: MILESTONE_DEFINITIONS,
    cvData,
    researchProjects,
    electionHistory
  });

  return projection.milestones;
};

module.exports.MILESTONE_DEFINITIONS = MILESTONE_DEFINITIONS;

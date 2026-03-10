import fs from "fs";

// Canva created_at Unix timestamps matched by title
const titleToTimestamp = {
  "Finnish Teacher Education & Professional Development": 1758572842,
  "Teachable Machine and Somekone – Demo Session EARLI 2025": 1756057432,
  "How to Teach AI Literacy to Primary School Children": 1755153343,
  "Miksi some koukuttaa? Somekoneen uusi työkalu": 1747290358,
  "ITK2025 Areena": 1745505658,
  "Miksi some koukuttaa? Miten tekoäly toimii? – ITK2025 Foorum": 1745352317,
  "Tekoäly arjessa – Helsinki Education HUB": 1744181992,
  "Robotiikkaa ja selitettävää tekoälyä – Opetettavan koneen ja Somekoneen uudet ominaisuudet": 1742466634,
  "Generation AI – Esittely japanilaiselle vieraalle": 1742285823,
  "Selitettävä tekoäly opetuksessa – ITK-webinaari": 1741689471,
  "Generative AI as a Tool to Adapt Teaching to Learner's Needs": 1740467782,
  "Generative AI as a Professional Tool – Agent, Coach or Friend?": 1738734945,
  "Tekoälyosaamista kieltenopetukseen": 1736516413,
  "Learning AI Literacy in Collaborative Projects with an AI Education Tool": 1733837746,
  "Annie Advisor – Generative AI as a Tool to Adapt Teaching": 1730841346,
  "Generation AI Workshop": 1730836235,
  "International Conference on the Advancement of STEAM 2024": 1730097587,
  "Digivoo kommenttipuheenvuoro": 1725296049,
  "From EU AI Act to National AI Guidelines": 1719500581,
  "Fedutalk – Generative AI in Education": 1719393269,
  "ITK2024": 1712922799,
  "Riko, rakenna ja ymmärrä – Kohti kriittistä tekoälylukutaitoa": 1771270213,
  "Ihmeitä tekevä tekoäly vai tavallinen työkalu? – VESO 2026": 1769082594,
  "VESO 2026 – Tekoäly opetuksessa": 1768990688,
  "Konenäkö, vibe coding ja robotiikka – Robokampus 2026": 1768948620,
  "Tekoälyagentit": 1763474591,
  "Tekoäly opettajan työkaluna": 1763411441,
  "Opettaja tekoälyn ja -älyttömyyden turbulenssissa": 1761830708,
  "Digipedailtapäivä – Tekoäly opetuksessa": 1761733083,
  "Kuinka tekoäly toimii? – Webinaari": 1761027310,
  "Tekoälylukutaitoinen digiosaaja – Millaisia taitoja opettajalla tulisi olla?": 1759863196,
  "Tekoäly: opettajan ystävä vai vihollinen? Matkalla kohti tekoälylukutaitoa": 1759251100,
  "Tekoäly yhdistystoiminnassa": 1757530994,
  "AI, Friend or Foe? (EN)": 1755554736,
  "Tekoäly, ystävä vai vihollinen? (FIN)": 1755504815,
  "Tekoälyluento ja työpaja (EN)": 1754384227,
  "Tekoälyluento ja työpaja (FIN)": 1754317178,
  "Tekoälyn vaikutuksia korkeakoulupedagogiikkaan": 1746987212,
  "Älyä! Teko! Tekoälyajan kognitiiviset työkalut ja ydintaidot": 1746465126,
  "Miten tekoälyn kehitys on muuttanut korkeakoulujen toimintaa?": 1744643348,
  "Kuinka opettaa tekoälytaitoja esi- ja perusopetuksessa? – PraBa": 1743565150,
  "Tekoäly, opettajan työ ja arvioinnin muutos": 1738672409,
  "Voiko tekoälyn käyttöä oikeasti kieltää?": 1738596551,
  "Generatiivinen tekoäly – Tekoäly työkaluna III": 1737064232,
  "Tekoäly osana arkisia sovelluksia": 1737062164,
  "Miten tekoäly toimii? Miksi some koukuttaa?": 1737058226,
  "Tekoälyn ajankohtaiskatsaus – OTAVIA 2025": 1735807195,
  "Digitutorit 2024 – Tekoäly opetuksessa": 1733826509,
  "DIGIERKO 2024 – Risteilyesitys": 1732866179,
  "Millaisia tekoälytaitoja peruskoulussa tulisi opettaa 2020-luvulla?": 1732179115,
  "Tekoälyluento – OSYK": 1728416641,
  "Opopassi-koulutus – Tekoäly ohjauksessa": 1727960157,
  "AVI-koulutus – Tekoäly opetuksessa": 1727775504,
  "Monilukutaito on opettajan supervoima – Tekoälylukutaito": 1727376130,
  "Tekoäly on jo kaikkialla – Miten ilmiötä tulisi lähestyä?": 1727336390,
  "Tekoälytyökalut – Webinaari 2024": 1727203815,
  "Tekoäly arjessa – EDUTEN/Opinvirta": 1726745769,
  "VESO 2024 – Tekoäly opetuksessa": 1725053704,
  "VESO elokuu 2024 – Tekoäly koulussa": 1725052123,
  "VESO 2024 – Tekoäly oppimassa ja opettamassa": 1722843689,
  "FCLAB ja norssit – Generation AI": 1713382543,
  "Tekoäly opettajan työkaluna – Inspiraatiosessio": 1710319197,
  "Kuntaliitto digiverkosto – Tekoäly koulutuksessa": 1710177272,
  "OAJ SAUNA – Tekoäly ja opettajuus": 1707219922,
  "OPH-webinaari – Tekoäly opetuksessa 2023": 1700507954,
};

function tsToDate(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

const data = JSON.parse(fs.readFileSync("src/_data/canva-presentations.json", "utf8"));

let matched = 0, missing = [];

const updated = data.map(d => {
  const ts = titleToTimestamp[d.title];
  if (ts) {
    matched++;
    return { ...d, date: tsToDate(ts) };
  } else {
    missing.push(d.title);
    return { ...d, date: null };
  }
});

fs.writeFileSync("src/_data/canva-presentations.json", JSON.stringify(updated, null, 2));

console.log(`✓ Päivitetty: ${matched}/${data.length} esitykselle lisätty päivämäärä`);
if (missing.length) {
  console.log(`⚠ Ei löydetty päivämäärää (${missing.length}):`, missing);
}

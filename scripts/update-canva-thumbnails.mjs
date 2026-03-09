#!/usr/bin/env node
/**
 * update-canva-thumbnails.mjs
 *
 * Päivittää canva-presentations.json thumbnail-kentät oikeilla Canva API -kuvalinkeillä,
 * jotka haettiin MCP-yhteydellä. URLit ovat CDN-kuvalinkkejä (eivät viewer-shortlinkejä).
 *
 * Aja heti päivityksen jälkeen myös:
 *   node scripts/export-canva-thumbnails.mjs
 * jotta kuvat ladataan paikallisiksi ennen kuin CDN-URLit vanhenevat.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const JSON_PATH = path.join(ROOT, "src/_data/canva-presentations.json");

// Otsikosta thumbnail-URLiin (haettu Canva MCP API:sta)
// Huom: "Finnish Teacher Education & Professional Development" on tallennettu paikallisena .png-tiedostona
// (haettu editing-transaction API:lla, koska CDN-URL palauttaa 403)
const titleToThumbnail = {
  "Teachable Machine and Somekone – Demo Session EARLI 2025":
    "https://design.canva.ai/kAlX2M2ro_rLTPX",
  "Miksi some koukuttaa? Somekoneen uusi työkalu":
    "https://design.canva.ai/fIKFjoJH89uXL6C",
  "ITK2025 Areena":
    "https://design.canva.ai/tYYAhCQBG4kmZaK",
  "Miksi some koukuttaa? Miten tekoäly toimii? – ITK2025 Foorum":
    "https://design.canva.ai/_3vLfqS039tanU8",
  "Tekoäly arjessa – Helsinki Education HUB":
    "https://design.canva.ai/PKj3xL-KS1FtY3R",
  "Robotiikkaa ja selitettävää tekoälyä – Opetettavan koneen ja Somekoneen uudet ominaisuudet":
    "https://design.canva.ai/p3Ngs2Wde-P7-iv",
  "Selitettävä tekoäly opetuksessa – ITK-webinaari":
    "https://design.canva.ai/pWN9E991oD6rZbJ",
  "Generative AI as a Tool to Adapt Teaching to Learner's Needs":
    "https://design.canva.ai/6dNUOz1u3v2Iiz8",
  "Generative AI as a Professional Tool – Agent, Coach or Friend?":
    "https://design.canva.ai/aV2qlA9Kg1ww4zj",
  "Tekoälyosaamista kieltenopetukseen":
    "https://design.canva.ai/ST3ob-5LffPO-Ds",
  "Learning AI Literacy in Collaborative Projects with an AI Education Tool":
    "https://design.canva.ai/SLtoTrQdOuK_hH_",
  "Annie Advisor – Generative AI as a Tool to Adapt Teaching":
    "https://design.canva.ai/Ctl87e_iunH-KtG",
  "Generation AI Workshop":
    "https://design.canva.ai/KVD08m0Ld-28fSV",
  "International Conference on the Advancement of STEAM 2024":
    "https://design.canva.ai/lN_adRlthDd2iRA",
  "Digivoo kommenttipuheenvuoro":
    "https://design.canva.ai/uzlbGjOKYoAq2o1",
  "From EU AI Act to National AI Guidelines":
    "https://design.canva.ai/A8NqZoJ9Ls9dJir",
  "Fedutalk – Generative AI in Education":
    "https://design.canva.ai/C4PAheRGhHmJlnR",
  "ITK2024":
    "https://design.canva.ai/No_6yNJ_f4DLJtW",
  "Riko, rakenna ja ymmärrä – Kohti kriittistä tekoälylukutaitoa":
    "https://design.canva.ai/WquenNEhU410vbi",
  "Ihmeitä tekevä tekoäly vai tavallinen työkalu? – VESO 2026":
    "https://design.canva.ai/bCpbQtP5dUUylGr",
  "VESO 2026 – Tekoäly opetuksessa":
    "https://design.canva.ai/l1Ijlfh8Ydk3mfg",
  "Konenäkö, vibe coding ja robotiikka – Robokampus 2026":
    "https://design.canva.ai/41rC9qttFXHNTZB",
  "Tekoälyagentit":
    "https://design.canva.ai/YIT_7z6q42TI76l",
  "Tekoäly opettajan työkaluna":
    "https://design.canva.ai/6LYX7ixE-GhUDXj",
  "Opettaja tekoälyn ja -älyttömyyden turbulenssissa":
    "https://design.canva.ai/604JYeUhRi0hK0_",
  "Digipedailtapäivä – Tekoäly opetuksessa":
    "https://design.canva.ai/38nxHD9-gIXJItz",
  "Kuinka tekoäly toimii? – Webinaari":
    "https://design.canva.ai/K0xOG-eSIM8_heJ",
  "Tekoälylukutaitoinen digiosaaja – Millaisia taitoja opettajalla tulisi olla?":
    "https://design.canva.ai/D73qQ-D6enWgoEn",
  "Tekoäly: opettajan ystävä vai vihollinen? Matkalla kohti tekoälylukutaitoa":
    "https://design.canva.ai/XzG-CM7k6hgGSHn",
  "Tekoäly yhdistystoiminnassa":
    "https://design.canva.ai/FTw2at1eCMxqy6E",
  "AI, Friend or Foe? (EN)":
    "https://design.canva.ai/sQwm5mzHDmXh_2c",
  "Tekoäly, ystävä vai vihollinen? (FIN)":
    "https://design.canva.ai/t9wakdF1fHT6Fzl",
  "Tekoälyluento ja työpaja (EN)":
    "https://design.canva.ai/HO-MfFdpWIEZs6t",
  "Tekoälyluento ja työpaja (FIN)":
    "https://design.canva.ai/683IQBeKtn2sbqN",
  "Älyä! Teko! Tekoälyajan kognitiiviset työkalut ja ydintaidot":
    "https://design.canva.ai/PfOFZq2REL7zT_o",
  "Miten tekoälyn kehitys on muuttanut korkeakoulujen toimintaa?":
    "https://design.canva.ai/IEo_s7D16Dvyeax",
  "Kuinka opettaa tekoälytaitoja esi- ja perusopetuksessa? – PraBa":
    "https://design.canva.ai/P4AvpQcFas1lb2e",
  "Tekoäly, opettajan työ ja arvioinnin muutos":
    "https://design.canva.ai/VRPid9WldNCBi3n",
  "Voiko tekoälyn käyttöä oikeasti kieltää?":
    "https://design.canva.ai/iabYi1SjE_s3mcY",
  "Generatiivinen tekoäly – Tekoäly työkaluna III":
    "https://design.canva.ai/FBTfLfIdEJWKaMX",
  "Tekoäly osana arkisia sovelluksia":
    "https://design.canva.ai/pgfTUsDAf7TwqhX",
  "Miten tekoäly toimii? Miksi some koukuttaa?":
    "https://design.canva.ai/uTzpA5bT34XSwMP",
  "Digitutorit 2024 – Tekoäly opetuksessa":
    "https://design.canva.ai/_OHYgqGWUzqx5Lo",
  "DIGIERKO 2024 – Risteilyesitys":
    "https://design.canva.ai/-csPWiBwBLx8gYj",
  "Millaisia tekoälytaitoja peruskoulussa tulisi opettaa 2020-luvulla?":
    "https://design.canva.ai/9-sksVPfSwlt3Tr",
  "Tekoälyluento – OSYK":
    "https://design.canva.ai/9ZSrykAYo9xstCB",
  "Opopassi-koulutus – Tekoäly ohjauksessa":
    "https://design.canva.ai/HktOx4fWy-lEsEV",
  "AVI-koulutus – Tekoäly opetuksessa":
    "https://design.canva.ai/TH0XRvzD5fjiKlm",
  "Monilukutaito on opettajan supervoima – Tekoälylukutaito":
    "https://design.canva.ai/8oh9EekaXqtfFTh",
  "Tekoäly on jo kaikkialla – Miten ilmiötä tulisi lähestyä?":
    "https://design.canva.ai/LyonPfX20-6f-50",
  "Tekoälytyökalut – Webinaari 2024":
    "https://design.canva.ai/hvVumMXLzA2mYkM",
  "VESO 2024 – Tekoäly opetuksessa":
    "https://design.canva.ai/tKQ8jlWaJggwDU6",
  "VESO 2024 – Tekoäly oppimassa ja opettamassa":
    "https://design.canva.ai/fcxg9eg3G7jPGEI",
  "FCLAB ja norssit – Generation AI":
    "https://design.canva.ai/RjoCmoeNJ_MrAPC",
  "Tekoäly opettajan työkaluna – Inspiraatiosessio":
    "https://design.canva.ai/uQJus_ShDoCxx53",
  "Kuntaliitto digiverkosto – Tekoäly koulutuksessa":
    "https://design.canva.ai/uKVsk55iTwrCruJ",
  "OAJ SAUNA – Tekoäly ja opettajuus":
    "https://design.canva.ai/bNNeL8vZKv4L_iu",
  "OPH-webinaari – Tekoäly opetuksessa 2023":
    "https://design.canva.ai/4BftzpXoAXvvyht",
};

const presentations = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
let updated = 0;
let skipped = 0;

for (const item of presentations) {
  const newUrl = titleToThumbnail[item.title];
  if (newUrl) {
    item.thumbnail = newUrl;
    updated++;
  } else {
    console.log(`  ⚠  Ei vastaavuutta: "${item.title}"`);
    skipped++;
  }
}

fs.writeFileSync(JSON_PATH, JSON.stringify(presentations, null, 2) + "\n");

console.log(`\nValmis:`);
console.log(`  Päivitetty:  ${updated}`);
console.log(`  Ohitettu:    ${skipped}`);
console.log(`\nAja seuraavaksi heti:`);
console.log(`  node scripts/export-canva-thumbnails.mjs`);

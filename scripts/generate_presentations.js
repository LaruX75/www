const fs = require('fs');
const path = require('path');

const data = [
    {
        "title": "Kohti kriittistä tekoälylukutaitoa 2026 - Finnoschool",
        "description": "Opettajille suunnattu koulutusesitys kriittisestä tekoälylukutaidosta. Käsittelee CEDE-pedagogista mallia ja tekoälylukutaidon opettamista.",
        "date": "2026-02-16",
        "url": "https://www.canva.com/d/Q-_JKVR5uFrh3wI",
        "thumbnail": "https://design.canva.ai/YtsgX9ffDqDR19O",
        "categories": ["Tekoälylukutaito", "Opettajankoulutus", "Koulutus"],
        "type": "esitys"
    },
    {
        "title": "Kempele VESO 2026",
        "description": "Opettajien työyhteisökoulutus Kempeleen kouluille tekoälyn ja digitaalisen oppimisen teemoista.",
        "date": "2026-01-21",
        "url": "https://www.canva.com/d/cbnYXXNXQtLqaOC",
        "thumbnail": "https://design.canva.ai/R9Uqq5WQ1l-MRvt",
        "categories": ["VESO", "Opettajankoulutus", "Tekoäly"],
        "type": "esitys"
    },
    {
        "title": "Generation AI yleisesitys / Sovellukset / 2026",
        "description": "Generation AI -hankkeen yleisesitys opetuskäyttöön kehitetyistä tekoälysovelluksista ja niiden pedagogisista mahdollisuuksista.",
        "date": "2026-02-19",
        "url": "https://www.canva.com/d/ATg2bgB0a6REj0D",
        "thumbnail": "https://design.canva.ai/GeKZRM54-8iwC3P",
        "categories": ["Generation AI", "Tekoälysovellukset", "Opetus"],
        "type": "esitys"
    },
    {
        "title": "Riihimäki VESO 2026",
        "description": "Riihimäen koulujen opettajien täydennyskoulutuspäivä tekoälyn opetuskäytöstä ja digitaalisista oppimisympäristöistä.",
        "date": "2026-01-22",
        "url": "https://www.canva.com/d/ScsvKi3eW0eKoYS",
        "thumbnail": "https://design.canva.ai/1TWYFf2-EhVleLl",
        "categories": ["VESO", "Opettajankoulutus", "Tekoäly"],
        "type": "esitys"
    },
    {
        "title": "Opettaja tekoälyn ja -älyttömyyden turbulenssissa. Tampere 2025",
        "description": "Konferenssiesitys Tampereella opettajan roolista tekoälyn aikakaudella — mahdollisuudet, riskit ja kriittiset näkökulmat.",
        "date": "2025-10-30",
        "url": "https://www.canva.com/d/lRZpuZC9RLomY4L",
        "thumbnail": "https://design.canva.ai/f_VroP01veWBfKy",
        "categories": ["Tekoäly", "Opettajuus", "Konferenssi"],
        "type": "esitys"
    },
    {
        "title": "Luento 4: Ohjelmointiosaaminen",
        "description": "Yliopistokurssille tuotettu luento ohjelmointiosaamisen perusteista ja sen merkityksestä digitaalisen ajan opetuksessa.",
        "date": "2025-01-28",
        "url": "https://www.canva.com/d/_K98Sie1DPAYz2E",
        "thumbnail": "https://design.canva.ai/qg7gTg6b7T12hzM",
        "categories": ["Ohjelmointi", "Luento", "Opettajankoulutus"],
        "type": "esitys"
    },
    {
        "title": "Luento 1: Johdanto",
        "description": "Kurssin johdantoluento, joka perehdyttää opiskelijat kurssin teemoihin, tavoitteisiin ja keskeisiin käsitteisiin.",
        "date": "2025-01-07",
        "url": "https://www.canva.com/d/UCdIcmm6TWkilwc",
        "thumbnail": "https://design.canva.ai/Op64eh3cZzySY3p",
        "categories": ["Luento", "Johdanto", "Opettajankoulutus"],
        "type": "esitys"
    },
    {
        "title": "Monilukutaito on opettajan supervoima: tekoälylukutaito-luento",
        "description": "Laaja luento monilukutaidosta ja tekoälylukutaidosta opettajan pedagogisena osaamisalueena. Käy läpi OECD:n tekoälylukutaidon viitekehystä ja käytännön työkaluja.",
        "date": "2024-09-27",
        "url": "https://www.canva.com/d/9xs_MhQ6mC6Rcdy",
        "thumbnail": "https://design.canva.ai/nOr6f2B1sj_JIcb",
        "categories": ["Tekoälylukutaito", "Monilukutaito", "Luento", "Opettajankoulutus"],
        "type": "esitys"
    },
    {
        "title": "DIGIERKO2024 risteilyesitys",
        "description": "DIGIERKO-koulutusristeilyn esitys digitaalisesta erityisosaamisesta ja tekoälystä opetuksen kentällä.",
        "date": "2024-11-29",
        "url": "https://www.canva.com/d/uv4hHNfJp4wmMG9",
        "thumbnail": "https://design.canva.ai/l3FDTWa5SRYDvAO",
        "categories": ["Digitalisaatio", "Erityisopetus", "Koulutus"],
        "type": "esitys"
    },
    {
        "title": "Pori / Kerava: Millaisia tekoälytaitoja peruskoulussa tulisi opettaa 2020-luvulla?",
        "description": "Koulutusesitys siitä, mitä tekoälytaitoja peruskoulussa tulisi opettaa ja miten ne voidaan integroida opetukseen.",
        "date": "2024-11-21",
        "url": "https://www.canva.com/d/j0l9JbP2ry5Osgr",
        "thumbnail": "https://design.canva.ai/4ThkgOQG44SJdCK",
        "categories": ["Tekoälytaidot", "Peruskoulu", "Koulutus"],
        "type": "esitys"
    },
    {
        "title": "SIMO VESO 2024",
        "description": "Simon kunnan opettajien VESO-koulutuspäivä 2024 tekoälyn ja digitaalisten työkalujen hyödyntämisestä kouluarjessa.",
        "date": "2024-08-30",
        "url": "https://www.canva.com/d/ajW6DkEv4UPmYOY",
        "thumbnail": "https://design.canva.ai/DNwUHcKtDXtsQ00",
        "categories": ["VESO", "Opettajankoulutus", "Digitalisaatio"],
        "type": "esitys"
    },
    {
        "title": "Kokkola 2025: tekoäly, opettajan ystävä vai viho",
        "description": "Kokkolassa pidetty koulutusesitys tekoälystä opettajan arjessa — mahdollisuudet, riskit ja pedagogiset näkökulmat.",
        "date": "2025-09-30",
        "url": "https://www.canva.com/d/fRVY_8QVfYju6_Z",
        "thumbnail": "https://design.canva.ai/1RbB0HVbFFRLEfX",
        "categories": ["Tekoäly", "Opettajuus", "Koulutus"],
        "type": "esitys"
    },
    {
        "title": "International Conference on the Advancement of STEAM 2024",
        "description": "Kansainvälisessä STEAM-konferenssissa esitelty tutkimusesitys tekoälylukutaidon integroimisesta STEAM-opetukseen.",
        "date": "2024-10-27",
        "url": "https://www.canva.com/d/ZSS9BH47n8CC49l",
        "thumbnail": "https://design.canva.ai/VbGv8pq83AOwXb5",
        "categories": ["STEAM", "Tekoäly", "Konferenssi", "Tutkimus"],
        "type": "esitys"
    },
    {
        "title": "Konenäkö + vibe + robotiikka – Riihimäki Robokampus 2026",
        "description": "Riihimäen Robokampukselle suunnattu koulutusesitys konenäön, vibe-koodauksen ja robotiikan yhdistämisestä opetuksessa.",
        "date": "2026-01-20",
        "url": "https://www.canva.com/d/OjGJZTiP0dZu6rh",
        "thumbnail": "https://design.canva.ai/gd4B1TFoaQJ7lFP",
        "categories": ["Robotiikka", "Konenäkö", "Ohjelmointi", "Koulutus"],
        "type": "esitys"
    },
    {
        "title": "Palveluverkko 2023 – reunaehtojen tarkastelua",
        "description": "Esitys Oulun kaupungin palveluverkon reunaehdoista ja koulutuspoliittisista linjauksista vuonna 2023.",
        "date": "2023-05-21",
        "url": "https://www.canva.com/d/ZNeBoffbYLNc_O0",
        "thumbnail": "https://design.canva.ai/axvl7DuFxe4-tr_",
        "categories": ["Koulutuspolitiikka", "Palveluverkko", "Oulu"],
        "type": "esitys"
    },
    {
        "title": "Syntyvyys ja kouluikäluokat Oulussa 2026",
        "description": "Datapohjainen esitys Oulun kaupungin syntyvyyden kehityksestä ja sen vaikutuksesta tuleviin kouluikäluokkiin.",
        "date": "2026-01-15",
        "url": "https://www.canva.com/d/GpIIHf7kK1Qksnv",
        "thumbnail": "https://design.canva.ai/QPqbUqP8J9VOM9v",
        "categories": ["Koulutuspolitiikka", "Oulu", "Väestötieto"],
        "type": "esitys"
    }
];

const dir = path.join(__dirname, 'src', 'presentations');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

data.forEach(item => {
    // Create a safe filename
    const safeTitle = item.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const filename = `${safeTitle}.md`;
    const filepath = path.join(dir, filename);

    const content = `---
title: "${item.title.replace(/"/g, '\\"')}"
description: "${item.description.replace(/"/g, '\\"')}"
date: ${item.date}
url: "${item.url}"
thumbnail: "${item.thumbnail}"
categories: ${JSON.stringify(item.categories)}
type: "${item.type}"
layout: base.njk
---

Tämä on automaattisesti tuotu Canva-esitys. Voit katsoa esityksen suoraan [Canvassa tästä linkistä](${item.url}).
`;

    fs.writeFileSync(filepath, content);
    console.log(`Created ${filename}`);
});

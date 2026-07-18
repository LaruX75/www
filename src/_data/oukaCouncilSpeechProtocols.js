const protocolsByDate = {
  "2017-06-05": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=13272",
  "2018-01-29": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=14649",
  "2018-02-26": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=14798",
  "2018-04-16": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=15011",
  "2018-05-14": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=15180",
  "2018-10-08": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=16451",
  "2018-12-10": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=17027",
  "2019-06-17": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=18931",
  "2019-10-07": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=19881",
  "2019-11-11": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=20531",
  "2019-12-09": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=20774",
  "2020-01-27": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=21060",
  "2020-10-05": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=23634",
  "2020-11-09": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=23969",
  "2020-12-07": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=24421",
  "2021-03-29": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=26361",
  "2021-04-26": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=26737",
  "2021-09-06": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=27260",
  "2021-11-08": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=27770",
  "2021-12-13": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=27928",
  "2022-02-28": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=28875",
  "2022-04-04": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=29209",
  "2022-04-25": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=29656",
  "2022-06-20": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=30022",
  "2022-09-12": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=30413",
  "2022-10-10": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=30810",
  "2022-12-12": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=31660",
  "2023-02-06": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=32431",
  "2023-02-27": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=32949",
  "2023-05-22": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=33518",
  "2023-09-11": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=34500",
  "2024-01-29": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=36236",
  "2024-02-26": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=37054",
  "2024-03-18": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=37395",
  "2024-05-20": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=38074",
  "2024-09-09": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=38543",
  "2024-11-11": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=39584",
  "2025-04-28": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=41481",
  "2026-03-30": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=46417",
  "2026-04-27": "https://asiakirjat.ouka.fi/ktwebscr/pk_asil_tweb.htm?bid=47580"
};

const overrides = {
  "/2017/06/05/1-puheenvuoroni-oulun-kaupunginvaltuutettuna/": {
    event: "Oulun kaupunginvaltuusto",
    asiakohta: "Kokouspöytäkirja 5.6.2017"
  },
  "/2018/02/26/puhe-valtuustossa-kuka-puolustaisi-kaupungin-jokaista-kaupunginosaa/": {
    event: "Oulun kaupunginvaltuusto",
    asiakohta: "§ 18 – Kaupunkistrategia Oulu 2026"
  },
  "/2018/02/26/valtuusto-26-2-18-kotouttamisohjelma/": {
    event: "Oulun kaupunginvaltuusto",
    asiakohta: "§ 21 – Yhdessä kotoutuva Oulu - Oulun kaupungin kotouttamisohjelma 2018-2021"
  },
  "/2018/04/16/puheenvuoroni-kaupunginvaltuuston-kokouksessa-16-4-2018/": {
    event: "Oulun kaupunginvaltuusto",
    asiakohta: "§ 30 – Sivistys- ja kulttuuripalveluiden palveluverkkosuunnitelmalinjaukset"
  },
  "/2019/12/02/puheenvuoroni-oulun-kaupunginvaltuuston-talousarviokeskustelun-yhteydessa-2-12-2019/": {
    meetingDate: "2019-12-09"
  },
  "/2020/11/20/puhe-kaupunginvaltuuston-kokouksessa-20-11-2020/": {
    event: "Oulun kaupunginvaltuusto",
    meetingDate: "2020-11-09",
    asiakohta: "§ 8 – Oulun yliopiston sijoittuminen Raksilan alueelle"
  },
  "/2020/11/30/puheenvuoro-valtuustossa-kulttuurin-merkitys-korostuu-pandemia-aikana/": {
    meetingDate: "2020-12-07"
  },
  "/2020/11/30/puheenvuoro-valtuustossa-maahanmuuton-kustannuksia-on-tarkasteltava-kokonaisuutena/": {
    meetingDate: "2020-12-07"
  },
  "/2021/04/26/puheenvuoro-kohdassa-%c2%a7-selvitys-oulun-yliopiston-sijoittumisesta-raksilan-alueelle/": {
    event: "Oulun kaupunginvaltuusto",
    asiakohta: "§ 7 – Selvitys Oulun yliopiston sijoittumisesta Raksilan alueelle"
  },
  "/2021/11/29/talousarvioesitys-2020-yksityisen-varhaiskasvatuksen-osuutta-tulee-lisata-25/": {
    meetingDate: "2021-12-13"
  },
  "/2022/11/28/puheenvuoro-valtuustossa-haukiputaan-urheilukentta-ja-torpanmaen-vaihtoehto/": {
    meetingDate: "2022-12-12"
  },
  "/2022/11/28/puheenvuoro-valtuustossa-yksityinen-varhaiskasvatus-palvelujen-saatavuus/": {
    meetingDate: "2022-12-12"
  }
};

module.exports = {
  protocolsByDate,
  overrides
};

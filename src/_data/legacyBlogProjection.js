const fs = require("fs");
const path = require("path");

// Curated legacy semantics: source placement is historical, not a runtime classifier.
const CLASS_BASENAMES = {
  A: [
    "17", "ainolan-myynti-osoitti-miksi-kulttuuripaatokset-tarvitsevat-oman-kasittelynsä", "asiaa-himmeleista-ja-aluehallinnosta", "bensalenkkareista-ja-piraateista-miten-jaalin-nuorisoa-voisi-ottaa-paremmin-huomioon", "berliinissa-uutena-vuotena-2007", "digione-nakyi-lautakunnan-listalla-kaytannon-jarjestelmamuutoksena", "esiopetuksen-malli-ja-lukioiden-arki-olivat-samalla-lautakuntalistalla", "kaikki-lahtee-yksilosta-nobel-palkittu-martti-ahtisaari-radio-suomen-haastattelussa", "kehuttua-koulutusteknologian-perusopintojen-johdantoluento", "kielimalli-voi-avata-kaupungin-aineistoja-mutta-ei-korvaa-lahdekritiikkia", "kiiminki-kymmenen-parhaan-joukossa-lapsiystavallisyydessa-hienoa", "kiiminki-osana-oulujoen-kaupunkia-visio-2021", "kirjasto-on-lahipalvelu-ja-sivistyksen-infrastruktuuri", "kommentoin-facebookissa-toivetta-saada-lisaresursseja-ennaltaehkaisevaan-tyohon-case-kauhajoki", "kriisitalouden-pitka-hanta-case-ideapark-kiimingissa", "ktk149-digiluokka-aanet", "ktk149-digiluokka", "kuntaliitos-ratkaisi-rajat-mutta-ei-yhteisen-kaupungin-kysymysta", "kuntavaalit-2017-best-of", "kurkistus-sivustoni-tekniikkaan", "lahikoulu-ja-aluekouluperiaate-kuuluvat-palveluverkon-valmisteluun", "lakimuutokset-nakyvat-koulun-arjessa-paikallisina-ratkaisuina", "larun-laitenurkka-testaa-kandao-360-kokouskamerat", "lautakuntamatka-naytti-miten-tilat-kantavat-sivistysta-ja-kulttuuria", "linnanmaan-uimahalli-muistuttaa-politiikan-pitkista-kaarista", "missa-mennaan-hyvinvointia-tukevissa-digipalveluissa", "mista-on-hyva-kaupunginvaltuutettu-tehty", "nizza-2018", "normaalikoulun-tilapaatos-palautti-kampuskeskustelun-raiteilleen", "normaalikoulun-tilaratkaisu-alkoi-vihdoin-edeta", "olisikohan-oululla-mahdollista-paasta-vastaavaan-kukoistukseen-kuin-muinainen-paliputra-tai-miletos", "onko-koulu-lapsia-vai-opettajia-varten-lea-pulkkisen-lausuntojen-pohdiskelua", "onko-nykymuotoinen-tohtorikoulutus-tiensa-paassa-siirretty", "opiskelijoiden-kysely-kertoi-miksi-keskustakampus-heratti-vastustusta", "oululla-ei-ole-syyta-heikkoon-itseluottamukseen", "palveluverkko-2023-reunaehtojen-tarkastelua", "palveluverkkoselvityksen-tietopohjan-pitaa-nakya-ajoissa", "pohjoisen-suomen-ohjelma-ansaitsee-julkisen-keskustelun", "punaisenladonkankaan-kompostialue-vs-tutkimus-jonka-mukaan-madatys-on-kompostointia-ymparistoystavallisempaa", "raksilan-vesiliikuntakeskus-on-osa-laajempaa-kaupunkirakennetta", "raksilasta-ja-kampuksesta-2019-2022", "rantalakeus-249-ei-suur-oulu-vaan-laajempi-yhteinen-oulu", "ratikalla-ruskoon-kutsutaksilla-kauppaan-vai-sahkoautolla-kirkolle", "roadtrip-oulu-skopje-oulu-vajaa-10-000km", "silloin-kun-sita-oltiin-larges-securityn-sysop-bbs-muisteluita", "sivistys-ja-kulttuurilautakunta-kokoontui-ouluhallissa-laajennus-ja-remontti-on-luvassa-tulevaisuudessa", "sivistyslautakunnan-uusi-alku-nakyi-jo-vuoden-2022-viimeisissa-kokouksissa", "te-muut-voisitte-menna-vaikka-kahville-vastine-pauli-maatan-kirjoitukseen-ihanseutuyhteistyosta", "tiedolla-johtaminen-tarvitsee-yhteiset-nakymat", "tilasto-ei-riita-jos-rajaukset-eivat-nay", "tyomatkapyorailijan-hammastelya", "vihrean-siirtyman-investoinnit-tarvitsevat-avoimet-tietonakymat", "vuoden-2017-kuntavaalit", "yliopiston-kiinteistostrategian-valkea-savu", "ymparistoluvat-nayttavat-miksi-avoin-data-tarvitsee-lukijoita"
  ],
  B: ["aanesta-jari-laru-oulun-yliopiston-kollegioon", "jari-larulle-kansallinen-avoimen-tieteen-palkinto", "kokoomus-esittaa-minua-sivistys-ja-kulttuurilautakunnan-jaseneksi", "liikkuva-oulu-voi-hyvin", "mina-olen-annaaanilapselle-ehdokas", "sain-kierikkia-koskevan-lisayksen-sikun-kayttosuunnitelmaan", "seurakuntavaalit-tulevat-ja-ehdolla-ollaan-miksi-tallainen-agnostinen-liberaali-on-nailla-selkosilla-ehdokkaana", "tein-muutosesityksen-jokirannan-koulu-tulee-sijoittaa-puiravan-kolmioon", "tunnelmia-lahidemokratiatoimikunnan-viimeisesta-kokouksesta", "vaalinalustunnelmia", "valtuutettujen-vetoomus-toi-keskustakampuksen-valtuuston-kasiteltavaksi", "vote-jari-laru-to-oulu-university-collegium", "vuorovaikutussuunnitelman-valmistelutyoryhman-kokous", "yhdistysaktivisti"],
  C: ["osallistun-tuleeko-kuntalainen-kuulluksi-paneeliin-14102008-kirkkotorin-koulutuskeskuksessa-oulussa", "tvt-koulun-johtamisen-valineena-luento-mobiilioppiminen-mita-se-teknologia-tahtoo"],
  D: ["jari-larun-verkkolive"],
  F: ["blogi-on-muuttanut-eika-ihan-naarmuitta", "etusivu", "hyvaa-eurooppa-paivaa", "kayppas-katsomassa-vastauksiani-vaalikoneissa", "lomamatkat", "roadtrip-oulu-krakova-oulu", "ulkoiset-rss-syotteet-kohdalleen", "vaalielaimet-ja-muu-grafiikka-vuoden-2017-vaaleissa"]
};

const projectionByBasename = Object.freeze(Object.fromEntries(
  Object.entries(CLASS_BASENAMES).flatMap(([semanticClass, basenames]) => basenames.map((basename) => [basename, Object.freeze({
    semanticClass,
    activeBlog: semanticClass === "A",
    historicalArchive: semanticClass !== "A"
  })]))
));

function validateLegacyBlogProjection(blogDirectory = path.join(__dirname, "..", "blog")) {
  const basenames = fs.readdirSync(blogDirectory)
    .filter((name) => name.endsWith(".md"))
    .map((name) => path.basename(name, ".md"));
  const mapped = Object.keys(projectionByBasename);
  const missing = basenames.filter((basename) => !projectionByBasename[basename]);
  const stale = mapped.filter((basename) => !basenames.includes(basename));
  const active = mapped.filter((basename) => projectionByBasename[basename].activeBlog);
  const historical = mapped.filter((basename) => projectionByBasename[basename].historicalArchive);

  if (basenames.length !== 80 || mapped.length !== 80 || active.length !== 55 || historical.length !== 25 || missing.length || stale.length) {
    throw new Error(`Invalid legacy blog projection: files=${basenames.length}, mapped=${mapped.length}, active=${active.length}, historical=${historical.length}, missing=${missing.join(",")}, stale=${stale.join(",")}`);
  }
  return { total: mapped.length, active: active.length, historical: historical.length };
}

function getLegacyBlogProjection(inputPath = "") {
  const basename = path.basename(String(inputPath), path.extname(String(inputPath)));
  return projectionByBasename[basename] || null;
}

module.exports = { CLASS_BASENAMES, projectionByBasename, getLegacyBlogProjection, validateLegacyBlogProjection };

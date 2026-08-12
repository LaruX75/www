const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const { derivePresentationMetadata } = require("../../src/_utils/presentationDerivedMetadata");

describe("derivePresentationMetadata", () => {
  test("SlideShare-analyysin kuvaus korvaa geneerisen kuvauksen politiikkaesityksessa", () => {
    const metadata = derivePresentationMetadata({
      title: "Lähidemokratiatoimikunnan toiminta Oulussa",
      url: "https://www.slideshare.net/slideshow/lhidemokratiatoimikunta-oulun-kaupungissa/41789438",
      description: "SlideShare-esitys",
      categories: [],
      keywords: [],
      source: "slideshare"
    });

    assert.match(metadata.description, /kuntalaiset keskiöön/i);
    assert.ok(metadata.categories.includes("Demokratia ja sivistys"));
    assert.ok(metadata.keywords.includes("lähidemokratia"));
    assert.equal(metadata.sourceLanguage, "fi");
    assert.equal(metadata.slideCount, 16);
    assert.equal(metadata.viewCount, 406);
  });

  test("transcript fallback tuo TPACK-esitykselle oikean kuvauksen ja opetusteknologia-metadatan", () => {
    const metadata = derivePresentationMetadata({
      title: "LUENTO 3: TPACK-taidot – teknologiatuettu oppiminen ja opetus",
      url: "https://www.slideshare.net/slideshow/luento-3-tpacktaidot-teknologiatuettu-oppiminen-ja-opetus/38595557",
      description: "SlideShare-esitys",
      categories: [],
      keywords: [],
      source: "slideshare"
    });

    assert.match(metadata.description, /410014Y Tieto- ja viestintätekniikka pedagogisena/i);
    assert.ok(metadata.categories.includes("Koulutusteknologia"));
    assert.ok(metadata.keywords.includes("TPACK"));
    assert.ok(metadata.keywords.includes("koulutusteknologia"));
  });

  test("tagipohjainen analyysi tuottaa avainsanoja ilman otsikkoarvailua", () => {
    const metadata = derivePresentationMetadata({
      title: "\"Digital enabled learning\" (Arctic frontiers speech 2020)",
      url: "https://www.slideshare.net/slideshow/digital-enabled-learning-arctic-frontiers-speech-2020/228552429",
      description: "SlideShare-esitys",
      categories: [],
      keywords: [],
      source: "slideshare"
    });

    assert.ok(metadata.categories.includes("Koulutusteknologia"));
    assert.ok(metadata.categories.includes("Konferenssi"));
    assert.ok(metadata.keywords.includes("digitaalinen oppiminen"));
    assert.ok(metadata.keywords.includes("koulutusteknologia"));
    assert.equal(metadata.sourceLanguage, "en");
  });

  test("quali-luento saa tutkimusmetadatan kurssi- ja sisältösignaalista", () => {
    const metadata = derivePresentationMetadata({
      title: "Quali lecture 1: Understanding the research process",
      url: "https://www.slideshare.net/slideshow/quali-lecture-1-17116725/17116725",
      description: "SlideShare-esitys",
      categories: [],
      keywords: [],
      source: "slideshare",
      courseContexts: [
        {
          courseName: "Research Methodology: Qualitative Research (QUALI)",
          courseId: "413315S-01",
          matchedTerms: ["quali lecture", "understanding the research process"]
        }
      ]
    });

    assert.ok(metadata.categories.includes("Yliopisto ja korkeakoulut"));
    assert.ok(metadata.keywords.includes("laadullinen tutkimus"));
    assert.ok(metadata.keywords.includes("tutkimusprosessi"));
  });

  test("web- ja blogiesitys saa koulutusteknologiaan liittyvat avainsanat", () => {
    const metadata = derivePresentationMetadata({
      title: "Blogs&education",
      url: "https://www.slideshare.net/slideshow/blogseducation/9087908",
      description: "SlideShare-esitys",
      categories: [],
      keywords: [],
      source: "slideshare"
    });

    assert.ok(metadata.categories.includes("Koulutusteknologia"));
    assert.ok(metadata.keywords.includes("blogit"));
  });

  test("pistemaista kuvausta pidetaan geneerisena ja transcripti voi tuoda metadatan", () => {
    const metadata = derivePresentationMetadata({
      title: "Tuulta purjeisiin ja täyttä vauhtia kohti tuulimyllyjä",
      url: "https://www.slideshare.net/slideshow/tuulta-purjeisiin-ja-tytt-vauhtia-kohti-tuulimyllyj/52076297",
      description: ".",
      categories: [],
      keywords: [],
      source: "slideshare"
    });

    assert.notEqual(metadata.description, ".");
    assert.ok(metadata.categories.includes("Koulutusteknologia"));
    assert.ok(metadata.keywords.length > 0);
  });

  test("Canva-esitys saa rich-analyysista avainsanat, kielen ja diamäärän", () => {
    const metadata = derivePresentationMetadata({
      title: "Kempele VESO 2026",
      description: "Opettajien työyhteisökoulutus Kempeleen kouluille tekoälyn ja digitaalisen oppimisen teemoista.",
      sourceUrl: "https://www.canva.com/d/cbYXXNXQtLqaOC",
      publicUrl: "https://www.canva.com/d/cbYXXNXQtLqaOC",
      pageUrl: "/presentations/kempele-veso-2026/",
      categories: ["VESO", "Opettajankoulutus", "Tekoäly"],
      keywords: []
    });

    assert.ok(metadata.keywords.includes("tekoälylukutaito"));
    assert.ok(metadata.keywords.includes("opettajien täydennyskoulutus"));
    assert.ok(metadata.keywords.includes("EU AI Act"));
    assert.equal(metadata.sourceLanguage, "fi");
    assert.equal(metadata.slideCount, 59);
  });

  test("Canva-esitys ilman rich-mappausta saa avainsanoja omasta sisallostaan", () => {
    const metadata = derivePresentationMetadata({
      title: "Luento 4: Ohjelmointiosaaminen",
      description: "Yliopistokurssille tuotettu luento ohjelmointiosaamisen perusteista ja sen merkityksestä digitaalisen ajan opetuksessa.",
      sourceUrl: "https://www.canva.com/d/_K98Sie1DPAYz2E",
      publicUrl: "https://www.canva.com/d/_K98Sie1DPAYz2E",
      pageUrl: "/presentations/luento-4-ohjelmointiosaaminen/",
      categories: ["Ohjelmointi", "Luento", "Opettajankoulutus"],
      keywords: []
    });

    assert.ok(metadata.keywords.includes("ohjelmointi"));
    assert.ok(metadata.keywords.includes("opettajankoulutus"));
    assert.equal(metadata.sourceLanguage, undefined);
    assert.equal(metadata.slideCount, undefined);
  });

  test("ei-slideshare-sisalto sailyy ennallaan", () => {
    const metadata = derivePresentationMetadata({
      title: "Canva-esitys",
      description: "Rikas kuvaus jo olemassa",
      categories: ["Tekoäly"],
      keywords: ["Generation AI"],
      source: "canva"
    });

    assert.equal(metadata.description, "Rikas kuvaus jo olemassa");
    assert.deepEqual(metadata.categories, ["Tekoäly"]);
    assert.deepEqual(metadata.keywords, ["Generation AI"]);
    assert.equal(metadata.sourceLanguage, undefined);
  });
});

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  deriveThesisCategories,
  deriveThesisContexts,
  deriveThesisMetadata
} = require("../../src/_utils/thesisDerivedMetadata");

describe("deriveThesisCategories", () => {
  test("tekoälylukutaitoon liittyvä opinnäyte saa aiheen ja koulutusasteen kategoriat", () => {
    const categories = deriveThesisCategories({
      researchLine: "ai-literacy",
      researchThemes: ["tekoalylukutaito", "koneoppiminen"],
      researchAudience: ["esi-ja-perusopetus", "opettajankoulutus"]
    });

    assert.deepEqual(categories, [
      "Tekoäly",
      "Perusopetus",
      "Opettajankoulutus",
      "Yliopisto ja korkeakoulut"
    ]);
  });

  test("pitkän linjan oppimisympäristöteema ei enää yksin lisää ympäristökategoriaa", () => {
    const categories = deriveThesisCategories({
      researchLine: "long-term-learning",
      researchThemes: ["oppimisymparistot", "mobiilioppiminen"],
      researchAudience: ["korkeakoulutus"]
    });

    assert.deepEqual(categories, [
      "Koulutusteknologia",
      "Yliopisto ja korkeakoulut"
    ]);
  });

  test("eksplisiittinen oppimisympäristösignaali lisää ympäristökategorian", () => {
    const categories = deriveThesisCategories({
      title: "Opettajien kokemuksia avoimesta oppimisympäristöstä",
      keywords: ["oppimisympäristö", "luokkahuone"]
    });

    assert.deepEqual(categories, ["Oppimisympäristöt ja tilat"]);
  });

  test("ilman vahvaa signaalia ei keksitä geneeristä kategoriaa", () => {
    const categories = deriveThesisCategories({});
    assert.deepEqual(categories, []);
  });

  test("yleinen researchLine tai audience ei yksin riitä sivistys-kategoriaan", () => {
    const categories = deriveThesisCategories({
      researchLine: "adjacent-education",
      researchAudience: ["opettajat"]
    });

    assert.deepEqual(categories, []);
  });

  test("hyvinvointi- ja tunnetaitosignaalit eivät yksin tee sivistys-kategoriaa", () => {
    const categories = deriveThesisCategories({
      title: "Nuorten kokemuksia sosiaalisen median vaikutuksista itsetuntoon",
      keywords: ["nuoruus", "itsetunto", "tunnetaidot", "sosiaalinen media"]
    });

    assert.deepEqual(categories, ["Koulutusteknologia"]);
  });

  test("luokanopettajaopiskelija ei enää yksin lisää perusopetus-kategoriaa", () => {
    const categories = deriveThesisCategories({
      title: "Luokanopettajaopiskelijoiden kokemuksia tekoälylukutaidosta",
      researchAudience: ["opettajankoulutus"]
    });

    assert.deepEqual(categories.slice().sort(), [
      "Tekoäly",
      "Opettajankoulutus",
      "Yliopisto ja korkeakoulut"
    ].sort());
  });
});

describe("deriveThesisContexts", () => {
  test("opettajankoulutuksen thesis saa tutkimus-, koulutus- ja opetuskontekstin", () => {
    const contexts = deriveThesisContexts({
      title: "Opettajaopiskelijoiden tekoälylukutaito",
      abstract: "Tutkimus käsittelee opettajankoulutusta ja opetuksen kehittämistä.",
      researchLine: "teacher-education",
      researchThemes: ["opettajankoulutus", "digipedagogiikka"],
      researchAudience: ["opettajankoulutus", "opettajat"]
    });

    assert.deepEqual(contexts, ["education", "research", "teaching"]);
  });

  test("ilman koulutus- tai opetussignaaleja jää vain tutkimuskonteksti", () => {
    const contexts = deriveThesisContexts({
      title: "Organizational learning and temporality during post-merger integration process",
      keywords: ["Post-merger integration process", "Organizational learning", "Temporality"]
    });

    assert.deepEqual(contexts, ["research"]);
  });

  test("yleinen oppimissignaali ei enää yksin lisää teaching-kontekstia", () => {
    const contexts = deriveThesisContexts({
      title: "6-luokkalaisten kokemuksia matematiikka-ahdistuksesta",
      keywords: ["matematiikan oppimisvaikeudet", "matemaattinen itseluottamus"],
      researchAudience: ["perusopetus"]
    });

    assert.deepEqual(contexts, ["education", "research"]);
  });

  test("koulutusteknologia ei enää yksin lisää education-kontekstia", () => {
    const contexts = deriveThesisContexts({
      title: "Assessment of the Building Situation Tool adoption among firefighters",
      keywords: ["technology self-efficacy", "user experience", "disaster"]
    }, ["Koulutusteknologia"]);

    assert.deepEqual(contexts, ["research"]);
  });

  test("oppimisymparistot ja tilat ei enää yksin lisää education-kontekstia", () => {
    const contexts = deriveThesisContexts({
      title: "Kokemuksia siirtymisestä avoimeen oppimisympäristöön",
      keywords: ["oppimisympäristö"]
    }, ["Oppimisympäristöt ja tilat"]);

    assert.deepEqual(contexts, ["research"]);
  });

  test("luokanopettaja-yhdyssana ei enää yksin lisää teaching-kontekstia", () => {
    const contexts = deriveThesisContexts({
      title: "Luokanopettajien käsityksiä oppilaiden koulumotivaatiosta",
      researchAudience: ["perusopetus"]
    });

    assert.deepEqual(contexts, ["education", "research"]);
  });

  test("eksplisiittinen opetussignaali säilyttää teaching-kontekstin", () => {
    const contexts = deriveThesisContexts({
      title: "Kuinka opettaa vaikuttamisen keinoja tekemällä mainosmusiikkia?",
      keywords: ["Säveltämisen pedagogiikka", "Vaikuttamisen keinot"],
      researchAudience: ["perusopetus"]
    });

    assert.deepEqual(contexts, ["education", "research", "teaching"]);
  });
});

describe("deriveThesisMetadata", () => {
  test("palauttaa categories + contexts samalla kertaa", () => {
    const metadata = deriveThesisMetadata({
      title: "Varhaiskasvatuksen ohjelmointikasvatus",
      abstract: "Ohjelmoinnillisen ajattelun mahdollisuudet varhaiskasvatuksessa.",
      researchThemes: ["ohjelmoinnillinen-ajattelu", "teknologiakasvatus"],
      researchAudience: ["varhaiskasvatus"]
    });

    assert.deepEqual(metadata.categories, [
      "Teknologia ja digitaalisuus",
      "Varhaiskasvatus",
      "Koulutusteknologia"
    ]);
    assert.deepEqual(metadata.contexts, ["education", "research"]);
  });
});

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  decodeHtmlEntities,
  transcriptExcerpt
} = require("../../src/_data/presentationsPage");

describe("decodeHtmlEntities", () => {
  test("dekoodaa nimetyt entiteetit joita SlideShare-transkriptit sisältävät", () => {
    assert.equal(decodeHtmlEntities("Arviointi&quot;Opiskelijan"), 'Arviointi"Opiskelijan');
    assert.equal(decodeHtmlEntities("&lt;p&gt;text&lt;/p&gt;"), "<p>text</p>");
    assert.equal(decodeHtmlEntities("Doe&apos;s"), "Doe's");
    assert.equal(decodeHtmlEntities("A&nbsp;B"), "A B");
  });

  test("dekoodaa numeeriset entiteetit", () => {
    assert.equal(decodeHtmlEntities("&#34;quoted&#34;"), '"quoted"');
    assert.equal(decodeHtmlEntities("&#x22;hex&#x22;"), '"hex"');
  });

  test("dekoodaa &amp; viimeisenä eikä kaksinkertaista", () => {
    // Yksinkertainen &amp; puretaan &-merkiksi
    assert.equal(decodeHtmlEntities("Rock &amp; Roll"), "Rock & Roll");
    // Kaksinkertainen &amp;quot; puretaan täsmälleen kerran (&amp; viimeisenä
    // → jää &quot; jos tavoite olisi kaksinkertainen dekoodaus. Meille riittää
    // yksi kierros: source data sisältää joko &quot; TAI &amp;quot;, ei
    // molempia päällekkäin.)
    assert.equal(decodeHtmlEntities("&amp;quot;"), '&quot;');
  });

  test("tyhjä/undefined syöte on turvallista", () => {
    assert.equal(decodeHtmlEntities(""), "");
    assert.equal(decodeHtmlEntities(null), "");
    assert.equal(decodeHtmlEntities(undefined), "");
  });

  test("ei-entiteetti-teksti säilyy muuttumattomana", () => {
    assert.equal(
      decodeHtmlEntities("Koe oppimisympäristönä 2009-11-20"),
      "Koe oppimisympäristönä 2009-11-20"
    );
  });
});

describe("transcriptExcerpt", () => {
  test("purkaa entiteetit ennen tekstin normalisointia", () => {
    // Reprodusoi ss-koe-oppimisymparistona-osa-i -presentaation
    // SlideShare-transcript-fragmentin, jossa &quot; on skreipattu
    // sisään lainausmerkin sijaan. Odotettu tulos on plain-tekstin
    // lainausmerkki, ei HTML-entiteetti.
    const transcript =
      "Arviointi lukiolaissa&quot;Opiskelijan arvioinnilla pyritään ohjaamaan.&quot;";
    const excerpt = transcriptExcerpt(transcript);
    assert.equal(excerpt.includes("&quot;"), false);
    assert.equal(excerpt.includes('"Opiskelijan'), true);
    assert.equal(excerpt.includes('.".'), false);
  });

  test("normalisoi --- erottimet ja whitespace-kollapsit", () => {
    assert.equal(
      transcriptExcerpt("A\n---\nB\n---\n  C"),
      "A B C"
    );
  });

  test("katkaisee pitkän tekstin ja lisää ellipsin", () => {
    const long = "x".repeat(500);
    const excerpt = transcriptExcerpt(long, 100);
    assert.equal(excerpt.endsWith("…"), true);
    assert.equal(excerpt.length <= 101, true);
  });

  test("tyhjä transcript palauttaa tyhjän merkkijonon", () => {
    assert.equal(transcriptExcerpt(""), "");
    assert.equal(transcriptExcerpt(null), "");
  });
});

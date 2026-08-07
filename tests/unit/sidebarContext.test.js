/**
 * Testit `sidebarContext(data, lang)` -filtterille.
 *
 * Lukitsee sivupalkin nykyisen kayttaytymisen (rikkaammat labelit ja
 * URL-parametreilliset archiveHref:it) jotta refaktori ei muuta sivuja.
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const sidebarContext = require("../../src/_utils/sidebarContext");

// -----------------------------------------------------------------------------
// Media
// -----------------------------------------------------------------------------
describe("sidebarContext: media", () => {
  const base = { tags: ["media"] };

  test("mediaType=podcast => 'Podcast'", () => {
    const r = sidebarContext({ ...base, mediaType: "podcast" }, "fi");
    assert.equal(r.typeLabel, "Podcast");
    assert.equal(r.archiveHref, "/mediassa/");
    assert.equal(r.archiveLabel, "Kaikki mediaosumat");
  });

  test("mediaType=video => 'Mediaosuma / video' (rikkaampi kuin resolver)", () => {
    const r = sidebarContext({ ...base, mediaType: "video" }, "fi");
    assert.equal(r.typeLabel, "Mediaosuma / video");
  });

  test("mediaType=radio => 'Mediaosuma / radio'", () => {
    const r = sidebarContext({ ...base, mediaType: "radio" }, "fi");
    assert.equal(r.typeLabel, "Mediaosuma / radio");
  });

  test("mediaType=article => 'Mediaosuma / lehtijuttu'", () => {
    const r = sidebarContext({ ...base, mediaType: "article" }, "fi");
    assert.equal(r.typeLabel, "Mediaosuma / lehtijuttu");
  });

  test("mediaType=assignment => 'Asiantuntijatehtava'", () => {
    const r = sidebarContext({ ...base, mediaType: "assignment" }, "fi");
    assert.equal(r.typeLabel, "Asiantuntijatehtävä");
  });

  test("mediaRole=expertAssignment => 'Asiantuntijatehtava'", () => {
    const r = sidebarContext({ ...base, mediaRole: "expertAssignment" }, "fi");
    assert.equal(r.typeLabel, "Asiantuntijatehtävä");
  });

  test("mediaType puuttuu => 'Mediaosuma' fallback", () => {
    const r = sidebarContext({ ...base }, "fi");
    assert.equal(r.typeLabel, "Mediaosuma");
  });

  test("media en: archiveHref => /mediassa/ (EN kayttaa samaa)", () => {
    const r = sidebarContext({ ...base, mediaType: "podcast" }, "en");
    assert.equal(r.archiveHref, "/mediassa/");
    assert.equal(r.archiveLabel, "All media items");
  });
});

// -----------------------------------------------------------------------------
// Presentations
// -----------------------------------------------------------------------------
describe("sidebarContext: presentations", () => {
  test("tags=presentations => 'Esitys tai materiaali' + /esitykset/", () => {
    const r = sidebarContext({ tags: ["presentations"] }, "fi");
    assert.equal(r.typeLabel, "Esitys tai materiaali");
    assert.equal(r.archiveHref, "/esitykset/");
    assert.equal(r.archiveLabel, "Kaikki esitykset");
  });

  test("tags=presentations en => 'Presentation or material'", () => {
    const r = sidebarContext({ tags: ["presentations"] }, "en");
    assert.equal(r.typeLabel, "Presentation or material");
    assert.equal(r.archiveHref, "/en/presentations/");
  });
});

// -----------------------------------------------------------------------------
// Blog
// -----------------------------------------------------------------------------
describe("sidebarContext: blog", () => {
  test("tags=blog => 'Blogikirjoitus' + /blogi/", () => {
    const r = sidebarContext({ tags: ["blog"] }, "fi");
    assert.equal(r.typeLabel, "Blogikirjoitus");
    assert.equal(r.archiveHref, "/blogi/");
  });

  test("tags=blog en", () => {
    const r = sidebarContext({ tags: ["blog"] }, "en");
    assert.equal(r.typeLabel, "Blog post");
    assert.equal(r.archiveHref, "/en/blog/");
  });
});

// -----------------------------------------------------------------------------
// Puheet (speechContext-erottelu)
// -----------------------------------------------------------------------------
describe("sidebarContext: puheet", () => {
  test("type=puhe + speechContext=valtuusto => 'Valtuustopuheenvuoro'", () => {
    const r = sidebarContext({ type: "puhe", speechContext: "valtuusto" }, "fi");
    assert.equal(r.typeLabel, "Valtuustopuheenvuoro");
    assert.equal(r.archiveHref, "/valtuustotyo/#puheet");
  });

  test("type=puhe + speechContext=kyselytunti => 'Valtuuston kyselytunti'", () => {
    const r = sidebarContext({ type: "puhe", speechContext: "kyselytunti" }, "fi");
    assert.equal(r.typeLabel, "Valtuuston kyselytunti");
  });

  test("type=puhe + agenda_title=Valtuuston kyselytunti => 'Valtuuston kyselytunti'", () => {
    const r = sidebarContext(
      { type: "puhe", agenda_title: "Valtuuston kyselytunti" },
      "fi"
    );
    assert.equal(r.typeLabel, "Valtuuston kyselytunti");
  });

  test("type=puhe + speechContext=akateeminen-puhe => 'Akateeminen puhe'", () => {
    const r = sidebarContext({ type: "puhe", speechContext: "akateeminen-puhe" }, "fi");
    assert.equal(r.typeLabel, "Akateeminen puhe");
    assert.equal(r.archiveHref, "/lausunnot/#julkiset-puheet");
  });

  test("type=puhe + speechContext=juhlapuhe => 'Juhlapuhe'", () => {
    const r = sidebarContext({ type: "puhe", speechContext: "juhlapuhe" }, "fi");
    assert.equal(r.typeLabel, "Juhlapuhe");
  });

  test("type=puhe ilman speechContext => 'Julkinen puhe'", () => {
    const r = sidebarContext({ type: "puhe" }, "fi");
    assert.equal(r.typeLabel, "Julkinen puhe");
  });
});

// -----------------------------------------------------------------------------
// Lausunto
// -----------------------------------------------------------------------------
describe("sidebarContext: lausunto", () => {
  test("type=lausunto => 'Asiantuntijalausunto'", () => {
    const r = sidebarContext({ type: "lausunto" }, "fi");
    assert.equal(r.typeLabel, "Asiantuntijalausunto");
    assert.equal(r.archiveHref, "/lausunnot/#lausunnot");
  });
});

// -----------------------------------------------------------------------------
// Mielipiteet (opinionRoles-erottelu — rikkaampi kuin resolver)
// -----------------------------------------------------------------------------
describe("sidebarContext: mielipiteet", () => {
  test("opinionRoles=[political,expert] => hybridi", () => {
    const r = sidebarContext({ type: "mielipide", opinionRoles: ["political", "expert"] }, "fi");
    assert.equal(r.typeLabel, "Poliittinen ja asiantuntijamielipide");
    assert.equal(r.archiveHref, "/kirjoitukset/?opinions=hybrid#mielipiteet");
  });

  test("opinionRoles=[political] => 'Poliittinen mielipide'", () => {
    const r = sidebarContext({ type: "mielipide", opinionRoles: ["political"] }, "fi");
    assert.equal(r.typeLabel, "Poliittinen mielipide");
    assert.equal(r.archiveHref, "/kirjoitukset/?opinions=political#mielipiteet");
  });

  test("opinionRoles=[expert] => 'Asiantuntijamielipide'", () => {
    const r = sidebarContext({ type: "mielipide", opinionRoles: ["expert"] }, "fi");
    assert.equal(r.typeLabel, "Asiantuntijamielipide");
    assert.equal(r.archiveHref, "/kirjoitukset/?opinions=expert#mielipiteet");
  });

  test("opinionRoles puuttuu => 'Mielipide'", () => {
    const r = sidebarContext({ type: "mielipide" }, "fi");
    assert.equal(r.typeLabel, "Mielipide");
    assert.equal(r.archiveHref, "/kirjoitukset/#mielipiteet");
  });
});

// -----------------------------------------------------------------------------
// Kolumni
// -----------------------------------------------------------------------------
describe("sidebarContext: kolumni", () => {
  test("type=kolumni => 'Kolumni'", () => {
    const r = sidebarContext({ type: "kolumni" }, "fi");
    assert.equal(r.typeLabel, "Kolumni");
    assert.equal(r.archiveHref, "/kirjoitukset/#kolumnit");
  });
});

// -----------------------------------------------------------------------------
// Politics (tag)
// -----------------------------------------------------------------------------
describe("sidebarContext: politics", () => {
  test("tags=politics => 'Valtuustoaloite'", () => {
    const r = sidebarContext({ tags: ["politics"] }, "fi");
    assert.equal(r.typeLabel, "Valtuustoaloite");
    assert.equal(r.archiveHref, "/valtuustotyo/#aloitteet");
  });
});

// -----------------------------------------------------------------------------
// Prioriteettijarjestys ja fallback
// -----------------------------------------------------------------------------
describe("sidebarContext: prioriteetti + fallback", () => {
  test("media voittaa presentations", () => {
    const r = sidebarContext({ tags: ["media", "presentations"], mediaType: "podcast" }, "fi");
    assert.equal(r.typeLabel, "Podcast");
  });

  test("presentations voittaa blog", () => {
    const r = sidebarContext({ tags: ["presentations", "blog"] }, "fi");
    assert.equal(r.typeLabel, "Esitys tai materiaali");
  });

  test("blog voittaa type=puhe", () => {
    const r = sidebarContext({ tags: ["blog"], type: "puhe" }, "fi");
    assert.equal(r.typeLabel, "Blogikirjoitus");
  });

  test("tyhja data + fi => 'Kirjoitus'", () => {
    const r = sidebarContext({}, "fi");
    assert.equal(r.typeLabel, "Kirjoitus");
    assert.equal(r.archiveHref, "/kynasta/");
  });

  test("tyhja data + en => 'Text'", () => {
    const r = sidebarContext({}, "en");
    assert.equal(r.typeLabel, "Text");
    assert.equal(r.archiveHref, "/en/writings/");
  });
});

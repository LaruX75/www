const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const nunjucks = require("nunjucks");

const includesDir = path.join(__dirname, "..", "..", "src", "_includes");

let env;

before(() => {
  env = new nunjucks.Environment(new nunjucks.FileSystemLoader(includesDir), {
    autoescape: true
  });
});

function renderMacro(callExpression) {
  return env
    .renderString(
      `{% import "_nav-macros.njk" as nav %}${callExpression}`,
      {}
    )
    .trim();
}

describe("mobileJumpLink (SSR mega-menu mobile jump)", () => {
  test("FI: renders anchor with class, href, aria-label, icon, and prefix", () => {
    const html = renderMacro(
      `{{ nav.mobileJumpLink('/tietoa/', 'Minä', 'Siirry sivulle:') }}`
    );

    assert.match(html, /<a class="mega-mobile-jump" href="\/tietoa\/"/);
    assert.match(html, /aria-label="Siirry sivulle: Minä"/);
    assert.match(html, /<i class="bi bi-arrow-up-right-circle me-2"><\/i>/);
    assert.match(html, />Siirry sivulle: Minä<\/a>/);
    // Exactly one anchor per call.
    assert.equal(html.match(/<a /g).length, 1);
  });

  test("EN: renders anchor with English prefix and label", () => {
    const html = renderMacro(
      `{{ nav.mobileJumpLink('/en/about/', 'Me', 'Go to page:') }}`
    );

    assert.match(html, /<a class="mega-mobile-jump" href="\/en\/about\/"/);
    assert.match(html, /aria-label="Go to page: Me"/);
    assert.match(html, />Go to page: Me<\/a>/);
    assert.equal(html.match(/<a /g).length, 1);
  });

  test("empty URL renders no anchor", () => {
    const html = renderMacro(
      `{{ nav.mobileJumpLink('', 'Minä', 'Siirry sivulle:') }}`
    );
    assert.equal(html.includes("<a"), false);
    assert.equal(html.includes("mega-mobile-jump"), false);
  });

  test("placeholder URL '#' renders no anchor (matches legacy JS guard)", () => {
    const html = renderMacro(
      `{{ nav.mobileJumpLink('#', 'Minä', 'Siirry sivulle:') }}`
    );
    assert.equal(html.includes("<a"), false);
    assert.equal(html.includes("mega-mobile-jump"), false);
  });

  test("title with special characters is HTML-escaped in aria-label and visible text", () => {
    const html = renderMacro(
      `{{ nav.mobileJumpLink('/yhteystiedot/', 'Ota yhteyttä', 'Siirry sivulle:') }}`
    );

    assert.match(html, /aria-label="Siirry sivulle: Ota yhteyttä"/);
    assert.match(html, />Siirry sivulle: Ota yhteyttä<\/a>/);
  });
});

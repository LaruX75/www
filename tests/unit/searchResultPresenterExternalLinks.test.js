const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const MODULE_PATH = path.resolve(__dirname, "../../src/js/search-result-presenter.js");
const MODULE_SOURCE = fs.readFileSync(MODULE_PATH, "utf8");

function loadPresenter({ lang = "fi", hostname = "example.com" } = {}) {
  const context = {
    window: {
      location: { origin: `https://${hostname}`, hostname }
    },
    document: {
      documentElement: { lang }
    },
    URL
  };
  vm.runInNewContext(MODULE_SOURCE, context, { filename: MODULE_PATH });
  return context.window.SearchResultPresenter;
}

function presentationResult(url, title = "Esitys") {
  return {
    url,
    title,
    excerpt: "",
    filters: { "Sisältö": ["Esitykset"] },
    meta: {
      PresentationYear: "2026",
      PresentationType: "keynote",
      PresentationEvent: "Test event"
    }
  };
}

describe("SearchResultPresenter isExternalUrl", () => {
  test("relative URL is not external", () => {
    const presenter = loadPresenter();
    assert.equal(presenter.isExternalUrl("/presentations/foo/"), false);
  });

  test("empty or null URL is not external", () => {
    const presenter = loadPresenter();
    assert.equal(presenter.isExternalUrl(""), false);
    assert.equal(presenter.isExternalUrl(null), false);
    assert.equal(presenter.isExternalUrl(undefined), false);
  });

  test("absolute https URL to third-party host is external", () => {
    const presenter = loadPresenter();
    assert.equal(presenter.isExternalUrl("https://canva.link/vqtdccorb3yxb9h"), true);
    assert.equal(presenter.isExternalUrl("https://www.canva.com/d/foo"), true);
    assert.equal(presenter.isExternalUrl("https://www.youtube.com/playlist?list=abc"), true);
  });

  test("absolute URL to jarilaru.fi is NOT external (hostname guard)", () => {
    const presenter = loadPresenter();
    assert.equal(presenter.isExternalUrl("https://jarilaru.fi/esitykset/"), false);
    assert.equal(presenter.isExternalUrl("https://www.jarilaru.fi/esitykset/"), false);
  });

  test("absolute URL matching window.location.hostname is NOT external (hostname guard)", () => {
    const presenter = loadPresenter({ hostname: "staging.example.test" });
    assert.equal(presenter.isExternalUrl("https://staging.example.test/foo/"), false);
    assert.equal(presenter.isExternalUrl("https://other.example.test/foo/"), true);
  });

  test("non-http protocols are not external (safety guard)", () => {
    const presenter = loadPresenter();
    assert.equal(presenter.isExternalUrl("javascript:alert(1)"), false);
    assert.equal(presenter.isExternalUrl("mailto:test@example.com"), false);
    assert.equal(presenter.isExternalUrl("ftp://example.com/file"), false);
  });
});

describe("SearchResultPresenter renderSharedCard external link handling", () => {
  test("local URL renders bare title link without target/rel/icon", () => {
    const presenter = loadPresenter();
    const html = presenter.renderSharedCard(presentationResult("/presentations/local/"));
    assert.match(html, /<a class="find-explore-result-title" href="\/presentations\/local\/">/);
    assert.doesNotMatch(html, /target="_blank"/);
    assert.doesNotMatch(html, /rel="noopener/);
    assert.doesNotMatch(html, /bi-box-arrow-up-right/);
    assert.doesNotMatch(html, /aria-label=/);
  });

  test("external URL adds target=_blank, rel=noopener noreferrer, external icon and aria-label", () => {
    const presenter = loadPresenter({ lang: "fi" });
    const html = presenter.renderSharedCard(
      presentationResult("https://canva.link/vqtdccorb3yxb9h", "Canva-esitys")
    );
    assert.match(html, /href="https:\/\/canva\.link\/vqtdccorb3yxb9h"/);
    assert.match(html, /target="_blank"/);
    assert.match(html, /rel="noopener noreferrer"/);
    assert.match(html, /<i class="bi bi-box-arrow-up-right ms-1 opacity-75" aria-hidden="true"><\/i>/);
    assert.match(html, /aria-label="Canva-esitys \(avautuu uuteen välilehteen\)"/);
  });

  test("external URL on EN surface uses English aria-label suffix", () => {
    const presenter = loadPresenter({ lang: "en" });
    const html = presenter.renderSharedCard(
      presentationResult("https://canva.link/foo", "Canva talk")
    );
    assert.match(html, /aria-label="Canva talk \(opens in a new tab\)"/);
  });

  test("absolute URL to jarilaru.fi is treated as local (no target)", () => {
    const presenter = loadPresenter();
    const html = presenter.renderSharedCard(
      presentationResult("https://jarilaru.fi/presentations/foo/", "Sisäinen esitys")
    );
    assert.doesNotMatch(html, /target="_blank"/);
    assert.doesNotMatch(html, /bi-box-arrow-up-right/);
  });
});

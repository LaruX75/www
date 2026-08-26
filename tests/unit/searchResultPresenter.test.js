const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const MODULE_PATH = path.resolve(__dirname, "../../src/js/search-result-presenter.js");
const MODULE_SOURCE = fs.readFileSync(MODULE_PATH, "utf8");

function loadPresenter({ lang = "fi", origin = "https://example.com" } = {}) {
  const context = {
    window: {
      location: { origin }
    },
    document: {
      documentElement: { lang }
    },
    URL
  };
  vm.runInNewContext(MODULE_SOURCE, context, { filename: MODULE_PATH });
  return context.window.SearchResultPresenter;
}

function mediaResult(meta = {}, overrides = {}) {
  return {
    url: overrides.url || "/mediassa/testi/",
    title: overrides.title || "Media title",
    excerpt: overrides.excerpt || "Excerpt with <mark>highlight</mark>.",
    filters: {
      "Sisältö": ["Mediassa"]
    },
    meta: {
      year: "2026",
      ...meta
    }
  };
}

function toPlainArray(value) {
  return Array.from(value || []);
}

describe("SearchResultPresenter media shared cards", () => {
  test("FI primary meta includes localized type, role and outlet", () => {
    const presenter = loadPresenter({ lang: "fi" });
    const meta = presenter.primaryMetaFor("media", mediaResult({
      mediaType: "podcast",
      mediaTypeLabelFi: "Podcast",
      mediaRole: "interviewer",
      mediaRoleLabelFi: "Haastattelijana",
      mediaOutlet: "Yle"
    }));

    assert.deepEqual(toPlainArray(meta), ["Podcast", "Haastattelijana", "Yle"]);
  });

  test("EN primary meta uses EN labels on EN search surfaces", () => {
    const presenter = loadPresenter({ lang: "en" });
    const meta = presenter.primaryMetaFor("media", mediaResult({
      mediaType: "article",
      mediaTypeLabelEn: "Article",
      mediaRole: "about",
      mediaRoleLabelEn: "About my work",
      mediaOutlet: "INOS Project"
    }));

    assert.deepEqual(toPlainArray(meta), ["Article", "About my work", "INOS Project"]);
  });

  test("unknown media enums fall back to humanized raw values", () => {
    const presenter = loadPresenter({ lang: "fi" });
    const meta = presenter.primaryMetaFor("media", mediaResult({
      mediaType: "panelDiscussion",
      mediaTypeLabelFi: "Media",
      mediaRole: "expertGuest",
      mediaRoleLabelFi: "Media",
      mediaOutlet: ""
    }));

    assert.deepEqual(toPlainArray(meta), ["Panel Discussion", "Expert Guest"]);
  });

  test("renderSharedCard adds a decorative lazy-loaded thumbnail for media results", () => {
    const presenter = loadPresenter({ lang: "fi", origin: "https://gen-ai.fi" });
    const html = presenter.renderSharedCard(mediaResult({
      mediaType: "video",
      mediaTypeLabelFi: "Video",
      mediaRole: "guest",
      mediaRoleLabelFi: "Vieraana",
      mediaOutlet: "YouTube",
      thumbnail: "/images/media-thumb.jpg"
    }));

    assert.match(html, /find-explore-result--with-thumbnail/);
    assert.match(html, /data-find-explore-card-line="thumbnail"/);
    assert.match(html, /<img class="find-explore-result-media-thumb-image"/);
    assert.match(html, /src="https:\/\/gen-ai\.fi\/images\/media-thumb\.jpg"/);
    assert.match(html, /alt=""/);
    assert.match(html, /loading="lazy"/);
  });

  test("renderSharedCard omits malformed thumbnails and keeps the existing card layout", () => {
    const presenter = loadPresenter({ lang: "fi" });
    const html = presenter.renderSharedCard(mediaResult({
      mediaType: "podcast",
      mediaTypeLabelFi: "Podcast",
      mediaRole: "interviewer",
      mediaRoleLabelFi: "Haastattelijana",
      thumbnail: "javascript:alert(1)"
    }));

    assert.doesNotMatch(html, /find-explore-result--with-thumbnail/);
    assert.doesNotMatch(html, /find-explore-result-media-thumb/);
    assert.match(html, /find-explore-result--media/);
  });

  test("known media type and role labels survive projection without filtering", () => {
    const presenter = loadPresenter({ lang: "en" });
    const typeCases = [
      ["podcast", "Podcast"],
      ["assignment", "Expert assignment"],
      ["article", "Article"],
      ["pressRelease", "Press release"],
      ["tv", "TV"],
      ["radio", "Radio"],
      ["video", "Video"]
    ];
    const roleCases = [
      ["about", "About my work"],
      ["expertAssignment", "Expert role"],
      ["interviewer", "As interviewer"],
      ["guest", "As guest"]
    ];

    for (const [mediaType, label] of typeCases) {
      const meta = presenter.primaryMetaFor("media", mediaResult({
        mediaType,
        mediaTypeLabelEn: label
      }));
      assert.equal(meta[0], label);
    }

    for (const [mediaRole, label] of roleCases) {
      const meta = presenter.primaryMetaFor("media", mediaResult({
        mediaRole,
        mediaRoleLabelEn: label
      }));
      assert.equal(meta[0], label);
    }
  });
});

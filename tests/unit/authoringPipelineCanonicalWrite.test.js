/**
 * AUTHORING-PIPELINE-03 — canonical write regression tests.
 *
 * Every test uses a temporary Presentations root (not the real
 * src/presentations/ tree) so no test writes fake canonical content
 * into the shipped corpus. The writer accepts a `root` option
 * specifically to make this test-injection safe.
 *
 * Round-trip proof: after atomic write, the on-disk file is re-parsed
 * with gray-matter and re-validated by the shared canonical validator.
 * This tests the serializer parity contract, not the in-memory draft.
 *
 * Ref: docs/authoring-pipeline-03-canonical-write-2026-08-31.md
 */
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const matter = require("gray-matter");

const {
  assertPublicationWriteUnsupported,
  assertSafeSlug,
  pickCanonicalFrontMatter,
  resolvePresentationDestination,
  roundTripValidatePresentation,
  serializePresentationDraft,
  writePresentationCanonical,
  PRESENTATION_CANONICAL_FIELDS
} = require("../../scripts/_lib/authoring/canonicalWriter");

function makeTempRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "ap03-write-"));
}

function validDraft(overrides = {}) {
  return {
    slug: "kempele-veso-test-only-2026",
    pageUrl: "/presentations/kempele-veso-test-only-2026/",
    frontMatter: {
      title: "Kempele VESO 2026 (test-only)",
      description: "Test-only canonical draft for AP-03 round-trip proof.",
      date: "2026-01-21",
      url: "https://www.canva.com/d/cbYXXNXQtLqaOC",
      sourceUrl: "https://www.canva.com/d/cbYXXNXQtLqaOC",
      thumbnail: "https://design.canva.ai/R9Uqq5WQ1l-MRvt",
      source: "canva",
      type: "esitys",
      contexts: ["business"],
      permalink: "/presentations/kempele-veso-test-only-2026/",
      layout: "presentation-item.njk",
      templateEngineOverride: "md",
      // Diagnostic fields that MUST NOT leak into canonical Markdown.
      _providerName: "youtube-adapter",
      _fetchTimingMs: 1234,
      _previewPath: ".tmp/preview.html"
    },
    body: "AP-03 round-trip proof body.",
    ...overrides
  };
}

describe("AP-03 canonical writer — safety guards", () => {
  test("safe slug: rejects path traversal and separators", () => {
    for (const bad of ["", "  ", "../evil", "/abs", "a/b", "a\\b", "a..b", ".hidden", "-leading", "space slug", "a?b"]) {
      assert.throws(() => assertSafeSlug(bad), new RegExp("Canonical write blocked"),
        `slug "${bad}" must be rejected`);
    }
  });

  test("safe slug: accepts realistic canonical slugs", () => {
    for (const good of ["kempele-veso-2026", "arjen-tekoalyhaaste", "riihim-ki-veso-2026"]) {
      assert.doesNotThrow(() => assertSafeSlug(good), `slug "${good}" must be accepted`);
    }
  });

  test("resolvePresentationDestination: destination must stay inside root", () => {
    const root = makeTempRoot();
    try {
      const { destination, exists } = resolvePresentationDestination({ slug: "arjen-tekoalyhaaste", root });
      assert.equal(destination, path.join(root, "arjen-tekoalyhaaste.md"));
      assert.equal(exists, false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("assertPublicationWriteUnsupported: rejects Publication/DOI write domains", () => {
    for (const domain of ["publications", "Publication", "doi", "DOI"]) {
      assert.throws(() => assertPublicationWriteUnsupported({ domain }),
        new RegExp("Publication canonical write is not supported"),
        `domain "${domain}" must be rejected`);
    }
    // Presentation domain is fine.
    assert.doesNotThrow(() => assertPublicationWriteUnsupported({ domain: "presentations" }));
  });

  test("pickCanonicalFrontMatter: drops non-canonical / diagnostic fields", () => {
    const draft = validDraft();
    const cleaned = pickCanonicalFrontMatter(draft.frontMatter);
    assert.equal(cleaned._providerName, undefined);
    assert.equal(cleaned._fetchTimingMs, undefined);
    assert.equal(cleaned._previewPath, undefined);
    // Canonical fields preserved
    assert.equal(cleaned.title, "Kempele VESO 2026 (test-only)");
    assert.deepEqual(cleaned.contexts, ["business"]);
    // Every retained key belongs to the canonical allowlist
    for (const key of Object.keys(cleaned)) {
      assert.ok(PRESENTATION_CANONICAL_FIELDS.has(key), `unexpected key "${key}" in canonical frontmatter`);
    }
  });
});

describe("AP-03 canonical writer — write behaviour", () => {
  test("valid Presentation write creates the file with expected canonical shape", () => {
    const root = makeTempRoot();
    try {
      const draft = validDraft();
      const result = writePresentationCanonical({ draft, root });
      assert.equal(result.destination, path.join(root, `${draft.slug}.md`));
      assert.ok(fs.existsSync(result.destination), "destination must exist after write");

      const written = fs.readFileSync(result.destination, "utf8");
      const parsed = matter(written);
      // Reviewed values preserved verbatim
      assert.equal(parsed.data.title, "Kempele VESO 2026 (test-only)");
      assert.equal(String(parsed.data.date).slice(0, 10), "2026-01-21");
      assert.equal(parsed.data.sourceUrl, "https://www.canva.com/d/cbYXXNXQtLqaOC");
      assert.deepEqual(parsed.data.contexts, ["business"]);
      // Provider / diagnostic leakage: MUST be absent
      assert.equal(parsed.data._providerName, undefined);
      assert.equal(parsed.data._fetchTimingMs, undefined);
      assert.equal(parsed.data._previewPath, undefined);
      // Body preserved
      assert.match(String(parsed.content).trim(), /AP-03 round-trip proof body/);
      // Frontmatter delimiters
      assert.ok(written.startsWith("---\n"), "must begin with YAML frontmatter delimiter");
      assert.ok(written.includes("\n---\n"), "must contain closing YAML frontmatter delimiter");
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("existing destination is BLOCKED by default (no overwrite)", () => {
    const root = makeTempRoot();
    try {
      const draft = validDraft();
      writePresentationCanonical({ draft, root });
      assert.throws(
        () => writePresentationCanonical({ draft, root }),
        /destination already exists/,
        "second write must be blocked"
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("draft missing required title is BLOCKED before write", () => {
    const root = makeTempRoot();
    try {
      const draft = validDraft({
        frontMatter: {
          ...validDraft().frontMatter,
          title: ""
        }
      });
      assert.throws(
        () => writePresentationCanonical({ draft, root }),
        /pre-write validation failed|pakollinen kentta puuttuu/,
        "missing-title must be blocked"
      );
      // Destination must remain untouched
      assert.equal(fs.existsSync(path.join(root, `${draft.slug}.md`)), false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("missing explicit contexts is BLOCKED (contexts are editorial, never inferred)", () => {
    const root = makeTempRoot();
    try {
      const draft = validDraft({
        frontMatter: {
          ...validDraft().frontMatter,
          contexts: []
        }
      });
      assert.throws(
        () => writePresentationCanonical({ draft, root }),
        // Two acceptable error paths: (a) my writer's own explicit-contexts guard,
        // or (b) the shared validator's stricter "kontekstia ei saa arvata" check,
        // whichever runs first. Both prove editorial contexts are required.
        /explicit contexts required|kontekstia ei saa arvata/,
        "empty contexts must be blocked"
      );
      assert.equal(fs.existsSync(path.join(root, `${draft.slug}.md`)), false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("path traversal in slug is BLOCKED", () => {
    const root = makeTempRoot();
    try {
      const draft = validDraft({ slug: "../evil-slug" });
      assert.throws(
        () => writePresentationCanonical({ draft, root }),
        /Canonical write blocked/,
        "path traversal slug must be blocked"
      );
      // Nothing landed inside root or outside it.
      assert.equal(fs.readdirSync(root).length, 0);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("round-trip: written file re-parses cleanly and passes shared validation", () => {
    const root = makeTempRoot();
    try {
      const draft = validDraft();
      const result = writePresentationCanonical({ draft, root });
      // Re-parse from disk (independent of the write helper's internal round-trip).
      const raw = fs.readFileSync(result.destination, "utf8");
      const parsed = matter(raw);
      assert.equal(parsed.data.title, "Kempele VESO 2026 (test-only)");
      assert.equal(String(parsed.data.date).slice(0, 10), "2026-01-21");
      // Independent second round-trip via the writer's exposed helper.
      const rt = roundTripValidatePresentation({ destination: result.destination, useResolvedContexts: false });
      assert.equal(rt.errors.length, 0,
        `round-trip validation errors: ${JSON.stringify(rt.errors, null, 2)}`);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  test("serializer produces stable bytes for a stable draft (parity anchor)", () => {
    const draft = validDraft();
    const a = serializePresentationDraft(draft);
    const b = serializePresentationDraft(draft);
    assert.equal(a, b, "serializer must be deterministic for identical input");
    // Diagnostic keys not present in serialized bytes
    assert.ok(!a.includes("_providerName"), "provider name must not leak into canonical bytes");
    assert.ok(!a.includes("_fetchTimingMs"));
    assert.ok(!a.includes("_previewPath"));
  });
});

/**
 * Yksikkötestit v4.4 Rich Embedding Input Layer -toteutukselle.
 *
 * Kattaa:
 *   - buildEmbeddingInput: label-resoluutio (thesisAbstract, publicationAbstract, markdownBody)
 *   - buildEmbeddingInput: rich source -prioriteetti
 *   - fingerprint: input muutos → uusi hash
 *   - fingerprint: sama input, eri debug-label → sama hash
 *   - Float32 roundtrip: cosine similarity säilyy ~identtisenä
 *   - date-frontmatter-regex: molemmat 'YYYY-MM-DD' ja YYYY-MM-DD
 *
 * Aja: npm run test:unit
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const {
  buildEmbeddingInput,
  fingerprint,
  INPUT_STRATEGY_VERSION
} = require("../../src/_utils/buildEmbeddingInput");
const { truncate, DEFAULT_MAX_CHARS } = require("../../src/_utils/embeddingTruncation");

// -----------------------------------------------------------------------------
// buildEmbeddingInput
// -----------------------------------------------------------------------------

describe("buildEmbeddingInput", () => {
  test("thesis + description → source label thesisAbstract", () => {
    const item = {
      url: "/thesis-1/",
      contentType: "thesis",
      title: "Sample thesis",
      description: "Long abstract from OuluREPO..."
    };
    const result = buildEmbeddingInput(item, {});
    assert.deepEqual(result.sources, ["title", "thesisAbstract"]);
    assert.equal(result.contentType, "thesis");
  });

  test("scientificPublication + description → source label publicationAbstract", () => {
    const item = {
      url: "/pub-1/",
      contentType: "scientificPublication",
      title: "Sample article",
      description: "Research.fi abstract..."
    };
    const result = buildEmbeddingInput(item, {});
    assert.deepEqual(result.sources, ["title", "publicationAbstract"]);
  });

  test("blogPost + markdown-body → source label markdownBody", () => {
    const item = {
      url: "/2023/01/01/blog/",
      contentType: "blogPost",
      title: "Blog title",
      description: "Short description"
    };
    const body = "This is a much longer blog body with actual content. ".repeat(20);
    const richSources = {
      markdownBodyByUrl: new Map([[item.url, body]])
    };
    const result = buildEmbeddingInput(item, richSources);
    assert.deepEqual(result.sources, ["title", "description", "markdownBody"]);
  });

  test("SlideShare-presentation + transcript → source label slideshareTranscript", () => {
    const item = {
      url: "/presentations/foo/",
      contentType: "presentation",
      title: "SlideShare presentation",
      description: "SlideShare-esitys"
    };
    const transcript = "Slide 1 content. Slide 2 content. ".repeat(30);
    const richSources = {
      transcriptByUrl: new Map([[item.url, { transcript }]])
    };
    const result = buildEmbeddingInput(item, richSources);
    assert.deepEqual(result.sources, ["title", "description", "slideshareTranscript"]);
  });

  test("Canva-presentation ilman transcriptia → vain title+description", () => {
    const item = {
      url: "/presentations/canva-foo/",
      contentType: "presentation",
      title: "Canva presentation",
      description: "Some description"
    };
    const result = buildEmbeddingInput(item, {});
    assert.deepEqual(result.sources, ["title", "description"]);
  });

  test("title puuttuu → sources ei sisällä title-labelia", () => {
    const item = {
      url: "/foo/",
      contentType: "opinion",
      description: "Only description"
    };
    const result = buildEmbeddingInput(item, {});
    assert.deepEqual(result.sources, ["description"]);
  });

  test("truncation → truncated=true kun text > maxChars", () => {
    const item = {
      url: "/foo/",
      contentType: "blogPost",
      title: "T",
      description: "D"
    };
    const bigBody = "x".repeat(20000);
    const richSources = { markdownBodyByUrl: new Map([[item.url, bigBody]]) };
    const result = buildEmbeddingInput(item, richSources, { maxChars: 1000 });
    assert.equal(result.truncated, true);
    assert.equal(result.chars, 1000);
    assert.ok(result.originalChars > 1000);
  });

  test("result-objektissa on maxChars ja version", () => {
    const result = buildEmbeddingInput({ url: "/x/", contentType: "blogPost", title: "T" }, {});
    assert.ok(result.maxChars > 0);
    assert.equal(result.version, INPUT_STRATEGY_VERSION);
    assert.equal(result.truncationStrategy, "head");
  });
});

// -----------------------------------------------------------------------------
// Fingerprint: mikä muuttaa, mikä ei
// -----------------------------------------------------------------------------

describe("fingerprint", () => {
  const baseItem = {
    url: "/foo/",
    contentType: "blogPost",
    title: "Sama title",
    description: "Sama description"
  };

  test("sama input → sama hash", () => {
    const a = buildEmbeddingInput(baseItem, {});
    const b = buildEmbeddingInput(baseItem, {});
    assert.equal(fingerprint(a), fingerprint(b));
  });

  test("eri teksti → eri hash", () => {
    const a = buildEmbeddingInput(baseItem, {});
    const b = buildEmbeddingInput({ ...baseItem, title: "Eri title" }, {});
    assert.notEqual(fingerprint(a), fingerprint(b));
  });

  test("thesis vs. blogPost sama teksti → SAMA hash (label ei fingerprintissä)", () => {
    // Verifioi että debug-label (thesisAbstract vs. description) ei
    // vaikuta fingerprintiin — vain teksti + strategy + maxChars vaikuttaa.
    const item1 = { url: "/a/", contentType: "thesis", title: "Same", description: "Same desc" };
    const item2 = { url: "/b/", contentType: "opinion", title: "Same", description: "Same desc" };
    const a = buildEmbeddingInput(item1, {});
    const b = buildEmbeddingInput(item2, {});
    // Molemmat tuottavat saman tekstin "Same\n\nSame desc"
    assert.equal(a.text, b.text);
    assert.equal(fingerprint(a), fingerprint(b));
    // Mutta labelit eroavat
    assert.notDeepEqual(a.sources, b.sources);
  });

  test("eri maxChars → eri hash (jos teksti ylittää rajan)", () => {
    const item = {
      url: "/x/",
      contentType: "blogPost",
      title: "T",
      description: "x".repeat(2000)
    };
    const a = buildEmbeddingInput(item, {}, { maxChars: 500 });
    const b = buildEmbeddingInput(item, {}, { maxChars: 1000 });
    assert.notEqual(fingerprint(a), fingerprint(b));
  });
});

// -----------------------------------------------------------------------------
// Truncation-strategy
// -----------------------------------------------------------------------------

describe("truncate (head strategy)", () => {
  test("teksti < maxChars → ei truncationia", () => {
    const r = truncate("hello world", { maxChars: 100 });
    assert.equal(r.truncated, false);
    assert.equal(r.text, "hello world");
  });

  test("teksti > maxChars → truncated", () => {
    const r = truncate("x".repeat(1000), { maxChars: 100 });
    assert.equal(r.truncated, true);
    assert.equal(r.text.length, 100);
    assert.equal(r.originalChars, 1000);
  });

  test("default maxChars = 6000", () => {
    assert.equal(DEFAULT_MAX_CHARS, 6000);
  });

  test("tuntematon strategia heittää", () => {
    assert.throws(() => truncate("x", { strategy: "unknown" }));
  });
});

// -----------------------------------------------------------------------------
// Float32 roundtrip: cosine similarity säilyy tarkkuudessa
// -----------------------------------------------------------------------------

describe("Float32 roundtrip", () => {
  function cosineSim(a, b) {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  function toFloat32AndBack(arr) {
    const f32 = new Float32Array(arr);
    return Array.from(f32);
  }

  test("Float32-muunnos säilyttää cosine similarityn ~7 desimaalia", () => {
    // Simuloi kaksi 1024-dim vektoria satunnaisilla arvoilla
    const rng = (seed) => () => {
      // yksinkertainen deterministinen PRNG (mulberry32)
      seed = (seed + 0x6D2B79F5) | 0;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r1 = rng(42);
    const r2 = rng(1337);
    const vecA = Array.from({ length: 1024 }, () => (r1() - 0.5) * 2);
    const vecB = Array.from({ length: 1024 }, () => (r2() - 0.5) * 2);

    const cosBefore = cosineSim(vecA, vecB);
    const cosAfter = cosineSim(toFloat32AndBack(vecA), toFloat32AndBack(vecB));
    const diff = Math.abs(cosBefore - cosAfter);

    // Float32 tarkkuus: ~7 desimaalia. Cosine-erot ovat käytännössä alle 1e-6.
    assert.ok(diff < 1e-5, `Cosine-ero ${diff} > 1e-5 (before=${cosBefore}, after=${cosAfter})`);
  });

  test("Float32 vector on säilytettävissä ja luettavissa Buffer:in kautta", () => {
    const original = new Float32Array([0.1, 0.2, 0.3, -0.5, 1.0, -1.0]);
    const buf = Buffer.alloc(original.length * 4);
    for (let i = 0; i < original.length; i++) {
      buf.writeFloatLE(original[i], i * 4);
    }
    const restored = new Float32Array(original.length);
    for (let i = 0; i < original.length; i++) {
      restored[i] = buf.readFloatLE(i * 4);
    }
    for (let i = 0; i < original.length; i++) {
      assert.equal(restored[i], original[i]);
    }
  });
});

// -----------------------------------------------------------------------------
// Date-frontmatter-regex (dokumentoi vaadittu formaatti)
// -----------------------------------------------------------------------------

describe("date-frontmatter regex (build-embeddings.js käyttö)", () => {
  const REGEX = /^date:\s*['"]?(\d{4})-(\d{2})-(\d{2})/m;

  test("'YYYY-MM-DD' (single quotes) mätsää", () => {
    const fm = "title: X\ndate: '2021-10-10'\ndescription: Y\n";
    const m = fm.match(REGEX);
    assert.deepEqual([m[1], m[2], m[3]], ["2021", "10", "10"]);
  });

  test('"YYYY-MM-DD" (double quotes) mätsää', () => {
    const fm = 'title: X\ndate: "2021-10-10"\ndescription: Y\n';
    const m = fm.match(REGEX);
    assert.deepEqual([m[1], m[2], m[3]], ["2021", "10", "10"]);
  });

  test("YYYY-MM-DD (ilman heittomerkkejä) mätsää", () => {
    const fm = "title: X\ndate: 2021-10-10\ndescription: Y\n";
    const m = fm.match(REGEX);
    assert.deepEqual([m[1], m[2], m[3]], ["2021", "10", "10"]);
  });

  test("ei date-kenttää → null", () => {
    const fm = "title: X\ndescription: Y\n";
    const m = fm.match(REGEX);
    assert.equal(m, null);
  });
});

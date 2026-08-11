const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeDoi,
  deduplicatePublicationCandidates
} = require("../../src/_data/publicationsPage");

function candidate({
  id,
  sourceKey,
  title,
  year,
  doi = null,
  stableIdentifier = null
}) {
  return {
    sourceKey,
    stableIdentifier,
    doi,
    title,
    year,
    record: {
      id,
      sourceKey,
      title,
      year,
      doi
    }
  };
}

describe("normalizeDoi", () => {
  test("normalisoi DOI-URL:n ja kirjainkoon", () => {
    assert.equal(normalizeDoi("https://doi.org/10.xxxx/ABC"), "10.xxxx/abc");
    assert.equal(normalizeDoi("10.xxxx/abc"), "10.xxxx/abc");
    assert.equal(normalizeDoi("doi:10.xxxx/AbC"), "10.xxxx/abc");
  });
});

describe("deduplicatePublicationCandidates", () => {
  test("Research.fi only -> canonical A", () => {
    const items = deduplicatePublicationCandidates([
      candidate({
        id: "rf-a",
        sourceKey: "researchfi",
        title: "Research only",
        year: 2026,
        doi: "10.1234/a"
      })
    ]);

    assert.equal(items.length, 1);
    assert.equal(items[0].record.id, "rf-a");
    assert.equal(items[0].sourceKey, "researchfi");
  });

  test("manual only -> canonical B", () => {
    const items = deduplicatePublicationCandidates([
      candidate({
        id: "manual-b",
        sourceKey: "manual",
        title: "Manual only",
        year: 2026
      })
    ]);

    assert.equal(items.length, 1);
    assert.equal(items[0].record.id, "manual-b");
    assert.equal(items[0].sourceKey, "manual");
  });

  test("DOI duplicate -> yksi canonical item ja Research.fi voittaa", () => {
    const items = deduplicatePublicationCandidates([
      candidate({
        id: "manual-c",
        sourceKey: "manual",
        title: "Candidate C",
        year: 2026,
        doi: "10.1234/c"
      }),
      candidate({
        id: "rf-c",
        sourceKey: "researchfi",
        title: "Candidate C",
        year: 2026,
        doi: "10.1234/c"
      })
    ]);

    assert.equal(items.length, 1);
    assert.equal(items[0].record.id, "rf-c");
    assert.equal(items[0].sourceKey, "researchfi");
  });

  test("DOI normalization tunnistaa saman DOI:n", () => {
    const items = deduplicatePublicationCandidates([
      candidate({
        id: "rf-d",
        sourceKey: "researchfi",
        title: "Candidate D",
        year: 2026,
        doi: "https://doi.org/10.xxxx/ABC"
      }),
      candidate({
        id: "manual-d",
        sourceKey: "manual",
        title: "Candidate D",
        year: 2026,
        doi: "10.xxxx/abc"
      })
    ]);

    assert.equal(items.length, 1);
    assert.equal(items[0].record.id, "rf-d");
  });

  test("title + year fallback deduplikoituu ja Research.fi voittaa", () => {
    const items = deduplicatePublicationCandidates([
      candidate({
        id: "manual-e",
        sourceKey: "manual",
        title: "Candidate E",
        year: 2026
      }),
      candidate({
        id: "rf-e",
        sourceKey: "researchfi",
        title: "Candidate E",
        year: 2026
      })
    ]);

    assert.equal(items.length, 1);
    assert.equal(items[0].record.id, "rf-e");
  });

  test("sama title mutta eri year ei deduplikoidu", () => {
    const items = deduplicatePublicationCandidates([
      candidate({
        id: "manual-f-2025",
        sourceKey: "manual",
        title: "Candidate F",
        year: 2025
      }),
      candidate({
        id: "rf-f-2026",
        sourceKey: "researchfi",
        title: "Candidate F",
        year: 2026
      })
    ]);

    assert.equal(items.length, 2);
    assert.deepEqual(
      items.map((item) => item.record.id).sort(),
      ["manual-f-2025", "rf-f-2026"]
    );
  });

  test("manual fallback korvautuu Research.fi-tietueella ilman että canonical count kasvaa", () => {
    const beforeResearchfiArrival = deduplicatePublicationCandidates([
      candidate({
        id: "manual-g",
        sourceKey: "manual",
        title: "Candidate G",
        year: 2026,
        doi: "10.4321/g"
      })
    ]);

    const afterResearchfiArrival = deduplicatePublicationCandidates([
      candidate({
        id: "manual-g",
        sourceKey: "manual",
        title: "Candidate G",
        year: 2026,
        doi: "10.4321/g"
      }),
      candidate({
        id: "rf-g",
        sourceKey: "researchfi",
        title: "Candidate G",
        year: 2026,
        doi: "10.4321/g"
      })
    ]);

    assert.equal(beforeResearchfiArrival.length, 1);
    assert.equal(afterResearchfiArrival.length, 1);
    assert.equal(afterResearchfiArrival[0].record.id, "rf-g");
    assert.equal(afterResearchfiArrival[0].sourceKey, "researchfi");
  });
});

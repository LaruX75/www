const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  runSearchQualityBenchmark
} = require("../../scripts/audit-search-quality-regression-benchmark");

const reportPromise = runSearchQualityBenchmark();

async function getReport() {
  return reportPromise;
}

describe("searchQualityRegressionBenchmark", () => {
  test("keeps Pagefind corpus and language partitions present", async () => {
    const report = await getReport();

    assert.equal(report.pagefind.version, "1.5.2");
    assert.equal(report.pagefind.corpus.htmlDocumentsIndexed, 1459);
    assert.ok(report.pagefind.corpus.pageCountFi >= 1067);
    assert.equal(report.pagefind.corpus.pageCountEn, 316);
    assert.ok(report.pagefind.languages.fi, "FI language index should exist");
    assert.ok(report.pagefind.languages.en, "EN language index should exist");
    assert.equal(
      report.pagefind.corpus.totalLanguagePages,
      report.pagefind.corpus.pageCountFi + report.pagefind.corpus.pageCountEn
    );
  });

  test("keeps exact-title drift classified as non-blocking while the benchmark stays green", async () => {
    const report = await getReport();
    const failures = report.exactTitleFindings.filter((finding) => !finding.ok);

    assert.equal(report.status, "GREEN");
    assert.deepEqual(report.blockingFindings, []);
    assert.ok(failures.length >= 1, "Current baseline should expose the known rank-slippage P2");
    assert.deepEqual(
      failures.map((finding) => finding.id),
      ["publication-computational-thinking"]
    );
    assert.ok(
      report.nonBlockingFindings.some(
        (finding) =>
          finding.code === "exact-title-rank-slippage"
          && finding.evidence.some((evidence) => evidence.id === "publication-computational-thinking")
      )
    );
  });

  test("keeps presentation-oriented topical queries focused on presentation-like results", async () => {
    const report = await getReport();
    const failures = report.presentationQualityFindings.filter((finding) => !finding.ok);
    assert.deepEqual(
      failures.map((finding) => ({
        id: finding.id,
        presentationLikeHits: finding.presentationLikeHits,
        minPresentationLikeHits: finding.minPresentationLikeHits
      })),
      []
    );
  });

  test("keeps English publication and presentation exact-title discovery intact", async () => {
    const report = await getReport();
    const checkedIds = new Set([
      "en-publication-kosovo",
      "en-presentation-edtech-info",
      "en-topic-mobile-learning"
    ]);
    const failures = report.fiEnFindings
      .filter((finding) => checkedIds.has(finding.id))
      .filter((finding) => !finding.ok);

    assert.deepEqual(
      failures.map((finding) => ({
        id: finding.id,
        rank: finding.rank,
        expectedUrl: finding.expectedUrl
      })),
      []
    );
  });

  test("never returns internal /api or /data URLs in audited top search results", async () => {
    const report = await getReport();
    assert.deepEqual(report.internalUrlLeakResult, []);
  });

  test("never leaks internal benchmark/index tokens into user-visible search snippets", async () => {
    const report = await getReport();
    assert.equal(report.status, "GREEN");
    assert.deepEqual(report.blockingFindings, []);
    assert.deepEqual(
      report.leakTokenResult.findings.map((finding) => ({
        query: finding.query,
        rank: finding.rank,
        url: finding.url,
        forbiddenTokens: finding.forbiddenTokens
      })),
      []
    );
  });
});

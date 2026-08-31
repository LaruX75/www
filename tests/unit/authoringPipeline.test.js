const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  validateCollectionItem
} = require("../../src/_utils/canonicalContentValidation");
const {
  fetchYouTubeMetadata,
  normalizeYouTubeUrl,
  parseYouTubeMetadataHtml
} = require("../../scripts/_lib/authoring/youtubeMetadata");
const {
  buildPresentationDraft,
  compareProposalToCanonical,
  findExistingPresentationBySourceUrl,
  normalizeCanonicalDate
} = require("../../scripts/_lib/authoring/presentationDraft");
const {
  getAuthoringInputPaths,
  renderPresentationPreview
} = require("../../scripts/_lib/authoring/eleventyPreview");

const FIXTURE_HTML = fs.readFileSync(
  path.join(__dirname, "..", "fixtures", "authoring-pipeline", "youtube-watch-larun-pikkuvinkit.html"),
  "utf8"
);

function buildProposal() {
  return parseYouTubeMetadataHtml(FIXTURE_HTML, normalizeYouTubeUrl("https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY"));
}

test("AUTHORING-PIPELINE-01: valid YouTube URL normalizes to canonical watch URL", () => {
  const normalized = normalizeYouTubeUrl("https://youtu.be/hCZ9lgODkes?list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY&t=12");
  assert.equal(normalized.videoId, "hCZ9lgODkes");
  assert.equal(normalized.listId, "PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY");
  assert.equal(
    normalized.sourceUrl,
    "https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY"
  );
});

test("AUTHORING-PIPELINE-01: invalid YouTube URL fails fast", () => {
  assert.throws(
    () => normalizeYouTubeUrl("https://www.youtube.com/watch?v="),
    /kelvollista video-ID:tä/
  );
});

test("AUTHORING-PIPELINE-01: fixture HTML yields title, date, thumbnail, and description proposal", () => {
  const proposal = buildProposal();
  assert.equal(proposal.title, "Larun pikkuvinkit");
  assert.equal(proposal.date, "2020-03-23");
  assert.equal(proposal.sourceType, "youtubePlaylistEntry");
  assert.equal(proposal.thumbnail, "https://i.ytimg.com/vi/hCZ9lgODkes/hqdefault.jpg");
  assert.match(proposal.description, /Koronakevään 2020 lyhytvideosarja/);
});

test("AUTHORING-PIPELINE-01: metadata fetch accepts mocked network response", async () => {
  const proposal = await fetchYouTubeMetadata(
    "https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY",
    {
      fetchImpl: async () => ({
        ok: true,
        text: async () => FIXTURE_HTML
      })
    }
  );

  assert.equal(proposal.title, "Larun pikkuvinkit");
  assert.equal(proposal.date, "2020-03-23");
});

test("AUTHORING-PIPELINE-01: existing canonical Presentation match is found without modifying content", () => {
  const match = findExistingPresentationBySourceUrl("https://www.youtube.com/watch?v=hCZ9lgODkes&list=PLDG0jxUrk8z3VEOjIFb_q0vdJW6-2oOgY");
  assert.ok(match);
  assert.equal(path.basename(match.filePath), "larun-pikkuvinkit.md");
  assert.equal(normalizeCanonicalDate(match.frontMatter.date), "2020-03-23");
});

test("AUTHORING-PIPELINE-01: canonical draft preserves real field semantics and does not infer contexts", () => {
  const proposal = buildProposal();
  const match = findExistingPresentationBySourceUrl(proposal.sourceUrl);
  const draft = buildPresentationDraft({
    proposal,
    manual: {
      type: "esitys",
      contexts: ["teaching"],
      slug: "authoring-pipeline-proof"
    },
    canonicalMatch: match
  });

  assert.equal(draft.slug, "authoring-pipeline-proof");
  assert.equal(draft.pageUrl, "/presentations/authoring-pipeline-proof/");
  assert.equal(draft.frontMatter.type, "esitys");
  assert.deepEqual(draft.frontMatter.contexts, ["teaching"]);
  assert.equal(draft.frontMatter.permalink, "/presentations/authoring-pipeline-proof/");
  assert.match(draft.body, /\[Katso tallenne YouTubessa\]/);
});

test("AUTHORING-PIPELINE-01: proposal vs canonical comparison proves Larun pikkuvinkit date parity", () => {
  const proposal = buildProposal();
  const match = findExistingPresentationBySourceUrl(proposal.sourceUrl);
  const comparison = compareProposalToCanonical(proposal, match);
  const dateField = comparison.fields.find((field) => field.field === "date");
  assert.ok(dateField);
  assert.equal(dateField.proposed, "2020-03-23");
  assert.equal(dateField.canonical, "2020-03-23");
  assert.equal(dateField.matches, true);
});

test("AUTHORING-PIPELINE-01: validation fails when required canonical fields are missing", () => {
  const proposal = buildProposal();
  const draft = buildPresentationDraft({
    proposal,
    manual: {
      slug: "authoring-validation-fail"
    }
  });

  const result = validateCollectionItem({
    collectionName: "presentations",
    data: draft.frontMatter,
    filePath: path.join(process.cwd(), "src", "presentations", "authoring-validation-fail.md"),
    useResolvedContexts: false,
    strictSemanticChecks: true
  });

  assert.ok(result.errors.some((item) => item.field === "type"));
  assert.ok(result.errors.some((item) => item.field === "contexts"));
});

test("AUTHORING-PIPELINE-01: Eleventy preview renders production layout and cleans temp input", async () => {
  const proposal = buildProposal();
  const draft = buildPresentationDraft({
    proposal,
    manual: {
      type: "esitys",
      contexts: ["teaching"],
      slug: "authoring-preview-smoke"
    }
  });

  const preview = await renderPresentationPreview({ draft, keepTemp: false });
  const html = fs.readFileSync(path.join(process.cwd(), preview.previewPath), "utf8");
  const { tempInputPath } = getAuthoringInputPaths("authoring-preview-smoke");

  assert.ok(preview.pagesProcessed >= 1);
  assert.ok(preview.htmlBytes > 300);
  assert.match(html, /<h1[^>]*>Larun pikkuvinkit<\/h1>/);
  assert.match(html, /Esitys tai opetusmateriaali/);
  assert.equal(fs.existsSync(tempInputPath), false);

  fs.rmSync(path.join(process.cwd(), ".tmp", "authoring-preview", "authoring-preview-smoke"), {
    recursive: true,
    force: true
  });
});

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  TERM_DEFINITIONS,
  itemInTermRange,
  buildElectionHistoryProjection
} = require("../../src/_utils/electionHistory");

function canonicalItem(overrides = {}) {
  return {
    id: overrides.id || "/example/",
    pageUrl: overrides.pageUrl || overrides.id || "/example/",
    title: overrides.title || "Example",
    date: overrides.date || "2025-04-14",
    year: Number.parseInt((overrides.date || "2025-04-14").slice(0, 4), 10),
    contentType: overrides.contentType || "blogPost",
    contexts: overrides.contexts || [],
    sourceCollection: overrides.sourceCollection || "blog",
    sourceType: overrides.sourceType || "",
    event: overrides.event || "",
    meeting: overrides.meeting || "",
    initiativeType: overrides.initiativeType || "",
    politicalProfiles: overrides.politicalProfiles || []
  };
}

test("itemInTermRange keeps term boundaries inclusive", () => {
  const currentTerm = TERM_DEFINITIONS[0];
  const previousTerm = TERM_DEFINITIONS[1];

  assert.equal(itemInTermRange({ date: "2025-04-14" }, currentTerm), true);
  assert.equal(itemInTermRange({ date: "2025-04-13" }, currentTerm), false);
  assert.equal(itemInTermRange({ date: "2025-04-13" }, previousTerm), true);
  assert.equal(itemInTermRange({ date: "2021-06-14" }, previousTerm), true);
  assert.equal(itemInTermRange({ date: "2021-06-13" }, previousTerm), false);
});

test("buildElectionHistoryProjection assigns canonical items to deterministic terms and families", () => {
  const projection = buildElectionHistoryProjection({
    canonicalItems: [
      canonicalItem({
        id: "/2025-speech/",
        date: "2025-04-14",
        sourceCollection: "blog",
        sourceType: "puhe",
        contentType: "speech",
        event: "Oulun kaupunginvaltuusto"
      }),
      canonicalItem({
        id: "/2021-initiative/",
        date: "2021-06-14",
        sourceCollection: "publications",
        initiativeType: "valtuustoaloite",
        contentType: "initiative"
      }),
      canonicalItem({
        id: "/2021-opinion/",
        date: "2021-06-13",
        sourceCollection: "blog",
        sourceType: "mielipide",
        contentType: "opinion"
      }),
      canonicalItem({
        id: "/2013-blog/",
        date: "2013-01-01",
        sourceCollection: "blog",
        sourceType: "",
        contentType: "blogPost",
        politicalProfiles: ["municipal-politics"]
      })
    ],
    councilMeetings: [
      { id: "m-1", date: "2025-04-14", pageUrl: "/politiikka/kaupunginvaltuusto/" },
      { id: "m-2", date: "2021-06-13", pageUrl: "/politiikka/kaupunginvaltuusto/" },
      { id: "m-3", date: "2013-01-01", pageUrl: "/politiikka/kaupunginvaltuusto/" }
    ]
  });

  assert.deepEqual(projection.termIds, ["2025-2029", "2021-2025", "2017-2021", "2013-2017"]);

  const currentTerm = projection.terms[0];
  assert.equal(currentTerm.counts.speeches, 1);
  assert.equal(currentTerm.counts.councilMeetings, 1);
  assert.equal(currentTerm.canonicalFamilies.speeches[0].pageUrl, "/2025-speech/");

  const secondTerm = projection.terms[1];
  assert.equal(secondTerm.counts.initiatives, 1);
  assert.equal(secondTerm.councilMeetings.length, 0);

  const thirdTerm = projection.terms[2];
  assert.equal(thirdTerm.counts.opinions, 1);
  assert.equal(thirdTerm.counts.councilMeetings, 1);

  const fourthTerm = projection.terms[3];
  assert.equal(fourthTerm.counts.otherPoliticalItems, 1);
  assert.equal(fourthTerm.counts.councilMeetings, 1);
});

test("projection uses canonical semantics instead of sourceCollection provenance", () => {
  const projection = buildElectionHistoryProjection({
    canonicalItems: [
      canonicalItem({
        id: "/semantic-speech/",
        date: "2025-04-14",
        sourceCollection: "blog",
        sourceType: "puhe",
        contentType: "speech",
        event: "Oulun kaupunginvaltuusto"
      }),
      canonicalItem({
        id: "/not-an-initiative/",
        date: "2025-04-14",
        sourceCollection: "politics",
        contentType: "article",
        politicalProfiles: []
      }),
      canonicalItem({
        id: "/semantic-initiative/",
        date: "2025-04-14",
        sourceCollection: "publications",
        contentType: "initiative",
        initiativeType: "valtuustoaloite"
      })
    ],
    councilMeetings: []
  });

  const currentTerm = projection.terms[0];
  assert.equal(currentTerm.counts.speeches, 1);
  assert.equal(currentTerm.counts.initiatives, 1);
});

test("projection does not infer political membership from categories, keywords or contexts alone", () => {
  const projection = buildElectionHistoryProjection({
    canonicalItems: [
      canonicalItem({
        id: "/not-political/",
        date: "2024-10-10",
        sourceCollection: "blog",
        contentType: "blogPost",
        contexts: ["research"],
        politicalProfiles: []
      })
    ],
    councilMeetings: []
  });

  const currentTerm = projection.terms[1];
  assert.equal(currentTerm.counts.otherPoliticalItems, 0);
});

test("projection rejects duplicate canonical items inside the same family", () => {
  assert.throws(() => buildElectionHistoryProjection({
    canonicalItems: [
      canonicalItem({
        id: "/dup/",
        pageUrl: "/dup/",
        date: "2025-05-01",
        sourceCollection: "politics",
        initiativeType: "valtuustoaloite",
        contentType: "initiative"
      }),
      canonicalItem({
        id: "/dup/",
        pageUrl: "/dup/",
        date: "2025-05-02",
        sourceCollection: "politics",
        initiativeType: "valtuustoaloite",
        contentType: "initiative"
      })
    ],
    councilMeetings: []
  }), /duplicate canonical item detected/);
});

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");

const {
  classifySpeechKind,
  buildSharedWritingsRecord,
  buildPublicationWritingsRecord,
  buildCanonicalWritingsPageItems,
  buildEnglishWritingsViewModel
} = require("../../src/_data/writingsPage");

function sharedItem({
  inputPath,
  url,
  date,
  data
}) {
  return {
    inputPath,
    url,
    date: date ? new Date(`${date}T00:00:00.000Z`) : null,
    data
  };
}

describe("classifySpeechKind", () => {
  test("luokittelee council-puheen speechContextin perusteella", () => {
    assert.equal(classifySpeechKind({ speechContext: "valtuusto" }), "council");
  });

  test("luokittelee public speechin tapahtuman perusteella", () => {
    assert.equal(classifySpeechKind({ event: "Muu tapahtuma", forum: ["Yliopisto"] }), "public");
  });
});

describe("buildSharedWritingsRecord", () => {
  test("opinion-record saa canonical url/pageUrl/sectionKeys-kentat", () => {
    const record = buildSharedWritingsRecord(sharedItem({
      inputPath: "/virtual/publications/opinion.md",
      url: "/kirjoitus/",
      date: "2026-01-02",
      data: {
        title: "Opinion title",
        description: "Opinion summary",
        type: "mielipide",
        publication: "Kaleva",
        sourceUrl: "https://example.com/opinion",
        categories: ["Politiikka"],
        keywords: ["Oulu"],
        opinionRoles: ["political"]
      }
    }));

    assert.equal(record.contentType, "opinion");
    assert.deepEqual(record.sectionKeys, ["opinions"]);
    assert.equal(record.url, "https://example.com/opinion");
    assert.equal(record.pageUrl, "/kirjoitus/");
    assert.deepEqual(record.opinionRoles, ["political"]);
  });

  test("public speech saa sekä speeches- että publicSpeeches-osioavaimet", () => {
    const record = buildSharedWritingsRecord(sharedItem({
      inputPath: "/virtual/publications/speech.md",
      url: "/puhe/",
      date: "2026-02-03",
      data: {
        title: "Public speech",
        description: "Speech summary",
        type: "puhe",
        speechContext: "julkinen-tilaisuus",
        event: "Seminaari"
      }
    }));

    assert.deepEqual(record.sectionKeys, ["speeches", "publicSpeeches"]);
    assert.equal(record.speechKind, "public");
  });
});

describe("buildPublicationWritingsRecord", () => {
  test("scientific publication säilyttää external/local-linkit erillään", () => {
    const record = buildPublicationWritingsRecord({
      id: "rf-1",
      sourceKey: "researchfi",
      sourceLabel: "Research.fi",
      pageUrl: "/julkaisut/rf-1/",
      url: "https://doi.org/10.1234/example",
      title: "Research article",
      year: 2026,
      authors: "Laru, Jari; Example, Ada",
      journal: "Journal of Testing",
      typeCode: "A1"
    });

    assert.equal(record.contentType, "scientificPublication");
    assert.deepEqual(record.sectionKeys, ["publications"]);
    assert.equal(record.url, "https://doi.org/10.1234/example");
    assert.equal(record.pageUrl, "/julkaisut/rf-1/");
    assert.deepEqual(record.authors, ["Laru, Jari", "Example, Ada"]);
  });
});

describe("buildCanonicalWritingsPageItems", () => {
  test("yhdistaa shared writingsit ja publicationsPage-itemsit ilman duplicate-id:ta", () => {
    const result = buildCanonicalWritingsPageItems({
      collections: {
        blog: [
          sharedItem({
            inputPath: "/virtual/blog/post.md",
            url: "/2026/01/01/post/",
            date: "2026-01-01",
            data: {
              title: "Blog post",
              description: "Blog summary",
              categories: ["Blogi"],
              keywords: ["Kirjoitus"],
              tags: ["blog"]
            }
          })
        ],
        pub_mielipide: [],
        pub_kolumni: [],
        politics: [],
        pub_puhe: [],
        publications: []
      },
      researchfi: [],
      researchfiContent: [],
      researchProgram: {},
      semanticscholar: {},
      collections: {
        blog: [
          sharedItem({
            inputPath: "/virtual/blog/post.md",
            url: "/2026/01/01/post/",
            date: "2026-01-01",
            data: {
              title: "Blog post",
              description: "Blog summary",
              categories: ["Blogi"],
              keywords: ["Kirjoitus"],
              tags: ["blog"]
            }
          })
        ],
        pub_mielipide: [],
        pub_kolumni: [],
        politics: [],
        pub_puhe: [],
        publications: []
      }
    });

    assert.equal(result.items.length, 1);
    assert.equal(result.duplicateIds.length, 0);
    assert.equal(result.contentTypeCounts.blogPost, 1);
  });
});

describe("buildEnglishWritingsViewModel", () => {
  test("laskee EN-view-modelin osiot canonical items -joukosta", () => {
    const model = buildEnglishWritingsViewModel({
      items: [
        { id: "statement-1", contentType: "statement", date: "2026-04-01", sectionKeys: ["statements"], title: "Statement" },
        { id: "opinion-1", contentType: "opinion", date: "2026-03-01", sectionKeys: ["opinions"], title: "Opinion", opinionRoles: ["political", "expert"] },
        { id: "column-1", contentType: "column", date: "2026-02-01", sectionKeys: ["columns"], title: "Column" },
        { id: "initiative-1", contentType: "initiative", date: "2026-01-01", sectionKeys: ["initiatives"], title: "Initiative", meetingDate: "2026-01-15" },
        { id: "speech-1", contentType: "speech", date: "2025-12-01", sectionKeys: ["speeches"], title: "Council speech" },
        { id: "speech-2", contentType: "speech", date: "2025-11-01", sectionKeys: ["speeches", "publicSpeeches"], title: "Public speech" },
        { id: "blog-1", contentType: "blogPost", date: "2025-10-01", sectionKeys: ["blog"], title: "Blog post" },
        { id: "pub-1", contentType: "scientificPublication", year: 2025, date: "2025-01-01", sectionKeys: ["publications"], title: "Publication" }
      ]
    });

    assert.equal(model.statementCount, 1);
    assert.equal(model.opinionCount, 1);
    assert.equal(model.columnCount, 1);
    assert.equal(model.initiativeCount, 1);
    assert.equal(model.speechCount, 2);
    assert.equal(model.publicSpeechCount, 1);
    assert.equal(model.blogCount, 1);
    assert.equal(model.publicationCount, 1);
    assert.equal(model.hybridOpinionCount, 1);
    assert.equal(model.openingSpeechItems[0].id, "speech-1");
  });
});

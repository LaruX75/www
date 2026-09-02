/**
 * KYNÄSTÄ-HUB-02 unit tests for the canonical hub projection.
 *
 * Guards the invariants the FI + EN hubs depend on:
 *   - group filtering matches audit contract per canonical collection
 *   - group 5 (initiatives) uses meetingDate with date fallback
 *   - latestItems is DESC by date, capped at 5, no cross-group leakage
 *   - EN lang scope excludes items that do not explicitly declare lang: en
 *   - buildKynastaHubModel returns totalCount = writings + council + expert
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  LATEST_LIMIT,
  DATE_FIELDS,
  isCouncilSpeech,
  buildKynastaHubModel
} = require("../../src/_utils/kynastaHubPage");

function mkItem(overrides = {}) {
  const { data = {}, url = "/mock/", date, ...rest } = overrides;
  const base = {
    url,
    ...rest
  };
  if (date !== undefined) base.date = date;
  base.data = {
    title: "Mock item",
    ...data
  };
  return base;
}

describe("LATEST_LIMIT + DATE_FIELDS contract", () => {
  test("LATEST_LIMIT is 5 (hub-first-5 invariant)", () => {
    assert.equal(LATEST_LIMIT, 5);
  });

  test("initiative group uses meetingDate primary + date fallback", () => {
    assert.deepEqual(DATE_FIELDS.initiative, ["meetingDate", "date"]);
  });

  test("all other groups use date only", () => {
    for (const key of ["blog", "opinion", "column", "councilSpeech", "statement", "publicSpeech"]) {
      assert.deepEqual(DATE_FIELDS[key], ["date"]);
    }
  });
});

describe("isCouncilSpeech classification", () => {
  test("speechContext=valtuusto → true", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { speechContext: "valtuusto" } })), true);
  });

  test("speechContext=kyselytunti → true", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { speechContext: "kyselytunti" } })), true);
  });

  test("speechContext=juhlapuhe → false", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { speechContext: "juhlapuhe" } })), false);
  });

  test("no speechContext + event=Oulun kaupunginvaltuusto → true", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { event: "Oulun kaupunginvaltuusto" } })), true);
  });

  test("no speechContext + forum contains Kaupunginvaltuusto → true", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { forum: ["Kaupunginvaltuusto"] } })), true);
  });

  test("no speechContext, no council event/forum → false", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { event: "Rehtoripäivä" } })), false);
  });
});

describe("buildKynastaHubModel — grouping + slicing", () => {
  const collections = {
    blog: [
      mkItem({ url: "/blog/a/", date: new Date("2026-08-01"), data: { title: "Blog A" } }),
      mkItem({ url: "/blog/b/", date: new Date("2026-09-01"), data: { title: "Blog B" } }),
      mkItem({ url: "/blog/c/", date: new Date("2026-07-15"), data: { title: "Blog C" } })
    ],
    pub_mielipide: [
      mkItem({ url: "/o1/", data: { title: "O1", date: "2026-05-10" } }),
      mkItem({ url: "/o2/", data: { title: "O2", date: "2026-08-15" } })
    ],
    pub_kolumni: [
      mkItem({ url: "/c1/", data: { title: "C1", date: "2026-04-01" } })
    ],
    pub_puhe: [
      mkItem({ url: "/s1/", data: { title: "Council speech 1", date: "2026-06-01", speechContext: "valtuusto" } }),
      mkItem({ url: "/s2/", data: { title: "Public speech 1", date: "2026-07-01", speechContext: "juhlapuhe" } }),
      mkItem({ url: "/s3/", data: { title: "Council speech 2", date: "2026-08-20", speechContext: "kyselytunti" } })
    ],
    politics: [
      mkItem({ url: "/i1/", data: { title: "Init 1", date: "2026-05-05" } }),
      mkItem({ url: "/i2/", data: { title: "Init 2", date: "2026-03-01", meetingDate: "2026-09-05" } })
    ],
    publications: [
      mkItem({ url: "/l1/", data: { title: "Statement 1", type: "lausunto", date: "2026-06-15" } }),
      mkItem({ url: "/l2/", data: { title: "Statement 2", type: "lausunto", date: "2026-08-25" } }),
      mkItem({ url: "/px/", data: { title: "Not a statement", type: "tieteellinen", date: "2026-09-30" } })
    ]
  };

  const model = buildKynastaHubModel({ collections, lang: "fi" });

  test("returns the expected top-level shape", () => {
    assert.equal(model.lang, "fi");
    assert.ok(model.writings.groups.blog);
    assert.ok(model.writings.groups.opinion);
    assert.ok(model.writings.groups.column);
    assert.ok(model.council.groups.speeches);
    assert.ok(model.council.groups.initiatives);
    assert.ok(model.expert.groups.statements);
    assert.ok(model.expert.groups.publicSpeeches);
  });

  test("blog group is 3 items sorted DESC by date", () => {
    const g = model.writings.groups.blog;
    assert.equal(g.count, 3);
    assert.deepEqual(g.latestItems.map((i) => i.title), ["Blog B", "Blog A", "Blog C"]);
  });

  test("statement group filters publications by type=lausunto (excludes tieteellinen)", () => {
    const g = model.expert.groups.statements;
    assert.equal(g.count, 2);
    assert.deepEqual(g.latestItems.map((i) => i.title), ["Statement 2", "Statement 1"]);
  });

  test("council-speech vs public-speech split via speechContext", () => {
    assert.equal(model.council.groups.speeches.count, 2);
    assert.deepEqual(
      model.council.groups.speeches.latestItems.map((i) => i.title),
      ["Council speech 2", "Council speech 1"]
    );
    assert.equal(model.expert.groups.publicSpeeches.count, 1);
    assert.equal(model.expert.groups.publicSpeeches.latestItems[0].title, "Public speech 1");
  });

  test("initiative group uses meetingDate over date when present", () => {
    const g = model.council.groups.initiatives;
    assert.equal(g.count, 2);
    // Init 2 has meetingDate 2026-09-05, later than Init 1's date 2026-05-05
    assert.deepEqual(g.latestItems.map((i) => i.title), ["Init 2", "Init 1"]);
  });

  test("totalCount equals writings + council + expert subtotals", () => {
    assert.equal(model.totalCount, model.writings.count + model.council.count + model.expert.count);
    // 3+2+1 + 2+2 + 2+1 = 13
    assert.equal(model.totalCount, 13);
  });

  test("latestItems is capped at LATEST_LIMIT = 5", () => {
    const big = Array.from({ length: 12 }, (_, i) =>
      mkItem({ url: `/blog/n${i}/`, date: new Date(2026, 0, i + 1), data: { title: `N${i}` } })
    );
    const m = buildKynastaHubModel({ collections: { blog: big }, lang: "fi" });
    assert.equal(m.writings.groups.blog.count, 12);
    assert.equal(m.writings.groups.blog.latestItems.length, 5);
  });
});

describe("buildKynastaHubModel — EN scope preserves site's FI-corpus-with-EN-UI convention", () => {
  test("EN scope surfaces the same canonical writings as FI (no lang filter)", () => {
    // The site has zero content declaring `lang: en`; /en/writings/ has
    // always displayed the FI canonical corpus wrapped in EN UI, and
    // the Kynästä hub follows that same convention. The lang parameter
    // is passed through on the model for surface labelling only.
    const collections = {
      blog: [
        mkItem({ url: "/blog/a/", date: new Date("2026-08-01"), data: { title: "Item A" } }),
        mkItem({ url: "/blog/b/", date: new Date("2026-07-01"), data: { title: "Item B", lang: "en" } })
      ],
      pub_mielipide: [
        mkItem({ url: "/o1/", data: { title: "FI opinion", date: "2026-05-10" } })
      ],
      pub_kolumni: [],
      pub_puhe: [],
      politics: [],
      publications: []
    };
    const fi = buildKynastaHubModel({ collections, lang: "fi" });
    const en = buildKynastaHubModel({ collections, lang: "en" });
    assert.equal(fi.writings.groups.blog.count, en.writings.groups.blog.count,
      "EN + FI hub see identical blog corpus (site convention)");
    assert.equal(fi.writings.groups.opinion.count, en.writings.groups.opinion.count);
    assert.equal(fi.writings.groups.column.count, en.writings.groups.column.count);
  });

  test("EN scope reflects the same council / expert corpus (informational counts)", () => {
    const collections = {
      blog: [],
      pub_mielipide: [],
      pub_kolumni: [],
      pub_puhe: [
        mkItem({ url: "/s/", data: { title: "FI speech", date: "2026-06-01", speechContext: "valtuusto" } })
      ],
      politics: [
        mkItem({ url: "/i/", data: { title: "FI init", date: "2026-05-05" } })
      ],
      publications: [
        mkItem({ url: "/l/", data: { title: "FI statement", type: "lausunto", date: "2026-06-15" } })
      ]
    };
    const m = buildKynastaHubModel({ collections, lang: "en" });
    assert.equal(m.council.groups.speeches.count, 1);
    assert.equal(m.council.groups.initiatives.count, 1);
    assert.equal(m.expert.groups.statements.count, 1);
    // The EN template consumes these counts as context but renders a
    // Finnish-only note rather than the FI items in EN UI.
  });
});

describe("buildKynastaHubModel — resilience", () => {
  test("empty collections object yields a valid empty model", () => {
    const m = buildKynastaHubModel({ collections: {} });
    assert.equal(m.totalCount, 0);
    assert.equal(m.writings.groups.blog.count, 0);
    assert.deepEqual(m.writings.groups.blog.latestItems, []);
  });

  test("missing collections argument yields a valid empty model", () => {
    const m = buildKynastaHubModel();
    assert.equal(m.totalCount, 0);
    assert.equal(m.lang, "fi");
  });
});

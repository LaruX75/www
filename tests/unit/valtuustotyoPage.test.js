/**
 * VALTUUSTOTYO-SSR-01 unit tests for the canonical /valtuustotyo/
 * projection.
 *
 * Guards:
 *   - shared council-speech classification (single-owner)
 *   - initiative meetingDate fallback ordering
 *   - deterministic tie-break (title fi-locale → URL ASC)
 *   - enrichment produces meetingLabel + protocolUrl + councilVideos
 *   - filter-option arrays (speechYears, speechMeetings, initiativeYears)
 *   - Kynästä chronology parity (same corpus → same first-5)
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  isCouncilSpeech,
  compareByCouncilChronology,
  compareByInitiativeChronology
} = require("../../src/_utils/councilSpeech");

const { enrichCouncilSpeech } = require("../../src/_utils/councilEnrichment");

const {
  buildValtuustotyoPage,
  buildSpeechRecord,
  buildInitiativeRecord,
  buildDashboard,
  stripCouncilTitlePrefix,
  secondsToClock,
  compareCouncilMeetings,
  yearFromDate
} = require("../../src/_utils/valtuustotyoPage");

const { buildKynastaHubModel } = require("../../src/_utils/kynastaHubPage");

const mkItem = (overrides = {}) => {
  const { data = {}, url = "/mock/", date, ...rest } = overrides;
  const base = { url, ...rest };
  if (date !== undefined) base.date = date;
  base.data = { title: "Mock", ...data };
  return base;
};

// ============================================================
// isCouncilSpeech — single-owner classifier
// ============================================================
describe("isCouncilSpeech (canonical rule)", () => {
  test("type != puhe → false", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { type: "mielipide", speechContext: "valtuusto" } })), false);
  });
  test("speechContext=valtuusto → true", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { type: "puhe", speechContext: "valtuusto" } })), true);
  });
  test("speechContext=kyselytunti → true", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { type: "puhe", speechContext: "kyselytunti" } })), true);
  });
  test("speechContext=juhlapuhe → false (explicit non-council overrides fallback)", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { type: "puhe", speechContext: "juhlapuhe", event: "Oulun kaupunginvaltuusto" } })), false);
  });
  test("no speechContext + event=Oulun kaupunginvaltuusto → true (event fallback)", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { type: "puhe", event: "Oulun kaupunginvaltuusto" } })), true);
  });
  test("no speechContext + forum contains 'Kaupunginvaltuusto' → true (forum fallback)", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { type: "puhe", forum: ["Kaupunginvaltuusto"] } })), true);
  });
  test("no speechContext, no council event/forum → false", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { type: "puhe", event: "Rehtoripäivä" } })), false);
  });
  test("scalar forum string works", () => {
    assert.equal(isCouncilSpeech(mkItem({ data: { type: "puhe", forum: "Kaupunginvaltuusto" } })), true);
  });
});

// ============================================================
// Council chronology comparator
// ============================================================
describe("compareByCouncilChronology (canonical order)", () => {
  test("newer date wins over older date", () => {
    const older = { date: "2025-06-01", title: "Zed", url: "/z/" };
    const newer = { date: "2026-06-01", title: "Aardvark", url: "/a/" };
    const sorted = [older, newer].sort(compareByCouncilChronology);
    assert.equal(sorted[0].url, "/a/");
  });
  test("same-date tie broken by title fi-locale ASC", () => {
    const a = { date: "2026-06-01", title: "Yleisö", url: "/y/" };
    const b = { date: "2026-06-01", title: "Alkusanat", url: "/b/" };
    const sorted = [a, b].sort(compareByCouncilChronology);
    assert.equal(sorted[0].title, "Alkusanat");
  });
  test("same date + title → tie broken by URL ASC", () => {
    const a = { date: "2026-06-01", title: "Same", url: "/z/" };
    const b = { date: "2026-06-01", title: "Same", url: "/a/" };
    const sorted = [a, b].sort(compareByCouncilChronology);
    assert.equal(sorted[0].url, "/a/");
  });
});

// ============================================================
// Initiative chronology comparator
// ============================================================
describe("compareByInitiativeChronology (meetingDate fallback)", () => {
  test("meetingDate wins over date when present", () => {
    const withMeeting = { date: "2026-01-01", meetingDate: "2026-09-15", title: "M" };
    const dateOnly = { date: "2026-08-30", title: "D" };
    const sorted = [dateOnly, withMeeting].sort(compareByInitiativeChronology);
    assert.equal(sorted[0].title, "M");
  });
  test("both use date if no meetingDate", () => {
    const a = { date: "2026-08-30", title: "A" };
    const b = { date: "2026-08-31", title: "B" };
    const sorted = [a, b].sort(compareByInitiativeChronology);
    assert.equal(sorted[0].title, "B");
  });
});

// ============================================================
// Enrichment
// ============================================================
describe("enrichCouncilSpeech", () => {
  const councilMeetingMeta = {
    byDate: {
      "2026-06-15": { meetingNumber: "6/2026", timelineTitle: "Kesäkokous" }
    }
  };
  const oukaCouncilSpeechProtocols = {
    protocolsByDate: { "2026-06-15": "https://asiakirjat.ouka.fi/2026-06-15" },
    overrides: {
      "/opinnaytteet/mock-override/": {
        event: "Oulun kaupunginvaltuusto",
        asiakohta: "§ 12"
      }
    }
  };
  const councilSpeechVideos = {
    byUrl: {
      "/talks/example/": [{ youtubeId: "abc123", start: 42 }]
    }
  };

  test("enriches meeting metadata from councilMeetingMeta.byDate", () => {
    const item = mkItem({
      url: "/talks/example/",
      date: new Date("2026-06-15"),
      data: { title: "T", event: "Oulun kaupunginvaltuusto", url: "/talks/example/" }
    });
    const out = enrichCouncilSpeech(null, item, {
      councilMeetingMeta,
      oukaCouncilSpeechProtocols,
      councilSpeechVideos
    });
    assert.equal(out.meetingNumber, "6/2026");
    assert.equal(out.meetingLabel, "6/2026");
    assert.equal(out.protocolUrl, "https://asiakirjat.ouka.fi/2026-06-15");
    assert.equal(out.councilVideos[0].youtubeId, "abc123");
  });

  test("override overrides event + asiakohta from oukaCouncilSpeechProtocols", () => {
    const item = mkItem({
      url: "/opinnaytteet/mock-override/",
      date: new Date("2026-06-15"),
      data: { title: "T", url: "/opinnaytteet/mock-override/" }
    });
    const out = enrichCouncilSpeech(null, item, {
      councilMeetingMeta,
      oukaCouncilSpeechProtocols,
      councilSpeechVideos
    });
    assert.equal(out.event, "Oulun kaupunginvaltuusto");
    assert.equal(out.asiakohta, "§ 12");
  });

  test("missing meta yields empty enrichment fields (no crash)", () => {
    const item = mkItem({
      url: "/talks/no-meta/",
      date: new Date("2020-01-01"),
      data: { title: "T", event: "Muut" }
    });
    const out = enrichCouncilSpeech(null, item, {
      councilMeetingMeta,
      oukaCouncilSpeechProtocols,
      councilSpeechVideos
    });
    assert.equal(out.meetingNumber, "");
    assert.equal(out.protocolUrl, "");
    assert.deepEqual(out.councilVideos, []);
  });
});

// ============================================================
// Speech record shape + short title
// ============================================================
describe("buildSpeechRecord", () => {
  const deps = { councilMeetingMeta: { byDate: {} }, oukaCouncilSpeechProtocols: {}, councilSpeechVideos: {} };

  test("stripCouncilTitlePrefix strips Puheenvuoro/Valtuustopuheenvuoro prefix + § refs", () => {
    assert.equal(stripCouncilTitlePrefix("Valtuustopuheenvuoro § 12: Lähijunaliikenne"), "Lähijunaliikenne");
    assert.equal(stripCouncilTitlePrefix("Puheenvuoro Rehtoripäivä: Speech"), "Speech");
    assert.equal(stripCouncilTitlePrefix("Puheenvuoroni § 5 Julkiset tilat"), "Julkiset tilat");
    assert.equal(stripCouncilTitlePrefix("Plain title"), "Plain title");
  });

  test("secondsToClock formats video timestamps", () => {
    assert.equal(secondsToClock(0), "0:00:00");
    assert.equal(secondsToClock(3661), "1:01:01");
    assert.equal(secondsToClock(42), "0:00:42");
  });

  test("record shape includes searchText concatenating all searchable fields", () => {
    const item = mkItem({
      url: "/talks/t/",
      date: new Date("2026-06-15"),
      data: {
        title: "Puheenvuoro § 5: TITLE",
        event: "Oulun kaupunginvaltuusto",
        description: "DESCRIPTION",
        categories: ["Category"],
        keywords: ["Keyword"]
      }
    });
    const record = buildSpeechRecord(item, deps);
    assert.match(record.searchText, /title/);
    assert.match(record.searchText, /description/);
    assert.match(record.searchText, /category/);
    assert.match(record.searchText, /keyword/);
    assert.equal(record.shortTitle, "TITLE");
  });
});

// ============================================================
// Initiative record shape
// ============================================================
describe("buildInitiativeRecord", () => {
  test("prefers meetingDate over date; falls back to date when meetingDate absent", () => {
    const withMeeting = mkItem({
      url: "/politics/x/",
      date: new Date("2026-01-01"),
      data: { title: "T", meetingDate: "2026-09-05" }
    });
    const record = buildInitiativeRecord(withMeeting);
    assert.equal(record.meetingDate, "2026-09-05");
    assert.equal(record.year, "2026");

    const dateOnly = mkItem({
      url: "/politics/y/",
      date: new Date("2024-11-11"),
      data: { title: "Y" }
    });
    const record2 = buildInitiativeRecord(dateOnly);
    assert.equal(record2.meetingDate, "2024-11-11");
  });
});

// ============================================================
// Filter option helpers
// ============================================================
describe("compareCouncilMeetings", () => {
  test("orders N/YYYY DESC (year then meeting number)", () => {
    const meetings = ["10/2025", "3/2026", "10/2026", "5/2025"];
    const sorted = meetings.slice().sort(compareCouncilMeetings);
    assert.deepEqual(sorted, ["10/2026", "3/2026", "10/2025", "5/2025"]);
  });
});

describe("yearFromDate", () => {
  test("extracts YYYY from ISO string", () => {
    assert.equal(yearFromDate("2026-08-25"), "2026");
  });
  test("empty for empty input", () => {
    assert.equal(yearFromDate(""), "");
    assert.equal(yearFromDate(null), "");
  });
});

// ============================================================
// buildValtuustotyoPage — full projection
// ============================================================
describe("buildValtuustotyoPage", () => {
  const collections = {
    pub_puhe_valtuusto: [
      mkItem({ url: "/talks/a/", date: new Date("2026-06-15"), data: { title: "Puheenvuoro § 1: Alpha", type: "puhe", speechContext: "valtuusto", event: "Oulun kaupunginvaltuusto" } }),
      mkItem({ url: "/talks/b/", date: new Date("2025-11-11"), data: { title: "Puheenvuoro § 2: Bravo", type: "puhe", speechContext: "kyselytunti" } })
    ],
    politics: [
      mkItem({ url: "/politics/1/", date: new Date("2024-11-11"), data: { title: "Init 1" } }),
      mkItem({ url: "/politics/2/", date: new Date("2023-03-30"), data: { title: "Init 2", meetingDate: "2026-09-05" } })
    ],
    pub_mielipide: [], pub_lausunto: [], pub_kolumni: [], pub_puhe: [], blog: []
  };
  const deps = {
    councilMeetingMeta: { byDate: { "2026-06-15": { meetingNumber: "6/2026" } } },
    oukaCouncilSpeechProtocols: { protocolsByDate: {}, overrides: {} },
    councilSpeechVideos: { byUrl: {} }
  };

  const model = buildValtuustotyoPage({ collections, ...deps });

  test("emits speeches + initiatives sorted canonically", () => {
    assert.equal(model.speeches.length, 2);
    assert.equal(model.speeches[0].url, "/talks/a/", "newer speech first");
    assert.equal(model.initiatives.length, 2);
    assert.equal(model.initiatives[0].url, "/politics/2/", "meetingDate 2026-09 > date 2024-11");
  });

  test("populates filter option arrays", () => {
    assert.deepEqual(model.speechYears, ["2026", "2025"]);
    assert.deepEqual(model.speechMeetings, ["6/2026"]);
    assert.deepEqual(model.initiativeYears, ["2026", "2024"]);
  });

  test("counts include speeches + initiatives + KPI buckets", () => {
    assert.equal(model.counts.speeches, 2);
    assert.equal(model.counts.initiatives, 2);
    assert.equal(model.counts.puheet, 0);
    assert.equal(model.counts.aloitteet, 2);
  });
});

// ============================================================
// Kynästä ↔ Valtuustotyö chronology parity
// ============================================================
describe("Kynästä ↔ Valtuustotyö chronology parity", () => {
  const speeches = [
    mkItem({ url: "/talks/a/", date: new Date("2026-06-15"), data: { title: "Puheenvuoro § 1: Alpha", type: "puhe", speechContext: "valtuusto" } }),
    mkItem({ url: "/talks/b/", date: new Date("2026-06-15"), data: { title: "Puheenvuoro § 2: Bravo", type: "puhe", speechContext: "valtuusto" } }),
    mkItem({ url: "/talks/c/", date: new Date("2025-06-01"), data: { title: "Puheenvuoro § 3: Charlie", type: "puhe", speechContext: "kyselytunti" } })
  ];
  const initiatives = [
    mkItem({ url: "/politics/x/", date: new Date("2024-01-01"), data: { title: "X", meetingDate: "2026-09-05" } }),
    mkItem({ url: "/politics/y/", date: new Date("2024-08-30"), data: { title: "Y" } })
  ];

  test("Kynästä first-5 council speeches match Valtuustotyö first-5 by URL", () => {
    const kynastaModel = buildKynastaHubModel({
      collections: {
        pub_puhe: speeches, politics: initiatives,
        blog: [], pub_mielipide: [], pub_kolumni: [], publications: []
      }
    });
    const valtModel = buildValtuustotyoPage({
      collections: {
        pub_puhe_valtuusto: speeches, politics: initiatives,
        pub_mielipide: [], pub_lausunto: [], pub_kolumni: [], pub_puhe: speeches, blog: []
      },
      councilMeetingMeta: { byDate: {} },
      oukaCouncilSpeechProtocols: { protocolsByDate: {}, overrides: {} },
      councilSpeechVideos: { byUrl: {} }
    });

    const kynastaFirst5 = kynastaModel.council.groups.speeches.latestItems
      .slice(0, 5)
      .map((x) => x.pageUrl);
    const valtFirst5 = valtModel.speeches.slice(0, 5).map((x) => x.url);
    assert.deepEqual(valtFirst5, kynastaFirst5, "hub-first-5 must equal archive-first-5 for council speeches");
  });

  test("Kynästä first-5 initiatives match Valtuustotyö first-5 by URL", () => {
    const kynastaModel = buildKynastaHubModel({
      collections: {
        pub_puhe: speeches, politics: initiatives,
        blog: [], pub_mielipide: [], pub_kolumni: [], publications: []
      }
    });
    const valtModel = buildValtuustotyoPage({
      collections: {
        pub_puhe_valtuusto: speeches, politics: initiatives,
        pub_mielipide: [], pub_lausunto: [], pub_kolumni: [], pub_puhe: speeches, blog: []
      },
      councilMeetingMeta: { byDate: {} },
      oukaCouncilSpeechProtocols: { protocolsByDate: {}, overrides: {} },
      councilSpeechVideos: { byUrl: {} }
    });

    const kynastaFirst5 = kynastaModel.council.groups.initiatives.latestItems
      .slice(0, 5)
      .map((x) => x.pageUrl);
    const valtFirst5 = valtModel.initiatives.slice(0, 5).map((x) => x.url);
    assert.deepEqual(valtFirst5, kynastaFirst5, "hub-first-5 must equal archive-first-5 for initiatives");
  });
});

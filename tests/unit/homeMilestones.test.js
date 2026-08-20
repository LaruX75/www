const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const cvData = require("../../src/_data/cv.json");
const researchProjects = require("../../src/_data/researchProjects");
const loadElectionHistory = require("../../src/_data/electionHistory");
const milestonesData = require("../../src/_data/milestones");
const { buildHomeMilestones } = require("../../src/_utils/homeMilestones");

const definitions = milestonesData.MILESTONE_DEFINITIONS;

function buildProjection() {
  return buildHomeMilestones({
    definitions,
    cvData,
    researchProjects,
    electionHistory: loadElectionHistory()
  });
}

describe("homeMilestones", () => {
  test("keeps deterministic ascending chronology with stable same-year ordering", () => {
    const projection = buildProjection();
    const ids = projection.milestones.map((item) => item.id);
    const years = projection.milestones.map((item) => Number.parseInt(item.year, 10));

    assert.deepEqual(ids.slice(0, 6), [
      "bbs-1989",
      "politics-2000-raahe",
      "research-assistant-2002",
      "km-2003",
      "rotuaari-2003",
      "mosil-2004"
    ]);
    assert.deepEqual(years.slice(0, 6), [1989, 2000, 2002, 2003, 2003, 2004]);
    assert.equal(projection.orderingViolations.length, 0);
  });

  test("reuses authoritative year and canonical route when available", () => {
    const projection = buildProjection();
    const lecturer = projection.milestones.find((item) => item.id === "university-lecturer-2013");
    const election2021 = projection.milestones.find((item) => item.id === "election-term-2021-2025");

    assert.equal(lecturer.year, "2013");
    assert.equal(lecturer.href, "/tyoni-yliopistonlehtorina/");
    assert.deepEqual(lecturer.authority.fields, ["year", "title", "href"]);

    assert.equal(election2021.year, "2021");
    assert.equal(election2021.title, "Vaalikausi 2021–2025 (Oulu)");
    assert.equal(election2021.href, "/politiikka/vaalikaudet/");
  });

  test("preserves phase markers as companion framing", () => {
    const projection = buildProjection();
    const milestonesWithPhase = projection.milestones.filter((item) => item.phaseStart);

    assert.equal(projection.phaseCount, 4);
    assert.equal(milestonesWithPhase.length, 4);
    assert.deepEqual(
      milestonesWithPhase.map((item) => item.phaseStart.label),
      ["1989–2001", "2002–2012", "2013–2021", "2022–"]
    );
  });

  test("does not infer contexts or research membership from homepage category", () => {
    const projection = buildProjection();
    const researchMilestone = projection.milestones.find((item) => item.id === "rotuaari-2003");

    assert.equal(researchMilestone.category, "tutkimus");
    assert.equal("contexts" in researchMilestone, false);
    assert.equal("research" in researchMilestone, false);
    assert.equal("researchMembership" in researchMilestone, false);
  });

  test("falls back to companion-owned milestone when no structured authority exists", () => {
    const projection = buildProjection();
    const bbsMilestone = projection.milestones.find((item) => item.id === "bbs-1989");

    assert.equal(bbsMilestone.year, "1989");
    assert.equal(bbsMilestone.title, "BBS-harrastus alkaa (Raahe)");
    assert.equal(
      bbsMilestone.href,
      "/1998/02/16/silloin-kun-sita-oltiin-larges-securityn-sysop-bbs-muisteluita/"
    );
    assert.equal(bbsMilestone.authority, null);
  });

  test("rejects duplicate milestone ids", () => {
    assert.throws(() => buildHomeMilestones({
      definitions: [
        {
          id: "dup",
          year: 2000,
          category: "opetus",
          title: "One",
          description: "One",
          href: "/cv/"
        },
        {
          id: "dup",
          year: 2001,
          category: "opetus",
          title: "Two",
          description: "Two",
          href: "/cv/"
        }
      ],
      cvData,
      researchProjects,
      electionHistory: loadElectionHistory()
    }), {
      code: "duplicate-milestone-id"
    });
  });
});

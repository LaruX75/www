const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const {
  historicalCourseEvidence,
  implementationSummaries,
  normalizeCourseUnitResponse
} = require("../../scripts/_lib/peppiAuditParser");

const unitRequest = {
  url: "https://opasbe.peppi.oulu.fi/api/lu/units/410014Y/COURSE_UNIT?period=2013-2014",
  status: 200,
  bodyPreview: JSON.stringify({
    learningUnits: [{
      learningUnitId: "3213",
      code: "410014Y",
      name: { valueFi: "Tieto- ja viestintätekniikka pedagogisena työvälineenä", valueEn: "Information and communication as a pedagogical tool" },
      type: "COURSE_UNIT"
    }]
  })
};

describe("Peppi audit parser", () => {
  test("normalizes an exact historical course-unit response", () => {
    assert.deepEqual(normalizeCourseUnitResponse(unitRequest, "410014Y", "2013-2014"), {
      courseUnitId: "3213",
      courseCode: "410014Y",
      nameFi: "Tieto- ja viestintätekniikka pedagogisena työvälineenä",
      nameEn: "Information and communication as a pedagogical tool",
      type: "COURSE_UNIT"
    });
  });

  test("records course identity without overstating missing implementation detail", () => {
    const evidence = historicalCourseEvidence([
      unitRequest,
      { url: "https://opasbe.peppi.oulu.fi/api/course/3213?period=2013-2014", status: 404 }
    ], "410014Y", "2013-2014");
    assert.equal(evidence.courseUnitId, "3213");
    assert.equal(evidence.implementationDetailStatus, 404);
    assert.equal(evidence.implementationIdentity, "DOES_NOT_PROVE");
  });

  test("does not accept another period or malformed JSON as evidence", () => {
    assert.equal(normalizeCourseUnitResponse(unitRequest, "410014Y", "2014-2015"), null);
    assert.equal(normalizeCourseUnitResponse({ ...unitRequest, bodyPreview: "not-json" }, "410014Y", "2013-2014"), null);
  });

  test("deduplicates current implementation codes and extracts date ranges", () => {
    assert.deepEqual(implementationSummaries([
      { text: "405040Y-3021 Teknologiatuettu oppiminen ilman loppupäivää" },
      { text: "405040Y-3021 Teknologiatuettu oppiminen 25.08.2026 - 08.10.2026" },
      { text: "405040Y-3022 Teknologiatuettu oppiminen 27.08.2026 - 27.11.2026" }
    ]).map(({ implementationCode, dateRange }) => ({ implementationCode, dateRange })), [
      { implementationCode: "405040Y-3021", dateRange: "25.08.2026 - 08.10.2026" },
      { implementationCode: "405040Y-3022", dateRange: "27.08.2026 - 27.11.2026" }
    ]);
  });
});

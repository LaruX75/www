/**
 * Testit src/_data/teachingUnits.js -mappaustaululle.
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const teachingUnits = require("../../src/_data/teachingUnits");
const { fromCourseContexts, OK, LET } = teachingUnits;

describe("teachingUnits mappaustaulu", () => {
  test("vakioarvot OK ja LET", () => {
    assert.equal(OK, "opettajankoulutus");
    assert.equal(LET, "let");
  });

  test("kaikki 5 OK-kurssia mapataan opettajankoulutus:iin", () => {
    for (const cid of ["410014Y", "410017Y", "050091A", "405021Y", "407062A"]) {
      assert.equal(teachingUnits[cid], "opettajankoulutus", `${cid} pitaisi olla OK`);
    }
  });

  test("kaikki 3 LET-kurssia mapataan let:iin", () => {
    for (const cid of ["418028P", "413314S", "413315S-01"]) {
      assert.equal(teachingUnits[cid], "let", `${cid} pitaisi olla LET`);
    }
  });
});

describe("fromCourseContexts helper", () => {
  test("palauttaa 'opettajankoulutus' 410014Y:sta", () => {
    const result = fromCourseContexts([
      { courseId: "410014Y", courseName: "TVT pedagogisena tyovalineena" }
    ]);
    assert.equal(result, "opettajankoulutus");
  });

  test("palauttaa 'let' 418028P:sta", () => {
    const result = fromCourseContexts([
      { courseId: "418028P", courseName: "Learning Environments" }
    ]);
    assert.equal(result, "let");
  });

  test("useampi courseContext: ensimmainen tunnistettu voittaa", () => {
    const result = fromCourseContexts([
      { courseId: "unknown-id" },
      { courseId: "413314S" }
    ]);
    assert.equal(result, "let");
  });

  test("tunnistamaton courseId => null", () => {
    const result = fromCourseContexts([{ courseId: "999999X" }]);
    assert.equal(result, null);
  });

  test("tyhja tai puuttuva syote => null", () => {
    assert.equal(fromCourseContexts(null), null);
    assert.equal(fromCourseContexts(undefined), null);
    assert.equal(fromCourseContexts([]), null);
    assert.equal(fromCourseContexts([{}]), null);
    assert.equal(fromCourseContexts("ei array"), null);
  });
});

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const fiAwardsPath = path.resolve(__dirname, "../../src/fi/palkinnot.md");
const enAwardsPath = path.resolve(__dirname, "../../src/en/awards.md");

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

describe("awards parity", () => {
  test("english awards page contains the canonical award years present on the Finnish page", () => {
    const fiAwards = read(fiAwardsPath);
    const enAwards = read(enAwardsPath);

    [
      "2026",
      "2025",
      "2020",
      "2014"
    ].forEach((year) => {
      assert.match(fiAwards, new RegExp(`>${year}<`));
      assert.match(enAwards, new RegExp(`>${year}<`));
    });

    assert.match(enAwards, /EU Digital Skills Award - AI literacy learning solution/);
    assert.match(enAwards, /Open Learning Award - Open Educational Resources/);
    assert.match(enAwards, /National Open Science Award/);
    assert.match(enAwards, /Teacher of the Year in Educational Technology/);
  });

  test("english grants match the verified canonical years and remove the erroneous 2008 entry", () => {
    const enAwards = read(enAwardsPath);

    [
      "2010",
      "2009",
      "2005"
    ].forEach((year) => {
      assert.match(enAwards, new RegExp(`>${year}<`));
    });

    assert.doesNotMatch(enAwards, />2008</);
    assert.match(enAwards, /Xerox Oy Fund/);
    assert.match(enAwards, /EARLI 2009 conference/);
    assert.match(enAwards, /Urpo and Maija-Liisa Harva Fund/);
  });

  test("english page includes the student recognition counterpart and official verification links", () => {
    const enAwards = read(enAwardsPath);

    assert.match(enAwards, /Student Recognition/);
    assert.match(enAwards, />2012</);
    assert.match(enAwards, /An Apple for a Good Teacher/);
    assert.match(enAwards, /generation-ai-stn\.fi\/ajankohtaista\/oulun-yliopiston-tutkijoita-mukana-palkitussa-tekoaelylukutaidon-oppimisratkaisussa\//);
    assert.match(enAwards, /avointiede\.fi\/fi\/ajankohtaista\/kyberturvallisuus-ja-tekoaly-aiheena-avoimen-oppimisen-palkinnoissa/);
    assert.match(enAwards, /avointiede\.fi\/fi\/ajankohtaista\/vuotuiset-avoimen-tieteen-palkinnot-2020-jaettu/);
    assert.match(enAwards, /itko\.tivia\.fi\/vuoden-tieto-ja-viestintatekniikkaopettaja\//);
  });
});

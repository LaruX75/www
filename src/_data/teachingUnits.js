/**
 * Kurssikoodi → opetuksellinen yksikko -mappaus.
 *
 * Sisaltaa Oulun yliopiston kurssit joilla Jari Laru on opettanut.
 * Kaksi paayksikkoa: opettajankoulutus (OK) ja Learning and Educational
 * Technology -tutkimusryhma/maisteriohjelma (LET).
 *
 * Kaytto: eleventyComputed lisaa itemin data.teachingUnit -kentan jos
 * data.courseContexts sisaltaa tunnistetun courseId:n. Kts.
 * src/presentations/presentations.11tydata.js.
 *
 * Valintaperusteet:
 * - Kurssien luokittelu perustuu Jarin omaan ilmoitukseen mihin yksikkoon
 *   kurssi kuuluu, ei kurssikoodin tekniseen luokitukseen (koska sama
 *   opettaja voi opettaa saman aihepiirin kurssia eri yksikossa).
 * - Esim. "Tieto- ja viestintätekniikka pedagogisena tyovalineena"
 *   (410014Y) on OK-kurssi vaikka aihe liittyy koulutusteknologiaan.
 */

const OK = "opettajankoulutus";
const LET = "let";

const teachingUnits = {
  // Opettajankoulutus (OK)
  "410014Y": OK,        // Tieto- ja viestintätekniikka pedagogisena työvälineenä
  "410017Y": OK,        // Multimedia / Digitaalinen media oppimisessa ja opettamisessa
  "050091A": OK,        // Tieto- ja viestintätekniikka opetuksessa ja opiskelussa
  "405021Y": OK,        // Tietotyö pedagogisena haasteena
  "405040Y": OK,        // Teknologiatuettu oppiminen ja työskentely
  "407062A": OK,        // Ohjelmointi perusopetuksessa

  // LET - Learning and Educational Technology (maisteriohjelma / tutkimusryhma)
  "418028P": LET,       // Learning Environments and Technologies (TEL)
  "413314S": LET,       // Designing TEL in Global School Systems (TEL2)
  "413315S-01": LET     // Research Methodology: Qualitative Research (QUALI)
};

module.exports = teachingUnits;
module.exports.OK = OK;
module.exports.LET = LET;

/**
 * Palauttaa teachingUnit-arvon jos courseContexts sisaltaa tunnistetun
 * courseId:n. Palauttaa null jos ei mappausta loydy.
 *
 * @param {Array} courseContexts - Frontmatter-kenttä courseContexts
 * @returns {string|null} "opettajankoulutus" | "let" | null
 */
module.exports.fromCourseContexts = function fromCourseContexts(courseContexts) {
  if (!Array.isArray(courseContexts)) return null;
  for (const cc of courseContexts) {
    const cid = cc && cc.courseId;
    if (cid && teachingUnits[cid]) return teachingUnits[cid];
  }
  return null;
};

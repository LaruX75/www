const { execFileSync } = require("child_process");
const path = require("path");

/**
 * Lataa git-lokista viimeisimman commit-paivamaaran jokaiselle
 * versionhallinnassa olevalle tiedostolle. Palauttaa hakemiston,
 * jonka avaimena on absoluuttinen tiedostopolku ja arvona ISO-8601
 * -paivamaara.
 *
 * Yhden ison log-ajon strategia (~1s per repo) on tehokkaampi kuin
 * kutsua git-log jokaiselle sivulle erikseen (~2s * 2500 = 80min).
 */
function loadGitDates() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const map = Object.create(null);

  try {
    const raw = execFileSync(
      "git",
      ["log", "--name-only", "--format=__COMMIT__%aI"],
      { cwd: projectRoot, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }
    );

    const lines = raw.split(/\r?\n/);
    let currentDate = null;

    for (const line of lines) {
      if (line.startsWith("__COMMIT__")) {
        currentDate = line.slice("__COMMIT__".length).trim();
        continue;
      }
      const rel = line.trim();
      if (!rel || !currentDate) continue;
      const absPath = path.resolve(projectRoot, rel);
      const relFromRoot = rel;
      const relEleventy = "./" + rel;
      const dateObj = new Date(currentDate);
      if (Number.isNaN(dateObj.getTime())) continue;
      for (const key of [absPath, relFromRoot, relEleventy]) {
        if (!(key in map)) {
          map[key] = dateObj;
        }
      }
    }
  } catch (err) {
    console.warn("[gitDates] git-log epaonnistui:", err.message);
  }

  return map;
}

const cache = loadGitDates();

module.exports = cache;

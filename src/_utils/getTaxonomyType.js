/**
 * Palauttaa itemin taxonomyType-avaimen ja FI-labelin (esim. valtuustopuheet,
 * mielipiteet, kolumnit, mediassa, tieteelliset julkaisut).
 *
 * Aiemmin logiikka asui eleventy.collections.js:n `registerCollections`-
 * funktion sisalla suljettuna closure-funktiona (rivit 29-68). Extraktoitu
 * itsenaiseksi moduuliksi jotta characterization-testit voivat lukita
 * nykyisen kayttaytymisen ennen resolver-refaktoria. Toteutus 1:1 sama.
 *
 * @param {{data?: object, inputPath?: string}} item - Eleventy collection item
 * @returns {{key: string, label: string}}
 */
function getTaxonomyType(item) {
  const data = item?.data || {};
  const inputPath = item?.inputPath || "";
  const type = data.type || "";
  const speechContext = String(data.speechContext || "").trim();

  if (inputPath.includes("/media/")) {
    return { key: "media", label: "Mediassa" };
  }

  if (inputPath.includes("/presentations/")) {
    return { key: "presentations", label: "Esitykset ja videot" };
  }

  if (type === "lausunto") return { key: "statements", label: "Lausunnot" };
  if (type === "puhe") {
    if (speechContext === "kyselytunti") return { key: "council-question-hours", label: "Valtuuston kyselytunnit" };
    if (speechContext === "valtuusto") return { key: "council-speeches", label: "Valtuustopuheenvuorot" };
    if (speechContext === "akateeminen-puhe") return { key: "academic-speeches", label: "Akateemiset puheet" };
    if (speechContext === "juhlapuhe") return { key: "ceremonial-speeches", label: "Juhlapuheet" };
    if (speechContext === "julkinen-tilaisuus") return { key: "public-speeches", label: "Julkiset puheet" };
    return { key: "speeches", label: "Puheet" };
  }
  if (type === "mielipide") return { key: "opinions", label: "Mielipiteet" };
  if (type === "kolumni") return { key: "columns", label: "Kolumnit" };

  if (inputPath.includes("/politics/")) {
    return { key: "initiatives", label: "Aloitteet ja asiat" };
  }

  if (inputPath.includes("/blog/")) {
    return { key: "blog", label: "Blogikirjoitukset" };
  }

  if (
    data.contentType === "scientificPublication"
    || data.source === "researchfi"
    || type === "tieteellinen"
  ) {
    return { key: "scientific-publications", label: "Tieteelliset julkaisut" };
  }

  return { key: "other", label: "Muut sisällöt" };
}

module.exports = getTaxonomyType;

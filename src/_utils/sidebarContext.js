/**
 * Sivupalkin (content-context-sidebar.njk) "Selaa samaa aineistoa" -linkin
 * konteksti: nayttolabel, arkiston URL ja arkiston linkkiteksti.
 *
 * Aiemmin logiikka asui src/_includes/content-context-sidebar.njk:n
 * riveilla 78-162 (82 rivin Nunjucks-ketju). Extraktoitu itsenaiseksi
 * JS-moduuliksi jotta:
 * - yksikkotestit mahdollistuvat
 * - sivupalkin sisaltotyyppipaattely yhdistyy resolveri-arkkitehtuuriin
 * - Nunjucks-templaatit kevenevat
 *
 * HUOM: Sidebar-labelit ovat tarkoituksellisesti RIKKAAMPIA kuin
 * resolveContentMeta:n contentTypeLabel:
 * - "Mediaosuma / video" vs "Video"
 * - "Poliittinen ja asiantuntijamielipide" vs "Mielipide"
 * - "Asiantuntijatehtava" vs (mediaType=assignment fallback)
 *
 * Lisaksi tuottaa `archiveHref` (usein URL-parametreilla, esim.
 * "/kirjoitukset/?opinions=hybrid#mielipiteet") ja `archiveLabel`
 * joita resolveContentMeta ei tuota.
 *
 * @param {object} data - Sivun data (mediaType, mediaRole, type, tags,
 *   speechContext, opinionRoles, agenda_title, contexts)
 * @param {("fi"|"en")} lang - Kielen valinta
 * @returns {{typeLabel: string, archiveHref: string, archiveLabel: string}}
 */

function toArray(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function sidebarContext(data = {}, lang = "fi") {
  const isEnglish = lang === "en";
  const tags = new Set(toArray(data.tags));
  const contexts = new Set(toArray(data.contexts));
  const opinionRoles = new Set(toArray(data.opinionRoles));
  const type = data.type || "";
  const speechContext = String(data.speechContext || "").trim();
  const mediaType = data.mediaType || "";
  const mediaRole = data.mediaRole || "";
  const isQuestionHour =
    data.agenda_title === "Valtuuston kyselytunti" ||
    contexts.has("Valtuuston kyselytunti");

  // Oletukset
  let archiveHref = isEnglish ? "/en/writings/" : "/kynasta/";
  let archiveLabel = isEnglish ? "All writings" : "Kaikki Kynästä-sisällöt";
  let typeLabel = isEnglish ? "Text" : "Kirjoitus";

  if (tags.has("media")) {
    archiveHref = "/mediassa/";
    archiveLabel = isEnglish ? "All media items" : "Kaikki mediaosumat";
    if (mediaType === "podcast") {
      typeLabel = "Podcast";
    } else if (mediaType === "assignment" || mediaRole === "expertAssignment") {
      typeLabel = "Asiantuntijatehtävä";
    } else if (mediaType === "video") {
      typeLabel = "Mediaosuma / video";
    } else if (mediaType === "radio") {
      typeLabel = "Mediaosuma / radio";
    } else if (mediaType === "article") {
      typeLabel = "Mediaosuma / lehtijuttu";
    } else {
      typeLabel = "Mediaosuma";
    }
  } else if (tags.has("presentations")) {
    archiveHref = isEnglish ? "/en/presentations/" : "/esitykset/";
    typeLabel = isEnglish ? "Presentation or material" : "Esitys tai materiaali";
    archiveLabel = isEnglish ? "All presentations" : "Kaikki esitykset";
  } else if (tags.has("blog")) {
    archiveHref = isEnglish ? "/en/blog/" : "/blogi/";
    typeLabel = isEnglish ? "Blog post" : "Blogikirjoitus";
    archiveLabel = isEnglish ? "All blog posts" : "Kaikki blogikirjoitukset";
  } else if (type === "puhe") {
    if (speechContext === "valtuusto") {
      archiveHref = isEnglish ? "/en/writings/#puheet" : "/valtuustotyo/#puheet";
      typeLabel = isEnglish ? "Council speech" : "Valtuustopuheenvuoro";
      archiveLabel = isEnglish ? "All council speeches" : "Kaikki valtuustopuheenvuorot";
    } else if (speechContext === "kyselytunti" || isQuestionHour) {
      archiveHref = isEnglish ? "/en/writings/#puheet" : "/valtuustotyo/#puheet";
      typeLabel = isEnglish ? "Council question hour" : "Valtuuston kyselytunti";
      archiveLabel = isEnglish ? "All council question hour items" : "Kaikki kyselytunnin sisällöt";
    } else {
      archiveHref = isEnglish ? "/en/writings/#puheet" : "/lausunnot/#julkiset-puheet";
      if (speechContext === "akateeminen-puhe") {
        typeLabel = isEnglish ? "Academic speech" : "Akateeminen puhe";
      } else if (speechContext === "juhlapuhe") {
        typeLabel = isEnglish ? "Ceremonial speech" : "Juhlapuhe";
      } else {
        typeLabel = isEnglish ? "Public speech" : "Julkinen puhe";
      }
      archiveLabel = isEnglish ? "All public speeches" : "Kaikki muut julkiset puheet";
    }
  } else if (type === "lausunto") {
    archiveHref = isEnglish ? "/en/writings/#lausunnot" : "/lausunnot/#lausunnot";
    typeLabel = isEnglish ? "Expert statement" : "Asiantuntijalausunto";
    archiveLabel = isEnglish ? "All expert statements" : "Kaikki asiantuntijalausunnot";
  } else if (type === "mielipide") {
    if (opinionRoles.has("political") && opinionRoles.has("expert")) {
      archiveHref = isEnglish
        ? "/en/writings/?opinions=hybrid#mielipiteet"
        : "/kirjoitukset/?opinions=hybrid#mielipiteet";
      typeLabel = isEnglish ? "Political + expert opinion" : "Poliittinen ja asiantuntijamielipide";
      archiveLabel = isEnglish
        ? "All political and expert opinions"
        : "Kaikki poliittiset ja asiantuntijamielipiteet";
    } else if (opinionRoles.has("political")) {
      archiveHref = isEnglish
        ? "/en/writings/?opinions=political#mielipiteet"
        : "/kirjoitukset/?opinions=political#mielipiteet";
      typeLabel = isEnglish ? "Political opinion" : "Poliittinen mielipide";
      archiveLabel = isEnglish ? "All political opinions" : "Kaikki poliittiset mielipiteet";
    } else if (opinionRoles.has("expert")) {
      archiveHref = isEnglish
        ? "/en/writings/?opinions=expert#mielipiteet"
        : "/kirjoitukset/?opinions=expert#mielipiteet";
      typeLabel = isEnglish ? "Expert opinion" : "Asiantuntijamielipide";
      archiveLabel = isEnglish ? "All expert opinions" : "Kaikki asiantuntijamielipiteet";
    } else {
      archiveHref = isEnglish ? "/en/writings/#mielipiteet" : "/kirjoitukset/#mielipiteet";
      typeLabel = isEnglish ? "Opinion" : "Mielipide";
      archiveLabel = isEnglish ? "All opinion pieces" : "Kaikki mielipidekirjoitukset";
    }
  } else if (type === "kolumni") {
    archiveHref = isEnglish ? "/en/writings/#kolumnit" : "/kirjoitukset/#kolumnit";
    typeLabel = isEnglish ? "Column" : "Kolumni";
    archiveLabel = isEnglish ? "All columns" : "Kaikki kolumnit";
  } else if (tags.has("politics")) {
    archiveHref = isEnglish ? "/en/writings/#aloitteet" : "/valtuustotyo/#aloitteet";
    typeLabel = isEnglish ? "Council initiative" : "Valtuustoaloite";
    archiveLabel = isEnglish ? "All council initiatives" : "Kaikki valtuustoaloitteet";
  }

  return { typeLabel, archiveHref, archiveLabel };
}

module.exports = sidebarContext;

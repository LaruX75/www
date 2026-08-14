(function () {
  "use strict";

  if (typeof document === "undefined") return;

  const abstractModalEl = document.getElementById("thesisAbstractModal");
  const citationModalEl = document.getElementById("thesisCitationModal");
  if (!abstractModalEl || !citationModalEl) return;

  const abstractTitleEl = document.getElementById("thesisAbstractModalTitle");
  const abstractTextEl = document.getElementById("thesisAbstractModalText");
  const abstractApaEl = document.getElementById("thesisModalApaText");
  const abstractOpenEl = document.getElementById("thesisAbstractModalOpen");
  const abstractExportBtn = document.getElementById("thesisAbstractExportBtn");
  const citationFormatSelect = document.getElementById("thesisCitationFormatSelect");
  const citationOutput = document.getElementById("thesisCitationOutput");
  const citationDownloadBtn = document.getElementById("thesisCitationDownloadBtn");
  const citationCopyBtn = document.getElementById("thesisCitationCopyBtn");
  const citationZoteroBtn = document.getElementById("thesisCitationZoteroBtn");
  const citationMendeleyBtn = document.getElementById("thesisCitationMendeleyBtn");

  let currentPayload = null;

  function pickString(value) {
    return String(value || "").trim();
  }

  function sanitizeFilenamePart(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "citation";
  }

  function downloadTextFile(fileName, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }

  function getThesisLevelLabel(payload) {
    if (payload.type === "masterThesis") return "Master's thesis";
    if (payload.type === "bachelorThesis") return "Bachelor's thesis";
    return "Thesis";
  }

  function buildThesisApa(payload) {
    const title = pickString(payload.title);
    const authors = pickString(payload.authors);
    const year = pickString(payload.year) || "n.d.";
    const url = pickString(payload.url);
    const level = getThesisLevelLabel(payload);
    let citation = `${authors} (${year}). ${title} [${level}, University of Oulu].`;
    if (url) citation += ` ${url}`;
    return citation.trim();
  }

  function buildThesisMla(payload) {
    const title = pickString(payload.title);
    const authors = pickString(payload.authors);
    const year = pickString(payload.year);
    const url = pickString(payload.url);
    const level = getThesisLevelLabel(payload);
    let citation = `${authors}. "${title}." ${level}, University of Oulu`;
    if (year) citation += `, ${year}`;
    citation += ".";
    if (url) citation += ` ${url}`;
    return citation.trim();
  }

  function buildThesisChicago(payload) {
    const title = pickString(payload.title);
    const authors = pickString(payload.authors);
    const year = pickString(payload.year) || "n.d.";
    const url = pickString(payload.url);
    const level = getThesisLevelLabel(payload);
    let citation = `${authors}. ${year}. "${title}." ${level}, University of Oulu.`;
    if (url) citation += ` ${url}`;
    return citation.trim();
  }

  function buildThesisBibTeX(payload) {
    const title = pickString(payload.title);
    const authors = pickString(payload.authors || "Laru, Jari");
    const year = pickString(payload.year);
    const thesisType = pickString(payload.type);
    const url = pickString(payload.url);
    const firstAuthor = authors.split(";")[0].trim();
    const lastName = (firstAuthor.split(",")[0].trim().split(/\s+/).pop() || "author")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const firstWord = ((title.match(/[A-Za-zÅÄÖåäö0-9]+/) || ["thesis"])[0])
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    const key = `${lastName}${year || "nd"}${firstWord}`;
    const bibType = thesisType === "masterThesis" ? "mastersthesis" : "misc";
    const safeTitle = title.replace(/[{}]/g, "");
    const safeAuthors = authors.replace(/[{}]/g, "");

    let bib = `@${bibType}{${key},\n`;
    bib += `  title = {${safeTitle}},\n`;
    bib += `  author = {${safeAuthors}},\n`;
    if (year) bib += `  year = {${year}},\n`;
    bib += "  school = {University of Oulu},\n";
    if (thesisType === "bachelorThesis") bib += "  note = {Bachelor's thesis},\n";
    if (url) bib += `  url = {${url}},\n`;
    bib += "}";
    return { bib, key };
  }

  function buildThesisRis(payload) {
    const title = pickString(payload.title);
    const authors = pickString(payload.authors)
      .split(";")
      .map((author) => author.trim())
      .filter(Boolean);
    const year = pickString(payload.year);
    const url = pickString(payload.url);
    const level = getThesisLevelLabel(payload);
    const lines = ["TY  - THES"];
    authors.forEach((author) => lines.push(`AU  - ${author}`));
    if (year) lines.push(`PY  - ${year}`);
    if (title) lines.push(`TI  - ${title}`);
    lines.push("PB  - University of Oulu");
    lines.push(`M3  - ${level}`);
    if (url) lines.push(`UR  - ${url}`);
    lines.push("ER  -");
    return lines.join("\n");
  }

  function getCitationByFormat(payload, format) {
    if (format === "apa") return buildThesisApa(payload);
    if (format === "mla") return buildThesisMla(payload);
    if (format === "chicago") return buildThesisChicago(payload);
    return buildThesisBibTeX(payload).bib;
  }

  function renderCitationPreview() {
    if (!currentPayload || !citationOutput) return;
    citationOutput.value = getCitationByFormat(currentPayload, citationFormatSelect?.value || "apa");
  }

  function openCitationModal(payload) {
    currentPayload = payload;
    renderCitationPreview();
    if (window.bootstrap?.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(citationModalEl).show();
    }
  }

  function openAbstractModal(payload) {
    currentPayload = payload;
    if (abstractTitleEl) abstractTitleEl.textContent = payload.title || "";
    if (abstractTextEl) abstractTextEl.textContent = payload.abstract || "";
    if (abstractApaEl) abstractApaEl.textContent = buildThesisApa(payload);
    if (abstractOpenEl) abstractOpenEl.href = payload.url || "#";
    if (window.bootstrap?.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(abstractModalEl).show();
    }
  }

  document.addEventListener("click", (event) => {
    const abstractTrigger = event.target.closest("[data-thesis-abstract-trigger]");
    if (abstractTrigger) {
      event.preventDefault();
      openAbstractModal({
        title: abstractTrigger.dataset.thesisTitle || "",
        abstract: abstractTrigger.dataset.thesisAbstract || "",
        url: abstractTrigger.dataset.thesisUrl || "",
        authors: abstractTrigger.dataset.thesisAuthors || "",
        year: abstractTrigger.dataset.thesisYear || "",
        type: abstractTrigger.dataset.thesisType || ""
      });
      return;
    }

    const citationTrigger = event.target.closest("[data-thesis-citation-trigger]");
    if (citationTrigger) {
      event.preventDefault();
      openCitationModal({
        title: citationTrigger.dataset.thesisTitle || "",
        authors: citationTrigger.dataset.thesisAuthors || "",
        year: citationTrigger.dataset.thesisYear || "",
        type: citationTrigger.dataset.thesisType || "",
        url: citationTrigger.dataset.thesisUrl || ""
      });
    }
  });

  abstractExportBtn?.addEventListener("click", () => {
    if (!currentPayload) return;
    openCitationModal(currentPayload);
  });

  citationFormatSelect?.addEventListener("change", renderCitationPreview);

  citationDownloadBtn?.addEventListener("click", () => {
    if (!currentPayload) return;
    const format = citationFormatSelect?.value || "apa";
    const content = getCitationByFormat(currentPayload, format);
    const ext = format === "bibtex" ? "bib" : "txt";
    const base = sanitizeFilenamePart(currentPayload.title || currentPayload.authors || "citation");
    downloadTextFile(`${base}.${ext}`, `${content}\n`);
  });

  citationCopyBtn?.addEventListener("click", async () => {
    if (!citationOutput?.value) return;
    try {
      await navigator.clipboard.writeText(citationOutput.value);
      citationCopyBtn.innerHTML = '<i class="bi bi-check2 me-1"></i>Copied';
      window.setTimeout(() => {
        citationCopyBtn.innerHTML = '<i class="bi bi-clipboard me-1"></i>Copy';
      }, 1200);
    } catch {
      citationOutput.select();
      document.execCommand("copy");
    }
  });

  citationZoteroBtn?.addEventListener("click", () => {
    if (!currentPayload) return;
    const base = sanitizeFilenamePart(currentPayload.title || currentPayload.authors || "citation");
    downloadTextFile(`${base}.ris`, `${buildThesisRis(currentPayload)}\n`);
  });

  citationMendeleyBtn?.addEventListener("click", () => {
    if (!currentPayload) return;
    const base = sanitizeFilenamePart(currentPayload.title || currentPayload.authors || "citation");
    downloadTextFile(`${base}.ris`, `${buildThesisRis(currentPayload)}\n`);
  });
})();

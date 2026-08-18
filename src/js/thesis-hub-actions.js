(function () {
  "use strict";

  if (typeof document === "undefined") return;

  // TH-CITE1 Phase 4B: the citation modal is now the only required
  // modal on the thesis detail page. The abstract-modal was tied to
  // the pre-Phase-3 rich archive-card UX and is no longer restored.
  // If a page still ships an abstract modal (nothing does after 4B),
  // its handlers stay wired for backward compat; otherwise the
  // abstract-modal code paths are simply skipped.
  const citationModalEl = document.getElementById("thesisCitationModal");
  if (!citationModalEl) return;
  const abstractModalEl = document.getElementById("thesisAbstractModal");

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

  const UNAVAILABLE_FI = "Lähdeviite ei saatavilla";
  const UNAVAILABLE_EN = "Citation unavailable";

  let currentPayload = null;
  let lastTriggerEl = null;

  function unavailableMessage(payload) {
    return (payload && payload.lang === "en") ? UNAVAILABLE_EN : UNAVAILABLE_FI;
  }

  function setCitationButtonsEnabled(enabled) {
    [citationCopyBtn, citationDownloadBtn, citationZoteroBtn, citationMendeleyBtn].forEach(function (btn) {
      if (btn) btn.disabled = !enabled;
    });
  }

  function flashUnavailable(button, label) {
    if (!button) return;
    const previous = button.innerHTML;
    button.disabled = true;
    button.innerHTML = label;
    window.setTimeout(function () {
      button.innerHTML = previous;
      // Do not re-enable the button here — buttons re-enable when a
      // subsequent render produces non-empty text.
    }, 1400);
  }

  // TH-CITE1 Phase 4B: shared-renderer preferred path. Publications
  // solved the equivalent problem in PUB-CITE1 Phase 4b — this
  // mirror keeps the wiring consistent across domains.
  function sharedCitation(payload, format) {
    if (!payload || !payload.csl || typeof window === "undefined" || !window.publicationCitation) {
      return { text: "", empty: true };
    }
    const style = format === "bibtex" ? "bibtex"
      : format === "ris" ? "ris"
      : format === "mla" ? "mla"
      : format === "chicago" ? "chicago"
      : "apa";
    try {
      const rendered = window.publicationCitation.buildCitation({
        csl: payload.csl,
        style: style,
        lang: payload.lang || "fi"
      });
      if (!rendered || rendered.empty || !rendered.text) return { text: "", empty: true };
      return { text: rendered.text, empty: false };
    } catch (_) {
      return { text: "", empty: true };
    }
  }

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

  // TH-CITE1 Phase 4B: legacy raw-field dispatcher, kept for Phase 4C
  // deletion. All active consumers hit sharedCitation first via
  // renderCitationPreview → citation preview / download / copy /
  // zotero / mendeley. Only reachable when the payload carries no
  // csl object, which does not happen for any Phase 4B trigger.
  function getCitationByFormat(payload, format) {
    if (format === "apa") return buildThesisApa(payload);
    if (format === "mla") return buildThesisMla(payload);
    if (format === "chicago") return buildThesisChicago(payload);
    if (format === "ris") return buildThesisRis(payload);
    return buildThesisBibTeX(payload).bib;
  }

  function renderCitationPreview() {
    if (!currentPayload || !citationOutput) return;
    const format = (citationFormatSelect && citationFormatSelect.value) || "apa";
    const rendered = sharedCitation(currentPayload, format);
    if (rendered.empty) {
      // No fabrication. If the shared renderer cannot compose from
      // canonical CSL, show a controlled empty state and disable
      // action buttons. Legacy raw-field composers are retained in
      // this file only until Phase 4C proves this branch stays
      // unreachable for every consumer.
      if (currentPayload && currentPayload.csl) {
        citationOutput.value = unavailableMessage(currentPayload);
        setCitationButtonsEnabled(false);
        return;
      }
      citationOutput.value = getCitationByFormat(currentPayload, format);
      setCitationButtonsEnabled(true);
      return;
    }
    citationOutput.value = rendered.text;
    setCitationButtonsEnabled(true);
  }

  function openCitationModal(payload, triggerEl) {
    currentPayload = payload;
    lastTriggerEl = triggerEl || null;
    if (citationFormatSelect) citationFormatSelect.value = "apa";
    renderCitationPreview();
    if (window.bootstrap && window.bootstrap.Modal) {
      const instance = window.bootstrap.Modal.getOrCreateInstance(citationModalEl);
      instance.show();
    }
  }

  // Return focus to the opener when the modal closes — Bootstrap
  // handles this automatically for buttons that opened via
  // data-bs-toggle but our trigger is JS-driven, so wire it here.
  citationModalEl.addEventListener("hidden.bs.modal", function () {
    if (lastTriggerEl && typeof lastTriggerEl.focus === "function") {
      lastTriggerEl.focus();
    }
  });

  function openAbstractModal(payload) {
    if (!abstractModalEl) return;
    currentPayload = payload;
    if (abstractTitleEl) abstractTitleEl.textContent = payload.title || "";
    if (abstractTextEl) abstractTextEl.textContent = payload.abstract || "";
    if (abstractApaEl) abstractApaEl.textContent = buildThesisApa(payload);
    if (abstractOpenEl) abstractOpenEl.href = payload.url || "#";
    if (window.bootstrap && window.bootstrap.Modal) {
      window.bootstrap.Modal.getOrCreateInstance(abstractModalEl).show();
    }
  }

  function readCitationTriggerPayload(triggerEl) {
    let csl = null;
    if (triggerEl.dataset.thesisCsl) {
      try { csl = JSON.parse(triggerEl.dataset.thesisCsl); } catch (_) { csl = null; }
    }
    return {
      csl: csl,
      title: triggerEl.dataset.thesisTitle || "",
      authors: triggerEl.dataset.thesisAuthors || "",
      year: triggerEl.dataset.thesisYear || "",
      type: triggerEl.dataset.thesisType || "",
      url: triggerEl.dataset.thesisUrl || "",
      lang: triggerEl.dataset.thesisLang || "fi"
    };
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
      openCitationModal(readCitationTriggerPayload(citationTrigger), citationTrigger);
    }
  });

  abstractExportBtn?.addEventListener("click", () => {
    if (!currentPayload) return;
    openCitationModal(currentPayload);
  });

  citationFormatSelect?.addEventListener("change", renderCitationPreview);

  function copyLabel(payload, done) {
    const en = payload && payload.lang === "en";
    if (done) return en ? '<i class="bi bi-check2 me-1"></i>Copied' : '<i class="bi bi-check2 me-1"></i>Kopioitu';
    return en ? '<i class="bi bi-clipboard me-1"></i>Copy' : '<i class="bi bi-clipboard me-1"></i>Kopioi';
  }

  citationDownloadBtn?.addEventListener("click", () => {
    if (!currentPayload) return;
    const format = (citationFormatSelect && citationFormatSelect.value) || "apa";
    const rendered = sharedCitation(currentPayload, format);
    let content;
    if (!rendered.empty) {
      content = rendered.text;
    } else if (currentPayload.csl) {
      // Shared renderer returned empty for a CSL-bearing payload —
      // controlled unavailable state; do not fabricate from raw
      // fields.
      if (citationOutput) citationOutput.value = unavailableMessage(currentPayload);
      setCitationButtonsEnabled(false);
      flashUnavailable(citationDownloadBtn, '<i class="bi bi-exclamation-triangle me-1"></i>' + (currentPayload.lang === "en" ? "Unavailable" : "Ei saatavilla"));
      return;
    } else {
      // Legacy fallback (unreachable from Phase 4B triggers).
      content = getCitationByFormat(currentPayload, format);
    }
    const ext = format === "bibtex" ? "bib" : format === "ris" ? "ris" : "txt";
    const base = sanitizeFilenamePart(currentPayload.title || currentPayload.authors || "citation");
    downloadTextFile(`${base}.${ext}`, `${content}\n`);
  });

  citationCopyBtn?.addEventListener("click", async () => {
    if (!citationOutput?.value) return;
    if (citationOutput.value === unavailableMessage(currentPayload)) return;
    try {
      await navigator.clipboard.writeText(citationOutput.value);
      citationCopyBtn.innerHTML = copyLabel(currentPayload, true);
      window.setTimeout(() => {
        citationCopyBtn.innerHTML = copyLabel(currentPayload, false);
      }, 1400);
    } catch {
      citationOutput.select();
      document.execCommand("copy");
    }
  });

  function downloadRisFor(payload, filenameSuffix, button) {
    const rendered = sharedCitation(payload, "ris");
    let content;
    if (!rendered.empty) {
      content = rendered.text;
    } else if (payload.csl) {
      if (citationOutput) citationOutput.value = unavailableMessage(payload);
      setCitationButtonsEnabled(false);
      flashUnavailable(button, '<i class="bi bi-exclamation-triangle me-1"></i>' + (payload.lang === "en" ? "Unavailable" : "Ei saatavilla"));
      return;
    } else {
      content = buildThesisRis(payload);
    }
    const base = sanitizeFilenamePart(payload.title || payload.authors || "citation");
    downloadTextFile(`${base}-${filenameSuffix}.ris`, `${content}\n`);
  }

  citationZoteroBtn?.addEventListener("click", () => {
    if (!currentPayload) return;
    downloadRisFor(currentPayload, "zotero", citationZoteroBtn);
  });

  citationMendeleyBtn?.addEventListener("click", () => {
    if (!currentPayload) return;
    downloadRisFor(currentPayload, "mendeley", citationMendeleyBtn);
  });
})();

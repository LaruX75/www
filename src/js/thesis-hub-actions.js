/**
 * thesis-hub-actions — TH-CITE1 Phase 4C.
 *
 * Pure interaction layer for the thesis detail-page citation/export
 * modal. This module owns:
 *   - modal open/close + focus return
 *   - format selection
 *   - preview update through the shared renderer
 *   - clipboard copy
 *   - download (Copy / .txt / .bib / .ris)
 *   - Zotero / Mendeley RIS download
 *   - controlled unavailable-state messaging
 *   - filename sanitisation
 *
 * All bibliographic composition happens in
 *   src/js/publication-citation.js
 * via `window.publicationCitation.buildCitation({csl, style, lang})`.
 * This file no longer contains any citation/export composer. Missing
 * or malformed CSL surfaces as a controlled unavailable state — the
 * browser never rebuilds bibliographic truth from raw thesis fields.
 */
(function () {
  "use strict";

  if (typeof document === "undefined") return;

  const citationModalEl = document.getElementById("thesisCitationModal");
  if (!citationModalEl) return;

  const citationFormatSelect = document.getElementById("thesisCitationFormatSelect");
  const citationOutput = document.getElementById("thesisCitationOutput");
  const citationDownloadBtn = document.getElementById("thesisCitationDownloadBtn");
  const citationCopyBtn = document.getElementById("thesisCitationCopyBtn");
  const citationZoteroBtn = document.getElementById("thesisCitationZoteroBtn");
  const citationMendeleyBtn = document.getElementById("thesisCitationMendeleyBtn");

  const UNAVAILABLE_FI = "Lähdeviite ei saatavilla";
  const UNAVAILABLE_EN = "Citation unavailable";

  // TH-CITE1 Phase 4C: MIME types per download format. Human-readable
  // citation styles keep text/plain; machine-export formats use their
  // registered MIME so downstream reference managers receive the
  // expected content-type on the download.
  const MIME_TEXT = "text/plain;charset=utf-8";
  const MIME_BIBTEX = "application/x-bibtex;charset=utf-8";
  const MIME_RIS = "application/x-research-info-systems;charset=utf-8";

  let currentPayload = null;
  let lastTriggerEl = null;

  function isEn(payload) {
    return !!(payload && payload.lang === "en");
  }

  function unavailableMessage(payload) {
    return isEn(payload) ? UNAVAILABLE_EN : UNAVAILABLE_FI;
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
    }, 1400);
  }

  // Shared-renderer call. Returns {text, empty}. Never fabricates.
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

  function sanitizeFilenamePart(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "citation";
  }

  // Filename base derives from CSL truth: title first, then first
  // structured author family, then a stable fallback. No raw-field
  // parallel model.
  function filenameBase(payload) {
    if (!payload || !payload.csl) return "citation";
    const csl = payload.csl;
    if (csl.title) return sanitizeFilenamePart(csl.title);
    if (Array.isArray(csl.author) && csl.author.length) {
      const first = csl.author[0] || {};
      const name = first.family || first.literal || "";
      if (name) return sanitizeFilenamePart(name);
    }
    return "citation";
  }

  function extensionFor(format) {
    if (format === "bibtex") return "bib";
    if (format === "ris") return "ris";
    return "txt";
  }

  function mimeFor(format) {
    if (format === "bibtex") return MIME_BIBTEX;
    if (format === "ris") return MIME_RIS;
    return MIME_TEXT;
  }

  function downloadTextFile(fileName, content, mime) {
    const blob = new Blob([content], { type: mime || MIME_TEXT });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(link.href);
    document.body.removeChild(link);
  }

  function unavailableButtonLabel(payload) {
    return '<i class="bi bi-exclamation-triangle me-1"></i>' + (isEn(payload) ? "Unavailable" : "Ei saatavilla");
  }

  function copyLabel(payload, done) {
    if (done) return isEn(payload)
      ? '<i class="bi bi-check2 me-1"></i>Copied'
      : '<i class="bi bi-check2 me-1"></i>Kopioitu';
    return isEn(payload)
      ? '<i class="bi bi-clipboard me-1"></i>Copy'
      : '<i class="bi bi-clipboard me-1"></i>Kopioi';
  }

  function renderCitationPreview() {
    if (!currentPayload || !citationOutput) return;
    const format = (citationFormatSelect && citationFormatSelect.value) || "apa";
    const rendered = sharedCitation(currentPayload, format);
    if (rendered.empty) {
      citationOutput.value = unavailableMessage(currentPayload);
      setCitationButtonsEnabled(false);
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
      window.bootstrap.Modal.getOrCreateInstance(citationModalEl).show();
    }
  }

  citationModalEl.addEventListener("hidden.bs.modal", function () {
    if (lastTriggerEl && typeof lastTriggerEl.focus === "function") {
      lastTriggerEl.focus();
    }
  });

  function readCitationTriggerPayload(triggerEl) {
    let csl = null;
    if (triggerEl.dataset.thesisCsl) {
      try { csl = JSON.parse(triggerEl.dataset.thesisCsl); } catch (_) { csl = null; }
    }
    return {
      csl: csl,
      lang: triggerEl.dataset.thesisLang || "fi"
    };
  }

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-thesis-citation-trigger]");
    if (!trigger) return;
    event.preventDefault();
    openCitationModal(readCitationTriggerPayload(trigger), trigger);
  });

  if (citationFormatSelect) {
    citationFormatSelect.addEventListener("change", renderCitationPreview);
  }

  if (citationDownloadBtn) {
    citationDownloadBtn.addEventListener("click", function () {
      if (!currentPayload) return;
      const format = (citationFormatSelect && citationFormatSelect.value) || "apa";
      const rendered = sharedCitation(currentPayload, format);
      if (rendered.empty) {
        if (citationOutput) citationOutput.value = unavailableMessage(currentPayload);
        setCitationButtonsEnabled(false);
        flashUnavailable(citationDownloadBtn, unavailableButtonLabel(currentPayload));
        return;
      }
      const base = filenameBase(currentPayload);
      downloadTextFile(base + "." + extensionFor(format), rendered.text + "\n", mimeFor(format));
    });
  }

  if (citationCopyBtn) {
    citationCopyBtn.addEventListener("click", async function () {
      if (!citationOutput || !citationOutput.value) return;
      if (citationOutput.value === unavailableMessage(currentPayload)) return;
      try {
        await navigator.clipboard.writeText(citationOutput.value);
        citationCopyBtn.innerHTML = copyLabel(currentPayload, true);
        window.setTimeout(function () {
          citationCopyBtn.innerHTML = copyLabel(currentPayload, false);
        }, 1400);
      } catch (_) {
        citationOutput.select();
        document.execCommand("copy");
      }
    });
  }

  function downloadRisFor(payload, filenameSuffix, button) {
    const rendered = sharedCitation(payload, "ris");
    if (rendered.empty) {
      if (citationOutput) citationOutput.value = unavailableMessage(payload);
      setCitationButtonsEnabled(false);
      flashUnavailable(button, unavailableButtonLabel(payload));
      return;
    }
    const base = filenameBase(payload);
    downloadTextFile(base + "-" + filenameSuffix + ".ris", rendered.text + "\n", MIME_RIS);
  }

  if (citationZoteroBtn) {
    citationZoteroBtn.addEventListener("click", function () {
      if (!currentPayload) return;
      downloadRisFor(currentPayload, "zotero", citationZoteroBtn);
    });
  }

  if (citationMendeleyBtn) {
    citationMendeleyBtn.addEventListener("click", function () {
      if (!currentPayload) return;
      downloadRisFor(currentPayload, "mendeley", citationMendeleyBtn);
    });
  }
}());

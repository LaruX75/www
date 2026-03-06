document.addEventListener("DOMContentLoaded", () => {
  const wrappers = Array.from(document.querySelectorAll(".external-media-consent"));
  if (wrappers.length === 0) return;

  const lang = (document.documentElement.lang || "fi").toLowerCase().startsWith("en") ? "en" : "fi";
  const messages = {
    fi: {
      text: "Tämä sisältö ladataan ulkoisesta palvelusta, joka voi asettaa evästeitä tai kerätä tietoja.",
      loadOne: "Lataa sisältö",
      allowAll: "Salli kaikki ulkoiset upotukset",
    },
    en: {
      text: "This content is loaded from an external service that may set cookies or collect data.",
      loadOne: "Load content",
      allowAll: "Allow all external embeds",
    },
  };
  const ui = messages[lang];
  const consentKey = "external_media_consent";
  let hasGlobalConsent = false;
  try {
    hasGlobalConsent = localStorage.getItem(consentKey) === "accepted";
  } catch (_) {
    hasGlobalConsent = false;
  }

  function loadWrapper(wrapper) {
    const iframe = wrapper.querySelector("iframe[data-consent-src]");
    const notice = wrapper.querySelector("[data-external-media-notice]");
    if (!iframe) return;
    if (!iframe.getAttribute("src")) {
      iframe.setAttribute("src", iframe.getAttribute("data-consent-src"));
    }
    iframe.hidden = false;
    if (notice) notice.hidden = true;
  }

  function loadAllAndPersist() {
    try {
      localStorage.setItem(consentKey, "accepted");
    } catch (_) { }
    wrappers.forEach(loadWrapper);
  }

  wrappers.forEach((wrapper) => {
    const textEl = wrapper.querySelector("[data-external-media-text]");
    const loadBtn = wrapper.querySelector("[data-external-media-load]");
    const allowAllBtn = wrapper.querySelector("[data-external-media-allow-all]");

    if (textEl) textEl.textContent = ui.text;
    if (loadBtn) {
      loadBtn.textContent = ui.loadOne;
      loadBtn.addEventListener("click", () => loadWrapper(wrapper));
    }
    if (allowAllBtn) {
      allowAllBtn.textContent = ui.allowAll;
      allowAllBtn.addEventListener("click", loadAllAndPersist);
    }
  });

  if (hasGlobalConsent) {
    wrappers.forEach(loadWrapper);
  }
});

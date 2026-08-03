function stripQueryAndHash(url) {
  return String(url || "").replace(/[?#].*$/, "");
}

function getCanvaDesignId(url) {
  const value = String(url || "").trim();
  if (!value) return "";

  const stripped = stripQueryAndHash(value);
  try {
    const parsed = new URL(stripped);
    if (!/^www\.canva\.com$/i.test(parsed.hostname)) return "";

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "d" && parts[1]) return parts[1];
    if (parts[0] === "design" && parts[1]) return parts[1];
  } catch (_) {
    return "";
  }

  return "";
}

function hasCanvaPublicUrl(url) {
  const value = String(url || "").trim();
  if (!value) return false;

  const stripped = stripQueryAndHash(value);
  try {
    const parsed = new URL(stripped);
    if (/^canva\.link$/i.test(parsed.hostname)) return true;
    if (!/^www\.canva\.com$/i.test(parsed.hostname)) return false;

    const parts = parsed.pathname.split("/").filter(Boolean);
    // canva.com/d/[view-token]
    if (parts[0] === "d" && parts[1]) return true;
    // canva.com/design/DESIGN_ID/SHARE_ID/view
    if (parts[0] === "design" && parts[1] && parts[2]) {
      return !["view", "edit"].includes(parts[2]);
    }
    return false;
  } catch (_) {
    return false;
  }
}

function normalizeCanvaUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";

  const stripped = stripQueryAndHash(value);
  try {
    const parsed = new URL(stripped);
    if (/^canva\.link$/i.test(parsed.hostname)) return stripped;
    if (!/^www\.canva\.com$/i.test(parsed.hostname)) return "";

    const parts = parsed.pathname.split("/").filter(Boolean);
    // canva.com/d/[view-token] — palauta sellaisenaan (toimiva view-linkki)
    if (parts[0] === "d" && parts[1]) {
      return stripped;
    }
    // canva.com/design/DESIGN_ID/SHARE_ID/view
    if (parts[0] === "design" && parts[1] && parts[2]) {
      const designId = parts[1];
      const maybeShareId = parts[2] || "";
      if (maybeShareId && !["view", "edit"].includes(maybeShareId)) {
        return `https://www.canva.com/design/${designId}/${maybeShareId}/view`;
      }
    }
  } catch (_) {
    return "";
  }

  return "";
}

function rewriteCanvaUrlsInText(content) {
  return String(content || "").replace(
    /https?:\/\/www\.canva\.com\/design\/[A-Za-z0-9_-]+\/[A-Za-z0-9_-]+(?:\/(?:edit|view))?(?:[^\s"'<>)]*)?/gi,
    (match) => normalizeCanvaUrl(match)
  );
}

module.exports = {
  getCanvaDesignId,
  hasCanvaPublicUrl,
  normalizeCanvaUrl,
  stripQueryAndHash,
  rewriteCanvaUrlsInText
};

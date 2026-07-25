function stripQueryAndHash(url) {
  return String(url || "").replace(/[?#].*$/, "");
}

function normalizeCanvaUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";

  const stripped = stripQueryAndHash(value);
  try {
    const parsed = new URL(stripped);
    if (!/^www\.canva\.com$/i.test(parsed.hostname)) return stripped;

    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts[0] === "d" && parts[1]) {
      return `https://www.canva.com/design/${parts[1]}/view`;
    }

    if (parts[0] === "design" && parts[1]) {
      const designId = parts[1];
      const maybeShareId = parts[2] || "";
      const maybeMode = parts[3] || "";

      if (maybeShareId && !["view", "edit"].includes(maybeShareId)) {
        return `https://www.canva.com/design/${designId}/${maybeShareId}/view`;
      }

      if (maybeMode && ["view", "edit"].includes(maybeMode)) {
        return `https://www.canva.com/design/${designId}/${maybeShareId}/view`;
      }

      return `https://www.canva.com/design/${designId}/view`;
    }
  } catch (_) {
    return stripped;
  }

  return stripped;
}

function rewriteCanvaUrlsInText(content) {
  return String(content || "").replace(
    /https?:\/\/www\.canva\.com\/(?:d\/[A-Za-z0-9_-]+|design\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)?(?:\/(?:edit|view))?)(?:[^\s"'<>)]*)?/gi,
    (match) => normalizeCanvaUrl(match)
  );
}

module.exports = {
  normalizeCanvaUrl,
  rewriteCanvaUrlsInText
};

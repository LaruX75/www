/**
 * content-engine.js — selainkerroksen headless content engine.
 *
 * Rooli:
 *   - Datalähteen fetch (per-source-cache) — käyttää window.PE.loadJsonEndpointia
 *   - Delegoi suodatus/haku/sortti/limit window.ContentPresets.queryPreset:ille
 *   - Ei DOM-käsittelyä, ei render-callbackeja, ei UI-oletuksia
 *
 * Riippuvuudet (ladattava ENNEN tätä):
 *   - /js/pe-list-render.js   (window.PE.loadJsonEndpoint)
 *   - /js/content-presets.js  (window.ContentPresets)
 *
 * Julkinen API:
 *   window.ContentEngine.query(presetNameOrSpec, overrides)
 *   window.ContentEngine.prefetch(source)
 *   window.ContentEngine.clearCache([source])
 *
 * Käyttö:
 *   const { items, total, offset, limit, source } =
 *     await window.ContentEngine.query({
 *       source: "content",
 *       filters: { contentType: ["blogPost", "opinion"], year: 2026 },
 *       search: "tekoäly",
 *       sort: "date-desc",
 *       limit: 20,
 *       offset: 0
 *     });
 */

(function (global) {
  "use strict";

  const _cache = new Map();

  function ensureDeps() {
    if (!global.PE || typeof global.PE.loadJsonEndpoint !== "function") {
      console.error("content-engine: window.PE.loadJsonEndpoint puuttuu (lataa /js/pe-list-render.js ensin)");
      return false;
    }
    if (!global.ContentPresets || typeof global.ContentPresets.queryPreset !== "function") {
      console.error("content-engine: window.ContentPresets puuttuu (lataa /js/content-presets.js ensin)");
      return false;
    }
    return true;
  }

  function resolveEndpointUrl(source) {
    const endpoints = global.ContentPresets && global.ContentPresets.ENDPOINTS;
    if (!endpoints || !endpoints[source]) {
      throw new Error("content-engine: unknown source '" + source + "'");
    }
    return endpoints[source];
  }

  function fetchEndpointOnce(source) {
    if (_cache.has(source)) return _cache.get(source);
    const url = resolveEndpointUrl(source);
    const promise = global.PE.loadJsonEndpoint(url, { items: [] })
      .then(function (data) {
        return Array.isArray(data && data.items) ? data.items : [];
      })
      .catch(function (err) {
        console.error("content-engine: fetch failed for source '" + source + "'", err);
        return [];
      });
    _cache.set(source, promise);
    return promise;
  }

  async function query(presetNameOrSpec, overrides) {
    if (!ensureDeps()) {
      return { items: [], total: 0, offset: 0, limit: 0, source: null };
    }
    // Resolvoi source ennen fetchia
    const baseSpec = typeof presetNameOrSpec === "string"
      ? (global.ContentPresets.PRESETS[presetNameOrSpec] || null)
      : presetNameOrSpec;
    if (!baseSpec) {
      throw new Error("content-engine: unknown preset '" + presetNameOrSpec + "'");
    }
    const mergedSource = (overrides && overrides.source) || baseSpec.source;
    if (!mergedSource) {
      throw new Error("content-engine: spec.source is required");
    }
    const items = await fetchEndpointOnce(mergedSource);
    return global.ContentPresets.queryPreset(items, presetNameOrSpec, overrides);
  }

  function prefetch(source) {
    if (!ensureDeps()) return Promise.resolve([]);
    return fetchEndpointOnce(source);
  }

  function clearCache(source) {
    if (source) {
      _cache.delete(source);
    } else {
      _cache.clear();
    }
  }

  global.ContentEngine = {
    query: query,
    prefetch: prefetch,
    clearCache: clearCache
  };
})(typeof window !== "undefined" ? window : this);

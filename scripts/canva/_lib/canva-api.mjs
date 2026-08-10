/**
 * Canva Connect API — pieni fetch-wrapper.
 *
 * Docs: https://www.canva.dev/docs/connect/api-reference/
 * Base URL: https://api.canva.com/rest/v1
 */

import { getAccessToken } from "./canva-auth.mjs";

const BASE = "https://api.canva.com/rest/v1";

async function apiFetch(pathAndQuery, options = {}) {
  const token = await getAccessToken();
  const url = pathAndQuery.startsWith("http") ? pathAndQuery : `${BASE}${pathAndQuery}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...(options.headers || {})
    }
  });
  return res;
}

async function apiGet(pathAndQuery) {
  const res = await apiFetch(pathAndQuery);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Canva GET ${pathAndQuery} → HTTP ${res.status}: ${text.substring(0, 300)}`);
  }
  return res.json();
}

/**
 * List all owned designs. Paginoi loppuun asti.
 * @returns {Promise<Array<{id,title,page_count,created_at,updated_at,thumbnail?,urls?}>>}
 */
export async function listAllOwnedDesigns({ onProgress } = {}) {
  const all = [];
  let continuation = null;

  do {
    const params = new URLSearchParams({
      ownership: "owned",
      sort_by: "modified_descending"
    });
    if (continuation) params.set("continuation", continuation);

    const data = await apiGet(`/designs?${params.toString()}`);
    const items = Array.isArray(data.items) ? data.items : [];
    for (const d of items) {
      all.push({
        id: d.id,
        title: d.title || "",
        page_count: Number(d.page_count || d.pageCount || 0),
        created_at: Number(d.created_at || d.createdAt || 0),
        updated_at: Number(d.updated_at || d.updatedAt || 0),
        thumbnail_url: d.thumbnail?.url || d.thumbnail || null,
        edit_url: d.urls?.edit_url || null,
        view_url: d.urls?.view_url || null
      });
    }

    if (onProgress) onProgress({ fetched: all.length, hasMore: Boolean(data.continuation) });

    continuation = data.continuation || null;
  } while (continuation);

  return all;
}

export { apiFetch, apiGet };

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

/**
 * List all folders käyttäjän tilillä.
 * Tuo GET /v1/folders — paginoitu continuation-tokenilla.
 * HUOM: Canva Connect API:n folder-endpointit voivat vaatia folder:read-scopen.
 */
export async function listAllFolders({ onProgress } = {}) {
  const all = [];
  let continuation = null;
  do {
    const params = new URLSearchParams();
    if (continuation) params.set("continuation", continuation);
    const url = params.toString() ? `/folders?${params.toString()}` : "/folders";
    const data = await apiGet(url);
    const items = Array.isArray(data.items) ? data.items : [];
    for (const f of items) {
      all.push({
        id: f.id,
        name: f.name || "",
        parent_id: f.parent_id || null,
        thumbnail_url: f.thumbnail?.url || null
      });
    }
    if (onProgress) onProgress({ fetched: all.length, hasMore: Boolean(data.continuation) });
    continuation = data.continuation || null;
  } while (continuation);
  return all;
}

/**
 * List items (designs) in a folder.
 * GET /v1/folders/{folderId}/items — paginoitu.
 */
export async function listFolderItems(folderId, { onProgress } = {}) {
  const all = [];
  let continuation = null;
  do {
    const params = new URLSearchParams();
    if (continuation) params.set("continuation", continuation);
    const url = `/folders/${encodeURIComponent(folderId)}/items${params.toString() ? "?" + params.toString() : ""}`;
    const data = await apiGet(url);
    const items = Array.isArray(data.items) ? data.items : [];
    for (const it of items) {
      // Folder item voi olla design tai alifolderi — otetaan vain designit
      if (it.type === "design" && it.design) {
        const d = it.design;
        all.push({
          id: d.id,
          title: d.title || "",
          page_count: Number(d.page_count || d.pageCount || 0),
          created_at: Number(d.created_at || d.createdAt || 0),
          updated_at: Number(d.updated_at || d.updatedAt || 0),
          thumbnail_url: d.thumbnail?.url || null,
          edit_url: d.urls?.edit_url || null,
          view_url: d.urls?.view_url || null
        });
      } else if (it.type === "folder" && it.folder) {
        // Alifolderi — palautetaan meta jotta caller voi käydä rekursion
        all.push({
          _subfolder: true,
          id: it.folder.id,
          name: it.folder.name || ""
        });
      }
    }
    if (onProgress) onProgress({ fetched: all.length, hasMore: Boolean(data.continuation) });
    continuation = data.continuation || null;
  } while (continuation);
  return all;
}

export { apiFetch, apiGet };

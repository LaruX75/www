/**
 * Canva Connect API — OAuth refresh-token-flow.
 *
 * Käyttö:
 *   import { getAccessToken } from "./_lib/canva-auth.mjs";
 *   const token = await getAccessToken();
 *
 * Access-token on lyhytikäinen (Canva antaa expires_in-sekunnit). Cachetetaan
 * muistiin prosessin elinajaksi + päivitetään refresh-tokenilla kun vanhenee.
 *
 * Docs: https://www.canva.dev/docs/connect/authentication/
 * Token endpoint: POST https://api.canva.com/rest/v1/oauth/token
 * Grant type: refresh_token
 *
 * Auth-header: Basic base64(client_id:client_secret)
 */

import { requireEnv } from "./env.mjs";

const TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";

let cached = null; // { token, expiresAt (ms since epoch) }

export async function getAccessToken({ force = false } = {}) {
  if (!force && cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const { CANVA_CLIENT_ID, CANVA_CLIENT_SECRET, CANVA_REFRESH_TOKEN } =
    requireEnv("CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET", "CANVA_REFRESH_TOKEN");

  const basic = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: CANVA_REFRESH_TOKEN
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!res.ok) {
    // ÄLÄ logita tokenia. Ainoastaan status + body (voi sisältää error-koodin).
    const text = await res.text().catch(() => "");
    throw new Error(`Canva token exchange epäonnistui: HTTP ${res.status} — ${text.substring(0, 200)}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Canva token exchange: access_token puuttuu vastauksesta");
  }

  const expiresInMs = Number(data.expires_in || 3600) * 1000;
  cached = {
    token: data.access_token,
    expiresAt: Date.now() + expiresInMs
  };

  return cached.token;
}

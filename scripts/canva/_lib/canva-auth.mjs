/**
 * Canva Connect API — OAuth refresh-token-flow.
 *
 * TÄRKEÄ: Canva käyttää ROTATING refresh tokeneita. Kun access token pyydetään
 * refresh tokenilla, Canva palauttaa SAMALLA UUDEN refresh tokenin ja vanha
 * invalidoituu välittömästi. Jos yrittää käyttää vanhaa uudelleen, Canva
 * revokoi kaikki tokenit ("Refresh token used twice").
 *
 * Ratkaisu: tallennetaan uusin refresh_token levyle (.canva-tokens.json,
 * .gitignore:issa). Alkuperäinen .env:in CANVA_REFRESH_TOKEN toimii
 * bootstrap-arvona vain ensimmäisellä ajolla.
 *
 * Docs: https://www.canva.dev/docs/connect/authentication/
 */

import fs from "node:fs";
import path from "node:path";
import { requireEnv, ROOT_DIR } from "./env.mjs";

const TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";
const TOKENS_FILE = path.join(ROOT_DIR, ".canva-tokens.json");

let cached = null; // { accessToken, refreshToken, expiresAt (ms epoch) }

function readTokensFile() {
  if (!fs.existsSync(TOKENS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(TOKENS_FILE, "utf8"));
  } catch {
    return null;
  }
}

function writeTokensFile(data) {
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(data, null, 2) + "\n", { mode: 0o600 });
}

function currentRefreshToken() {
  // Prioriteetti: levyltä (uusin) → .env (bootstrap)
  const persisted = readTokensFile();
  if (persisted?.refreshToken) return persisted.refreshToken;
  const { CANVA_REFRESH_TOKEN } = requireEnv("CANVA_REFRESH_TOKEN");
  return CANVA_REFRESH_TOKEN;
}

export async function getAccessToken({ force = false } = {}) {
  if (!force && cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.accessToken;
  }

  const { CANVA_CLIENT_ID, CANVA_CLIENT_SECRET } = requireEnv("CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET");
  const refreshToken = currentRefreshToken();

  const basic = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken
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
    const text = await res.text().catch(() => "");
    // Poista persistoitu tokens-tiedosto minkä tahansa auth-virheen jälkeen
    // jotta seuraava yritys lukee .env:in bootstrap-arvon (jos käyttäjä on
    // päivittänyt sen tai vaihtanut scopeja).
    if (fs.existsSync(TOKENS_FILE)) {
      fs.unlinkSync(TOKENS_FILE);
      console.warn("[auth] Poistettu .canva-tokens.json auth-virheen jälkeen — seuraava yritys käyttää .env:in refresh_tokenia");
    }
    throw new Error(`Canva token exchange epäonnistui: HTTP ${res.status} — ${text.substring(0, 200)}`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Canva token exchange: access_token puuttuu vastauksesta");
  }

  const expiresInMs = Number(data.expires_in || 3600) * 1000;
  cached = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + expiresInMs
  };

  // Persistoi uusi refresh token (Canva rotatoi joka kerta)
  if (data.refresh_token && data.refresh_token !== refreshToken) {
    writeTokensFile({
      refreshToken: data.refresh_token,
      updatedAt: new Date().toISOString()
    });
  }

  return cached.accessToken;
}

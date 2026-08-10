#!/usr/bin/env node
/**
 * Canva Connect — OAuth Authorization Code + PKCE setup.
 *
 * Käyttö kerran (kun rekisteröit integraation Canva Dev Portaalissa):
 *   1. Lisää CANVA_CLIENT_ID + CANVA_CLIENT_SECRET .env:iin
 *   2. Rekisteröi Dev Portaalissa redirect URL: http://127.0.0.1:5173/callback
 *   3. Aja: node scripts/canva/00-oauth-setup.mjs
 *   4. Kopioi tulostettu refresh_token .env:iin CANVA_REFRESH_TOKEN=...
 *   5. Tämä scripti ei tarvitse enää — refresh token uusii access-tokenin automaattisesti
 *
 * Turvallisuus:
 *   - PKCE (Canva vaatii)
 *   - state-parametri CSRF-suojaksi
 *   - Kuuntelee vain 127.0.0.1:llä (ei ulkoisia yhteyksiä)
 *   - EI tallenna tokeneita automaattisesti .env:iin (kopioit itse)
 *   - EI logita access_tokenia
 *
 * Aikakatkaisu: 5 min. Painat Ctrl-C jos jäät jumiin.
 */

import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { loadEnv, requireEnv } from "./_lib/env.mjs";

loadEnv();

const PORT = 5173;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/callback`;
const AUTH_URL = "https://www.canva.com/api/oauth/authorize";
const TOKEN_URL = "https://api.canva.com/rest/v1/oauth/token";

// Scopet Canva Connect Content Pipeline -käyttöön.
// Portti 1: designin metadata (listaus)
// Portti 2: PDF-export + designin sisältö
// Voit rajata näitä --scope-lipulla jos haluat.
const DEFAULT_SCOPES = [
  "design:meta:read",
  "design:content:read",
  "asset:read",
  "folder:read"
];

// Argumentit
const argv = process.argv.slice(2);
const scopeArg = argv.find((a) => a.startsWith("--scope="));
const SCOPES = scopeArg
  ? scopeArg.slice("--scope=".length).split(/[,\s]+/).filter(Boolean)
  : DEFAULT_SCOPES;

const { CANVA_CLIENT_ID, CANVA_CLIENT_SECRET } = requireEnv("CANVA_CLIENT_ID", "CANVA_CLIENT_SECRET");

// PKCE helperit
function base64url(buf) {
  return Buffer.from(buf).toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generatePkce() {
  const verifier = base64url(crypto.randomBytes(64));  // 43-128 chars
  const challenge = base64url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

const state = base64url(crypto.randomBytes(16));
const pkce = generatePkce();

// Rakenna authorization URL
const authParams = new URLSearchParams({
  response_type: "code",
  client_id: CANVA_CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  scope: SCOPES.join(" "),
  state,
  code_challenge: pkce.challenge,
  code_challenge_method: "s256"
});
const authorizationUrl = `${AUTH_URL}?${authParams.toString()}`;

// Avaa selaimeen (macOS: open, Linux: xdg-open, Windows: start)
function openBrowser(url) {
  const platform = process.platform;
  const cmd = platform === "darwin" ? "open"
    : platform === "win32" ? "start"
    : "xdg-open";
  try {
    spawn(cmd, [url], { detached: true, stdio: "ignore" }).unref();
    return true;
  } catch {
    return false;
  }
}

// Vaihda code → tokens
async function exchangeCodeForTokens(code) {
  const basic = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    code_verifier: pkce.verifier,
    redirect_uri: REDIRECT_URI
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
    throw new Error(`Token exchange epäonnistui: HTTP ${res.status} — ${text.substring(0, 300)}`);
  }
  return res.json();
}

// Käynnistä HTTP-server + odota callback
function waitForCallback() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Aikakatkaisu 5 min — käyttäjä ei valtuuttanut integraatiota"));
    }, 5 * 60 * 1000);

    const server = http.createServer((req, res) => {
      if (!req.url.startsWith("/callback")) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found. Odotan /callback-reittiä.");
        return;
      }
      const params = new URL(req.url, `http://127.0.0.1:${PORT}`).searchParams;
      const code = params.get("code");
      const returnedState = params.get("state");
      const error = params.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<h1>Virhe</h1><p>${error}: ${params.get("error_description") || ""}</p>`);
        clearTimeout(timeout);
        server.close();
        reject(new Error(`OAuth-virhe: ${error} — ${params.get("error_description") || ""}`));
        return;
      }
      if (!code) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("code puuttuu — jotain meni vikaan");
        clearTimeout(timeout);
        server.close();
        reject(new Error("Callback ilman code-parametria"));
        return;
      }
      if (returnedState !== state) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        res.end("state ei täsmää — mahdollinen CSRF");
        clearTimeout(timeout);
        server.close();
        reject(new Error("state-parametri ei täsmää — CSRF-suoja"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <!doctype html>
        <html lang="fi">
        <head><meta charset="utf-8"><title>Canva OAuth OK</title></head>
        <body style="font-family:system-ui;max-width:600px;margin:80px auto;padding:20px;">
          <h1>✓ Auktorisointi valmis</h1>
          <p>Voit sulkea tämän välilehden. Palaa terminaaliin — refresh_token tulostuu sinne.</p>
        </body>
        </html>
      `);
      clearTimeout(timeout);
      server.close();
      resolve(code);
    });

    server.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    server.listen(PORT, "127.0.0.1", () => {
      console.log(`[server] Kuuntelen ${REDIRECT_URI}\n`);
    });
  });
}

async function main() {
  console.log("=== Canva Connect — OAuth setup ===\n");
  console.log("HUOM: Ennen kuin ajat tämän, varmista että Canva Dev Portaalissa");
  console.log(`      integraatiosi Redirect URL on: ${REDIRECT_URI}`);
  console.log(`      ja että näihin scopeihin on lupa: ${SCOPES.join(", ")}`);
  console.log("");

  console.log("Avaan selaimeen authorization URL:in...");
  console.log(`Jos selain ei aukea automaattisesti, avaa manuaalisesti:\n\n${authorizationUrl}\n`);
  openBrowser(authorizationUrl);

  console.log("Odotan Canvan callbackin http://127.0.0.1:5173/callback:issa (max 5 min)...");
  const code = await waitForCallback();
  console.log("[callback] Sain authorization code:n. Vaihdan tokeneiksi...\n");

  const tokens = await exchangeCodeForTokens(code);

  console.log("=== VALMIS ===\n");
  console.log(`Access token expires in: ${tokens.expires_in} s`);
  console.log(`Scope: ${tokens.scope || "(ei palautettu)"}`);
  console.log("");
  console.log("KOPIOI TÄMÄ RIVI .env-tiedostoon (korvaa vanha jos on):");
  console.log("---------------------------------------------------------------");
  console.log(`CANVA_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("---------------------------------------------------------------");
  console.log("");
  console.log("Kun refresh_token on .env:issä, aja:");
  console.log("  node scripts/canva/01-map-ids.mjs");
}

main().catch((err) => {
  console.error("\nVIRHE:", err.message);
  process.exit(1);
});

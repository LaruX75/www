/**
 * Load .env manually (Node's built-in --env-file kelpaa mutta ei ole
 * kaikkialla oletuksena). Yksinkertainen KEY=VALUE-lukija.
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..", "..");
const ENV_FILE = path.join(ROOT, ".env");

let loaded = false;

export function loadEnv() {
  if (loaded) return;
  loaded = true;
  if (!fs.existsSync(ENV_FILE)) return;
  const raw = fs.readFileSync(ENV_FILE, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

export function requireEnv(...keys) {
  loadEnv();
  const missing = keys.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`Puuttuvat ympäristömuuttujat: ${missing.join(", ")}`);
    console.error(`Lisää ne .env-tiedostoon (ks. .env.example).`);
    process.exit(1);
  }
  return Object.fromEntries(keys.map((k) => [k, process.env[k]]));
}

export const ROOT_DIR = ROOT;

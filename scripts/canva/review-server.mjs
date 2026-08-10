#!/usr/bin/env node
/**
 * Canva Content Pipeline — Review-UI (paikallinen HTTP-server).
 *
 * Käyttö: node scripts/canva/review-server.mjs
 * Avaa: http://localhost:5174/
 *
 * Rakenne:
 *   GET  /              → HTML (yksi sivu, vanilla JS)
 *   GET  /api/state     → koko id-map.json
 *   POST /api/decision  → { siteIndex, designId | null, status } → tallennus
 *
 * Käyttäjä käy 75 tietuetta läpi:
 *   - Hyväksy (Clauden ehdotus tai muu candidate)
 *   - Valitse toinen (poimi listasta tai hae kaikista designeista)
 *   - Ei vastinetta (unmatched, käyttäjän vahvistama)
 *
 * Jokaisen päätöksen jälkeen id-map.json päivittyy heti.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT_DIR } from "./_lib/env.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MAP_FILE = path.join(ROOT_DIR, "data", "canva", "id-map.json");
const RAW_CACHE = path.join(ROOT_DIR, "data", "canva", "canva-designs-raw.json");

const PORT = 5174;

function loadState() {
  if (!fs.existsSync(MAP_FILE)) {
    throw new Error("id-map.json puuttuu. Aja: node scripts/canva/01-map-ids.mjs --folder-ids=...");
  }
  return JSON.parse(fs.readFileSync(MAP_FILE, "utf8"));
}

function loadAllDesigns() {
  if (!fs.existsSync(RAW_CACHE)) return [];
  return JSON.parse(fs.readFileSync(RAW_CACHE, "utf8")).designs || [];
}

function saveState(state) {
  // Atomic write: kirjoita tmp-tiedostoon, siirrä paikalleen
  const tmp = MAP_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + "\n");
  fs.renameSync(tmp, MAP_FILE);
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

const HTML = `<!doctype html>
<html lang="fi">
<head>
  <meta charset="utf-8">
  <title>Canva ID mapping — review</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; background: #f5f5f7; color: #1d1d1f; }
    header { position: sticky; top: 0; background: #fff; border-bottom: 1px solid #ddd; padding: 12px 20px; z-index: 10; }
    h1 { margin: 0 0 8px; font-size: 18px; }
    .dashboard { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 8px; font-size: 13px; }
    .chip { padding: 3px 10px; border-radius: 12px; background: #eee; }
    .chip strong { margin-left: 4px; }
    .chip.confirmed { background: #d1fadf; color: #065f46; }
    .chip.high { background: #dbeafe; color: #1e40af; }
    .chip.medium { background: #fef3c7; color: #92400e; }
    .chip.low { background: #fee2e2; color: #b91c1c; }
    .chip.none { background: #e5e7eb; color: #4b5563; }
    .filter-bar { display: flex; gap: 8px; margin-top: 8px; }
    .filter-bar button { padding: 4px 12px; border: 1px solid #ccc; background: #fff; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .filter-bar button.active { background: #1d1d1f; color: #fff; border-color: #1d1d1f; }
    main { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .card { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .card.confirmed { border-left: 4px solid #10b981; }
    .card.unmatched { border-left: 4px solid #6b7280; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 12px; }
    .grid h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; }
    .grid .col { padding: 12px; background: #f9fafb; border-radius: 8px; min-height: 160px; }
    .grid .col.claude { background: #eff6ff; }
    .grid .field { margin-bottom: 6px; font-size: 14px; }
    .grid .field label { display: inline-block; width: 90px; color: #6b7280; font-size: 12px; }
    .grid img { max-width: 100%; height: auto; border-radius: 4px; margin-bottom: 8px; max-height: 180px; }
    .btn-canva { display: inline-block; padding: 6px 12px; background: #7c3aed; color: #fff; text-decoration: none; border-radius: 6px; font-size: 13px; margin-top: 6px; }
    .btn-canva:hover { background: #6d28d9; }
    .reason { font-style: italic; color: #4b5563; margin: 8px 0; padding: 8px; background: #f3f4f6; border-radius: 6px; font-size: 13px; }
    .actions { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
    .actions button { padding: 8px 16px; border: 1px solid #ccc; background: #fff; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .actions button.primary { background: #10b981; color: #fff; border-color: #10b981; }
    .actions button.primary:hover { background: #059669; }
    .actions button.secondary { background: #f59e0b; color: #fff; border-color: #f59e0b; }
    .actions button.danger { background: #ef4444; color: #fff; border-color: #ef4444; }
    .runnerups, .allcandidates { margin-top: 16px; }
    .runnerups h4, .allcandidates h4 { margin: 12px 0 8px; font-size: 13px; color: #6b7280; text-transform: uppercase; }
    .cand-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f9fafb; border-radius: 6px; margin-bottom: 4px; font-size: 13px; }
    .cand-item .meta { color: #6b7280; font-size: 12px; }
    .cand-item .cand-actions { display: flex; gap: 6px; }
    .cand-item .cand-actions button { padding: 3px 10px; font-size: 12px; }
    .warning { padding: 10px; background: #fef3c7; border-left: 3px solid #f59e0b; border-radius: 4px; margin: 8px 0; font-size: 13px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .status-badge.high { background: #dbeafe; color: #1e40af; }
    .status-badge.medium { background: #fef3c7; color: #92400e; }
    .status-badge.low { background: #fee2e2; color: #b91c1c; }
    .status-badge.none { background: #e5e7eb; color: #4b5563; }
    .status-badge.confirmed { background: #d1fadf; color: #065f46; }
    .status-badge.unmatched { background: #f3f4f6; color: #6b7280; }
    .site-title { font-size: 16px; font-weight: 600; margin: 8px 0; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .card-num { font-size: 13px; color: #9ca3af; }
    .signals { display: flex; gap: 10px; font-size: 11px; color: #6b7280; margin-top: 4px; }
    .signals span { padding: 2px 6px; background: #e5e7eb; border-radius: 3px; }
    .search-box { display: none; margin-top: 12px; }
    .search-box.active { display: block; }
    .search-box input { width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; }
    .search-results { max-height: 300px; overflow-y: auto; margin-top: 8px; background: #fff; border: 1px solid #eee; border-radius: 6px; }
  </style>
</head>
<body>
  <header>
    <h1>Canva ID mapping — review</h1>
    <div class="dashboard" id="dashboard">Ladataan…</div>
    <div class="filter-bar" id="filterBar"></div>
  </header>
  <main id="main"></main>
  <script>
    let state = null;
    let allDesigns = [];
    let currentFilter = "TODO";

    async function load() {
      const r = await fetch("/api/state");
      const payload = await r.json();
      state = payload.state;
      allDesigns = payload.allDesigns;
      render();
    }

    function counts() {
      const items = state.items;
      const c = { total: items.length, confirmed: 0, unmatched_user: 0, high: 0, medium: 0, low: 0, none: 0, no_claude: 0 };
      for (const it of items) {
        if (it.user?.status === "confirmed") c.confirmed++;
        else if (it.user?.status === "unmatched") c.unmatched_user++;
        else if (!it.claude) c.no_claude++;
        else c[it.claude.confidence]++;
      }
      c.reviewed = c.confirmed + c.unmatched_user;
      return c;
    }

    function statusOf(it) {
      if (it.user?.status === "confirmed") return "confirmed";
      if (it.user?.status === "unmatched") return "unmatched";
      if (!it.claude) return "no_claude";
      return it.claude.confidence;
    }

    function filteredItems() {
      const items = state.items;
      if (currentFilter === "ALL") return items;
      if (currentFilter === "TODO") return items.filter((it) => !it.user);
      if (currentFilter === "REVIEWED") return items.filter((it) => it.user);
      if (currentFilter === "CONFIRMED") return items.filter((it) => it.user?.status === "confirmed");
      if (currentFilter === "UNMATCHED") return items.filter((it) => it.user?.status === "unmatched");
      if (currentFilter === "HIGH") return items.filter((it) => !it.user && it.claude?.confidence === "high");
      if (currentFilter === "MEDIUM") return items.filter((it) => !it.user && it.claude?.confidence === "medium");
      if (currentFilter === "LOW") return items.filter((it) => !it.user && it.claude?.confidence === "low");
      if (currentFilter === "NONE") return items.filter((it) => !it.user && (!it.claude || it.claude.confidence === "none"));
      return items;
    }

    function renderDashboard() {
      const c = counts();
      const dashboard = document.getElementById("dashboard");
      dashboard.innerHTML = \`
        <span class="chip">Yhteensä <strong>\${c.total}</strong></span>
        <span class="chip confirmed">Vahvistettu <strong>\${c.confirmed}</strong></span>
        <span class="chip">Ei vastinetta <strong>\${c.unmatched_user}</strong></span>
        <span class="chip high">Claude HIGH <strong>\${c.high}</strong></span>
        <span class="chip medium">Claude MEDIUM <strong>\${c.medium}</strong></span>
        <span class="chip low">Claude LOW <strong>\${c.low}</strong></span>
        <span class="chip none">Claude NONE <strong>\${c.none}</strong></span>
        \${c.no_claude > 0 ? \`<span class="chip">Ei Claude-arviota <strong>\${c.no_claude}</strong></span>\` : ""}
        <span class="chip">Tarkistettu <strong>\${c.reviewed} / \${c.total}</strong></span>
      \`;
    }

    function renderFilterBar() {
      const filters = ["TODO", "ALL", "CONFIRMED", "UNMATCHED", "HIGH", "MEDIUM", "LOW", "NONE"];
      const bar = document.getElementById("filterBar");
      bar.innerHTML = filters.map((f) => \`<button data-filter="\${f}" class="\${f === currentFilter ? "active" : ""}">\${f}</button>\`).join("");
      bar.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          currentFilter = btn.dataset.filter;
          render();
        });
      });
    }

    function candidateInList(designId, siteIndex) {
      // Onko sama designId ehdotettu toiselle sivustotietueelle (duplikaatti-warning)?
      return state.items.filter((it, i) => {
        if (i === siteIndex) return false;
        if (it.user?.status === "confirmed" && it.user?.designId === designId) return true;
        return false;
      }).map((it) => it.site.title);
    }

    function candCard(cand, isPickedByClaude, siteIndex) {
      const duplicateWith = candidateInList(cand.designId, siteIndex);
      const dupWarn = duplicateWith.length ? \`<div class="warning">⚠ Tämä design on jo vahvistettu tietueelle "\${duplicateWith[0]}"</div>\` : "";
      return \`
        <div class="col claude" data-design-id="\${cand.designId}">
          \${cand.thumbnailUrl ? \`<img src="\${cand.thumbnailUrl}" alt="thumbnail" loading="lazy">\` : ""}
          <div class="field"><label>designId</label> <code>\${cand.designId}</code></div>
          <div class="field"><label>Otsikko</label> \${cand.canvaTitle}</div>
          <div class="field"><label>Diaa</label> \${cand.pageCount}</div>
          <div class="field"><label>Luotu</label> \${cand.createdAt ? new Date(cand.createdAt * 1000).toISOString().slice(0,10) : "?"}</div>
          <div class="field"><label>Päivitetty</label> \${cand.updatedAt ? new Date(cand.updatedAt * 1000).toISOString().slice(0,10) : "?"}</div>
          <div class="signals">
            <span>heuristic: \${cand.heuristicScore}</span>
            \${cand.signals ? \`<span>title: \${cand.signals.titleSim}</span> <span>date: \${cand.signals.dateScore ?? "n/a"}</span> <span>kw: \${cand.signals.keywordScore}</span>\` : ""}
          </div>
          \${cand.viewUrl ? \`<a href="\${cand.viewUrl}" target="_blank" rel="noopener noreferrer" class="btn-canva">Avaa Canvassa ↗</a>\` : ""}
          \${dupWarn}
        </div>
      \`;
    }

    async function decide(siteIndex, designId, status) {
      const r = await fetch("/api/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteIndex, designId, status })
      });
      if (!r.ok) { alert("Tallennus epäonnistui"); return; }
      const data = await r.json();
      state = data.state;
      render();
    }

    function renderItem(it) {
      const status = statusOf(it);
      const site = it.site;
      const claude = it.claude;
      const claudePick = claude ? it.candidates.find((c) => c.designId === claude.designId) : null;
      const runnerUpIds = new Set((claude?.runnerUps || []).map((r) => r.designId));
      const otherCandidates = it.candidates.filter((c) => c.designId !== claude?.designId);

      const claudeCol = claude
        ? \`
          <div class="col claude">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
              <h3 style="margin:0">Claude ehdottaa</h3>
              <span class="status-badge \${claude.confidence}">\${claude.confidence}</span>
            </div>
            \${claudePick ? candCard(claudePick, true, it.siteIndex).replace('<div class="col claude"', '<div class="col claude" style="background:transparent;padding:0;min-height:auto"') : "<p><em>Ei ehdotusta</em></p>"}
            \${claude.reason ? \`<div class="reason">\${claude.reason}</div>\` : ""}
          </div>
        \`
        : \`<div class="col claude"><p><em>Ei Claude-arviota (aja 02-claude-review.mjs)</em></p></div>\`;

      const primaryActions = claudePick
        ? \`<button class="primary" onclick="decide(\${it.siteIndex}, '\${claude.designId}', 'confirmed')">✓ Hyväksy Clauden ehdotus</button>\`
        : "";

      const otherCandsHtml = otherCandidates.length
        ? \`
          <div class="allcandidates">
            <h4>Muut ehdokkaat (heuristic top-\${otherCandidates.length})</h4>
            \${otherCandidates.map((c) => \`
              <div class="cand-item">
                <div>
                  <strong>\${c.canvaTitle}</strong> <span class="meta">— \${c.pageCount} diaa, \${c.createdAt ? new Date(c.createdAt*1000).toISOString().slice(0,10) : "?"}, heuristic \${c.heuristicScore}</span>
                  \${runnerUpIds.has(c.designId) ? \`<span class="meta" style="color:#7c3aed">(Claude: runner-up)</span>\` : ""}
                </div>
                <div class="cand-actions">
                  \${c.viewUrl ? \`<a href="\${c.viewUrl}" target="_blank" rel="noopener noreferrer" class="btn-canva">Avaa ↗</a>\` : ""}
                  <button onclick="decide(\${it.siteIndex}, '\${c.designId}', 'confirmed')">Käytä tätä</button>
                </div>
              </div>
            \`).join("")}
          </div>
        \`
        : "";

      const searchBox = \`
        <div class="search-box" id="search-\${it.siteIndex}">
          <input type="text" placeholder="Hae kaikista Canva-designeista otsikolla tai ID:llä..." oninput="filterSearch(\${it.siteIndex}, this.value)">
          <div class="search-results" id="results-\${it.siteIndex}"></div>
        </div>
      \`;

      return \`
        <div class="card \${status}" data-index="\${it.siteIndex}">
          <div class="card-header">
            <span class="card-num">[\${it.siteIndex + 1}/\${state.items.length}]</span>
            <span class="status-badge \${status}">\${status}</span>
          </div>
          <div class="site-title">\${site.title}</div>
          <div class="grid">
            <div class="col">
              <h3>Sivustolla</h3>
              \${site.thumbnail ? \`<img src="\${site.thumbnail}" alt="site thumbnail" loading="lazy">\` : ""}
              <div class="field"><label>Päivä</label> \${site.date || "(puuttuu)"}</div>
              <div class="field"><label>Paikka</label> \${site.location || "(ei tietoa)"}</div>
              <div class="field"><label>Järjestäjä</label> \${site.jarjestaja || "(ei tietoa)"}</div>
              <div class="field"><label>Kategoria</label> \${site.kategoria || "(ei tietoa)"}</div>
              <div class="field"><label>Kansio</label> \${site.folder || "(ei tietoa)"}</div>
              <div class="field"><label>Kuvaus</label> \${site.summary || "(ei kuvausta)"}</div>
              <div class="field"><label>Avainsanat</label> \${(site.keywords || []).join(", ") || "(ei avainsanoja)"}</div>
            </div>
            \${claudeCol}
          </div>
          <div class="actions">
            \${primaryActions}
            <button class="secondary" onclick="toggleSearch(\${it.siteIndex})">Hae muista designeista</button>
            <button class="danger" onclick="decide(\${it.siteIndex}, null, 'unmatched')">Ei vastinetta</button>
            \${it.user ? \`<button onclick="decide(\${it.siteIndex}, null, null)">Peruuta päätös</button>\` : ""}
          </div>
          \${otherCandsHtml}
          \${searchBox}
        </div>
      \`;
    }

    function render() {
      renderDashboard();
      renderFilterBar();
      const list = filteredItems();
      const main = document.getElementById("main");
      if (list.length === 0) {
        main.innerHTML = "<p style='padding:40px;text-align:center;color:#6b7280'>Ei tietueita tässä suodattimessa.</p>";
        return;
      }
      main.innerHTML = list.map(renderItem).join("");
    }

    window.toggleSearch = function(siteIndex) {
      const box = document.getElementById("search-" + siteIndex);
      box.classList.toggle("active");
    };

    window.filterSearch = function(siteIndex, query) {
      const results = document.getElementById("results-" + siteIndex);
      const q = query.trim().toLowerCase();
      if (q.length < 2) { results.innerHTML = ""; return; }
      const matches = allDesigns.filter((d) => {
        return (d.title || "").toLowerCase().includes(q) || (d.id || "").toLowerCase().includes(q);
      }).slice(0, 20);
      results.innerHTML = matches.map((d) => \`
        <div class="cand-item">
          <div>
            <strong>\${d.title}</strong>
            <span class="meta">— \${d.page_count} diaa, \${d.created_at ? new Date(d.created_at*1000).toISOString().slice(0,10) : "?"} · <code>\${d.id}</code></span>
          </div>
          <div class="cand-actions">
            \${d.view_url ? \`<a href="\${d.view_url}" target="_blank" rel="noopener noreferrer" class="btn-canva">Avaa ↗</a>\` : ""}
            <button onclick="decide(\${siteIndex}, '\${d.id}', 'confirmed')">Käytä tätä</button>
          </div>
        </div>
      \`).join("") || "<p style='padding:10px;color:#6b7280'>Ei osumia.</p>";
    };

    window.decide = decide;

    load();
  </script>
</body>
</html>
`;

// Sivuston thumbnail-kuvien tarjonta (esim /images/canva-thumbnails/xxx.png).
// Estä path-traversal: normalisoi + tarkista prefix.
const IMAGES_ROOT = path.join(ROOT_DIR, "src", "images");
const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml" };

function serveStaticImage(req, res) {
  const rel = decodeURIComponent(req.url.replace(/^\/images\//, ""));
  const resolved = path.resolve(IMAGES_ROOT, rel);
  if (!resolved.startsWith(IMAGES_ROOT + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }
  if (!fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
    return;
  }
  const ext = path.extname(resolved).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-cache" });
  fs.createReadStream(resolved).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(HTML);
      return;
    }

    // Staattiset kuvat (thumbnaileja canva-presentations.json:issa)
    if (req.method === "GET" && req.url.startsWith("/images/")) {
      serveStaticImage(req, res);
      return;
    }

    if (req.method === "GET" && req.url === "/api/state") {
      const state = loadState();
      const allDesigns = loadAllDesigns();
      json(res, 200, { state, allDesigns });
      return;
    }

    if (req.method === "POST" && req.url === "/api/decision") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const { siteIndex, designId, status } = JSON.parse(body);
      const state = loadState();
      const item = state.items[siteIndex];
      if (!item) { json(res, 400, { error: "invalid siteIndex" }); return; }

      if (status === null) {
        // Peruuta päätös
        item.user = null;
      } else if (status === "unmatched") {
        item.user = {
          status: "unmatched",
          designId: null,
          reviewedAt: new Date().toISOString(),
          reviewedBy: "user"
        };
      } else if (status === "confirmed") {
        item.user = {
          status: "confirmed",
          designId: designId,
          reviewedAt: new Date().toISOString(),
          reviewedBy: "user"
        };
      } else {
        json(res, 400, { error: "invalid status" });
        return;
      }
      saveState(state);
      json(res, 200, { state });
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  } catch (err) {
    console.error("VIRHE:", err);
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("");
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║  Canva ID mapping review-UI                        ║");
  console.log("╠════════════════════════════════════════════════════╣");
  console.log(`║  Avaa selaimessa: http://localhost:${PORT}/          ║`);
  console.log("║                                                    ║");
  console.log("║  Muutokset tallennetaan heti id-map.json:iin.      ║");
  console.log("║  Ctrl-C sammuttaa serverin.                        ║");
  console.log("╚════════════════════════════════════════════════════╝");
  console.log("");
});

require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { readCache, readCacheIfFresh, writeCache, fetchWithTimeout } = require("./_apiCache");

const CACHE_TTL_HOURS = 1;

const CACHE_KEY = "github-site-changes-v1";
const CMS_CONFIG_PATH = path.join(process.cwd(), "src", "_data", "github-config.json");
const API_BASE = "https://api.github.com";

function readCmsGithubConfig() {
  if (!fs.existsSync(CMS_CONFIG_PATH)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(CMS_CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      owner: typeof parsed?.owner === "string" ? parsed.owner.trim() : "",
      repo: typeof parsed?.repo === "string" ? parsed.repo.trim() : "",
      branch: typeof parsed?.branch === "string" ? parsed.branch.trim() : ""
    };
  } catch (error) {
    console.warn(`GitHub changes: CMS config read failed: ${error.message}`);
    return {};
  }
}

function normalizeCommit(item) {
  const message = String(item?.commit?.message || "").trim();
  const firstLine = message.split("\n")[0] || "No message";
  const date = item?.commit?.author?.date || item?.commit?.committer?.date || null;

  return {
    sha: item?.sha || "",
    shortSha: item?.sha ? String(item.sha).slice(0, 7) : "",
    message: firstLine,
    author: item?.commit?.author?.name || item?.author?.login || "Unknown",
    date,
    url: item?.html_url || ""
  };
}

function parseLinkLastPage(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.match(/[?&]page=(\d+)>;\s*rel="last"/);
  return match ? parseInt(match[1], 10) : null;
}

function computeStats(rows) {
  const dates = rows.map((r) => r.date).filter(Boolean).sort();
  const currentYear = new Date().getFullYear();
  const uniqueAuthors = new Set(rows.map((r) => r.author).filter(Boolean)).size;
  return {
    totalCommits: rows.length,
    commitsThisYear: rows.filter((r) => r.date && new Date(r.date).getFullYear() === currentYear).length,
    uniqueAuthors,
    firstDate: dates[0] || null,
    latestDate: dates[dates.length - 1] || null
  };
}

async function fetchAllCommits({ owner, repo, branch, token }) {
  const PER_PAGE = 100;
  const MAX_PAGES = 30; // cap at 3 000 commits

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "jarilaru-site-build",
    "X-GitHub-Api-Version": "2022-11-28"
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  function buildUrl(page) {
    const u = new URL(`${API_BASE}/repos/${owner}/${repo}/commits`);
    u.searchParams.set("sha", branch);
    u.searchParams.set("per_page", String(PER_PAGE));
    u.searchParams.set("page", String(page));
    return u.toString();
  }

  // Page 1 — also reveals total page count via Link header
  const resp1 = await fetchWithTimeout(buildUrl(1), { headers }, 15000);
  if (!resp1.ok) {
    const body = await resp1.text();
    throw new Error(`GitHub commits API failed (${resp1.status}): ${body.slice(0, 180)}`);
  }
  const data1 = await resp1.json();
  if (!Array.isArray(data1)) return [];

  const rows = data1.map(normalizeCommit).filter((r) => r.sha && r.url);

  const lastPage = Math.min(parseLinkLastPage(resp1.headers.get("Link")) || 1, MAX_PAGES);

  for (let page = 2; page <= lastPage; page++) {
    const resp = await fetchWithTimeout(buildUrl(page), { headers }, 15000);
    if (!resp.ok) break;
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) break;
    rows.push(...data.map(normalizeCommit).filter((r) => r.sha && r.url));
  }

  return rows;
}

module.exports = async function () {
  const fresh = readCacheIfFresh(CACHE_KEY, CACHE_TTL_HOURS);
  if (fresh?.data) {
    console.log(`GitHub changes: käytetään tuoretta välimuistia (${fresh.savedAt}).`);
    return { ...fresh.data, source: "cache", cacheSavedAt: fresh.savedAt };
  }

  const cached = readCache(CACHE_KEY);
  const cachedData = cached?.data || null;
  const cmsConfig = readCmsGithubConfig();

  const owner = process.env.GITHUB_REPO_OWNER || cmsConfig.owner || "LaruX75";
  const repo = process.env.GITHUB_REPO_NAME || cmsConfig.repo || "www";
  const branch = process.env.GITHUB_REPO_BRANCH || cmsConfig.branch || "main";
  const token = process.env.GITHUB_TOKEN || "";

  const baseResult = {
    enabled: true,
    source: "github",
    fetchedAt: new Date().toISOString(),
    repo: {
      owner,
      repo,
      branch,
      url: `https://github.com/${owner}/${repo}`
    },
    rows: [],
    stats: null,
    error: null
  };

  try {
    const rows = await fetchAllCommits({ owner, repo, branch, token });
    const stats = computeStats(rows);
    console.log(`GitHub changes: haettiin ${rows.length} committia (${stats.uniqueAuthors} tekijää).`);
    const result = { ...baseResult, rows, stats };
    writeCache(CACHE_KEY, result);
    return result;
  } catch (error) {
    console.warn(`GitHub changes: ${error.message}`);
    if (cachedData) {
      return {
        ...cachedData,
        source: "cache",
        cacheSavedAt: cached?.savedAt || null,
        error: error.message
      };
    }

    return {
      ...baseResult,
      source: "fallback",
      error: error.message
    };
  }
};

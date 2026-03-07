require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { readCache, writeCache } = require("./_apiCache");

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
    const limit = Number(parsed?.limit);
    return {
      owner: typeof parsed?.owner === "string" ? parsed.owner.trim() : "",
      repo: typeof parsed?.repo === "string" ? parsed.repo.trim() : "",
      branch: typeof parsed?.branch === "string" ? parsed.branch.trim() : "",
      limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : null
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

async function fetchCommits({ owner, repo, branch, limit, token }) {
  const url = new URL(`${API_BASE}/repos/${owner}/${repo}/commits`);
  url.searchParams.set("sha", branch);
  url.searchParams.set("per_page", String(limit));

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "jarilaru-site-build",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub commits API failed (${response.status}): ${body.slice(0, 180)}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeCommit).filter((row) => row.sha && row.url);
}

module.exports = async function () {
  const cached = readCache(CACHE_KEY);
  const cachedData = cached?.data || null;
  const cmsConfig = readCmsGithubConfig();

  const owner = process.env.GITHUB_REPO_OWNER || cmsConfig.owner || "LaruX75";
  const repo = process.env.GITHUB_REPO_NAME || cmsConfig.repo || "www";
  const branch = process.env.GITHUB_REPO_BRANCH || cmsConfig.branch || "main";
  const limit = Number(process.env.GITHUB_CHANGES_LIMIT || cmsConfig.limit || 25);
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 25;
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
    error: null
  };

  try {
    const rows = await fetchCommits({ owner, repo, branch, limit: safeLimit, token });
    const result = { ...baseResult, rows };
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

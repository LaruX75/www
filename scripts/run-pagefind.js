const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const siteDir = path.join(process.cwd(), "_site");
const nonContentDirs = [
  path.join(siteDir, "og-image.og")
];

for (const dir of nonContentDirs) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (_) {
    // Ignore cleanup errors, pagefind can still run on the rest of the site.
  }
}

const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npxCmd, ["pagefind", "--site", "_site"], {
  stdio: "inherit"
});

process.exit(result.status === null ? 1 : result.status);

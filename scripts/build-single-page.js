const { spawnSync } = require("child_process");

const args = process.argv.slice(2);

function fail(message, code = 1) {
  console.error(`[build-single-page] ${message}`);
  process.exit(code);
}

if (!args.length) {
  fail("Usage: node scripts/build-single-page.js <input-template> [-- additional eleventy args]");
}

const separatorIndex = args.indexOf("--");
const inputPath = args[0];
const extraArgs = separatorIndex === -1 ? args.slice(1) : args.slice(separatorIndex + 1);
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

const steps = [
  {
    label: "clean output",
    cmd: "node",
    args: ["scripts/clean-output-dir.js"]
  },
  {
    label: "build page",
    cmd: npxCmd,
    args: ["@11ty/eleventy", "--input", inputPath, "--quiet", ...extraArgs]
  },
  {
    label: "build pagefind index",
    cmd: "node",
    args: ["scripts/run-pagefind.js"]
  }
];

for (const step of steps) {
  const result = spawnSync(step.cmd, step.args, {
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    fail(`Step failed: ${step.label}`, result.status === null ? 1 : result.status);
  }
}


const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), "_site");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanWithRetry(maxRetries = 15) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      fs.mkdirSync(target, { recursive: true });
      return;
    } catch (error) {
      if (error.code !== "ENOTEMPTY" || attempt === maxRetries) {
        throw error;
      }
      await sleep(150 * attempt);
    }
  }
}

cleanWithRetry().catch((error) => {
  console.error(`[clean-output-dir] Failed to clean '${target}': ${error.message}`);
  process.exit(1);
});

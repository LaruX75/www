const fs = require("fs");
const path = require("path");

const target = path.join(process.cwd(), "_site", "og-images");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanWithRetry(maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      fs.rmSync(target, { recursive: true, force: true });
      return;
    } catch (error) {
      if (error.code !== "ENOTEMPTY" || attempt === maxRetries) {
        throw error;
      }
      // On some filesystems ENOTEMPTY can be transient right after file writes.
      await sleep(80 * attempt);
    }
  }
}

cleanWithRetry()
  .catch((error) => {
    console.error(`[clean-og-images] Failed to clean '${target}': ${error.message}`);
    process.exit(1);
  });

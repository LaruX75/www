import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const svgPath = path.join(projectRoot, "src", "img", "favicon.svg");
const svgMarkup = await fs.readFile(svgPath, "utf8");
const outputs = [
  { size: 16, file: path.join(projectRoot, "src", "img", "favicon-16x16.png") },
  { size: 32, file: path.join(projectRoot, "src", "img", "favicon-32x32.png") },
  { size: 180, file: path.join(projectRoot, "src", "img", "apple-touch-icon.png") },
  { size: 512, file: path.join(projectRoot, "src", "img", "favicon-512x512.png") }
];
const icoPath = path.join(projectRoot, "src", "favicon.ico");

const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();

  for (const { size, file } of outputs) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`
      <!doctype html>
      <html lang="en">
        <body style="margin:0;background:transparent;overflow:hidden;">
          <div id="icon" style="display:block;width:${size}px;height:${size}px;">${svgMarkup}</div>
        </body>
      </html>
    `);

    await page.waitForSelector("#icon svg");

    await page.locator("#icon").screenshot({ path: file });
  }

  const png32Path = outputs.find((item) => item.size === 32)?.file;
  const png32 = await fs.readFile(png32Path);
  const header = Buffer.alloc(6 + 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(32, 6);
  header.writeUInt8(32, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png32.length, 14);
  header.writeUInt32LE(22, 18);
  await fs.writeFile(icoPath, Buffer.concat([header, png32]));
} finally {
  await browser.close();
}

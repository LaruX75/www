const fs = require('fs');
const path = require('path');

function loadHiddenIds(source) {
  const dir = path.join(process.cwd(), 'src', 'curated', source);
  if (!fs.existsSync(dir)) return new Set();
  const hidden = new Set();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.md')) continue;
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) continue;
    const fm = match[1];
    const isHidden = /^hidden:\s*true\s*$/m.test(fm);
    const idMatch = fm.match(/^source_id:\s*["']?([^"'\n]+?)["']?\s*$/m);
    if (isHidden && idMatch?.[1]) hidden.add(idMatch[1]);
  }
  return hidden;
}

module.exports = { loadHiddenIds };

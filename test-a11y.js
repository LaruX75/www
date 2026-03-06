const { JSDOM } = require("jsdom");
const fs = require("fs");

const html = fs.readFileSync('src/_includes/base.njk', 'utf8');
const dom = new JSDOM(html.replace('{{ content | safe }}', ''), { runScripts: "dangerously" });

try {
  // Simulate loading a11y.js
  const scriptContent = fs.readFileSync('src/js/a11y.js', 'utf8');
  const tempScript = dom.window.document.createElement("script");
  tempScript.textContent = scriptContent;
  dom.window.document.body.appendChild(tempScript);

  // Trigger DOMContentLoaded
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));

  console.log('HTML classes before trigger:', dom.window.document.documentElement.className);
  
  // Find settings logic
  const textSizeSelect = dom.window.document.getElementById('a11yTextSize');
  if (textSizeSelect) {
      textSizeSelect.value = 'large';
      textSizeSelect.dispatchEvent(new dom.window.Event('change'));
      console.log('HTML classes after size change:', dom.window.document.documentElement.className);
  } else {
      console.log("Error: Text size select not found");
  }

  const dyslexiaFontToggle = dom.window.document.getElementById('a11yDyslexiaFont');
  if (dyslexiaFontToggle) {
      dyslexiaFontToggle.checked = true;
      dyslexiaFontToggle.dispatchEvent(new dom.window.Event('change'));
      console.log('HTML classes after dyslexia change:', dom.window.document.documentElement.className);
  } else {
      console.log("Error: Dyslexia toggle not found");
  }
} catch (e) {
  console.error("Error running test:", e);
}

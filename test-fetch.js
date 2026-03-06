const fetch = require('node-fetch');
const query = `dc.contributor.thesisadvisor:Laru* AND (type:masterThesis OR type:bachelorThesis)`;
const baseUrl = `https://oulurepo.oulu.fi/open-search/?query=${encodeURIComponent(query)}&format=kk&rpp=100&sort_by=2&order=desc`;
const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;

async function run() {
  try {
    const res = await fetch(url);
    const xml = await res.text();
    console.log("Response status:", res.status);
    console.log("Length:", xml.length);
    console.log("Start:", xml.substring(0, 100));
  } catch(e) {
    console.log(e);
  }
}
run();

const redirectPairs = [
  ["era-ja-luontomuseo", "luonto-ja-eramuseo"],
  ["eurooppalainen-ouluseutu", "eurooppalainen-oulunseutu"],
  ["kaupunginvaltuusto", "oulun-kaupunginvaltuusto"],
  ["kuntavaalit2017", "kuntavaalit-2017"],
  ["lectio-precursora", "lectio-precursoria"],
  ["lektio", "lectio-precursoria"],
  ["lietteiden-kasittely", "lietteenkasittely"],
  ["microsoft-o365", "microsoft-365"],
  ["o365", "microsoft-365"],
  ["oppiminen-mobiilaitteiden-avulla", "mobiilioppiminen"],
  ["vaalit2017", "kuntavaalit-2017"],
  ["valineet-tyokalut", "valineet-ja-tyokalut"],
  ["web2-0", "web-2-0"],
  ["yliopiston-muutto", "oulun-yliopiston-muutto"]
];

function toRedirects(baseFrom, baseTo) {
  return redirectPairs.map(([fromSlug, toSlug]) => ({
    from: `${baseFrom}${fromSlug}/`,
    to: `${baseTo}${toSlug}/`
  }));
}

module.exports = {
  fi: toRedirects("/avainsanat/", "/avainsanat/"),
  en: toRedirects("/en/keywords/", "/en/keywords/")
};

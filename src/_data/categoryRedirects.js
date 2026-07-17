const redirectPairs = [
  ["aluevaaalit2022", "vaalit"],
  ["av-tekniikka", "teknologia-ja-digitaalisuus"],
  ["digiluokka", "teknologia-ja-digitaalisuus"],
  ["henkilokuva", "matkat-ja-henkilokohtaiset"],
  ["kamerat", "teknologia-ja-digitaalisuus"],
  ["kayttojarjestelmat", "teknologia-ja-digitaalisuus"],
  ["koulutusteknologi", "koulutusteknologia"],

  ["kuntavaalit", "vaalit"],
  ["liikunta", "hyvinvointi-ja-osallisuus"],
  ["matkailu", "matkat-ja-henkilokohtaiset"],
  ["palveluverkko", "kaupunkikehitys-ja-palveluverkko"],
  ["pilvipalvelut-ja-ekosysteemit", "teknologia-ja-digitaalisuus"],
  ["poliitiikka", "politiikka-ja-paatoksenteko"],
  ["seurakuntavaalit", "vaalit"],
  ["teknologiatuettu-oppiminen-ja-opetus", "koulutusteknologia"],
  ["tietotekniikka", "teknologia-ja-digitaalisuus"],
  ["tutkimus", "yliopisto-ja-korkeakoulut"],
  ["vaitoskirja", "yliopisto-ja-korkeakoulut"],
  ["www-sivustot", "teknologia-ja-digitaalisuus"],
  ["yliopistokampus", "yliopisto-ja-korkeakoulut"]
];

function toRedirects(baseFrom, baseTo) {
  return redirectPairs.map(([fromSlug, toSlug]) => ({
    from: `${baseFrom}${fromSlug}/`,
    to: `${baseTo}${toSlug}/`
  }));
}

module.exports = {
  fi: toRedirects("/kategoriat/", "/kategoriat/"),
  en: toRedirects("/en/categories/", "/en/categories/")
};

# Tietoturvakorjaukset — jarilaru.fi

Audit tehty 14.3.2026. Toteuta alla olevat korjaukset prioriteettijärjestyksessä.

---

## 1. DMARC-tietue (DNS) 🔴

**Missä:** Zoner DNS-hallintapaneeli → jarilaru.fi → TXT-tietueet

Lisää uusi TXT-tietue:

| Kenttä | Arvo |
|--------|------|
| Tyyppi | TXT |
| Nimi / Host | `_dmarc` |
| Arvo | `v=DMARC1; p=quarantine; rua=mailto:jari.laru@ouka.fi` |
| TTL | 3600 |

**Miksi:** Ilman DMARC-tietuetta kuka tahansa voi lähettää sähköpostia `@jarilaru.fi`-osoitteesta sinun nimissäsi.

---

## 2. CAA-tietue (DNS) 🟡

**Missä:** Zoner DNS-hallintapaneeli → jarilaru.fi → CAA-tietueet

Lisää kaksi CAA-tietuetta:

| Tyyppi | Nimi | Lippu | Tag | Arvo |
|--------|------|-------|-----|------|
| CAA | `jarilaru.fi` | 0 | issue | `"letsencrypt.org"` |
| CAA | `jarilaru.fi` | 0 | issuewild | `"letsencrypt.org"` |

**Miksi:** Rajoittaa sertifikaattien myöntämisen vain Let's Encryptille.

---

## 3. HSTS preload 🟡

**Missä:** GitHub Pages → Custom domain -asetukset TAI Cloudflare (jos otetaan proxy käyttöön)

GitHub Pages asettaa automaattisesti `max-age=31556952`. Lisäksi tarvitaan `includeSubDomains` ja `preload`.

**Jos käytössä Cloudflare:**
- Dashboard → jarilaru.fi → SSL/TLS → Edge Certificates
- Ota käyttöön "HTTP Strict Transport Security (HSTS)"
- Aseta: Max Age = 2 years, ✅ Include Subdomains, ✅ Preload

**Rekisteröi preload-listalle:** https://hstspreload.org (vaatii ensin `includeSubDomains`)

---

## 4. HTTP-tietoturvaheaderit 🔴

GitHub Pages ei tue headerien asettamista suoraan. Vaihtoehdot:

### Vaihtoehto A — Cloudflare Workers (suositeltu)

Luo Cloudflare Worker joka lisää headerit kaikkiin vastauksiin:

```js
export default {
  async fetch(request, env) {
    const response = await fetch(request);
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("X-Content-Type-Options", "nosniff");
    newResponse.headers.set("X-Frame-Options", "SAMEORIGIN");
    newResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    newResponse.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    newResponse.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; " +
      "img-src 'self' data: https:; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none';"
    );
    return newResponse;
  }
};
```

### Vaihtoehto B — Netlify/Cloudflare Pages siirto

Jos sivusto siirretään Netlify- tai Cloudflare Pages -alustalle, luo `_headers`-tiedosto projektin juureen:

```
/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none';
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

---

## 5. Sähköpostiosoitteet — obfuskointi 🟢

**Missä:** Sivuston HTML-lähdetiedostot (Eleventy-projekti)

Etsi kaikki esiintymät ja korvaa:

```html
<!-- Ennen -->
<a href="mailto:jari.laru@ouka.fi">jari.laru@ouka.fi</a>

<!-- Jälkeen (HTML-entiteetit) -->
<a href="&#109;&#97;&#105;&#108;&#116;&#111;&#58;jari.laru&#64;ouka.fi">
  jari.laru&#64;ouka.fi
</a>
```

Tai käytä CSS-tekniikkaa (ei katkaise kopiointia):

```html
<span class="email" data-user="jari.laru" data-domain="ouka.fi"></span>
<style>.email::after { content: attr(data-user) "@" attr(data-domain); }</style>
```

---

## 6. Zoom-linkki HTTPS:ksi 🟢

**Missä:** Sivuston HTML-lähdetiedostot

```html
<!-- Ennen -->
<a href="http://www.zoom.us/my/larux">

<!-- Jälkeen -->
<a href="https://zoom.us/my/larux">
```

---

## 7. security.txt 🟢

**Missä:** Eleventy-projekti → luo tiedosto `public/.well-known/security.txt` tai `_site/.well-known/security.txt`

```
Contact: mailto:jari.laru@ouka.fi
Expires: 2027-01-01T00:00:00.000Z
Preferred-Languages: fi, en
```

Varmista että Eleventy kopioi tiedoston buildiin (lisää tarvittaessa `eleventyConfig.addPassthroughCopy(".well-known")`).

---

## Tarkistuslista toteutuksen jälkeen

- [ ] DMARC-tietue — tarkista: `dig TXT _dmarc.jarilaru.fi`
- [ ] CAA-tietue — tarkista: `dig CAA jarilaru.fi`
- [ ] HTTP-headerit — tarkista: `curl -sI https://www.jarilaru.fi | grep -i "content-security\|x-content\|x-frame\|referrer"`
- [ ] HSTS preload — tarkista: https://hstspreload.org/?domain=jarilaru.fi
- [ ] security.txt — tarkista: https://www.jarilaru.fi/.well-known/security.txt
- [ ] Sähköpostit — tarkista että `@`-merkki ei näy suoraan page sourcessa
- [ ] Zoom-linkki — tarkista `https://` käytössä

---

## Työkalu jälkitarkistukseen

```bash
# Aja tämä korjausten jälkeen
curl -sI https://www.jarilaru.fi | grep -iE "strict-transport|content-security|x-content|x-frame|referrer-policy|permissions"
dig TXT _dmarc.jarilaru.fi +short
dig CAA jarilaru.fi +short
```

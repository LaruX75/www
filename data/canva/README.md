# Canva content pipeline — data-artefaktit

Tämä hakemisto sisältää Canva-sisältöputken tuottamat pysyvät data-tiedostot.
Putken koodi on `scripts/canva/`.

## Tiedostot

| Tiedosto | Kuvaus | Committoidaan? |
|---|---|---|
| `canva-designs-raw.json` | Cache Canva Connect API:n `/v1/designs`-vastauksesta | Kyllä |
| `id-map.json` | Sivuston 75 tietuetta ↔ Canva designId -mapping | **Kyllä** |
| `id-map-review.md` | Ihmisen tarkistuslista (duplikaatit, epävarmat matchit) | Kyllä |
| `cache/{designId}.json` | Diakohtainen tekstisisältö per esitys (vaihe 2) | Kyllä |
| `theme-vocabulary.json` | Kiinteä lista slug-teemoja (vaihe 3) | Kyllä (kun luodaan) |
| `tmp/{designId}.pdf` | **Transient** PDF-export | **Ei** (`.gitignore`) |
| `pdf/*.pdf` | Vanha polku samaan tarkoitukseen | **Ei** (`.gitignore`) |

## Vaiheiden käyttö

### Vaihe 1 — `01-map-ids.mjs`

Hakee Canva Connect API:sta kaikki omat esitykset ja ehdottaa täsmäytyksiä.

```bash
node scripts/canva/01-map-ids.mjs              # normaali ajo, käyttää välimuistia
node scripts/canva/01-map-ids.mjs --refresh    # pakota uusi API-haku
node scripts/canva/01-map-ids.mjs --dry-run    # ei API-kutsuja, käytä välimuistia
```

Tuottaa:
- `id-map.json` — kaikki 75 sivustotietuetta, statukset `proposed | confirmed | unmatched`
- `id-map-review.md` — luettava tarkistuslista

**Skripti ei koskaan aseta status="confirmed" itse.** Ihmisen pitää:
1. Käydä `id-map-review.md` läpi
2. Vahvistaa OK-rivit muuttamalla `status: "proposed"` → `"confirmed"` `id-map.json`:issa
3. Korjata väärät `designId`-arvot manuaalisesti tarvittaessa

### Vaihe 2 — `02-extract.mjs`

_Ei vielä toteutettu — odottaa vaiheen 1 tuloksia._

Käsittelee vain `status="confirmed"`-rivit. PDF-export → tekstinpoiminta → `cache/{designId}.json`.

### Vaihe 3 — `03-enrich.mjs`

_Ei vielä toteutettu._

### Vaihe 4 — `04-analyse.mjs`

_Ei vielä toteutettu._

---

## Kertaluontoinen OAuth-setup (ennen ensimmäistä ajoa)

Canva Connect vaatii OAuth-integraation.

1. **Rekisteröi integraatio**: https://www.canva.dev/docs/connect/appendix/quickstart/
   → *Register your integration*
   - Anna sille nimi (esim. `jarilaru-content-pipeline`)
   - Salli scope: `design:content:read`, `design:permission:read` (minimissään)
   - Aseta redirect URL: `http://localhost:5173/callback` (Authorization Code flow tarvitsee sen)

2. **Talleta client credentials** `.env`:iin (ks. `.env.example`):
   ```
   CANVA_CLIENT_ID=...
   CANVA_CLIENT_SECRET=...
   ```

3. **Suorita Authorization Code flow** kerran (esim. selaimessa) saadaksesi refresh token:
   - Ohjeet: https://www.canva.dev/docs/connect/authentication/
   - Talleta saatu refresh_token:
     ```
     CANVA_REFRESH_TOKEN=...
     ```

4. Aja `node scripts/canva/01-map-ids.mjs` — access token uusiutuu automaattisesti refresh-tokenilla.

---

## Turvallisuus

- **`.env` on `.gitignore`ssa** — älä koskaan committoi tokeneita
- Skriptit eivät logita tokeneita eikä allekirjoitettuja lataus-URL:eja
- Refresh token on pitkäikäinen — kohtele salaisuutena

## Lisenssi

Data-artefaktit (id-map, cache-tekstit, rich JSON, analysis JSON) sisältävät
Jari Larun luomia esityssisältöjä. Käyttö rajoitettu tämän repositorion
tarkoituksiin. Repositorio-koodi on MIT-lisenssillä, mutta data-artefaktit
kuuluvat tekijänoikeuden alaisiksi. Ei julkaista uudelleen kolmansien osapuolten
palveluihin ilman lupaa.

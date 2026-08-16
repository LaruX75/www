import { test, expect } from '@playwright/test';

// PF2 shared Sisältö facet coverage smoke.
// Uses the Pagefind runtime that already loads on every page
// (see src/_includes/_meta.njk + nav search UI) to query the index.

const EXPECTED_SISALTO_VALUES = [
  'Julkaisut',
  'Opinnäytteet',
  'Esitykset',
  'Kirjoitukset ja puheenvuorot',
  'Mediassa'
];

async function loadPagefind(page) {
  await page.goto('/mediassa/');
  return await page.evaluate(async () => {
    const pf = await import('/pagefind/pagefind.js');
    await pf.options({ baseUrl: '/' });
    return { ok: true, filters: await pf.filters(), search: null };
  });
}

test.describe('PF2 shared Sisältö facet', () => {
  test('Pagefind exposes all five Sisältö values as a filter group', async ({ page }) => {
    const result = await loadPagefind(page);
    expect(result.ok).toBe(true);
    const sisalto = result.filters['Sisältö'];
    expect(sisalto, 'Pagefind must expose a Sisältö filter group').toBeTruthy();
    const availableValues = Object.keys(sisalto);
    for (const expected of EXPECTED_SISALTO_VALUES) {
      expect(availableValues, `Sisältö should include "${expected}"`).toContain(expected);
      expect(sisalto[expected], `Sisältö:${expected} should have a positive record count`).toBeGreaterThan(0);
    }
  });

  const FIXTURES = [
    { sisalto: 'Julkaisut', query: 'Kosovo', urlRegex: /^\/julkaisut\// },
    { sisalto: 'Opinnäytteet', query: 'thesis', urlRegex: /^\/opinnaytteet\/[0-9]+\// },
    { sisalto: 'Esitykset', query: 'ohjelmointi', urlRegex: /^\/(en\/)?presentations\// },
    { sisalto: 'Kirjoitukset ja puheenvuorot', query: 'valtuustossa', urlRegex: /^\/20\d\d\// },
    { sisalto: 'Mediassa', query: 'tekoäly', urlRegex: /^\/mediassa\// }
  ];

  for (const fixture of FIXTURES) {
    test(`Sisältö:${fixture.sisalto} filter narrows Pagefind results`, async ({ page }) => {
      await page.goto('/mediassa/');
      const results = await page.evaluate(async ({ sisalto, query }) => {
        const pf = await import('/pagefind/pagefind.js');
        await pf.options({ baseUrl: '/' });
        const search = await pf.search(query, {
          filters: { 'Sisältö': sisalto }
        });
        const first = await Promise.all(search.results.slice(0, 5).map((r) => r.data()));
        return {
          total: search.results.length,
          urls: first.map((d) => d.url)
        };
      }, { sisalto: fixture.sisalto, query: fixture.query });
      expect(results.total, `Sisältö:${fixture.sisalto} + "${fixture.query}" should return at least one hit`).toBeGreaterThan(0);
      const anyMatch = results.urls.some((url) => fixture.urlRegex.test(url));
      expect(anyMatch, `At least one Sisältö:${fixture.sisalto} hit should land under ${fixture.urlRegex}; got ${JSON.stringify(results.urls)}`).toBe(true);
    });
  }
});

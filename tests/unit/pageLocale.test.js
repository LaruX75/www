const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pageText, localeUrl, localizeCopy } = require('../../src/_utils/pageLocale');

test('main-page links preserve query and fragment; original documents keep their URL', () => {
  assert.equal(localeUrl('/kirjoitukset/?opinions=political#mielipiteet', 'en'), '/en/writings/?opinions=political#mielipiteet');
  assert.equal(localeUrl('/kynasta/', 'en'), '/en/kynasta/');
  assert.equal(localeUrl('/opetus/', 'en'), '/en/teaching/');
  assert.equal(localeUrl('/2022/04/04/example/', 'en'), '/2022/04/04/example/');
  assert.equal(localeUrl('https://example.com/tietoa/', 'en'), 'https://example.com/tietoa/');
  assert.equal(localeUrl('/tietoa/', 'fi'), '/tietoa/');
});
test('display translation tolerates line wrapping and preserves unknown original writing', () => {
  assert.equal(pageText('  Tekoälylukutaito  ', 'en'), '  AI literacy  ');
  assert.equal(pageText('An original article title', 'en'), 'An original article title');
  assert.equal(pageText('Tutkimus', 'fi'), 'Tutkimus');
});
test('localizing editorial cards never changes identifiers or taxonomy filters', () => {
  const source = { title: 'Tekoälylukutaito', href: '/tutkimus/', key: 'Tutkimus', filter: 'route:opintojaksot', categories: ['Tekoäly'], keywords: ['Tekoäly'], value: 'Tutkimus' };
  const result = localizeCopy(source, 'en');
  assert.equal(result.title, 'AI literacy');
  assert.equal(result.href, '/en/research/');
  for (const key of ['key','filter','categories','keywords','value']) assert.deepEqual(result[key], source[key]);
  assert.equal(source.title, 'Tekoälylukutaito');
});
test('council and election records use Eleventy date-prefix semantics', () => {
  const { readCouncilMeetingCollections } = require('../../src/_data/councilMeetings');
  const items = Object.values(readCouncilMeetingCollections()).flat();
  const item = items.find(i => i.inputPath.endsWith('2022-04-04-palveluverkkolinjaukset-eivat-ole-vain-kylakoulukysymys.md'));
  assert.ok(item);
  assert.equal(item.url, '/2022/04/04/palveluverkkolinjaukset-eivat-ole-vain-kylakoulukysymys/');
});

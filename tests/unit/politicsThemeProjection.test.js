const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

const {
  createAuthoritativeItemIndex,
  buildPoliticsThemePages,
  normalizeCanonicalPageUrl
} = require("../../src/_utils/politicsThemeProjection");
const buildTimelineProjectionData = require("../../src/_data/timelineProjection");
const politicsThemePages = require("../../src/_data/politicsThemePages");

function canonicalItem(overrides = {}) {
  return {
    pageUrl: "/2024/03/18/example/",
    title: "Canonical Example",
    date: "2024-03-18",
    year: 2024,
    contentType: "politicalSpeech",
    contexts: ["societal-interaction"],
    ...overrides
  };
}

describe("politicsThemeProjection", () => {
  test("creates authoritative index by canonical pageUrl", () => {
    const index = createAuthoritativeItemIndex([
      canonicalItem(),
      canonicalItem({ pageUrl: "/2025/03/11/another/", title: "Another" })
    ]);

    assert.equal(index.size, 2);
    assert.equal(index.get("/2024/03/18/example/").title, "Canonical Example");
  });

  test("projects canonical local references into SSR-ready links", () => {
    const pages = buildPoliticsThemePages([
      {
        key: "theme",
        timeline: [
          {
            year: "2024",
            title: "Example year",
            text: "Example text",
            links: ["/2024/03/18/example/"]
          }
        ]
      }
    ], {
      authoritativeItems: [
        canonicalItem()
      ]
    });

    assert.deepEqual(pages[0].timeline[0].links, [
      {
        href: "/2024/03/18/example/",
        label: "Canonical Example",
        pageUrl: "/2024/03/18/example/",
        date: "2024-03-18",
        year: 2024,
        contentType: "politicalSpeech",
        contexts: ["societal-interaction"]
      }
    ]);
  });

  test("normalizes duplicate date prefixes out of projected canonical local pageUrls", () => {
    const pages = buildPoliticsThemePages([
      {
        key: "theme",
        timeline: [
          {
            year: "2022",
            title: "Normalized",
            text: "Normalized",
            links: ["/2022/04/04/palveluverkkolinjaukset-eivat-ole-vain-kylakoulukysymys/"]
          }
        ]
      }
    ], {
      authoritativeItems: [
        canonicalItem({
          pageUrl: "/2022/04/04/2022-04-04-palveluverkkolinjaukset-eivat-ole-vain-kylakoulukysymys/",
          title: "Puheenvuoro valtuustossa § 8: Palveluverkkolinjaukset eivät ole vain kyläkoulukysymys",
          date: "2022-04-04",
          year: 2022
        })
      ]
    });

    assert.deepEqual(pages[0].timeline[0].links[0], {
      href: "/2022/04/04/palveluverkkolinjaukset-eivat-ole-vain-kylakoulukysymys/",
      label: "Puheenvuoro valtuustossa § 8: Palveluverkkolinjaukset eivät ole vain kyläkoulukysymys",
      pageUrl: "/2022/04/04/palveluverkkolinjaukset-eivat-ole-vain-kylakoulukysymys/",
      date: "2022-04-04",
      year: 2022,
      contentType: "politicalSpeech",
      contexts: ["societal-interaction"]
    });
  });

  test("preserves approved manual links for external, special local, or out-of-slice local landings", () => {
    const pages = buildPoliticsThemePages([
      {
        key: "theme",
        timeline: [
          {
            year: "2025",
            title: "Manual links",
            text: "Manual text",
            links: [
              { href: "https://example.com", label: "External source" },
              { href: "/poliittinen-avoimuus/", label: "Sidonnaisuudet ja vaalirahoitus" },
              { href: "/mediassa/2025/12/24/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/", label: "24 myyttiä tekoälystä ja datasta -joulukalenteri" }
            ]
          }
        ]
      }
    ], {
      authoritativeItems: []
    });

    assert.deepEqual(pages[0].timeline[0].links, [
      { href: "https://example.com", label: "External source" },
      { href: "/poliittinen-avoimuus/", label: "Sidonnaisuudet ja vaalirahoitus" },
      { href: "/mediassa/2025/12/24/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/", label: "24 myyttiä tekoälystä ja datasta -joulukalenteri" }
    ]);
  });

  test("throws if a canonical local reference has no authoritative item", () => {
    assert.throws(() => buildPoliticsThemePages([
      {
        key: "theme",
        timeline: [
          {
            year: "2024",
            title: "Broken",
            text: "Broken",
            links: ["/missing/"]
          }
        ]
      }
    ], {
      authoritativeItems: []
    }), /missing authoritative item/);
  });

  test("actual politics theme pages preserve projected/manual boundaries and authoritative canonical parity", () => {
    const authoritativeIndex = createAuthoritativeItemIndex(buildTimelineProjectionData().items);
    const links = politicsThemePages.flatMap((page) =>
      page.timeline.flatMap((entry) =>
        entry.links.map((link) => ({
          page: page.key,
          entryTitle: entry.title,
          ...link
        }))
      )
    );

    const projected = links.filter((link) => link.pageUrl);
    const manual = links.filter((link) => !link.pageUrl);

    assert.equal(links.length, 45);
    assert.equal(projected.length, 41);
    assert.equal(manual.length, 4);

    assert.deepEqual(
      manual
        .map(({ page, entryTitle, href, label }) => ({ page, entryTitle, href, label }))
        .sort((left, right) => `${left.page}|${left.href}`.localeCompare(`${right.page}|${right.href}`, "fi")),
      [
        {
          page: "avoin-valmistelu",
          entryTitle: "Valmisteluprosessin toistuvat rakenneongelmat",
          href: "/poliittinen-avoimuus/",
          label: "Sidonnaisuudet ja vaalirahoitus"
        },
        {
          page: "palveluverkko",
          entryTitle: "Palveluverkkokeskustelu jatkuu uutena päätöskokonaisuutena",
          href: "https://www.youtube.com/watch?v=7EXB54VvlsU&t=2s",
          label: "Oululaisia lapsia ja nuoria koskevien tilastotietojen tarkastelua"
        },
        {
          page: "sivistys-ja-koulutus",
          entryTitle: "Tekoälylukutaito politiikan ja opetuksen ytimessä",
          href: "/mediassa/2025/12/24/24-myyttia-tekoalysta-ja-datasta-joulukalenteri/",
          label: "24 myyttiä tekoälystä ja datasta -joulukalenteri"
        },
        {
          page: "sivistys-ja-koulutus",
          entryTitle: "Tekoälylukutaito politiikan ja opetuksen ytimessä",
          href: "/mediassa/2026/07/04/oulun-yliopiston-tutkijoita-mukana-palkitussa-tekoalylukutaidon-oppimisratkaisussa/",
          label: "Oulun yliopiston tutkijoita mukana palkitussa tekoälylukutaidon oppimisratkaisussa"
        }
      ]
    );

    projected.forEach((link) => {
      const authoritativeItem = authoritativeIndex.get(link.pageUrl);
      assert.ok(authoritativeItem, `missing authoritative item for ${link.pageUrl}`);
      assert.equal(link.href, normalizeCanonicalPageUrl(authoritativeItem.pageUrl));
      assert.equal(link.label, authoritativeItem.title);
      assert.equal(link.date, authoritativeItem.date);
      assert.equal(link.year, authoritativeItem.year);
      assert.equal(link.contentType, authoritativeItem.contentType);
      assert.deepEqual(link.contexts, authoritativeItem.contexts);
      assert.ok(!link.href.startsWith("/mediassa/"), `media link should stay manual: ${link.href}`);
    });
  });
});

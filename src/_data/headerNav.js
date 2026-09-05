const universityEmailHref = "mailto:%6A%61%72%69%2E%6C%61%72%75%40%6F%75%6C%75%2E%66%69";
const politicsEmailHref = "mailto:%6A%61%72%69%2E%6C%61%72%75%40%6F%75%6B%61%2E%66%69";
const zoomMeetingHref = "https://zoom.us/my/larux";

module.exports = {
  fi: [
    {
      data: {
        eleventyNavigation: {
          key: "home",
          title: "Etusivu",
          url: "/",
          icon: "bi bi-house-door-fill",
          order: 10
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "me",
          title: "Minä",
          url: "/tietoa/",
          icon: "bi bi-person-fill",
          parent: "home",
          order: 20
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "media",
          title: "Mediassa",
          url: "/mediassa/",
          icon: "bi bi-camera-reels-fill",
          parent: "home",
          order: 55
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "work",
          title: "Työ",
          url: "/tyoni-yliopistonlehtorina/",
          icon: "bi bi-briefcase-fill",
          parent: "home",
          order: 30
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "politics",
          title: "Politiikka",
          url: "/politiikka/",
          icon: "bi bi-bank2",
          parent: "home",
          order: 40
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "writings",
          title: "Kynästä",
          url: "/kynasta/",
          icon: "bi bi-pencil-fill",
          parent: "home",
          order: 50
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "topic_profiles",
          title: "Teemaprofiilit",
          url: "/teemat/",
          parent: "writings",
          order: 57
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "contact",
          title: "Ota yhteyttä",
          url: "/yhteystiedot/",
          icon: "bi bi-envelope",
          parent: "home",
          order: 60
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "blog",
          title: "Blogi",
          url: "/blogi/",
          parent: "writings",
          order: 10
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "societal_interaction",
          title: "Yhteiskunnallinen vuorovaikutus",
          url: "/yhteiskunnallinen-vuorovaikutus/",
          parent: "work",
          order: 15
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "publications",
          title: "Julkaisut",
          url: "/julkaisut/",
          parent: "work",
          order: 20
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "dissertation",
          title: "Väitöskirja",
          url: "/vaitoskirja/",
          parent: "work",
          order: 25
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "presentations",
          title: "Esitykset",
          url: "/esitykset/",
          parent: "work",
          order: 30
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "theses",
          title: "Opinnäytteet",
          url: "/opinnaytteet/",
          parent: "work",
          order: 40
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "council_meetings",
          title: "Kaupunginvaltuusto",
          url: "/politiikka/kaupunginvaltuusto/",
          parent: "politics",
          order: 45
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "education_committee",
          title: "Sivistyslautakunta",
          url: "/politiikka/sivistyslautakunta/",
          parent: "politics",
          order: 47
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "election_history",
          title: "Vaalikaudet",
          url: "/politiikka/vaalikaudet/",
          parent: "politics",
          order: 50
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "election_2025",
          title: "Kunta- ja aluevaalit 2025",
          url: "/kunta-ja-aluevaalit-2025/",
          parent: "election_history",
          order: 10
        }
      }
    }
  ],
  en: [
    {
      data: {
        eleventyNavigation: {
          key: "home",
          title: "Home",
          url: "/en/",
          icon: "bi bi-house-door-fill",
          order: 10
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "me",
          title: "Me",
          url: "/en/about/",
          icon: "bi bi-person-fill",
          parent: "home",
          order: 20
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "work",
          title: "Work",
          url: "/en/work/",
          icon: "bi bi-briefcase-fill",
          parent: "home",
          order: 30
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "politics",
          title: "Politics",
          url: "/en/politics/",
          icon: "bi bi-bank2",
          parent: "home",
          order: 40
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "writings",
          title: "Writings",
          url: "/en/writings/",
          icon: "bi bi-pencil-fill",
          parent: "home",
          order: 50
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "media",
          title: "Media",
          url: "/en/media/",
          icon: "bi bi-camera-reels-fill",
          parent: "home",
          order: 55
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "contact",
          title: "Contact",
          url: "/en/contact/",
          icon: "bi bi-envelope",
          parent: "home",
          order: 60
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "blog",
          title: "Blog",
          url: "/en/blog/",
          parent: "writings",
          order: 10
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "societal_interaction",
          title: "Societal Engagement",
          url: "/en/societal-engagement/",
          parent: "work",
          order: 15
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "publications",
          title: "Publications",
          url: "/en/publications/",
          parent: "work",
          order: 20
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "dissertation",
          title: "Doctoral Dissertation",
          url: "/en/dissertation/",
          parent: "work",
          order: 25
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "presentations",
          title: "Presentations",
          url: "/en/presentations/",
          parent: "work",
          order: 30
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "theses",
          title: "Theses",
          url: "/en/theses/",
          parent: "work",
          order: 40
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "election_history",
          title: "Election History",
          url: "/en/election-history/",
          parent: "politics",
          order: 50
        }
      }
    }
  ],
  megaMenuMe: {
    fi: {
      sections: [
        {
          heading: "Jari lyhyesti",
          links: [
            {
              title: "Tietoa minusta",
              href: "/tietoa/",
              icon: "bi bi-info-circle me-2",
              menuLink: true,
              description: "Henkilökuva, elämä ja harrastukset."
            },
            {
              title: "Ansioluettelo",
              href: "/cv/",
              icon: "bi bi-file-earmark-person me-2",
              menuLink: true,
              description: "Koulutus, kokemus ja keskeiset akateemiset meriitit."
            },
            {
              title: "Palkinnot",
              href: "/palkinnot/",
              icon: "bi bi-award me-2",
              description: "Saadut tunnustukset opetuksen ja avoimen tieteen työstä."
            }
          ]
        },
        {
          heading: "Vapaa-aika",
          links: [
            {
              title: "Autolomat",
              href: "/autolomat/",
              icon: "bi bi-car-front me-2",
              menuLink: true,
              description: "Euroopan halki omalla autolla."
            },
            {
              title: "Kulinaristi",
              href: "https://www.instagram.com/stories/highlights/18134958520132291/?hl=fi",
              icon: "bi bi-egg-fried me-2",
              external: true,
              description: "Intohimoinen ruoanlaittaja, leipuri ja keittokirjojen keräilijä."
            },
            {
              title: "Hartiapankkiremontoija",
              href: "https://www.instagram.com/stories/highlights/17917732456477538/?hl=fi",
              icon: "bi bi-hammer me-2",
              external: true,
              description: "1970-luvun talon remontteja kaivinkoneen ohjaimista tapetointiin."
            }
          ]
        },
        {
          heading: "Roolini",
          links: [
            {
              title: "Poliitikko",
              href: "/politiikka/",
              icon: "bi bi-bank2 me-2",
              description: "Paikallispolitiikan teemat, tavoitteet ja päätöksenteko."
            },
            {
              title: "Yrittäjä",
              href: "/kouluttaja/",
              icon: "bi bi-building me-2",
              description: "Koulutus- ja asiantuntijapalvelut Larux t:mi:n kautta."
            }
          ]
        }
      ],
      showcase: {
        imageSrc: "/img/uploads/2020/01/jari.laru_1397908734_26-e1610053137214.jpg",
        imageAlt: "Jari Laru",
        title: "Jari Laru",
        description: "Isä, kulinaristi ja automatkailija – kun ei olla töissä.",
        cta: {
          href: "/yhteystiedot/",
          label: "Ota yhteyttä"
        }
      }
    },
    en: {
      sections: [
        {
          heading: "About Jari",
          links: [
            {
              title: "About me",
              href: "/en/about/",
              icon: "bi bi-info-circle me-2",
              menuLink: true,
              description: "Biography, life and hobbies."
            },
            {
              title: "Curriculum Vitae",
              href: "/en/cv/",
              icon: "bi bi-file-earmark-person me-2",
              menuLink: true,
              description: "Education, experience, and key academic merits."
            },
            {
              title: "Awards",
              href: "/en/awards/",
              icon: "bi bi-award me-2",
              description: "Recognition received for teaching and open science work."
            }
          ]
        },
        {
          heading: "Free Time",
          links: [
            {
              title: "Road Trips",
              href: "/en/road-trips/",
              icon: "bi bi-car-front me-2",
              menuLink: true,
              description: "Across Europe by car."
            },
            {
              title: "Foodie",
              href: "https://www.instagram.com/stories/highlights/18134958520132291/?hl=fi",
              icon: "bi bi-egg-fried me-2",
              external: true,
              description: "Passionate home cook, baker, and cookbook collector."
            },
            {
              title: "DIY Renovator",
              href: "https://www.instagram.com/stories/highlights/17917732456477538/?hl=fi",
              icon: "bi bi-hammer me-2",
              external: true,
              description: "1970s house renovations from excavator work to wallpapering."
            }
          ]
        },
        {
          heading: "My Roles",
          links: [
            {
              title: "Politician",
              href: "/en/politics/",
              icon: "bi bi-bank2 me-2",
              description: "Local politics, priorities, and public decision-making."
            },
            {
              title: "Entrepreneur",
              href: "/en/company/",
              icon: "bi bi-building me-2",
              description: "Training and expert services through Larux."
            }
          ]
        }
      ],
      showcase: {
        imageSrc: "/img/uploads/2020/01/jari.laru_1397908734_26-e1610053137214.jpg",
        imageAlt: "Jari Laru",
        title: "Jari Laru",
        description: "Father, foodie and road tripper – the person behind the work.",
        cta: {
          href: "/en/contact/",
          label: "Get in touch"
        }
      }
    }
  },
  megaMenuPolitics: {
    fi: {
      description: "Poliittinen profiili, kaupunginvaltuuston kokoukset, vaalikaudet ja avoimuustiedot samasta näkymästä.",
      spotlight: {
        title: "Poliittisen työn kokonaiskuva",
        description: "Politiikka-sivu kertoo nykyisen profiilin. Kaupunginvaltuusto näyttää kokouskohtaisen työn, vaalikaudet työn muutoksen ajassa.",
        roles: [
          "2. varavaltuutettu, Oulun kaupunginvaltuusto",
          "Sivistyslautakunnan jäsen, Oulun kaupunki",
          "Aluevaltuuston varajäsen, Pohjois-Pohjanmaan hyvinvointialue"
        ],
        cta: {
          href: "/politiikka/",
          label: "Avaa politiikkasivu"
        }
      },
      sections: [
        {
          heading: "Politiikan pääreitit",
          headingHref: "/politiikka/",
          links: [
            {
              title: "Kaupunginvaltuusto",
              href: "/politiikka/kaupunginvaltuusto/",
              icon: "bi bi-building-check me-2",
              menuLink: true,
              description: "Kokoukset, pöytäkirjat, videot ja oma valtuustotyö kokouksittain."
            },
            {
              title: "Sivistyslautakunta",
              href: "/politiikka/sivistyslautakunta/",
              icon: "bi bi-clipboard-check me-2",
              menuLink: true,
              description: "Kokouskohtainen näkymä sivistyslautakunnan ja aiemman sivistys- ja kulttuurilautakunnan työhön."
            },
            {
              title: "Vaalikaudet",
              href: "/politiikka/vaalikaudet/",
              icon: "bi bi-calendar-event me-2",
              menuLink: true,
              description: "Luottamustoimet, vaalitulokset ja poliittinen työ vaalikausittain."
            }
          ]
        },
        {
          heading: "Päälinjat",
          links: [
            {
              title: "Sivistys ja koulutus",
              href: "/politiikka/sivistys-ja-koulutus/",
              icon: "bi bi-mortarboard-fill me-2",
              menuLink: true,
              description: "Perusopetus, sivistyslautakunta, opettajankoulutus ja tekoäly opetuksessa — aikajana ja perustelut."
            },
            {
              title: "Kampus, Raksila ja Linnanmaa",
              href: "/politiikka/kampus-raksila-linnanmaa/",
              icon: "bi bi-building-fill me-2",
              menuLink: true,
              description: "Kampusratkaisut, normaalikoulun tilat ja Linnanmaan asema — aikajana ja perustelut."
            },
            {
              title: "Palveluverkko ja kaupunginosat",
              href: "/politiikka/palveluverkko/",
              icon: "bi bi-diagram-3-fill me-2",
              menuLink: true,
              description: "Kouluverkko, väestösuunnitteet ja alueellinen yhdenvertaisuus koko kaupungin mittakaavassa."
            },
            {
              title: "Avoin valmistelu ja tiedolla johtaminen",
              href: "/politiikka/avoin-valmistelu/",
              icon: "bi bi-bar-chart-steps me-2",
              menuLink: true,
              description: "Valmistelun läpinäkyvyys, avoimet asiakirjat ja tiedolla johtamisen työkalut."
            }
          ]
        },
        {
          heading: "Aineistot ja läpinäkyvyys",
          links: [
            {
              title: "Valtuustopuheenvuorot",
              href: "/valtuustotyo/#puheet",
              icon: "bi bi-mic me-2",
              menuLink: true,
              description: "Kokouksissa pidetyt puheet, pöytäkirjat ja videot.",
              countKey: "pub_puhe_valtuusto"
            },
            {
              title: "Valtuustoaloitteet",
              href: "/valtuustotyo/#aloitteet",
              icon: "bi bi-megaphone me-2",
              menuLink: true,
              description: "Kirjalliset avaukset kaupunginvaltuuston päätöksentekoon.",
              countKey: "politics"
            },
            {
              title: "Sidonnaisuudet ja vaalirahoitus",
              href: "/sidonnaisuudet/",
              icon: "bi bi-link-45deg me-2",
              menuLink: true,
              description: "Sidonnaisuudet, VTV-linkit ja vaalirahoitus samassa näkymässä."
            }
          ]
        }
      ]
    },
    en: {
      description: "Positions of trust, political work, and election periods in one view.",
      spotlight: {
        title: "Current positions of trust",
        description: "The politics page shows the profile. This panel also makes the current responsibilities visible at a glance.",
        roles: [
          "2nd deputy councillor, City of Oulu",
          "Member of the Education Committee, City of Oulu",
          "Deputy member of the regional council, North Ostrobothnia Wellbeing Services County"
        ],
        cta: {
          href: "/en/politics/",
          label: "Open politics page"
        }
      },
      sections: [
        {
          heading: "Role & Transparency",
          links: [
            {
              title: "Politics page",
              href: "/en/politics/",
              icon: "bi bi-person-badge me-2",
              menuLink: true,
              description: "Positions of trust, priorities, and political profile."
            },
            {
              title: "Affiliations & Disclosures",
              href: "/en/affiliations/",
              icon: "bi bi-link-45deg me-2",
              menuLink: true,
              description: "Open declarations of affiliations."
            },
            {
              title: "Facebook",
              href: "https://www.facebook.com/jari.laru.poliitikko/",
              icon: "bi bi-facebook me-2",
              external: true,
              description: "Current updates and public discussion on Facebook."
            }
          ]
        },
        {
          heading: "Activities",
          links: [
            {
              title: "Initiatives",
              href: "/en/writings/#aloitteet",
              icon: "bi bi-megaphone me-2",
              menuLink: true,
              description: "Motions in the city council.",
              countKey: "politics"
            },
            {
              title: "Speeches",
              href: "/en/writings/#puheet",
              icon: "bi bi-mic me-2",
              menuLink: true,
              description: "Council speeches and statements.",
              countKey: "pub_puhe_valtuusto"
            },
            {
              title: "Political opinions",
              href: "/en/writings/?opinions=political#mielipiteet",
              icon: "bi bi-chat-left-quote me-2",
              menuLink: true,
              description: "Published political opinion pieces tied to public decision-making and local government.",
              countKey: "pub_mielipide_political"
            },
            {
              title: "All writings",
              href: "/en/writings/",
              icon: "bi bi-pencil-square me-2",
              description: "A full archive of speeches, initiatives, and opinion texts."
            }
          ]
        },
        {
          heading: "Election periods",
          links: [
            {
              title: "Election history",
              href: "/en/election-history/",
              icon: "bi bi-calendar-event me-2",
              menuLink: true,
              description: "Terms of office, election results, political work, and archived campaign pages in one view."
            }
          ]
        }
      ]
    }
  },
  megaMenuWritings: {
    fi: {
      heading: "Kirjoitukset, puheet ja kannanotot",
      description: "Omat kirjoitukset, puheenvuorot, lausunnot ja muut itse tuotetut sisällöt yhdessä näkymässä.",
      groupHeading: "Kynästä",
      contentColumns: [
        {
          heading: "Kirjoitukset",
          headingHref: "/kirjoitukset/",
          links: [
            { title: "Kirjoitukset (koontisivu)", href: "/kirjoitukset/", icon: "bi bi-pencil-square me-2", description: "Blogi, kolumnit ja mielipidekirjoitukset yhdessä näkymässä." },
            { title: "Blogi", href: "/blogi/", icon: "bi bi-pen me-2", countKey: "blog", description: "Ajankohtaiset kirjoitukset opetuksesta, teknologiasta ja yhteiskunnasta." },
            { title: "Kolumnit", href: "/kirjoitukset/#kolumnit", icon: "bi bi-journal-richtext me-2", countKey: "pub_kolumni", description: "Taustoittavia ja esseemäisiä tekstejä opetuksesta, yhteiskunnasta ja ilmiöistä." },
            { title: "Mielipidekirjoitukset", href: "/kirjoitukset/#mielipiteet", icon: "bi bi-chat-left-quote me-2", countKey: "pub_mielipide", description: "Lehdissä julkaistut mielipidekirjoitukset yhtenä kokonaisuutena." }
          ]
        },
        {
          heading: "Valtuustotyö",
          headingHref: "/valtuustotyo/",
          links: [
            { title: "Valtuustotyö (koontisivu)", href: "/valtuustotyo/", icon: "bi bi-building me-2", description: "Puheenvuorot ja aloitteet kaupunginvaltuustossa." },
            { title: "Valtuustopuheenvuorot", href: "/valtuustotyo/#puheet", icon: "bi bi-mic me-2", countKey: "pub_puhe_valtuusto", description: "Kaupunginvaltuuston kokouksissa pidetyt puheenvuorot." },
            { title: "Valtuustoaloitteet", href: "/valtuustotyo/#aloitteet", icon: "bi bi-megaphone me-2", countKey: "politics", description: "Valtuustoaloitteet ja muut kirjalliset avaukset päätöksentekoon." }
          ]
        },
        {
          heading: "Lausunnot ja julkiset puheet",
          headingHref: "/lausunnot/",
          links: [
            { title: "Lausunnot ja julkiset puheet (koontisivu)", href: "/lausunnot/", icon: "bi bi-file-earmark-text me-2", description: "Asiantuntijalausunnot ja julkiset puheet yhdessä näkymässä." },
            { title: "Lausunnot", href: "/lausunnot/#lausunnot", icon: "bi bi-file-earmark-text me-2", countData: "publications_statements", description: "Lausuntopalvelussa ja muissa valmisteluprosesseissa annetut asiantuntijalausunnot." },
            { title: "Julkiset puheet", href: "/lausunnot/#julkiset-puheet", icon: "bi bi-megaphone-fill me-2", countKey: "pub_puhe_julkinen", description: "Juhlapuheet, yliopistopuheet ja yleisötilaisuuksien puheenvuorot." },
            { title: "Teemaprofiilit", href: "/teemat/", icon: "bi bi-diagram-3 me-2", description: "Toimitetut aihepolut, joissa sama teema näkyy kirjoituksissa, puheissa ja lausunnoissa." }
          ]
        }
      ]
    },
    en: {
      heading: "Writings, Speeches, and Public Commentary",
      description: "Writing, speeches, statements, and other self-authored content in one place.",
      groupHeading: "Writings",
      contentColumns: [
        {
          heading: "Writing",
          links: [
            { title: "Blog", href: "/en/blog/", icon: "bi bi-pen me-2", countKey: "blog", description: "Posts on education, technology, and public life themes." },
            { title: "Columns", href: "/en/writings/#kolumnit", icon: "bi bi-journal-richtext me-2", countKey: "pub_kolumni", description: "Long-form texts on education, society, and public questions." },
            { title: "Opinion pieces", href: "/en/writings/#mielipiteet", icon: "bi bi-chat-left-quote me-2", countKey: "pub_mielipide", description: "Published opinion pieces as one body of writing." }
          ]
        },
        {
          heading: "Elected-office work",
          links: [
            { title: "Speeches", href: "/en/writings/#puheet", icon: "bi bi-mic me-2", countKey: "pub_puhe_valtuusto", description: "Council speeches and statements." },
            { title: "Initiatives", href: "/en/writings/#aloitteet", icon: "bi bi-megaphone me-2", countKey: "politics", description: "Council initiatives and concrete proposals in local politics." }
          ]
        },
        {
          heading: "Expert contributions",
          links: [
            { title: "Statements", href: "/en/writings/#lausunnot", icon: "bi bi-file-earmark-text me-2", countData: "publications_statements", description: "Expert statements submitted through public consultation and preparation processes." },
            { title: "Public speeches", href: "/en/writings/#julkiset-puheet", icon: "bi bi-megaphone-fill me-2", countKey: "pub_puhe_julkinen", description: "Ceremonial speeches, university talks, and public addresses." }
          ]
        }
      ]
    }
  },
  megaMenuWork: {
    fi: {
      layout: "four-columns",
      sections: [
        {
          heading: "Yliopistotyö",
          headingHref: "/tyoni-yliopistonlehtorina/",
          links: [
            {
              title: "Opetus",
              href: "/opetus/",
              icon: "bi bi-mortarboard me-2",
              description: "Julkiset kurssisivut ja opetukseen liittyvät kokonaisuudet."
            },
            {
              title: "Esitykset",
              href: "/esitykset/",
              icon: "bi bi-easel2 me-2",
              description: "Luentoja, opetussisältöjä ja avoimia opetusmateriaaleja yliopistotyön näkökulmasta."
            },
            {
              title: "Opetusportfolio",
              href: "/portfolio/",
              icon: "bi bi-folder me-2",
              description: "Pedagoginen ajattelu, opetusosaaminen ja opetustyön kehittäminen."
            },
            {
              title: "Ansioluettelo",
              href: "/cv/",
              icon: "bi bi-file-person me-2",
              description: "Koulutus, työkokemus ja asiantuntijuuden kuvaus."
            },
            {
              title: "Opiskelijapalaute",
              href: "/opiskelijoiden-antamaa-palautetta/",
              icon: "bi bi-chat-square-text me-2",
              description: "Kurssikohtainen opiskelijapalaute yliopisto-opintojaksoilta ja opetuksen kehittäminen."
            }
          ]
        },
        {
          heading: "Tutkimus",
          headingHref: "/tutkimus/",
          links: [
            {
              title: "Väitöskirja",
              href: "/vaitoskirja/",
              icon: "bi bi-mortarboard-fill me-2",
              description: "Lectio-video, väitöskirja ja neljä osajulkaisua samassa kokonaisuudessa."
            },
            {
              title: "Julkaisuluettelo",
              href: "/julkaisut/",
              icon: "bi bi-journal-text me-2",
              description: "Tieteelliset julkaisut ja viitetiedot koottuna yhteen näkymään."
            },
            {
              title: "Opinnäytetyöt",
              href: "/opinnaytteet/",
              icon: "bi bi-mortarboard me-2",
              description: "Ohjatut kandidaatti- ja pro gradu -tutkielmat omana kokonaisuutenaan."
            }
          ]
        },
        {
          heading: "Yhteiskunnallinen vuorovaikutus",
          headingHref: "/yhteiskunnallinen-vuorovaikutus/",
          links: [
            {
              title: "Lausunnot ja kannanotot",
              href: "/lausunnot/#lausunnot",
              icon: "bi bi-file-earmark-text me-2",
              description: "Tutkimustiedon ja asiantuntijuuden vieminen valmisteluun ja julkiseen keskusteluun."
            },
            {
              title: "Mediassa",
              href: "/mediassa/",
              icon: "bi bi-camera-reels me-2",
              description: "Haastattelut, podcastit ja mediaesiintymiset asiantuntijatyön jatkumona."
            }
          ]
        },
        {
          heading: "Täydennyskoulutukset (Larux t:mi)",
          headingHref: "/kouluttaja/",
          links: [
            {
              title: "Koulutuspalaute",
              href: "/koulutuspalaute/",
              icon: "bi bi-chat-square-quote me-2",
              description: "Täydennyskoulutusten ja asiantuntijatilaisuuksien palautteen kooste 2017–2026."
            }
          ]
        }
      ],
      cta: {
        title: "Larux t:mi",
        description: "Koulutukset tekoälystä, oppimisteknologiasta ja modernista pedagogiikasta.",
        href: "/kouluttaja/",
        label: "Tutustu palveluihin"
      }
    },
    en: {
      sections: [
        {
          heading: "University Work",
          links: [
            {
              title: "My Work as a University Lecturer",
              href: "/en/work/",
              icon: "bi bi-briefcase me-2",
              description: "Courses, teaching responsibilities, and pedagogical development."
            },
            {
              title: "Presentations",
              href: "/en/presentations/",
              icon: "bi bi-easel2 me-2",
              description: "Lectures, teaching content, and open educational materials from the university work perspective."
            },
            {
              title: "Teaching Portfolio",
              href: "/en/portfolio/",
              icon: "bi bi-folder me-2",
              description: "Pedagogical approach, teaching expertise, and development work."
            },
            {
              title: "Curriculum Vitae",
              href: "/en/cv/",
              icon: "bi bi-file-person me-2",
              description: "Education, work experience, and professional background."
            }
          ]
        },
        {
          heading: "Research",
          links: [
            {
              title: "Research",
              href: "/en/research/",
              icon: "bi bi-search me-2",
              description: "Research themes, projects, and the broader frame of my academic work."
            },
            {
              title: "Doctoral dissertation",
              href: "/en/dissertation/",
              icon: "bi bi-mortarboard-fill me-2",
              description: "Lectio video, dissertation, and four original publications in one place."
            },
            {
              title: "Publication List",
              href: "/en/publications/",
              icon: "bi bi-journal-text me-2",
              description: "Scientific publications, essays, and related outputs."
            },
            {
              title: "Theses",
              href: "/en/theses/",
              icon: "bi bi-mortarboard me-2",
              description: "Bachelor's and master's theses supervised by me."
            }
          ]
        },
        {
          heading: "Societal Engagement",
          links: [
            {
              title: "Societal engagement",
              href: "/en/societal-engagement/",
              icon: "bi bi-diagram-3 me-2",
              description: "How research and teaching continue in materials, statements, media, and decision-making."
            },
            {
              title: "Statements and commentary",
              href: "/en/writings/#lausunnot",
              icon: "bi bi-file-earmark-text me-2",
              description: "Expert statements and commentary connected to education policy and public debate."
            },
            {
              title: "Presentations and open materials",
              href: "/en/presentations/",
              icon: "bi bi-easel2 me-2",
              description: "Teaching expertise and research-based materials for teachers, schools, and networks."
            },
            {
              title: "Media",
              href: "/en/media/",
              icon: "bi bi-camera-reels me-2",
              description: "Interviews, podcasts, and media appearances as part of public expert work."
            }
          ]
        }
      ],
      cta: {
        title: "Book me for a keynote",
        description: "Expert talks on AI, EdTech, and modern pedagogy.",
        href: "/en/contact/",
        label: "Request a quote"
      }
    }
  },
  megaMenuMedia: {
    fi: {
      heading: "Mediassa",
      description: "Haastattelut, podcastit, videot ja muut mediaosumat, joissa Jari Larun työ näkyy muiden tuottamissa sisällöissä.",
      sections: [
        {
          heading: "Aloita tästä",
          links: [
            {
              title: "Mediassa-sivu",
              href: "/mediassa/",
              icon: "bi bi-camera-reels me-2",
              description: "Kokonaiskuva mediaosumista, rooleista ja julkisista asiantuntijakommenteista."
            },
            {
              title: "Nostot",
              href: "/mediassa/#media-nostot",
              icon: "bi bi-stars me-2",
              description: "Poimintoja haastatteluista, podcasteista, videoista ja asiantuntijaroolista."
            },
            {
              title: "Kaikki mediaosumat",
              href: "/mediassa/#media-arkisto",
              icon: "bi bi-collection me-2",
              description: "Selaa koko media-arkistoa yhdessä paikassa."
            }
          ]
        },
        {
          heading: "Sisältötyypit",
          links: [
            {
              title: "Lehtijutut",
              href: "/mediassa/?type=article",
              icon: "bi bi-newspaper me-2",
              description: "Artikkelit, haastattelut ja uutisjutut."
            },
            {
              title: "Podcastit ja radio",
              href: "/mediassa/?type=podcast",
              icon: "bi bi-broadcast me-2",
              description: "Keskustelut, podcast-jaksot ja radioesiintymiset."
            },
            {
              title: "Videot",
              href: "/mediassa/?type=video",
              icon: "bi bi-camera-video me-2",
              description: "Videot, tallenteet ja verkossa julkaistut esiintymiset."
            }
          ]
        },
        {
          heading: "Liittyvät sivut",
          links: [
            {
              title: "Yhteiskunnallinen vuorovaikutus",
              href: "/yhteiskunnallinen-vuorovaikutus/",
              icon: "bi bi-diagram-3 me-2",
              description: "Miten tutkimus ja opetus näkyvät mediassa, lausunnoissa, materiaaleissa ja päätöksenteossa."
            },
            {
              title: "Kynästä",
              href: "/kynasta/",
              icon: "bi bi-pencil me-2",
              description: "Jari Larun omat puheet, kirjoitukset ja lausunnot."
            },
            {
              title: "Esitykset",
              href: "/esitykset/",
              icon: "bi bi-easel2 me-2",
              description: "Koulutukset, luennot, videot ja avoimet materiaalit."
            }
          ]
        }
      ]
    },
    en: {
      heading: "Media",
      description: "Interviews, podcasts, videos, and media appearances where Jari Laru's work appears in content produced by others.",
      sections: [
        {
          heading: "Start here",
          links: [
            {
              title: "Media page",
              href: "/en/media/",
              icon: "bi bi-camera-reels me-2",
              description: "Overview of media appearances, public expert roles, and interviews."
            },
            {
              title: "Roles in media",
              href: "/en/media/#media-roles",
              icon: "bi bi-stars me-2",
              description: "How interviews, podcasts, videos, and expert appearances relate to public work."
            },
            {
              title: "All media appearances",
              href: "/en/media/#media-archive",
              icon: "bi bi-collection me-2",
              description: "Browse the full media archive in one place."
            }
          ]
        },
        {
          heading: "Content types",
          links: [
            {
              title: "Articles",
              href: "/en/media/?type=article",
              icon: "bi bi-newspaper me-2",
              description: "Articles, interviews, and news stories."
            },
            {
              title: "Podcasts and radio",
              href: "/en/media/?type=podcast",
              icon: "bi bi-broadcast me-2",
              description: "Podcast episodes, radio items, and conversations."
            },
            {
              title: "Videos",
              href: "/en/media/?type=video",
              icon: "bi bi-camera-video me-2",
              description: "Videos, recordings, and online appearances."
            }
          ]
        },
        {
          heading: "Related pages",
          links: [
            {
              title: "Societal engagement",
              href: "/en/societal-engagement/",
              icon: "bi bi-diagram-3 me-2",
              description: "How research and teaching continue in media, statements, materials, and decision-making."
            },
            {
              title: "Writings",
              href: "/en/writings/",
              icon: "bi bi-pencil me-2",
              description: "Jari Laru's own writings, speeches, and statements."
            },
            {
              title: "Presentations",
              href: "/en/presentations/",
              icon: "bi bi-easel2 me-2",
              description: "Talks, training materials, videos, and open materials."
            }
          ]
        }
      ]
    }
  },
  megaMenuContact: {
    fi: {
      heading: "Ota yhteyttä",
      description: "Valitse suora yhteydenottokanava roolin mukaan tai siirry yhteystietosivulle.",
      layout: "three-columns",
      columns: [
        {
          type: "links",
          heading: "Yliopisto & tutkimus",
          links: [
            { title: "Sähköposti", href: universityEmailHref, icon: "bi bi-envelope me-2", description: "Ensisijainen yliopistosähköposti työasioiden yhteydenottoihin." },
            { title: "Puhelin", href: "tel:+358294483810", icon: "bi bi-telephone me-2", description: "Yliopistotyöhön liittyvät yhteydenotot puhelimitse." },
            { title: "Zoom", href: zoomMeetingHref, icon: "bi bi-camera-video me-2", external: true, description: "Sovi etäpalaveri tai verkkotapaaminen suoraan Zoomissa." },
            { title: "Oulun yliopisto", href: "https://www.oulu.fi", icon: "bi bi-building me-2", external: true, description: "Työpaikkani ja yliopistoyhteisön viralliset sivut." }
          ]
        },
        {
          type: "links",
          heading: "Koulutukset & puheenvuorot",
          links: [
            { title: "Yritysyhteys", href: "tel:+358405118478", icon: "bi bi-whatsapp me-2", description: "Larux t:mi:n koulutus- ja puheenvuoropyynnöt tähän numeroon." },
            { title: "Kouluttaja", href: "/kouluttaja/", icon: "bi bi-briefcase me-2", description: "Palvelut, tausta ja yhteistyömahdollisuudet yrityksen kautta." },
            { title: "Esitykset", href: "/esitykset/", icon: "bi bi-easel2 me-2", description: "Puheenvuorot, materiaalit ja esimerkit koulutussisällöistä." },
            { title: "Yhteystiedot-sivu", href: "/yhteystiedot/", icon: "bi bi-person-lines-fill me-2", description: "Kaikki yhteydenottokanavat yhdellä sivulla." }
          ]
        },
        {
          type: "links",
          heading: "Politiikka & julkisuus",
          links: [
            { title: "Politiikan sähköposti", href: politicsEmailHref, icon: "bi bi-bank2 me-2", description: "Politiikkaan ja luottamustehtäviin liittyvät viestit." },
            { title: "Politiikka", href: "/politiikka/", icon: "bi bi-megaphone me-2", description: "Luottamustehtävät, tavoitteet ja vaikuttamisen painopisteet." },
            { title: "Facebook", href: "https://www.facebook.com/jari.laru.poliitikko/", icon: "bi bi-facebook me-2", external: true, description: "Poliittiset päivitykset ja keskustelu sosiaalisessa mediassa." }
          ]
        }
      ]
    },
    en: {
      heading: "Contact",
      description: "Choose the most relevant contact route by role or open the full contact page.",
      layout: "three-columns",
      columns: [
        {
          type: "links",
          heading: "University contact",
          links: [
            { title: "Email", href: universityEmailHref, icon: "bi bi-envelope me-2", description: "Primary university email for teaching and research inquiries." },
            { title: "Phone", href: "tel:+358294483810", icon: "bi bi-telephone me-2", description: "University contact number for work-related calls." },
            { title: "Zoom", href: zoomMeetingHref, icon: "bi bi-camera-video me-2", external: true, description: "Book or join an online meeting directly via Zoom." },
            { title: "University of Oulu", href: "https://www.oulu.fi", icon: "bi bi-building me-2", external: true, description: "Official university pages and institutional information." }
          ]
        },
        {
          type: "links",
          heading: "Training & speaking",
          links: [
            { title: "Business contact", href: "tel:+358405118478", icon: "bi bi-whatsapp me-2", description: "Training and keynote requests through Larux contact." },
            { title: "Trainer", href: "/en/company/", icon: "bi bi-briefcase me-2", description: "Services, focus areas, and collaboration options through Larux." },
            { title: "Presentations", href: "/en/presentations/", icon: "bi bi-easel2 me-2", description: "Talks, materials, and example keynote content." },
            { title: "Contact page", href: "/en/contact/", icon: "bi bi-person-lines-fill me-2", description: "All contact methods collected on one page." }
          ]
        },
        {
          type: "links",
          heading: "Politics & public role",
          links: [
            { title: "Politics email", href: politicsEmailHref, icon: "bi bi-bank2 me-2", description: "Messages related to municipal and regional politics." },
            { title: "Politics", href: "/en/politics/", icon: "bi bi-megaphone me-2", description: "Positions of trust, priorities, and policy themes." },
            { title: "Facebook", href: "https://www.facebook.com/jari.laru.poliitikko/", icon: "bi bi-facebook me-2", external: true, description: "Political updates and public discussion channel." }
          ]
        }
      ]
    }
  }
};

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
          icon: "bi bi-person-fill",
          order: 20
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "work",
          title: "Työ",
          icon: "bi bi-briefcase-fill",
          order: 30
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "politics",
          title: "Politiikka",
          icon: "bi bi-bank2",
          order: 40
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "writings",
          title: "Kynästä",
          icon: "bi bi-pencil-fill",
          order: 50
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
          key: "election_history",
          title: "Vaalihistoria",
          url: "/vaalihistoria/",
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
          icon: "bi bi-person-fill",
          order: 20
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "work",
          title: "Work",
          icon: "bi bi-briefcase-fill",
          order: 30
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "politics",
          title: "Politics",
          icon: "bi bi-bank2",
          order: 40
        }
      }
    },
    {
      data: {
        eleventyNavigation: {
          key: "writings",
          title: "Writings",
          icon: "bi bi-pencil-fill",
          order: 50
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
              title: "Ansioluettelo | Opetusportfolio",
              icon: "bi bi-file-earmark-person me-2",
              menuLink: true,
              description: "Koulutus, kokemus ja pedagoginen ajattelu yhdessä.",
              inlineLinks: [
                { title: "Ansioluettelo", href: "/cv/" },
                { title: "Opetusportfolio", href: "/portfolio/" }
              ]
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
              title: "Yliopistonlehtori",
              href: "/tyoni-yliopistonlehtorina/",
              icon: "bi bi-mortarboard me-2",
              description: "Opetus, tutkimus ja ohjaus yliopiston arjessa."
            },
            {
              title: "Poliitikko",
              href: "/politiikka/",
              icon: "bi bi-bank2 me-2",
              description: "Paikallispolitiikan teemat, tavoitteet ja päätöksenteko."
            },
            {
              title: "Yrittäjä",
              href: "/larux-tmi/",
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
              title: "Curriculum Vitae | Teaching Portfolio",
              icon: "bi bi-file-earmark-person me-2",
              menuLink: true,
              description: "Education, skills, and pedagogical profile in one place.",
              inlineLinks: [
                { title: "Curriculum Vitae", href: "/en/cv/" },
                { title: "Teaching Portfolio", href: "/en/portfolio/" }
              ]
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
              title: "University Lecturer",
              href: "/en/work/",
              icon: "bi bi-mortarboard me-2",
              description: "Teaching, research, and supervision in university work."
            },
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
      sections: [
        {
          heading: "Rooli & läpinäkyvyys",
          links: [
            {
              title: "Jari Laru, poliitikko",
              href: "/politiikka/",
              icon: "bi bi-person-badge me-2",
              menuLink: true,
              description: "Luottamustoimet, tavoitteet ja historia."
            },
            {
              title: "Sidonnaisuudet",
              href: "/sidonnaisuudet/",
              icon: "bi bi-link-45deg me-2",
              menuLink: true,
              description: "Avoimet ilmoitukset jäsenyyksistä."
            },
            {
              title: "Facebook",
              href: "https://www.facebook.com/jari.laru.poliitikko/",
              icon: "bi bi-facebook me-2",
              external: true,
              description: "Ajankohtaiset päivitykset ja keskustelu somessa."
            }
          ]
        },
        {
          heading: "Vaikuttaminen",
          links: [
            {
              title: "Valtuustoaloitteet",
              href: "/kynasta/#aloitteet",
              icon: "bi bi-megaphone me-2",
              menuLink: true,
              description: "Aloitteet kaupunginvaltuustossa.",
              countKey: "politics"
            },
            {
              title: "Puheenvuorot",
              href: "/kynasta/#puheet",
              icon: "bi bi-mic me-2",
              menuLink: true,
              description: "Valtuustopuheenvuorot ja esittelyt."
            },
            {
              title: "Mielipiteet",
              href: "/kynasta/#mielipiteet",
              icon: "bi bi-chat-text me-2",
              menuLink: true,
              description: "Kannanotot ja lehtijutut."
            },
            {
              title: "Kaikki kirjoitukset",
              href: "/kynasta/",
              icon: "bi bi-pencil-square me-2",
              description: "Kooste puheista, aloitteista, kolumneista ja mielipiteistä."
            }
          ]
        },
        {
          heading: "Vaalihistoria",
          links: [
            {
              title: "Vaalikaudet",
              href: "/vaalihistoria/",
              icon: "bi bi-calendar-event me-2",
              menuLink: true,
              description: "Vaalit ja luottamustoimet vaalikausittain."
            },
            {
              title: "Kuntavaalit 2025",
              href: "/kunta-ja-aluevaalit-2025/",
              icon: "bi bi-chevron-right me-2",
              description: "Kampanjateemat ja tulos kuntavaaleissa 2025."
            },
            {
              title: "Kuntavaalit 2021",
              href: "/kuntavaalit-2021/",
              icon: "bi bi-chevron-right me-2",
              description: "Vaaliteemat, tavoitteet ja kampanjasisällöt vuodelta 2021."
            },
            {
              title: "Aluevaalit 2022",
              href: "/jari-laru-aluevaltuustoon/",
              icon: "bi bi-chevron-right me-2",
              description: "Näkemykset hyvinvointialueen päätöksenteon kehittämiseen."
            },
            {
              title: "Kunnallisvaalit 2012",
              href: "/kunnallisvaalit-2012/",
              icon: "bi bi-chevron-right me-2",
              description: "Ensimmäisen kampanjan teemat ja taustatiedot."
            }
          ]
        }
      ]
    },
    en: {
      sections: [
        {
          heading: "Role & Transparency",
          links: [
            {
              title: "Jari Laru, politician",
              href: "/en/politics/",
              icon: "bi bi-person-badge me-2",
              menuLink: true,
              description: "Positions of trust and goals."
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
              description: "Council speeches and statements."
            },
            {
              title: "Opinion pieces",
              href: "/en/writings/#mielipiteet",
              icon: "bi bi-chat-text me-2",
              menuLink: true,
              description: "Columns and newspaper articles."
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
          heading: "Election History",
          links: [
            {
              title: "Election history",
              href: "/en/election-history/",
              icon: "bi bi-calendar-event me-2",
              menuLink: true,
              description: "Elections and terms of office."
            },
            {
              title: "Municipal elections 2021",
              href: "/kuntavaalit-2021/",
              icon: "bi bi-chevron-right me-2",
              description: "Campaign priorities and materials from the 2021 election."
            },
            {
              title: "Wellbeing area elections 2022",
              href: "/jari-laru-aluevaltuustoon/",
              icon: "bi bi-chevron-right me-2",
              description: "Themes and goals for regional wellbeing governance."
            }
          ]
        }
      ]
    }
  },
  megaMenuWritings: {
    fi: {
      heading: "Kirjoitukset ja puheet",
      description: "Kaikki tuotettu sisältö yhdessä paikassa.",
      groupHeading: "Minun kynästä ja suusta",
      contentColumns: [
        {
          links: [
            { title: "Aloitteet", href: "/kynasta/#aloitteet", icon: "bi bi-megaphone me-2", countKey: "politics", description: "Valtuustoaloitteet ja muut kirjalliset avaukset päätöksentekoon." },
            { title: "Blogi", href: "/blogi/", icon: "bi bi-pen me-2", countKey: "blog", description: "Ajankohtaiset kirjoitukset opetuksesta, teknologiasta ja yhteiskunnasta." }
          ]
        },
        {
          links: [
            { title: "Esitykset", href: "/esitykset/", icon: "bi bi-easel2 me-2", countKey: "presentations", description: "Koulutus- ja konferenssiesityksiä tekoälystä, oppimisesta ja pedagogiikasta." },
            { title: "Julkaisuluettelo", href: "/julkaisut/", icon: "bi bi-journal-text me-2", countKey: "publications", description: "Tieteelliset julkaisut, artikkelit ja muut kirjoitukset yhdessä näkymässä." }
          ]
        },
        {
          links: [
            { title: "Kolumnit", href: "/kynasta/#kolumnit", icon: "bi bi-journal-richtext me-2", countKey: "pub_kolumni", description: "Taustoittavia näkökulmatekstejä yhteiskunnasta ja koulutuksesta." },
            { title: "Mielipiteet", href: "/kynasta/#mielipiteet", icon: "bi bi-chat-text me-2", countKey: "pub_mielipide", description: "Lehdissä julkaistuja kannanottoja paikallisista ja valtakunnallisista aiheista." },
            { title: "Puheet", href: "/kynasta/#puheet", icon: "bi bi-mic me-2", countKey: "pub_puhe", description: "Valtuustossa ja tapahtumissa pidettyjä puheenvuoroja." }
          ]
        }
      ],
      seeAlso: {
        heading: "Katso myös",
        subheading: "Ohjaamiani opinnäytteitä",
        links: [
          { title: "Kandidaatintutkielmat", href: "/opinnaytteet/#card-bachelor", icon: "bi bi-book-half me-2", countData: "theses_kandit", description: "Ohjaamani opinnäytteet aihepiireittäin ja vuosittain." },
          { title: "Pro gradut", href: "/opinnaytteet/#card-master", icon: "bi bi-mortarboard me-2", countData: "theses_gradut", description: "Ohjaamani opinnäytteet aihepiireittäin ja vuosittain." }
        ]
      }
    },
    en: {
      heading: "Writings and Speeches",
      description: "All produced content.",
      groupHeading: "From my pen and voice",
      contentColumns: [
        {
          links: [
            { title: "Articles", href: "/en/writings/#mielipiteet", icon: "bi bi-chat-text me-2", countKey: "pub_mielipide", description: "Opinion texts and public commentary published in media." },
            { title: "Blog", href: "/en/blog/", icon: "bi bi-pen me-2", countKey: "blog", description: "Posts on education, technology, and public life themes." }
          ]
        },
        {
          links: [
            { title: "Columns", href: "/en/writings/#kolumnit", icon: "bi bi-journal-richtext me-2", countKey: "pub_kolumni", description: "Long-form columns on education, society, and local development." },
            { title: "Initiatives", href: "/en/writings/#aloitteet", icon: "bi bi-megaphone me-2", countKey: "politics", description: "Council initiatives and concrete proposals in local politics." }
          ]
        },
        {
          links: [
            { title: "Presentations", href: "/en/presentations/", icon: "bi bi-easel2 me-2", countKey: "presentations", description: "Talks and training decks on AI, learning, and pedagogy." },
            { title: "Publication List", href: "/en/publications/", icon: "bi bi-journal-text me-2", countKey: "publications", description: "Scientific publications, reports, and broader written outputs." },
            { title: "Speeches", href: "/en/writings/#puheet", icon: "bi bi-mic me-2", countKey: "pub_puhe", description: "Public speeches and council statements in one archive." }
          ]
        }
      ],
      seeAlso: {
        heading: "See also",
        subheading: "Theses supervised by me",
        links: [
          { title: "Bachelor's theses", href: "/en/theses/#card-bachelor", icon: "bi bi-book-half me-2", countData: "theses_kandit", description: "Supervised theses listed by topic and year." },
          { title: "Master's theses", href: "/en/theses/#card-master", icon: "bi bi-mortarboard me-2", countData: "theses_gradut", description: "Supervised theses listed by topic and year." }
        ]
      }
    }
  },
  megaMenuWork: {
    fi: {
      layout: "four-columns",
      sections: [
        {
          heading: "Opetus",
          links: [
            {
              title: "Työni yliopistonlehtorina",
              href: "/tyoni-yliopistonlehtorina/",
              icon: "bi bi-briefcase me-2",
              description: "Kurssit, opetusvastuut ja pedagoginen kehitystyö."
            },
            {
              title: "Ansioluettelo",
              href: "/cv/",
              icon: "bi bi-file-earmark-person me-2",
              description: "Koulutus, työhistoria, julkaisut ja keskeinen osaaminen."
            },
            {
              title: "Opetusportfolio",
              href: "/portfolio/",
              icon: "bi bi-folder2-open me-2",
              description: "Pedagoginen ajattelu, opetuskokemus ja kehitystyö."
            },
            {
              title: "Esitykset",
              href: "/esitykset/",
              icon: "bi bi-easel2 me-2",
              description: "Koulutus- ja konferenssiesityksiä eri teemoista."
            },
            {
              title: "Opinnäytetyöt",
              href: "/opinnaytteet/",
              icon: "bi bi-mortarboard me-2",
              description: "Ohjatut kandidaatti- ja pro gradu -tutkielmat."
            }
          ]
        },
        {
          heading: "Tutkimus",
          links: [
            {
              title: "Työni yliopistonlehtorina",
              href: "/tyoni-yliopistonlehtorina/",
              icon: "bi bi-briefcase me-2",
              description: "Tutkimusaiheet, opetus ja hankkeiden käytännön toteutus."
            },
            {
              title: "Ansioluettelo",
              href: "/cv/",
              icon: "bi bi-file-earmark-person me-2",
              description: "Yhteenveto akateemisesta urasta, meriiteistä ja tehtävistä."
            },
            {
              title: "Julkaisuluettelo",
              href: "/julkaisut/",
              icon: "bi bi-journal-text me-2",
              description: "Tieteelliset julkaisut, kirjoitukset ja muut tekstisisällöt."
            }
          ]
        },
        {
          heading: "Kouluttaja (yrittäjä)",
          links: [
            {
              title: "Tietoa yrityksestä",
              href: "/larux-tmi/",
              icon: "bi bi-building me-2",
              description: "Larux t:mi:n palvelut, tausta ja toimintatapa."
            },
            {
              title: "Esitykset",
              href: "/esitykset/",
              icon: "bi bi-easel2 me-2",
              description: "Näytteitä koulutus- ja keynote-esitysten sisällöistä."
            },
            {
              title: "Tilaa minut kouluttajaksi",
              href: "/yhteystiedot/",
              icon: "bi bi-megaphone me-2",
              cta: true,
              ctaLabel: "Pyydä tarjous",
              description: "Koulutukset tekoälystä, oppimisteknologiasta ja modernista pedagogiikasta."
            }
          ]
        },
        {
          heading: "Sosiaalinen media",
          links: [
            {
              title: "LinkedIN",
              href: "https://www.linkedin.com/in/jarilaru/",
              icon: "bi bi-linkedin me-2",
              external: true,
              description: "Ammatillinen profiili, verkostot ja ajankohtaiset nostot."
            },
            {
              title: "ResearchGate",
              href: "https://www.researchgate.net/profile/Jari-Laru",
              icon: "bi bi-globe me-2",
              external: true,
              description: "Tutkimusprofiili, julkaisut ja tutkimusverkostot."
            },
            {
              title: "ORCID",
              href: "https://orcid.org/0000-0003-0347-0182",
              icon: "bi bi-person-vcard me-2",
              external: true,
              description: "Pysyvä tutkijatunniste ja julkaisujen metatiedot."
            },
            {
              title: "Google Scholar",
              href: "https://scholar.google.com/citations?user=HOLu1ZIAAAAJ&hl=en",
              icon: "bi bi-mortarboard me-2",
              external: true,
              description: "Viittaukset, h-indeksi ja julkaisujen näkyvyys."
            }
          ]
        }
      ],
      cta: {
        title: "Tilaa minut kouluttajaksi",
        description: "Koulutukset tekoälystä, oppimisteknologiasta ja modernista pedagogiikasta.",
        href: "/yhteystiedot/",
        label: "Pyydä tarjous"
      }
    },
    en: {
      layout: "four-columns",
      sections: [
        {
          heading: "Teaching",
          links: [
            {
              title: "My Work as a University Lecturer",
              href: "/en/work/",
              icon: "bi bi-briefcase me-2",
              description: "Courses, teaching responsibilities, and pedagogical development."
            },
            {
              title: "Curriculum Vitae",
              href: "/en/cv/",
              icon: "bi bi-file-earmark-person me-2",
              description: "Education, work history, publications, and key competencies."
            },
            {
              title: "Teaching Portfolio",
              href: "/en/portfolio/",
              icon: "bi bi-folder2-open me-2",
              description: "Pedagogical thinking, teaching experience and development."
            },
            {
              title: "Presentations",
              href: "/en/presentations/",
              icon: "bi bi-easel2 me-2",
              description: "Training and conference presentations across core topics."
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
          heading: "Research",
          links: [
            {
              title: "My Work as a University Lecturer",
              href: "/en/work/",
              icon: "bi bi-briefcase me-2",
              description: "Research themes, teaching, and project implementation."
            },
            {
              title: "Curriculum Vitae",
              href: "/en/cv/",
              icon: "bi bi-file-earmark-person me-2",
              description: "Academic profile, key roles, and professional merits."
            },
            {
              title: "Publication List",
              href: "/en/publications/",
              icon: "bi bi-journal-text me-2",
              description: "Scientific publications, essays, and related outputs."
            }
          ]
        },
        {
          heading: "Trainer (Entrepreneur)",
          links: [
            {
              title: "About the Company",
              href: "/en/company/",
              icon: "bi bi-building me-2",
              description: "Larux services, background, and collaboration model."
            },
            {
              title: "Presentations",
              href: "/en/presentations/",
              icon: "bi bi-easel2 me-2",
              description: "Selected decks and keynote examples for different audiences."
            },
            {
              title: "Book me for training",
              href: "/en/contact/",
              icon: "bi bi-megaphone me-2",
              cta: true,
              ctaLabel: "Request a quote",
              description: "Expert talks on AI, EdTech, and modern pedagogy."
            }
          ]
        },
        {
          heading: "Social Media",
          links: [
            {
              title: "LinkedIn",
              href: "https://www.linkedin.com/in/jarilaru/",
              icon: "bi bi-linkedin me-2",
              external: true,
              description: "Professional profile, network, and current updates."
            },
            {
              title: "ResearchGate",
              href: "https://www.researchgate.net/profile/Jari-Laru",
              icon: "bi bi-globe me-2",
              external: true,
              description: "Research profile with publications and collaboration links."
            },
            {
              title: "ORCID",
              href: "https://orcid.org/0000-0003-0347-0182",
              icon: "bi bi-person-vcard me-2",
              external: true,
              description: "Persistent researcher identifier and publication metadata."
            },
            {
              title: "Google Scholar",
              href: "https://scholar.google.com/citations?user=HOLu1ZIAAAAJ&hl=en",
              icon: "bi bi-mortarboard me-2",
              external: true,
              description: "Citation metrics, h-index, and publication visibility."
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
  megaMenuContact: {
    fi: {
      heading: "Ota yhteyttä",
      description: "Lähetä viesti tai valitse suora yhteydenottotapa.",
      columns: [
        {
          type: "form",
          heading: "Lähetä viesti",
          form: {
            action: "https://formspree.io/f/xlgwqwzk",
            method: "POST",
            namePlaceholder: "Nimi",
            emailPlaceholder: "Sähköposti",
            messagePlaceholder: "Viesti",
            submitLabel: "Lähetä"
          }
        },
        {
          type: "links",
          heading: "Työyhteys",
          links: [
            { title: "Sähköposti", href: "mailto:jari.laru@oulu.fi", icon: "bi bi-envelope me-2", description: "Ensisijainen yliopistosähköposti työasioiden yhteydenottoihin." },
            { title: "Puhelin", href: "tel:+358294483810", icon: "bi bi-telephone me-2", description: "Yliopistotyöhön liittyvät yhteydenotot puhelimitse." },
            { title: "Zoom", href: "http://www.zoom.us/my/larux", icon: "bi bi-camera-video me-2", external: true, description: "Sovi etäpalaveri tai verkkotapaaminen suoraan Zoomissa." },
            { title: "Oulun yliopisto", href: "https://www.oulu.fi", icon: "bi bi-building me-2", external: true, description: "Työpaikkani ja yliopistoyhteisön viralliset sivut." }
          ]
        },
        {
          type: "links",
          heading: "Larux tmi & politiikka",
          links: [
            { title: "Yritysyhteys", href: "tel:+358405118478", icon: "bi bi-whatsapp me-2", description: "Larux t:mi:n koulutus- ja puheenvuoropyynnöt tähän numeroon." },
            { title: "Politiikan sähköposti", href: "mailto:jari.laru@ouka.fi", icon: "bi bi-bank2 me-2", description: "Politiikkaan ja luottamustehtäviin liittyvät viestit." },
            { title: "Facebook", href: "https://www.facebook.com/jari.laru.poliitikko/", icon: "bi bi-facebook me-2", external: true, description: "Poliittiset päivitykset ja keskustelu sosiaalisessa mediassa." },
            { title: "Yhteystiedot-sivu", href: "/yhteystiedot/", icon: "bi bi-person-lines-fill me-2", description: "Kaikki yhteydenottokanavat yhdellä sivulla." }
          ]
        },
        {
          type: "links",
          heading: "Pikalinkit",
          links: [
            { title: "Larux tmi", href: "/larux-tmi/", icon: "bi bi-briefcase me-2", description: "Palvelut, tausta ja yhteistyömahdollisuudet yrityksen kautta." },
            { title: "Esitykset", href: "/esitykset/", icon: "bi bi-easel2 me-2", description: "Näytteitä koulutuksista, keynoteista ja luentomateriaaleista." },
            { title: "Politiikka", href: "/politiikka/", icon: "bi bi-megaphone me-2", description: "Luottamustehtävät, tavoitteet ja vaikuttamisen painopisteet." },
            { title: "Tietosuojaseloste", href: "/tietosuojaseloste/", icon: "bi bi-shield-check me-2", description: "Tietosuojaan ja henkilötietojen käsittelyyn liittyvät periaatteet." }
          ]
        }
      ]
    },
    en: {
      heading: "Contact",
      description: "Send a message or choose a direct channel.",
      columns: [
        {
          type: "form",
          heading: "Send a message",
          form: {
            action: "https://formspree.io/f/xlgwqwzk",
            method: "POST",
            namePlaceholder: "Name",
            emailPlaceholder: "Email",
            messagePlaceholder: "Message",
            submitLabel: "Send"
          }
        },
        {
          type: "links",
          heading: "University contact",
          links: [
            { title: "Email", href: "mailto:jari.laru@oulu.fi", icon: "bi bi-envelope me-2", description: "Primary university email for teaching and research inquiries." },
            { title: "Phone", href: "tel:+358294483810", icon: "bi bi-telephone me-2", description: "University contact number for work-related calls." },
            { title: "Zoom", href: "http://www.zoom.us/my/larux", icon: "bi bi-camera-video me-2", external: true, description: "Book or join an online meeting directly via Zoom." },
            { title: "University of Oulu", href: "https://www.oulu.fi", icon: "bi bi-building me-2", external: true, description: "Official university pages and institutional information." }
          ]
        },
        {
          type: "links",
          heading: "Company & politics",
          links: [
            { title: "Business contact", href: "tel:+358405118478", icon: "bi bi-whatsapp me-2", description: "Training and keynote requests through Larux contact." },
            { title: "Politics email", href: "mailto:jari.laru@ouka.fi", icon: "bi bi-bank2 me-2", description: "Messages related to municipal and regional politics." },
            { title: "Facebook", href: "https://www.facebook.com/jari.laru.poliitikko/", icon: "bi bi-facebook me-2", external: true, description: "Political updates and public discussion channel." },
            { title: "Contact page", href: "/en/contact/", icon: "bi bi-person-lines-fill me-2", description: "All contact methods collected on one page." }
          ]
        },
        {
          type: "links",
          heading: "Quick links",
          links: [
            { title: "Company", href: "/en/company/", icon: "bi bi-briefcase me-2", description: "Services, focus areas, and collaboration options through Larux." },
            { title: "Presentations", href: "/en/presentations/", icon: "bi bi-easel2 me-2", description: "Selected slides and talk examples from events and training." },
            { title: "Politics", href: "/en/politics/", icon: "bi bi-megaphone me-2", description: "Positions of trust, priorities, and policy themes." },
            { title: "Privacy", href: "/en/privacy/", icon: "bi bi-shield-check me-2", description: "How personal data is handled on this website." }
          ]
        }
      ]
    }
  }
};

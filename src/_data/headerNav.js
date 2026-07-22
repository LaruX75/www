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
          parent: "writings",
          order: 25
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
          parent: "home",
          order: 55
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
          links: [
            {
              title: "Politiikka",
              href: "/politiikka/",
              icon: "bi bi-person-badge me-2",
              menuLink: true,
              description: "Poliittinen profiili, painopisteet ja nykyinen työ."
            },
            {
              title: "Kaupunginvaltuusto",
              href: "/politiikka/kaupunginvaltuusto/",
              icon: "bi bi-building-check me-2",
              menuLink: true,
              description: "Kokoukset, pöytäkirjat, videot ja oma valtuustotyö kokouksittain."
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
          heading: "Poliittiset teemat",
          links: [
            {
              title: "Sivistys ja oppiminen",
              href: "/kategoriat/sivistys-ja-koulutus/",
              icon: "bi bi-mortarboard-fill me-2",
              menuLink: true,
              description: "Koulutuspolitiikka, terveet oppimisympäristöt ja yliopiston sekä kouluverkon ratkaisut."
            },
            {
              title: "Koko Oulun alueellinen yhdenvertaisuus",
              href: "/kategoriat/kaupunkikehitys-ja-palveluverkko/",
              icon: "bi bi-geo-alt-fill me-2",
              menuLink: true,
              description: "Suuralueiden ja kaupunginosien palvelut, saavutettavuus ja tasapuolinen kehitys koko kaupungissa."
            },
            {
              title: "Avoin hallinto ja tiedolla johtaminen",
              href: "/poliittinen-avoimuus/",
              icon: "bi bi-bar-chart-steps me-2",
              menuLink: true,
              description: "Läpinäkyvä päätöksenteko, tietojärjestelmät, avoin data ja seurattavat valmisteluprosessit."
            }
          ]
        },
        {
          heading: "Aineistot ja avoimuus",
          links: [
            {
              title: "Sidonnaisuudet ja vaalirahoitus",
              href: "/sidonnaisuudet/",
              icon: "bi bi-link-45deg me-2",
              menuLink: true,
              description: "Sidonnaisuudet, VTV-linkit ja vaalirahoitus samassa näkymässä."
            },
            {
              title: "Valtuustopuheenvuorot",
              href: "/kynasta/#puheet",
              icon: "bi bi-mic me-2",
              menuLink: true,
              description: "Kokouksissa pidetyt puheet, pöytäkirjat ja videot.",
              countKey: "pub_puhe"
            },
            {
              title: "Valtuustoaloitteet",
              href: "/kynasta/#aloitteet",
              icon: "bi bi-megaphone me-2",
              menuLink: true,
              description: "Kirjalliset avaukset kaupunginvaltuuston päätöksentekoon.",
              countKey: "politics"
            },
            {
              title: "Virallinen valtuustosivu",
              href: "https://www.ouka.fi/valtuusto",
              icon: "bi bi-box-arrow-up-right me-2",
              external: true,
              description: "Oulun kaupunginvaltuuston virallinen sivu."
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
              countKey: "pub_puhe"
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
      description: "Omat kirjoitukset, luottamushenkilötyö, asiantuntijavaikuttaminen ja mediaesiintymiset omissa kokonaisuuksissaan.",
      groupHeading: "Kynästä",
      contentColumns: [
        {
          heading: "Kirjoitukset",
          links: [
            { title: "Blogi", href: "/blogi/", icon: "bi bi-pen me-2", countKey: "blog", description: "Ajankohtaiset kirjoitukset opetuksesta, teknologiasta ja yhteiskunnasta." },
            { title: "Kolumnit", href: "/kynasta/#kolumnit", icon: "bi bi-journal-richtext me-2", countKey: "pub_kolumni", description: "Taustoittavia ja esseemäisiä tekstejä opetuksesta, yhteiskunnasta ja ilmiöistä." },
            { title: "Mielipidekirjoitukset", href: "/kynasta/#mielipiteet", icon: "bi bi-chat-left-quote me-2", countKey: "pub_mielipide", description: "Lehdissä julkaistut mielipidekirjoitukset yhtenä kokonaisuutena." }
          ]
        },
        {
          heading: "Luottamushenkilötyö",
          links: [
            { title: "Puheenvuorot", href: "/kynasta/#puheet", icon: "bi bi-mic me-2", countKey: "pub_puhe", description: "Valtuustossa ja tapahtumissa pidettyjä puheenvuoroja." },
            { title: "Valtuustoaloitteet", href: "/kynasta/#aloitteet", icon: "bi bi-megaphone me-2", countKey: "politics", description: "Valtuustoaloitteet ja muut kirjalliset avaukset päätöksentekoon." }
          ]
        },
        {
          heading: "Asiantuntijavaikuttaminen",
          links: [
            { title: "Lausunnot", href: "/kynasta/#lausunnot", icon: "bi bi-file-earmark-text me-2", countData: "publications_statements", description: "Lausuntopalvelussa ja muissa valmisteluprosesseissa annetut asiantuntijalausunnot." },
            { title: "Teemaprofiilit", href: "/teemat/", icon: "bi bi-diagram-3 me-2", description: "Toimitetut aihepolut, joissa sama teema näkyy kirjoituksissa, esityksissä, lausunnoissa ja mediassa." },
            { title: "Esitykset ja materiaalit", href: "/esitykset/", icon: "bi bi-easel2 me-2", countKey: "presentations", description: "Puheenvuoroja, koulutussisältöjä ja avoimia oppimateriaaleja." },
            { title: "Tieteelliset julkaisut", href: "/julkaisut/", icon: "bi bi-journal-text me-2", countData: "researchfi_total", description: "Tutkimusjulkaisut, artikkelit ja tieteellinen tuotanto." },
          ]
        },
        {
          heading: "Mediassa",
          links: [
            { title: "Haastattelut", href: "/mediassa/?type=article", icon: "bi bi-newspaper me-2", description: "Lehtijutut ja verkkomedian haastattelut." },
            { title: "Podcastit", href: "/mediassa/?type=podcast", icon: "bi bi-broadcast me-2", description: "Podcastit, joissa olen haastateltavana tai keskustelijana." },
            { title: "Videot", href: "/mediassa/?type=video", icon: "bi bi-camera-video me-2", description: "Videot, uutiset ja muut tallenteet, joissa työni näkyy." }
          ]
        }
      ]
    },
    en: {
      heading: "Writings, Speeches, and Public Commentary",
      description: "Writing, elected-office work, expert contributions, and media appearances as separate paths.",
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
            { title: "Speeches", href: "/en/writings/#puheet", icon: "bi bi-mic me-2", countKey: "pub_puhe", description: "Public speeches and council statements in one archive." },
            { title: "Initiatives", href: "/en/writings/#aloitteet", icon: "bi bi-megaphone me-2", countKey: "politics", description: "Council initiatives and concrete proposals in local politics." }
          ]
        },
        {
          heading: "Expert contributions",
          links: [
            { title: "Statements", href: "/en/writings/#lausunnot", icon: "bi bi-file-earmark-text me-2", countData: "publications_statements", description: "Expert statements submitted through public consultation and preparation processes." },
            { title: "Presentations and materials", href: "/en/presentations/", icon: "bi bi-easel2 me-2", countKey: "presentations", description: "Talks, keynote materials, and open learning resources." },
            { title: "Scientific publications", href: "/en/publications/", icon: "bi bi-journal-text me-2", countData: "researchfi_total", description: "Research outputs, articles, and academic publishing." },
          ]
        },
        {
          heading: "In the media",
          links: [
            { title: "Interviews", href: "/mediassa/?type=article", icon: "bi bi-newspaper me-2", description: "Articles and web media interviews." },
            { title: "Podcasts", href: "/mediassa/?type=podcast", icon: "bi bi-broadcast me-2", description: "Podcast episodes where I am interviewed or take part in discussion." },
            { title: "Videos", href: "/mediassa/?type=video", icon: "bi bi-camera-video me-2", description: "Videos, news clips, and recordings where my work appears." }
          ]
        }
      ]
    }
  },
  megaMenuWork: {
    fi: {
      sections: [
        {
          heading: "Yliopistotyö",
          links: [
            {
              title: "Työni yliopistonlehtorina",
              href: "/tyoni-yliopistonlehtorina/",
              icon: "bi bi-briefcase me-2",
              description: "Kurssit, opetusvastuut ja pedagoginen kehitystyö."
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
            }
          ]
        },
        {
          heading: "Tutkimus",
          links: [
            {
              title: "Tutkimus",
              href: "/tutkimus/",
              icon: "bi bi-search me-2",
              description: "Tutkimushankkeet, tutkimusteemat ja laajempi kuva tutkimustyöstäni."
            },
            {
              title: "Julkaisuluettelo",
              href: "/julkaisut/",
              icon: "bi bi-journal-text me-2",
              description: "Tieteelliset julkaisut, kirjoitukset ja muut tekstisisällöt."
            },
            {
              title: "Väitöskirja",
              href: "/vaitoskirja/",
              icon: "bi bi-mortarboard-fill me-2",
              description: "Lectio-video, väitöskirja ja neljä osajulkaisua samassa kokonaisuudessa."
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
          heading: "Kouluttaja & puhuja",
          links: [
            {
              title: "Kouluttaja",
              href: "/kouluttaja/",
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
              title: "Palkinnot",
              href: "/palkinnot/",
              icon: "bi bi-award me-2",
              description: "Tunnustuksia opetuksesta, avoimuudesta ja asiantuntijatyöstä."
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
          heading: "Trainer & Speaker",
          links: [
            {
              title: "Trainer",
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
              title: "Awards",
              href: "/en/awards/",
              icon: "bi bi-award me-2",
              description: "Recognition received for teaching, openness, and expert work."
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

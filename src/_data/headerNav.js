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
              description: "Koulutus, kokemus ja osaaminen."
            },
            {
              title: "Palkinnot",
              href: "/palkinnot/",
              icon: "bi bi-award me-2"
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
              external: true
            },
            {
              title: "Hartiapankkiremontoija",
              href: "https://www.instagram.com/stories/highlights/17917732456477538/?hl=fi",
              icon: "bi bi-hammer me-2",
              external: true
            }
          ]
        },
        {
          heading: "Roolini",
          links: [
            {
              title: "Yliopistonlehtori",
              href: "/tyoni-yliopistonlehtorina/",
              icon: "bi bi-mortarboard me-2"
            },
            {
              title: "Poliitikko",
              href: "/politiikka/",
              icon: "bi bi-bank2 me-2"
            },
            {
              title: "Yrittäjä",
              href: "/larux-tmi/",
              icon: "bi bi-building me-2"
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
              description: "Education, skills and history."
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
              external: true
            },
            {
              title: "DIY Renovator",
              href: "https://www.instagram.com/stories/highlights/17917732456477538/?hl=fi",
              icon: "bi bi-hammer me-2",
              external: true
            }
          ]
        },
        {
          heading: "My Roles",
          links: [
            {
              title: "University Lecturer",
              href: "/en/work/",
              icon: "bi bi-mortarboard me-2"
            },
            {
              title: "Politician",
              href: "/en/politics/",
              icon: "bi bi-bank2 me-2"
            },
            {
              title: "Entrepreneur",
              href: "/en/company/",
              icon: "bi bi-building me-2"
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
              external: true
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
              icon: "bi bi-pencil-square me-2"
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
              title: "Kuntavaalit 2021",
              href: "/kuntavaalit-2021/",
              icon: "bi bi-chevron-right me-2"
            },
            {
              title: "Aluevaalit 2022",
              href: "/jari-laru-aluevaltuustoon/",
              icon: "bi bi-chevron-right me-2"
            },
            {
              title: "Kunnallisvaalit 2012",
              href: "/kunnallisvaalit-2012/",
              icon: "bi bi-chevron-right me-2"
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
              external: true
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
              icon: "bi bi-pencil-square me-2"
            }
          ]
        },
        {
          heading: "Election History",
          links: [
            {
              title: "Election history",
              href: "/vaalihistoria/",
              icon: "bi bi-calendar-event me-2",
              menuLink: true,
              description: "Elections and terms of office."
            },
            {
              title: "Municipal elections 2021",
              href: "/kuntavaalit-2021/",
              icon: "bi bi-chevron-right me-2"
            },
            {
              title: "Wellbeing area elections 2022",
              href: "/jari-laru-aluevaltuustoon/",
              icon: "bi bi-chevron-right me-2"
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
            { title: "Aloitteet", href: "/kynasta/#aloitteet", icon: "bi bi-megaphone me-2", countKey: "politics" },
            { title: "Blogi", href: "/blogi/", icon: "bi bi-pen me-2", countKey: "blog" }
          ]
        },
        {
          links: [
            { title: "Esitykset", href: "/esitykset/", icon: "bi bi-easel2 me-2", countKey: "presentations" },
            { title: "Julkaisuluettelo", href: "/julkaisut/", icon: "bi bi-journal-text me-2", countKey: "publications" }
          ]
        },
        {
          links: [
            { title: "Kolumnit", href: "/kynasta/#kolumnit", icon: "bi bi-journal-richtext me-2", countKey: "pub_kolumni" },
            { title: "Mielipiteet", href: "/kynasta/#mielipiteet", icon: "bi bi-chat-text me-2", countKey: "pub_mielipide" },
            { title: "Puheet", href: "/kynasta/#puheet", icon: "bi bi-mic me-2", countKey: "pub_puhe" }
          ]
        }
      ],
      seeAlso: {
        heading: "Katso myös",
        subheading: "Ohjaamiani opinnäytteitä",
        links: [
          { title: "Kandidaatintutkielmat", href: "/opinnaytteet/#card-bachelor", icon: "bi bi-book-half me-2", countData: "theses_kandit" },
          { title: "Pro gradut", href: "/opinnaytteet/#card-master", icon: "bi bi-mortarboard me-2", countData: "theses_gradut" }
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
            { title: "Articles", href: "/en/writings/#mielipiteet", icon: "bi bi-chat-text me-2", countKey: "pub_mielipide" },
            { title: "Blog", href: "/en/blog/", icon: "bi bi-pen me-2", countKey: "blog" }
          ]
        },
        {
          links: [
            { title: "Columns", href: "/en/writings/#kolumnit", icon: "bi bi-journal-richtext me-2", countKey: "pub_kolumni" },
            { title: "Initiatives", href: "/en/writings/#aloitteet", icon: "bi bi-megaphone me-2", countKey: "politics" }
          ]
        },
        {
          links: [
            { title: "Presentations", href: "/en/presentations/", icon: "bi bi-easel2 me-2", countKey: "presentations" },
            { title: "Publication List", href: "/en/publications/", icon: "bi bi-journal-text me-2", countKey: "publications" },
            { title: "Speeches", href: "/en/writings/#puheet", icon: "bi bi-mic me-2", countKey: "pub_puhe" }
          ]
        }
      ],
      seeAlso: {
        heading: "See also",
        subheading: "Theses supervised by me",
        links: [
          { title: "Bachelor's theses", href: "/en/theses/#card-bachelor", icon: "bi bi-book-half me-2", countData: "theses_kandit" },
          { title: "Master's theses", href: "/en/theses/#card-master", icon: "bi bi-mortarboard me-2", countData: "theses_gradut" }
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
              icon: "bi bi-briefcase me-2"
            },
            {
              title: "Ansioluettelo",
              href: "/cv/",
              icon: "bi bi-file-earmark-person me-2"
            },
            {
              title: "Esitykset",
              href: "/esitykset/",
              icon: "bi bi-easel2 me-2"
            },
            {
              title: "Opinnäytetyöt",
              href: "/opinnaytteet/",
              icon: "bi bi-mortarboard me-2"
            }
          ]
        },
        {
          heading: "Tutkimus",
          links: [
            {
              title: "Työni yliopistonlehtorina",
              href: "/tyoni-yliopistonlehtorina/",
              icon: "bi bi-briefcase me-2"
            },
            {
              title: "Ansioluettelo",
              href: "/cv/",
              icon: "bi bi-file-earmark-person me-2"
            },
            {
              title: "Julkaisuluettelo",
              href: "/julkaisut/",
              icon: "bi bi-journal-text me-2"
            }
          ]
        },
        {
          heading: "Kouluttaja (yrittäjä)",
          links: [
            {
              title: "Tietoa yrityksestä",
              href: "/larux-tmi/",
              icon: "bi bi-building me-2"
            },
            {
              title: "Esitykset",
              href: "/esitykset/",
              icon: "bi bi-easel2 me-2"
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
              external: true
            },
            {
              title: "ResearchGate",
              href: "https://www.researchgate.net/profile/Jari-Laru",
              icon: "bi bi-globe me-2",
              external: true
            },
            {
              title: "ORCID",
              href: "https://orcid.org/0000-0003-0347-0182",
              icon: "bi bi-person-vcard me-2",
              external: true
            },
            {
              title: "Google Scholar",
              href: "https://scholar.google.com/citations?user=HOLu1ZIAAAAJ&hl=en",
              icon: "bi bi-mortarboard me-2",
              external: true
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
              icon: "bi bi-briefcase me-2"
            },
            {
              title: "Curriculum Vitae",
              href: "/en/cv/",
              icon: "bi bi-file-earmark-person me-2"
            },
            {
              title: "Presentations",
              href: "/en/presentations/",
              icon: "bi bi-easel2 me-2"
            },
            {
              title: "Theses",
              href: "/en/theses/",
              icon: "bi bi-mortarboard me-2"
            }
          ]
        },
        {
          heading: "Research",
          links: [
            {
              title: "My Work as a University Lecturer",
              href: "/en/work/",
              icon: "bi bi-briefcase me-2"
            },
            {
              title: "Curriculum Vitae",
              href: "/en/cv/",
              icon: "bi bi-file-earmark-person me-2"
            },
            {
              title: "Publication List",
              href: "/en/publications/",
              icon: "bi bi-journal-text me-2"
            }
          ]
        },
        {
          heading: "Trainer (Entrepreneur)",
          links: [
            {
              title: "About the Company",
              href: "/en/company/",
              icon: "bi bi-building me-2"
            },
            {
              title: "Presentations",
              href: "/en/presentations/",
              icon: "bi bi-easel2 me-2"
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
              external: true
            },
            {
              title: "ResearchGate",
              href: "https://www.researchgate.net/profile/Jari-Laru",
              icon: "bi bi-globe me-2",
              external: true
            },
            {
              title: "ORCID",
              href: "https://orcid.org/0000-0003-0347-0182",
              icon: "bi bi-person-vcard me-2",
              external: true
            },
            {
              title: "Google Scholar",
              href: "https://scholar.google.com/citations?user=HOLu1ZIAAAAJ&hl=en",
              icon: "bi bi-mortarboard me-2",
              external: true
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
            { title: "Sähköposti", href: "mailto:jari.laru@oulu.fi", icon: "bi bi-envelope me-2" },
            { title: "Puhelin", href: "tel:+358294483810", icon: "bi bi-telephone me-2" },
            { title: "Zoom", href: "http://www.zoom.us/my/larux", icon: "bi bi-camera-video me-2", external: true },
            { title: "Oulun yliopisto", href: "https://www.oulu.fi", icon: "bi bi-building me-2", external: true }
          ]
        },
        {
          type: "links",
          heading: "Larux tmi & politiikka",
          links: [
            { title: "Yritysyhteys", href: "tel:+358405118478", icon: "bi bi-whatsapp me-2" },
            { title: "Politiikan sähköposti", href: "mailto:jari.laru@ouka.fi", icon: "bi bi-bank2 me-2" },
            { title: "Facebook", href: "https://www.facebook.com/jari.laru.poliitikko/", icon: "bi bi-facebook me-2", external: true },
            { title: "Yhteystiedot-sivu", href: "/yhteystiedot/", icon: "bi bi-person-lines-fill me-2" }
          ]
        },
        {
          type: "links",
          heading: "Pikalinkit",
          links: [
            { title: "Larux tmi", href: "/larux-tmi/", icon: "bi bi-briefcase me-2" },
            { title: "Esitykset", href: "/esitykset/", icon: "bi bi-easel2 me-2" },
            { title: "Politiikka", href: "/politiikka/", icon: "bi bi-megaphone me-2" },
            { title: "Tietosuojaseloste", href: "/tietosuojaseloste/", icon: "bi bi-shield-check me-2" }
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
            { title: "Email", href: "mailto:jari.laru@oulu.fi", icon: "bi bi-envelope me-2" },
            { title: "Phone", href: "tel:+358294483810", icon: "bi bi-telephone me-2" },
            { title: "Zoom", href: "http://www.zoom.us/my/larux", icon: "bi bi-camera-video me-2", external: true },
            { title: "University of Oulu", href: "https://www.oulu.fi", icon: "bi bi-building me-2", external: true }
          ]
        },
        {
          type: "links",
          heading: "Company & politics",
          links: [
            { title: "Business contact", href: "tel:+358405118478", icon: "bi bi-whatsapp me-2" },
            { title: "Politics email", href: "mailto:jari.laru@ouka.fi", icon: "bi bi-bank2 me-2" },
            { title: "Facebook", href: "https://www.facebook.com/jari.laru.poliitikko/", icon: "bi bi-facebook me-2", external: true },
            { title: "Contact page", href: "/en/contact/", icon: "bi bi-person-lines-fill me-2" }
          ]
        },
        {
          type: "links",
          heading: "Quick links",
          links: [
            { title: "Company", href: "/en/company/", icon: "bi bi-briefcase me-2" },
            { title: "Presentations", href: "/en/presentations/", icon: "bi bi-easel2 me-2" },
            { title: "Politics", href: "/en/politics/", icon: "bi bi-megaphone me-2" },
            { title: "Privacy", href: "/en/privacy/", icon: "bi bi-shield-check me-2" }
          ]
        }
      ]
    }
  }
};

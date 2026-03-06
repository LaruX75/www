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
          heading: "Yleistä & harrastukset",
          links: [
            {
              title: "Yleistä",
              href: "/tietoa/",
              icon: "bi bi-info-circle me-2",
              menuLink: true,
              description: "Henkilökuva, harrastukset ja vapaa-aika."
            },
            {
              title: "Autolomat",
              href: "/autolomat/",
              icon: "bi bi-car-front me-2"
            }
          ]
        },
        {
          heading: "Politiikka (rooli)",
          links: [
            {
              title: "Jari Laru, poliitikko",
              href: "/politiikka/",
              icon: "bi bi-person-badge me-2",
              menuLink: true,
              description: "Luottamustoimet ja vaikuttaminen Oulussa."
            },
            {
              title: "Sidonnaisuudet",
              href: "/sidonnaisuudet/",
              icon: "bi bi-link-45deg me-2",
              menuLink: true,
              description: "Ilmoitukset sidonnaisuuksista ja jäsenyyksistä."
            },
            {
              title: "Kynästä",
              href: "/kynasta/",
              icon: "bi bi-pencil-square me-2"
            }
          ]
        },
        {
          heading: "Työ & yritys",
          links: [
            {
              title: "Ansioluettelo",
              href: "/cv/",
              icon: "bi bi-file-earmark-person me-2",
              menuLink: true,
              description: "Koulutus, työkokemus ja osaaminen."
            },
            {
              title: "Portfolio",
              href: "/portfolio/",
              icon: "bi bi-folder me-2",
              menuLink: true,
              description: "Valikoidut projektit ja työnäytteet."
            },
            {
              title: "Julkaisut",
              href: "/julkaisut/",
              icon: "bi bi-journal-text me-2"
            },
            {
              title: "Larux t:mi",
              href: "/yritys/",
              icon: "bi bi-building me-2"
            }
          ]
        }
      ],
      showcase: {
        imageSrc: "/img/uploads/2020/01/jari.laru_1397908734_26-e1610053137214.jpg",
        imageAlt: "Jari Laru",
        title: "Jari Laru",
        description: "Tutkija, kouluttaja ja kunnallispoliitikko."
      }
    },
    en: {
      sections: [
        {
          heading: "General & Life",
          links: [
            {
              title: "About me",
              href: "/en/about/",
              icon: "bi bi-info-circle me-2",
              menuLink: true,
              description: "Brief biography and background."
            },
            {
              title: "Road Trips",
              href: "/en/road-trips/",
              icon: "bi bi-car-front me-2"
            }
          ]
        },
        {
          heading: "Politics (Role)",
          links: [
            {
              title: "Jari Laru, politician",
              href: "/en/politics/",
              icon: "bi bi-person-badge me-2",
              menuLink: true,
              description: "Positions of trust in Oulu."
            },
            {
              title: "Affiliations",
              href: "/en/affiliations/",
              icon: "bi bi-link-45deg me-2",
              menuLink: true,
              description: "Declarations of affiliations."
            },
            {
              title: "Writings",
              href: "/en/writings/",
              icon: "bi bi-pencil-square me-2"
            }
          ]
        },
        {
          heading: "Work & Experience",
          links: [
            {
              title: "Curriculum Vitae",
              href: "/en/cv/",
              icon: "bi bi-file-earmark-person me-2",
              menuLink: true,
              description: "Education, skills and history."
            },
            {
              title: "Portfolio",
              href: "/en/portfolio/",
              icon: "bi bi-folder me-2",
              menuLink: true,
              description: "Projects and highlights."
            },
            {
              title: "Larux t:mi",
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
        description: "Researcher, educator, and city councilor."
      }
    }
  },
  megaMenuPolitics: {
    fi: {
      intros: [
        {
          title: "Oulun kaupungin poliittiset luottamustehtävät",
          description: "Nykyiset roolit, vastuut ja päätöksenteon tehtävät."
        },
        {
          title: "Muut poliittiset luottamustehtävät",
          description: "Muut hallinnolliset ja yhteiskunnalliset tehtävät.",
          className: "mt-3"
        }
      ],
      links: [
        {
          title: "Jari Laru, poliitikko",
          href: "/politiikka/",
          icon: "bi bi-person-badge me-2"
        },
        {
          title: "Sidonnaisuudet",
          href: "/sidonnaisuudet/",
          icon: "bi bi-link-45deg me-2"
        }
      ]
    },
    en: {
      intros: [
        {
          title: "Political Positions in Oulu City",
          description: "Current roles, responsibilities, and decision-making tasks."
        },
        {
          title: "Other Political Positions",
          description: "Other administrative and societal roles.",
          className: "mt-3"
        }
      ],
      links: [
        {
          title: "Jari Laru, politician",
          href: "/en/politics/",
          icon: "bi bi-person-badge me-2"
        },
        {
          title: "Affiliations & Disclosures",
          href: "/en/affiliations/",
          icon: "bi bi-link-45deg me-2"
        }
      ]
    }
  },
  megaMenuWritings: {
    fi: {
      heading: "Kirjoitukset ja puheet",
      description: "Kaikki tuotettu sisältö yhdessä paikassa.",
      links: [
        { title: "Mielipiteet", href: "/kynasta/#mielipiteet", icon: "bi bi-chat-text me-2" },
        { title: "Kolumnit", href: "/kynasta/#kolumnit", icon: "bi bi-journal-richtext me-2" },
        { title: "Aloitteet", href: "/kynasta/#aloitteet", icon: "bi bi-megaphone me-2" },
        { title: "Puheet", href: "/kynasta/#puheet", icon: "bi bi-mic me-2" },
        { title: "Blogi", href: "/blogi/", icon: "bi bi-pen me-2" },
        { title: "Julkaisuluettelo", href: "/julkaisut/", icon: "bi bi-journal-text me-2" }
      ]
    },
    en: {
      heading: "Writings and Speeches",
      description: "All produced content.",
      links: [
        { title: "Articles & Columns", href: "/en/writings/", icon: "bi bi-chat-text me-2" },
        { title: "Blog", href: "/en/blog/", icon: "bi bi-pen me-2" },
        { title: "Publication List", href: "/en/publications/", icon: "bi bi-journal-text me-2" }
      ]
    }
  },
  megaMenuWork: {
    fi: {
      sections: [
        {
          heading: "Opetus & portfoliot",
          links: [
            {
              title: "Opetus",
              href: "/opetus/",
              icon: "bi bi-person-video3 me-2",
              description: "Kurssit, materiaalit ja pedagoginen työ."
            },
            {
              title: "Opetusportfolio",
              href: "/portfolio/",
              icon: "bi bi-folder me-2"
            }
          ]
        },
        {
          heading: "Tutkimus & julkaisut",
          links: [
            {
              title: "Työni yliopistonlehtorina",
              href: "/tyoni-yliopistonlehtorina/",
              icon: "bi bi-briefcase me-2",
              description: "Yliopistotyöni kokonaisuus."
            },
            {
              title: "Tutkimus",
              href: "/tutkimus/",
              icon: "bi bi-search me-2",
              description: "Tutkimushankkeet, aiheet ja julkaisut."
            },
            {
              title: "Julkaisuluettelo",
              href: "/julkaisut/",
              icon: "bi bi-journal-text me-2"
            },
            {
              title: "Opinnäytetyöt",
              href: "/opinnaytteet/",
              icon: "bi bi-mortarboard me-2",
              description: "Ohjatut pro gradut ja kandidaatintyöt."
            }
          ]
        },
        {
          heading: "Palkinnot & sosiaalinen media",
          links: [
            {
              title: "Palkinnot",
              href: "/palkinnot/",
              icon: "bi bi-award me-2"
            },
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
          heading: "Research & Scholarship",
          links: [
            {
              title: "Publications",
              href: "/en/publications/",
              icon: "bi bi-journal-text me-2",
              description: "Scientific articles and reports."
            },
            {
              title: "Theses Supervised",
              href: "/en/theses/",
              icon: "bi bi-mortarboard me-2",
              description: "Bachelor's and Master's theses."
            }
          ]
        },
        {
          heading: "Outreach & Materials",
          links: [
            {
              title: "Presentations",
              href: "/en/presentations/",
              icon: "bi bi-person-video3 me-2",
              description: "Slides and keynotes."
            },
            {
              title: "Teaching Portfolio",
              href: "/en/portfolio/",
              icon: "bi bi-folder me-2"
            }
          ]
        },
        {
          heading: "Academic Networks",
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
  }
};

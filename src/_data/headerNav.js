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

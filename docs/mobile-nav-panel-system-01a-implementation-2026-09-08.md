# MOBILE-NAV-PANEL-SYSTEM-01A

Baseline: `557aebde8003c6329b0a1f217a1621c7d573ec9c`. The validated audit reference is `6875308831f947d4007a1ad14193c7df24fda8d0`.

## Mixed-state production slice

This FI-only slice converts Työ, Mediassa and Ota yhteyttä to SSR panel navigation. Minä, Politiikka and Kynästä retain their existing mobile `<details>` behavior. The audit prototype could not be copied wholesale because it hid the full legacy root.

Nunjucks owns every label, URL, landing link and hierarchy from existing `headerNav.js` data. `site-ui.js` only changes panel visibility, restores focus on Back, and resets panel state when Bootstrap closes the offcanvas. No runtime navigation JSON, client-built anchors, EN changes, desktop changes, routes or taxonomy are introduced.

The initial production controller delegated panel controls only inside the panel container, while the three root triggers live at the FI offcanvas level. The production fix widens delegation to the FI offcanvas while preserving SSR-owned content and generic data-attribute interaction. Root inspection proves one trigger each for Työ, Mediassa and Ota yhteyttä.

The converted legacy details are removed after equivalent SSR panels are present, leaving only Minä, Politiikka and Kynästä in the legacy accordion stack. `npm run build:local` passed with 1,482 generated files and Research.fi integrity OK; generated cache churn was restored. The focused panel spec passes 5/5 and `mobileJumpLink` passes 5/5. Broader browser regression passes 71/74: the three failures are search-dialog Pagefind cases because `build:local` does not create `/pagefind/*`. Visual QA at 390x844, 320x700 and 1440x900 remains a required pre-commit step.

Visual QA found that the Työ panel overview-strip links were 40px tall. A scoped `.mobile-nav-panel-system .mobile-nav-overview-link` correction raises them to 44px without changing desktop or legacy disclosures. After the cache-only rebuild, the overview links measured 44px at 390x844 and 320x700 with no horizontal overflow; headings and Back remained visible. At 1440x900, the mobile panel system remained hidden and the desktop page had no horizontal overflow. The final cache-only build wrote 1,483 files and Research.fi integrity passed; build-generated cache changes were restored before review.

Stopping point: pre-commit review only. AC1 remains `CLOSED / GREEN / MAIN`.

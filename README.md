# Ujas Dubal — AWS Data Engineer Portfolio

Live Site: https://ujas-dev.github.io/

Personal portfolio of Ujas Jayeshkumar Dubal — AWS Data Engineer and Technical Lead
with 8.5+ years of experience building cloud-native data pipelines using Python, PySpark,
Redshift, Glue, Airflow and Databricks.

================================================================================
FEATURES
================================================================================

- Zero dependencies — pure HTML, CSS and vanilla JS. No npm, no build step, no framework
- GitHub Pages ready — drop index.html in root and it works instantly
- Live Tech News Feed — slide-out drawer fetching real RSS via 3-proxy strategy
  (rss2json -> allorigins -> corsproxy.io) with graceful static fallback
- Contact Form — powered by Formspree (free tier, zero backend, real email delivery)
- Email tracking — submissions route to ujasdubal+portfolio@gmail.com
  so you instantly know traffic source via the +portfolio suffix
- Dynamic favicon — UD initials on gradient, generated via canvas at runtime
- Avatar support — place assets/avatar.jpg for photo; auto-fallback to UD initials
- Full SEO — JSON-LD Person + WebSite schema, Open Graph, Twitter Card, canonical URL
- Animated hero stats — counters animate on scroll into view
- Skill bars — grouped by category, animate on scroll reveal
- Scroll reveal — sections fade-in as user scrolls
- Responsive — mobile-first, works on all screen sizes
- Accessible — semantic HTML, ARIA labels, keyboard navigation, aria-live news feed
- Particle background — lightweight canvas animation, no Three.js

================================================================================
REPOSITORY STRUCTURE
================================================================================

/
├── index.html                                   Main single-file portfolio
├── assets/
│   └── avatar.jpg                               Your photo (add this manually)
├── Ujas_Dubal_DataEngineer_8_5_Years_Exp.pdf    CV (linked in Download CV button)
├── .github/
│   └── workflows/
│       └── deploy.yml                           GitHub Actions auto-deploy
├── _config.yml                                  Jekyll / GitHub Pages config
└── README.md                                    This file

================================================================================
SETUP IN 5 MINUTES
================================================================================

STEP 1 — Fork or clone this repo
---------------------------------
  git clone https://github.com/ujas-dev/ujas-dev.github.io.git
  cd ujas-dev.github.io

STEP 2 — Add your photo
---------------------------------
  Place your photo at:  assets/avatar.jpg
  Recommended: square, minimum 400x400px, JPEG or WebP
  If missing, the site shows UD initials gracefully — nothing breaks.

STEP 3 — Set up Formspree (contact form)
---------------------------------
  1. Go to https://formspree.io/new  (free account, no credit card)
  2. Create a new form — copy your Form ID  e.g.  xpwzabcd
  3. In index.html find this line:
       <form id="contact-form" action="https://formspree.io/f/YOUR_FORMSPREE_ID"
  4. Replace YOUR_FORMSPREE_ID with your actual ID
  5. Every submission is delivered to ujasdubal+portfolio@gmail.com

  EMAIL TRACKING NOTE:
  The +portfolio suffix means every contact from this page is tagged.
  In Gmail, filter by:  to:ujasdubal+portfolio@gmail.com
  to see all portfolio enquiries in one place.

STEP 4 — Update canonical URL
---------------------------------
  In index.html <head>, update these 3 lines with your real GitHub Pages URL:

    <link rel="canonical" href="https://YOUR-USERNAME.github.io/"/>
    <meta property="og:url" content="https://YOUR-USERNAME.github.io/"/>
    <meta property="og:image" content="https://YOUR-USERNAME.github.io/assets/avatar.jpg"/>

  Also update the JSON-LD block:
    "url": "https://YOUR-USERNAME.github.io/",
    "@id": "https://YOUR-USERNAME.github.io/#person"

STEP 5 — Enable GitHub Pages
---------------------------------
  Option A (recommended — uses deploy.yml workflow):
    Go to Settings -> Pages -> Source -> GitHub Actions -> Save
    Then push to main — the workflow deploys automatically.

  Option B (legacy branch deploy):
    Go to Settings -> Pages -> Source -> Deploy from a branch
    Branch: main / master -> / (root) -> Save

================================================================================
SEO STRATEGY
================================================================================

This portfolio is built to rank on the first page for your name and related keywords.

  SIGNAL                  IMPLEMENTATION
  ----------------------  --------------------------------------------------------
  JSON-LD Person schema   Full structured data: name, jobTitle, skills, employer,
                          education, awards, sameAs LinkedIn + GitHub
  JSON-LD WebSite schema  Site name, description, author linkage
  Open Graph tags         Rich previews on LinkedIn, WhatsApp, Facebook
  Twitter Card            summary_large_image for X/Twitter shares
  Canonical URL           Prevents duplicate content penalty
  Geo meta tags           geo.region, geo.placename, ICBM for local search
  Semantic HTML           article, section, aria-label, itemprop attributes
  Page title              UJD | Ujas Jayeshkumar Dubal — AWS Data Engineer
  Meta description        160-char optimised with primary keywords
  Meta keywords           14 targeted keyword phrases including name variations
  Performance             Zero JS frameworks — sub-1s load on GitHub Pages CDN

  TARGET KEYWORDS:
    - Ujas Dubal
    - Ujas Jayeshkumar Dubal
    - AWS Data Engineer Ahmedabad
    - PySpark Engineer India
    - TCS Data Engineer
    - Python Data Engineer India
    - Cloud Data Engineer Gujarat
    - Technical Lead Data Engineering India

================================================================================
LIVE NEWS FEED — 3-PROXY WATERFALL
================================================================================

  1. rss2json.com API    -> clean JSON, best quality
         | fails?
  2. allorigins.win      -> raw XML, parsed client-side
         | fails?
  3. corsproxy.io        -> raw XML, parsed client-side
         | fails?
  4. Static fallback     -> curated articles, always works

  Categories: AI / LLMs  |  Data Engineering  |  Technology  |  World News

  Results are deduplicated by title, sorted by date descending,
  and cached per browser session. Hit the refresh button to force reload.

================================================================================
CONTACT FORM FLOW
================================================================================

  User fills form
       |
  Formspree API (POST)
       |
  Email delivered to:  ujasdubal+portfolio@gmail.com
       |
  Subject line:  "Portfolio Contact (GitHub)"
       |
  +portfolio tag confirms it came from GitHub Pages

  FALLBACK:
  If YOUR_FORMSPREE_ID is not yet replaced, the form opens a
  pre-filled mailto: link — nothing ever breaks silently.

================================================================================
CUSTOMISATION — JS DATA ARRAYS
================================================================================

All content lives in JS arrays inside the <script> block in index.html.
No external JSON files, no API calls, no build step needed.

  ARRAY             WHAT IT CONTROLS
  ----------------  --------------------------------------------------
  SKILLS_DATA       Skill rows, categories, percentages, years of exp
  EXP_DATA          Timeline cards: company, role, period, bullets, tags
  PROJECTS_DATA     Project cards: title, client, description, impact
  CERTS_DATA        Certification cards
  LEARNING_DATA     In-progress courses / continuous learning
  MISC_DATA         Hackathons and side projects
  RSS_FEEDS         RSS URLs per category for the news drawer
  FALLBACK_NEWS     Static articles shown if all live feeds fail

================================================================================
SECTIONS
================================================================================

  #hero            Name, role, stats, CTA buttons, avatar
  #about           Profile, education, awards, core expertise
  #skills          Skill bars grouped by category with years
  #experience      Career timeline: TCS, Mind Inventory, Tiny ERP, iSquare
  #projects        4 key project cards with impact metrics
  #certifications  AWS cert + Coursera certs + in-progress learning
  #misc            National hackathon + GLS University web project
  #contact         Links + Formspree contact form

================================================================================
BROWSER SUPPORT
================================================================================

  Chrome 90+    Full support
  Firefox 90+   Full support
  Safari 15+    Full support
  Edge 90+      Full support
  Mobile        Fully responsive, tested on iOS Safari and Chrome Android

================================================================================
LICENSE
================================================================================

MIT — free to use, fork, and adapt for your own portfolio.

================================================================================

Built by Ujas Jayeshkumar Dubal
AWS Data Engineer and Technical Lead
Ahmedabad, Gujarat, India
ujasdubal+portfolio@gmail.com
https://www.linkedin.com/in/ujasdubal
https://github.com/ujas-dev

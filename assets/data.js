/* ============================================================
   PORTFOLIO DATA  — edit only this file for content changes
   ============================================================ */
window.PD = {

  name:     "Ujas Dubal",
  title:    "AWS Data Engineer & Technical Lead",
  tagline:  "Turning billions of records into real-time insights on AWS.",
  location: "Ahmedabad, Gujarat, India",
  email:    "ujasdubal@gmail.com",
  linkedin: "https://www.linkedin.com/in/ujasdubal",
  github:   "https://github.com/ujas-dev",
  avatar:   "assets/avatar.jpg",

  /* ────────────────────────────────────────────────────────
     Google Form setup  (required for contact form to work)
     ────────────────────────────────────────────────────────
     1. Go to forms.google.com → create form with 3 fields:
        "Name", "Email", "Message"
     2. Click the 3-dot menu → "Get pre-filled link"
     3. Fill dummy values → click "Get Link" → copy the URL
     4. From that URL extract:
        - The form action:  .../formResponse
        - The entry IDs:    entry.XXXXXXXXXX for each field
     5. Replace the values below
     ──────────────────────────────────────────────────────── */
  formAction: "https://docs.google.com/forms/d/e/YOUR_FORM_ID_HERE/formResponse",
  formName:   "entry.1111111111",
  formEmail:  "entry.2222222222",
  formMsg:    "entry.3333333333",

  stats: [
    { v: "8.5+", l: "Years Exp"   },
    { v: "5+",   l: "Years DE"    },
    { v: "9",    l: "Team Lead"   },
    { v: "34%",  l: "Deploy ↑"   }
  ],

  skills: [
    { name: "Python",         pct: 95, col: 0x38bdf8 },
    { name: "PySpark",        pct: 92, col: 0xa78bfa },
    { name: "AWS Redshift",   pct: 90, col: 0xf59e0b },
    { name: "AWS Glue",       pct: 88, col: 0x34d399 },
    { name: "SQL",            pct: 93, col: 0x38bdf8 },
    { name: "Lambda",         pct: 85, col: 0xf472b6 },
    { name: "Databricks",     pct: 82, col: 0xe11d48 },
    { name: "Airflow",        pct: 80, col: 0xa78bfa },
    { name: "GitHub Actions", pct: 87, col: 0x38bdf8 },
    { name: "Data Modeling",  pct: 88, col: 0x34d399 }
  ],

  experience: [
    {
      company: "Tata Consultancy Services",
      role:    "Data Engineer",
      period:  "Jul 2022 – Present",
      col:     0x00ffff,
      speech:  "At TCS I automated ETL across billions of records, led a 9 member team building real time analytics, and improved deployment speed by 34 percent using GitHub Actions.",
      points:  [
        "ETL automation → manual workload ↓30%",
        "Led real-time analytics platform — 9 engineers",
        "PySpark partitioning → latency ↓20%",
        "REST APIs: Redshift → Salesforce HTML reports",
        "CI/CD GitHub Actions → deploy ↑34%",
        "CloudWatch monitoring → tickets ↓20%"
      ]
    },
    {
      company: "Mind Inventory",
      role:    "Software Engineer",
      period:  "Apr – Jun 2022",
      col:     0xa78bfa,
      speech:  "At Mind Inventory I improved PostgreSQL data retrieval by 50 percent through advanced indexing.",
      points:  [
        "PostgreSQL indexing → retrieval ↑50%",
        "Python ETL scripts for analytics"
      ]
    },
    {
      company: "Tiny ERP Pvt. Ltd.",
      role:    "Application Engineer",
      period:  "Aug 2019 – Mar 2022",
      col:     0xf59e0b,
      speech:  "At Tiny ERP I built bank payment APIs with AES 256 and RSA encryption ensuring 100 percent transaction security.",
      points:  [
        "Bank Payment APIs — AES-256 + RSA + SHA-256",
        "100% transaction security",
        "Load time ↓25% via optimization",
        "POS system — Django + PostgreSQL"
      ]
    },
    {
      company: "iSquare / eQuest Solution",
      role:    "Jr. Software Engineer",
      period:  "May 2015 – May 2017",
      col:     0x34d399,
      speech:  "My early career where I built foundational Python backend and database engineering skills.",
      points:  [ "Foundational Python, backend, database skills" ]
    }
  ],

  certifications: [
    {
      title:  "AWS Certified Developer – Associate",
      issuer: "Amazon Web Services · 2023",
      col:    0xf59e0b,
      speech: "AWS Certified Developer Associate. This certifies my cloud development expertise on AWS."
    },
    {
      title:  "Using Python to Access Web Data",
      issuer: "University of Michigan · Coursera · 2022",
      col:    0x38bdf8,
      speech: "Python for web data access, certified by University of Michigan on Coursera."
    },
    {
      title:  "Python Data Structures",
      issuer: "University of Michigan · Coursera · 2022",
      col:    0xa78bfa,
      speech: "Python Data Structures certification from University of Michigan."
    },
    {
      title:  "Programming for Everybody",
      issuer: "University of Michigan · Coursera · 2021",
      col:    0x34d399,
      speech: "Programming for Everybody with Python, my foundational Python certification."
    }
  ],

  projects: [
    {
      title:  "Real-Time Analytics Platform",
      client: "TCS",
      col:    0x00ffff,
      tags:   ["AWS Glue", "Lambda", "S3", "RDS", "PySpark"],
      desc:   "Led 9-engineer team building real-time analytics on AWS, improving decision-making by 30%.",
      speech: "This real time analytics platform processes streaming data on AWS using Glue Lambda and PySpark delivering insights 30 percent faster."
    },
    {
      title:  "Salesforce–Redshift Pipeline",
      client: "TCS",
      col:    0xa78bfa,
      tags:   ["Redshift", "AppFlow", "REST API", "Glue"],
      desc:   "Live Salesforce HTML reports from Redshift. Data accuracy improved by 35%.",
      speech: "I built REST APIs serving live Salesforce reports directly from Redshift, boosting data accuracy by 35 percent."
    },
    {
      title:  "Secure Banking Payment APIs",
      client: "Tiny ERP",
      col:    0xf59e0b,
      tags:   ["Python", "AES-256", "RSA", "SHA-256"],
      desc:   "End-to-end encrypted bank payment APIs — 100% transaction security.",
      speech: "Military grade AES 256 and RSA encrypted banking APIs ensuring 100 percent transaction data security."
    }
  ]
};

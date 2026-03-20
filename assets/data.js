/* ================================================================
   PORTFOLIO DATA — edit this file only for content changes
   ================================================================ */
window.PD = {
  name:    "Ujas Dubal",
  title:   "AWS Data Engineer & Technical Lead",
  tagline: "Turning billions of records into real-time insights on AWS.",
  email:   "ujasdubal@gmail.com",
  linkedin:"https://www.linkedin.com/in/ujasdubal",
  github:  "https://github.com/ujas-dev",
  location:"Ahmedabad, Gujarat, India",
  avatar:  "assets/avatar.jpg",

  /* ── Replace with your actual Google Form action URL ──────────
     How to get it:
     1. Create form at forms.google.com
     2. Click ⋮ → "Get pre-filled link" → fill dummy data → Get Link
     3. From that URL extract: /forms/d/e/XXXX/formResponse
     4. Also extract entry.XXXXXXXX IDs for each field
  ──────────────────────────────────────────────────────────────── */
  formAction: "https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse",
  formFields: {
    name:    "entry.1111111111",
    email:   "entry.2222222222",
    message: "entry.3333333333"
  },

  stats: [
    { v:"8.5+", l:"Years Exp"    },
    { v:"5+",   l:"Years DE"     },
    { v:"9",    l:"Team Lead"    },
    { v:"34%",  l:"Deploy ↑"    }
  ],

  zones: [
    { id:"home",   label:"Home · Launch Pad",         color:0x00ffff },
    { id:"about",  label:"About · Personal Core",     color:0x00ff88 },
    { id:"skills", label:"Skills · Tech Arsenal",     color:0xff00ff },
    { id:"exp",    label:"Experience · Career Path",  color:0xffaa00 },
    { id:"certs",  label:"Certifications · Badges",   color:0x00aaff },
    { id:"proj",   label:"Projects · Data City",      color:0xff6600 },
    { id:"contact",label:"Contact · Warp Gate",       color:0xff0088 }
  ],

  skills: [
    { name:"Python",        level:95, col:0x38bdf8 },
    { name:"PySpark",       level:92, col:0xa78bfa },
    { name:"AWS Redshift",  level:90, col:0xf59e0b },
    { name:"AWS Glue",      level:88, col:0x34d399 },
    { name:"SQL",           level:93, col:0x38bdf8 },
    { name:"Lambda",        level:85, col:0xf472b6 },
    { name:"Databricks",    level:82, col:0xe11d48 },
    { name:"Airflow",       level:80, col:0xa78bfa },
    { name:"GitHub Actions",level:87, col:0x38bdf8 },
    { name:"Data Modeling", level:88, col:0x34d399 }
  ],

  experience: [
    {
      company:"Tata Consultancy Services",
      role:"Data Engineer",
      period:"Jul 2022 – Present",
      color:0x00ffff,
      speech:"At TCS I automated ETL across billions of records, led a 9 member team, and improved deployment speed by 34 percent.",
      points:["ETL automation → workload ↓30%","Real-time analytics platform (9-member team)","PySpark tuning → latency ↓20%","REST APIs from Redshift to Salesforce","CI/CD → deploy efficiency ↑34%"]
    },
    {
      company:"Mind Inventory",
      role:"Software Engineer",
      period:"Apr – Jun 2022",
      color:0xa78bfa,
      speech:"At Mind Inventory I improved PostgreSQL performance by 50 percent.",
      points:["PostgreSQL indexing → retrieval ↑50%","Python ETL for analytics"]
    },
    {
      company:"Tiny ERP Pvt. Ltd.",
      role:"Application Engineer",
      period:"Aug 2019 – Mar 2022",
      color:0xf59e0b,
      speech:"At Tiny ERP I built military grade encrypted bank payment APIs ensuring 100 percent security.",
      points:["Bank APIs — AES-256 + RSA encryption","Processing optimization → load ↓25%","POS modules with Django + PostgreSQL"]
    },
    {
      company:"iSquare / eQuest Solution",
      role:"Jr. Software Engineer",
      period:"May 2015 – May 2017",
      color:0x34d399,
      speech:"My early career where I built core Python, backend, and database engineering skills.",
      points:["Python, backend, database foundations"]
    }
  ],

  certifications: [
    {
      title:"AWS Certified Developer – Associate",
      issuer:"Amazon Web Services · 2023",
      color:0xf59e0b,
      speech:"AWS Certified Developer Associate, my cloud development certification from Amazon Web Services."
    },
    {
      title:"Using Python to Access Web Data",
      issuer:"Univ. of Michigan · Coursera · 2022",
      color:0x38bdf8,
      speech:"Python for web data access, certified by University of Michigan on Coursera."
    },
    {
      title:"Python Data Structures",
      issuer:"Univ. of Michigan · Coursera · 2022",
      color:0xa78bfa,
      speech:"Python Data Structures certification from University of Michigan."
    },
    {
      title:"Programming for Everybody",
      issuer:"Univ. of Michigan · Coursera · 2021",
      color:0x34d399,
      speech:"Programming for Everybody with Python, my foundational certification."
    }
  ],

  projects: [
    {
      title:"Real-Time Analytics Platform",
      client:"TCS",
      color:0x00ffff,
      tags:["AWS Glue","Lambda","S3","RDS","PySpark"],
      desc:"Led 9-engineer team building real-time analytics on AWS, improving decision-making by 30%.",
      speech:"This real time analytics platform processes streaming data on AWS using Glue, Lambda, and PySpark to deliver insights 30 percent faster."
    },
    {
      title:"Salesforce–Redshift Pipeline",
      client:"TCS",
      color:0xa78bfa,
      tags:["Redshift","AppFlow","REST API","Glue"],
      desc:"Live Salesforce HTML reports from Redshift. Data accuracy improved by 35%.",
      speech:"I built REST APIs serving live Salesforce reports directly from Redshift, improving data accuracy by 35 percent."
    },
    {
      title:"Secure Banking Payment APIs",
      client:"Tiny ERP",
      color:0xf59e0b,
      tags:["Python","AES-256","RSA","SHA-256"],
      desc:"End-to-end encrypted bank payment APIs — 100% transaction security.",
      speech:"Military grade AES 256 and RSA encrypted banking APIs ensuring 100 percent transaction data security."
    }
  ],

  aidaLines: [
    "Welcome to Ujas's Data World! I'm AIDA, your AI guide. Click any object to explore!",
    "Ujas has 8.5+ years of experience building data platforms on AWS.",
    "He's a Technical Lead at TCS, leading a 9-engineer team.",
    "Drag to orbit the world · Scroll to zoom · Press 1-7 to jump zones!",
    "Click the glowing towers to read about each experience.",
    "The spinning rings represent data flowing through AWS pipelines.",
    "Try the AI News button to hear latest tech news from me!",
    "Ujas is open to Data Engineering and Technical Lead roles. Click Contact!"
  ]
};

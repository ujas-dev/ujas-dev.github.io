/* ================================================================
   data.js  — all portfolio content lives here
   ================================================================ */
window.PD = {
  name:     'Ujas Dubal',
  title:    'AWS Data Engineer & Technical Lead',
  tagline:  'Turning billions of records into real-time insights on AWS.',
  location: 'Ahmedabad, Gujarat, India',
  email:    'ujasdubal@gmail.com',
  linkedin: 'https://www.linkedin.com/in/ujasdubal',
  github:   'https://github.com/ujas-dev',

  /* Paste your Google Apps Script Web App URL here */
  appsScriptUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

  stats: [
    { v:'8.5+', l:'Years Exp'  },
    { v:'5+',   l:'Years DE'   },
    { v:'9',    l:'Team Lead'  },
    { v:'34%',  l:'Deploy ↑'  }
  ],

  skills: [
    { name:'Python',         pct:95, col:0x38bdf8, icon:'🐍' },
    { name:'PySpark',        pct:92, col:0xa78bfa, icon:'⚡' },
    { name:'AWS Redshift',   pct:90, col:0xf59e0b, icon:'🗄' },
    { name:'AWS Glue',       pct:88, col:0x34d399, icon:'🔗' },
    { name:'SQL',            pct:93, col:0x38bdf8, icon:'🔍' },
    { name:'AWS Lambda',     pct:85, col:0xf472b6, icon:'λ'  },
    { name:'Databricks',     pct:82, col:0xe11d48, icon:'◈'  },
    { name:'Apache Airflow', pct:80, col:0xa78bfa, icon:'🌊' },
    { name:'GitHub Actions', pct:87, col:0x38bdf8, icon:'⚙'  },
    { name:'Data Modeling',  pct:88, col:0x34d399, icon:'📐' }
  ],

  experience: [
    {
      company:'Tata Consultancy Services', role:'Data Engineer',
      period:'Jul 2022 – Present', location:'Ahmedabad, India',
      logo:'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg',
      fb:'🏢', col:0x00ffff,
      speech:'At TCS I automated ETL across billions of records, led a nine member team building real time analytics, and improved deployment speed by 34 percent using GitHub Actions.',
      points:['ETL automation → workload ↓30%','9-engineer team · real-time analytics platform',
              'PySpark partitioning → latency ↓20%','REST APIs: Redshift → Salesforce HTML reports',
              'GitHub Actions CI/CD → deploy ↑34%','CloudWatch alerts → tickets ↓20%']
    },
    {
      company:'Mind Inventory', role:'Software Engineer',
      period:'Apr – Jun 2022', location:'Ahmedabad, India',
      logo:'https://www.mindinventory.com/img/logo.svg', fb:'💡', col:0xa78bfa,
      speech:'At Mind Inventory I improved PostgreSQL retrieval speed by 50 percent through advanced indexing.',
      points:['PostgreSQL indexing → retrieval ↑50%','Python ETL for analytics pipelines']
    },
    {
      company:'Tiny ERP Pvt. Ltd.', role:'Application Engineer',
      period:'Aug 2019 – Mar 2022', location:'Ahmedabad, India',
      logo:'', fb:'🔐', col:0xf59e0b,
      speech:'At Tiny ERP I built bank payment APIs with AES 256 and RSA encryption ensuring 100 percent transaction security.',
      points:['Bank APIs — AES-256 + RSA + SHA-256','100% transaction security',
              'Load time ↓25%','POS system — Django + PostgreSQL']
    },
    {
      company:'iSquare / eQuest Solution', role:'Jr. Software Engineer',
      period:'May 2015 – May 2017', location:'Ahmedabad, India',
      logo:'', fb:'🚀', col:0x34d399,
      speech:'My foundational career building Python, backend, and database engineering skills.',
      points:['Python backend and database foundations']
    }
  ],

  certifications: [
    { title:'AWS Certified Developer – Associate', issuer:'Amazon Web Services', year:'2023', col:0xf59e0b,
      speech:'AWS Certified Developer Associate from Amazon Web Services, 2023.' },
    { title:'Using Python to Access Web Data', issuer:'Univ. of Michigan · Coursera', year:'2022', col:0x38bdf8,
      speech:'Python for web data access, University of Michigan on Coursera, 2022.' },
    { title:'Python Data Structures', issuer:'Univ. of Michigan · Coursera', year:'2022', col:0xa78bfa,
      speech:'Python Data Structures, University of Michigan, 2022.' },
    { title:'Programming for Everybody', issuer:'Univ. of Michigan · Coursera', year:'2021', col:0x34d399,
      speech:'Programming for Everybody with Python, University of Michigan, 2021.' }
  ],

  projects: [
    {
      title:'Real-Time Analytics Platform', client:'TCS · 2023', col:0x00ffff,
      tags:['AWS Glue','Lambda','S3','RDS','PySpark'],
      desc:'Led 9-engineer team. Real-time analytics on AWS, decision speed ↑30%.',
      speech:'Real time analytics platform on AWS using Glue, Lambda and PySpark. Improved business insights delivery by 30 percent.'
    },
    {
      title:'Salesforce–Redshift Pipeline', client:'TCS · 2024', col:0xa78bfa,
      tags:['Redshift','AppFlow','REST API','Glue'],
      desc:'Live Salesforce HTML reports from Redshift. Accuracy ↑35%.',
      speech:'REST APIs serving live Salesforce reports from Redshift, boosting data accuracy by 35 percent.'
    },
    {
      title:'Secure Banking Payment APIs', client:'Tiny ERP · 2021', col:0xf59e0b,
      tags:['Python','AES-256','RSA','SHA-256'],
      desc:'End-to-end encrypted bank payment APIs — 100% transaction security.',
      speech:'Military grade AES 256 and RSA encrypted banking APIs with 100 percent transaction security.'
    }
  ]
};

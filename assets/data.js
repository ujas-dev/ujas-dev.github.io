/* data.js — classic script, sets window.PD before world.js module */
(function(){
'use strict';

/* ── Text pre-processor for TTS — expands abbreviations so voice sounds correct ── */
window.expandForSpeech = function(text){
  if(!text) return '';
  return String(text)
    .replace(/\bM\.Sc\b/gi,'Master of Science')
    .replace(/\bB\.E\b/gi,'Bachelor of Engineering')
    .replace(/\bB\.Tech\b/gi,'Bachelor of Technology')
    .replace(/\bPh\.D\b/gi,'Doctor of Philosophy')
    .replace(/\bMBA\b/g,'Master of Business Administration')
    .replace(/\bAWS\b/g,'Amazon Web Services')
    .replace(/\bETL\b/g,'E T L')
    .replace(/\bCI\/CD\b/gi,'C I C D')
    .replace(/\bAPI\b/g,'A P I')
    .replace(/\bAPIs\b/g,'A P Is')
    .replace(/\bSQL\b/g,'S Q L')
    .replace(/\bIaC\b/g,'Infrastructure as Code')
    .replace(/\bPySpark\b/g,'Pie Spark')
    .replace(/\bTCS\b/g,'Tata Consultancy Services')
    .replace(/\bGLS\b/g,'G L S')
    .replace(/\bGTU\b/g,'G T U')
    .replace(/\bAES-256\b/g,'A E S 256 encryption')
    .replace(/\bRSA\b/g,'R S A encryption')
    .replace(/\bUjas\b/g,'Oo-jas')
    .replace(/\bDubal\b/g,'Doo-bal')
    .replace(/\bAIDA\b/g,'Ay-da')
    .replace(/↑|↓/g,' percent improved')
    .replace(/%/g,' percent')
    .replace(/\+/g,' plus')
    .replace(/8\.5/g,'eight point five')
    .replace(/\b([A-Z]{2,})\b/g, m => m.split('').join(' '));
};

window.PD = {
  name:     'Ujas Dubal',
  title:    'AWS Data Engineer & Technical Lead',
  tagline:  'Turning billions of records into real-time insights on AWS.',
  location: 'Ahmedabad, Gujarat, India',
  email:    'ujasdubal@gmail.com',
  linkedin: 'https://www.linkedin.com/in/ujasdubal',
  github:   'https://github.com/ujas-dev',
  appsScriptUrl: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

  stats: [
    { v:'8.5+', l:'Years Experience' },
    { v:'5+',   l:'Years Data Eng'   },
    { v:'9',    l:'Team Members Led' },
    { v:'34%',  l:'Deploy Speed Up'  }
  ],

  skills: [
    { name:'Python',         pct:95, col:0x38bdf8, hex:'#38bdf8', icon:'🐍' },
    { name:'PySpark',        pct:92, col:0xa78bfa, hex:'#a78bfa', icon:'⚡' },
    { name:'AWS Redshift',   pct:90, col:0xfbbf24, hex:'#fbbf24', icon:'🗄'  },
    { name:'AWS Glue',       pct:88, col:0x34d399, hex:'#34d399', icon:'🔗' },
    { name:'SQL',            pct:93, col:0x38bdf8, hex:'#38bdf8', icon:'🔍' },
    { name:'AWS Lambda',     pct:85, col:0xf472b6, hex:'#f472b6', icon:'λ'  },
    { name:'Databricks',     pct:82, col:0xef4444, hex:'#ef4444', icon:'◈'  },
    { name:'Apache Airflow', pct:80, col:0xa78bfa, hex:'#a78bfa', icon:'🌊' },
    { name:'GitHub Actions', pct:87, col:0x38bdf8, hex:'#38bdf8', icon:'⚙'  },
    { name:'Data Modelling', pct:88, col:0x34d399, hex:'#34d399', icon:'📐' }
  ],

  experience: [
    {
      company:'Tata Consultancy Services', role:'Data Engineer',
      period:'Jul 2022 – Present', location:'Ahmedabad, India',
      logo:'https://upload.wikimedia.org/wikipedia/commons/b/b1/Tata_Consultancy_Services_Logo.svg',
      fb:'🏢', col:0x00f5ff, hex:'#00f5ff',
      speech:'At Tata Consultancy Services I automated E T L across billions of records, led a nine member team building real-time analytics, and improved deployment speed by 34 percent using C I C D pipelines.',
      points:['E T L automation — manual workload reduced 30 percent','Led real-time analytics platform for 9 engineers','Pie Spark partitioning — query latency down 20 percent','REST A P Is: Redshift to live Salesforce reports','GitHub Actions C I C D — deployment efficiency up 34 percent','CloudWatch alerts — support tickets down 20 percent']
    },
    {
      company:'Mind Inventory', role:'Software Engineer',
      period:'Apr – Jun 2022', location:'Ahmedabad, India',
      logo:'https://www.mindinventory.com/img/logo.svg', fb:'💡', col:0xa78bfa, hex:'#a78bfa',
      speech:'At Mind Inventory I improved Postgres S Q L retrieval speed by 50 percent through advanced indexing and built Python E T L pipelines.',
      points:['Postgres S Q L indexing — retrieval speed up 50 percent','Python E T L pipelines for analytics']
    },
    {
      company:'Tiny ERP Pvt. Ltd.', role:'Application Engineer',
      period:'Aug 2019 – Mar 2022', location:'Ahmedabad, India',
      logo:'', fb:'🔐', col:0xfbbf24, hex:'#fbbf24',
      speech:'At Tiny E R P I built bank payment A P Is with A E S 256 and R S A encryption ensuring 100 percent transaction security and reduced page load time by 25 percent.',
      points:['Bank A P Is — A E S 256 plus R S A plus SHA 256','100 percent transaction security','Page load reduced 25 percent','P O S system — Django plus Postgres S Q L']
    },
    {
      company:'iSquare / eQuest Solution', role:'Junior Software Engineer',
      period:'May 2015 – May 2017', location:'Ahmedabad, India',
      logo:'', fb:'🚀', col:0x34d399, hex:'#34d399',
      speech:'My foundational career building Python backend and database engineering skills at iSquare and eQuest Solution.',
      points:['Python backend and database foundations','Core software development skills built here']
    }
  ],

  certifications: [
    { title:'AWS Certified Developer – Associate', issuer:'Amazon Web Services', year:'2023', col:0xfbbf24, hex:'#fbbf24',
      speech:'Amazon Web Services Certified Developer Associate certification, earned in 2023.' },
    { title:'Using Python to Access Web Data', issuer:'University of Michigan · Coursera', year:'2022', col:0x38bdf8, hex:'#38bdf8',
      speech:'Using Python to Access Web Data certification from University of Michigan on Coursera, 2022.' },
    { title:'Python Data Structures', issuer:'University of Michigan · Coursera', year:'2022', col:0xa78bfa, hex:'#a78bfa',
      speech:'Python Data Structures certification from University of Michigan on Coursera, 2022.' },
    { title:'Programming for Everybody', issuer:'University of Michigan · Coursera', year:'2021', col:0x34d399, hex:'#34d399',
      speech:'Programming for Everybody with Python, University of Michigan on Coursera, 2021.' }
  ],

  projects: [
    { title:'Real-Time Analytics Platform', client:'TCS · 2023',
      col:0x00f5ff, hex:'#00f5ff', tags:['Amazon Web Services Glue','Lambda','S3','RDS','Pie Spark'],
      desc:'Led 9-engineer team. Real-time analytics on Amazon Web Services, decision speed up 30 percent.',
      speech:'Real time analytics platform on Amazon Web Services using Glue, Lambda, and Pie Spark. Improved business insight delivery by 30 percent as team lead of 9 engineers.' },
    { title:'Salesforce–Redshift Pipeline', client:'TCS · 2024',
      col:0xa78bfa, hex:'#a78bfa', tags:['Redshift','AppFlow','REST A P I','Glue'],
      desc:'Live Salesforce HTML reports from Redshift. Accuracy up 35 percent.',
      speech:'REST A P Is serving live Salesforce reports from Redshift, boosting data accuracy by 35 percent.' },
    { title:'Secure Banking Payment APIs', client:'Tiny ERP · 2021',
      col:0xfbbf24, hex:'#fbbf24', tags:['Python','A E S 256','R S A','S H A 256'],
      desc:'End-to-end encrypted bank payment A P Is — 100 percent transaction security.',
      speech:'Military grade A E S 256 and R S A encrypted banking A P Is with 100 percent transaction security guaranteed.' }
  ]
};

console.log('[data.js] PD loaded —', Object.keys(window.PD).length,'keys');
}());

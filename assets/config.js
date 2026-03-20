// ====================================================
// UJAS DUBAL - PORTFOLIO CONFIG
// Update this file to change ALL content on the page.
// ====================================================
window.PORTFOLIO_CONFIG = {

  // --- PERSONAL ---
  name: "Ujas Dubal",
  title: "AWS Data Engineer & Technical Lead",
  tagline: "Turning billions of records into real-time insights on AWS.",
  location: "Ahmedabad, Gujarat, India",
  email: "ujasdubal@gmail.com",
  linkedin: "https://www.linkedin.com/in/ujasdubal",
  github: "https://github.com/ujas-dev",
  yearsExp: "8.5+",

  // --- PROFILE PHOTO ---
  // 1. Go to LinkedIn → right-click your profile picture → "Open image in new tab"
  // 2. Copy that URL and paste it here.
  // Or upload a photo to your repo as /assets/avatar.jpg and use: "./assets/avatar.jpg"
  avatarUrl: "./assets/avatar.jpg",

  // --- HERO STATS (shown as animated counters) ---
  stats: [
    { value: 8.5, suffix: "+", label: "Years Experience" },
    { value: 5, suffix: "+", label: "Years Data Engineering" },
    { value: 9, suffix: "", label: "Engineers Led" },
    { value: 30, suffix: "%", label: "ETL Efficiency Gain" },
  ],

  // --- CERTIFICATIONS ---
  // Add as many as you want. badgeUrl = image URL from Credly, LinkedIn, or local file.
  certifications: [
    {
      title: "AWS Certified Developer – Associate",
      issuer: "Amazon Web Services",
      year: "2023",
      badgeUrl: "https://images.credly.com/size/340x340/images/b9feab85-1a43-4f6c-99a5-631b88d5461b/image.png",
      credlyUrl: "https://www.credly.com/",
      color: "#f59e0b",
    },
    {
      title: "Using Python to Access Web Data",
      issuer: "University of Michigan (Coursera)",
      year: "2022",
      badgeUrl: "https://images.credly.com/size/340x340/images/f9ca5834-7212-4980-9fd6-5c6e79710fd0/image.png",
      credlyUrl: "https://www.coursera.org/",
      color: "#38bdf8",
    },
    {
      title: "Python Data Structures",
      issuer: "University of Michigan (Coursera)",
      year: "2022",
      badgeUrl: "https://images.credly.com/size/340x340/images/f9ca5834-7212-4980-9fd6-5c6e79710fd0/image.png",
      credlyUrl: "https://www.coursera.org/",
      color: "#a78bfa",
    },
    {
      title: "Programming for Everybody – Python",
      issuer: "University of Michigan (Coursera)",
      year: "2021",
      badgeUrl: "https://images.credly.com/size/340x340/images/f9ca5834-7212-4980-9fd6-5c6e79710fd0/image.png",
      credlyUrl: "https://www.coursera.org/",
      color: "#34d399",
    },
  ],

  // --- SKILLS ---
  skills: [
    { name: "Python", level: 95, color: "#38bdf8" },
    { name: "PySpark", level: 92, color: "#a78bfa" },
    { name: "AWS Redshift", level: 90, color: "#f59e0b" },
    { name: "AWS Glue", level: 88, color: "#34d399" },
    { name: "SQL", level: 93, color: "#38bdf8" },
    { name: "Lambda & AppFlow", level: 85, color: "#f472b6" },
    { name: "Databricks", level: 82, color: "#e11d48" },
    { name: "Airflow", level: 80, color: "#a78bfa" },
    { name: "GitHub Actions CI/CD", level: 87, color: "#38bdf8" },
    { name: "Data Modeling", level: 88, color: "#34d399" },
  ],

  // --- EXPERIENCE ---
  experience: [
    {
      company: "Tata Consultancy Services (TCS)",
      role: "Data Engineer",
      period: "Jul 2022 – Present",
      location: "Gandhinagar, India",
      highlights: [
        "Automated ETL across billions of records — cut manual workload by 30%, speed +25%",
        "Led real-time analytics platform (9-member team) — decision-making +30%",
        "Reduced data retrieval latency by 20% with PySpark partitioning",
        "REST APIs on AWS serving Salesforce HTML reports from live Redshift",
        "CI/CD with GitHub Actions — deployment efficiency +34%",
      ],
    },
    {
      company: "Mind Inventory",
      role: "Software Engineer",
      period: "Apr 2022 – Jun 2022",
      location: "Ahmedabad, India",
      highlights: [
        "PostgreSQL indexing & partitioning — data retrieval +50% faster",
        "Python ETL scripts for analytics and reporting pipelines",
      ],
    },
    {
      company: "Tiny ERP Pvt. Ltd.",
      role: "Application Engineer",
      period: "Aug 2019 – Mar 2022",
      location: "Gandhinagar, India",
      highlights: [
        "Bank Payment APIs with SHA-256 + AES-256 + RSA encryption, 100% transaction security",
        "Optimized data processing modules, load time reduced by 25%",
        "Built POS modules for retail clients with Django + PostgreSQL",
      ],
    },
    {
      company: "iSquare Technology / eQuest Solution",
      role: "Associate / Jr. Software Engineer",
      period: "May 2015 – May 2017",
      location: "Ahmedabad, India",
      highlights: [
        "Built foundational Python, backend, and database engineering skills",
      ],
    },
  ],

  // --- PROJECTS ---
  projects: [
    {
      title: "Real-Time Analytics Platform",
      client: "TCS",
      tags: ["AWS Glue", "Lambda", "S3", "RDS", "PySpark"],
      desc: "Led a 9-engineer team to design and deploy real-time analytics on AWS, improving business decision-making by 30%.",
      color: "#38bdf8",
    },
    {
      title: "Salesforce–Redshift Data Pipeline",
      client: "TCS",
      tags: ["Redshift", "AppFlow", "REST API", "Glue"],
      desc: "Built REST APIs serving live Salesforce HTML reports from Redshift. Resolved upstream inconsistencies to improve report accuracy by 35%.",
      color: "#a78bfa",
    },
    {
      title: "Secure Banking Payment APIs",
      client: "Tiny ERP",
      tags: ["Python", "AES-256", "RSA", "SHA-256"],
      desc: "Designed and implemented bank payment APIs with end-to-end encryption ensuring 100% transaction data security.",
      color: "#f59e0b",
    },
  ],
};

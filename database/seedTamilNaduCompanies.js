const db = require('./db');

const tamilNaduCompanies = [
  {
    name: "Zoho Corporation",
    description: "Global technology leader headquartered in Tamil Nadu, building comprehensive cloud business applications, productivity suites, and CRM solutions powered by over 55+ integrated products.",
    logo_url: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=128&auto=format&fit=crop&q=80",
    address: "Estancia IT Park, Plot No. 140 & 151, GST Road, Vallancherry",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    website: "https://www.zoho.com",
    contact_email: "contact@zohocorp.com",
    recruitment_email: "campus-hiring@zohocorp.com",
    is_verified: 1
  },
  {
    name: "Freshworks",
    description: "Pioneering SaaS customer engagement and IT service management platform born in Chennai, empowering over 65,000 global businesses with modern AI-driven CRM and conversational bots.",
    logo_url: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=128&auto=format&fit=crop&q=80",
    address: "SP Infocity, 40 MGR Salai, Kandancavadi, Perungudi",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    website: "https://www.freshworks.com",
    contact_email: "support@freshworks.com",
    recruitment_email: "university-recruitment@freshworks.com",
    is_verified: 1
  },
  {
    name: "GUVI Geek Networks",
    description: "Premier vernacular EdTech platform incubated at IIT Madras and IIM Ahmedabad (an HCL Group company), upskilling millions of engineering students and technical professionals in native Indian languages.",
    logo_url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&auto=format&fit=crop&q=80",
    address: "Module #9, 3rd Floor, D-Block, IIT Madras Research Park, Kanagam Road, Taramani",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    website: "https://www.guvi.in",
    contact_email: "contact@guvi.in",
    recruitment_email: "careers@guvi.in",
    is_verified: 1
  },
  {
    name: "Ramco Systems",
    description: "Fast-growing enterprise software powerhouse headquartered on Sardar Patel Road, Chennai, delivering multi-tenant cloud ERP, Global Payroll, and Aviation maintenance software across 35+ countries.",
    logo_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=128&auto=format&fit=crop&q=80",
    address: "64 Sardar Patel Road, Taramani",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    website: "https://www.ramco.com",
    contact_email: "contact@ramco.com",
    recruitment_email: "university-talent@ramco.com",
    is_verified: 1
  },
  {
    name: "Kissflow",
    description: "Pioneering low-code and no-code digital workplace platform based at World Trade Center, Chennai, empowering millions of non-technical business leaders and Fortune 500 enterprises to automate enterprise workflows effortlessly.",
    logo_url: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=128&auto=format&fit=crop&q=80",
    address: "World Trade Center, Tower B, 11th Floor, 5/142 Rajiv Gandhi Salai, Perungudi, OMR",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    website: "https://kissflow.com",
    contact_email: "hello@kissflow.com",
    recruitment_email: "culture-talent@kissflow.com",
    is_verified: 1
  },
  {
    name: "Chargebee Technologies",
    description: "Global subscription billing and revenue management unicorn established in Chennai, processing over $10B in annual payments for hyper-growth SaaS companies across North America, Europe, and Asia.",
    logo_url: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&auto=format&fit=crop&q=80",
    address: "Ascendas International Tech Park, Crest Building, CSIR Road, Taramani",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    website: "https://www.chargebee.com",
    contact_email: "contact@chargebee.com",
    recruitment_email: "talent-acquisition@chargebee.com",
    is_verified: 1
  },
  {
    name: "LatentView Analytics",
    description: "Leading pure-play data science and predictive analytics consultancy headquartered at Ramanujan IT City, Chennai, helping Fortune 500 corporations monetize data assets and forecast consumer behavior.",
    logo_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=128&auto=format&fit=crop&q=80",
    address: "Ramanujan IT City, Neville Block, 5th Floor, Rajiv Gandhi Salai, Taramani",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    website: "https://www.latentview.com",
    contact_email: "info@latentview.com",
    recruitment_email: "campus@latentview.com",
    is_verified: 1
  },
  {
    name: "Kaar Technologies",
    description: "High-growth global digital transformation and enterprise cloud consultancy headquartered in Chennai, specializing in SAP implementation, robotic process automation, and intelligent enterprise modernization.",
    logo_url: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=128&auto=format&fit=crop&q=80",
    address: "Level 8, Shyamala Towers, 136 Arcot Road, Saligramam",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    website: "https://www.kaartech.com",
    contact_email: "contact@kaartech.com",
    recruitment_email: "campus-careers@kaartech.com",
    is_verified: 1
  }
];

const tamilNaduInternships = [
  // 1. Zoho Corporation
  {
    company_name: "Zoho Corporation",
    title: "Software Development Engineer Intern (Zoho Creator & Deluge)",
    category: "Web Development",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "On-site",
    stipend: "₹25,000 / month",
    duration: "6 Months",
    eligibility: "B.E / B.Tech / MCA / M.Sc students graduating in 2025-2028 with solid programming and logical problem-solving foundations",
    required_skills: JSON.stringify(["Java", "JavaScript", "SQL", "HTML5", "CSS3", "REST APIs", "Git"]),
    description: "Develop scalable cloud modules for Zoho Creator and business productivity suites, write Deluge scripting algorithms, design high-efficiency database queries, and contribute to production-grade enterprise software.",
    deadline: "2027-01-30",
    listing_source: "Zoho University Relations Drive",
    perks: JSON.stringify(["Zoho Campus Cafeteria & Transport", "Full-time SDE Conversion (PPO)", "Direct Mentorship with Engineering Directors", "Certificate of Completion"])
  },
  {
    company_name: "Zoho Corporation",
    title: "Cloud Infrastructure & SRE Intern (Zoho Data Centers)",
    category: "Cloud & DevOps",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "Hybrid",
    stipend: "₹28,000 / month",
    duration: "6 Months",
    eligibility: "Students passionate about Linux, server clustering, network protocols, and distributed data systems",
    required_skills: JSON.stringify(["Linux", "Python", "Docker", "Git", "REST APIs", "Bash"]),
    description: "Automate server deployment pipelines, troubleshoot network latency across private data centers, monitor high-availability Linux clusters, and write Python/Bash maintenance tools.",
    deadline: "2027-02-15",
    listing_source: "Zoho Cloud Engineering Program",
    perks: JSON.stringify(["Hands-on Data Center Exposure", "Zoho Tech Academy Certifications", "Flexible Work Setup", "Pre-Placement Offer Opportunity"])
  },

  // 2. Freshworks
  {
    company_name: "Freshworks",
    title: "Full-Stack Web Engineering Intern (Freshdesk & Freshchat)",
    category: "Web Development",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "Hybrid",
    stipend: "₹35,000 / month",
    duration: "6 Months",
    eligibility: "Pre-final and final year B.Tech / M.Tech in CS/IT with demonstrable React, Node.js, and web application projects",
    required_skills: JSON.stringify(["React", "Node.js", "JavaScript", "HTML5", "CSS3", "REST APIs", "Git"]),
    description: "Build delightful customer-facing experiences for Freshdesk and Freshchat, integrate micro-frontends with React, implement resilient Express/Node API services, and conduct code reviews with senior SaaS architects.",
    deadline: "2027-01-15",
    listing_source: "Freshworks Academy Talent Pipeline",
    perks: JSON.stringify(["Freshworks Global Mentorship", "Competitive Monthly Stipend", "MacBook Pro Work Station", "Full-time PPO Fast Track"])
  },
  {
    company_name: "Freshworks",
    title: "Freddy AI & Machine Learning Intern",
    category: "Data Science & AI",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "Remote",
    stipend: "₹40,000 / month",
    duration: "4 Months",
    eligibility: "Undergraduate / Graduate students with hands-on applied ML, Python, NLP, and LLM fine-tuning experience",
    required_skills: JSON.stringify(["Python", "Machine Learning", "Artificial Intelligence", "SQL", "REST APIs", "Git"]),
    description: "Enhance the Freddy AI autonomous agent platform, benchmark contextual generative models, train support ticket classification pipelines, and deploy inference microservices.",
    deadline: "2026-12-30",
    listing_source: "Freshworks AI Research Lab",
    perks: JSON.stringify(["Freddy AI Research Credits", "Remote Work Allowance", "Conference Paper Mentorship", "Letter of Recommendation"])
  },

  // 3. GUVI Geek Networks
  {
    company_name: "GUVI Geek Networks",
    title: "EdTech Full-Stack Developer Intern (CodeKata & Web Platform)",
    category: "Web Development",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "Hybrid",
    stipend: "₹20,000 / month",
    duration: "4 Months",
    eligibility: "Students enrolled in B.E, B.Tech, or BCA/MCA with strong JavaScript, Node.js, and React foundations",
    required_skills: JSON.stringify(["JavaScript", "Node.js", "Express.js", "React", "SQL", "HTML5", "CSS3", "Git"]),
    description: "Engineer interactive coding compilers (CodeKata / WebKata), develop responsive learning modules, build real-time leaderboard webhooks, and optimize educational video streaming delivery.",
    deadline: "2026-12-31",
    listing_source: "IITM Research Park Incubation Drive",
    perks: JSON.stringify(["IITM Research Park Campus Access", "Free Lifetime Access to GUVI Courses", "PPO Potential", "Certificate signed by IITM Incubators"])
  },
  {
    company_name: "GUVI Geek Networks",
    title: "Data Science & Python Curriculum Intern",
    category: "Data Science & AI",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "Remote",
    stipend: "₹22,000 / month",
    duration: "3 Months",
    eligibility: "Students with strong knowledge of Python, Pandas, data visualization, and computational problem solving",
    required_skills: JSON.stringify(["Python", "Pandas", "SQL", "Data Analysis", "Machine Learning", "Git"]),
    description: "Design AI/ML practice datasets, test algorithm assessment questions, curate hands-on data science case studies, and assist in automating technical grading engines.",
    deadline: "2027-01-20",
    listing_source: "Vernacular Tech Student Initiative",
    perks: JSON.stringify(["Flexible Remote Hours", "Access to Tech Masterclasses", "Guaranteed Internship Completion Certificate"])
  },

  // 4. Ramco Systems
  {
    company_name: "Ramco Systems",
    title: "Enterprise ERP Software Engineering Intern (Ramco VirtualWorks)",
    category: "Software Engineering",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "On-site",
    stipend: "₹24,000 / month",
    duration: "6 Months",
    eligibility: "Final-year and pre-final year engineering students with strong Java/SQL and enterprise architectural interests",
    required_skills: JSON.stringify(["Java", "SQL", "Spring Boot", "REST APIs", "HTML5", "Git", "OOP"]),
    description: "Develop enterprise financial and HR module workflows within Ramco VirtualWorks, design complex database normalization schemes, and interface secure microservices with external banking gateways.",
    deadline: "2027-01-25",
    listing_source: "Ramco Campus Engineering Program",
    perks: JSON.stringify(["Corporate Transportation & Cafeteria", "PPO Conversion Opportunities", "Enterprise ERP Architect Certification", "Direct Mentor Mapping"])
  },
  {
    company_name: "Ramco Systems",
    title: "Aviation & Logistics Predictive Analytics Intern",
    category: "Data Science & AI",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "Hybrid",
    stipend: "₹26,000 / month",
    duration: "5 Months",
    eligibility: "Students with proficiency in Python, statistical modeling, and telemetry data analytics",
    required_skills: JSON.stringify(["Python", "SQL", "Machine Learning", "Data Analysis", "Pandas", "Git"]),
    description: "Analyze aircraft flight telemetry records and maintenance failure schedules, develop predictive models minimizing turnaround times for global airline fleets, and build automated reporting dashboards.",
    deadline: "2026-12-28",
    listing_source: "Aviation Software Center of Excellence",
    perks: JSON.stringify(["Aviation Domain Specialization Training", "Hybrid Flexibility", "Letter of Recommendation from Practice Heads"])
  },

  // 5. Kissflow
  {
    company_name: "Kissflow",
    title: "Low-Code Platform Full-Stack Intern",
    category: "Web Development",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "On-site",
    stipend: "₹30,000 / month",
    duration: "6 Months",
    eligibility: "Students passionate about modern JavaScript, React state machines, scalable microservices, and product design",
    required_skills: JSON.stringify(["JavaScript", "React", "Node.js", "Express.js", "HTML5", "CSS3", "REST APIs", "Git"]),
    description: "Build high-performance drag-and-drop form builders, optimize client-side visual rule editors, build low-latency backend execution triggers, and write unit tests for critical workflow engines.",
    deadline: "2027-02-10",
    listing_source: "World Trade Center Campus Recruitment",
    perks: JSON.stringify(["World Trade Center Office Experience", "Open Culture & Breakfast/Lunch Included", "Pre-Placement Offer (PPO) Fast-Track", "Certificate of Merit"])
  },
  {
    company_name: "Kissflow",
    title: "Product UI/UX Design & Prototyping Intern",
    category: "UI/UX Design",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "Hybrid",
    stipend: "₹25,000 / month",
    duration: "4 Months",
    eligibility: "Design-oriented students with Figma proficiency, user empathy, wireframing skills, and understanding of web design systems",
    required_skills: JSON.stringify(["Figma", "UI/UX Design", "HTML5", "CSS3", "JavaScript", "Responsive Design"]),
    description: "Conduct student and user usability interviews, craft intuitive desktop and mobile components for the Kissflow Design System, design micro-interactions, and collaborate with engineering leads.",
    deadline: "2027-01-18",
    listing_source: "Kissflow Design Studio",
    perks: JSON.stringify(["Mentorship with Lead Product Designers", "Portfolio-worthy Enterprise SaaS Project", "Hybrid Schedule", "Certificate"])
  },

  // 6. Chargebee Technologies
  {
    company_name: "Chargebee Technologies",
    title: "Fintech Platform Engineering Intern (Billing & Subscription Engine)",
    category: "Software Engineering",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "Hybrid",
    stipend: "₹35,000 / month",
    duration: "6 Months",
    eligibility: "B.Tech/B.E. in CS/IT or related engineering stream with passion for Java, microservices, and financial accuracy",
    required_skills: JSON.stringify(["Java", "Spring Boot", "SQL", "REST APIs", "Docker", "Git", "OOP"]),
    description: "Engineer resilient recurring billing state engines, write transactional database routines handling multi-currency conversions, construct automated integration test suites, and support global payment gateway connections.",
    deadline: "2027-01-20",
    listing_source: "Ascendas Tech Park Campus Drive",
    perks: JSON.stringify(["Fintech Unicorn Engineering Experience", "Top-tier Monthly Stipend", "Pre-Placement Offer (PPO) Opportunity", "Certificate of Internship"])
  },

  // 7. LatentView Analytics
  {
    company_name: "LatentView Analytics",
    title: "Applied Data Science & Machine Learning Intern",
    category: "Data Science & AI",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "Hybrid",
    stipend: "₹30,000 / month",
    duration: "5 Months",
    eligibility: "Students with strong statistics, Python data wrangling, and predictive modeling coursework",
    required_skills: JSON.stringify(["Python", "SQL", "Data Analysis", "Pandas", "Machine Learning", "Git"]),
    description: "Develop customer churn prediction models, parse structured financial telemetry datasets, build automated visualization storytelling dashboards, and participate in client solution brainstorms.",
    deadline: "2026-12-25",
    listing_source: "Ramanujan IT City Campus Connect",
    perks: JSON.stringify(["Ramanujan IT City Campus Perks", "Industry Analytics Certification", "PPO Consideration", "Letter of Recommendation"])
  },

  // 8. Kaar Technologies
  {
    company_name: "Kaar Technologies",
    title: "Enterprise Cloud Application Intern (SAP & Digital Transformation)",
    category: "Cloud & DevOps",
    location: "Chennai, Tamil Nadu, India",
    work_mode: "On-site",
    stipend: "₹22,000 / month",
    duration: "6 Months",
    eligibility: "Engineering undergraduates in CS, IT, ECE with strong database, Java, and Linux computing fundamentals",
    required_skills: JSON.stringify(["Java", "SQL", "Linux", "REST APIs", "Docker", "Git"]),
    description: "Assist certified enterprise consultants in configuring cloud application adapters, write SQL database scripts for enterprise migrations, automate environment provisioning with Docker, and learn enterprise cloud suites.",
    deadline: "2027-02-05",
    listing_source: "Saligramam Tech Hub Recruitment",
    perks: JSON.stringify(["Comprehensive Enterprise Training", "Campus Cafeteria Access", "Full-time Associate Consultant PPO", "Certificate"])
  }
];

async function seedTamilNadu() {
  console.log('[*] Seeding Tamil Nadu / Chennai tech companies and internships...');

  // 1. Insert Companies
  for (const c of tamilNaduCompanies) {
    await db.run(
      `INSERT INTO companies (name, description, logo_url, address, city, state, country, website, contact_email, recruitment_email, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET
         description = excluded.description,
         logo_url = excluded.logo_url,
         address = excluded.address,
         city = excluded.city,
         state = excluded.state,
         country = excluded.country,
         website = excluded.website,
         contact_email = excluded.contact_email,
         recruitment_email = excluded.recruitment_email,
         is_verified = 1`,
      [
        c.name,
        c.description,
        c.logo_url,
        c.address,
        c.city,
        c.state,
        c.country,
        c.website,
        c.contact_email,
        c.recruitment_email,
        1
      ]
    );
  }

  // 2. Map company names to IDs
  const companiesList = await db.all('SELECT id, name FROM companies');
  const compMap = {};
  for (const row of companiesList) {
    compMap[row.name] = row.id;
  }

  // 3. Insert Internships
  for (const item of tamilNaduInternships) {
    const compId = compMap[item.company_name] || null;

    const existing = await db.get(
      'SELECT id FROM internships WHERE title = ? AND company = ?',
      [item.title, item.company_name]
    );

    if (!existing) {
      await db.run(
        `INSERT INTO internships (
          company_id, company, title, category, location, work_mode,
          stipend, duration, eligibility, required_skills, description,
          deadline, official_url, listing_source, perks, is_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          compId,
          item.company_name,
          item.title,
          item.category,
          item.location,
          item.work_mode,
          item.stipend,
          item.duration,
          item.eligibility,
          item.required_skills,
          item.description,
          item.deadline,
          `/demo-application-portal.html`,
          item.listing_source,
          item.perks
        ]
      );
    }
  }

  // 4. Update demonstration portal URLs
  await db.run("UPDATE internships SET official_url = '/demo-application-portal.html?id=' || id WHERE official_url IS NULL OR official_url LIKE '%example.%' OR official_url = '/demo-application-portal.html'");
  await db.run("UPDATE companies SET website = 'https://' || LOWER(REPLACE(name, ' ', '')) || '.com' WHERE website IS NULL OR website LIKE '%example.%'");

  const tnCount = await db.get("SELECT COUNT(*) as count FROM companies WHERE state = 'Tamil Nadu' OR city = 'Chennai'");
  const tnInternCount = await db.get("SELECT COUNT(*) as count FROM internships WHERE location LIKE '%Chennai%' OR location LIKE '%Tamil Nadu%'");
  console.log(`[+] Tamil Nadu Companies in database: ${tnCount.count}`);
  console.log(`[+] Tamil Nadu Internships in database: ${tnInternCount.count}`);
}

if (require.main === module) {
  seedTamilNadu()
    .then(() => {
      console.log('[+] Tamil Nadu seeding completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[-] Error seeding Tamil Nadu companies:', err);
      process.exit(1);
    });
}

module.exports = {
  tamilNaduCompanies,
  tamilNaduInternships,
  seedTamilNadu
};

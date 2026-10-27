const db = require('./db');
const { sampleCompanies: baseCompanies, sampleInternships: baseInternships } = require('./seedData');
const { tamilNaduCompanies, tamilNaduInternships } = require('./seedTamilNaduCompanies');

const sampleCompanies = [...baseCompanies, ...tamilNaduCompanies];
const sampleInternships = [...baseInternships, ...tamilNaduInternships];

async function helperAddColumnIfNotExists(tableName, columnName, columnDefinition) {
  const columns = await db.all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((col) => col.name === columnName);
  if (!exists) {
    console.log(`[*] Adding missing column '${columnName}' to table '${tableName}'...`);
    await db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

async function initializeDatabase() {
  console.log('[*] Initializing SQLite tables with safe migrations...');

  // 1. Users Table
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      college_name TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Student Profiles Table
  await db.run(`
    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      phone TEXT,
      degree TEXT,
      grad_year TEXT,
      bio TEXT,
      skills TEXT DEFAULT '[]',
      github_url TEXT,
      linkedin_url TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 3. Resumes Table
  await db.run(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      extracted_text TEXT,
      detected_skills TEXT DEFAULT '[]',
      education TEXT DEFAULT '[]',
      projects TEXT DEFAULT '[]',
      experience TEXT DEFAULT '[]',
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 4. Companies Table (Feature 8)
  await db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      logo_url TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      website TEXT,
      contact_email TEXT,
      recruitment_email TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 5. Internships Table
  await db.run(`
    CREATE TABLE IF NOT EXISTS internships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      company TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      work_mode TEXT NOT NULL,
      stipend TEXT NOT NULL,
      duration TEXT NOT NULL,
      eligibility TEXT NOT NULL,
      required_skills TEXT NOT NULL,
      description TEXT NOT NULL,
      deadline TEXT,
      official_url TEXT,
      listing_source TEXT DEFAULT 'Academic Demo Listing',
      perks TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
    )
  `);

  // Safe migrations for internships table columns
  await helperAddColumnIfNotExists('internships', 'company_id', 'INTEGER');
  await helperAddColumnIfNotExists('internships', 'deadline', 'TEXT');
  await helperAddColumnIfNotExists('internships', 'official_url', 'TEXT');
  await helperAddColumnIfNotExists('internships', 'listing_source', "TEXT DEFAULT 'Academic Demo Listing'");
  await helperAddColumnIfNotExists('internships', 'is_verified', 'INTEGER DEFAULT 0');

  // 6. Saved Internships Table (Feature 7)
  await db.run(`
    CREATE TABLE IF NOT EXISTS saved_internships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      internship_id INTEGER NOT NULL,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
      UNIQUE(user_id, internship_id)
    )
  `);

  // 7. Applications Tracking Table (Feature 5 & 6)
  await db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      internship_id INTEGER NOT NULL,
      company_id INTEGER,
      status TEXT DEFAULT 'Interested',
      click_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT DEFAULT '',
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
      FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
      UNIQUE(user_id, internship_id)
    )
  `);

  // Safe migrations for applications table columns (SQLite requires constant default or null in ALTER TABLE)
  await helperAddColumnIfNotExists('applications', 'company_id', 'INTEGER');
  await helperAddColumnIfNotExists('applications', 'click_timestamp', 'DATETIME');
  await helperAddColumnIfNotExists('applications', 'notes', "TEXT DEFAULT ''");
  await helperAddColumnIfNotExists('applications', 'created_at', 'DATETIME');
  await helperAddColumnIfNotExists('applications', 'updated_at', 'DATETIME');

  // 8. Recommendations Table
  await db.run(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      internship_id INTEGER NOT NULL,
      match_score REAL NOT NULL,
      matching_skills TEXT DEFAULT '[]',
      missing_skills TEXT DEFAULT '[]',
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (internship_id) REFERENCES internships(id) ON DELETE CASCADE,
      UNIQUE(user_id, internship_id)
    )
  `);

  // Indexes for high performance
  await db.run('CREATE INDEX IF NOT EXISTS idx_internships_cat ON internships(category)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_internships_mode ON internships(work_mode)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_apps_user ON applications(user_id)');
  await db.run('CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_internships(user_id)');

  // Seed Companies
  console.log('[*] Checking companies table...');
  for (const c of sampleCompanies) {
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
         recruitment_email = excluded.recruitment_email`,
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
        c.is_verified || 0
      ]
    );
  }

  // Map company name to id
  const companiesList = await db.all('SELECT id, name FROM companies');
  const companyMap = {};
  for (const comp of companiesList) {
    companyMap[comp.name] = comp.id;
  }

  // Seed / Update Internships with Company references
  console.log('[*] Populating comprehensive internship listings...');
  for (const item of sampleInternships) {
    const compId = companyMap[item.company_name] || null;

    // Check if internship with this title and company already exists
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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          item.deadline || '2026-12-31',
          item.official_url || 'https://example.com/apply',
          item.listing_source || 'Academic Demo Listing',
          item.perks,
          0
        ]
      );
    } else {
      // Update company_id, deadline, official_url, perks if null
      await db.run(
        `UPDATE internships SET
          company_id = COALESCE(company_id, ?),
          deadline = COALESCE(deadline, ?),
          official_url = COALESCE(official_url, ?),
          listing_source = COALESCE(listing_source, ?)
         WHERE id = ?`,
        [compId, item.deadline || '2026-12-31', item.official_url || 'https://example.com/apply', item.listing_source || 'Academic Demo Listing', existing.id]
      );
    }
  }

  // Ensure all demonstration URLs point to local portals to prevent browser SSL/DNS errors
  await db.run("UPDATE internships SET official_url = '/demo-application-portal.html?id=' || id WHERE official_url IS NULL OR official_url LIKE '%example.%'");
  await db.run("UPDATE companies SET website = '/demo-company.html?id=' || id WHERE website IS NULL OR website LIKE '%example.%'");

  const finalCount = await db.get('SELECT COUNT(*) as count FROM internships');
  const finalCompCount = await db.get('SELECT COUNT(*) as count FROM companies');
  console.log(`[+] Database populated with ${finalCompCount.count} companies and ${finalCount.count} internships.`);
  console.log('[+] Database tables initialized and migrated successfully.');
}

if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('[+] Migration completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[-] Database initialization failed:', err);
      process.exit(1);
    });
}

module.exports = initializeDatabase;

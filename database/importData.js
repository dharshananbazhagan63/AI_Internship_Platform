const fs = require('fs');
const path = require('path');
const db = require('./db');

function parseCSVLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

async function importFromCSV(filePath) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`[-] CSV file not found at: ${resolvedPath}`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
  const lines = fileContent.split('\n').map((l) => l.trim()).filter(Boolean);

  if (lines.length < 2) {
    console.log('[!] CSV has no data rows.');
    return;
  }

  const headers = parseCSVLine(lines[0]);
  console.log('[*] Importing internships from CSV:', headers.join(', '));

  let importedCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;

    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });

    const companyName = row['company_name'] || 'Demo Tech Corp';
    const title = row['title'] || 'Software Intern';
    const category = row['category'] || 'General';
    const location = row['location'] || 'Remote';
    const workMode = row['work_mode'] || 'Remote';
    const stipend = row['stipend'] || 'Competitive';
    const duration = row['duration'] || '3 Months';
    const eligibility = row['eligibility'] || 'College Students';
    const rawSkills = row['required_skills'] || '';
    const skillsArray = rawSkills.includes(';') ? rawSkills.split(';').map(s => s.trim()) : rawSkills.split(',').map(s => s.trim());
    const description = row['description'] || 'Demonstration internship opportunity.';
    const deadline = row['deadline'] || 'Ongoing';
    const officialUrl = row['official_url'] || 'https://example.com/apply';
    const source = row['listing_source'] || 'CSV Import';

    // 1. Ensure company exists
    await db.run(
      `INSERT INTO companies (name, description, address, city, state, country, website, contact_email, recruitment_email, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
       ON CONFLICT(name) DO NOTHING`,
      [companyName, `${companyName} technology solutions.`, location, 'San Francisco', 'CA', 'USA', 'https://example.com', 'contact@example.com', 'careers@example.com']
    );

    const comp = await db.get('SELECT id FROM companies WHERE name = ?', [companyName]);

    // 2. Insert internship
    await db.run(
      `INSERT INTO internships (company_id, company, title, category, location, work_mode, stipend, duration, eligibility, required_skills, description, deadline, official_url, listing_source, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        comp ? comp.id : null,
        companyName,
        title,
        category,
        location,
        workMode,
        stipend,
        duration,
        eligibility,
        JSON.stringify(skillsArray),
        description,
        deadline,
        officialUrl,
        source
      ]
    );

    importedCount++;
  }

  console.log(`[+] Successfully imported ${importedCount} internship records from CSV into SQLite.`);
}

if (require.main === module) {
  const targetFile = process.argv[2] || path.join(__dirname, 'sample_internships.csv');
  importFromCSV(targetFile)
    .then(() => process.exit(0))
    .catch((e) => {
      console.error('[-] Import failed:', e);
      process.exit(1);
    });
}

module.exports = importFromCSV;

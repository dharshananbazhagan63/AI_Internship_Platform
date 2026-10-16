const db = require('./db');

async function updateUrls() {
  console.log('[*] Updating internship and company URLs to local demonstration portals...');
  
  // Update internships
  const res1 = await db.run("UPDATE internships SET official_url = '/demo-application-portal.html?id=' || id");
  console.log('[+] Updated internships official_url to local portals.');

  // Update companies
  const res2 = await db.run("UPDATE companies SET website = '/demo-company.html?id=' || id");
  console.log('[+] Updated companies website to local corporate portals.');

  const sampleI = await db.get("SELECT id, title, official_url FROM internships LIMIT 1");
  const sampleC = await db.get("SELECT id, name, website FROM companies LIMIT 1");

  console.log('[*] Sample Internship:', sampleI);
  console.log('[*] Sample Company:', sampleC);
}

if (require.main === module) {
  updateUrls()
    .then(() => {
      console.log('[+] URL update completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[-] Error updating URLs:', err);
      process.exit(1);
    });
}

module.exports = updateUrls;

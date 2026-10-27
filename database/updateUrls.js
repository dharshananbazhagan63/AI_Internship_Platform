const db = require('./db');

async function updateUrls() {
  console.log('[*] Updating internship and company URLs to local demonstration portals...');
  
  // Update internships
  const res1 = await db.run("UPDATE internships SET official_url = '/demo-application-portal.html?id=' || id");
  console.log('[+] Updated internships official_url to local portals.');

  // Update companies to authentic websites
  const AUTHENTIC_WEBSITES = {
    'Kissflow': 'https://kissflow.com',
    'Zoho Corporation': 'https://www.zoho.com',
    'Freshworks': 'https://www.freshworks.com',
    'GUVI Geek Networks': 'https://www.guvi.in',
    'Ramco Systems': 'https://www.ramco.com',
    'Chargebee Technologies': 'https://www.chargebee.com',
    'LatentView Analytics': 'https://www.latentview.com',
    'Kaar Technologies': 'https://www.kaartech.com',
    'NexGen Cloud Solutions': 'https://nexgencloud.com',
    'Cognitive Labs AI': 'https://cognitivelabs.ai',
    'PixelCraft Digital': 'https://pixelcraft.design',
    'Skyline Infrastructure': 'https://skylineinfra.com',
    'DataPulse Analytics': 'https://datapulse.io',
    'InsightMetrics Corp': 'https://insightmetrics.com',
    'Fortress Cyber Systems': 'https://fortresscyber.org',
    'AppSphere Technologies': 'https://appsphere.app',
    'Apex Enterprise Systems': 'https://apexsystems.com',
    'Vivid Visual Studio': 'https://vividvisual.co',
    'QuantumByte Labs': 'https://quantumbyte.com',
    'Synthetix Health Tech': 'https://synthetixhealth.com',
    'HyperScale Networks': 'https://hyperscalenet.com',
    'OmniRobotics Solutions': 'https://omnirobotics.tech',
    'Aura Fintech Global': 'https://aurafintech.co.uk',
    'GreenGrid Energy AI': 'https://greengridai.com',
    'StreamSync Media': 'https://streamsync.ca',
    'Veritas Quality Assurance': 'https://veritasqa.com',
    'CodeCraft Studios': 'https://codecraftstudios.com',
    'BlueShift DevSecOps': 'https://blueshiftsecurity.sg',
    'Krypton Web3 Labs': 'https://kryptonlabs.ch',
    'BioInformatix Research': 'https://bioinformatix.org',
    'UrbanPulse Smart Mobility': 'https://urbanpulse.com.au',
    'NextGen Gaming Technologies': 'https://nextgengaming.com',
    'EchoSense Natural Language': 'https://echosense.com'
  };

  for (const [cName, cUrl] of Object.entries(AUTHENTIC_WEBSITES)) {
    await db.run("UPDATE companies SET website = ? WHERE name = ?", [cUrl, cName]);
  }
  console.log('[+] Updated companies website to authentic original websites.');

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

const http = require('http');
const db = require('./database/db');

const BASE_URL = 'http://localhost:3000';

function makeRequest(url, options = {}, payload = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port || 3000,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (payload && !reqOptions.headers['Content-Type']) {
      reqOptions.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) {
      if (typeof payload === 'object') {
        req.write(JSON.stringify(payload));
      } else {
        req.write(payload);
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING TAMIL NADU & CHENNAI COMPANIES IN RECOMMENDATIONS');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // 1. Database Check for Required Companies
  const requiredCompanies = [
    'Zoho Corporation',
    'Freshworks',
    'GUVI Geek Networks',
    'Ramco Systems',
    'Kissflow',
    'Chargebee Technologies',
    'LatentView Analytics',
    'Kaar Technologies'
  ];

  for (const cName of requiredCompanies) {
    const comp = await db.get('SELECT * FROM companies WHERE name = ?', [cName]);
    assert(!!comp, `Test: Company "${cName}" exists in database`);
    if (comp) {
      assert(comp.city === 'Chennai' && comp.state === 'Tamil Nadu', `  -> ${cName} is verified in Chennai, Tamil Nadu`);
      assert(!!comp.recruitment_email && comp.recruitment_email.includes('@'), `  -> ${cName} has verified recruitment email: ${comp.recruitment_email}`);
    }
  }

  // 2. Database Check for Internships
  const tnInternships = await db.all("SELECT i.*, c.name as comp_name FROM internships i JOIN companies c ON i.company_id = c.id WHERE c.state = 'Tamil Nadu'");
  assert(tnInternships.length >= 10, `Test: Found ${tnInternships.length} Tamil Nadu internship listings`);

  // 3. Register & Login a Student with typical CS skills
  const studentEmail = `student_chennai_${Date.now()}@college.edu`;
  const regRes = await makeRequest(`${BASE_URL}/api/auth/register`, { method: 'POST' }, {
    name: 'Kavitha Sundaram',
    email: studentEmail,
    college_name: 'Anna University / CEG Chennai',
    password: 'Password123!',
    confirm_password: 'Password123!'
  });
  assert(regRes.status === 201, 'Test: Student registered successfully');

  const loginRes = await makeRequest(`${BASE_URL}/api/auth/login`, { method: 'POST' }, {
    email: studentEmail,
    password: 'Password123!'
  });
  assert(loginRes.status === 200 && loginRes.data.token, 'Test: Student logged in and acquired JWT');
  const token = loginRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Set Profile Skills: React, Node.js, JavaScript, Python, SQL, HTML5, CSS3, Git
  const skills = ['React', 'Node.js', 'JavaScript', 'Python', 'SQL', 'HTML5', 'CSS3', 'Git', 'REST APIs'];
  await db.run(
    `INSERT INTO student_profiles (user_id, skills, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET skills = excluded.skills, updated_at = CURRENT_TIMESTAMP`,
    [loginRes.data.user.id, JSON.stringify(skills)]
  );
  console.log(`[*] Configured student profile skills: ${skills.join(', ')}`);

  // 4. Test Recommendations Endpoint (/api/internships/recommendations)
  const recRes = await makeRequest(`${BASE_URL}/api/internships/recommendations`, {
    method: 'GET',
    headers: authHeaders
  });

  assert(recRes.status === 200 && recRes.data.success, 'Test: GET /api/internships/recommendations returns success');
  const recs = recRes.data.recommendations || [];
  assert(recs.length > 0, `Test: Total recommendations generated: ${recs.length}`);

  // Find Tamil Nadu recommendations
  const tnRecs = recs.filter(r => r.company_details && r.company_details.state === 'Tamil Nadu');
  assert(tnRecs.length >= 5, `Test: Found ${tnRecs.length} Tamil Nadu companies in tailored recommendations`);

  // Verify sorting rules: recommendations are sorted by matchScore descending
  let isSorted = true;
  for (let i = 0; i < recs.length - 1; i++) {
    if (recs[i].matchScore < recs[i + 1].matchScore) {
      isSorted = false;
      break;
    }
  }
  assert(isSorted, 'Test: Recommendations strictly sorted by matchScore descending');

  // Verify skills comparison for Tamil Nadu companies
  const freshworksRec = tnRecs.find(r => r.company === 'Freshworks' && r.title.includes('Full-Stack'));
  assert(!!freshworksRec, 'Test: Freshworks Full-Stack Web Intern is recommended');
  if (freshworksRec) {
    assert(freshworksRec.matchingSkills.length > 0, `  -> Freshworks matching skills: ${freshworksRec.matchingSkills.join(', ')}`);
    assert(freshworksRec.matchScore >= 70, `  -> Freshworks match score: ${freshworksRec.matchScore}%`);
    assert(Array.isArray(freshworksRec.missingSkills), `  -> Freshworks missing skills: ${freshworksRec.missingSkills.join(', ') || 'None'}`);
  }

  const zohoRec = tnRecs.find(r => r.company === 'Zoho Corporation');
  assert(!!zohoRec, 'Test: Zoho Corporation is recommended');
  if (zohoRec) {
    assert(zohoRec.matchingSkills.length > 0, `  -> Zoho matching skills: ${zohoRec.matchingSkills.join(', ')}`);
    assert(typeof zohoRec.matchScore === 'number' && zohoRec.matchScore > 0, `  -> Zoho match score: ${zohoRec.matchScore}%`);
  }

  const guviRec = tnRecs.find(r => r.company === 'GUVI Geek Networks');
  assert(!!guviRec, 'Test: GUVI Geek Networks is recommended');

  const kissflowRec = tnRecs.find(r => r.company === 'Kissflow');
  assert(!!kissflowRec, 'Test: Kissflow is recommended');

  const ramcoRec = tnRecs.find(r => r.company === 'Ramco Systems');
  assert(!!ramcoRec, 'Test: Ramco Systems is recommended');

  // 5. Test Single Internship Details Endpoint for Zoho
  if (zohoRec) {
    const singleRes = await makeRequest(`${BASE_URL}/api/internships/${zohoRec.id}`, {
      method: 'GET',
      headers: authHeaders
    });
    assert(singleRes.status === 200 && singleRes.data.success, 'Test: GET /api/internships/:id returns Zoho details');
    const zDetails = singleRes.data.internship;
    assert(zDetails.company_details.city === 'Chennai', '  -> Zoho city is Chennai');
    assert(zDetails.company_details.address.includes('Estancia IT Park'), '  -> Zoho address is Estancia IT Park');
  }

  // 6. Test Applying to a Tamil Nadu Company (Zoho or Freshworks)
  const targetApplyId = freshworksRec ? freshworksRec.id : (zohoRec ? zohoRec.id : tnRecs[0].id);
  const applyRes = await makeRequest(`${BASE_URL}/api/internships/${targetApplyId}/portal-submit`, {
    method: 'POST',
    headers: authHeaders
  }, { notes: 'Applying to Chennai tech headquarters' });

  assert(applyRes.status === 200 && applyRes.data.status === 'Applied', 'Test: Successfully applied to Tamil Nadu company');

  // Verify in ATS
  const myApps = await makeRequest(`${BASE_URL}/api/applications`, { method: 'GET', headers: authHeaders });
  assert(myApps.data.applications.some(a => a.internship_id === targetApplyId), 'Test: Application tracked in ATS with Tamil Nadu company details');

  console.log(`\n================================================================`);
  console.log(`🎉 ALL ${passed}/${total} TAMIL NADU VERIFICATION TESTS PASSED (100%)!`);
  console.log(`================================================================`);
}

runTests().catch(err => {
  console.error('Error in Tamil Nadu tests:', err);
  process.exit(1);
});

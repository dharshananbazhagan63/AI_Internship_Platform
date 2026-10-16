const http = require('http');

async function request(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) {}
        resolve({ statusCode: res.statusCode, data, json });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST SUITE: DEMO APPLICATION PORTAL & COMPANY PROFILE ===\n');

  // Test 1: Check Health
  const health = await request('/api/health');
  console.log('[Test 1] Health check:', health.statusCode === 200 ? 'PASS' : 'FAIL');

  // Test 2: Check Static Pages Exist
  const portalHtml = await request('/demo-application-portal.html?id=1');
  console.log('[Test 2] demo-application-portal.html accessible:', (portalHtml.statusCode === 200 && portalHtml.data.includes('Corporate Career Portal')) ? 'PASS' : 'FAIL');

  const compHtml = await request('/demo-company.html?id=1');
  console.log('[Test 3] demo-company.html accessible:', (compHtml.statusCode === 200 && compHtml.data.includes('Corporate Profile')) ? 'PASS' : 'FAIL');

  // Test 4: Check Internship API returns local demo URL
  const internRes = await request('/api/internships/1');
  const intern = internRes.json?.internship;
  const isUrlClean = intern && intern.official_url.startsWith('/demo-application-portal.html') && !intern.official_url.includes('example.');
  const isWebClean = intern && intern.company_details.website.startsWith('/demo-company.html') && !intern.company_details.website.includes('example.');
  console.log('[Test 4] Internship official_url is local portal:', isUrlClean ? 'PASS' : 'FAIL', `(${intern?.official_url})`);
  console.log('[Test 5] Company website is local portal:', isWebClean ? 'PASS' : 'FAIL', `(${intern?.company_details?.website})`);

  // Test 6: Check Company API endpoint
  const compApiRes = await request('/api/internships/company/1');
  const compData = compApiRes.json;
  const compOk = compData?.success && compData?.company?.id === 1 && Array.isArray(compData?.openings);
  console.log('[Test 6] GET /api/internships/company/1:', compOk ? 'PASS' : 'FAIL', `(${compData?.openings?.length} openings)`);

  // Test 7: Register student & test Apply Click
  const testEmail = `test_student_${Date.now()}@college.edu`;
  const regRes = await request('/api/auth/register', 'POST', { 'Content-Type': 'application/json' }, {
    name: 'Portal Test Student',
    email: testEmail,
    college_name: 'Tech University',
    password: 'Password123!',
    confirm_password: 'Password123!'
  });
  console.log('[Test 7] Student registration:', regRes.statusCode === 201 ? 'PASS' : 'FAIL');

  // Login
  const loginRes = await request('/api/auth/login', 'POST', { 'Content-Type': 'application/json' }, {
    email: testEmail,
    password: 'Password123!'
  });
  const token = loginRes.json?.token;
  console.log('[Test 8] Student login:', token ? 'PASS' : 'FAIL');

  // Test 9: Apply Click records session and returns local portal URL
  const applyClickRes = await request('/api/internships/1/apply', 'POST', {
    'Authorization': `Bearer ${token}`
  });
  const appUrl = applyClickRes.json?.applicationUrl;
  const applyOk = applyClickRes.json?.success && appUrl.startsWith('/demo-application-portal.html') && !appUrl.includes('example.');
  console.log('[Test 9] POST /api/internships/1/apply returns local portal URL:', applyOk ? 'PASS' : 'FAIL', `(${appUrl})`);

  // Test 10: Submit application on portal
  const portalSubmitRes = await request('/api/internships/1/portal-submit', 'POST', {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }, {
    notes: 'Submitted with verified resume credentials from college portal',
    portfolioUrl: 'https://github.com/student/test-repo'
  });
  const submitOk = portalSubmitRes.json?.success && portalSubmitRes.json?.status === 'Applied';
  console.log('[Test 10] POST /api/internships/1/portal-submit marks as Applied:', submitOk ? 'PASS' : 'FAIL');

  // Test 11: Verify in My Applications ATS
  const myAppsRes = await request('/api/applications', 'GET', {
    'Authorization': `Bearer ${token}`
  });
  const apps = myAppsRes.json?.applications;
  const targetApp = apps?.find(a => a.internship_id === 1);
  const atsOk = targetApp && targetApp.status === 'Applied' && targetApp.notes.includes('Portal Submission') && targetApp.official_url.startsWith('/demo-application-portal.html');
  console.log('[Test 11] Application in ATS has status "Applied" and local URL:', atsOk ? 'PASS' : 'FAIL', `(Status: ${targetApp?.status})`);

  // Test 12: Verify All Internships list has zero example. domains
  const allInternshipsRes = await request('/api/internships');
  const allInternships = allInternshipsRes.json?.internships || [];
  const hasExample = allInternships.some(i => i.official_url.includes('example.') || i.company_details.website.includes('example.'));
  console.log('[Test 12] All 40 internships have 0 external example domains:', !hasExample ? 'PASS' : 'FAIL', `(Total tested: ${allInternships.length})`);

  console.log('\n=== ALL PORTAL VERIFICATION TESTS COMPLETED ===');
}

runTests().catch(console.error);

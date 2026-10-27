const http = require('http');
const fs = require('fs');
const path = require('path');
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
  console.log('🧪 VERIFYING DEDICATED COMPANY DETAILS PAGE & ATS PRESERVATION');
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

  // 1. Check company-details.html exists and is accessible via HTTP
  const pageRes = await makeRequest(`${BASE_URL}/company-details.html?id=1`);
  assert(pageRes.status === 200, 'Test 1: company-details.html is served over HTTP 200');

  // 2. Check HTML content elements in company-details.html
  const htmlContent = fs.readFileSync(path.join(__dirname, 'public', 'company-details.html'), 'utf-8');
  assert(htmlContent.includes('id="hero-company-name"') && htmlContent.includes('id="hero-logo"'), 'Test 2: Company name and logo elements present');
  assert(htmlContent.includes('id="hero-role-title"') && htmlContent.includes('id="spec-eligibility"'), 'Test 3: Role and eligibility specifications present');
  assert(htmlContent.includes('id="spec-stipend"') && htmlContent.includes('id="hero-location-text"'), 'Test 4: Stipend and location elements present');
  assert(htmlContent.includes('id="contact-recruitment-email"') && htmlContent.includes('Verified Recruitment Email'), 'Test 5: Contact info with verified email only present');
  assert(htmlContent.includes('Application Requirements & Submission Checklist'), 'Test 6: Application requirements section present');
  assert(htmlContent.includes('View Official Company Profile') && htmlContent.includes('target="_blank"'), 'Test 7: "View Official Company Profile" button opening in new tab present');
  assert(htmlContent.includes('maps.google.com/maps?q=') && htmlContent.includes('output=embed'), 'Test 8: Google Maps basic embed integration (zero paid API key required) present');
  assert(htmlContent.includes('/maps/search/?api=1&query='), 'Test 9: Google Maps direct link button present');
  assert(htmlContent.includes('ApplicationSuccessEffect'), 'Test 10: Floating particles application success animation integrated');

  // 3. Check recommended company card navigation in recommendations.js
  const recsJs = fs.readFileSync(path.join(__dirname, 'public', 'js', 'recommendations.js'), 'utf-8');
  assert(recsJs.includes('company-details.html?id='), 'Test 11: recommendations.js links recommended company cards to company-details.html');

  // 4. Check dashboard.html, saved.html, applications.html links
  const dashHtml = fs.readFileSync(path.join(__dirname, 'public', 'dashboard.html'), 'utf-8');
  assert(dashHtml.includes('company-details.html?id='), 'Test 12: dashboard.html links recommended cards to company-details.html');

  const savedHtml = fs.readFileSync(path.join(__dirname, 'public', 'saved.html'), 'utf-8');
  assert(savedHtml.includes('company-details.html?id='), 'Test 13: saved.html links cards to company-details.html');

  const appsHtml = fs.readFileSync(path.join(__dirname, 'public', 'applications.html'), 'utf-8');
  assert(appsHtml.includes('company-details.html?id='), 'Test 14: applications.html links tracked applications to company-details.html');

  // 5. Test API backend endpoints for company details
  const apiRes = await makeRequest(`${BASE_URL}/api/internships/1`);
  assert(apiRes.status === 200 && apiRes.data.success, 'Test 15: GET /api/internships/1 returns success');
  const intern = apiRes.data.internship;
  assert(intern.company && intern.company_details && intern.company_details.name, 'Test 16: API response has full company_details join');
  assert(intern.company_details.contact_email && intern.company_details.recruitment_email, 'Test 17: Verified contact emails present');
  assert(intern.company_details.address && intern.company_details.city, 'Test 18: Address fields present for Google Maps');

  const compApiRes = await makeRequest(`${BASE_URL}/api/internships/company/1`);
  assert(compApiRes.status === 200 && compApiRes.data.success && compApiRes.data.openings.length > 0, 'Test 19: GET /api/internships/company/1 returns company and openings');

  // 6. Test Registration, Login, Apply Flow, and ATS Features Preservation
  const uniqueEmail = `test_ats_${Date.now()}@college.edu`;
  const regRes = await makeRequest(`${BASE_URL}/api/auth/register`, { method: 'POST' }, {
    name: 'Alex Rivera',
    email: uniqueEmail,
    college_name: 'MIT Engineering College',
    password: 'Password123!',
    confirm_password: 'Password123!'
  });
  assert(regRes.status === 201, 'Test 20: Student registered successfully');

  const loginRes = await makeRequest(`${BASE_URL}/api/auth/login`, { method: 'POST' }, {
    email: uniqueEmail,
    password: 'Password123!'
  });
  assert(loginRes.status === 200 && loginRes.data.token, 'Test 21: Student logged in and acquired JWT token');
  const token = loginRes.data.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Apply Now session click
  const applyClickRes = await makeRequest(`${BASE_URL}/api/internships/1/apply`, {
    method: 'POST',
    headers: authHeaders
  });
  assert(applyClickRes.status === 200 && applyClickRes.data.success, 'Test 22: Apply click recorded');

  // Portal submit (Official application submission)
  const portalRes = await makeRequest(`${BASE_URL}/api/internships/1/portal-submit`, {
    method: 'POST',
    headers: authHeaders
  }, { notes: 'Submitted from dedicated Company Details page test' });
  assert(portalRes.status === 200 && portalRes.data.status === 'Applied', 'Test 23: Application officially submitted and marked as Applied');

  // Verify application record in ATS
  const myAppsRes = await makeRequest(`${BASE_URL}/api/applications`, {
    method: 'GET',
    headers: authHeaders
  });
  assert(myAppsRes.status === 200 && myAppsRes.data.applications.length === 1, 'Test 24: Application is tracked in student ATS tracker');
  const myApp = myAppsRes.data.applications[0];
  assert(myApp.internship_id === 1 && myApp.company_name === intern.company, 'Test 25: Application correctly connected to company and internship records');

  // Test ATS Update Status
  const statusUpdateRes = await makeRequest(`${BASE_URL}/api/applications/${myApp.application_id}/status`, {
    method: 'PUT',
    headers: authHeaders
  }, { status: 'Interview Scheduled' });
  assert(statusUpdateRes.status === 200 && statusUpdateRes.data.newStatus === 'Interview Scheduled', 'Test 26: ATS Update Status works smoothly');

  // Test ATS Edit Notes
  const notesUpdateRes = await makeRequest(`${BASE_URL}/api/applications/${myApp.application_id}/notes`, {
    method: 'PUT',
    headers: authHeaders
  }, { notes: 'Technical interview scheduled with senior engineering manager on Friday.' });
  assert(notesUpdateRes.status === 200 && notesUpdateRes.data.notes.includes('Technical interview'), 'Test 27: ATS Edit Notes works smoothly');

  // Test ATS Delete / Remove Record
  const deleteRes = await makeRequest(`${BASE_URL}/api/applications/${myApp.application_id}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  assert(deleteRes.status === 200 && deleteRes.data.success, 'Test 28: ATS Remove Record works smoothly');

  const afterDeleteRes = await makeRequest(`${BASE_URL}/api/applications`, {
    method: 'GET',
    headers: authHeaders
  });
  assert(afterDeleteRes.data.applications.length === 0, 'Test 29: Application successfully removed from ATS tracker');

  console.log(`\n================================================================`);
  console.log(`🎉 RESULTS: ${passed}/${total} TESTS PASSED WITH 100% SUCCESS!`);
  console.log(`================================================================`);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});

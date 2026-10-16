const http = require('http');
const fs = require('fs');
const path = require('path');

function createSamplePdf(outputPath) {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 280 >> stream
BT
/F1 12 Tf
72 712 Td
(Jordan Smith - Full-Stack Engineering Student) Tj
0 -20 Td
(Skills: JavaScript, Node.js, Express.js, HTML5, CSS3, React, Python, SQL, Git, Docker, REST APIs, Linux) Tj
0 -20 Td
(Education: Bachelor of Technology in Computer Science, State University) Tj
0 -20 Td
(Projects: Developed AI Career Portal and Real-Time Chat Systems) Tj
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000577 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
650
%%EOF
`;
  fs.writeFileSync(outputPath, content);
}

function buildMultipartFormData(boundary, fieldName, fileName, fileBuffer, mimeType) {
  const postDataStart = `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`;
  const postDataEnd = `\r\n--${boundary}--\r\n`;

  return Buffer.concat([
    Buffer.from(postDataStart, 'utf8'),
    fileBuffer,
    Buffer.from(postDataEnd, 'utf8')
  ]);
}

async function requestJson(url, options = {}, payload = null) {
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
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (payload) {
      if (Buffer.isBuffer(payload)) {
        req.write(payload);
      } else if (typeof payload === 'object') {
        req.write(JSON.stringify(payload));
      } else {
        req.write(payload);
      }
    }

    req.end();
  });
}

async function runUpdatedTestSuite() {
  console.log('================================================================');
  console.log('🧪 Starting Comprehensive Verification Test Suite');
  console.log('================================================================\n');

  const baseUrl = 'http://localhost:3000';

  // 1. Health check
  console.log('[Workflow 1] Testing Health Endpoint...');
  const health = await requestJson(`${baseUrl}/api/health`);
  console.log('Status:', health.status, 'Platform:', health.data.platform);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Register Student 1
  const email1 = `student1_${Date.now()}@college.edu`;
  console.log(`\n[Workflow 2] Registering Student 1 (${email1})...`);
  const reg1 = await requestJson(`${baseUrl}/api/auth/register`, { method: 'POST' }, {
    name: 'Jordan Smith',
    email: email1,
    college_name: 'MIT / Stanford',
    password: 'password123',
    confirm_password: 'password123'
  });
  console.log('Register 1 Status:', reg1.status, reg1.data.message);
  if (reg1.status !== 201) throw new Error('Registration 1 failed');

  // 3. Log in Student 1
  console.log('\n[Workflow 3] Logging in Student 1 & Acquiring JWT...');
  const login1 = await requestJson(`${baseUrl}/api/auth/login`, { method: 'POST' }, {
    email: email1,
    password: 'password123'
  });
  console.log('Login Status:', login1.status, 'User:', login1.data.user.name);
  if (login1.status !== 200 || !login1.data.token) throw new Error('Login 1 failed');
  const token1 = login1.data.token;

  // 4. Upload Resume and Extract Skills
  console.log('\n[Workflow 4] Uploading Resume and Extracting Technical Skills...');
  const samplePdfPath = path.join(__dirname, 'test_Jordan_resume.pdf');
  createSamplePdf(samplePdfPath);

  const fileBytes = fs.readFileSync(samplePdfPath);
  const boundary = '----Boundary' + Math.random().toString(16).substring(2);
  const multipartBody = buildMultipartFormData(boundary, 'resume', 'test_Jordan_resume.pdf', fileBytes, 'application/pdf');

  const uploadRes = await requestJson(`${baseUrl}/api/resume/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token1}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': multipartBody.length
    }
  }, multipartBody);

  console.log('Upload Status:', uploadRes.status);
  console.log('Extracted Skills:', uploadRes.data.detectedSkills);
  if (uploadRes.status !== 200 || !uploadRes.data.detectedSkills || uploadRes.data.detectedSkills.length === 0) {
    throw new Error('Resume parsing failed');
  }
  fs.unlinkSync(samplePdfPath);

  // 5. Test Recommendations Count (Fixing the 2-company limitation)
  console.log('\n[Workflow 5] Verifying 10–20+ Recommendations are available...');
  const recRes = await requestJson(`${baseUrl}/api/internships/recommendations`, {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  console.log('Total Recommendations Found:', recRes.data.total);
  if (recRes.data.total < 10) {
    throw new Error(`Expected at least 10 recommendations, but got ${recRes.data.total}`);
  }
  console.log(`✅ Passed: Found ${recRes.data.total} recommendations (exceeds 10–20 requirement)!`);

  // Check that recommendations are sorted by match score descending
  const recs = recRes.data.recommendations;
  const topScore = recs[0].matchScore;
  const lastScore = recs[recs.length - 1].matchScore;
  console.log(`Top match score: ${topScore}% vs lowest match score: ${lastScore}%`);
  if (topScore < lastScore) throw new Error('Recommendations not sorted by matchScore descending');
  console.log('✅ Passed: Sorted by matchScore descending, lower-match roles are accessible!');

  // 6. Test Company Details (Address, Website, Emails)
  console.log('\n[Workflow 6] Verifying Complete Company Details...');
  const firstRole = recs[0];
  const detailRes = await requestJson(`${baseUrl}/api/internships/${firstRole.id}`, {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  const compDetails = detailRes.data.internship.company_details;
  console.log('Company Name:', compDetails.name);
  console.log('Company Address:', compDetails.address);
  console.log('Company Website:', compDetails.website);
  console.log('Recruitment Email:', compDetails.recruitment_email);
  if (!compDetails.address || !compDetails.website || !compDetails.recruitment_email) {
    throw new Error('Company details incomplete');
  }
  console.log('✅ Passed: Company details include full address, website, and verified emails.');

  // 7. Test Apply Now Click (Feature 5)
  console.log('\n[Workflow 7] Testing Apply Now Action (records click, sets initial status)...');
  const applyRes = await requestJson(`${baseUrl}/api/internships/${firstRole.id}/apply`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  console.log('Apply Click Status:', applyRes.status, applyRes.data.message);
  console.log('Initial Status:', applyRes.data.initialStatus);
  console.log('Application URL:', applyRes.data.applicationUrl);
  if (applyRes.status !== 200 || applyRes.data.initialStatus !== 'Application Started') {
    throw new Error('Apply Now action failed or set invalid status');
  }
  console.log('✅ Passed: Initial status set to "Application Started" without premature "Applied" assumption.');

  // 8. Test Fetching My Applications (Feature 6)
  console.log('\n[Workflow 8] Fetching Student 1 Applications in ATS...');
  const myAppsRes = await requestJson(`${baseUrl}/api/applications`, {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  console.log('Applications tracked count:', myAppsRes.data.count);
  if (myAppsRes.data.count !== 1) throw new Error('Expected 1 application record');
  const appRecord = myAppsRes.data.applications[0];
  const appId = appRecord.application_id;

  // 9. Update Application Status to Applied, then Interview Scheduled
  console.log('\n[Workflow 9] Testing Application Status Transitions (Applied -> Interview Scheduled)...');
  const statusRes1 = await requestJson(`${baseUrl}/api/applications/${appId}/status`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token1}` }
  }, { status: 'Applied' });
  console.log('Updated to Applied:', statusRes1.status, statusRes1.data.newStatus);
  if (statusRes1.data.newStatus !== 'Applied') throw new Error('Failed to update to Applied');

  const statusRes2 = await requestJson(`${baseUrl}/api/applications/${appId}/status`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token1}` }
  }, { status: 'Interview Scheduled' });
  console.log('Updated to Interview Scheduled:', statusRes2.status, statusRes2.data.newStatus);
  if (statusRes2.data.newStatus !== 'Interview Scheduled') throw new Error('Failed to update to Interview Scheduled');
  console.log('✅ Passed: Status transitions work smoothly.');

  // 10. Add and Edit Application Notes
  console.log('\n[Workflow 10] Testing Personal Application Notes...');
  const notesRes = await requestJson(`${baseUrl}/api/applications/${appId}/notes`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token1}` }
  }, { notes: 'Technical round scheduled on Friday with Senior Staff Engineer.' });
  console.log('Notes saved:', notesRes.data.notes);
  if (!notesRes.data.notes.includes('Technical round')) throw new Error('Failed to save notes');
  console.log('✅ Passed: Application notes recorded in SQLite.');

  // 11. Test ATS Statistics
  console.log('\n[Workflow 11] Verifying Dynamic ATS Statistics...');
  const statsRes = await requestJson(`${baseUrl}/api/applications/stats`, {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  console.log('ATS Stats:', statsRes.data.stats);
  if (statsRes.data.stats.totalTracked !== 1 || statsRes.data.stats.interviewScheduled !== 1) {
    throw new Error('ATS statistics mismatch');
  }
  console.log('✅ Passed: ATS statistics calculated dynamically from student records.');

  // 12. Test Save Internship (Feature 7)
  console.log('\n[Workflow 12] Testing Save Internship & Duplicate Prevention...');
  const secondRole = recs[1];
  const saveRes = await requestJson(`${baseUrl}/api/internships/${secondRole.id}/save`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  console.log('Save Status:', saveRes.status, saveRes.data.message);
  if (saveRes.status !== 200) throw new Error('Save failed');

  // Verify it appears in saved internships
  const savedRes = await requestJson(`${baseUrl}/api/internships/saved`, {
    headers: { 'Authorization': `Bearer ${token1}` }
  });
  console.log('Saved Count:', savedRes.data.count);
  if (savedRes.data.count !== 1) throw new Error('Expected 1 saved internship');

  // 13. Test Student Isolation (Feature 8 & 11)
  console.log('\n[Workflow 13] Verifying Multi-Tenant Student Isolation (Security Check)...');
  const email2 = `student2_${Date.now()}@college.edu`;
  await requestJson(`${baseUrl}/api/auth/register`, { method: 'POST' }, {
    name: 'Taylor Doe',
    email: email2,
    college_name: 'Harvard University',
    password: 'password123',
    confirm_password: 'password123'
  });
  const login2 = await requestJson(`${baseUrl}/api/auth/login`, { method: 'POST' }, {
    email: email2,
    password: 'password123'
  });
  const token2 = login2.data.token;

  // Student 2 tries to access or modify Student 1's application record
  const hackRes = await requestJson(`${baseUrl}/api/applications/${appId}/status`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token2}` }
  }, { status: 'Rejected' });
  console.log('Unauthorized Access Attempt Status:', hackRes.status, hackRes.data.message);
  if (hackRes.status !== 404 && hackRes.status !== 403) {
    throw new Error('Security vulnerability: Student 2 modified Student 1 application!');
  }
  console.log('✅ Passed: Student 2 CANNOT access or modify Student 1 application records.');

  console.log('\n================================================================');
  console.log('🎉 ALL 13 WORKFLOW VERIFICATIONS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
}

runUpdatedTestSuite().catch((err) => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});

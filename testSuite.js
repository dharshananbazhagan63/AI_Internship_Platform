const http = require('http');
const fs = require('fs');
const path = require('path');

// Generate sample PDF file with realistic resume text for automated test
function createSamplePdf(outputPath) {
  const content = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 280 >> stream
BT
/F1 12 Tf
72 712 Td
(Alex Johnson - Software Engineering Student) Tj
0 -20 Td
(Skills: JavaScript, Node.js, Express.js, HTML5, CSS3, React, Python, SQL, Git, Docker, REST APIs) Tj
0 -20 Td
(Education: Bachelor of Technology in Computer Science, Stanford University) Tj
0 -20 Td
(Projects: Built scalable REST API portal and web applications using Node and SQLite) Tj
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

// Minimal multipart form builder for resume upload test
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

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 Starting Automated End-to-End Test Suite');
  console.log('================================================================');

  const baseUrl = 'http://localhost:3000';

  // 1. Health check
  console.log('\n[1] Testing Health Endpoint...');
  const health = await requestJson(`${baseUrl}/api/health`);
  console.log('Status:', health.status, 'Data:', health.data);
  if (health.status !== 200) throw new Error('Health check failed');

  // 2. Register Student
  const testEmail = `test_${Date.now()}@college.edu`;
  console.log(`\n[2] Testing Registration with ${testEmail}...`);
  const regRes = await requestJson(`${baseUrl}/api/auth/register`, { method: 'POST' }, {
    name: 'Alex Johnson',
    email: testEmail,
    college_name: 'Stanford University',
    password: 'password123',
    confirm_password: 'password123'
  });
  console.log('Register Result:', regRes.status, regRes.data);
  if (regRes.status !== 201) throw new Error('Registration failed: ' + JSON.stringify(regRes.data));

  // 3. Duplicate Registration Check
  console.log('\n[3] Testing Duplicate Registration Prevention...');
  const dupRes = await requestJson(`${baseUrl}/api/auth/register`, { method: 'POST' }, {
    name: 'Alex Johnson',
    email: testEmail,
    college_name: 'Stanford University',
    password: 'password123',
    confirm_password: 'password123'
  });
  console.log('Duplicate Result:', dupRes.status, dupRes.data.message);
  if (dupRes.status !== 409) throw new Error('Duplicate email check failed');

  // 4. Login
  console.log('\n[4] Testing Login & JWT Token Generation...');
  const loginRes = await requestJson(`${baseUrl}/api/auth/login`, { method: 'POST' }, {
    email: testEmail,
    password: 'password123'
  });
  console.log('Login Status:', loginRes.status, 'User:', loginRes.data.user);
  if (loginRes.status !== 200 || !loginRes.data.token) throw new Error('Login failed');
  const token = loginRes.data.token;

  // 5. Protected Endpoint /api/auth/me
  console.log('\n[5] Testing Protected /api/auth/me...');
  const meRes = await requestJson(`${baseUrl}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Me Status:', meRes.status, 'Profile Name:', meRes.data.user.name);
  if (meRes.status !== 200) throw new Error('Get me failed');

  // 6. Resume Upload and Skill Extraction
  console.log('\n[6] Testing Resume Upload & Skill Extraction...');
  const samplePdfPath = path.join(__dirname, 'test_resume.pdf');
  createSamplePdf(samplePdfPath);

  const fileBytes = fs.readFileSync(samplePdfPath);
  const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
  const multipartBody = buildMultipartFormData(boundary, 'resume', 'test_resume.pdf', fileBytes, 'application/pdf');

  const uploadRes = await requestJson(`${baseUrl}/api/resume/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': multipartBody.length
    }
  }, multipartBody);

  console.log('Upload Status:', uploadRes.status);
  console.log('Detected Skills:', uploadRes.data.detectedSkills);
  console.log('Extracted Education:', uploadRes.data.education);
  console.log('Extracted Projects:', uploadRes.data.projects);
  if (uploadRes.status !== 200 || !uploadRes.data.detectedSkills || uploadRes.data.detectedSkills.length === 0) {
    throw new Error('Resume parsing failed');
  }

  // Clean up test PDF
  fs.unlinkSync(samplePdfPath);

  // 7. Recommendations
  console.log('\n[7] Testing Recommendations with Real-Time Skill Matching...');
  const recRes = await requestJson(`${baseUrl}/api/internships/recommendations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Recommendations Count:', recRes.data.total);
  if (recRes.data.recommendations && recRes.data.recommendations.length > 0) {
    const top = recRes.data.recommendations[0];
    console.log(`Top Recommended: "${top.title}" at ${top.company} -> Match Score: ${top.matchScore}%`);
    console.log('Matching Skills:', top.matchingSkills);
    console.log('Missing Skills:', top.missingSkills);
    console.log('Suggested to Learn:', top.suggestedSkills);
  }

  // 8. Demo Apply Action
  console.log('\n[8] Testing Demo Application Submission...');
  const firstInternshipId = recRes.data.recommendations[0].id;
  const applyRes = await requestJson(`${baseUrl}/api/internships/${firstInternshipId}/apply`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Apply Status:', applyRes.status, applyRes.data.message);
  if (applyRes.status !== 200) throw new Error('Apply failed');

  // Verify applications list
  const appsRes = await requestJson(`${baseUrl}/api/internships/applications`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('Student Applications List Count:', appsRes.data.applications.length);

  // 9. Profile Update
  console.log('\n[9] Testing Profile Update & Skill Modification...');
  const updateRes = await requestJson(`${baseUrl}/api/profile`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  }, {
    phone: '+1 (555) 123-4567',
    degree: 'B.Tech Computer Science',
    grad_year: '2026',
    bio: 'Aspiring Full-Stack Software Engineer with focus on Node.js and AI.',
    skills: [...uploadRes.data.detectedSkills, 'TypeScript', 'Next.js']
  });
  console.log('Profile Update Status:', updateRes.status, updateRes.data.message);
  if (updateRes.status !== 200) throw new Error('Profile update failed');

  console.log('\n================================================================');
  console.log('✅ ALL TESTS PASSED SUCCESSFULLY! 100% OPERATIONAL');
  console.log('================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});

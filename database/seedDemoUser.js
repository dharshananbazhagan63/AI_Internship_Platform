const db = require('./db');
const bcrypt = require('bcryptjs');

async function seedDemoUsers() {
  console.log('[*] Seeding/Updating demo user accounts...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Password123!', salt);

  const defaultSkills = JSON.stringify([
    "JavaScript", "Python", "SQL", "HTML5", "CSS3", 
    "Node.js", "Express.js", "React", "Docker", "Git", "Linux", "REST APIs"
  ]);

  // 1. Ensure demo@college.edu
  let demoUser = await db.get("SELECT id FROM users WHERE email = 'demo@college.edu'");
  if (!demoUser) {
    const res = await db.run(
      "INSERT INTO users (name, email, college_name, password) VALUES (?, ?, ?, ?)",
      ['Demo Student', 'demo@college.edu', 'State Engineering College', hashedPassword]
    );
    demoUser = { id: res.id };
    console.log('[+] Created demo@college.edu with ID:', res.id);
  } else {
    await db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, demoUser.id]);
    console.log('[+] Updated password for demo@college.edu');
  }

  // Update profile for demoUser
  await db.run(
    `INSERT INTO student_profiles (user_id, degree, grad_year, bio, skills, phone)
     VALUES (?, 'B.Tech Computer Science', '2026', 'Full-stack engineering student interested in AI and web development', ?, '+1 555-019-2834')
     ON CONFLICT(user_id) DO UPDATE SET skills = excluded.skills`,
    [demoUser.id, defaultSkills]
  );

  // 2. Ensure dharshan@gmail.com
  let dharshanUser = await db.get("SELECT id FROM users WHERE email = 'dharshan@gmail.com'");
  if (!dharshanUser) {
    const res2 = await db.run(
      "INSERT INTO users (name, email, college_name, password) VALUES (?, ?, ?, ?)",
      ['Dharshan', 'dharshan@gmail.com', 'SIET', hashedPassword]
    );
    dharshanUser = { id: res2.id };
    console.log('[+] Created dharshan@gmail.com with ID:', res2.id);
  } else {
    await db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, dharshanUser.id]);
    console.log('[+] Updated password for dharshan@gmail.com');
  }

  // Update profile for dharshanUser
  await db.run(
    `INSERT INTO student_profiles (user_id, degree, grad_year, bio, skills, phone)
     VALUES (?, 'B.Tech Information Technology', '2026', 'Engineering student passionate about AI internships', ?, '+91 98765 43210')
     ON CONFLICT(user_id) DO UPDATE SET skills = excluded.skills`,
    [dharshanUser.id, defaultSkills]
  );

  console.log('[✓] Successfully configured accounts with Password123!');
}

if (require.main === module) {
  seedDemoUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[-] Error seeding demo users:', err);
      process.exit(1);
    });
}

module.exports = seedDemoUsers;

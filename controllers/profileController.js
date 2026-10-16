const bcrypt = require('bcryptjs');
const db = require('../database/db');

class ProfileController {
  /**
   * Get student profile
   */
  static async getProfile(req, res) {
    try {
      const user = await db.get(
        'SELECT id, name, email, college_name, created_at FROM users WHERE id = ?',
        [req.user.id]
      );

      if (!user) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }

      const profile = await db.get(
        'SELECT * FROM student_profiles WHERE user_id = ?',
        [req.user.id]
      );

      let skills = [];
      if (profile && profile.skills) {
        try {
          skills = JSON.parse(profile.skills);
        } catch (e) {
          skills = [];
        }
      }

      return res.status(200).json({
        success: true,
        user,
        profile: {
          phone: profile?.phone || '',
          degree: profile?.degree || '',
          grad_year: profile?.grad_year || '',
          bio: profile?.bio || '',
          skills: skills,
          github_url: profile?.github_url || '',
          linkedin_url: profile?.linkedin_url || ''
        }
      });
    } catch (err) {
      console.error('[-] Error fetching profile:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch student profile.' });
    }
  }

  /**
   * Update student profile information
   */
  static async updateProfile(req, res) {
    try {
      const { name, college_name, phone, degree, grad_year, bio, skills, github_url, linkedin_url } = req.body;

      // Update name and college in users table
      if (name || college_name) {
        await db.run(
          `UPDATE users SET name = COALESCE(?, name), college_name = COALESCE(?, college_name) WHERE id = ?`,
          [name ? name.trim() : null, college_name ? college_name.trim() : null, req.user.id]
        );
      }

      // Format skills as JSON array
      let skillsJson = '[]';
      if (Array.isArray(skills)) {
        skillsJson = JSON.stringify(skills.map((s) => String(s).trim()).filter(Boolean));
      } else if (typeof skills === 'string') {
        try {
          const parsed = JSON.parse(skills);
          skillsJson = JSON.stringify(Array.isArray(parsed) ? parsed : [skills]);
        } catch (e) {
          skillsJson = JSON.stringify(skills.split(',').map((s) => s.trim()).filter(Boolean));
        }
      }

      // Upsert profile
      await db.run(
        `INSERT INTO student_profiles (user_id, phone, degree, grad_year, bio, skills, github_url, linkedin_url, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           phone = excluded.phone,
           degree = excluded.degree,
           grad_year = excluded.grad_year,
           bio = excluded.bio,
           skills = excluded.skills,
           github_url = excluded.github_url,
           linkedin_url = excluded.linkedin_url,
           updated_at = CURRENT_TIMESTAMP`,
        [
          req.user.id,
          phone || '',
          degree || '',
          grad_year || '',
          bio || '',
          skillsJson,
          github_url || '',
          linkedin_url || ''
        ]
      );

      return res.status(200).json({
        success: true,
        message: 'Student profile updated successfully!'
      });
    } catch (err) {
      console.error('[-] Error updating profile:', err);
      return res.status(500).json({ success: false, message: 'Failed to update student profile.' });
    }
  }

  /**
   * Change student password
   */
  static async changePassword(req, res) {
    try {
      const { current_password, new_password, confirm_password } = req.body;

      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({ success: false, message: 'All password fields are required.' });
      }

      if (new_password.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({ success: false, message: 'New passwords do not match.' });
      }

      const user = await db.get('SELECT password FROM users WHERE id = ?', [req.user.id]);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const hashedPassword = await bcrypt.hash(new_password, 10);
      await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

      return res.status(200).json({
        success: true,
        message: 'Password changed successfully!'
      });
    } catch (err) {
      console.error('[-] Password change error:', err);
      return res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
  }
}

module.exports = ProfileController;

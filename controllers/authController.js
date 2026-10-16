const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'college_ai_internship_secret_key_2026';

class AuthController {
  /**
   * Register a new student account
   */
  static async register(req, res) {
    try {
      const { name, email, college_name, password, confirm_password } = req.body;

      // 1. Validate required fields
      if (!name || !email || !college_name || !password || !confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required. Please fill in your name, email, college name, and password.'
        });
      }

      // 2. Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address (e.g., student@college.edu).'
        });
      }

      // 3. Password length and match verification
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long for security.'
        });
      }

      if (password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match. Please ensure both passwords match.'
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // 4. Duplicate email check
      const existingUser = await db.get('SELECT id FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please log in instead.'
        });
      }

      // 5. Hash password with bcryptjs
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 6. Insert new user into SQLite
      const insertResult = await db.run(
        `INSERT INTO users (name, email, college_name, password) VALUES (?, ?, ?, ?)`,
        [name.trim(), normalizedEmail, college_name.trim(), hashedPassword]
      );

      const userId = insertResult.id;

      // 7. Initialize associated student profile
      await db.run(
        `INSERT INTO student_profiles (user_id, skills) VALUES (?, ?)`,
        [userId, JSON.stringify([])]
      );

      return res.status(201).json({
        success: true,
        message: 'Account created successfully! Redirecting to login page...'
      });
    } catch (err) {
      console.error('[-] Registration error:', err);
      return res.status(500).json({
        success: false,
        message: 'A server error occurred during registration. Please try again.'
      });
    }
  }

  /**
   * Log in an existing student
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both your registered email and password.'
        });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Find user
      const user = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password. Please verify your credentials.'
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password. Please verify your credentials.'
        });
      }

      // Generate JWT
      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        college_name: user.college_name
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        success: true,
        message: 'Authentication successful. Welcome back!',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          college_name: user.college_name
        }
      });
    } catch (err) {
      console.error('[-] Login error:', err);
      return res.status(500).json({
        success: false,
        message: 'A server error occurred during login. Please try again.'
      });
    }
  }

  /**
   * Get current authenticated user details
   */
  static async getMe(req, res) {
    try {
      const user = await db.get(
        'SELECT id, name, email, college_name, created_at FROM users WHERE id = ?',
        [req.user.id]
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found.'
        });
      }

      const profile = await db.get(
        'SELECT * FROM student_profiles WHERE user_id = ?',
        [req.user.id]
      );

      const resume = await db.get(
        'SELECT id, filename, original_name, uploaded_at, detected_skills FROM resumes WHERE user_id = ? ORDER BY id DESC LIMIT 1',
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
          ...profile,
          skills
        },
        hasResume: !!resume,
        latestResume: resume ? {
          ...resume,
          detected_skills: JSON.parse(resume.detected_skills || '[]')
        } : null
      });
    } catch (err) {
      console.error('[-] GetMe error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching account information.'
      });
    }
  }

  /**
   * Logout (client deletes token; server provides clean status)
   */
  static async logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  }
}

module.exports = AuthController;

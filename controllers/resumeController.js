const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const ResumeParserService = require('../services/resumeParserService');
const RecommendationService = require('../services/recommendationService');

class ResumeController {
  /**
   * Upload and analyze a student's resume
   */
  static async uploadAndAnalyze(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No resume file uploaded. Please upload a PDF or DOCX file.'
        });
      }

      const { filename, originalname, path: filePath, size, mimetype } = req.file;

      // Parse resume contents
      const parsedData = await ResumeParserService.parseResume(filePath, mimetype, originalname);

      // Save resume record in SQLite
      const insertResult = await db.run(
        `INSERT INTO resumes (user_id, filename, original_name, file_path, file_size, file_type, extracted_text, detected_skills, education, projects, experience)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
          filename,
          originalname,
          filePath,
          size,
          mimetype,
          parsedData.rawText,
          JSON.stringify(parsedData.skills),
          JSON.stringify(parsedData.education),
          JSON.stringify(parsedData.projects),
          JSON.stringify(parsedData.experience)
        ]
      );

      // Sync and merge detected skills with student's profile
      const profile = await db.get(
        'SELECT skills FROM student_profiles WHERE user_id = ?',
        [req.user.id]
      );

      let existingSkills = [];
      if (profile && profile.skills) {
        try {
          existingSkills = JSON.parse(profile.skills);
        } catch (e) {
          existingSkills = [];
        }
      }

      const mergedSkills = Array.from(new Set([...existingSkills, ...parsedData.skills]));

      await db.run(
        `INSERT INTO student_profiles (user_id, skills, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           skills = excluded.skills,
           updated_at = CURRENT_TIMESTAMP`,
        [req.user.id, JSON.stringify(mergedSkills)]
      );

      // Recalculate recommendations
      const recData = await RecommendationService.getRecommendationsForUser(req.user.id);

      return res.status(200).json({
        success: true,
        message: 'Resume uploaded and analyzed successfully!',
        resumeId: insertResult.id,
        filename: originalname,
        extractedTextPreview: parsedData.rawText.slice(0, 1500) + (parsedData.rawText.length > 1500 ? '...' : ''),
        detectedSkills: parsedData.skills,
        allUserSkills: mergedSkills,
        education: parsedData.education,
        projects: parsedData.projects,
        experience: parsedData.experience,
        totalRecommendations: recData.recommendations.length,
        topRecommendations: recData.recommendations.slice(0, 3)
      });
    } catch (err) {
      console.error('[-] Resume parsing error:', err);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while parsing the resume: ' + (err.message || 'Unknown error')
      });
    }
  }

  /**
   * Get student's current resume and parsed info
   */
  static async getMyResume(req, res) {
    try {
      const resume = await db.get(
        'SELECT * FROM resumes WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [req.user.id]
      );

      if (!resume) {
        return res.status(200).json({
          success: true,
          hasResume: false,
          resume: null
        });
      }

      return res.status(200).json({
        success: true,
        hasResume: true,
        resume: {
          id: resume.id,
          original_name: resume.original_name,
          file_size: resume.file_size,
          file_type: resume.file_type,
          uploaded_at: resume.uploaded_at,
          extracted_text_preview: (resume.extracted_text || '').slice(0, 1200),
          detected_skills: JSON.parse(resume.detected_skills || '[]'),
          education: JSON.parse(resume.education || '[]'),
          projects: JSON.parse(resume.projects || '[]'),
          experience: JSON.parse(resume.experience || '[]')
        }
      });
    } catch (err) {
      console.error('[-] Error fetching resume:', err);
      return res.status(500).json({ success: false, message: 'Failed to retrieve resume details.' });
    }
  }

  /**
   * Delete uploaded resume
   */
  static async deleteResume(req, res) {
    try {
      const resume = await db.get(
        'SELECT * FROM resumes WHERE user_id = ? ORDER BY id DESC LIMIT 1',
        [req.user.id]
      );

      if (!resume) {
        return res.status(404).json({ success: false, message: 'No resume found to delete.' });
      }

      // Remove physical file safely if exists
      if (resume.file_path && fs.existsSync(resume.file_path)) {
        try {
          fs.unlinkSync(resume.file_path);
        } catch (e) {
          console.warn('[-] Could not unlink file:', e.message);
        }
      }

      // Delete database record
      await db.run('DELETE FROM resumes WHERE id = ?', [resume.id]);

      return res.status(200).json({
        success: true,
        message: 'Resume deleted successfully. You can now upload a new resume.'
      });
    } catch (err) {
      console.error('[-] Error deleting resume:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete resume.' });
    }
  }
}

module.exports = ResumeController;

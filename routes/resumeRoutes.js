const express = require('express');
const router = express.Router();
const ResumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Upload and analyze resume with graceful error handling
router.post(
  '/upload',
  authMiddleware,
  (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds maximum 5MB limit. Please upload a smaller file.'
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Error processing uploaded file. Supported formats: PDF, DOCX, TXT.'
        });
      }
      next();
    });
  },
  ResumeController.uploadAndAnalyze
);

// Fetch current uploaded resume
router.get('/my-resume', authMiddleware, ResumeController.getMyResume);

// Delete resume
router.delete('/delete', authMiddleware, ResumeController.deleteResume);

module.exports = router;

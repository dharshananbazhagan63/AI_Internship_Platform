const express = require('express');
const router = express.Router();
const ResumeController = require('../controllers/resumeController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Upload and analyze resume
router.post('/upload', authMiddleware, upload.single('resume'), ResumeController.uploadAndAnalyze);

// Fetch current uploaded resume
router.get('/my-resume', authMiddleware, ResumeController.getMyResume);

// Delete resume
router.delete('/delete', authMiddleware, ResumeController.deleteResume);

module.exports = router;

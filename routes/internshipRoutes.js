const express = require('express');
const router = express.Router();
const InternshipController = require('../controllers/internshipController');
const authMiddleware = require('../middleware/authMiddleware');

// Platform statistics
router.get('/stats', InternshipController.getStats);

// Recommendations for logged-in student (Feature 1 & 2)
router.get('/recommendations', authMiddleware, InternshipController.getRecommendations);

// Saved internships (Feature 7)
router.get('/saved', authMiddleware, InternshipController.getSavedInternships);
router.post('/:id/save', authMiddleware, InternshipController.saveInternship);
router.delete('/:id/save', authMiddleware, InternshipController.unsaveInternship);

// Apply Now click (Feature 5)
router.post('/:id/apply', authMiddleware, InternshipController.applyClick);

// Administrative record import (Feature 9)
router.post('/import', authMiddleware, InternshipController.importRecords);

// Demonstration Company Profile & Openings
router.get('/company/:companyId', InternshipController.getCompanyById);

// Demonstration Career Portal Application Submission
router.post('/:id/portal-submit', authMiddleware, InternshipController.portalSubmit);

// Single internship details with complete company details (Feature 3)
router.get('/:id', InternshipController.getInternshipById);

// Search and list all internships (Feature 1)
router.get('/', InternshipController.getAllInternships);

module.exports = router;

const express = require('express');
const router = express.Router();
const ApplicationController = require('../controllers/applicationController');
const authMiddleware = require('../middleware/authMiddleware');

// Get summary statistics for student dashboard
router.get('/stats', authMiddleware, ApplicationController.getStats);

// Update status of an application
router.put('/:id/status', authMiddleware, ApplicationController.updateStatus);

// Update personal notes of an application
router.put('/:id/notes', authMiddleware, ApplicationController.updateNotes);

// Delete an application tracking record
router.delete('/:id', authMiddleware, ApplicationController.deleteApplication);

// Get all applications with search and filters
router.get('/', authMiddleware, ApplicationController.getMyApplications);

module.exports = router;

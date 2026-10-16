const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, ProfileController.getProfile);
router.put('/', authMiddleware, ProfileController.updateProfile);
router.post('/change-password', authMiddleware, ProfileController.changePassword);

module.exports = router;

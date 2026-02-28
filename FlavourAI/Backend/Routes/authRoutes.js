const express = require('express');
const router = express.Router();
const { signup, login, getCurrentUser } = require('../Controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getCurrentUser);

module.exports = router;

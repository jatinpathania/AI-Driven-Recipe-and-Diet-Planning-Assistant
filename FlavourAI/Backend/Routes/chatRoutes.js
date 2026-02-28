const express = require('express');
const router = express.Router();
const { sendMessage, generateRecipe } = require('../Controllers/chatController');

// Routes
router.post('/', sendMessage);
router.post('/generate-recipe', generateRecipe);

module.exports = router;

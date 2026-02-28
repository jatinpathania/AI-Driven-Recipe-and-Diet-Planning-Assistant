const express = require('express');
const router = express.Router();
const upload = require('../Config/multer'); 
const { protect } = require('../middleware/authMiddleware');
const { 
    createRecipe, 
    getUserRecipes, 
    getRecipeById, 
    deleteRecipe,
    uploadRecipeImage 
} = require('../Controllers/recipeController');

// Protected routes - require authentication
router.post('/', protect, upload.single('recipeImage'), createRecipe);
router.get('/', protect, getUserRecipes);
router.get('/:id', protect, getRecipeById);
router.delete('/:id', protect, deleteRecipe);
router.post('/upload', protect, upload.single('recipeImage'), uploadRecipeImage);

module.exports = router;
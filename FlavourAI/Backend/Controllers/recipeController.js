const Recipe = require('../Model/RecipeModel');
const User = require('../Model/UserModel');
const { uploadToCloudinary } = require('../Config/cloudinary');

// @desc    Create a new recipe
// @route   POST /api/recipes
// @access  Private
const createRecipe = async (req, res) => {
    try {
        const { recipeName, description, ingredients, instructions, nutritionSummary, originalPrompt } = req.body;

        if (!recipeName || !ingredients || !instructions) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide recipe name, ingredients, and instructions' 
            });
        }

        let imageUrl = '';
        let imageId = '';

        // Handle image upload if file is provided
        if (req.file) {
            const uploadResult = await uploadToCloudinary(req.file, {
                folder: `flavour_ai/recipes/${req.user._id}`
            });
            imageUrl = uploadResult.url;
            imageId = uploadResult.public_id;
        }

        const recipe = await Recipe.create({
            recipeName,
            description,
            ingredients: Array.isArray(ingredients) ? ingredients : [ingredients],
            instructions: Array.isArray(instructions) ? instructions : [instructions],
            nutritionSummary,
            originalPrompt,
            userId: req.user._id,
            imageUrl,
            imageId
        });

        // Update user's total recipes count
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { totalRecipes: 1 }
        });

        res.status(201).json({
            success: true,
            message: 'Recipe created successfully',
            data: recipe
        });
    } catch (error) {
        console.error('Create recipe error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error creating recipe',
            error: error.message 
        });
    }
};

// @desc    Get all recipes for user
// @route   GET /api/recipes
// @access  Private
const getUserRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({ userId: req.user._id }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: recipes.length,
            data: recipes
        });
    } catch (error) {
        console.error('Get recipes error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching recipes',
            error: error.message 
        });
    }
};

// @desc    Get single recipe
// @route   GET /api/recipes/:id
// @access  Private
const getRecipeById = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recipe not found' 
            });
        }

        res.status(200).json({
            success: true,
            data: recipe
        });
    } catch (error) {
        console.error('Get recipe error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error fetching recipe',
            error: error.message 
        });
    }
};

// @desc    Delete recipe
// @route   DELETE /api/recipes/:id
// @access  Private
const deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ 
                success: false, 
                message: 'Recipe not found' 
            });
        }

        // Check if user owns the recipe
        if (recipe.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this recipe' 
            });
        }

        await recipe.deleteOne();

        // Decrement user's total recipes count
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { totalRecipes: -1 }
        });

        res.status(200).json({
            success: true,
            message: 'Recipe deleted successfully'
        });
    } catch (error) {
        console.error('Delete recipe error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error deleting recipe',
            error: error.message 
        });
    }
};

// @desc    Upload recipe image
// @route   POST /api/recipes/upload
// @access  Private
const uploadRecipeImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file provided' 
            });
        }

        const uploadResult = await uploadToCloudinary(req.file, {
            folder: `flavour_ai/recipes/${req.user._id}`
        });

        res.status(200).json({ 
            success: true, 
            message: 'Image uploaded successfully', 
            imageUrl: uploadResult.url,
            imageId: uploadResult.public_id
        });
    } catch (error) {
        console.error('Recipe upload failed:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

module.exports = { 
    createRecipe, 
    getUserRecipes, 
    getRecipeById, 
    deleteRecipe,
    uploadRecipeImage 
};

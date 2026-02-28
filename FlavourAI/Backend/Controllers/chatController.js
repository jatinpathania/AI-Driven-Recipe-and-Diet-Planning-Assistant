const { generateRecipeSuggestions, answerCookingQuestion, parseIngredientsToRecipe } = require('../Config/openrouter');
const Recipe = require('../Model/RecipeModel');

// @desc    Send chat message and get AI response
// @route   POST /api/chat
// @access  Public
const sendMessage = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Generate AI response
        const aiResponse = await generateRecipeSuggestions(message, history || []);

        // Optionally fetch recipe cards if the response mentions recipes
        // This is a simple implementation - you can enhance with NLP
        let recipeCards = [];
        if (message.toLowerCase().includes('recipe') || message.toLowerCase().includes('cook')) {
            // Fetch some popular recipes
            const recipes = await Recipe.find().limit(3).sort({ createdAt: -1 });
            recipeCards = recipes.map(r => ({
                id: r._id,
                name: r.recipeName,
                time: r.time,
                calories: r.calories,
                emoji: r.emoji,
                difficulty: r.difficulty
            }));
        }

        res.status(200).json({
            message: aiResponse.message,
            recipeCards,
            success: aiResponse.success
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate recipe from ingredients
// @route   POST /api/chat/generate-recipe
// @access  Public
const generateRecipe = async (req, res) => {
    try {
        const { ingredients, userId, guestId } = req.body;

        if (!ingredients) {
            return res.status(400).json({ message: 'Ingredients are required' });
        }

        const result = await parseIngredientsToRecipe(ingredients);

        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        // Optionally save the generated recipe
        if (userId || guestId) {
            const recipeData = {
                ...result.recipe,
                userId: userId || null,
                originalPrompt: ingredients
            };
            
            const savedRecipe = await Recipe.create(recipeData);
            return res.status(201).json({
                ...result,
                savedRecipe
            });
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    sendMessage,
    generateRecipe
};

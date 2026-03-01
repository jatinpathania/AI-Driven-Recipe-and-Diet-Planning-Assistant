const mongoose = require('mongoose');

const recipeSchema = mongoose.Schema(
    {
        recipeName: {
            type: String,
            required: [true, "Please add a recipe name"],
        },
        description: {
            type: String,
            required: false,
        },
        ingredients: {
            type: [String],
            required: [true, "Ingredients list is required"],
        },
        instructions: {
            type: [String],
            required: [true, "Instructions are required"]
        },
        nutritionSummary: {
            type: String,
            required: false
        },
        imageUrl: {
            type: String,
            default: ''
        },
        imageId: {
            type: String,
            default: ''
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: 'User'
        },
        originalPrompt: {
            type: String,
            required: false,
        },
        time: {
            type: Number, // in minutes
            required: false,
            default: 30
        },
        servings: {
            type: Number,
            required: false,
            default: 4
        },
        calories: {
            type: Number,
            required: false,
            default: 0
        },
        difficulty: {
            type: String,
            enum: ['Easy', 'Medium', 'Hard'],
            default: 'Medium'
        },
        tags: {
            type: [String],
            default: []
        },
        protein: {
            type: Number, //gms
            required: false,
            default: 0
        },
        carbs: {
            type: Number, //gms
            required: false,
            default: 0
        },
        fat: {
            type: Number, //gms
            required: false,
            default: 0
        },
        emoji: {
            type: String,
            default: '🍽️'
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Recipe', recipeSchema);

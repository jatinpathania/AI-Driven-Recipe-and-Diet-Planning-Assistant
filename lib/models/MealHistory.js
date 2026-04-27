const mongoose = require('mongoose');

const mealHistorySchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        recipeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe'
        },
        recipeName: String,
        calories: Number,
        protein: Number,
        carbs: Number,
        fats: Number,
        servings: {
            type: Number,
            default: 1
        },
        cookingTime: Number,
        difficulty: String,
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        notes: String,
        mediaUrls: [{
            type: String,
            default: []
        }],
        cookedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.models.MealHistory || mongoose.model('MealHistory', mealHistorySchema);

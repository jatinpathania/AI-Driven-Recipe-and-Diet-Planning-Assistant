const mongoose = require('mongoose');

const favoriteRecipeSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        recipeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        notes: {
            type: String,
            default: ''
        },
        savedAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamps: true }
);

module.exports = mongoose.models.FavoriteRecipe || mongoose.model('FavoriteRecipe', favoriteRecipeSchema);

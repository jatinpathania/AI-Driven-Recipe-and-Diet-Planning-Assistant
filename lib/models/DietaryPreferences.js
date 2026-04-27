const mongoose = require('mongoose');

const dietaryPreferencesSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true
        },
        dietary: [{
            type: String,
            enum: ['vegetarian', 'vegan', 'keto', 'gluten-free', 'halal', 'kosher', 'dairy-free', 'nut-free'],
            default: []
        }],
        allergies: [{
            type: String,
            default: []
        }],
        dislikedIngredients: [{
            type: String,
            default: []
        }],
        cuisinePreferences: [{
            type: String,
            default: []
        }],
        calorieTarget: {
            type: Number,
            default: 2000
        },
        mealFrequency: {
            type: Number,
            default: 3,
            min: 1,
            max: 6
        }
    },
    { timestamps: true }
);

module.exports = mongoose.models.DietaryPreferences || mongoose.model('DietaryPreferences', dietaryPreferencesSchema);

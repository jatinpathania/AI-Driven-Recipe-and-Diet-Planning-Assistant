const mongoose = require('mongoose');

const weeklyMealPlanSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        meals: [{
            day: {
                type: String,
                enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                required: true
            },
            breakfast: {
                recipeId: mongoose.Schema.Types.ObjectId,
                recipeName: String,
                calories: Number
            },
            lunch: {
                recipeId: mongoose.Schema.Types.ObjectId,
                recipeName: String,
                calories: Number
            },
            dinner: {
                recipeId: mongoose.Schema.Types.ObjectId,
                recipeName: String,
                calories: Number
            },
            snacks: {
                recipeId: mongoose.Schema.Types.ObjectId,
                recipeName: String,
                calories: Number
            }
        }],
        totalCalories: Number,
        dietary: [String],
        generatedBy: {
            type: String,
            enum: ['ai', 'manual'],
            default: 'ai'
        },
        aiPrompt: String,
        personalized: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

module.exports = mongoose.models.WeeklyMealPlan || mongoose.model('WeeklyMealPlan', weeklyMealPlanSchema);

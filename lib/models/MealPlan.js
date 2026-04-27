const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        required: true
    },
    mealType: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner'],
        required: true
    },
    recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
        required: false
    },
    recipeName: {
        type: String,
        required: false
    },
    calories: {
        type: Number,
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    notes: {
        type: String,
        default: ''
    }
});

const mealPlanSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        guestId: {
            type: String,
            required: false
        },
        weekOf: {
            type: Date,
            required: true
        },
        meals: [mealSchema]
    },
    {
        timestamps: true
    }
);

mealPlanSchema.index({ userId: 1, weekOf: 1 });
mealPlanSchema.index({ guestId: 1, weekOf: 1 });

module.exports = mongoose.models.MealPlan || mongoose.model('MealPlan', mealPlanSchema);
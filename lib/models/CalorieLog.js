const mongoose = require('mongoose');

const foodEntrySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    calories: {
        type: Number,
        required: true
    },
    carbs: {
        type: Number,
        default: 0
    },
    protein: {
        type: Number,
        default: 0
    },
    fat: {
        type: Number,
        default: 0
    },
    meal: {
        type: String,
        enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
        required: true
    },
    time: {
        type: String, // Format: "HH:MM"
        required: true
    },
    emoji: {
        type: String,
        default: '🍽️'
    }
});

const calorieLogSchema = new mongoose.Schema(
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
        date: {
            type: Date,
            required: true
        },
        foods: [foodEntrySchema],
        dailyGoal: {
            type: Number,
            default: 2000
        },
        totalCalories: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

calorieLogSchema.pre('save', function(next) {
    this.totalCalories = this.foods.reduce((sum, food) => sum + food.calories, 0);
    next();
});

calorieLogSchema.index({ userId: 1, date: 1 });
calorieLogSchema.index({ guestId: 1, date: 1 });

module.exports = mongoose.models.CalorieLog || mongoose.model('CalorieLog', calorieLogSchema);
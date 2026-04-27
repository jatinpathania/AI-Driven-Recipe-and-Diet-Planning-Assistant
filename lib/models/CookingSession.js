const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
    stepNumber: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // in seconds
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date,
        default: null
    }
});

const cookingSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false // Optional for guest users
        },
        guestId: {
            type: String,
            required: false // UUID for guest users
        },
        recipeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe',
            required: true
        },
        steps: [stepSchema],
        totalDuration: {
            type: Number,//sec
            default: 0
        },
        remainingTime: {
            type: Number,//secc
            default: 0
        },
        status: {
            type: String,
            enum: ['not_started', 'in_progress', 'paused', 'completed'],
            default: 'not_started'
        },
        startedAt: {
            type: Date,
            default: null
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

cookingSessionSchema.index({ userId: 1, status: 1 });
cookingSessionSchema.index({ guestId: 1, status: 1 });

module.exports = mongoose.models.CookingSession || mongoose.model('CookingSession', cookingSessionSchema);
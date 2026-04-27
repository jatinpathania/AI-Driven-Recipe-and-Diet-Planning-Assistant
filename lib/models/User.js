const mongoose = require('mongoose');
const userSchema = mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        fullName: {
            type: String,
            default: ''
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        password: {
            type: String,
            default: null
        },
        authMethods: [{
            type: String,
            enum: ['email', 'google']
        }],
        profileImage: {
            type: String,
            default: ''
        },
        age: {
            type: Number,
            default: null
        },
        bio: {
            type: String,
            default: ''
        },
        moodChoice: {
            type: String,
            default: 'balanced'
        },
        personality: {
            type: String,
            default: ''
        },
        totalRecipes: {
            type: Number,
            default: 0
        },
        favoriteRecipes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe'
        }],
        cookedRecipes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe'
        }],
        topRecipeIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe'
        }],
        suggestedRecipeIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe'
        }]
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

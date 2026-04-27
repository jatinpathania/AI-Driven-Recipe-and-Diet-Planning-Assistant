const mongoose = require('mongoose');

const shoppingListSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        items: [{
            ingredient: String,
            quantity: Number,
            unit: String,
            checked: {
                type: Boolean,
                default: false
            },
            category: {
                type: String,
                enum: ['vegetables', 'fruits', 'dairy', 'meat', 'grains', 'spices', 'other'],
                default: 'other'
            }
        }],
        linkedRecipes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Recipe'
        }],
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 86400 * 7 // Auto-delete after 7 days
        }
    },
    { timestamps: true }
);

module.exports = mongoose.models.ShoppingList || mongoose.model('ShoppingList', shoppingListSchema);

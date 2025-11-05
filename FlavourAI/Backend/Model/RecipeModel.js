const mongoose= require('mongoose')

const recipeSchema= mongoose.Schema(
    {
        recipeName:{
            type: String,
            required: [true, "Please add a recipe name"],
        },
        description:{
            type: String,
            required: false,
        },
        ingredients:{
            type: [String],
            required:[ true, "Ingredients list is required"],
        },
        instructions:{
            type: [String],
            required:[ true, "Instructions are required" ]
        },
        nutritionSummary:{
            type: String,
            required: false
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: false,
            ref: 'User'
        },
        originalPrompt:{
            type: String,
            required: false,
        }
    },
    {
        timestamps: true,
    }
)
module.exports= mongoose.model('Recipe', recipeSchema);
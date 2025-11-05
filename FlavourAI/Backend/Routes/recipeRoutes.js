const express= require('express')
const {generateRecipe, saveRecipe} = require('../Controllers/recipeController')

const router= express.Router()

router.post('/generate', generateRecipe)

router.post('/save', saveRecipe)

module.exports= router;
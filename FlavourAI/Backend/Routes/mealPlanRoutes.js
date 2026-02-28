const express = require('express');
const router = express.Router();
const {
    createMealPlan,
    getMealPlan,
    updateMealPlan,
    addMeal,
    deleteMeal,
    markMealComplete
} = require('../Controllers/mealPlanController');

// Routes
router.post('/', createMealPlan);
router.get('/', getMealPlan);
router.put('/:id', updateMealPlan);
router.post('/:id/meals', addMeal);
router.delete('/:id/meals/:mealId', deleteMeal);
router.put('/:id/meals/:mealId/complete', markMealComplete);

module.exports = router;

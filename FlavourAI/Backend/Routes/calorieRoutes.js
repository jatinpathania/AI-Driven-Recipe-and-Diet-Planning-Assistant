const express = require('express');
const router = express.Router();
const {
    logFood,
    getFoodLog,
    deleteFood,
    updateGoal,
    getWeeklyStats
} = require('../Controllers/calorieController');

// Routes
router.post('/log', logFood);
router.get('/log', getFoodLog);
router.delete('/log/:logId/food/:foodId', deleteFood);
router.put('/goal', updateGoal);
router.get('/weekly', getWeeklyStats);

module.exports = router;
